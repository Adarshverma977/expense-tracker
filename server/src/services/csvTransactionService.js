const mongoose = require("mongoose");
const crypto = require("crypto");
const { parse } = require("csv-parse/sync");
const { stringify } = require("csv-stringify/sync");

const Transaction = require("../models/Transaction");
const Category = require("../models/Category");
const Wallet = require("../models/Wallet");
const AppError = require("../utils/AppError");

const {
  parseCsvAmount,
  parseCsvDate,
  normalizePaymentMethod,
  protectCsvFormula,
  validateCsvHeaders,
} = require("../utils/csvHelpers");

const { toMinorUnits, fromMinorUnits } = require("../utils/moneyUtils");

const { createLedgerEntry } = require("./ledgerService");

const MAX_IMPORT_ROWS = 1000;
const MAX_EXPORT_ROWS = 10000;

const TRANSACTION_OPTIONS = {
  readPreference: "primary",
  readConcern: { level: "snapshot" },
  writeConcern: { w: "majority" },
};

const normalizeText = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const normalizeAmount = (value) => {
  return toMinorUnits(String(value), {
    allowZero: true,
  }).toString();
};

const createDuplicateKey = (transaction) => {
  return [
    normalizeText(transaction.title),
    normalizeAmount(transaction.amount.toString()),
    transaction.type,
    String(transaction.category),
    new Date(transaction.date).getTime(),
    transaction.paymentMethod || "other",
    transaction.wallet ? String(transaction.wallet) : "",
  ].join("|");
};

const createCsvImportKey = (transaction) => {
  const fingerprint = createDuplicateKey(transaction);

  return `csv:v2:${crypto
    .createHash("sha256")
    .update(fingerprint)
    .digest("hex")}`;
};

const parseExportDate = (value, fieldName) => {
  try {
    const date = parseCsvDate(value);

    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
      throw new Error("Invalid date");
    }

    return date;
  } catch {
    throw new AppError(`Invalid ${fieldName}.`, 400);
  }
};

const buildDateFilter = (startDate, endDate) => {
  const dateFilter = {};

  if (startDate) {
    dateFilter.$gte = parseExportDate(startDate, "start date");
  }

  if (endDate) {
    const parsedEndDate = parseExportDate(endDate, "end date");
    const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(endDate);

    if (isDateOnly) {
      dateFilter.$lt = new Date(parsedEndDate.getTime() + 24 * 60 * 60 * 1000);
    } else {
      dateFilter.$lte = parsedEndDate;
    }
  }

  if (
    dateFilter.$gte &&
    ((dateFilter.$lt && dateFilter.$gte >= dateFilter.$lt) ||
      (dateFilter.$lte && dateFilter.$gte > dateFilter.$lte))
  ) {
    throw new AppError("Start date cannot be after the end date.", 400);
  }

  return dateFilter;
};

const runInTransaction = async (callback) => {
  const session = await mongoose.startSession();

  try {
    let result;

    await session.withTransaction(async () => {
      result = await callback(session);
    }, TRANSACTION_OPTIONS);

    return result;
  } finally {
    await session.endSession();
  }
};

const getErrorCode = (error) => {
  return error.code ?? error.errorResponse?.code ?? null;
};

const resolveWallet = (walletData, walletMap) => {
  const walletId = walletData.walletId;
  const walletName = walletData.wallet;
  const walletType = walletData.walletType;

  if (!walletId && (walletName || walletType)) {
    throw new Error(
      "walletId is required when wallet or walletType is provided.",
    );
  }

  if (!walletId) {
    return null;
  }

  if (!mongoose.isValidObjectId(walletId)) {
    throw new Error("Invalid wallet ID.");
  }

  const wallet = walletMap.get(walletId.toLowerCase());

  if (!wallet) {
    throw new Error("Wallet not found or not active.");
  }

  if (walletName && normalizeText(walletName) !== normalizeText(wallet.name)) {
    throw new Error("Wallet name does not match the supplied walletId.");
  }

  if (walletType && normalizeText(walletType) !== wallet.type) {
    throw new Error("Wallet type does not match the supplied walletId.");
  }

  return wallet;
};

const importTransactions = async (userId, fileBuffer) => {
  if (!fileBuffer || !Buffer.isBuffer(fileBuffer)) {
    throw new AppError("Please upload a valid CSV file.", 400);
  }

  let records;

  try {
    records = parse(fileBuffer, {
      bom: true,
      skip_empty_lines: true,
      relax_column_count: true,
      max_record_size: 10000,
      trim: true,
    });
  } catch {
    throw new AppError("Unable to parse CSV file. Check its format.", 400);
  }

  if (!records.length) {
    throw new AppError("CSV file is empty.", 400);
  }

  const headers = validateCsvHeaders(records[0]);
  const rows = records.slice(1);

  if (!rows.length) {
    throw new AppError("CSV file does not contain any transactions.", 400);
  }

  if (rows.length > MAX_IMPORT_ROWS) {
    throw new AppError(
      `CSV file cannot contain more than ${MAX_IMPORT_ROWS} transactions.`,
      400,
    );
  }

  const headerIndex = Object.fromEntries(
    headers.map((header, index) => [header, index]),
  );

  const getValue = (row, field) => {
    const index = headerIndex[field];

    return index === undefined ? "" : String(row[index] ?? "").trim();
  };

  const [categories, wallets] = await Promise.all([
    Category.find({
      isActive: true,
      $or: [{ isDefault: true }, { user: userId, isDefault: false }],
    })
      .select("_id name normalizedName type")
      .lean(),

    Wallet.find({
      user: userId,
      status: "active",
    })
      .select("_id name type")
      .lean(),
  ]);

  const categoryMap = new Map();

  categories.forEach((category) => {
    const key = `${category.type}:${category.normalizedName}`;
    categoryMap.set(key, category);
  });

  const walletMap = new Map();

  wallets.forEach((wallet) => {
    walletMap.set(wallet._id.toString().toLowerCase(), wallet);
  });

  const validRows = [];
  const rowErrors = [];
  const seenInFile = new Set();

  let firstDate = null;
  let lastDate = null;
  let duplicateCount = 0;

  for (let index = 0; index < rows.length; index += 1) {
    const rowNumber = index + 2;
    const row = rows[index];

    try {
      if (row.length !== headers.length) {
        throw new Error("Column count does not match the CSV header.");
      }

      const title = getValue(row, "title");
      const amount = parseCsvAmount(getValue(row, "amount"));
      const type = getValue(row, "type").toLowerCase();
      const categoryName = getValue(row, "category");
      const description = getValue(row, "description");
      const date = parseCsvDate(getValue(row, "date"));

      const paymentMethod = normalizePaymentMethod(
        getValue(row, "paymentmethod"),
      );

      if (title.length < 2 || title.length > 100) {
        throw new Error("Title must contain 2 to 100 characters.");
      }

      if (!["income", "expense"].includes(type)) {
        throw new Error("Type must be income or expense.");
      }

      if (description.length > 500) {
        throw new Error("Description cannot exceed 500 characters.");
      }

      if (!categoryName) {
        throw new Error("Category is required.");
      }

      const category = categoryMap.get(
        `${type}:${normalizeText(categoryName)}`,
      );

      if (!category) {
        throw new Error(
          `Category "${categoryName}" is unavailable for ${type}.`,
        );
      }

      const wallet = resolveWallet(
        {
          walletId: getValue(row, "walletid"),
          wallet: getValue(row, "wallet"),
          walletType: getValue(row, "wallettype"),
        },
        walletMap,
      );

      if (wallet?.type === "credit_card" && type === "income") {
        throw new Error(
          "Income cannot be imported directly into a credit card wallet.",
        );
      }

      const transaction = {
        user: userId,
        title,
        amount,
        type,
        category: category._id,
        description,
        date,
        paymentMethod,
        wallet: wallet?._id ?? null,
      };

      const duplicateKey = createDuplicateKey(transaction);

      if (seenInFile.has(duplicateKey)) {
        duplicateCount += 1;

        rowErrors.push({
          row: rowNumber,
          message: "Duplicate transaction inside CSV file.",
          type: "duplicate",
        });

        continue;
      }

      seenInFile.add(duplicateKey);

      validRows.push({
        rowNumber,
        transaction,
        duplicateKey,
      });

      if (!firstDate || date < firstDate) {
        firstDate = date;
      }

      if (!lastDate || date > lastDate) {
        lastDate = date;
      }
    } catch (error) {
      rowErrors.push({
        row: rowNumber,
        message: error.message,
        type: "validation",
      });
    }
  }

  if (!validRows.length) {
    return {
      summary: {
        totalRows: rows.length,
        imported: 0,
        skipped: rowErrors.length,
        duplicates: duplicateCount,
        failed: rowErrors.length - duplicateCount,
        databaseFailures: 0,
      },
      errors: rowErrors,
    };
  }

  const existingTransactions = await Transaction.find({
    user: userId,
    date: {
      $gte: firstDate,
      $lte: lastDate,
    },
  })
    .select("title amount type category date paymentMethod wallet")
    .lean();

  const existingKeys = new Set(existingTransactions.map(createDuplicateKey));

  const transactionsToInsert = [];

  for (const item of validRows) {
    if (existingKeys.has(item.duplicateKey)) {
      duplicateCount += 1;

      rowErrors.push({
        row: item.rowNumber,
        message: "Transaction already exists.",
        type: "duplicate",
      });

      continue;
    }

    existingKeys.add(item.duplicateKey);

    transactionsToInsert.push({
      ...item,
      csvImportKey: createCsvImportKey(item.transaction),
    });
  }

  let importedCount = 0;
  let databaseFailureCount = 0;

  for (const item of transactionsToInsert) {
    try {
      await runInTransaction(async (session) => {
        const existingImport = await Transaction.findOne({
          user: userId,
          csvImportKey: item.csvImportKey,
        }).session(session);

        if (existingImport) {
          throw new AppError(
            "Transaction already exists (concurrent import).",
            409,
          );
        }

        const transactionPayload = {
          ...item.transaction,
          amount: mongoose.Types.Decimal128.fromString(item.transaction.amount),
          csvImportKey: item.csvImportKey,
        };

        const [transaction] = await Transaction.create([transactionPayload], {
          session,
        });

        if (transaction.wallet) {
          const amount = toMinorUnits(transaction.amount.toString());

          const signedAmount = transaction.type === "income" ? amount : -amount;

          await createLedgerEntry(
            userId,
            {
              wallet: transaction.wallet,
              amount: fromMinorUnits(signedAmount),
              entryType: transaction.type,
              sourceType: "csv_import",
              sourceId: transaction._id,
              idempotencyKey: `csv:${item.csvImportKey}`,
            },
            { session },
          );
        }
      });

      importedCount += 1;
    } catch (error) {
      if (getErrorCode(error) === 11000 || error.statusCode === 409) {
        duplicateCount += 1;

        rowErrors.push({
          row: item.rowNumber,
          message: "Transaction already exists (concurrent import).",
          type: "duplicate",
        });
      } else {
        databaseFailureCount += 1;

        rowErrors.push({
          row: item.rowNumber,
          message: error.message || "Unable to save this transaction.",
          type: "database",
        });
      }
    }
  }

  return {
    summary: {
      totalRows: rows.length,
      imported: importedCount,
      skipped: rowErrors.length,
      duplicates: duplicateCount,
      failed: rowErrors.length - duplicateCount,
      databaseFailures: databaseFailureCount,
    },
    errors: rowErrors,
  };
};

const exportTransactions = async (userId, filters = {}) => {
  const {
    type,
    category,
    wallet,
    startDate,
    endDate,
    sort = "newest",
  } = filters;

  const query = { user: userId };

  if (type) {
    if (!["income", "expense"].includes(type)) {
      throw new AppError("Invalid transaction type.", 400);
    }

    query.type = type;
  }

  if (category) {
    if (!mongoose.isValidObjectId(category)) {
      throw new AppError("Invalid category ID.", 400);
    }

    const validCategory = await Category.findOne({
      _id: category,
      isActive: true,
      $or: [{ isDefault: true }, { user: userId, isDefault: false }],
    });

    if (!validCategory) {
      throw new AppError("Category not found or unavailable.", 400);
    }

    query.category = category;
  }

  if (wallet) {
    if (!mongoose.isValidObjectId(wallet)) {
      throw new AppError("Invalid wallet ID.", 400);
    }

    const validWallet = await Wallet.findOne({
      _id: wallet,
      user: userId,
    }).select("_id");

    if (!validWallet) {
      throw new AppError("Wallet not found.", 404);
    }

    query.wallet = validWallet._id;
  }

  if (startDate || endDate) {
    query.date = buildDateFilter(startDate, endDate);
  }

  const sortOption =
    sort === "oldest" ? { date: 1, _id: 1 } : { date: -1, _id: -1 };

  const total = await Transaction.countDocuments(query);

  if (total > MAX_EXPORT_ROWS) {
    throw new AppError(
      `Export is limited to ${MAX_EXPORT_ROWS} transactions per file.`,
      400,
    );
  }

  const transactions = await Transaction.find(query)
    .populate("category", "name")
    .populate("wallet", "name type")
    .sort(sortOption)
    .limit(MAX_EXPORT_ROWS)
    .lean();

  const csvRows = transactions.map((transaction) => ({
    title: protectCsvFormula(transaction.title),
    amount: transaction.amount.toString(),
    type: transaction.type,
    category: protectCsvFormula(transaction.category?.name || ""),
    description: protectCsvFormula(transaction.description || ""),
    date: new Date(transaction.date).toISOString(),
    paymentMethod: transaction.paymentMethod || "other",
    walletId: transaction.wallet?._id?.toString() || "",
    wallet: protectCsvFormula(transaction.wallet?.name || ""),
    walletType: transaction.wallet?.type || "",
  }));

  return stringify(csvRows, {
    header: true,
    columns: [
      "title",
      "amount",
      "type",
      "category",
      "description",
      "date",
      "paymentMethod",
      "walletId",
      "wallet",
      "walletType",
    ],
  });
};

module.exports = {
  importTransactions,
  exportTransactions,
};

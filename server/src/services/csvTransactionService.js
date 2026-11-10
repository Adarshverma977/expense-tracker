const mongoose = require("mongoose");
const { parse } = require("csv-parse/sync");
const { stringify } = require("csv-stringify/sync");

const Transaction = require("../models/Transaction");
const Category = require("../models/Category");
const AppError = require("../utils/AppError");

const {
  parseCsvAmount,
  parseCsvDate,
  normalizePaymentMethod,
  protectCsvFormula,
  validateCsvHeaders,
} = require("../utils/csvHelpers");

const MAX_IMPORT_ROWS = 1000;
const MAX_EXPORT_ROWS = 10000;

const normalizeText = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const normalizeAmount = (value) => {
  const amount = String(value).trim();
  const [whole, decimal = ""] = amount.split(".");

  return `${whole}.${decimal.padEnd(2, "0")}`;
};

const createDuplicateKey = (transaction) => {
  return [
    normalizeText(transaction.title),
    normalizeAmount(transaction.amount.toString()),
    transaction.type,
    String(transaction.category),
    new Date(transaction.date).getTime(),
    transaction.paymentMethod || "other",
  ].join("|");
};

const buildDateFilter = (startDate, endDate) => {
  const dateFilter = {};

  if (startDate) {
    dateFilter.$gte = new Date(startDate);
  }

  if (endDate) {
    const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(endDate);

    if (isDateOnly) {
      const exclusiveEndDate = new Date(`${endDate}T00:00:00.000Z`);
      exclusiveEndDate.setUTCDate(exclusiveEndDate.getUTCDate() + 1);

      dateFilter.$lt = exclusiveEndDate;
    } else {
      dateFilter.$lte = new Date(endDate);
    }
  }

  return dateFilter;
};

// IMPORT TRANSACTIONS

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

  const categories = await Category.find({
    isActive: true,
    $or: [{ isDefault: true }, { user: userId, isDefault: false }],
  })
    .select("_id name normalizedName type")
    .lean();

  const categoryMap = new Map();

  categories.forEach((category) => {
    const key = `${category.type}:${category.normalizedName}`;
    categoryMap.set(key, category);
  });

  const validRows = [];
  const rowErrors = [];
  const seenInFile = new Set();

  let firstDate = null;
  let lastDate = null;

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

      const transaction = {
        user: userId,
        title,
        amount,
        type,
        category: category._id,
        description,
        date,
        paymentMethod,
      };

      const duplicateKey = createDuplicateKey(transaction);

      if (seenInFile.has(duplicateKey)) {
        throw new Error("Duplicate transaction inside CSV file.");
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
        duplicates: 0,
        failed: rowErrors.length,
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
    .select("title amount type category date paymentMethod")
    .lean();

  const existingKeys = new Set(existingTransactions.map(createDuplicateKey));

  const transactionsToInsert = [];
  let duplicateCount = 0;

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
    transactionsToInsert.push(item);
  }

  // Insert individually so one invalid database record
  // does not prevent other valid records from importing.
  let importedCount = 0;
  let databaseFailureCount = 0;

  for (const item of transactionsToInsert) {
    try {
      await Transaction.create(item.transaction);
      importedCount += 1;
    } catch (error) {
      databaseFailureCount += 1;

      rowErrors.push({
        row: item.rowNumber,
        message:
          error.name === "ValidationError"
            ? Object.values(error.errors)
                .map((validationError) => validationError.message)
                .join(", ")
            : "Unable to save this transaction.",
        type: "database",
      });
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

// EXPORT TRANSACTIONS

const exportTransactions = async (userId, filters = {}) => {
  const { type, category, startDate, endDate, sort = "newest" } = filters;

  const query = { user: userId };

  if (type) {
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
    ],
  });
};

module.exports = {
  importTransactions,
  exportTransactions,
};

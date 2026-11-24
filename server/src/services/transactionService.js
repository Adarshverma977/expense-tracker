const mongoose = require("mongoose");

const Transaction = require("../models/Transaction");
const Category = require("../models/Category");
const Wallet = require("../models/Wallet");
const LedgerEntry = require("../models/LedgerEntry");
const AppError = require("../utils/AppError");

const { toMinorUnits, fromMinorUnits } = require("../utils/moneyUtils");

const { createLedgerEntry, reverseLedgerEntry } = require("./ledgerService");

const AMOUNT_PATTERN = /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/;

const TRANSACTION_OPTIONS = {
  readPreference: "primary",
  readConcern: { level: "snapshot" },
  writeConcern: { w: "majority" },
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

const validateTransactionAmount = (value) => {
  if (typeof value !== "string") {
    throw new AppError("A valid transaction amount is required.", 400);
  }

  const amount = value.trim();

  if (amount.length > 15 || !AMOUNT_PATTERN.test(amount)) {
    throw new AppError(
      "Amount must be a valid positive number with at most 2 decimal places.",
      400,
    );
  }

  const [whole, fraction = ""] = amount.split(".");
  const minorUnits = BigInt(whole + fraction.padEnd(2, "0"));

  if (minorUnits <= 0n) {
    throw new AppError("Amount must be greater than zero.", 400);
  }

  return amount;
};

const validateCategory = async (
  userId,
  categoryId,
  transactionType,
  session,
) => {
  if (!mongoose.isValidObjectId(categoryId)) {
    throw new AppError("Invalid category ID.", 400);
  }

  const categoryQuery = {
    _id: categoryId,
    isActive: true,
    $or: [{ isDefault: true }, { user: userId, isDefault: false }],
  };

  if (transactionType) {
    categoryQuery.type = transactionType;
  }

  let query = Category.findOne(categoryQuery);

  if (session) {
    query = query.session(session);
  }

  const category = await query;

  if (!category) {
    throw new AppError(
      "Category not found, inactive, or unavailable for this transaction type.",
      400,
    );
  }

  return category;
};

const validateWallet = async (userId, walletId, session) => {
  if (!mongoose.isValidObjectId(walletId)) {
    throw new AppError("A valid wallet is required.", 400);
  }

  let query = Wallet.findOne({
    _id: walletId,
    user: userId,
    status: "active",
  });

  if (session) {
    query = query.session(session);
  }

  const wallet = await query;

  if (!wallet) {
    throw new AppError(
      "Wallet not found or is not available for new transactions.",
      400,
    );
  }

  return wallet;
};

const validateWalletTransactionType = (wallet, transactionType) => {
  if (wallet.type === "credit_card" && transactionType === "income") {
    throw new AppError(
      "Income transactions cannot be recorded directly in a credit card wallet. Use the appropriate refund or credit card workflow.",
      400,
    );
  }
};

const getTransactionLedgerEntry = async (userId, transactionId, session) => {
  const ledgerEntry = await LedgerEntry.findOne({
    user: userId,
    sourceType: "transaction",
    sourceId: transactionId,
    entryType: { $ne: "reversal" },
  })
    .sort({ createdAt: -1, _id: -1 })
    .session(session);

  if (!ledgerEntry) {
    throw new AppError(
      "Transaction ledger entry could not be found. Please contact support.",
      500,
    );
  }

  const existingReversal = await LedgerEntry.findOne({
    user: userId,
    reversalOf: ledgerEntry._id,
  }).session(session);

  if (existingReversal) {
    throw new AppError(
      "Transaction ledger is already reversed. Please contact support.",
      409,
    );
  }

  return ledgerEntry;
};

const createTransactionLedgerEntry = async (
  userId,
  transaction,
  wallet,
  session,
  idempotencyKey,
) => {
  const amount = toMinorUnits(transaction.amount.toString());

  const signedAmount = transaction.type === "income" ? amount : -amount;

  await createLedgerEntry(
    userId,
    {
      wallet: wallet._id,
      amount: fromMinorUnits(signedAmount),
      entryType: transaction.type,
      sourceType: "transaction",
      sourceId: transaction._id,
      idempotencyKey,
    },
    { session },
  );
};

const formatTransaction = (transaction) => {
  const data = transaction.toObject ? transaction.toObject() : transaction;

  return {
    ...data,
    amount: data.amount?.toString() ?? null,
  };
};

const createTransaction = async (userId, transactionData) => {
  return runInTransaction(async (session) => {
    const {
      title,
      type,
      category,
      description,
      date,
      paymentMethod,
      wallet: walletId,
    } = transactionData;

    const amount = validateTransactionAmount(transactionData.amount);

    if (!walletId) {
      throw new AppError("Please select a wallet for this transaction.", 400);
    }

    const validatedCategory = await validateCategory(
      userId,
      category,
      type,
      session,
    );

    const wallet = await validateWallet(userId, walletId, session);

    validateWalletTransactionType(wallet, type);

    const [transaction] = await Transaction.create(
      [
        {
          user: userId,
          wallet: wallet._id,
          title,
          amount: mongoose.Types.Decimal128.fromString(amount),
          type,
          category: validatedCategory._id,
          description,
          date,
          paymentMethod,
        },
      ],
      { session },
    );

    await createTransactionLedgerEntry(
      userId,
      transaction,
      wallet,
      session,
      `transaction:${transaction._id}:create`,
    );

    return formatTransaction(transaction);
  });
};

const parseDateFilter = (value, fieldName) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    throw new AppError(`Invalid ${fieldName}.`, 400);
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new AppError(`Invalid ${fieldName}.`, 400);
  }

  return parsedDate;
};

const getTransactions = async (userId, filters = {}) => {
  const {
    type,
    category,
    wallet,
    startDate,
    endDate,
    page = 1,
    limit = 10,
    sort = "newest",
  } = filters;

  const query = { user: userId };

  if (type) {
    query.type = type;
  }

  if (category) {
    await validateCategory(userId, category, type);
    query.category = category;
  }

  if (wallet) {
    if (!mongoose.isValidObjectId(wallet)) {
      throw new AppError("Invalid wallet ID.", 400);
    }

    const ownedWallet = await Wallet.findOne({
      _id: wallet,
      user: userId,
    }).select("_id");

    if (!ownedWallet) {
      throw new AppError("Wallet not found.", 404);
    }

    query.wallet = ownedWallet._id;
  }

  const parsedStartDate = parseDateFilter(startDate, "startDate");
  const parsedEndDate = parseDateFilter(endDate, "endDate");

  if (parsedStartDate && parsedEndDate && parsedStartDate > parsedEndDate) {
    throw new AppError("startDate cannot be later than endDate.", 400);
  }

  if (parsedStartDate || parsedEndDate) {
    query.date = {};

    if (parsedStartDate) {
      query.date.$gte = parsedStartDate;
    }

    if (parsedEndDate) {
      query.date.$lte = parsedEndDate;
    }
  }

  const skip = (page - 1) * limit;

  const sortOption =
    sort === "oldest" ? { date: 1, _id: 1 } : { date: -1, _id: -1 };

  const [transactions, total] = await Promise.all([
    Transaction.find(query)
      .populate("category", "name type icon color isDefault")
      .populate("wallet", "name type icon color status")
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .lean(),

    Transaction.countDocuments(query),
  ]);

  return {
    transactions: transactions.map(formatTransaction),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1,
    },
  };
};

const getTransactionById = async (userId, transactionId) => {
  if (!mongoose.isValidObjectId(transactionId)) {
    throw new AppError("Invalid transaction ID.", 400);
  }

  const transaction = await Transaction.findOne({
    _id: transactionId,
    user: userId,
  })
    .populate("category", "name type icon color isDefault")
    .populate("wallet", "name type icon color status")
    .lean();

  if (!transaction) {
    throw new AppError("Transaction not found.", 404);
  }

  return formatTransaction(transaction);
};

const updateTransaction = async (userId, transactionId, updates) => {
  if (!mongoose.isValidObjectId(transactionId)) {
    throw new AppError("Invalid transaction ID.", 400);
  }

  return runInTransaction(async (session) => {
    const transaction = await Transaction.findOne({
      _id: transactionId,
      user: userId,
    }).session(session);

    if (!transaction) {
      throw new AppError("Transaction not found.", 404);
    }

    const nextType = updates.type ?? transaction.type;
    const nextCategory = updates.category ?? transaction.category;

    const nextWalletId =
      updates.wallet !== undefined ? updates.wallet : transaction.wallet;

    if (updates.category !== undefined || updates.type !== undefined) {
      await validateCategory(userId, nextCategory, nextType, session);
    }

    let nextWallet = null;

    if (nextWalletId) {
      nextWallet = await validateWallet(userId, nextWalletId, session);

      validateWalletTransactionType(nextWallet, nextType);
    }

    const allowedFields = [
      "title",
      "amount",
      "type",
      "category",
      "description",
      "date",
      "paymentMethod",
    ];

    const previousWalletId = transaction.wallet?.toString() ?? null;
    const updatedWalletId = nextWallet?._id.toString() ?? null;

    const previousAmount = toMinorUnits(transaction.amount.toString());
    const nextAmount =
      updates.amount !== undefined
        ? toMinorUnits(validateTransactionAmount(updates.amount))
        : previousAmount;

    const ledgerChanged =
      previousWalletId !== updatedWalletId ||
      previousAmount !== nextAmount ||
      transaction.type !== nextType;

    if (ledgerChanged && previousWalletId) {
      const previousLedgerEntry = await getTransactionLedgerEntry(
        userId,
        transaction._id,
        session,
      );

      await reverseLedgerEntry(userId, previousLedgerEntry._id, { session });
    }

    allowedFields.forEach((field) => {
      if (updates[field] !== undefined) {
        transaction[field] =
          field === "amount"
            ? mongoose.Types.Decimal128.fromString(
                validateTransactionAmount(updates[field]),
              )
            : updates[field];
      }
    });

    if (updates.wallet !== undefined) {
      transaction.wallet = nextWallet?._id ?? null;
    }

    await transaction.save({ session });

    if (ledgerChanged && nextWallet) {
      await createTransactionLedgerEntry(
        userId,
        transaction,
        nextWallet,
        session,
        `transaction:${transaction._id}:update:${new mongoose.Types.ObjectId()}`,
      );
    }

    return formatTransaction(transaction);
  });
};

const deleteTransaction = async (userId, transactionId) => {
  if (!mongoose.isValidObjectId(transactionId)) {
    throw new AppError("Invalid transaction ID.", 400);
  }

  return runInTransaction(async (session) => {
    const transaction = await Transaction.findOne({
      _id: transactionId,
      user: userId,
    }).session(session);

    if (!transaction) {
      throw new AppError("Transaction not found.", 404);
    }

    if (transaction.wallet) {
      const ledgerEntry = await getTransactionLedgerEntry(
        userId,
        transaction._id,
        session,
      );

      await reverseLedgerEntry(userId, ledgerEntry._id, { session });
    }

    await transaction.deleteOne({ session });

    return {
      message: "Transaction deleted successfully.",
    };
  });
};

module.exports = {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
};

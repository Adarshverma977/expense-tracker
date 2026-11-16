const mongoose = require("mongoose");

const Transaction = require("../models/Transaction");
const Category = require("../models/Category");
const AppError = require("../utils/AppError");

const AMOUNT_PATTERN = /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/;

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

const validateCategory = async (userId, categoryId, transactionType) => {
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

  const category = await Category.findOne(categoryQuery);

  if (!category) {
    throw new AppError(
      "Category not found, inactive, or unavailable for this transaction type.",
      400,
    );
  }

  return category;
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

const formatTransaction = (transaction) => {
  const data = transaction.toObject ? transaction.toObject() : transaction;

  return {
    ...data,
    amount: data.amount?.toString() ?? null,
  };
};

const createTransaction = async (userId, transactionData) => {
  const { title, type, category, description, date, paymentMethod } =
    transactionData;

  const amount = validateTransactionAmount(transactionData.amount);

  await validateCategory(userId, category, type);

  const transaction = await Transaction.create({
    user: userId,
    title,
    amount: mongoose.Types.Decimal128.fromString(amount),
    type,
    category,
    description,
    date,
    paymentMethod,
  });

  return formatTransaction(transaction);
};

const getTransactions = async (userId, filters = {}) => {
  const {
    type,
    category,
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

  const transaction = await Transaction.findOne({
    _id: transactionId,
    user: userId,
  });

  if (!transaction) {
    throw new AppError("Transaction not found.", 404);
  }

  const nextType = updates.type ?? transaction.type;
  const nextCategory = updates.category ?? transaction.category;

  if (updates.category !== undefined || updates.type !== undefined) {
    await validateCategory(userId, nextCategory, nextType);
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

  await transaction.save();

  return formatTransaction(transaction);
};

const deleteTransaction = async (userId, transactionId) => {
  if (!mongoose.isValidObjectId(transactionId)) {
    throw new AppError("Invalid transaction ID.", 400);
  }

  const transaction = await Transaction.findOneAndDelete({
    _id: transactionId,
    user: userId,
  });

  if (!transaction) {
    throw new AppError("Transaction not found.", 404);
  }

  return {
    message: "Transaction deleted successfully.",
  };
};

module.exports = {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
};

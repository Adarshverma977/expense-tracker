const mongoose = require("mongoose");

const Bill = require("../models/Bill");
const Category = require("../models/Category");
const Wallet = require("../models/Wallet");
const AppError = require("../utils/AppError");

const { fromMinorUnits, toMinorUnits } = require("../utils/moneyUtils");

const MAX_AMOUNT_PAISE = 99999999999999n;

const FREQUENCIES = ["one_time", "weekly", "monthly", "quarterly", "yearly"];

const validateAmount = (value) => {
  if (typeof value !== "string") {
    throw new AppError("A valid bill amount is required.", 400);
  }

  const amount = value.trim();

  if (amount.length > 15 || !/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(amount)) {
    throw new AppError(
      "Amount must be a valid positive number with at most 2 decimal places.",
      400,
    );
  }

  const minorUnits = toMinorUnits(amount);

  if (minorUnits <= 0n || minorUnits > MAX_AMOUNT_PAISE) {
    throw new AppError(
      "Bill amount must be greater than zero and within the allowed limit.",
      400,
    );
  }

  return amount;
};

const validateCategory = async (userId, categoryId) => {
  if (!mongoose.isValidObjectId(categoryId)) {
    throw new AppError("Invalid category ID.", 400);
  }

  const category = await Category.findOne({
    _id: categoryId,
    type: "expense",
    isActive: true,
    $or: [{ isDefault: true }, { user: userId, isDefault: false }],
  }).select("_id name type");

  if (!category) {
    throw new AppError(
      "Category not found, inactive, or unavailable for bills.",
      400,
    );
  }

  return category;
};

const validateWallet = async (userId, walletId) => {
  if (!walletId) return null;

  if (!mongoose.isValidObjectId(walletId)) {
    throw new AppError("Invalid wallet ID.", 400);
  }

  const wallet = await Wallet.findOne({
    _id: walletId,
    user: userId,
    status: "active",
  }).select("_id name type");

  if (!wallet) {
    throw new AppError("Wallet not found or is not available.", 400);
  }

  return wallet;
};

const calculateNextDueDate = (date, frequency) => {
  const nextDate = new Date(date);

  switch (frequency) {
    case "weekly":
      nextDate.setDate(nextDate.getDate() + 7);
      break;

    case "monthly":
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;

    case "quarterly":
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;

    case "yearly":
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;

    default:
      return null;
  }

  return nextDate;
};

const formatBill = (bill) => {
  const data = bill.toObject ? bill.toObject() : bill;

  return {
    ...data,
    amount: data.amount?.toString() ?? null,
  };
};

const parseDateBoundary = (value, fieldName, isEndDate = false) => {
  if (!value) return null;

  if (typeof value !== "string") {
    throw new AppError(`Invalid ${fieldName}.`, 400);
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new AppError(`Invalid ${fieldName}.`, 400);
  }

  const parsedDate = new Date(`${value}T00:00:00.000Z`);

  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== value
  ) {
    throw new AppError(`Invalid ${fieldName}.`, 400);
  }

  if (isEndDate) {
    parsedDate.setUTCDate(parsedDate.getUTCDate() + 1);
  }

  return parsedDate;
};

const getEffectiveDueDate = () => ({
  $ifNull: ["$nextDueDate", "$dueDate"],
});

const createBill = async (userId, billData) => {
  const {
    title,
    payee = "",
    description = "",
    amount,
    category,
    wallet = null,
    frequency = "one_time",
    dueDate,
    nextDueDate,
    reminderDays = [7, 3, 1],
    notes = "",
  } = billData;

  const validatedAmount = validateAmount(amount);

  if (!FREQUENCIES.includes(frequency)) {
    throw new AppError("Invalid bill frequency.", 400);
  }

  if (!(dueDate instanceof Date) || Number.isNaN(dueDate.getTime())) {
    throw new AppError("Invalid bill due date.", 400);
  }

  const [validatedCategory, validatedWallet] = await Promise.all([
    validateCategory(userId, category),
    validateWallet(userId, wallet),
  ]);

  let calculatedNextDueDate = null;

  if (frequency !== "one_time") {
    calculatedNextDueDate =
      nextDueDate ?? calculateNextDueDate(dueDate, frequency);
  }

  const bill = await Bill.create({
    user: userId,
    title,
    payee,
    description,
    amount: mongoose.Types.Decimal128.fromString(validatedAmount),
    category: validatedCategory._id,
    wallet: validatedWallet?._id ?? null,
    frequency,
    dueDate,
    nextDueDate: calculatedNextDueDate,
    reminderDays,
    notes,
  });

  return formatBill(bill);
};

const getBills = async (userId, filters = {}) => {
  const {
    status,
    frequency,
    category,
    wallet,
    startDate,
    endDate,
    due,
    page = 1,
    limit = 10,
    sort = "due_soon",
  } = filters;

  const query = { user: userId };

  if (status) query.status = status;
  if (frequency) query.frequency = frequency;

  if (category) {
    if (!mongoose.isValidObjectId(category)) {
      throw new AppError("Invalid category ID.", 400);
    }

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

  const parsedStartDate = parseDateBoundary(startDate, "start date");

  const parsedEndDate = parseDateBoundary(endDate, "end date", true);

  if (parsedStartDate && parsedEndDate && parsedStartDate >= parsedEndDate) {
    throw new AppError("Start date cannot be after end date.", 400);
  }

  const dueExpression = getEffectiveDueDate();

  if (parsedStartDate || parsedEndDate) {
    const conditions = [];

    if (parsedStartDate) {
      conditions.push({
        $gte: [dueExpression, parsedStartDate],
      });
    }

    if (parsedEndDate) {
      conditions.push({
        $lt: [dueExpression, parsedEndDate],
      });
    }

    query.$expr = {
      $and: conditions,
    };
  }

  if (due) {
    const now = new Date();

    const todayStart = new Date(now);
    todayStart.setUTCHours(0, 0, 0, 0);

    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1);

    if (due === "today") {
      query.$expr = {
        $and: [
          ...(query.$expr?.$and ?? []),
          { $gte: [dueExpression, todayStart] },
          { $lt: [dueExpression, tomorrowStart] },
        ],
      };
    }

    if (due === "overdue") {
      query.$expr = {
        $and: [
          ...(query.$expr?.$and ?? []),
          { $lt: [dueExpression, todayStart] },
        ],
      };
    }

    if (due === "upcoming") {
      query.$expr = {
        $and: [
          ...(query.$expr?.$and ?? []),
          { $gte: [dueExpression, tomorrowStart] },
        ],
      };
    }
  }

  const sortOptions = {
    newest: { createdAt: -1, _id: -1 },
    oldest: { createdAt: 1, _id: 1 },
    due_soon: { nextDueDate: 1, dueDate: 1, _id: 1 },
    amount_high: { amount: -1, _id: -1 },
    amount_low: { amount: 1, _id: 1 },
  };

  const skip = (page - 1) * limit;

  const [bills, total] = await Promise.all([
    Bill.find(query)
      .populate("category", "name type icon color")
      .populate("wallet", "name type icon color status")
      .sort(sortOptions[sort] || sortOptions.due_soon)
      .skip(skip)
      .limit(limit)
      .lean(),

    Bill.countDocuments(query),
  ]);

  return {
    bills: bills.map(formatBill),
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

const getBillById = async (userId, billId) => {
  if (!mongoose.isValidObjectId(billId)) {
    throw new AppError("Invalid bill ID.", 400);
  }

  const bill = await Bill.findOne({
    _id: billId,
    user: userId,
  })
    .populate("category", "name type icon color")
    .populate("wallet", "name type icon color status")
    .lean();

  if (!bill) {
    throw new AppError("Bill not found.", 404);
  }

  return formatBill(bill);
};

const updateBill = async (userId, billId, updates) => {
  if (!mongoose.isValidObjectId(billId)) {
    throw new AppError("Invalid bill ID.", 400);
  }

  const bill = await Bill.findOne({
    _id: billId,
    user: userId,
  });

  if (!bill) {
    throw new AppError("Bill not found.", 404);
  }

  if (bill.status === "archived") {
    throw new AppError("Archived bills cannot be updated.", 400);
  }

  const nextFrequency = updates.frequency ?? bill.frequency;

  if (!FREQUENCIES.includes(nextFrequency)) {
    throw new AppError("Invalid bill frequency.", 400);
  }

  if (updates.category !== undefined) {
    await validateCategory(userId, updates.category);
  }

  if (updates.wallet !== undefined && updates.wallet !== null) {
    await validateWallet(userId, updates.wallet);
  }

  if (updates.amount !== undefined) {
    updates.amount = mongoose.Types.Decimal128.fromString(
      validateAmount(updates.amount),
    );
  }

  if (updates.dueDate !== undefined) {
    if (
      !(updates.dueDate instanceof Date) ||
      Number.isNaN(updates.dueDate.getTime())
    ) {
      throw new AppError("Invalid bill due date.", 400);
    }
  }

  const frequencyChanged = nextFrequency !== bill.frequency;
  const dueDateChanged = updates.dueDate !== undefined;

  Object.assign(bill, updates);

  if (nextFrequency === "one_time") {
    bill.nextDueDate = null;
  } else if (
    frequencyChanged ||
    dueDateChanged ||
    updates.nextDueDate !== undefined
  ) {
    bill.nextDueDate =
      updates.nextDueDate ??
      calculateNextDueDate(updates.dueDate ?? bill.dueDate, nextFrequency);
  }

  await bill.save();

  return formatBill(bill);
};

const archiveBill = async (userId, billId) => {
  if (!mongoose.isValidObjectId(billId)) {
    throw new AppError("Invalid bill ID.", 400);
  }

  const bill = await Bill.findOne({
    _id: billId,
    user: userId,
  });

  if (!bill) {
    throw new AppError("Bill not found.", 404);
  }

  if (bill.status === "archived") {
    throw new AppError("Bill is already archived.", 400);
  }

  bill.status = "archived";

  await bill.save();

  return formatBill(bill);
};

module.exports = {
  createBill,
  getBills,
  getBillById,
  updateBill,
  archiveBill,
};

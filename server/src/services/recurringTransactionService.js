const mongoose = require("mongoose");

const RecurringTransaction = require("../models/RecurringTransaction");
const Category = require("../models/Category");
const Wallet = require("../models/Wallet");
const AppError = require("../utils/AppError");

const {
  calculateNextFutureRunDate,
  validateScheduleDates,
} = require("../utils/dateUtils");

const parseDateOnly = (value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new AppError("Invalid schedule date.", 400);
    }

    return value;
  }

  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new AppError("Invalid schedule date. Use YYYY-MM-DD format.", 400);
  }

  const parsedDate = new Date(`${value}T00:00:00.000Z`);

  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== value
  ) {
    throw new AppError("Invalid schedule date.", 400);
  }

  return parsedDate;
};

const formatRecurringTransaction = (transaction) => {
  const data = transaction.toObject ? transaction.toObject() : transaction;

  return {
    ...data,
    amount: data.amount.toString(),
  };
};

const validateCategory = async (userId, categoryId, transactionType) => {
  if (!mongoose.isValidObjectId(categoryId)) {
    throw new AppError("Invalid category ID.", 400);
  }

  const category = await Category.findOne({
    _id: categoryId,
    type: transactionType,
    isActive: true,
    $or: [{ isDefault: true }, { user: userId, isDefault: false }],
  });

  if (!category) {
    throw new AppError(
      "Category not found, inactive, or unavailable for this transaction type.",
      400,
    );
  }

  return category;
};

const validateWallet = async (userId, walletId, transactionType) => {
  if (walletId === null || walletId === undefined || walletId === "") {
    return null;
  }

  if (!mongoose.isValidObjectId(walletId)) {
    throw new AppError("Invalid wallet ID.", 400);
  }

  const wallet = await Wallet.findOne({
    _id: walletId,
    user: userId,
    status: "active",
  });

  if (!wallet) {
    throw new AppError("Wallet not found or inactive.", 400);
  }

  if (wallet.type === "credit_card" && transactionType === "income") {
    throw new AppError(
      "Income cannot be scheduled directly into a credit card wallet.",
      400,
    );
  }

  return wallet;
};

const validateScheduleId = (scheduleId) => {
  if (!mongoose.isValidObjectId(scheduleId)) {
    throw new AppError("Invalid recurring transaction ID.", 400);
  }
};

const ensureEditable = (schedule) => {
  if (schedule.status === "cancelled") {
    throw new AppError(
      "Cancelled recurring transactions cannot be modified.",
      400,
    );
  }

  if (schedule.status === "completed") {
    throw new AppError(
      "Completed recurring transactions cannot be modified.",
      400,
    );
  }
};

const getUnlockedCondition = (now = new Date()) => ({
  $or: [
    { lockedUntil: null },
    { lockedUntil: { $exists: false } },
    { lockedUntil: { $lte: now } },
  ],
});

const getNextRunDate = (startDate, frequency, endDate) => {
  const nextRunDate = calculateNextFutureRunDate(
    startDate,
    frequency,
    new Date(),
  );

  if (endDate && nextRunDate > endDate) {
    return null;
  }

  return nextRunDate;
};

const handleMutationFailure = async (userId, scheduleId) => {
  const currentSchedule = await RecurringTransaction.findOne({
    _id: scheduleId,
    user: userId,
  }).lean();

  if (!currentSchedule) {
    throw new AppError("Recurring transaction not found.", 404);
  }

  ensureEditable(currentSchedule);

  if (currentSchedule.lockedUntil && currentSchedule.lockedUntil > new Date()) {
    throw new AppError(
      "This recurring transaction is currently being processed. Please try again shortly.",
      409,
    );
  }

  throw new AppError(
    "Recurring transaction could not be updated. Please retry.",
    409,
  );
};

const createRecurringTransaction = async (userId, data) => {
  const {
    title,
    amount,
    type,
    category,
    description,
    paymentMethod,
    frequency,
    startDate,
    endDate,
    wallet,
  } = data;

  await validateCategory(userId, category, type);
  const validatedWallet = await validateWallet(userId, wallet, type);

  const parsedStartDate = parseDateOnly(startDate);
  const parsedEndDate = parseDateOnly(endDate);

  validateScheduleDates(parsedStartDate, parsedEndDate);

  const nextRunDate = getNextRunDate(parsedStartDate, frequency, parsedEndDate);

  if (!nextRunDate) {
    throw new AppError(
      "No upcoming execution exists within the selected date range.",
      400,
    );
  }

  const schedule = await RecurringTransaction.create({
    user: userId,
    title,
    amount,
    type,
    category,
    description,
    paymentMethod,
    frequency,
    startDate: parsedStartDate,
    nextRunDate,
    endDate: parsedEndDate,
    wallet: validatedWallet?._id ?? null,
    status: "active",
  });

  return formatRecurringTransaction(schedule);
};

const getRecurringTransactions = async (userId, filters = {}) => {
  const {
    status,
    type,
    frequency,
    page = 1,
    limit = 10,
    sort = "newest",
  } = filters;

  const query = { user: userId };

  if (status) query.status = status;
  if (type) query.type = type;
  if (frequency) query.frequency = frequency;

  const skip = (page - 1) * limit;

  const sortOption =
    sort === "oldest"
      ? { createdAt: 1, _id: 1 }
      : sort === "next_due"
        ? { nextRunDate: 1, _id: 1 }
        : { createdAt: -1, _id: -1 };

  const [schedules, total] = await Promise.all([
    RecurringTransaction.find(query)
      .populate("category", "name type icon color isDefault")
      .populate("wallet", "name type status")
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .lean(),

    RecurringTransaction.countDocuments(query),
  ]);

  return {
    recurringTransactions: schedules.map(formatRecurringTransaction),
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

const getRecurringTransactionById = async (userId, scheduleId) => {
  validateScheduleId(scheduleId);

  const schedule = await RecurringTransaction.findOne({
    _id: scheduleId,
    user: userId,
  })
    .populate("category", "name type icon color isDefault")
    .populate("wallet", "name type status")
    .lean();

  if (!schedule) {
    throw new AppError("Recurring transaction not found.", 404);
  }

  return formatRecurringTransaction(schedule);
};

const updateRecurringTransaction = async (userId, scheduleId, updates) => {
  validateScheduleId(scheduleId);

  const schedule = await RecurringTransaction.findOne({
    _id: scheduleId,
    user: userId,
  });

  if (!schedule) {
    throw new AppError("Recurring transaction not found.", 404);
  }

  ensureEditable(schedule);

  const nextType = updates.type ?? schedule.type;
  const nextCategory = updates.category ?? schedule.category;

  if (updates.type !== undefined || updates.category !== undefined) {
    await validateCategory(userId, nextCategory, nextType);
  }

  const walletChanged = Object.prototype.hasOwnProperty.call(updates, "wallet");

  const nextWalletId = walletChanged ? updates.wallet : schedule.wallet;

  let validatedWallet = null;

  if (walletChanged || updates.type !== undefined) {
    validatedWallet = await validateWallet(userId, nextWalletId, nextType);
  }

  const nextFrequency = updates.frequency ?? schedule.frequency;

  const nextStartDate =
    updates.startDate !== undefined
      ? parseDateOnly(updates.startDate)
      : schedule.startDate;

  const nextEndDate =
    updates.endDate !== undefined
      ? parseDateOnly(updates.endDate)
      : schedule.endDate;

  validateScheduleDates(nextStartDate, nextEndDate);

  const scheduleChanged =
    updates.startDate !== undefined || updates.frequency !== undefined;

  let nextRunDate = schedule.nextRunDate;

  if (scheduleChanged) {
    nextRunDate = getNextRunDate(nextStartDate, nextFrequency, nextEndDate);

    if (!nextRunDate) {
      throw new AppError(
        "No upcoming execution exists within the selected date range.",
        400,
      );
    }
  } else if (nextEndDate && schedule.nextRunDate > nextEndDate) {
    throw new AppError(
      "End date cannot be before the next scheduled execution.",
      400,
    );
  }

  const allowedFields = [
    "title",
    "amount",
    "type",
    "category",
    "description",
    "paymentMethod",
    "frequency",
  ];

  const updateFields = {};

  allowedFields.forEach((field) => {
    if (updates[field] !== undefined) {
      updateFields[field] = updates[field];
    }
  });

  if (walletChanged) {
    updateFields.wallet = validatedWallet?._id ?? null;
  }

  if (updates.startDate !== undefined) {
    updateFields.startDate = nextStartDate;
  }

  if (updates.endDate !== undefined) {
    updateFields.endDate = nextEndDate;
  }

  if (scheduleChanged) {
    updateFields.nextRunDate = nextRunDate;
  }

  const now = new Date();

  const updatedSchedule = await RecurringTransaction.findOneAndUpdate(
    {
      _id: scheduleId,
      user: userId,
      status: { $in: ["active", "paused"] },
      ...getUnlockedCondition(now),
    },
    {
      $set: updateFields,
    },
    {
      returnDocument: "after",
      runValidators: true,
    },
  );

  if (!updatedSchedule) {
    await handleMutationFailure(userId, scheduleId);
  }

  return formatRecurringTransaction(updatedSchedule);
};

const pauseRecurringTransaction = async (userId, scheduleId) => {
  validateScheduleId(scheduleId);

  const now = new Date();

  const schedule = await RecurringTransaction.findOneAndUpdate(
    {
      _id: scheduleId,
      user: userId,
      status: "active",
      ...getUnlockedCondition(now),
    },
    {
      $set: {
        status: "paused",
        pausedAt: now,
        lockedUntil: null,
        lockToken: null,
      },
    },
    {
      returnDocument: "after",
    },
  );

  if (!schedule) {
    const current = await RecurringTransaction.findOne({
      _id: scheduleId,
      user: userId,
    }).lean();

    if (!current) {
      throw new AppError("Recurring transaction not found.", 404);
    }

    if (current.lockedUntil && current.lockedUntil > new Date()) {
      throw new AppError(
        "This recurring transaction is currently being processed. Please try again shortly.",
        409,
      );
    }

    throw new AppError(
      "Only active recurring transactions can be paused.",
      400,
    );
  }

  return formatRecurringTransaction(schedule);
};

const resumeRecurringTransaction = async (userId, scheduleId) => {
  validateScheduleId(scheduleId);

  const current = await RecurringTransaction.findOne({
    _id: scheduleId,
    user: userId,
  });

  if (!current) {
    throw new AppError("Recurring transaction not found.", 404);
  }

  if (current.status !== "paused") {
    throw new AppError(
      "Only paused recurring transactions can be resumed.",
      400,
    );
  }

  const now = new Date();

  const nextRunDate = calculateNextFutureRunDate(
    current.nextRunDate,
    current.frequency,
    now,
  );

  const shouldComplete =
    current.endDate !== null &&
    current.endDate !== undefined &&
    nextRunDate > current.endDate;

  const updatedSchedule = await RecurringTransaction.findOneAndUpdate(
    {
      _id: scheduleId,
      user: userId,
      status: "paused",
      ...getUnlockedCondition(now),
    },
    {
      $set: {
        nextRunDate,
        status: shouldComplete ? "completed" : "active",
        pausedAt: null,
        completedAt: shouldComplete ? now : null,
        lockedUntil: null,
        lockToken: null,
      },
    },
    {
      returnDocument: "after",
    },
  );

  if (!updatedSchedule) {
    await handleMutationFailure(userId, scheduleId);
  }

  return formatRecurringTransaction(updatedSchedule);
};

const cancelRecurringTransaction = async (userId, scheduleId) => {
  validateScheduleId(scheduleId);

  const now = new Date();

  const schedule = await RecurringTransaction.findOneAndUpdate(
    {
      _id: scheduleId,
      user: userId,
      status: { $in: ["active", "paused"] },
      ...getUnlockedCondition(now),
    },
    {
      $set: {
        status: "cancelled",
        cancelledAt: now,
        lockedUntil: null,
        lockToken: null,
      },
    },
    {
      returnDocument: "after",
    },
  );

  if (!schedule) {
    const current = await RecurringTransaction.findOne({
      _id: scheduleId,
      user: userId,
    }).lean();

    if (!current) {
      throw new AppError("Recurring transaction not found.", 404);
    }

    ensureEditable(current);

    if (current.lockedUntil && current.lockedUntil > new Date()) {
      throw new AppError(
        "This recurring transaction is currently being processed. Please try again shortly.",
        409,
      );
    }

    throw new AppError("Recurring transaction could not be cancelled.", 409);
  }

  return {
    message: "Recurring transaction cancelled successfully.",
    recurringTransaction: formatRecurringTransaction(schedule),
  };
};

module.exports = {
  createRecurringTransaction,
  getRecurringTransactions,
  getRecurringTransactionById,
  updateRecurringTransaction,
  pauseRecurringTransaction,
  resumeRecurringTransaction,
  cancelRecurringTransaction,
};

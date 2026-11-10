const mongoose = require("mongoose");

const FinancialGoal = require("../models/FinancialGoal");
const AppError = require("../utils/AppError");

const MAX_AMOUNT_MINOR_UNITS = 99999999999999n;

// Convert Decimal128 amount into integer paise.
// BigInt avoids floating-point precision errors.
const toMinorUnits = (value) => {
  const amount = value.toString().trim();

  const match = amount.match(/^([+-]?)(\d+)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/);

  if (!match) {
    throw new Error("Invalid monetary value received.");
  }

  const [, sign, whole, fraction = "", exponent = "0"] = match;

  let digits = `${whole}${fraction}`;
  let scale = fraction.length - Number(exponent);

  digits = digits.replace(/^0+/, "") || "0";

  if (scale > 2) {
    const extraDigits = scale - 2;

    if (!digits.endsWith("0".repeat(extraDigits))) {
      throw new Error("Unsupported monetary precision.");
    }

    digits = digits.slice(0, -extraDigits) || "0";
    scale = 2;
  }

  if (scale < 0) {
    digits += "0".repeat(-scale);
    scale = 0;
  }

  const minorUnits = BigInt(digits) * 10n ** BigInt(2 - scale);

  return sign === "-" ? -minorUnits : minorUnits;
};

// Convert integer paise into a decimal string.
const fromMinorUnits = (value) => {
  const negative = value < 0n;
  const absolute = negative ? -value : value;

  const whole = absolute / 100n;
  const fraction = (absolute % 100n).toString().padStart(2, "0");

  return `${negative ? "-" : ""}${whole}.${fraction}`;
};

// Validate monetary amounts.
const validateAmount = (amount) => {
  const minorUnits = toMinorUnits(amount);

  if (minorUnits <= 0n || minorUnits > MAX_AMOUNT_MINOR_UNITS) {
    throw new AppError("Goal amount is outside the allowed range.", 400);
  }

  return minorUnits;
};

// Validate target date.
const validateTargetDate = (date) => {
  const targetDate = new Date(date);

  if (Number.isNaN(targetDate.getTime())) {
    throw new AppError("Invalid goal target date.", 400);
  }

  return targetDate;
};

// Format goal with calculated progress.
const formatGoal = (goal) => {
  const data = goal.toObject ? goal.toObject() : goal;

  const targetAmount = toMinorUnits(data.targetAmount.toString());
  const savedAmount = toMinorUnits(data.savedAmount.toString());

  const remainingAmount = targetAmount - savedAmount;

  const progressPercentage =
    targetAmount > 0n ? Number((savedAmount * 10000n) / targetAmount) / 100 : 0;

  return {
    ...data,
    targetAmount: fromMinorUnits(targetAmount),
    savedAmount: fromMinorUnits(savedAmount),
    remainingAmount: fromMinorUnits(remainingAmount),
    progressPercentage,
    isCompleted: data.status === "completed",
  };
};

// CREATE FINANCIAL GOAL
const createFinancialGoal = async (userId, goalData) => {
  const { title, description, targetAmount, targetDate, icon, color } =
    goalData;

  const validatedAmount = validateAmount(targetAmount);
  const validatedDate = validateTargetDate(targetDate);

  const goal = await FinancialGoal.create({
    user: userId,
    title,
    description,
    targetAmount: mongoose.Types.Decimal128.fromString(
      fromMinorUnits(validatedAmount),
    ),
    savedAmount: mongoose.Types.Decimal128.fromString("0.00"),
    targetDate: validatedDate,
    icon,
    color,
    status: "active",
  });

  return formatGoal(goal);
};

// GET ALL FINANCIAL GOALS
const getFinancialGoals = async (userId, filters = {}) => {
  const query = {
    user: userId,
  };

  if (filters.status) {
    query.status = filters.status;
  }

  const goals = await FinancialGoal.find(query)
    .sort({ createdAt: -1, _id: -1 })
    .lean();

  return goals.map(formatGoal);
};

// GET SINGLE FINANCIAL GOAL
const getFinancialGoalById = async (userId, goalId) => {
  if (!mongoose.isValidObjectId(goalId)) {
    throw new AppError("Invalid financial goal ID.", 400);
  }

  const goal = await FinancialGoal.findOne({
    _id: goalId,
    user: userId,
  }).lean();

  if (!goal) {
    throw new AppError("Financial goal not found.", 404);
  }

  return formatGoal(goal);
};

// UPDATE FINANCIAL GOAL
const updateFinancialGoal = async (userId, goalId, updates) => {
  if (!mongoose.isValidObjectId(goalId)) {
    throw new AppError("Invalid financial goal ID.", 400);
  }

  const goal = await FinancialGoal.findOne({
    _id: goalId,
    user: userId,
  });

  if (!goal) {
    throw new AppError("Financial goal not found.", 404);
  }

  if (goal.status === "archived") {
    throw new AppError("Archived goals cannot be updated.", 400);
  }

  if (updates.targetAmount !== undefined) {
    const newTargetAmount = validateAmount(updates.targetAmount);

    const currentSavedAmount = toMinorUnits(goal.savedAmount.toString());

    if (newTargetAmount < currentSavedAmount) {
      throw new AppError(
        "Target amount cannot be lower than the current saved amount.",
        400,
      );
    }

    goal.targetAmount = mongoose.Types.Decimal128.fromString(
      fromMinorUnits(newTargetAmount),
    );

    if (newTargetAmount > currentSavedAmount) {
      goal.status = "active";
      goal.completedAt = null;
    }
  }

  if (updates.targetDate !== undefined) {
    goal.targetDate = validateTargetDate(updates.targetDate);
  }

  if (updates.title !== undefined) {
    goal.title = updates.title;
  }

  if (updates.description !== undefined) {
    goal.description = updates.description;
  }

  if (updates.icon !== undefined) {
    goal.icon = updates.icon;
  }

  if (updates.color !== undefined) {
    goal.color = updates.color;
  }

  await goal.save();

  return formatGoal(goal);
};

// ARCHIVE FINANCIAL GOAL
const archiveFinancialGoal = async (userId, goalId) => {
  if (!mongoose.isValidObjectId(goalId)) {
    throw new AppError("Invalid financial goal ID.", 400);
  }

  const goal = await FinancialGoal.findOneAndUpdate(
    {
      _id: goalId,
      user: userId,
      status: { $in: ["active", "completed"] },
    },
    {
      $set: {
        status: "archived",
        archivedAt: new Date(),
      },
    },
    {
      returnDocument: "after",
      runValidators: true,
    },
  );

  if (!goal) {
    throw new AppError("Financial goal not found or already archived.", 404);
  }

  return {
    message: "Financial goal archived successfully.",
  };
};

module.exports = {
  createFinancialGoal,
  getFinancialGoals,
  getFinancialGoalById,
  updateFinancialGoal,
  archiveFinancialGoal,
  toMinorUnits,
  fromMinorUnits,
  formatGoal,
};

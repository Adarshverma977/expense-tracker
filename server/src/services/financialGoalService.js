const mongoose = require("mongoose");

const FinancialGoal = require("../models/FinancialGoal");
const GoalContribution = require("../models/GoalContribution");
const AppError = require("../utils/AppError");

const MAX_AMOUNT_MINOR_UNITS = 99999999999999n;

const toMinorUnits = (value) => {
  if (value === null || value === undefined) {
    throw new Error("Invalid monetary value received.");
  }

  const amount = value.toString().trim();

  const match = amount.match(/^([+-]?)(\d+)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/);

  if (!match) {
    throw new Error("Invalid monetary value received.");
  }

  const [, sign, whole, fraction = "", exponent = "0"] = match;

  let digits = `${whole}${fraction}`;
  let scale = fraction.length - Number(exponent);

  if (!Number.isSafeInteger(scale) || Math.abs(scale) > 100) {
    throw new Error("Unsupported monetary precision.");
  }

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

const fromMinorUnits = (value) => {
  const negative = value < 0n;
  const absolute = negative ? -value : value;

  const whole = absolute / 100n;
  const fraction = (absolute % 100n).toString().padStart(2, "0");

  return `${negative ? "-" : ""}${whole}.${fraction}`;
};

const validateAmount = (amount) => {
  let minorUnits;

  try {
    minorUnits = toMinorUnits(amount);
  } catch {
    throw new AppError("Invalid goal amount.", 400);
  }

  if (minorUnits <= 0n || minorUnits > MAX_AMOUNT_MINOR_UNITS) {
    throw new AppError("Goal amount is outside the allowed range.", 400);
  }

  return minorUnits;
};

const validateTargetDate = (date) => {
  const targetDate = new Date(date);

  if (Number.isNaN(targetDate.getTime())) {
    throw new AppError("Invalid goal target date.", 400);
  }

  return targetDate;
};

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

const getFinancialGoals = async (userId, filters = {}) => {
  const query = {
    user: userId,
    status: filters.status || { $in: ["active", "completed"] },
  };

  const goals = await FinancialGoal.find(query)
    .sort({ createdAt: -1, _id: -1 })
    .lean();

  return goals.map(formatGoal);
};

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
    } else {
      goal.status = "completed";
      goal.completedAt = goal.completedAt || new Date();
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

const restoreFinancialGoal = async (userId, goalId) => {
  if (!mongoose.isValidObjectId(goalId)) {
    throw new AppError("Invalid financial goal ID.", 400);
  }

  const existingGoal = await FinancialGoal.findOne({
    _id: goalId,
    user: userId,
    status: "archived",
  }).lean();

  if (!existingGoal) {
    throw new AppError("Archived financial goal not found.", 404);
  }

  const savedAmount = toMinorUnits(existingGoal.savedAmount.toString());
  const targetAmount = toMinorUnits(existingGoal.targetAmount.toString());

  const isCompleted = savedAmount >= targetAmount;
  const now = new Date();

  const goal = await FinancialGoal.findOneAndUpdate(
    {
      _id: goalId,
      user: userId,
      status: "archived",
    },
    {
      $set: {
        status: isCompleted ? "completed" : "active",
        archivedAt: null,
        completedAt: isCompleted ? existingGoal.completedAt || now : null,
      },
    },
    {
      returnDocument: "after",
      runValidators: true,
    },
  );

  if (!goal) {
    throw new AppError("Financial goal could not be restored.", 409);
  }

  return formatGoal(goal);
};

const isTransactionUnsupported = (error) => {
  const message = error?.message || "";

  return (
    error?.code === 20 ||
    error?.codeName === "IllegalOperation" ||
    message.includes("Transaction numbers are only allowed") ||
    message.includes("does not support retryable writes")
  );
};

const permanentlyDeleteFinancialGoal = async (userId, goalId) => {
  if (!mongoose.isValidObjectId(goalId)) {
    throw new AppError("Invalid financial goal ID.", 400);
  }

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const goal = await FinancialGoal.findOne({
        _id: goalId,
        user: userId,
        status: "archived",
      }).session(session);

      if (!goal) {
        throw new AppError(
          "Only archived financial goals can be permanently deleted.",
          404,
        );
      }

      await GoalContribution.deleteMany({
        user: userId,
        goal: goalId,
      }).session(session);

      const deletionResult = await FinancialGoal.deleteOne({
        _id: goalId,
        user: userId,
        status: "archived",
      }).session(session);

      if (deletionResult.deletedCount !== 1) {
        throw new AppError("Financial goal could not be deleted.", 409);
      }
    });

    return {
      message: "Financial goal permanently deleted successfully.",
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    if (isTransactionUnsupported(error)) {
      throw new AppError(
        "Permanent deletion requires MongoDB transaction support.",
        503,
      );
    }

    throw error;
  } finally {
    await session.endSession();
  }
};

module.exports = {
  createFinancialGoal,
  getFinancialGoals,
  getFinancialGoalById,
  updateFinancialGoal,
  archiveFinancialGoal,
  restoreFinancialGoal,
  permanentlyDeleteFinancialGoal,
  toMinorUnits,
  fromMinorUnits,
  formatGoal,
};

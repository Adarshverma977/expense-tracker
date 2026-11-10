const mongoose = require("mongoose");

const FinancialGoal = require("../models/FinancialGoal");
const GoalContribution = require("../models/GoalContribution");

const AppError = require("../utils/AppError");

const {
  toMinorUnits,
  fromMinorUnits,
  formatGoal,
} = require("./financialGoalService");

// Convert and validate monetary amounts without floating-point arithmetic.
const parseContributionAmount = (value) => {
  if (
    typeof value !== "string" ||
    !/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(value)
  ) {
    throw new AppError(
      "Please provide a valid amount with up to 2 decimal places.",
      400,
    );
  }

  const amount = toMinorUnits(value);

  if (amount <= 0n || amount > 99999999999999n) {
    throw new AppError("Contribution amount is out of range.", 400);
  }

  return amount;
};

const createGoalContribution = async (userId, goalId, payload) => {
  const { type, amount: amountInput, note = "", date } = payload;

  const amount = parseContributionAmount(amountInput);

  if (!["deposit", "withdrawal"].includes(type)) {
    throw new AppError("Invalid contribution type.", 400);
  }

  const session = await mongoose.startSession();

  let result;

  try {
    await session.withTransaction(
      async () => {
        const goal = await FinancialGoal.findOne({
          _id: goalId,
          user: userId,
          status: { $in: ["active", "completed"] },
        }).session(session);

        if (!goal) {
          throw new AppError("Financial goal not found or unavailable.", 404);
        }

        const currentSaved = toMinorUnits(goal.savedAmount.toString());
        const target = toMinorUnits(goal.targetAmount.toString());

        let updatedSaved;

        if (type === "deposit") {
          updatedSaved = currentSaved + amount;
        } else {
          if (amount > currentSaved) {
            throw new AppError(
              "Withdrawal amount cannot exceed your saved balance.",
              400,
            );
          }

          updatedSaved = currentSaved - amount;
        }

        const isCompleted = updatedSaved >= target;

        const updatedGoal = await FinancialGoal.findOneAndUpdate(
          {
            _id: goal._id,
            user: userId,
            savedAmount: goal.savedAmount,
            status: { $in: ["active", "completed"] },
          },
          {
            $set: {
              savedAmount: mongoose.Types.Decimal128.fromString(
                fromMinorUnits(updatedSaved),
              ),
              status: isCompleted ? "completed" : "active",
              completedAt: isCompleted ? goal.completedAt || new Date() : null,
            },
          },
          {
            returnDocument: "after",
            runValidators: true,
            session,
          },
        );

        if (!updatedGoal) {
          throw new AppError("Goal balance changed. Please try again.", 409);
        }

        const [contribution] = await GoalContribution.create(
          [
            {
              user: userId,
              goal: goal._id,
              type,
              amount: mongoose.Types.Decimal128.fromString(
                fromMinorUnits(amount),
              ),
              note,
              date: date ? new Date(`${date}T00:00:00.000Z`) : new Date(),
            },
          ],
          { session },
        );

        result = {
          contribution: {
            _id: contribution._id,
            type: contribution.type,
            amount: contribution.amount.toString(),
            note: contribution.note,
            date: contribution.date,
            createdAt: contribution.createdAt,
          },
          goal: formatGoal(updatedGoal),
        };
      },
      {
        readPreference: "primary",
        readConcern: { level: "snapshot" },
        writeConcern: { w: "majority" },
      },
    );

    return result;
  } catch (error) {
    if (
      error.code === 20 ||
      error.codeName === "IllegalOperation" ||
      error.message?.includes("Transaction numbers are only allowed")
    ) {
      throw new AppError(
        "Savings updates require a transaction-capable MongoDB deployment. Configure MongoDB as a replica set.",
        503,
      );
    }

    throw error;
  } finally {
    await session.endSession();
  }
};

const getGoalContributions = async (
  userId,
  goalId,
  { page = 1, limit = 20, type } = {},
) => {
  const goal = await FinancialGoal.exists({
    _id: goalId,
    user: userId,
  });

  if (!goal) {
    throw new AppError("Financial goal not found.", 404);
  }

  const filter = {
    user: userId,
    goal: goalId,
  };

  if (type) {
    filter.type = type;
  }

  const skip = (page - 1) * limit;

  const [contributions, total] = await Promise.all([
    GoalContribution.find(filter)
      .sort({ date: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    GoalContribution.countDocuments(filter),
  ]);

  return {
    contributions: contributions.map((item) => ({
      _id: item._id,
      type: item.type,
      amount: item.amount.toString(),
      note: item.note,
      date: item.date,
      createdAt: item.createdAt,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1,
    },
  };
};

module.exports = {
  createGoalContribution,
  getGoalContributions,
};

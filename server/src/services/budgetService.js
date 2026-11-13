const mongoose = require("mongoose");

const Budget = require("../models/Budget");
const Transaction = require("../models/Transaction");
const Category = require("../models/Category");
const AppError = require("../utils/AppError");

// India reporting timezone: UTC +05:30.
const INDIA_UTC_OFFSET_MINUTES = 330;

/**
 * Convert a decimal amount into integer paise.
 * Uses BigInt to avoid floating-point precision errors.
 * Supports Decimal128 scientific notation.
 */
const toMinorUnits = (value) => {
  if (value === null || value === undefined) {
    throw new Error("Invalid monetary value received from database.");
  }

  const amount = value.toString().trim();

  const match = amount.match(/^([+-]?)(\d+)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/);

  if (!match) {
    throw new Error("Invalid monetary value received from database.");
  }

  const [, sign, whole, fraction = "", exponent = "0"] = match;

  const exponentValue = Number(exponent);

  if (!Number.isSafeInteger(exponentValue)) {
    throw new Error("Invalid monetary exponent.");
  }

  let digits = `${whole}${fraction}`;
  let scale = fraction.length - exponentValue;

  // Remove unnecessary leading zeros.
  digits = digits.replace(/^0+/, "") || "0";

  // Currency calculations support a maximum of 2 decimal places.
  if (scale > 2) {
    const extraDigits = scale - 2;

    if (extraDigits > digits.length) {
      if (digits !== "0") {
        throw new Error(
          "Monetary value contains unsupported decimal precision.",
        );
      }

      digits = "0";
    } else {
      if (!digits.endsWith("0".repeat(extraDigits))) {
        throw new Error(
          "Monetary value contains unsupported decimal precision.",
        );
      }

      digits = digits.slice(0, -extraDigits) || "0";
    }

    scale = 2;
  }

  const minorUnits = BigInt(digits) * 10n ** BigInt(2 - scale);

  return sign === "-" ? -minorUnits : minorUnits;
};

/**
 * Convert integer paise into a decimal string.
 */
const fromMinorUnits = (value) => {
  const negative = value < 0n;
  const absolute = negative ? -value : value;

  const whole = absolute / 100n;
  const fraction = (absolute % 100n).toString().padStart(2, "0");

  return `${negative ? "-" : ""}${whole}.${fraction}`;
};

/**
 * Calculate monthly boundaries using Asia/Kolkata timezone.
 * The end date is exclusive.
 */
const getMonthDateRange = (year, month) => {
  const offsetMilliseconds = INDIA_UTC_OFFSET_MINUTES * 60 * 1000;

  const startDate = new Date(Date.UTC(year, month - 1, 1) - offsetMilliseconds);

  const endDate = new Date(Date.UTC(year, month, 1) - offsetMilliseconds);

  return { startDate, endDate };
};

/**
 * Validate an active expense category and ownership.
 * Supports both default and user-owned custom categories.
 */
const validateExpenseCategory = async (userId, categoryId) => {
  if (!mongoose.isValidObjectId(categoryId)) {
    throw new AppError("Invalid category ID.", 400);
  }

  const category = await Category.findOne({
    _id: categoryId,
    type: "expense",
    isActive: true,
    $or: [{ isDefault: true }, { user: userId, isDefault: false }],
  }).lean();

  if (!category) {
    throw new AppError(
      "Expense category not found, inactive, or unavailable.",
      400,
    );
  }

  return category;
};

/**
 * Ensure every budget has a valid populated category.
 * Prevents crashes caused by dangling category references.
 */
const ensureBudgetCategoriesExist = (budgets) => {
  const hasMissingCategory = budgets.some((budget) => !budget.category);

  if (hasMissingCategory) {
    throw new AppError(
      "One or more budget categories no longer exist. Please contact support.",
      409,
    );
  }
};

/**
 * Format a budget with calculated spending information.
 */
const formatBudget = (budget, spending = 0n) => {
  const data = budget.toObject ? budget.toObject() : budget;

  const budgetAmount = toMinorUnits(data.amount.toString());

  const remainingAmount = budgetAmount - spending;

  const utilizationPercentage =
    budgetAmount === 0n ? 0 : Number((spending * 10000n) / budgetAmount) / 100;

  let status = "safe";

  if (spending >= budgetAmount) {
    status = "exceeded";
  } else if (spending * 100n >= budgetAmount * 80n) {
    status = "warning";
  }

  return {
    ...data,
    amount: fromMinorUnits(budgetAmount),
    spentAmount: fromMinorUnits(spending),
    remainingAmount: fromMinorUnits(remainingAmount),
    utilizationPercentage,
    status,
  };
};

// CREATE BUDGET
const createBudget = async (userId, budgetData) => {
  const { category, amount, month, year } = budgetData;

  await validateExpenseCategory(userId, category);

  try {
    const budget = await Budget.create({
      user: userId,
      category,
      amount: mongoose.Types.Decimal128.fromString(amount),
      month,
      year,
    });

    return formatBudget(budget);
  } catch (error) {
    if (error.code === 11000) {
      throw new AppError(
        "A budget already exists for this category and month.",
        409,
      );
    }

    throw error;
  }
};

// GET MONTHLY BUDGETS
const getBudgets = async (userId, filters) => {
  const { month, year } = filters;

  const budgets = await Budget.find({
    user: userId,
    month,
    year,
  })
    .populate("category", "name type icon color isDefault isActive")
    .sort({ createdAt: 1, _id: 1 })
    .lean();

  if (budgets.length === 0) {
    return {
      budgets: [],
      summary: {
        totalBudget: "0.00",
        totalSpent: "0.00",
        totalRemaining: "0.00",
        utilizationPercentage: 0,
        status: "safe",
      },
    };
  }

  ensureBudgetCategoriesExist(budgets);

  const categoryIds = budgets.map((budget) => budget.category._id);

  const { startDate, endDate } = getMonthDateRange(year, month);

  // Aggregate actual expense transactions for budget categories.
  const spendingResults = await Transaction.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        type: "expense",
        category: { $in: categoryIds },
        date: {
          $gte: startDate,
          $lt: endDate,
        },
      },
    },
    {
      $group: {
        _id: "$category",
        totalSpent: {
          $sum: "$amount",
        },
      },
    },
  ]);

  const spendingMap = new Map(
    spendingResults.map((item) => [
      item._id.toString(),
      toMinorUnits(item.totalSpent.toString()),
    ]),
  );

  let totalBudget = 0n;
  let totalSpent = 0n;

  const formattedBudgets = budgets.map((budget) => {
    const spending = spendingMap.get(budget.category._id.toString()) || 0n;

    const budgetAmount = toMinorUnits(budget.amount.toString());

    totalBudget += budgetAmount;
    totalSpent += spending;

    return formatBudget(budget, spending);
  });

  const totalRemaining = totalBudget - totalSpent;

  const utilizationPercentage =
    totalBudget === 0n ? 0 : Number((totalSpent * 10000n) / totalBudget) / 100;

  let summaryStatus = "safe";

  if (totalSpent >= totalBudget && totalBudget > 0n) {
    summaryStatus = "exceeded";
  } else if (totalBudget > 0n && totalSpent * 100n >= totalBudget * 80n) {
    summaryStatus = "warning";
  }

  return {
    budgets: formattedBudgets,
    summary: {
      totalBudget: fromMinorUnits(totalBudget),
      totalSpent: fromMinorUnits(totalSpent),
      totalRemaining: fromMinorUnits(totalRemaining),
      utilizationPercentage,
      status: summaryStatus,
    },
  };
};

// GET SINGLE BUDGET
const getBudgetById = async (userId, budgetId) => {
  if (!mongoose.isValidObjectId(budgetId)) {
    throw new AppError("Invalid budget ID.", 400);
  }

  const budget = await Budget.findOne({
    _id: budgetId,
    user: userId,
  })
    .populate("category", "name type icon color isDefault isActive")
    .lean();

  if (!budget) {
    throw new AppError("Budget not found.", 404);
  }

  ensureBudgetCategoriesExist([budget]);

  const { startDate, endDate } = getMonthDateRange(budget.year, budget.month);

  const spendingResult = await Transaction.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        category: budget.category._id,
        type: "expense",
        date: {
          $gte: startDate,
          $lt: endDate,
        },
      },
    },
    {
      $group: {
        _id: null,
        totalSpent: { $sum: "$amount" },
      },
    },
  ]);

  const spending = spendingResult.length
    ? toMinorUnits(spendingResult[0].totalSpent.toString())
    : 0n;

  return formatBudget(budget, spending);
};

// UPDATE BUDGET
const updateBudget = async (userId, budgetId, updates) => {
  if (!mongoose.isValidObjectId(budgetId)) {
    throw new AppError("Invalid budget ID.", 400);
  }

  if (!updates || typeof updates.amount !== "string") {
    throw new AppError("A valid budget amount is required.", 400);
  }

  const budget = await Budget.findOne({
    _id: budgetId,
    user: userId,
  });

  if (!budget) {
    throw new AppError("Budget not found.", 404);
  }

  budget.amount = mongoose.Types.Decimal128.fromString(updates.amount);

  await budget.save();

  return getBudgetById(userId, budgetId);
};

// DELETE BUDGET
const deleteBudget = async (userId, budgetId) => {
  if (!mongoose.isValidObjectId(budgetId)) {
    throw new AppError("Invalid budget ID.", 400);
  }

  const budget = await Budget.findOneAndDelete({
    _id: budgetId,
    user: userId,
  });

  if (!budget) {
    throw new AppError("Budget not found.", 404);
  }

  return {
    message: "Budget deleted successfully.",
  };
};

module.exports = {
  createBudget,
  getBudgets,
  getBudgetById,
  updateBudget,
  deleteBudget,
};

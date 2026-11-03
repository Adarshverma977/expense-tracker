const mongoose = require("mongoose");

const Transaction = require("../models/Transaction");
const AppError = require("../utils/AppError");

const ZERO = mongoose.Types.Decimal128.fromString("0.00");

const getDashboardStats = async (userId) => {
  if (!mongoose.isValidObjectId(userId)) {
    throw new AppError("Invalid user ID.", 400);
  }

  const userObjectId = new mongoose.Types.ObjectId(userId);

  const now = new Date();

  // Current month boundaries
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  // Last 6 months boundaries
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [
    summaryResult,
    monthlyResult,
    categoryBreakdown,
    monthlyTrends,
    recentTransactions,
  ] = await Promise.all([
    // 1. ALL-TIME FINANCIAL SUMMARY
    Transaction.aggregate([
      {
        $match: {
          user: userObjectId,
        },
      },
      {
        $group: {
          _id: null,

          totalIncome: {
            $sum: {
              $cond: [{ $eq: ["$type", "income"] }, "$amount", ZERO],
            },
          },

          totalExpenses: {
            $sum: {
              $cond: [{ $eq: ["$type", "expense"] }, "$amount", ZERO],
            },
          },

          totalTransactions: {
            $sum: 1,
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalIncome: 1,
          totalExpenses: 1,
          totalTransactions: 1,
          balance: {
            $subtract: ["$totalIncome", "$totalExpenses"],
          },
        },
      },
    ]),

    // 2. CURRENT MONTH SUMMARY
    Transaction.aggregate([
      {
        $match: {
          user: userObjectId,
          date: {
            $gte: currentMonthStart,
            $lt: nextMonthStart,
          },
        },
      },
      {
        $group: {
          _id: null,

          monthlyIncome: {
            $sum: {
              $cond: [{ $eq: ["$type", "income"] }, "$amount", ZERO],
            },
          },

          monthlyExpenses: {
            $sum: {
              $cond: [{ $eq: ["$type", "expense"] }, "$amount", ZERO],
            },
          },

          incomeCount: {
            $sum: {
              $cond: [{ $eq: ["$type", "income"] }, 1, 0],
            },
          },

          expenseCount: {
            $sum: {
              $cond: [{ $eq: ["$type", "expense"] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          monthlyIncome: 1,
          monthlyExpenses: 1,
          incomeCount: 1,
          expenseCount: 1,
          monthlyBalance: {
            $subtract: ["$monthlyIncome", "$monthlyExpenses"],
          },
        },
      },
    ]),

    // 3. EXPENSE CATEGORY BREAKDOWN
    Transaction.aggregate([
      {
        $match: {
          user: userObjectId,
          type: "expense",
          date: {
            $gte: currentMonthStart,
            $lt: nextMonthStart,
          },
        },
      },
      {
        $group: {
          _id: "$category",

          totalAmount: {
            $sum: "$amount",
          },

          transactionCount: {
            $sum: 1,
          },
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "category",
        },
      },
      {
        $unwind: "$category",
      },
      {
        $project: {
          _id: 0,
          categoryId: "$category._id",
          name: "$category.name",
          icon: "$category.icon",
          color: "$category.color",
          totalAmount: 1,
          transactionCount: 1,
        },
      },
      {
        $sort: {
          totalAmount: -1,
        },
      },
    ]),

    // 4. LAST 6 MONTHS INCOME VS EXPENSES
    Transaction.aggregate([
      {
        $match: {
          user: userObjectId,
          date: {
            $gte: sixMonthsAgo,
            $lt: nextMonthStart,
          },
        },
      },
      {
        $group: {
          _id: {
            year: {
              $year: "$date",
            },
            month: {
              $month: "$date",
            },
          },

          income: {
            $sum: {
              $cond: [{ $eq: ["$type", "income"] }, "$amount", ZERO],
            },
          },

          expenses: {
            $sum: {
              $cond: [{ $eq: ["$type", "expense"] }, "$amount", ZERO],
            },
          },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
        },
      },
    ]),

    // 5. RECENT 5 TRANSACTIONS
    Transaction.find({
      user: userObjectId,
    })
      .populate("category", "name type icon color")
      .sort({
        date: -1,
        _id: -1,
      })
      .limit(5)
      .lean(),
  ]);

  // Convert Decimal128 values into JSON-safe strings
  const formatAmount = (value) => (value ? value.toString() : "0.00");

  // All-time summary defaults
  const summary = summaryResult[0] || {
    totalIncome: ZERO,
    totalExpenses: ZERO,
    totalTransactions: 0,
    balance: ZERO,
  };

  // Current month defaults
  const monthly = monthlyResult[0] || {
    monthlyIncome: ZERO,
    monthlyExpenses: ZERO,
    incomeCount: 0,
    expenseCount: 0,
    monthlyBalance: ZERO,
  };

  // Format monthly trend values
  const trendMap = new Map(
    monthlyTrends.map((item) => [`${item._id.year}-${item._id.month}`, item]),
  );

  const trends = [];

  for (let i = 0; i < 6; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);

    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    const item = trendMap.get(`${year}-${month}`);

    trends.push({
      year,
      month,
      income: formatAmount(item?.income),
      expenses: formatAmount(item?.expenses),
    });
  }

  // Format recent transactions
  const formattedRecentTransactions = recentTransactions.map((transaction) => ({
    ...transaction,
    amount: formatAmount(transaction.amount),
  }));

  return {
    summary: {
      totalIncome: formatAmount(summary.totalIncome),
      totalExpenses: formatAmount(summary.totalExpenses),
      balance: formatAmount(summary.balance),
      totalTransactions: summary.totalTransactions,
    },

    monthly: {
      income: formatAmount(monthly.monthlyIncome),
      expenses: formatAmount(monthly.monthlyExpenses),
      balance: formatAmount(monthly.monthlyBalance),
      incomeCount: monthly.incomeCount,
      expenseCount: monthly.expenseCount,
    },

    categoryBreakdown: categoryBreakdown.map((item) => ({
      ...item,
      totalAmount: formatAmount(item.totalAmount),
    })),

    monthlyTrends: trends,

    recentTransactions: formattedRecentTransactions,
  };
};

module.exports = {
  getDashboardStats,
};

const mongoose = require("mongoose");

const isValidBudgetAmount = (value) => {
  if (!value) return false;

  const amountString = value.toString().trim();

  const match = amountString.match(
    /^([+-]?)(\d+)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/,
  );

  if (!match) return false;

  const [, sign, whole, fraction = "", exponent = "0"] = match;

  // Budget amounts must be positive.
  if (sign === "-") return false;

  let digits = `${whole}${fraction}`;
  let scale = fraction.length - Number(exponent);

  // Reject zero amounts.
  if (!/[1-9]/.test(digits)) return false;

  // Remove unnecessary leading zeros.
  digits = digits.replace(/^0+/, "") || "0";

  // Currency supports a maximum of two decimal places.
  if (scale > 2) {
    const extraDigits = scale - 2;

    if (extraDigits > digits.length) return false;

    if (!digits.endsWith("0".repeat(extraDigits))) {
      return false;
    }

    digits = digits.slice(0, -extraDigits) || "0";
    scale = 2;
  }

  return true;
};

const budgetSchema = new mongoose.Schema(
  {
    // Budget owner
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Budget user is required"],
    },

    // Expense category
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Budget category is required"],
    },

    // Allocated budget amount
    amount: {
      type: mongoose.Schema.Types.Decimal128,
      required: [true, "Budget amount is required"],
      validate: {
        validator: isValidBudgetAmount,
        message:
          "Budget amount must be positive and have at most 2 decimal places",
      },
    },

    // Budget month: 1 to 12
    month: {
      type: Number,
      required: [true, "Budget month is required"],
      min: [1, "Month must be between 1 and 12"],
      max: [12, "Month must be between 1 and 12"],
      validate: {
        validator: Number.isInteger,
        message: "Month must be an integer",
      },
    },

    // Budget year
    year: {
      type: Number,
      required: [true, "Budget year is required"],
      min: [2000, "Invalid budget year"],
      max: [9999, "Invalid budget year"],
      validate: {
        validator: Number.isInteger,
        message: "Year must be an integer",
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Prevent duplicate budgets for the same user,
// category, month and year.
budgetSchema.index(
  {
    user: 1,
    category: 1,
    month: 1,
    year: 1,
  },
  {
    unique: true,
    name: "unique_user_category_month_year",
  },
);

// Efficient monthly budget lookup.
budgetSchema.index(
  {
    user: 1,
    year: 1,
    month: 1,
  },
  {
    name: "user_monthly_budgets",
  },
);

const Budget = mongoose.model("Budget", budgetSchema);

module.exports = Budget;

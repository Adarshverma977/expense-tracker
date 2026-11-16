const mongoose = require("mongoose");

const MAX_BUDGET_AMOUNT_MINOR_UNITS = 999999999999999n;

const isValidBudgetAmount = (value) => {
  if (value === null || value === undefined) return false;

  const amountString = value.toString().trim();

  const match = amountString.match(
    /^([+-]?)(\d+)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/,
  );

  if (!match) return false;

  const [, sign, whole, fraction = "", exponent = "0"] = match;

  if (sign === "-") return false;

  const exponentValue = Number(exponent);

  if (!Number.isSafeInteger(exponentValue)) return false;

  let digits = `${whole}${fraction}`;
  let scale = fraction.length - exponentValue;

  if (!/[1-9]/.test(digits)) return false;

  digits = digits.replace(/^0+/, "") || "0";

  if (scale > 2) {
    const extraDigits = scale - 2;

    if (extraDigits > digits.length) return false;

    if (!digits.endsWith("0".repeat(extraDigits))) {
      return false;
    }

    digits = digits.slice(0, -extraDigits) || "0";
    scale = 2;
  }

  if (scale < 2) {
    const additionalZeros = 2 - scale;

    if (digits.length + additionalZeros > 15) return false;

    digits += "0".repeat(additionalZeros);
  }

  if (digits.length > 15) return false;

  const amountInMinorUnits = BigInt(digits);

  return (
    amountInMinorUnits > 0n &&
    amountInMinorUnits <= MAX_BUDGET_AMOUNT_MINOR_UNITS
  );
};

const budgetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Budget user is required"],
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Budget category is required"],
    },

    amount: {
      type: mongoose.Schema.Types.Decimal128,
      required: [true, "Budget amount is required"],
      validate: {
        validator: isValidBudgetAmount,
        message:
          "Budget amount must be positive, within the maximum limit, and have at most 2 decimal places.",
      },
    },

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

const mongoose = require("mongoose");

const MAX_AMOUNT_IN_PAISE = 99999999999999n;

// Converts a decimal amount into paise without floating-point arithmetic.
const toPaise = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  const amount = value.toString().trim();

  // Allow only non-negative amounts with up to 2 decimal places.
  if (!/^\d+(?:\.\d{1,2})?$/.test(amount)) {
    return null;
  }

  const [wholePart, decimalPart = ""] = amount.split(".");
  const paise = BigInt(wholePart) * 100n + BigInt(decimalPart.padEnd(2, "0"));

  if (paise > MAX_AMOUNT_IN_PAISE) {
    return null;
  }

  return paise;
};

const financialGoalSchema = new mongoose.Schema(
  {
    // Goal owner
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Goal user is required"],
      index: true,
    },

    // Goal title
    title: {
      type: String,
      required: [true, "Goal title is required"],
      trim: true,
      minlength: [2, "Goal title must contain at least 2 characters"],
      maxlength: [100, "Goal title cannot exceed 100 characters"],
    },

    // Optional goal description
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
      default: "",
    },

    // Target savings amount
    targetAmount: {
      type: mongoose.Schema.Types.Decimal128,
      required: [true, "Target amount is required"],
      validate: {
        validator: function (value) {
          const paise = toPaise(value);
          return paise !== null && paise > 0n;
        },
        message:
          "Target amount must be positive, within the allowed limit, and have at most 2 decimal places",
      },
    },

    // Current saved amount
    savedAmount: {
      type: mongoose.Schema.Types.Decimal128,
      default: () => mongoose.Types.Decimal128.fromString("0.00"),
      validate: {
        validator: function (value) {
          return toPaise(value) !== null;
        },
        message:
          "Saved amount must be non-negative, within the allowed limit, and have at most 2 decimal places",
      },
    },

    // Goal deadline
    targetDate: {
      type: Date,
      required: [true, "Target date is required"],
    },

    // Goal icon identifier
    icon: {
      type: String,
      trim: true,
      default: "target",
      maxlength: [50, "Icon identifier cannot exceed 50 characters"],
    },

    // Goal theme color
    color: {
      type: String,
      default: "#176B45",
      match: [/^#[0-9A-Fa-f]{6}$/, "Please provide a valid hexadecimal color"],
    },

    // Goal lifecycle
    status: {
      type: String,
      enum: ["active", "completed", "archived"],
      default: "active",
    },

    completedAt: {
      type: Date,
      default: null,
    },

    archivedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Efficient user goal listing
financialGoalSchema.index(
  { user: 1, status: 1, createdAt: -1 },
  { name: "user_financial_goals" },
);

// Efficient deadline-based queries
financialGoalSchema.index(
  { user: 1, targetDate: 1 },
  { name: "user_goal_deadlines" },
);

const FinancialGoal = mongoose.model("FinancialGoal", financialGoalSchema);

module.exports = FinancialGoal;

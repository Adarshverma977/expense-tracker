const mongoose = require("mongoose");

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
          if (!value) return false;

          const amount = Number(value.toString());

          return (
            Number.isFinite(amount) &&
            amount > 0 &&
            amount <= 999999999999.99 &&
            Number.isInteger(amount * 100)
          );
        },
        message:
          "Target amount must be positive and have at most 2 decimal places",
      },
    },

    // Current saved amount
    savedAmount: {
      type: mongoose.Schema.Types.Decimal128,
      default: () => mongoose.Types.Decimal128.fromString("0.00"),
      validate: {
        validator: function (value) {
          if (!value) return false;

          const amount = Number(value.toString());

          return (
            Number.isFinite(amount) &&
            amount >= 0 &&
            amount <= 999999999999.99 &&
            Number.isInteger(amount * 100)
          );
        },
        message: "Saved amount must be non-negative and valid",
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

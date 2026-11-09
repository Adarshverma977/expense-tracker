const mongoose = require("mongoose");

const goalContributionSchema = new mongoose.Schema(
  {
    // Contribution owner
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Contribution user is required"],
    },

    // Related financial goal
    goal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FinancialGoal",
      required: [true, "Financial goal is required"],
    },

    // Contribution type
    type: {
      type: String,
      enum: ["deposit", "withdrawal"],
      required: [true, "Contribution type is required"],
    },

    // Contribution amount
    amount: {
      type: mongoose.Schema.Types.Decimal128,
      required: [true, "Contribution amount is required"],
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
          "Contribution amount must be positive and have at most 2 decimal places",
      },
    },

    // Optional contribution note
    note: {
      type: String,
      trim: true,
      maxlength: [300, "Contribution note cannot exceed 300 characters"],
      default: "",
    },

    // Contribution date
    date: {
      type: Date,
      required: [true, "Contribution date is required"],
      default: Date.now,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Efficient goal contribution history
goalContributionSchema.index(
  { user: 1, goal: 1, date: -1, _id: -1 },
  { name: "user_goal_contribution_history" },
);

// Efficient contribution type filtering
goalContributionSchema.index(
  { goal: 1, type: 1, date: -1 },
  { name: "goal_contribution_type_history" },
);

const GoalContribution = mongoose.model(
  "GoalContribution",
  goalContributionSchema,
);

module.exports = GoalContribution;

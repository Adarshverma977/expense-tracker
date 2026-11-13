const mongoose = require("mongoose");

const MAX_AMOUNT_IN_PAISE = 99999999999999n;

const toPaise = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  const amount = value.toString().trim();

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
          const paise = toPaise(value);
          return paise !== null && paise > 0n;
        },
        message:
          "Contribution amount must be positive, within the allowed limit, and have at most 2 decimal places",
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

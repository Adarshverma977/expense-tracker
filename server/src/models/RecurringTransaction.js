const mongoose = require("mongoose");

const recurringTransactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Recurring transaction user is required"],
      index: true,
    },

    title: {
      type: String,
      required: [true, "Transaction title is required"],
      trim: true,
      minlength: [2, "Transaction title must be at least 2 characters"],
      maxlength: [100, "Transaction title cannot exceed 100 characters"],
    },

    amount: {
      type: mongoose.Schema.Types.Decimal128,
      required: [true, "Transaction amount is required"],
      validate: {
        validator: function (value) {
          const amount = Number(value.toString());

          return (
            Number.isFinite(amount) &&
            amount > 0 &&
            /^\d+(\.\d{1,2})?$/.test(value.toString())
          );
        },
        message: "Amount must be positive and have at most 2 decimal places",
      },
    },

    type: {
      type: String,
      enum: ["income", "expense"],
      required: [true, "Transaction type is required"],
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Transaction category is required"],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
      default: "",
    },

    paymentMethod: {
      type: String,
      enum: ["cash", "upi", "card", "bank_transfer", "other"],
      default: "other",
    },

    frequency: {
      type: String,
      enum: ["daily", "weekly", "monthly", "yearly"],
      required: [true, "Recurrence frequency is required"],
    },

    startDate: {
      type: Date,
      required: [true, "Schedule start date is required"],
    },

    nextRunDate: {
      type: Date,
      required: [true, "Next execution date is required"],
    },

    endDate: {
      type: Date,
      default: null,
    },

    lastRunDate: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: ["active", "paused", "cancelled", "completed"],
      default: "active",
    },

    pausedAt: {
      type: Date,
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    // Scheduler ownership and concurrency control.
    lockedUntil: {
      type: Date,
      default: null,
    },

    lockToken: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Efficient user-specific recurring transaction queries.
recurringTransactionSchema.index({
  user: 1,
  createdAt: -1,
});

// Efficient scheduler query for due active schedules.
recurringTransactionSchema.index({
  status: 1,
  nextRunDate: 1,
});

// Efficient user-specific status filtering.
recurringTransactionSchema.index({
  user: 1,
  status: 1,
  nextRunDate: 1,
});

// Validate schedule dates.
recurringTransactionSchema.pre("validate", function () {
  if (this.endDate && this.startDate && this.endDate < this.startDate) {
    this.invalidate("endDate", "End date cannot be before the start date.");
  }

  if (this.startDate && this.nextRunDate && this.nextRunDate < this.startDate) {
    this.invalidate(
      "nextRunDate",
      "Next execution date cannot be before the start date.",
    );
  }
});

const RecurringTransaction = mongoose.model(
  "RecurringTransaction",
  recurringTransactionSchema,
);

module.exports = RecurringTransaction;

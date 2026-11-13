const mongoose = require("mongoose");

const recurringTransactionExecutionSchema = new mongoose.Schema(
  {
    recurringTransaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RecurringTransaction",
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    scheduledFor: {
      type: Date,
      required: true,
    },

    // Unique key for one schedule occurrence.
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // Generated financial transaction reference.
    transaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
      default: null,
    },

    status: {
      type: String,
      enum: ["processing", "completed", "failed"],
      default: "failed",
      required: true,
    },

    attempts: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
      validate: {
        validator: Number.isInteger,
        message: "Execution attempts must be an integer.",
      },
    },

    lastError: {
      type: String,
      default: null,
      maxlength: 1000,
    },

    processedAt: {
      type: Date,
      default: null,
    },

    // Execution worker ownership.
    lockToken: {
      type: String,
      default: null,
    },

    // Execution worker lease expiry.
    lockedUntil: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// One schedule occurrence can have only one execution record.
recurringTransactionExecutionSchema.index(
  {
    recurringTransaction: 1,
    scheduledFor: 1,
  },
  {
    unique: true,
  },
);

// Efficient execution status and recovery queries.
recurringTransactionExecutionSchema.index({
  status: 1,
  updatedAt: 1,
});

// Efficient expired execution lock lookup.
recurringTransactionExecutionSchema.index({
  status: 1,
  lockedUntil: 1,
});

const RecurringTransactionExecution = mongoose.model(
  "RecurringTransactionExecution",
  recurringTransactionExecutionSchema,
);

module.exports = RecurringTransactionExecution;

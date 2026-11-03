const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Transaction user is required"],
      index: true,
    },

    title: {
      type: String,
      required: [true, "Transaction title is required"],
      trim: true,
      minlength: [2, "Title must be at least 2 characters"],
      maxlength: [100, "Title cannot exceed 100 characters"],
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
      enum: {
        values: ["income", "expense"],
        message: "Transaction type must be income or expense",
      },
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

    date: {
      type: Date,
      required: [true, "Transaction date is required"],
      default: Date.now,
    },

    paymentMethod: {
      type: String,
      enum: {
        values: ["cash", "upi", "card", "bank_transfer", "other"],
        message: "Invalid payment method",
      },
      default: "other",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Efficient user transaction queries and sorting.
transactionSchema.index({
  user: 1,
  date: -1,
  _id: -1,
});

// Efficient filtering by transaction type.
transactionSchema.index({
  user: 1,
  type: 1,
  date: -1,
});

// Efficient category-based transaction queries.
transactionSchema.index({
  user: 1,
  category: 1,
  date: -1,
});

const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;

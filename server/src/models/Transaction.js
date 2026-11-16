const mongoose = require("mongoose");

const isValidTransactionAmount = (value) => {
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
  }

  return true;
};

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
      minlength: [2, "Transaction title must be at least 2 characters"],
      maxlength: [100, "Transaction title cannot exceed 100 characters"],
    },

    amount: {
      type: mongoose.Schema.Types.Decimal128,
      required: [true, "Transaction amount is required"],
      validate: {
        validator: isValidTransactionAmount,
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

    recurrenceKey: {
      type: String,
      default: undefined,
    },

    csvImportKey: {
      type: String,
      default: undefined,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

transactionSchema.index({
  user: 1,
  date: -1,
  _id: -1,
});

transactionSchema.index({
  user: 1,
  type: 1,
  date: -1,
});

transactionSchema.index({
  user: 1,
  category: 1,
  date: -1,
});

transactionSchema.index(
  { recurrenceKey: 1 },
  {
    unique: true,
    partialFilterExpression: {
      recurrenceKey: { $type: "string" },
    },
  },
);

transactionSchema.index(
  { user: 1, csvImportKey: 1 },
  {
    unique: true,
    partialFilterExpression: {
      csvImportKey: { $type: "string" },
    },
  },
);

const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;

const mongoose = require("mongoose");

const MAX_AMOUNT_PAISE = 99999999999999n;

const PAYMENT_STATUSES = ["completed", "reversed"];

const billPaymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
    },

    bill: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bill",
      required: true,
      immutable: true,
    },

    billDueDate: {
      type: Date,
      required: true,
      immutable: true,
    },

    transaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
      required: true,
      immutable: true,
    },

    wallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
      required: true,
      immutable: true,
    },

    amount: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      immutable: true,
      validate: {
        validator(value) {
          if (!value) return false;

          const amount = value.toString();

          if (!/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(amount)) {
            return false;
          }

          const [whole, fraction = ""] = amount.split(".");
          const minorUnits = BigInt(whole + fraction.padEnd(2, "0"));

          return minorUnits > 0n && minorUnits <= MAX_AMOUNT_PAISE;
        },
        message:
          "Payment amount must be positive and within the allowed limit.",
      },
    },

    paidAt: {
      type: Date,
      required: true,
      immutable: true,
    },

    status: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: "completed",
      required: true,
    },

    idempotencyKey: {
      type: String,
      required: true,
      trim: true,
      minlength: 8,
      maxlength: 200,
      immutable: true,
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

billPaymentSchema.index(
  {
    user: 1,
    idempotencyKey: 1,
  },
  {
    unique: true,
  },
);

billPaymentSchema.index(
  {
    user: 1,
    transaction: 1,
  },
  {
    unique: true,
  },
);

billPaymentSchema.index({
  user: 1,
  bill: 1,
  billDueDate: 1,
  status: 1,
});

billPaymentSchema.index({
  user: 1,
  bill: 1,
  paidAt: -1,
  _id: -1,
});

billPaymentSchema.index({
  user: 1,
  wallet: 1,
  paidAt: -1,
});

module.exports = mongoose.model("BillPayment", billPaymentSchema);

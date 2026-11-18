const mongoose = require("mongoose");

const BILL_FREQUENCIES = [
  "one_time",
  "weekly",
  "monthly",
  "quarterly",
  "yearly",
];

const BILL_STATUSES = ["active", "paused", "paid", "archived"];

const MAX_AMOUNT_PAISE = 99999999999999n;

const billSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    payee: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    amount: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
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
        message: "Bill amount must be positive and within the allowed limit.",
      },
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    wallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
      default: null,
    },

    frequency: {
      type: String,
      enum: BILL_FREQUENCIES,
      default: "one_time",
      required: true,
    },

    dueDate: {
      type: Date,
      required: true,
    },

    nextDueDate: {
      type: Date,
      default: null,
    },

    lastPaidAt: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: BILL_STATUSES,
      default: "active",
      required: true,
    },

    reminderDays: {
      type: [Number],
      default: [7, 3, 1],
      validate: {
        validator(values) {
          return (
            Array.isArray(values) &&
            values.every(
              (value) => Number.isInteger(value) && value >= 0 && value <= 30,
            ) &&
            new Set(values).size === values.length
          );
        },
        message: "Reminder days must be unique integers between 0 and 30.",
      },
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
  },
  {
    timestamps: true,
    versionKey: true,
  },
);

billSchema.index({
  user: 1,
  status: 1,
  nextDueDate: 1,
});

billSchema.index({
  user: 1,
  dueDate: -1,
});

billSchema.index({
  user: 1,
  category: 1,
});

billSchema.pre("validate", function () {
  if (this.frequency === "one_time") {
    this.nextDueDate = null;
  }
});

module.exports = mongoose.model("Bill", billSchema);

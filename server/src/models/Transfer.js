const mongoose = require("mongoose");

const transferSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    fromWallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
      required: true,
    },

    toWallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
      required: true,
    },

    amount: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      validate: {
        validator(value) {
          if (!value) return false;

          const amount = value.toString();

          if (!/^\d+(?:\.\d{1,2})?$/.test(amount)) {
            return false;
          }

          const [whole, decimal = ""] = amount.split(".");
          const minorUnits = BigInt(whole + decimal.padEnd(2, "0"));

          return minorUnits > 0n && minorUnits <= 99999999999999n;
        },
        message:
          "Transfer amount must be positive and within the allowed range.",
      },
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    date: {
      type: Date,
      required: true,
      default: Date.now,
    },

    idempotencyKey: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

transferSchema.pre("validate", function () {
  if (
    this.fromWallet &&
    this.toWallet &&
    this.fromWallet.equals(this.toWallet)
  ) {
    this.invalidate(
      "toWallet",
      "Source and destination wallets must be different.",
    );
  }
});

transferSchema.index({ user: 1, idempotencyKey: 1 }, { unique: true });

transferSchema.index({ user: 1, date: -1, _id: -1 });

transferSchema.index({ user: 1, fromWallet: 1, date: -1 });

transferSchema.index({ user: 1, toWallet: 1, date: -1 });

const Transfer = mongoose.model("Transfer", transferSchema);

module.exports = Transfer;

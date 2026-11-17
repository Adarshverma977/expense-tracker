const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Wallet name is required."],
      trim: true,
      minlength: [2, "Wallet name must contain at least 2 characters."],
      maxlength: [60, "Wallet name cannot exceed 60 characters."],
    },
    type: {
      type: String,
      enum: ["cash", "bank", "savings", "credit_card"],
      required: [true, "Wallet type is required."],
    },
    institution: {
      type: String,
      trim: true,
      maxlength: [100, "Institution name cannot exceed 100 characters."],
      default: "",
    },
    currency: {
      type: String,
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 3,
      default: "INR",
    },
    creditLimit: {
      type: mongoose.Schema.Types.Decimal128,
      default: null,
    },
    lastFourDigits: {
      type: String,
      trim: true,
      match: [/^\d{4}$/, "Last four digits must contain exactly 4 digits."],
      default: null,
    },
    icon: {
      type: String,
      trim: true,
      maxlength: 50,
      default: "wallet",
    },
    color: {
      type: String,
      trim: true,
      maxlength: 30,
      default: "emerald",
    },
    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

walletSchema.pre("validate", function () {
  if (this.type === "credit_card") {
    if (!this.creditLimit) {
      this.invalidate(
        "creditLimit",
        "Credit limit is required for credit card wallets.",
      );
    } else {
      const creditLimit = this.creditLimit.toString();

      if (!/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(creditLimit)) {
        this.invalidate(
          "creditLimit",
          "Credit limit must be a valid positive amount with at most 2 decimal places.",
        );
      } else if (
        BigInt(
          creditLimit
            .replace(".", "")
            .padEnd(
              creditLimit.includes(".")
                ? creditLimit.split(".")[0].length + 2
                : creditLimit.length + 2,
              "0",
            ),
        ) <= 0n
      ) {
        this.invalidate(
          "creditLimit",
          "Credit limit must be greater than zero.",
        );
      }
    }
  } else if (this.creditLimit !== null && this.creditLimit !== undefined) {
    this.invalidate(
      "creditLimit",
      "Credit limit is only allowed for credit card wallets.",
    );
  }
});

walletSchema.index({ user: 1, status: 1, createdAt: -1 });
walletSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Wallet", walletSchema);

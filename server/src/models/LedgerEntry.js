const mongoose = require("mongoose");

const MAX_AMOUNT_PAISE = 99999999999999n;

const ENTRY_TYPES = [
  "opening_balance",
  "income",
  "expense",
  "transfer",
  "refund",
  "card_payment",
  "reversal",
];

const SOURCE_TYPES = [
  "transaction",
  "transfer",
  "recurring",
  "opening_balance",
  "csv_import",
  "goal_contribution",
];

const ledgerEntrySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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

          if (!/^-?(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(amount)) {
            return false;
          }

          const absoluteAmount = amount.startsWith("-")
            ? amount.slice(1)
            : amount;

          const [whole, fraction = ""] = absoluteAmount.split(".");
          const minorUnits = BigInt(whole + fraction.padEnd(2, "0"));

          return minorUnits > 0n && minorUnits <= MAX_AMOUNT_PAISE;
        },
        message: "Ledger amount must be non-zero and within the allowed limit.",
      },
    },
    entryType: {
      type: String,
      enum: ENTRY_TYPES,
      required: true,
      immutable: true,
    },
    sourceType: {
      type: String,
      enum: SOURCE_TYPES,
      required: true,
      immutable: true,
    },
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      immutable: true,
    },
    idempotencyKey: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
      immutable: true,
    },
    reversalOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LedgerEntry",
      default: null,
      immutable: true,
    },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
    versionKey: false,
  },
);

ledgerEntrySchema.index({
  user: 1,
  wallet: 1,
  createdAt: -1,
  _id: -1,
});

ledgerEntrySchema.index({
  wallet: 1,
  createdAt: -1,
  _id: -1,
});

ledgerEntrySchema.index(
  { user: 1, idempotencyKey: 1 },
  {
    unique: true,
    partialFilterExpression: {
      idempotencyKey: { $type: "string" },
    },
  },
);

ledgerEntrySchema.index({
  sourceType: 1,
  sourceId: 1,
});

ledgerEntrySchema.index({
  reversalOf: 1,
});

ledgerEntrySchema.pre("validate", function () {
  if (this.entryType === "reversal" && !this.reversalOf) {
    this.invalidate(
      "reversalOf",
      "A reversal entry must reference its original ledger entry.",
    );
  }

  if (this.entryType !== "reversal" && this.reversalOf) {
    this.invalidate(
      "reversalOf",
      "Only reversal entries can reference an original ledger entry.",
    );
  }
});

module.exports = mongoose.model("LedgerEntry", ledgerEntrySchema);

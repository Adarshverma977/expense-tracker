const mongoose = require("mongoose");

const LedgerEntry = require("../models/LedgerEntry");
const Wallet = require("../models/Wallet");
const AppError = require("../utils/AppError");

const {
  toMinorUnits,
  fromMinorUnits,
  toDecimal128,
} = require("../utils/moneyUtils");

const getSessionOptions = (session) => {
  return session ? { session } : {};
};

const getLedgerEntryByIdempotencyKey = async (
  userId,
  idempotencyKey,
  session,
) => {
  let query = LedgerEntry.findOne({
    user: userId,
    idempotencyKey,
  });

  if (session) {
    query = query.session(session);
  }

  return query;
};

const ensureSameLedgerEntry = (existing, expected) => {
  const matches =
    String(existing.wallet) === String(expected.wallet) &&
    existing.amount.toString() === expected.amount.toString() &&
    existing.entryType === expected.entryType &&
    existing.sourceType === expected.sourceType &&
    String(existing.sourceId || "") === String(expected.sourceId || "") &&
    String(existing.reversalOf || "") === String(expected.reversalOf || "");

  if (!matches) {
    throw new AppError(
      "Idempotency key has already been used for another ledger operation.",
      409,
    );
  }

  return existing;
};

const createLedgerEntry = async (userId, entryData, options = {}) => {
  const { session, requireActiveWallet = true } = options;

  const {
    wallet: walletId,
    amount,
    entryType,
    sourceType,
    sourceId = null,
    idempotencyKey,
    reversalOf = null,
  } = entryData;

  if (!mongoose.isValidObjectId(walletId)) {
    throw new AppError("Invalid wallet ID.", 400);
  }

  if (
    typeof idempotencyKey !== "string" ||
    !idempotencyKey.trim() ||
    idempotencyKey.length > 200
  ) {
    throw new AppError("A valid idempotency key is required.", 400);
  }

  const normalizedKey = idempotencyKey.trim();

  const amountInMinorUnits = toMinorUnits(amount, {
    allowNegative: true,
  });

  if (amountInMinorUnits === 0n) {
    throw new AppError("Ledger amount cannot be zero.", 400);
  }

  const decimalAmount = toDecimal128(fromMinorUnits(amountInMinorUnits), {
    allowNegative: true,
  });

  const expectedEntry = {
    wallet: walletId,
    amount: decimalAmount,
    entryType,
    sourceType,
    sourceId,
    reversalOf,
  };

  const existingEntry = await getLedgerEntryByIdempotencyKey(
    userId,
    normalizedKey,
    session,
  );

  if (existingEntry) {
    return ensureSameLedgerEntry(existingEntry, expectedEntry);
  }

  let walletQuery = Wallet.findOne({
    _id: walletId,
    user: userId,
  });

  if (requireActiveWallet) {
    walletQuery = walletQuery.where({ status: "active" });
  }

  if (session) {
    walletQuery = walletQuery.session(session);
  }

  const wallet = await walletQuery;

  if (!wallet) {
    throw new AppError("Wallet not found, unavailable, or archived.", 404);
  }

  const payload = {
    user: userId,
    wallet: walletId,
    amount: decimalAmount,
    entryType,
    sourceType,
    sourceId,
    idempotencyKey: normalizedKey,
    reversalOf,
  };

  try {
    const [ledgerEntry] = await LedgerEntry.create(
      [payload],
      getSessionOptions(session),
    );

    return ledgerEntry;
  } catch (error) {
    if (error.code !== 11000) {
      throw error;
    }

    const duplicateEntry = await getLedgerEntryByIdempotencyKey(
      userId,
      normalizedKey,
      session,
    );

    if (!duplicateEntry) {
      throw error;
    }

    return ensureSameLedgerEntry(duplicateEntry, payload);
  }
};

const reverseLedgerEntry = async (userId, ledgerEntryId, options = {}) => {
  const { session } = options;

  if (!mongoose.isValidObjectId(ledgerEntryId)) {
    throw new AppError("Invalid ledger entry ID.", 400);
  }

  let originalQuery = LedgerEntry.findOne({
    _id: ledgerEntryId,
    user: userId,
  });

  if (session) {
    originalQuery = originalQuery.session(session);
  }

  const originalEntry = await originalQuery;

  if (!originalEntry) {
    throw new AppError("Ledger entry not found.", 404);
  }

  if (originalEntry.entryType === "reversal") {
    throw new AppError("A reversal entry cannot be reversed.", 400);
  }

  let existingReversalQuery = LedgerEntry.findOne({
    user: userId,
    reversalOf: originalEntry._id,
  });

  if (session) {
    existingReversalQuery = existingReversalQuery.session(session);
  }

  const existingReversal = await existingReversalQuery;

  if (existingReversal) {
    return existingReversal;
  }

  const originalAmount = toMinorUnits(originalEntry.amount, {
    allowNegative: true,
  });

  return createLedgerEntry(
    userId,
    {
      wallet: originalEntry.wallet,
      amount: fromMinorUnits(-originalAmount),
      entryType: "reversal",
      sourceType: originalEntry.sourceType,
      sourceId: originalEntry.sourceId,
      idempotencyKey: `reversal:${originalEntry._id}`,
      reversalOf: originalEntry._id,
    },
    {
      session,
      requireActiveWallet: false,
    },
  );
};

const getWalletLedgerBalance = async (userId, walletId, options = {}) => {
  const { session } = options;

  if (!mongoose.isValidObjectId(walletId)) {
    throw new AppError("Invalid wallet ID.", 400);
  }

  let walletQuery = Wallet.findOne({
    _id: walletId,
    user: userId,
  });

  if (session) {
    walletQuery = walletQuery.session(session);
  }

  const wallet = await walletQuery;

  if (!wallet) {
    throw new AppError("Wallet not found.", 404);
  }

  const pipeline = [
    {
      $match: {
        user: new mongoose.Types.ObjectId(String(userId)),
        wallet: new mongoose.Types.ObjectId(String(walletId)),
      },
    },
    {
      $group: {
        _id: null,
        balance: {
          $sum: "$amount",
        },
      },
    },
  ];

  let aggregation = LedgerEntry.aggregate(pipeline);

  if (session) {
    aggregation = aggregation.session(session);
  }

  const [result] = await aggregation;

  const balanceInMinorUnits = result
    ? toMinorUnits(result.balance.toString(), {
        allowZero: true,
        allowNegative: true,
      })
    : 0n;

  if (wallet.type === "credit_card") {
    const outstandingInMinorUnits =
      balanceInMinorUnits < 0n ? -balanceInMinorUnits : 0n;

    const creditLimitInMinorUnits = toMinorUnits(wallet.creditLimit, {
      allowZero: true,
    });

    const availableCreditInMinorUnits =
      creditLimitInMinorUnits - outstandingInMinorUnits;

    return {
      walletId: String(wallet._id),
      type: wallet.type,
      outstanding: fromMinorUnits(outstandingInMinorUnits),
      availableCredit: fromMinorUnits(availableCreditInMinorUnits),
      ledgerBalance: fromMinorUnits(balanceInMinorUnits),
    };
  }

  return {
    walletId: String(wallet._id),
    type: wallet.type,
    balance: fromMinorUnits(balanceInMinorUnits),
  };
};

module.exports = {
  createLedgerEntry,
  reverseLedgerEntry,
  getWalletLedgerBalance,
};

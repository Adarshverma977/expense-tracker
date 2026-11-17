const mongoose = require("mongoose");

const Wallet = require("../models/Wallet");
const User = require("../models/User");
const AppError = require("../utils/AppError");

const {
  toMinorUnits,
  fromMinorUnits,
  toDecimal128,
} = require("../utils/moneyUtils");

const {
  createLedgerEntry,
  getWalletLedgerBalance,
} = require("./ledgerService");

const TRANSACTION_OPTIONS = {
  readPreference: "primary",
  readConcern: { level: "snapshot" },
  writeConcern: { w: "majority" },
};

const formatWallet = (wallet) => {
  const data = wallet.toObject ? wallet.toObject() : wallet;

  return {
    ...data,
    creditLimit: data.creditLimit?.toString() ?? null,
  };
};

const runInTransaction = async (callback) => {
  const session = await mongoose.startSession();

  try {
    let result;

    await session.withTransaction(async () => {
      result = await callback(session);
    }, TRANSACTION_OPTIONS);

    return result;
  } finally {
    await session.endSession();
  }
};

const validateWalletId = (walletId) => {
  if (!mongoose.isValidObjectId(walletId)) {
    throw new AppError("Invalid wallet ID.", 400);
  }
};

const getOwnedWallet = async (userId, walletId, session) => {
  validateWalletId(walletId);

  let query = Wallet.findOne({
    _id: walletId,
    user: userId,
  });

  if (session) {
    query = query.session(session);
  }

  const wallet = await query;

  if (!wallet) {
    throw new AppError("Wallet not found.", 404);
  }

  return wallet;
};

const getWalletOpeningAmount = (walletType, data) => {
  if (walletType === "credit_card") {
    if (data.openingBalance !== undefined) {
      throw new AppError(
        "Use openingOutstanding for credit card wallets.",
        400,
      );
    }

    return data.openingOutstanding ?? "0";
  }

  if (data.openingOutstanding !== undefined) {
    throw new AppError(
      "Opening outstanding is only allowed for credit card wallets.",
      400,
    );
  }

  return data.openingBalance ?? "0";
};

const createWallet = async (userId, walletData) => {
  return runInTransaction(async (session) => {
    const user = await User.findById(userId)
      .select("currency")
      .session(session);

    if (!user) {
      throw new AppError("User not found.", 404);
    }

    const {
      name,
      type,
      institution,
      currency,
      creditLimit,
      lastFourDigits,
      icon,
      color,
    } = walletData;

    if (!["cash", "bank", "savings", "credit_card"].includes(type)) {
      throw new AppError("Invalid wallet type.", 400);
    }

    if (type === "credit_card" && creditLimit === undefined) {
      throw new AppError(
        "Credit limit is required for credit card wallets.",
        400,
      );
    }

    if (type !== "credit_card" && creditLimit !== undefined) {
      throw new AppError(
        "Credit limit is only allowed for credit card wallets.",
        400,
      );
    }

    const walletCurrency = currency || user.currency || "INR";

    if (walletCurrency !== (user.currency || "INR")) {
      throw new AppError(
        "Wallet currency must match your account currency.",
        400,
      );
    }

    const creditLimitMinorUnits =
      type === "credit_card" ? toMinorUnits(creditLimit) : null;

    const walletPayload = {
      user: userId,
      name,
      type,
      institution,
      currency: walletCurrency,
      creditLimit: type === "credit_card" ? toDecimal128(creditLimit) : null,
      lastFourDigits,
      icon,
      color,
    };

    const [wallet] = await Wallet.create([walletPayload], { session });

    const openingAmount = getWalletOpeningAmount(type, walletData);

    const openingMinorUnits = toMinorUnits(openingAmount, {
      allowZero: true,
    });

    if (type === "credit_card" && openingMinorUnits > creditLimitMinorUnits) {
      throw new AppError(
        "Opening outstanding cannot exceed the credit limit.",
        400,
      );
    }

    if (openingMinorUnits > 0n) {
      const ledgerAmount =
        type === "credit_card" ? -openingMinorUnits : openingMinorUnits;

      await createLedgerEntry(
        userId,
        {
          wallet: wallet._id,
          amount: fromMinorUnits(ledgerAmount),
          entryType: "opening_balance",
          sourceType: "opening_balance",
          sourceId: wallet._id,
          idempotencyKey: `wallet:${wallet._id}:opening-balance`,
        },
        { session },
      );
    }

    return formatWallet(wallet);
  });
};

const getWallets = async (userId, filters = {}) => {
  const { status = "active", type } = filters;

  const query = { user: userId };

  if (status !== "all") {
    if (!["active", "archived"].includes(status)) {
      throw new AppError("Invalid wallet status.", 400);
    }

    query.status = status;
  }

  if (type) {
    if (!["cash", "bank", "savings", "credit_card"].includes(type)) {
      throw new AppError("Invalid wallet type.", 400);
    }

    query.type = type;
  }

  const wallets = await Wallet.find(query).sort({
    createdAt: -1,
    _id: -1,
  });

  return Promise.all(
    wallets.map(async (wallet) => {
      const balance = await getWalletLedgerBalance(userId, wallet._id);

      return {
        ...formatWallet(wallet),
        ...balance,
      };
    }),
  );
};

const getWalletById = async (userId, walletId) => {
  const wallet = await getOwnedWallet(userId, walletId);

  const balance = await getWalletLedgerBalance(userId, wallet._id);

  return {
    ...formatWallet(wallet),
    ...balance,
  };
};

const updateWallet = async (userId, walletId, updates) => {
  const allowedFields = [
    "name",
    "institution",
    "creditLimit",
    "lastFourDigits",
    "icon",
    "color",
  ];

  const updateFields = Object.keys(updates);

  if (
    updateFields.length === 0 ||
    updateFields.some((field) => !allowedFields.includes(field))
  ) {
    throw new AppError("Invalid wallet update fields.", 400);
  }

  return runInTransaction(async (session) => {
    const wallet = await getOwnedWallet(userId, walletId, session);

    if (wallet.status !== "active") {
      throw new AppError("Archived wallets cannot be updated.", 400);
    }

    if (updates.creditLimit !== undefined) {
      if (wallet.type !== "credit_card") {
        throw new AppError(
          "Credit limit can only be updated for credit cards.",
          400,
        );
      }

      const nextCreditLimit = toMinorUnits(updates.creditLimit);

      const balance = await getWalletLedgerBalance(userId, wallet._id, {
        session,
      });

      const outstanding = toMinorUnits(balance.outstanding, {
        allowZero: true,
      });

      if (nextCreditLimit < outstanding) {
        throw new AppError(
          "Credit limit cannot be lower than the current outstanding balance.",
          400,
        );
      }

      wallet.creditLimit = toDecimal128(updates.creditLimit);
    }

    for (const field of allowedFields) {
      if (field !== "creditLimit" && updates[field] !== undefined) {
        wallet[field] = updates[field];
      }
    }

    await wallet.save({ session });

    return formatWallet(wallet);
  });
};

const archiveWallet = async (userId, walletId) => {
  return runInTransaction(async (session) => {
    const wallet = await getOwnedWallet(userId, walletId, session);

    if (wallet.status === "archived") {
      throw new AppError("Wallet is already archived.", 400);
    }

    wallet.status = "archived";

    await wallet.save({ session });

    return {
      message: "Wallet archived successfully.",
      wallet: formatWallet(wallet),
    };
  });
};

const getWalletSummary = async (userId) => {
  const wallets = await Wallet.find({
    user: userId,
  }).sort({ createdAt: -1 });

  let totalCashAndBank = 0n;
  let totalCreditOutstanding = 0n;
  let totalAvailableCredit = 0n;

  const walletSummaries = await Promise.all(
    wallets.map(async (wallet) => {
      const balance = await getWalletLedgerBalance(userId, wallet._id);

      if (wallet.type === "credit_card") {
        totalCreditOutstanding += toMinorUnits(balance.outstanding, {
          allowZero: true,
        });

        totalAvailableCredit += toMinorUnits(balance.availableCredit, {
          allowZero: true,
          allowNegative: true,
        });
      } else {
        totalCashAndBank += toMinorUnits(balance.balance, {
          allowZero: true,
          allowNegative: true,
        });
      }

      return {
        ...formatWallet(wallet),
        ...balance,
      };
    }),
  );

  const activeWallets = wallets.filter(
    (wallet) => wallet.status === "active",
  ).length;

  const archivedWallets = wallets.length - activeWallets;

  return {
    currency: wallets[0]?.currency || "INR",
    totalWallets: wallets.length,
    activeWallets,
    archivedWallets,
    totalCashAndBank: fromMinorUnits(totalCashAndBank),
    totalCreditOutstanding: fromMinorUnits(totalCreditOutstanding),
    totalAvailableCredit: fromMinorUnits(totalAvailableCredit),
    wallets: walletSummaries,
  };
};

module.exports = {
  createWallet,
  getWallets,
  getWalletById,
  updateWallet,
  archiveWallet,
  getWalletSummary,
};

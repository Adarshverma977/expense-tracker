const mongoose = require("mongoose");

const Transfer = require("../models/Transfer");
const Wallet = require("../models/Wallet");
const LedgerEntry = require("../models/LedgerEntry");
const AppError = require("../utils/AppError");

const { toMinorUnits, fromMinorUnits } = require("../utils/moneyUtils");
const { createLedgerEntry } = require("./ledgerService");

const TRANSACTION_OPTIONS = {
  readPreference: "primary",
  readConcern: { level: "snapshot" },
  writeConcern: { w: "majority" },
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

const getWalletBalance = async (userId, walletId, session) => {
  const result = await LedgerEntry.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        wallet: new mongoose.Types.ObjectId(walletId),
      },
    },
    {
      $group: {
        _id: null,
        balance: { $sum: "$amount" },
      },
    },
  ]).session(session);

  return result.length
    ? toMinorUnits(result[0].balance.toString(), {
        allowZero: true,
        allowNegative: true,
      })
    : 0n;
};

const formatTransfer = (transfer) => {
  const data = transfer.toObject ? transfer.toObject() : transfer;

  return {
    ...data,
    amount: data.amount?.toString() ?? null,
  };
};

const validateTransferData = ({
  fromWallet,
  toWallet,
  amount,
  date,
  idempotencyKey,
}) => {
  if (
    !mongoose.isValidObjectId(fromWallet) ||
    !mongoose.isValidObjectId(toWallet)
  ) {
    throw new AppError("Invalid wallet ID.", 400);
  }

  if (String(fromWallet) === String(toWallet)) {
    throw new AppError(
      "Source and destination wallets must be different.",
      400,
    );
  }

  if (typeof idempotencyKey !== "string" || !idempotencyKey.trim()) {
    throw new AppError("Idempotency key is required.", 400);
  }

  let amountMinor;

  try {
    amountMinor = toMinorUnits(amount);
  } catch {
    throw new AppError("Invalid transfer amount.", 400);
  }

  if (amountMinor <= 0n) {
    throw new AppError("Transfer amount must be greater than zero.", 400);
  }

  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new AppError("Invalid transfer date.", 400);
  }

  return {
    amountMinor,
    idempotencyKey: idempotencyKey.trim(),
  };
};

const assertIdempotencyMatch = (
  existingTransfer,
  { fromWallet, toWallet, amountMinor, description, date },
) => {
  const existingAmount = toMinorUnits(existingTransfer.amount.toString());

  const matches =
    existingTransfer.fromWallet.toString() === String(fromWallet) &&
    existingTransfer.toWallet.toString() === String(toWallet) &&
    existingAmount === amountMinor &&
    (existingTransfer.description ?? "") === description &&
    new Date(existingTransfer.date).getTime() === date.getTime();

  if (!matches) {
    throw new AppError(
      "This idempotency key has already been used with different transfer details.",
      409,
    );
  }

  return existingTransfer;
};

const lockWallets = async (userId, wallets, session) => {
  const sortedWallets = [...wallets].sort((a, b) =>
    a._id.toString().localeCompare(b._id.toString()),
  );

  for (const wallet of sortedWallets) {
    const result = await Wallet.collection.updateOne(
      {
        _id: wallet._id,
        user: new mongoose.Types.ObjectId(userId),
        status: "active",
      },
      {
        $inc: { __v: 1 },
      },
      { session },
    );

    if (result.matchedCount !== 1) {
      throw new AppError(
        "One or both wallets are unavailable or inactive.",
        404,
      );
    }
  }
};

const createTransfer = async (userId, data) => {
  const {
    fromWallet,
    toWallet,
    amount,
    description = "",
    date = new Date(),
    idempotencyKey,
  } = data;

  const { amountMinor, idempotencyKey: normalizedKey } = validateTransferData({
    fromWallet,
    toWallet,
    amount,
    date,
    idempotencyKey,
  });

  const normalizedDescription =
    typeof description === "string" ? description.trim() : "";

  const transferDetails = {
    fromWallet,
    toWallet,
    amountMinor,
    description: normalizedDescription,
    date,
  };

  try {
    const transfer = await runInTransaction(async (session) => {
      const existingTransfer = await Transfer.findOne({
        user: userId,
        idempotencyKey: normalizedKey,
      }).session(session);

      if (existingTransfer) {
        return assertIdempotencyMatch(existingTransfer, transferDetails);
      }

      const wallets = await Wallet.find({
        _id: { $in: [fromWallet, toWallet] },
        user: userId,
        status: "active",
      }).session(session);

      const sourceWallet = wallets.find(
        (wallet) => wallet._id.toString() === String(fromWallet),
      );

      const destinationWallet = wallets.find(
        (wallet) => wallet._id.toString() === String(toWallet),
      );

      if (!sourceWallet || !destinationWallet) {
        throw new AppError(
          "One or both wallets are unavailable or inactive.",
          404,
        );
      }

      if (sourceWallet.type === "credit_card") {
        throw new AppError(
          "Credit card wallets cannot be used as transfer sources.",
          400,
        );
      }

      await lockWallets(userId, [sourceWallet, destinationWallet], session);

      const sourceBalance = await getWalletBalance(
        userId,
        sourceWallet._id,
        session,
      );

      if (sourceBalance < amountMinor) {
        throw new AppError(
          "Insufficient wallet balance for this transfer.",
          400,
        );
      }

      if (destinationWallet.type === "credit_card") {
        const destinationBalance = await getWalletBalance(
          userId,
          destinationWallet._id,
          session,
        );

        const outstanding = destinationBalance < 0n ? -destinationBalance : 0n;

        if (outstanding === 0n) {
          throw new AppError(
            "This credit card has no outstanding balance to pay.",
            400,
          );
        }

        if (amountMinor > outstanding) {
          throw new AppError(
            "Payment cannot exceed the outstanding credit card balance.",
            400,
          );
        }
      }

      const [createdTransfer] = await Transfer.create(
        [
          {
            user: userId,
            fromWallet: sourceWallet._id,
            toWallet: destinationWallet._id,
            amount: fromMinorUnits(amountMinor),
            description: normalizedDescription,
            date,
            idempotencyKey: normalizedKey,
          },
        ],
        { session },
      );

      await createLedgerEntry(
        userId,
        {
          wallet: sourceWallet._id,
          amount: fromMinorUnits(-amountMinor),
          entryType: "transfer",
          sourceType: "transfer",
          sourceId: createdTransfer._id,
          idempotencyKey: `transfer:${createdTransfer._id}:out`,
        },
        { session },
      );

      await createLedgerEntry(
        userId,
        {
          wallet: destinationWallet._id,
          amount: fromMinorUnits(amountMinor),
          entryType: "transfer",
          sourceType: "transfer",
          sourceId: createdTransfer._id,
          idempotencyKey: `transfer:${createdTransfer._id}:in`,
        },
        { session },
      );

      return createdTransfer;
    });

    return formatTransfer(transfer);
  } catch (error) {
    if (error.code === 11000) {
      const existingTransfer = await Transfer.findOne({
        user: userId,
        idempotencyKey: normalizedKey,
      });

      if (existingTransfer) {
        return formatTransfer(
          assertIdempotencyMatch(existingTransfer, transferDetails),
        );
      }
    }

    throw error;
  }
};

const parseDateBoundary = (value, fieldName, isEndDate = false) => {
  if (!value) return null;

  if (typeof value !== "string") {
    throw new AppError(`Invalid ${fieldName}.`, 400);
  }

  const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;

  if (dateOnlyPattern.test(value)) {
    const parsedDate = new Date(`${value}T00:00:00.000Z`);

    if (
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0, 10) !== value
    ) {
      throw new AppError(`Invalid ${fieldName}.`, 400);
    }

    if (isEndDate) {
      parsedDate.setUTCDate(parsedDate.getUTCDate() + 1);
    }

    return parsedDate;
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new AppError(`Invalid ${fieldName}.`, 400);
  }

  return parsedDate;
};

const getTransfers = async (userId, filters = {}) => {
  const {
    fromWallet,
    toWallet,
    startDate,
    endDate,
    page = 1,
    limit = 10,
    sort = "newest",
  } = filters;

  const query = { user: userId };

  if (fromWallet) {
    if (!mongoose.isValidObjectId(fromWallet)) {
      throw new AppError("Invalid source wallet ID.", 400);
    }

    query.fromWallet = fromWallet;
  }

  if (toWallet) {
    if (!mongoose.isValidObjectId(toWallet)) {
      throw new AppError("Invalid destination wallet ID.", 400);
    }

    query.toWallet = toWallet;
  }

  const parsedStartDate = parseDateBoundary(startDate, "start date");
  const parsedEndDate = parseDateBoundary(endDate, "end date", true);

  if (parsedStartDate && parsedEndDate && parsedStartDate >= parsedEndDate) {
    throw new AppError("Start date cannot be after end date.", 400);
  }

  if (parsedStartDate || parsedEndDate) {
    query.date = {};

    if (parsedStartDate) {
      query.date.$gte = parsedStartDate;
    }

    if (parsedEndDate) {
      query.date.$lt = parsedEndDate;
    }
  }

  const skip = (page - 1) * limit;

  const sortOption =
    sort === "oldest" ? { date: 1, _id: 1 } : { date: -1, _id: -1 };

  const [transfers, total] = await Promise.all([
    Transfer.find(query)
      .populate("fromWallet", "name type")
      .populate("toWallet", "name type")
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .lean(),

    Transfer.countDocuments(query),
  ]);

  return {
    transfers: transfers.map(formatTransfer),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1,
    },
  };
};

const getTransferById = async (userId, transferId) => {
  if (!mongoose.isValidObjectId(transferId)) {
    throw new AppError("Invalid transfer ID.", 400);
  }

  const transfer = await Transfer.findOne({
    _id: transferId,
    user: userId,
  })
    .populate("fromWallet", "name type")
    .populate("toWallet", "name type")
    .lean();

  if (!transfer) {
    throw new AppError("Transfer not found.", 404);
  }

  return formatTransfer(transfer);
};

module.exports = {
  createTransfer,
  getTransfers,
  getTransferById,
};

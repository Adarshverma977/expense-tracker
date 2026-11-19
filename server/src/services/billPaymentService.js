const mongoose = require("mongoose");

const Bill = require("../models/Bill");
const BillPayment = require("../models/BillPayment");
const Transaction = require("../models/Transaction");
const Category = require("../models/Category");
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

const MAX_AMOUNT_PAISE = 99999999999999n;

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

const formatPayment = (payment) => {
  const data = payment.toObject ? payment.toObject() : payment;

  return {
    ...data,
    amount: data.amount?.toString() ?? null,
  };
};

const validateAmount = (value) => {
  if (typeof value !== "string") {
    throw new AppError("A valid payment amount is required.", 400);
  }

  const amount = value.trim();

  if (amount.length > 15 || !/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(amount)) {
    throw new AppError("Invalid payment amount.", 400);
  }

  const amountMinor = toMinorUnits(amount);

  if (amountMinor <= 0n || amountMinor > MAX_AMOUNT_PAISE) {
    throw new AppError(
      "Payment amount must be positive and within the allowed limit.",
      400,
    );
  }

  return amountMinor;
};

const addMonthsClamped = (date, months) => {
  const originalDate = new Date(date);
  const originalDay = originalDate.getUTCDate();

  const targetMonth = new Date(
    Date.UTC(
      originalDate.getUTCFullYear(),
      originalDate.getUTCMonth() + months,
      1,
      originalDate.getUTCHours(),
      originalDate.getUTCMinutes(),
      originalDate.getUTCSeconds(),
      originalDate.getUTCMilliseconds(),
    ),
  );

  const lastDayOfTargetMonth = new Date(
    Date.UTC(targetMonth.getUTCFullYear(), targetMonth.getUTCMonth() + 1, 0),
  ).getUTCDate();

  targetMonth.setUTCDate(Math.min(originalDay, lastDayOfTargetMonth));

  return targetMonth;
};

const calculateNextDueDate = (date, frequency) => {
  const currentDate = new Date(date);

  if (Number.isNaN(currentDate.getTime())) {
    return null;
  }

  switch (frequency) {
    case "weekly": {
      const nextDate = new Date(currentDate);
      nextDate.setUTCDate(nextDate.getUTCDate() + 7);
      return nextDate;
    }

    case "monthly":
      return addMonthsClamped(currentDate, 1);

    case "quarterly":
      return addMonthsClamped(currentDate, 3);

    case "yearly":
      return addMonthsClamped(currentDate, 12);

    default:
      return null;
  }
};

const lockDocuments = async (userId, billId, walletId, session) => {
  const billLock = await Bill.collection.updateOne(
    {
      _id: billId,
      user: new mongoose.Types.ObjectId(userId),
      status: "active",
    },
    {
      $inc: { __v: 1 },
    },
    { session },
  );

  if (billLock.matchedCount !== 1) {
    throw new AppError("Bill is not available for payment.", 400);
  }

  const walletLock = await Wallet.collection.updateOne(
    {
      _id: walletId,
      user: new mongoose.Types.ObjectId(userId),
      status: "active",
    },
    {
      $inc: { __v: 1 },
    },
    { session },
  );

  if (walletLock.matchedCount !== 1) {
    throw new AppError("Wallet not found or unavailable for payment.", 400);
  }
};

const assertIdempotencyMatch = (existing, details) => {
  const matches =
    existing.bill.toString() === String(details.bill) &&
    existing.wallet.toString() === String(details.wallet) &&
    toMinorUnits(existing.amount.toString()) === details.amountMinor &&
    (details.paidAt === undefined ||
      existing.paidAt.getTime() === details.paidAt.getTime()) &&
    (existing.notes || "") === (details.notes || "");

  if (!matches) {
    throw new AppError(
      "This idempotency key has already been used with different payment details.",
      409,
    );
  }

  return existing;
};

const getPaidAmount = async (userId, billId, billDueDate, session) => {
  const result = await BillPayment.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        bill: new mongoose.Types.ObjectId(billId),
        billDueDate,
        status: "completed",
      },
    },
    {
      $group: {
        _id: null,
        totalPaid: { $sum: "$amount" },
      },
    },
  ]).session(session);

  return result.length
    ? toMinorUnits(result[0].totalPaid.toString(), {
        allowZero: true,
      })
    : 0n;
};

const createBillPayment = async (userId, paymentData) => {
  const {
    bill: billId,
    wallet: walletId,
    amount,
    paidAt: paidAtInput,
    idempotencyKey,
    notes = "",
  } = paymentData;

  const paidAt = paidAtInput === undefined ? undefined : paidAtInput;

  if (
    !mongoose.isValidObjectId(billId) ||
    !mongoose.isValidObjectId(walletId)
  ) {
    throw new AppError("Invalid bill or wallet ID.", 400);
  }

  if (typeof idempotencyKey !== "string" || !idempotencyKey.trim()) {
    throw new AppError("Idempotency key is required.", 400);
  }

  if (
    paidAt !== undefined &&
    (!(paidAt instanceof Date) || Number.isNaN(paidAt.getTime()))
  ) {
    throw new AppError("Invalid payment date.", 400);
  }

  if (typeof notes !== "string") {
    throw new AppError("Invalid payment notes.", 400);
  }

  const effectivePaidAt = paidAt ?? new Date();
  const amountMinor = validateAmount(amount);
  const normalizedKey = idempotencyKey.trim();

  try {
    const payment = await runInTransaction(async (session) => {
      const existingPayment = await BillPayment.findOne({
        user: userId,
        idempotencyKey: normalizedKey,
      }).session(session);

      if (existingPayment) {
        return assertIdempotencyMatch(existingPayment, {
          bill: billId,
          wallet: walletId,
          amountMinor,
          paidAt,
          notes,
        });
      }

      await lockDocuments(userId, billId, walletId, session);

      const [bill, wallet] = await Promise.all([
        Bill.findOne({
          _id: billId,
          user: userId,
          status: "active",
        }).session(session),

        Wallet.findOne({
          _id: walletId,
          user: userId,
          status: "active",
        }).session(session),
      ]);

      if (!bill) {
        throw new AppError("Bill not found or unavailable for payment.", 404);
      }

      if (!wallet) {
        throw new AppError("Wallet not found or unavailable for payment.", 404);
      }

      const category = await Category.findOne({
        _id: bill.category,
        type: "expense",
        isActive: true,
        $or: [{ isDefault: true }, { user: userId, isDefault: false }],
      }).session(session);

      if (!category) {
        throw new AppError(
          "The bill category is unavailable. Update the bill category before paying.",
          400,
        );
      }

      const billDueDate = new Date(bill.dueDate);
      const billAmountMinor = toMinorUnits(bill.amount.toString());

      const alreadyPaid = await getPaidAmount(
        userId,
        bill._id,
        billDueDate,
        session,
      );

      const remainingAmount = billAmountMinor - alreadyPaid;

      if (remainingAmount <= 0n) {
        throw new AppError("This bill has already been fully paid.", 409);
      }

      if (amountMinor > remainingAmount) {
        throw new AppError(
          `Payment exceeds the remaining bill amount of ${fromMinorUnits(remainingAmount)}.`,
          400,
        );
      }

      const [transaction] = await Transaction.create(
        [
          {
            user: userId,
            wallet: wallet._id,
            title: bill.title,
            amount: mongoose.Types.Decimal128.fromString(
              fromMinorUnits(amountMinor),
            ),
            type: "expense",
            category: category._id,
            description: notes || `Payment for bill: ${bill.title}`,
            date: effectivePaidAt,
          },
        ],
        { session },
      );

      const [createdPayment] = await BillPayment.create(
        [
          {
            user: userId,
            bill: bill._id,
            billDueDate,
            transaction: transaction._id,
            wallet: wallet._id,
            amount: mongoose.Types.Decimal128.fromString(
              fromMinorUnits(amountMinor),
            ),
            paidAt: effectivePaidAt,
            status: "completed",
            idempotencyKey: normalizedKey,
            notes,
          },
        ],
        { session },
      );

      await createLedgerEntry(
        userId,
        {
          wallet: wallet._id,
          amount: fromMinorUnits(-amountMinor),
          entryType: "expense",
          sourceType: "transaction",
          sourceId: transaction._id,
          idempotencyKey: `transaction:${transaction._id}:create`,
        },
        { session },
      );

      const totalPaid = alreadyPaid + amountMinor;

      bill.lastPaidAt = effectivePaidAt;

      if (totalPaid === billAmountMinor) {
        if (bill.frequency === "one_time") {
          bill.status = "paid";
        } else {
          const nextDueDate =
            bill.nextDueDate ??
            calculateNextDueDate(bill.dueDate, bill.frequency);

          if (!nextDueDate) {
            throw new AppError(
              "Unable to calculate the next bill due date.",
              500,
            );
          }

          bill.dueDate = nextDueDate;
          bill.nextDueDate = calculateNextDueDate(nextDueDate, bill.frequency);
        }
      }

      await bill.save({ session });

      return createdPayment;
    });

    return formatPayment(payment);
  } catch (error) {
    if (error.code === 11000) {
      const existingPayment = await BillPayment.findOne({
        user: userId,
        idempotencyKey: normalizedKey,
      });

      if (existingPayment) {
        return formatPayment(
          assertIdempotencyMatch(existingPayment, {
            bill: billId,
            wallet: walletId,
            amountMinor,
            paidAt,
            notes,
          }),
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

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new AppError(`Invalid ${fieldName}.`, 400);
  }

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
};

const getBillPayments = async (userId, filters = {}) => {
  const {
    bill,
    wallet,
    startDate,
    endDate,
    status,
    page = 1,
    limit = 10,
    sort = "newest",
  } = filters;

  const query = { user: userId };

  if (bill) {
    if (!mongoose.isValidObjectId(bill)) {
      throw new AppError("Invalid bill ID.", 400);
    }

    query.bill = bill;
  }

  if (wallet) {
    if (!mongoose.isValidObjectId(wallet)) {
      throw new AppError("Invalid wallet ID.", 400);
    }

    const ownedWallet = await Wallet.findOne({
      _id: wallet,
      user: userId,
    }).select("_id");

    if (!ownedWallet) {
      throw new AppError("Wallet not found.", 404);
    }

    query.wallet = ownedWallet._id;
  }

  if (status) {
    query.status = status;
  }

  const parsedStartDate = parseDateBoundary(startDate, "start date");
  const parsedEndDate = parseDateBoundary(endDate, "end date", true);

  if (parsedStartDate && parsedEndDate && parsedStartDate >= parsedEndDate) {
    throw new AppError("Start date cannot be after end date.", 400);
  }

  if (parsedStartDate || parsedEndDate) {
    query.paidAt = {};

    if (parsedStartDate) {
      query.paidAt.$gte = parsedStartDate;
    }

    if (parsedEndDate) {
      query.paidAt.$lt = parsedEndDate;
    }
  }

  const sortOptions = {
    newest: { paidAt: -1, _id: -1 },
    oldest: { paidAt: 1, _id: 1 },
    amount_high: { amount: -1, _id: -1 },
    amount_low: { amount: 1, _id: 1 },
  };

  const skip = (page - 1) * limit;

  const [payments, total] = await Promise.all([
    BillPayment.find(query)
      .populate("bill", "title payee frequency")
      .populate("wallet", "name type")
      .populate("transaction", "title amount type date")
      .sort(sortOptions[sort] || sortOptions.newest)
      .skip(skip)
      .limit(limit)
      .lean(),

    BillPayment.countDocuments(query),
  ]);

  return {
    payments: payments.map(formatPayment),
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

const getBillPaymentById = async (userId, paymentId) => {
  if (!mongoose.isValidObjectId(paymentId)) {
    throw new AppError("Invalid bill payment ID.", 400);
  }

  const payment = await BillPayment.findOne({
    _id: paymentId,
    user: userId,
  })
    .populate("bill", "title payee frequency")
    .populate("wallet", "name type")
    .populate("transaction", "title amount type date")
    .lean();

  if (!payment) {
    throw new AppError("Bill payment not found.", 404);
  }

  return formatPayment(payment);
};

module.exports = {
  createBillPayment,
  getBillPayments,
  getBillPaymentById,
};

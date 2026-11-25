const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const LedgerEntry = require("../models/LedgerEntry");
const Category = require("../models/Category");
const Budget = require("../models/Budget");
const Bill = require("../models/Bill");
const BillPayment = require("../models/BillPayment");
const RecurringTransaction = require("../models/RecurringTransaction");
const RecurringTransactionExecution = require("../models/RecurringTransactionExecution");
const FinancialGoal = require("../models/FinancialGoal");
const GoalContribution = require("../models/GoalContribution");
const Transfer = require("../models/Transfer");

const createDeletionError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const transitionAccountToDeletionPending = async (user) => {
  if (user.accountStatus === "deletion_pending") {
    return true;
  }

  if (user.accountStatus !== "active") {
    throw createDeletionError("Account cannot be deleted.", 400);
  }

  const currentWriteVersion = user.schedulerWriteVersion ?? 0;

  const updatedUser = await User.findOneAndUpdate(
    {
      _id: user._id,
      accountStatus: "active",
      $or: [
        { schedulerWriteVersion: currentWriteVersion },
        { schedulerWriteVersion: { $exists: false } },
      ],
    },
    {
      $set: {
        accountStatus: "deletion_pending",
        deletionRequestedAt: new Date(),
        pendingEmail: null,
        emailChangeToken: null,
        emailChangeExpires: null,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
      $inc: {
        tokenVersion: 1,
        schedulerWriteVersion: 1,
      },
    },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!updatedUser) {
    throw createDeletionError(
      "Account status changed during deletion. Please try again.",
      409,
    );
  }

  return true;
};

const cleanupUserData = async (userId) => {
  const filter = { user: userId };

  await RecurringTransactionExecution.deleteMany(filter);
  await RecurringTransaction.deleteMany(filter);

  await GoalContribution.deleteMany(filter);
  await BillPayment.deleteMany(filter);

  await LedgerEntry.deleteMany(filter);
  await Transaction.deleteMany(filter);
  await Transfer.deleteMany(filter);

  await Budget.deleteMany(filter);
  await Bill.deleteMany(filter);

  await FinancialGoal.deleteMany(filter);
  await Wallet.deleteMany(filter);

  await Category.deleteMany({
    user: userId,
    isDefault: false,
  });
};

const permanentlyDeleteUser = async (userId) => {
  const result = await User.deleteOne({
    _id: userId,
    accountStatus: "deletion_pending",
  });

  if (result.deletedCount !== 1) {
    throw createDeletionError(
      "Financial data cleanup completed, but the user account could not be deleted. Please retry.",
      500,
    );
  }
};

const deleteUserAccount = async (userId, password) => {
  const user = await User.findById(userId).select(
    "+password +schedulerWriteVersion accountStatus",
  );

  if (!user) {
    throw createDeletionError("User account not found.", 404);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw createDeletionError("Incorrect password.", 401);
  }

  await transitionAccountToDeletionPending(user);

  await cleanupUserData(userId);

  await permanentlyDeleteUser(userId);

  return {
    success: true,
    message: "Your account and associated data have been permanently deleted.",
  };
};

module.exports = {
  deleteUserAccount,
};

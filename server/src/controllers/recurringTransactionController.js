const asyncHandler = require("../utils/asyncHandler");

const {
  createRecurringTransaction,
  getRecurringTransactions,
  getRecurringTransactionById,
  updateRecurringTransaction,
  pauseRecurringTransaction,
  resumeRecurringTransaction,
  cancelRecurringTransaction,
} = require("../services/recurringTransactionService");

// POST /api/recurring-transactions
const createRecurringTransactionController = asyncHandler(async (req, res) => {
  const recurringTransaction = await createRecurringTransaction(
    req.user._id,
    req.body,
  );

  res.status(201).json({
    success: true,
    message: "Recurring transaction created successfully.",
    data: {
      recurringTransaction,
    },
  });
});

// GET /api/recurring-transactions
const getRecurringTransactionsController = asyncHandler(async (req, res) => {
  const result = await getRecurringTransactions(
    req.user._id,
    req.validatedQuery,
  );

  res.status(200).json({
    success: true,
    count: result.recurringTransactions.length,
    data: result,
  });
});

// GET /api/recurring-transactions/:id
const getRecurringTransactionByIdController = asyncHandler(async (req, res) => {
  const recurringTransaction = await getRecurringTransactionById(
    req.user._id,
    req.validatedParams.id,
  );

  res.status(200).json({
    success: true,
    data: {
      recurringTransaction,
    },
  });
});

// PATCH /api/recurring-transactions/:id
const updateRecurringTransactionController = asyncHandler(async (req, res) => {
  const recurringTransaction = await updateRecurringTransaction(
    req.user._id,
    req.validatedParams.id,
    req.body,
  );

  res.status(200).json({
    success: true,
    message: "Recurring transaction updated successfully.",
    data: {
      recurringTransaction,
    },
  });
});

// PATCH /api/recurring-transactions/:id/pause
const pauseRecurringTransactionController = asyncHandler(async (req, res) => {
  const recurringTransaction = await pauseRecurringTransaction(
    req.user._id,
    req.validatedParams.id,
  );

  res.status(200).json({
    success: true,
    message: "Recurring transaction paused successfully.",
    data: {
      recurringTransaction,
    },
  });
});

// PATCH /api/recurring-transactions/:id/resume
const resumeRecurringTransactionController = asyncHandler(async (req, res) => {
  const recurringTransaction = await resumeRecurringTransaction(
    req.user._id,
    req.validatedParams.id,
  );

  res.status(200).json({
    success: true,
    message: "Recurring transaction resumed successfully.",
    data: {
      recurringTransaction,
    },
  });
});

// DELETE /api/recurring-transactions/:id
const cancelRecurringTransactionController = asyncHandler(async (req, res) => {
  const result = await cancelRecurringTransaction(
    req.user._id,
    req.validatedParams.id,
  );

  res.status(200).json({
    success: true,
    ...result,
  });
});

module.exports = {
  createRecurringTransactionController,
  getRecurringTransactionsController,
  getRecurringTransactionByIdController,
  updateRecurringTransactionController,
  pauseRecurringTransactionController,
  resumeRecurringTransactionController,
  cancelRecurringTransactionController,
};

const asyncHandler = require("../utils/asyncHandler");

const {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
} = require("../services/transactionService");

// POST /api/transactions
const createTransactionController = asyncHandler(async (req, res) => {
  const transaction = await createTransaction(req.user._id, req.body);

  res.status(201).json({
    success: true,
    message: "Transaction created successfully.",
    data: {
      transaction,
    },
  });
});

// GET /api/transactions
const getTransactionsController = asyncHandler(async (req, res) => {
  const result = await getTransactions(req.user._id, req.validatedQuery);

  res.status(200).json({
    success: true,
    count: result.transactions.length,
    data: result,
  });
});

// GET /api/transactions/:id
const getTransactionByIdController = asyncHandler(async (req, res) => {
  const transaction = await getTransactionById(
    req.user._id,
    req.validatedParams.id,
  );

  res.status(200).json({
    success: true,
    data: {
      transaction,
    },
  });
});

// PATCH /api/transactions/:id
const updateTransactionController = asyncHandler(async (req, res) => {
  const transaction = await updateTransaction(
    req.user._id,
    req.validatedParams.id,
    req.body,
  );

  res.status(200).json({
    success: true,
    message: "Transaction updated successfully.",
    data: {
      transaction,
    },
  });
});

// DELETE /api/transactions/:id
const deleteTransactionController = asyncHandler(async (req, res) => {
  const result = await deleteTransaction(req.user._id, req.validatedParams.id);

  res.status(200).json({
    success: true,
    ...result,
  });
});

module.exports = {
  createTransactionController,
  getTransactionsController,
  getTransactionByIdController,
  updateTransactionController,
  deleteTransactionController,
};

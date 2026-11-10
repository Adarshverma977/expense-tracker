const asyncHandler = require("../utils/asyncHandler");

const {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
} = require("../services/transactionService");

const {
  importTransactions,
  exportTransactions,
} = require("../services/csvTransactionService");

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

// POST /api/transactions/import
const importTransactionsController = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Please upload a CSV file.",
    });
  }

  const result = await importTransactions(req.user._id, req.file.buffer);

  res.status(200).json({
    success: true,
    message: "CSV import processing completed.",
    data: result,
  });
});

// GET /api/transactions/export
const exportTransactionsController = asyncHandler(async (req, res) => {
  const csv = await exportTransactions(req.user._id, req.validatedQuery);

  const filename = `moneta-transactions-${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;

  res.setHeader("Content-Type", "text/csv; charset=utf-8");

  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  res.setHeader("Cache-Control", "no-store");

  res.status(200).send(`\uFEFF${csv}`);
});

module.exports = {
  createTransactionController,
  getTransactionsController,
  getTransactionByIdController,
  updateTransactionController,
  deleteTransactionController,
  importTransactionsController,
  exportTransactionsController,
};

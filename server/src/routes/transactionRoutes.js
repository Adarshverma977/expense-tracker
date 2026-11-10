const express = require("express");

const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateRequest");
const uploadCSV = require("../middleware/csvUploadMiddleware");

const {
  createTransactionController,
  getTransactionsController,
  getTransactionByIdController,
  updateTransactionController,
  deleteTransactionController,
  importTransactionsController,
  exportTransactionsController,
} = require("../controllers/transactionController");

const {
  createTransactionSchema,
  getTransactionsSchema,
  updateTransactionSchema,
  transactionIdSchema,
} = require("../validators/transactionValidator");

const {
  importTransactionsSchema,
  exportTransactionsSchema,
} = require("../validators/csvTransactionValidator");

// All transaction routes require authentication.
router.use(protect);

// CSV EXPORT
// GET /api/transactions/export
router.get(
  "/export",
  validateRequest(exportTransactionsSchema),
  exportTransactionsController,
);

// CSV IMPORT
// POST /api/transactions/import
router.post(
  "/import",
  uploadCSV,
  validateRequest(importTransactionsSchema),
  importTransactionsController,
);

// GET /api/transactions
router.get(
  "/",
  validateRequest(getTransactionsSchema),
  getTransactionsController,
);

// POST /api/transactions
router.post(
  "/",
  validateRequest(createTransactionSchema),
  createTransactionController,
);

// GET /api/transactions/:id
router.get(
  "/:id",
  validateRequest(transactionIdSchema),
  getTransactionByIdController,
);

// PATCH /api/transactions/:id
router.patch(
  "/:id",
  validateRequest(updateTransactionSchema),
  updateTransactionController,
);

// DELETE /api/transactions/:id
router.delete(
  "/:id",
  validateRequest(transactionIdSchema),
  deleteTransactionController,
);

module.exports = router;

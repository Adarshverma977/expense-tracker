const express = require("express");

const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateRequest");

const {
  createRecurringTransactionController,
  getRecurringTransactionsController,
  getRecurringTransactionByIdController,
  updateRecurringTransactionController,
  pauseRecurringTransactionController,
  resumeRecurringTransactionController,
  cancelRecurringTransactionController,
} = require("../controllers/recurringTransactionController");

const {
  createRecurringTransactionSchema,
  getRecurringTransactionsSchema,
  updateRecurringTransactionSchema,
  recurringTransactionIdSchema,
} = require("../validators/recurringTransactionValidator");

// All recurring transaction routes require authentication.
router.use(protect);

// GET /api/recurring-transactions
router.get(
  "/",
  validateRequest(getRecurringTransactionsSchema),
  getRecurringTransactionsController,
);

// POST /api/recurring-transactions
router.post(
  "/",
  validateRequest(createRecurringTransactionSchema),
  createRecurringTransactionController,
);

// GET /api/recurring-transactions/:id
router.get(
  "/:id",
  validateRequest(recurringTransactionIdSchema),
  getRecurringTransactionByIdController,
);

// PATCH /api/recurring-transactions/:id
router.patch(
  "/:id",
  validateRequest(updateRecurringTransactionSchema),
  updateRecurringTransactionController,
);

// PATCH /api/recurring-transactions/:id/pause
router.patch(
  "/:id/pause",
  validateRequest(recurringTransactionIdSchema),
  pauseRecurringTransactionController,
);

// PATCH /api/recurring-transactions/:id/resume
router.patch(
  "/:id/resume",
  validateRequest(recurringTransactionIdSchema),
  resumeRecurringTransactionController,
);

// DELETE /api/recurring-transactions/:id
router.delete(
  "/:id",
  validateRequest(recurringTransactionIdSchema),
  cancelRecurringTransactionController,
);

module.exports = router;

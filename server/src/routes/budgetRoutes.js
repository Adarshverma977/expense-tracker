const express = require("express");

const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateRequest");

const {
  createBudgetController,
  getBudgetsController,
  getBudgetByIdController,
  updateBudgetController,
  deleteBudgetController,
} = require("../controllers/budgetController");

const {
  createBudgetSchema,
  getBudgetsSchema,
  getBudgetByIdSchema,
  updateBudgetSchema,
  deleteBudgetSchema,
} = require("../validators/budgetValidator");

// All budget routes require authentication.
router.use(protect);

// GET /api/budgets
router.get("/", validateRequest(getBudgetsSchema), getBudgetsController);

// POST /api/budgets
router.post("/", validateRequest(createBudgetSchema), createBudgetController);

// GET /api/budgets/:id
router.get(
  "/:id",
  validateRequest(getBudgetByIdSchema),
  getBudgetByIdController,
);

// PATCH /api/budgets/:id
router.patch(
  "/:id",
  validateRequest(updateBudgetSchema),
  updateBudgetController,
);

// DELETE /api/budgets/:id
router.delete(
  "/:id",
  validateRequest(deleteBudgetSchema),
  deleteBudgetController,
);

module.exports = router;

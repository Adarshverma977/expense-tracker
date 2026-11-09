const express = require("express");

const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateRequest");
const goalContributionRoutes = require("./goalContributionRoutes");

const {
  createFinancialGoalController,
  getFinancialGoalsController,
  getFinancialGoalByIdController,
  updateFinancialGoalController,
  archiveFinancialGoalController,
} = require("../controllers/financialGoalController");

const {
  createFinancialGoalSchema,
  getFinancialGoalsSchema,
  getFinancialGoalByIdSchema,
  updateFinancialGoalSchema,
  archiveFinancialGoalSchema,
} = require("../validators/financialGoalValidator");

// All financial goal routes require authentication.
router.use(protect);

// GET /api/financial-goals
router.get(
  "/",
  validateRequest(getFinancialGoalsSchema),
  getFinancialGoalsController,
);

// POST /api/financial-goals
router.post(
  "/",
  validateRequest(createFinancialGoalSchema),
  createFinancialGoalController,
);

router.use("/:id/contributions", goalContributionRoutes);

// GET /api/financial-goals/:id
router.get(
  "/:id",
  validateRequest(getFinancialGoalByIdSchema),
  getFinancialGoalByIdController,
);

// PATCH /api/financial-goals/:id
router.patch(
  "/:id",
  validateRequest(updateFinancialGoalSchema),
  updateFinancialGoalController,
);

// DELETE /api/financial-goals/:id
router.delete(
  "/:id",
  validateRequest(archiveFinancialGoalSchema),
  archiveFinancialGoalController,
);

module.exports = router;

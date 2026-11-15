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
  restoreFinancialGoalController,
  permanentlyDeleteFinancialGoalController,
} = require("../controllers/financialGoalController");

const {
  createFinancialGoalSchema,
  getFinancialGoalsSchema,
  getFinancialGoalByIdSchema,
  updateFinancialGoalSchema,
  archiveFinancialGoalSchema,
  restoreFinancialGoalSchema,
  permanentlyDeleteFinancialGoalSchema,
} = require("../validators/financialGoalValidator");

router.use(protect);

router.get(
  "/",
  validateRequest(getFinancialGoalsSchema),
  getFinancialGoalsController,
);

router.post(
  "/",
  validateRequest(createFinancialGoalSchema),
  createFinancialGoalController,
);

router.use("/:id/contributions", goalContributionRoutes);

router.patch(
  "/:id/restore",
  validateRequest(restoreFinancialGoalSchema),
  restoreFinancialGoalController,
);

router.delete(
  "/:id/permanent",
  validateRequest(permanentlyDeleteFinancialGoalSchema),
  permanentlyDeleteFinancialGoalController,
);

router.get(
  "/:id",
  validateRequest(getFinancialGoalByIdSchema),
  getFinancialGoalByIdController,
);

router.patch(
  "/:id",
  validateRequest(updateFinancialGoalSchema),
  updateFinancialGoalController,
);

router.delete(
  "/:id",
  validateRequest(archiveFinancialGoalSchema),
  archiveFinancialGoalController,
);

module.exports = router;

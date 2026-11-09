const express = require("express");
const router = express.Router({ mergeParams: true });

const { protect } = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateRequest");

const {
  createGoalContributionController,
  getGoalContributionsController,
} = require("../controllers/goalContributionController");

const {
  createGoalContributionSchema,
  getGoalContributionsSchema,
} = require("../validators/goalContributionValidator");

router.use(protect);

router
  .route("/")
  .get(
    validateRequest(getGoalContributionsSchema),
    getGoalContributionsController,
  )
  .post(
    validateRequest(createGoalContributionSchema),
    createGoalContributionController,
  );

module.exports = router;

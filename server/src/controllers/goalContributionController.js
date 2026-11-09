const asyncHandler = require("../utils/asyncHandler");

const {
  createGoalContribution,
  getGoalContributions,
} = require("../services/goalContributionService");

const createGoalContributionController = asyncHandler(async (req, res) => {
  const result = await createGoalContribution(
    req.user._id,
    req.validatedParams.id,
    req.body,
  );

  res.status(201).json({
    success: true,
    message: "Goal contribution recorded successfully.",
    data: result,
  });
});

const getGoalContributionsController = asyncHandler(async (req, res) => {
  const result = await getGoalContributions(
    req.user._id,
    req.validatedParams.id,
    req.validatedQuery,
  );

  res.status(200).json({
    success: true,
    data: result,
  });
});

module.exports = {
  createGoalContributionController,
  getGoalContributionsController,
};

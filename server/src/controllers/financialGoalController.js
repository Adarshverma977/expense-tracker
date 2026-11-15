const asyncHandler = require("../utils/asyncHandler");

const {
  createFinancialGoal,
  getFinancialGoals,
  getFinancialGoalById,
  updateFinancialGoal,
  archiveFinancialGoal,
  restoreFinancialGoal,
  permanentlyDeleteFinancialGoal,
} = require("../services/financialGoalService");

const createFinancialGoalController = asyncHandler(async (req, res) => {
  const goal = await createFinancialGoal(req.user._id, req.body);

  res.status(201).json({
    success: true,
    message: "Financial goal created successfully.",
    data: {
      goal,
    },
  });
});

const getFinancialGoalsController = asyncHandler(async (req, res) => {
  const goals = await getFinancialGoals(req.user._id, req.validatedQuery);

  res.status(200).json({
    success: true,
    count: goals.length,
    data: {
      goals,
    },
  });
});

const getFinancialGoalByIdController = asyncHandler(async (req, res) => {
  const goal = await getFinancialGoalById(req.user._id, req.validatedParams.id);

  res.status(200).json({
    success: true,
    data: {
      goal,
    },
  });
});

const updateFinancialGoalController = asyncHandler(async (req, res) => {
  const goal = await updateFinancialGoal(
    req.user._id,
    req.validatedParams.id,
    req.body,
  );

  res.status(200).json({
    success: true,
    message: "Financial goal updated successfully.",
    data: {
      goal,
    },
  });
});

const archiveFinancialGoalController = asyncHandler(async (req, res) => {
  const result = await archiveFinancialGoal(
    req.user._id,
    req.validatedParams.id,
  );

  res.status(200).json({
    success: true,
    ...result,
  });
});

const restoreFinancialGoalController = asyncHandler(async (req, res) => {
  const goal = await restoreFinancialGoal(req.user._id, req.validatedParams.id);

  res.status(200).json({
    success: true,
    message: "Financial goal restored successfully.",
    data: {
      goal,
    },
  });
});

const permanentlyDeleteFinancialGoalController = asyncHandler(
  async (req, res) => {
    const result = await permanentlyDeleteFinancialGoal(
      req.user._id,
      req.validatedParams.id,
    );

    res.status(200).json({
      success: true,
      ...result,
    });
  },
);

module.exports = {
  createFinancialGoalController,
  getFinancialGoalsController,
  getFinancialGoalByIdController,
  updateFinancialGoalController,
  archiveFinancialGoalController,
  restoreFinancialGoalController,
  permanentlyDeleteFinancialGoalController,
};

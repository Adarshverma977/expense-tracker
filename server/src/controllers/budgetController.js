const asyncHandler = require("../utils/asyncHandler");

const {
  createBudget,
  getBudgets,
  getBudgetById,
  updateBudget,
  deleteBudget,
} = require("../services/budgetService");

// POST /api/budgets
const createBudgetController = asyncHandler(async (req, res) => {
  const budget = await createBudget(req.user._id, req.body);

  res.status(201).json({
    success: true,
    message: "Budget created successfully.",
    data: {
      budget,
    },
  });
});

// GET /api/budgets
const getBudgetsController = asyncHandler(async (req, res) => {
  const result = await getBudgets(req.user._id, req.validatedQuery);

  res.status(200).json({
    success: true,
    count: result.budgets.length,
    data: result,
  });
});

// GET /api/budgets/:id
const getBudgetByIdController = asyncHandler(async (req, res) => {
  const budget = await getBudgetById(req.user._id, req.validatedParams.id);

  res.status(200).json({
    success: true,
    data: {
      budget,
    },
  });
});

// PATCH /api/budgets/:id
const updateBudgetController = asyncHandler(async (req, res) => {
  const budget = await updateBudget(
    req.user._id,
    req.validatedParams.id,
    req.body,
  );

  res.status(200).json({
    success: true,
    message: "Budget updated successfully.",
    data: {
      budget,
    },
  });
});

// DELETE /api/budgets/:id
const deleteBudgetController = asyncHandler(async (req, res) => {
  const result = await deleteBudget(req.user._id, req.validatedParams.id);

  res.status(200).json({
    success: true,
    ...result,
  });
});

module.exports = {
  createBudgetController,
  getBudgetsController,
  getBudgetByIdController,
  updateBudgetController,
  deleteBudgetController,
};

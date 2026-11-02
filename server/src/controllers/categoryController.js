const asyncHandler = require("../utils/asyncHandler");

const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../services/categoryService");

// GET /api/categories
const getCategoriesController = asyncHandler(async (req, res) => {
  const categories = await getCategories(req.user._id, req.validatedQuery);

  res.status(200).json({
    success: true,
    count: categories.length,
    data: {
      categories,
    },
  });
});

// POST /api/categories
const createCategoryController = asyncHandler(async (req, res) => {
  const category = await createCategory(req.user._id, req.body);

  res.status(201).json({
    success: true,
    message: "Category created successfully.",
    data: {
      category,
    },
  });
});

// PATCH /api/categories/:id
const updateCategoryController = asyncHandler(async (req, res) => {
  const category = await updateCategory(
    req.user._id,
    req.validatedParams.id,
    req.body,
  );

  res.status(200).json({
    success: true,
    message: "Category updated successfully.",
    data: {
      category,
    },
  });
});

// DELETE /api/categories/:id
const deleteCategoryController = asyncHandler(async (req, res) => {
  const result = await deleteCategory(req.user._id, req.validatedParams.id);

  res.status(200).json({
    success: true,
    ...result,
  });
});

module.exports = {
  getCategoriesController,
  createCategoryController,
  updateCategoryController,
  deleteCategoryController,
};

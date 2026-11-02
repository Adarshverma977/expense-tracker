const mongoose = require("mongoose");
const Category = require("../models/Category");
const AppError = require("../utils/AppError");

// Get default and logged-in user's custom categories.
const getCategories = async (userId, filters = {}) => {
  const query = {
    isActive: true,
    $or: [{ isDefault: true }, { user: userId, isDefault: false }],
  };

  if (filters.type) {
    query.type = filters.type;
  }

  const categories = await Category.find(query)
    .select("-normalizedName")
    .sort({ type: 1, name: 1 })
    .lean();

  return categories;
};

// Create a custom category.
const createCategory = async (userId, categoryData) => {
  if (!mongoose.isValidObjectId(userId)) {
    throw new AppError("Invalid user.", 400);
  }

  const { name, type, icon, color } = categoryData;

  try {
    const category = await Category.create({
      user: userId,
      name,
      type,
      icon,
      color,
      isDefault: false,
      isActive: true,
    });

    return category;
  } catch (error) {
    if (error.code === 11000) {
      throw new AppError(
        "A category with this name and type already exists.",
        409,
      );
    }

    throw error;
  }
};

// Update an existing custom category.
const updateCategory = async (userId, categoryId, updates) => {
  if (!mongoose.isValidObjectId(categoryId)) {
    throw new AppError("Invalid category ID.", 400);
  }

  const category = await Category.findOne({
    _id: categoryId,
    user: userId,
    isDefault: false,
  });

  if (!category) {
    throw new AppError("Custom category not found or access denied.", 404);
  }

  // Only these fields can be updated.
  if (updates.name !== undefined) {
    category.name = updates.name;
  }

  if (updates.icon !== undefined) {
    category.icon = updates.icon;
  }

  if (updates.color !== undefined) {
    category.color = updates.color;
  }

  try {
    await category.save();
  } catch (error) {
    if (error.code === 11000) {
      throw new AppError(
        "A category with this name and type already exists.",
        409,
      );
    }

    throw error;
  }

  return category;
};

// Soft-delete a custom category.
const deleteCategory = async (userId, categoryId) => {
  if (!mongoose.isValidObjectId(categoryId)) {
    throw new AppError("Invalid category ID.", 400);
  }

  const category = await Category.findOne({
    _id: categoryId,
    user: userId,
    isDefault: false,
    isActive: true,
  });

  if (!category) {
    throw new AppError("Custom category not found or access denied.", 404);
  }

  category.isActive = false;
  await category.save();

  return {
    message: "Category deactivated successfully.",
  };
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};

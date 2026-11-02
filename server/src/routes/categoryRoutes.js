const express = require("express");

const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateRequest");

const {
  getCategoriesController,
  createCategoryController,
  updateCategoryController,
  deleteCategoryController,
} = require("../controllers/categoryController");

const {
  getCategoriesSchema,
  createCategorySchema,
  updateCategorySchema,
  deleteCategorySchema,
} = require("../validators/categoryValidator");

// All category routes require authentication.
router.use(protect);

// GET /api/categories
router.get("/", validateRequest(getCategoriesSchema), getCategoriesController);

// POST /api/categories
router.post(
  "/",
  validateRequest(createCategorySchema),
  createCategoryController,
);

// PATCH /api/categories/:id
router.patch(
  "/:id",
  validateRequest(updateCategorySchema),
  updateCategoryController,
);

// DELETE /api/categories/:id
router.delete(
  "/:id",
  validateRequest(deleteCategorySchema),
  deleteCategoryController,
);

module.exports = router;

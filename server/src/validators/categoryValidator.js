const { z } = require("zod");

const objectIdSchema = z
  .string()
  .regex(/^[a-fA-F0-9]{24}$/, "Invalid category ID");

// GET /api/categories?type=expense
const getCategoriesSchema = z.object({
  body: z.object({}).strict(),
  query: z
    .object({
      type: z.enum(["income", "expense"]).optional(),
    })
    .strict(),
  params: z.object({}).strict(),
});

// POST /api/categories
const createCategorySchema = z.object({
  body: z
    .object({
      name: z
        .string()
        .trim()
        .min(2, "Category name must be at least 2 characters")
        .max(30, "Category name cannot exceed 30 characters"),

      type: z.enum(["income", "expense"]),

      icon: z.string().trim().min(1).max(50).optional(),

      color: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex color")
        .optional(),
    })
    .strict(),

  query: z.object({}).strict(),
  params: z.object({}).strict(),
});

// PATCH /api/categories/:id
const updateCategorySchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(2).max(30).optional(),

      icon: z.string().trim().min(1).max(50).optional(),

      color: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex color")
        .optional(),
    })
    .strict()
    .refine(
      (data) => Object.keys(data).length > 0,
      "At least one field is required for update",
    ),

  query: z.object({}).strict(),

  params: z
    .object({
      id: objectIdSchema,
    })
    .strict(),
});

// DELETE /api/categories/:id
const deleteCategorySchema = z.object({
  body: z.object({}).strict(),
  query: z.object({}).strict(),

  params: z
    .object({
      id: objectIdSchema,
    })
    .strict(),
});

module.exports = {
  getCategoriesSchema,
  createCategorySchema,
  updateCategorySchema,
  deleteCategorySchema,
};

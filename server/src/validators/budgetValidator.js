const { z } = require("zod");

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

// Budget amount validation
const amountSchema = z
  .string()
  .trim()
  .max(15, "Budget amount is too large.")
  .regex(
    /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/,
    "Budget amount must be a valid positive number with at most 2 decimal places.",
  )
  .refine(
    (value) => /[1-9]/.test(value),
    "Budget amount must be greater than zero.",
  );

// MongoDB ObjectId validation
const categoryIdSchema = z
  .string()
  .regex(objectIdRegex, "Invalid category ID.");

const budgetIdSchema = z.string().regex(objectIdRegex, "Invalid budget ID.");

// Query parameter validation
const monthSchema = z
  .string()
  .regex(/^\d{1,2}$/, "Month must be a valid integer.")
  .transform(Number)
  .pipe(
    z
      .number()
      .int("Month must be an integer.")
      .min(1, "Month must be between 1 and 12.")
      .max(12, "Month must be between 1 and 12."),
  );

const yearSchema = z
  .string()
  .regex(/^\d{4}$/, "Year must be a valid four-digit year.")
  .transform(Number)
  .pipe(
    z
      .number()
      .int("Year must be an integer.")
      .min(2000, "Invalid budget year.")
      .max(9999, "Invalid budget year."),
  );

// CREATE BUDGET
const createBudgetSchema = z.object({
  body: z
    .object({
      category: categoryIdSchema,
      amount: amountSchema,
      month: z.number().int().min(1).max(12),
      year: z.number().int().min(2000).max(9999),
    })
    .strict(),

  query: z.object({}).strict(),
  params: z.object({}).strict(),
});

// GET MONTHLY BUDGETS
const getBudgetsSchema = z.object({
  body: z.object({}).strict(),

  query: z
    .object({
      month: monthSchema,
      year: yearSchema,
    })
    .strict(),

  params: z.object({}).strict(),
});

// GET SINGLE BUDGET
const getBudgetByIdSchema = z.object({
  body: z.object({}).strict(),
  query: z.object({}).strict(),

  params: z
    .object({
      id: budgetIdSchema,
    })
    .strict(),
});

// UPDATE BUDGET
const updateBudgetSchema = z.object({
  body: z
    .object({
      amount: amountSchema,
    })
    .strict(),

  query: z.object({}).strict(),

  params: z
    .object({
      id: budgetIdSchema,
    })
    .strict(),
});

// DELETE BUDGET
const deleteBudgetSchema = getBudgetByIdSchema;

module.exports = {
  createBudgetSchema,
  getBudgetsSchema,
  getBudgetByIdSchema,
  updateBudgetSchema,
  deleteBudgetSchema,
};

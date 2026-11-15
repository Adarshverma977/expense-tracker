const { z } = require("zod");

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const goalIdSchema = z
  .string()
  .regex(objectIdRegex, "Invalid financial goal ID.");

const amountSchema = z
  .string()
  .trim()
  .max(15, "Target amount is too large.")
  .regex(
    /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/,
    "Amount must be a valid number with at most 2 decimal places.",
  )
  .refine((value) => /[1-9]/.test(value), "Amount must be greater than zero.")
  .refine((value) => {
    const [whole] = value.split(".");
    return BigInt(whole) <= 999999999999n;
  }, "Target amount exceeds the maximum allowed value.");

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must follow YYYY-MM-DD format.")
  .refine((value) => {
    const [year, month, day] = value.split("-").map(Number);

    const date = new Date(Date.UTC(year, month - 1, day));

    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  }, "Please provide a valid calendar date.");

const titleSchema = z
  .string()
  .trim()
  .min(2, "Goal title must contain at least 2 characters.")
  .max(100, "Goal title cannot exceed 100 characters.");

const descriptionSchema = z
  .string()
  .trim()
  .max(500, "Description cannot exceed 500 characters.");

const iconSchema = z
  .string()
  .trim()
  .min(1, "Icon cannot be empty.")
  .max(50, "Icon identifier cannot exceed 50 characters.")
  .regex(
    /^[a-z0-9-]+$/,
    "Icon must contain only lowercase letters, numbers and hyphens.",
  );

const colorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Please provide a valid hexadecimal color.");

const statusSchema = z.enum(["active", "completed", "archived"]);

const createFinancialGoalSchema = z.object({
  body: z
    .object({
      title: titleSchema,
      description: descriptionSchema.optional(),
      targetAmount: amountSchema,
      targetDate: dateSchema,
      icon: iconSchema.optional(),
      color: colorSchema.optional(),
    })
    .strict(),

  query: z.object({}).strict(),
  params: z.object({}).strict(),
});

const getFinancialGoalsSchema = z.object({
  body: z.object({}).strict(),

  query: z
    .object({
      status: statusSchema.optional(),
    })
    .strict(),

  params: z.object({}).strict(),
});

const getFinancialGoalByIdSchema = z.object({
  body: z.object({}).strict(),
  query: z.object({}).strict(),

  params: z
    .object({
      id: goalIdSchema,
    })
    .strict(),
});

const updateFinancialGoalSchema = z.object({
  body: z
    .object({
      title: titleSchema.optional(),
      description: descriptionSchema.optional(),
      targetAmount: amountSchema.optional(),
      targetDate: dateSchema.optional(),
      icon: iconSchema.optional(),
      color: colorSchema.optional(),
    })
    .strict()
    .refine(
      (data) => Object.keys(data).length > 0,
      "At least one field must be provided for update.",
    ),

  query: z.object({}).strict(),

  params: z
    .object({
      id: goalIdSchema,
    })
    .strict(),
});

const archiveFinancialGoalSchema = getFinancialGoalByIdSchema;

const restoreFinancialGoalSchema = getFinancialGoalByIdSchema;

const permanentlyDeleteFinancialGoalSchema = getFinancialGoalByIdSchema;

module.exports = {
  createFinancialGoalSchema,
  getFinancialGoalsSchema,
  getFinancialGoalByIdSchema,
  updateFinancialGoalSchema,
  archiveFinancialGoalSchema,
  restoreFinancialGoalSchema,
  permanentlyDeleteFinancialGoalSchema,
};

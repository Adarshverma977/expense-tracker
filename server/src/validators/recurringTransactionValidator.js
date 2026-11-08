const mongoose = require("mongoose");
const { z } = require("zod");

const validFrequencies = ["daily", "weekly", "monthly", "yearly"];
const validTypes = ["income", "expense"];
const validPaymentMethods = ["cash", "upi", "card", "bank_transfer", "other"];
const validStatuses = ["active", "paused", "cancelled", "completed"];

// Empty objects for unused request sections.
const emptyObjectSchema = z.object({}).strict();

// Validate date strings strictly as YYYY-MM-DD.
const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD format.")
  .refine((value) => {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  }, "Invalid calendar date.");

// Validate monetary amounts.
const amountSchema = z
  .string()
  .regex(
    /^\d+(\.\d{1,2})?$/,
    "Amount must be positive and have at most 2 decimal places.",
  )
  .refine((value) => Number.isFinite(Number(value)) && Number(value) > 0, {
    message: "Amount must be greater than zero.",
  })
  .refine((value) => Number(value) <= 999999999999.99, {
    message: "Amount exceeds the maximum allowed value.",
  });

// Validate MongoDB ObjectIds.
const objectIdSchema = z
  .string()
  .refine((value) => mongoose.isValidObjectId(value), "Invalid ID format.");

// Validate creation requests.
const createRecurringTransactionSchema = z
  .object({
    body: z
      .object({
        title: z.string().trim().min(2).max(100),
        amount: amountSchema,
        type: z.enum(validTypes),
        category: objectIdSchema,
        description: z.string().trim().max(500).optional().default(""),
        paymentMethod: z.enum(validPaymentMethods).optional().default("other"),
        frequency: z.enum(validFrequencies),
        startDate: dateSchema,
        endDate: dateSchema.nullable().optional().default(null),
      })
      .strict()
      .refine((data) => !data.endDate || data.endDate >= data.startDate, {
        message: "End date cannot be before start date.",
        path: ["endDate"],
      }),

    query: emptyObjectSchema,
    params: emptyObjectSchema,
  })
  .strict();

// Validate update requests.
const updateRecurringTransactionSchema = z
  .object({
    params: z
      .object({
        id: objectIdSchema,
      })
      .strict(),

    body: z
      .object({
        title: z.string().trim().min(2).max(100).optional(),
        amount: amountSchema.optional(),
        type: z.enum(validTypes).optional(),
        category: objectIdSchema.optional(),
        description: z.string().trim().max(500).optional(),
        paymentMethod: z.enum(validPaymentMethods).optional(),
        frequency: z.enum(validFrequencies).optional(),
        startDate: dateSchema.optional(),
        endDate: dateSchema.nullable().optional(),
      })
      .strict()
      .refine(
        (data) => Object.keys(data).length > 0,
        "At least one field must be provided.",
      ),

    query: emptyObjectSchema,
  })
  .strict();

// Validate schedule ID.
const recurringTransactionIdSchema = z
  .object({
    params: z
      .object({
        id: objectIdSchema,
      })
      .strict(),

    body: emptyObjectSchema,
    query: emptyObjectSchema,
  })
  .strict();

// Validate list filters.
const getRecurringTransactionsSchema = z
  .object({
    query: z
      .object({
        status: z.enum(validStatuses).optional(),
        type: z.enum(validTypes).optional(),
        frequency: z.enum(validFrequencies).optional(),
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(50).default(10),
        sort: z.enum(["newest", "oldest", "next_due"]).default("newest"),
      })
      .strict(),

    body: emptyObjectSchema,
    params: emptyObjectSchema,
  })
  .strict();

module.exports = {
  createRecurringTransactionSchema,
  updateRecurringTransactionSchema,
  recurringTransactionIdSchema,
  getRecurringTransactionsSchema,
};

const { z } = require("zod");

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const amountSchema = z
  .string()
  .trim()
  .max(15, "Amount is too large.")
  .regex(
    /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/,
    "Amount must be a valid positive number with at most 2 decimal places.",
  )
  .refine((value) => /[1-9]/.test(value), "Amount must be greater than zero.");

const categoryIdSchema = z
  .string()
  .regex(objectIdRegex, "Invalid category ID.");

const dateSchema = z.string().datetime({ offset: true });

// CREATE TRANSACTION

const createTransactionSchema = z.object({
  body: z
    .object({
      title: z.string().trim().min(2).max(100),

      amount: amountSchema,

      type: z.enum(["income", "expense"]),

      category: categoryIdSchema,

      description: z.string().trim().max(500).optional().default(""),

      date: dateSchema.optional(),

      paymentMethod: z
        .enum(["cash", "upi", "card", "bank_transfer", "other"])
        .optional()
        .default("other"),
    })
    .strict(),

  query: z.object({}).strict(),
  params: z.object({}).strict(),
});

// GET TRANSACTIONS

const getTransactionsSchema = z.object({
  body: z.object({}).strict(),

  query: z
    .object({
      type: z.enum(["income", "expense"]).optional(),

      category: categoryIdSchema.optional(),

      startDate: dateSchema.optional(),

      endDate: dateSchema.optional(),

      page: z.coerce.number().int().positive().default(1),

      limit: z.coerce.number().int().min(1).max(100).default(10),

      sort: z.enum(["newest", "oldest"]).default("newest"),
    })
    .strict()
    .refine(
      (query) =>
        !query.startDate ||
        !query.endDate ||
        new Date(query.startDate) <= new Date(query.endDate),
      {
        message: "startDate cannot be later than endDate.",
        path: ["startDate"],
      },
    ),

  params: z.object({}).strict(),
});

// UPDATE TRANSACTION

const updateTransactionSchema = z.object({
  body: z
    .object({
      title: z.string().trim().min(2).max(100).optional(),

      amount: amountSchema.optional(),

      type: z.enum(["income", "expense"]).optional(),

      category: categoryIdSchema.optional(),

      description: z.string().trim().max(500).optional(),

      date: dateSchema.optional(),

      paymentMethod: z
        .enum(["cash", "upi", "card", "bank_transfer", "other"])
        .optional(),
    })
    .strict()
    .refine(
      (data) => Object.keys(data).length > 0,
      "At least one field is required for update.",
    ),

  query: z.object({}).strict(),

  params: z
    .object({
      id: categoryIdSchema,
    })
    .strict(),
});

// DELETE / GET SINGLE TRANSACTION

const transactionIdSchema = z.object({
  body: z.object({}).strict(),
  query: z.object({}).strict(),

  params: z
    .object({
      id: categoryIdSchema,
    })
    .strict(),
});

module.exports = {
  createTransactionSchema,
  getTransactionsSchema,
  updateTransactionSchema,
  transactionIdSchema,
};

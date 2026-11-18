const { z } = require("zod");

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format.");

const amountSchema = z
  .string()
  .trim()
  .max(15, "Amount is too large.")
  .regex(
    /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/,
    "Amount must be a valid positive number with at most 2 decimal places.",
  )
  .refine((value) => {
    const [whole, fraction = ""] = value.split(".");
    const minorUnits = BigInt(whole + fraction.padEnd(2, "0"));

    return minorUnits > 0n && minorUnits <= 99999999999999n;
  }, "Amount must be greater than zero and within the allowed limit.");

const dateSchema = z.coerce.date({
  errorMap: () => ({
    message: "A valid date is required.",
  }),
});

const frequencySchema = z.enum([
  "one_time",
  "weekly",
  "monthly",
  "quarterly",
  "yearly",
]);

const statusSchema = z.enum(["active", "paused", "archived"]);

const reminderDaysSchema = z
  .array(z.number().int().min(0).max(30))
  .max(31)
  .refine(
    (values) => new Set(values).size === values.length,
    "Reminder days must be unique.",
  );

const createBillSchema = z
  .object({
    title: z.string().trim().min(2).max(100),

    payee: z.string().trim().max(100).optional().default(""),

    description: z.string().trim().max(500).optional().default(""),

    amount: amountSchema,

    category: objectIdSchema,

    wallet: objectIdSchema.nullable().optional().default(null),

    frequency: frequencySchema.optional().default("one_time"),

    dueDate: dateSchema,

    nextDueDate: dateSchema.nullable().optional(),

    reminderDays: reminderDaysSchema.optional().default([7, 3, 1]),

    notes: z.string().trim().max(1000).optional().default(""),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.frequency === "one_time" && data.nextDueDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["nextDueDate"],
        message: "One-time bills cannot have a next due date.",
      });
    }

    if (
      data.frequency !== "one_time" &&
      data.nextDueDate &&
      data.nextDueDate <= data.dueDate
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["nextDueDate"],
        message: "Next due date must be later than the current due date.",
      });
    }
  });

const updateBillSchema = z
  .object({
    title: z.string().trim().min(2).max(100).optional(),

    payee: z.string().trim().max(100).optional(),

    description: z.string().trim().max(500).optional(),

    amount: amountSchema.optional(),

    category: objectIdSchema.optional(),

    wallet: objectIdSchema.nullable().optional(),

    frequency: frequencySchema.optional(),

    dueDate: dateSchema.optional(),

    nextDueDate: dateSchema.nullable().optional(),

    status: statusSchema.optional(),

    reminderDays: reminderDaysSchema.optional(),

    notes: z.string().trim().max(1000).optional(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    "At least one field is required for an update.",
  )
  .superRefine((data, ctx) => {
    if (data.frequency === "one_time" && data.nextDueDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["nextDueDate"],
        message: "One-time bills cannot have a next due date.",
      });
    }

    if (
      data.frequency &&
      data.frequency !== "one_time" &&
      data.dueDate &&
      data.nextDueDate &&
      data.nextDueDate <= data.dueDate
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["nextDueDate"],
        message: "Next due date must be later than the current due date.",
      });
    }
  });

const getBillsSchema = z
  .object({
    status: statusSchema.optional(),

    frequency: frequencySchema.optional(),

    category: objectIdSchema.optional(),

    wallet: objectIdSchema.optional(),

    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid start date.")
      .optional(),

    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid end date.")
      .optional(),

    due: z.enum(["upcoming", "overdue", "today"]).optional(),

    page: z.coerce.number().int().min(1).default(1),

    limit: z.coerce.number().int().min(1).max(100).default(10),

    sort: z
      .enum(["newest", "oldest", "due_soon", "amount_high", "amount_low"])
      .default("due_soon"),
  })
  .strict()
  .refine(
    (data) =>
      !data.startDate || !data.endDate || data.startDate <= data.endDate,
    {
      message: "startDate cannot be later than endDate.",
      path: ["endDate"],
    },
  );

const billIdSchema = z.object({
  id: objectIdSchema,
});

module.exports = {
  createBillSchema,
  updateBillSchema,
  getBillsSchema,
  billIdSchema,
};

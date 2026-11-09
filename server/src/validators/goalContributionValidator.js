const { z } = require("zod");

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid financial goal ID.");

const amountSchema = z
  .string()
  .max(15, "Amount is too large.")
  .regex(
    /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/,
    "Amount must be a valid positive number with up to 2 decimal places.",
  )
  .refine((value) => {
    const [whole, fraction = ""] = value.split(".");
    return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0")) > 0n;
  }, "Amount must be greater than zero.")
  .refine((value) => {
    const [whole] = value.split(".");
    return BigInt(whole) <= 999999999999n;
  }, "Amount exceeds the allowed limit.");

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
  }, "Please provide a valid calendar date.");

const createGoalContributionSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z
    .object({
      type: z.enum(["deposit", "withdrawal"]),
      amount: amountSchema,
      note: z.string().trim().max(300).optional().default(""),
      date: dateSchema.optional(),
    })
    .strict(),
});

const getGoalContributionsSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  query: z
    .object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(50).default(20),
      type: z.enum(["deposit", "withdrawal"]).optional(),
    })
    .strict(),
});

module.exports = {
  createGoalContributionSchema,
  getGoalContributionsSchema,
};

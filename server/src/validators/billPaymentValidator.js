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
  }, "Payment amount must be greater than zero and within the allowed limit.");

const dateSchema = z.coerce.date({
  errorMap: () => ({
    message: "A valid payment date is required.",
  }),
});

const calendarDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format.")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);

    return (
      !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
    );
  }, "Invalid calendar date.");

const createBillPaymentSchema = z
  .object({
    bill: objectIdSchema,

    wallet: objectIdSchema,

    amount: amountSchema,

    paidAt: dateSchema.optional(),

    idempotencyKey: z
      .string()
      .trim()
      .min(8, "Idempotency key must contain at least 8 characters.")
      .max(200, "Idempotency key is too long."),

    notes: z.string().trim().max(500).optional().default(""),
  })
  .strict();

const getBillPaymentsSchema = z
  .object({
    bill: objectIdSchema.optional(),

    wallet: objectIdSchema.optional(),

    startDate: calendarDateSchema.optional(),

    endDate: calendarDateSchema.optional(),

    status: z.enum(["completed", "reversed"]).optional(),

    page: z.coerce.number().int().min(1).default(1),

    limit: z.coerce.number().int().min(1).max(100).default(10),

    sort: z
      .enum(["newest", "oldest", "amount_high", "amount_low"])
      .default("newest"),
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

const billPaymentIdSchema = z.object({
  id: objectIdSchema,
});

module.exports = {
  createBillPaymentSchema,
  getBillPaymentsSchema,
  billPaymentIdSchema,
};

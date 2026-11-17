const mongoose = require("mongoose");
const { z } = require("zod");

const emptyObjectSchema = z.object({}).strict();

const objectIdSchema = z
  .string()
  .refine((value) => mongoose.isValidObjectId(value), "Invalid ID format.");

const amountSchema = z
  .string()
  .regex(
    /^\d+(?:\.\d{1,2})?$/,
    "Amount must be positive and have at most 2 decimal places.",
  )
  .refine((value) => {
    const [whole, decimal = ""] = value.split(".");
    const paise = BigInt(whole + decimal.padEnd(2, "0"));

    return paise > 0n && paise <= 99999999999999n;
  }, "Amount is outside the allowed range.");

const dateSchema = z.coerce.date({
  invalid_type_error: "Invalid transfer date.",
});

const dateFilterSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2}))?$/,
    "Date must use YYYY-MM-DD or ISO datetime format.",
  )
  .refine((value) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return false;
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return date.toISOString().slice(0, 10) === value;
    }

    return true;
  }, "Invalid date.");

const createTransferSchema = z
  .object({
    body: z
      .object({
        fromWallet: objectIdSchema,
        toWallet: objectIdSchema,
        amount: amountSchema,
        description: z.string().trim().max(500).optional().default(""),
        date: dateSchema.optional().default(() => new Date()),
        idempotencyKey: z
          .string()
          .trim()
          .min(8, "Idempotency key must contain at least 8 characters.")
          .max(150, "Idempotency key cannot exceed 150 characters."),
      })
      .strict()
      .refine((data) => data.fromWallet !== data.toWallet, {
        message: "Source and destination wallets must be different.",
        path: ["toWallet"],
      }),

    query: emptyObjectSchema,
    params: emptyObjectSchema,
  })
  .strict();

const getTransfersSchema = z
  .object({
    query: z
      .object({
        fromWallet: objectIdSchema.optional(),
        toWallet: objectIdSchema.optional(),
        startDate: dateFilterSchema.optional(),
        endDate: dateFilterSchema.optional(),
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(50).default(10),
        sort: z.enum(["newest", "oldest"]).default("newest"),
      })
      .strict()
      .refine(
        (data) =>
          !data.startDate ||
          !data.endDate ||
          new Date(data.startDate) <= new Date(data.endDate),
        {
          message: "Start date cannot be after end date.",
          path: ["endDate"],
        },
      ),

    body: emptyObjectSchema,
    params: emptyObjectSchema,
  })
  .strict();

const transferIdSchema = z
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

module.exports = {
  createTransferSchema,
  getTransfersSchema,
  transferIdSchema,
};

const { z } = require("zod");

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid wallet ID.");

const positiveAmountSchema = z
  .string()
  .trim()
  .max(15)
  .regex(
    /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/,
    "Amount must have at most 2 decimal places.",
  )
  .refine((value) => {
    const [whole, fraction = ""] = value.split(".");
    return BigInt(whole + fraction.padEnd(2, "0")) > 0n;
  }, "Amount must be greater than zero.");

const nonNegativeAmountSchema = z
  .string()
  .trim()
  .max(15)
  .regex(
    /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/,
    "Amount must have at most 2 decimal places.",
  );

const walletTypeSchema = z.enum(["cash", "bank", "savings", "credit_card"]);

const createWalletSchema = z
  .object({
    body: z
      .object({
        name: z.string().trim().min(2).max(60),
        type: walletTypeSchema,
        institution: z.string().trim().max(100).optional(),
        creditLimit: positiveAmountSchema.optional(),
        lastFourDigits: z
          .string()
          .regex(/^\d{4}$/, "Enter exactly four digits.")
          .optional(),
        icon: z.string().trim().max(50).optional(),
        color: z.string().trim().max(30).optional(),
        openingBalance: nonNegativeAmountSchema.optional(),
        openingOutstanding: nonNegativeAmountSchema.optional(),
      })
      .strict()
      .superRefine((data, ctx) => {
        if (data.type === "credit_card") {
          if (data.creditLimit === undefined) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["creditLimit"],
              message: "Credit limit is required for credit cards.",
            });
          }

          if (data.openingBalance !== undefined) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["openingBalance"],
              message: "Use openingOutstanding for credit cards.",
            });
          }
        } else {
          if (data.creditLimit !== undefined) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["creditLimit"],
              message: "Credit limit is only allowed for credit cards.",
            });
          }

          if (data.openingOutstanding !== undefined) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["openingOutstanding"],
              message: "Opening outstanding is only allowed for credit cards.",
            });
          }
        }
      }),
    params: z.object({}).strict().optional(),
    query: z.object({}).strict().optional(),
  })
  .strict();

const updateWalletSchema = z
  .object({
    body: z
      .object({
        name: z.string().trim().min(2).max(60).optional(),
        institution: z.string().trim().max(100).optional(),
        creditLimit: positiveAmountSchema.optional(),
        lastFourDigits: z
          .string()
          .regex(/^\d{4}$/, "Enter exactly four digits.")
          .nullable()
          .optional(),
        icon: z.string().trim().max(50).optional(),
        color: z.string().trim().max(30).optional(),
      })
      .strict()
      .refine(
        (data) => Object.keys(data).length > 0,
        "At least one wallet field must be provided.",
      ),
    params: z
      .object({
        id: objectIdSchema,
      })
      .strict(),
    query: z.object({}).strict().optional(),
  })
  .strict();

const getWalletsSchema = z
  .object({
    body: z.object({}).strict().optional(),
    params: z.object({}).strict().optional(),
    query: z
      .object({
        status: z.enum(["active", "archived", "all"]).optional(),
        type: walletTypeSchema.optional(),
      })
      .strict(),
  })
  .strict();

const walletIdSchema = z
  .object({
    body: z.object({}).strict().optional(),
    params: z
      .object({
        id: objectIdSchema,
      })
      .strict(),
    query: z.object({}).strict().optional(),
  })
  .strict();

module.exports = {
  createWalletSchema,
  updateWalletSchema,
  getWalletsSchema,
  walletIdSchema,
};

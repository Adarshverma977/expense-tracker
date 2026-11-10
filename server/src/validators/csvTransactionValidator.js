const { z } = require("zod");

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const categoryIdSchema = z
  .string()
  .regex(objectIdRegex, "Invalid category ID.");

const dateFilterSchema = z.string().refine((value) => {
  // Support YYYY-MM-DD.
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const date = new Date(`${value}T00:00:00.000Z`);

    return (
      !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
    );
  }

  // Support ISO datetime with timezone.
  const isIsoDateTime =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(
      value,
    );

  return isIsoDateTime && !Number.isNaN(new Date(value).getTime());
}, "Date must be YYYY-MM-DD or a valid ISO datetime with timezone.");

const emptyObjectSchema = z.object({}).strict();

// CSV IMPORT

const importTransactionsSchema = z.object({
  body: z.record(z.string(), z.unknown()),
  query: emptyObjectSchema,
  params: emptyObjectSchema,
});

// CSV EXPORT

const exportTransactionsSchema = z.object({
  body: emptyObjectSchema,

  query: z
    .object({
      type: z.enum(["income", "expense"]).optional(),

      category: categoryIdSchema.optional(),

      startDate: dateFilterSchema.optional(),

      endDate: dateFilterSchema.optional(),

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

  params: emptyObjectSchema,
});

module.exports = {
  importTransactionsSchema,
  exportTransactionsSchema,
};

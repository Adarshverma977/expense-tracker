const { z } = require("zod");

const createRequestSchema = (bodySchema) =>
  z
    .object({
      body: bodySchema,
      query: z.object({}).passthrough(),
      params: z.object({}).passthrough(),
    })
    .strict();

const updateProfileSchema = createRequestSchema(
  z
    .object({
      name: z
        .string()
        .trim()
        .min(2, "Name must contain at least 2 characters")
        .max(50, "Name cannot exceed 50 characters")
        .optional(),

      avatar: z.preprocess((value) => {
        if (typeof value === "string" && value.trim() === "") {
          return null;
        }

        return value;
      }, z.string().trim().url("Please provide a valid avatar URL").max(2048, "Avatar URL cannot exceed 2048 characters").nullable().optional()),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one profile field is required",
    }),
);

const updatePreferencesSchema = createRequestSchema(
  z
    .object({
      theme: z.enum(["light", "dark", "system"]).optional(),

      dateFormat: z.enum(["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"]).optional(),

      language: z.enum(["en", "hi"]).optional(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one preference field is required",
    }),
);

const changePasswordSchema = createRequestSchema(
  z
    .object({
      currentPassword: z.string().min(1, "Current password is required"),

      newPassword: z
        .string()
        .min(8, "New password must contain at least 8 characters")
        .max(128, "New password cannot exceed 128 characters"),
    })
    .strict()
    .refine((data) => data.currentPassword !== data.newPassword, {
      message: "New password must be different from current password",
      path: ["newPassword"],
    }),
);

const changeEmailSchema = createRequestSchema(
  z
    .object({
      newEmail: z
        .string()
        .trim()
        .email("Please provide a valid email address")
        .max(254, "Email cannot exceed 254 characters")
        .transform((email) => email.toLowerCase()),
    })
    .strict(),
);

const verifyEmailChangeSchema = createRequestSchema(
  z
    .object({
      token: z.string().trim().min(1, "Verification token is required"),
    })
    .strict(),
);

const deleteAccountSchema = createRequestSchema(
  z
    .object({
      password: z.string().min(1, "Password is required"),
    })
    .strict(),
);

module.exports = {
  updateProfileSchema,
  updatePreferencesSchema,
  changePasswordSchema,
  changeEmailSchema,
  verifyEmailChangeSchema,
  deleteAccountSchema,
};

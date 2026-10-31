const { z } = require("zod");

// Registration validation
const registerSchema = z.object({
  body: z
    .object({
      name: z
        .string()
        .trim()
        .min(2, "Name must contain at least 2 characters")
        .max(50, "Name cannot exceed 50 characters"),

      email: z
        .string()
        .trim()
        .email("Please provide a valid email address")
        .max(254, "Email cannot exceed 254 characters")
        .transform((value) => value.toLowerCase()),

      password: z
        .string()
        .min(8, "Password must contain at least 8 characters")
        .max(72, "Password cannot exceed 72 characters"),

      currency: z
        .string()
        .trim()
        .length(3, "Currency must be a 3-letter currency code")
        .regex(/^[A-Za-z]{3}$/, "Invalid currency code")
        .transform((value) => value.toUpperCase())
        .default("INR"),
    })
    .strict(),

  query: z.object({}),
  params: z.object({}),
});

// Login validation
const loginSchema = z.object({
  body: z
    .object({
      email: z
        .string()
        .trim()
        .email("Please provide a valid email address")
        .max(254, "Email cannot exceed 254 characters")
        .transform((value) => value.toLowerCase()),

      password: z
        .string()
        .min(1, "Password is required")
        .max(72, "Invalid password"),
    })
    .strict(),

  query: z.object({}),
  params: z.object({}),
});

module.exports = {
  registerSchema,
  loginSchema,
};

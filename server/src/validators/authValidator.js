const { z } = require("zod");

// Registration: Send OTP
const sendRegistrationOTPSchema = z.object({
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
        .toLowerCase(),

      password: z
        .string()
        .min(8, "Password must contain at least 8 characters")
        .max(72, "Password cannot exceed 72 characters"),

      currency: z
        .string()
        .trim()
        .length(3, "Currency must contain exactly 3 characters")
        .regex(/^[A-Za-z]{3}$/, "Invalid currency format")
        .transform((value) => value.toUpperCase())
        .default("INR"),
    })
    .strict(),

  query: z.object({}).strict(),
  params: z.object({}).strict(),
});

// Registration: Verify OTP
const verifyRegistrationOTPSchema = z.object({
  body: z
    .object({
      email: z
        .string()
        .trim()
        .email("Please provide a valid email address")
        .max(254, "Email cannot exceed 254 characters")
        .toLowerCase(),

      otp: z.string().regex(/^\d{6}$/, "OTP must be exactly 6 digits"),
    })
    .strict(),

  query: z.object({}).strict(),
  params: z.object({}).strict(),
});

// Login
const loginSchema = z.object({
  body: z
    .object({
      email: z
        .string()
        .trim()
        .email("Please provide a valid email address")
        .max(254, "Email cannot exceed 254 characters")
        .toLowerCase(),

      password: z
        .string()
        .min(1, "Password is required")
        .max(72, "Invalid password"),
    })
    .strict(),

  query: z.object({}).strict(),
  params: z.object({}).strict(),
});

// Forgot Password
const forgotPasswordSchema = z.object({
  body: z
    .object({
      email: z
        .string()
        .trim()
        .email("Please provide a valid email address")
        .max(254, "Email cannot exceed 254 characters")
        .toLowerCase(),
    })
    .strict(),

  query: z.object({}).strict(),
  params: z.object({}).strict(),
});

// Reset Password
const resetPasswordSchema = z.object({
  body: z
    .object({
      token: z
        .string()
        .min(1, "Reset token is required")
        .max(256, "Invalid reset token"),

      password: z
        .string()
        .min(8, "Password must contain at least 8 characters")
        .max(72, "Password cannot exceed 72 characters"),
    })
    .strict(),

  query: z.object({}).strict(),
  params: z.object({}).strict(),
});

module.exports = {
  sendRegistrationOTPSchema,
  verifyRegistrationOTPSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};

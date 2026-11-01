const dotenv = require("dotenv");
const { z } = require("zod");
const path = require("path");

// Load environment variables
dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

// Define environment schema
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  PORT: z.coerce.number().int().positive().default(5000),

  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),

  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),

  JWT_EXPIRES_IN: z.string().default("1d"),

  OTP_SECRET: z.string().min(32),

  SMTP_HOST: z.string().min(1, "SMTP_HOST is required"),

  SMTP_PORT: z.coerce.number().int().positive().default(587),

  SMTP_USER: z.string().min(1, "SMTP_USER is required"),

  SMTP_PASS: z.string().min(1, "SMTP_PASS is required"),

  EMAIL_FROM: z.string().min(1, "EMAIL_FROM is required"),

  CLIENT_URL: z.string().url("CLIENT_URL must be a valid URL"),
});

// Validate environment variables
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("Invalid environment configuration:");

  console.error(z.treeifyError(parsedEnv.error));

  process.exit(1);
}

// Export validated environment variables
const env = Object.freeze(parsedEnv.data);

module.exports = env;

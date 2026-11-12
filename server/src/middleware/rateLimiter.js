const rateLimit = require("express-rate-limit");

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,

  // Authentication endpoints have their own dedicated limiters.
  // Avoid counting them again in the global API limiter.
  skip: (req) => req.path.startsWith("/auth/"),

  standardHeaders: "draft-8",
  legacyHeaders: false,

  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

// Login: maximum 5 failed attempts per 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Too many failed login attempts. Please try again after 15 minutes.",
  },
});

// Password recovery
const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many password recovery requests. Please try again later.",
  },
});

// Registration OTP sending
const otpSendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 3,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many OTP requests. Please try again after 15 minutes.",
  },
});

// Registration OTP verification
const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many OTP verification requests. Please try again later.",
  },
});

// Per-email OTP sending limit
const otpEmailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,

  keyGenerator: (req) => {
    return `email:${String(req.body.email || "")
      .trim()
      .toLowerCase()}`;
  },

  standardHeaders: "draft-8",
  legacyHeaders: false,

  message: {
    success: false,
    message: "OTP request limit reached. Please try again after one hour.",
  },
});

module.exports = {
  apiLimiter,
  loginLimiter,
  passwordResetLimiter,
  otpSendLimiter,
  otpVerifyLimiter,
  otpEmailLimiter,
};

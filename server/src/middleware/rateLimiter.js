const rateLimit = require("express-rate-limit");

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    status: "fail",
    message: "Too many requests. Please try again later.",
  },
});

// Login rate limiter
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    status: "fail",
    message:
      "Too many failed login attempts. Please try again after 15 minutes.",
  },
});

// Password recovery rate limiter
const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    status: "fail",
    message: "Too many password recovery requests. Please try again later.",
  },
});

// OTP sending rate limiter
const otpSendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 3,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    status: "fail",
    message: "Too many OTP requests. Please try again after 15 minutes.",
  },
});

// OTP verification rate limiter
const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    status: "fail",
    message: "Too many OTP verification requests. Please try again later.",
  },
});

// Per-email OTP rate limiter
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

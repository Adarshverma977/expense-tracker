const express = require("express");

const {
  sendRegistrationOTP,
  verifyRegistrationOTP,
  login,
  logout,
  getMe,
} = require("../controllers/authController");

const {
  loginSchema,
  sendRegistrationOTPSchema,
  verifyRegistrationOTPSchema,
} = require("../validators/authValidator");

const validateRequest = require("../middleware/validateRequest");

const {
  authLimiter,
  otpSendLimiter,
  otpVerifyLimiter,
  otpEmailLimiter,
} = require("../middleware/rateLimiter");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Registration: Send OTP
router.post(
  "/register/send-otp",
  otpSendLimiter,
  validateRequest(sendRegistrationOTPSchema),
  otpEmailLimiter,
  sendRegistrationOTP,
);

// Registration: Verify OTP
router.post(
  "/register/verify-otp",
  otpVerifyLimiter,
  validateRequest(verifyRegistrationOTPSchema),
  verifyRegistrationOTP,
);

// Login
router.post("/login", authLimiter, validateRequest(loginSchema), login);

// Logout
router.post("/logout", logout);

// Get current user
router.get("/me", protect, getMe);

module.exports = router;

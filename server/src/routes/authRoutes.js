const express = require("express");

const {
  register,
  login,
  logout,
  getMe,
} = require("../controllers/authController");

const validateRequest = require("../middleware/validateRequest");

const { protect } = require("../middleware/authMiddleware");

const { authLimiter } = require("../middleware/rateLimiter");

const { registerSchema, loginSchema } = require("../validators/authValidator");

const router = express.Router();

// User registration
router.post(
  "/register",
  authLimiter,
  validateRequest(registerSchema),
  register,
);

// User login
router.post("/login", authLimiter, validateRequest(loginSchema), login);

// User logout
router.post("/logout", logout);

// Get authenticated user
router.get("/me", protect, getMe);

module.exports = router;

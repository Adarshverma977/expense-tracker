const {
  sendRegistrationOTP,
  verifyRegistrationOTP,
  loginUser,
  forgotPassword,
  resetPassword,
} = require("../services/authService");

const asyncHandler = require("../utils/asyncHandler");

const setAuthCookie = require("../utils/setAuthCookie");
const clearAuthCookie = require("../utils/clearAuthCookie");

// Send registration OTP
const sendRegistrationOTPController = asyncHandler(async (req, res) => {
  const result = await sendRegistrationOTP(req.body);

  res.status(200).json({
    status: "success",
    message: result.message,
    data: {
      email: result.email,
      expiresIn: result.expiresIn,
      resendAfter: result.resendAfter,
    },
  });
});

// Verify OTP and complete registration
const verifyRegistrationOTPController = asyncHandler(async (req, res) => {
  const user = await verifyRegistrationOTP(req.body);

  res.status(201).json({
    status: "success",
    message: "Email verified and account created successfully",
    data: {
      user,
    },
  });
});

// Login
const login = asyncHandler(async (req, res) => {
  const { user, token } = await loginUser(req.body);

  setAuthCookie(res, token);

  res.status(200).json({
    status: "success",
    message: "Login successful",
    data: {
      user,
    },
  });
});

// Logout
const logout = asyncHandler(async (req, res) => {
  clearAuthCookie(res);

  res.status(200).json({
    status: "success",
    message: "Logout successful",
  });
});

// Get logged-in user
const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    status: "success",
    data: {
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        currency: req.user.currency,
        emailVerified: req.user.emailVerified,
        emailVerifiedAt: req.user.emailVerifiedAt,
        createdAt: req.user.createdAt,
      },
    },
  });
});

// Forgot Password
const forgotPasswordController = asyncHandler(async (req, res) => {
  const result = await forgotPassword(req.body.email);

  res.status(200).json({
    status: "success",
    message: result.message,
  });
});

// Reset Password
const resetPasswordController = asyncHandler(async (req, res) => {
  const result = await resetPassword(req.body);

  res.status(200).json({
    status: "success",
    message: result.message,
  });
});

module.exports = {
  sendRegistrationOTP: sendRegistrationOTPController,
  verifyRegistrationOTP: verifyRegistrationOTPController,
  login,
  logout,
  getMe,
  forgotPassword: forgotPasswordController,
  resetPassword: resetPasswordController,
};

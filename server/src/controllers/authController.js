const asyncHandler = require("../utils/asyncHandler");
const setAuthCookie = require("../utils/setAuthCookie");
const clearAuthCookie = require("../utils/clearAuthCookie");

const { registerUser, loginUser } = require("../services/authService");

// User Registration
const register = asyncHandler(async (req, res) => {
  const user = await registerUser(req.body);

  res.status(201).json({
    success: true,
    message: "Account registered successfully",
    data: { user },
  });
});

// User Login
const login = asyncHandler(async (req, res) => {
  const { user, token } = await loginUser(req.body);

  setAuthCookie(res, token);

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: { user },
  });
});

// User Logout
const logout = asyncHandler(async (req, res) => {
  clearAuthCookie(res);

  res.status(200).json({
    success: true,
    message: "Logout successful",
  });
});

// Get Current User
const getMe = asyncHandler(async (req, res) => {
  const user = req.user;

  res.status(200).json({
    success: true,
    message: "User profile fetched successfully",
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        currency: user.currency,
        createdAt: user.createdAt,
      },
    },
  });
});

module.exports = {
  register,
  login,
  logout,
  getMe,
};

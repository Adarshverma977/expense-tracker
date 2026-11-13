const jwt = require("jsonwebtoken");

const User = require("../models/User");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const env = require("../config/env");

const protect = asyncHandler(async (req, res, next) => {
  // Get token from HTTP-only cookie
  const token = req.cookies?.accessToken;

  if (!token) {
    throw new AppError("Authentication required. Please login.", 401);
  }

  // Verify JWT
  const decoded = jwt.verify(token, env.JWT_SECRET, {
    algorithms: ["HS256"],
  });

  // Find authenticated user
  const user = await User.findById(decoded.sub);

  if (!user) {
    throw new AppError("User associated with this token no longer exists", 401);
  }

  // Validate session version
  if ((decoded.tokenVersion ?? 0) !== (user.tokenVersion ?? 0)) {
    throw new AppError("Your session has expired. Please log in again.", 401);
  }

  // Attach user to request
  req.user = user;

  next();
});

module.exports = {
  protect,
};

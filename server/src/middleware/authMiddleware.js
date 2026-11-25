const jwt = require("jsonwebtoken");

const User = require("../models/User");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const env = require("../config/env");

const getAuthenticatedUser = async (req) => {
  const token = req.cookies?.accessToken;

  if (!token) {
    throw new AppError("Authentication required. Please login.", 401);
  }

  const decoded = jwt.verify(token, env.JWT_SECRET, {
    algorithms: ["HS256"],
  });

  const user = await User.findById(decoded.sub);

  if (!user) {
    throw new AppError(
      "User associated with this token no longer exists.",
      401,
    );
  }

  return { user, decoded };
};

const protect = asyncHandler(async (req, res, next) => {
  const { user, decoded } = await getAuthenticatedUser(req);

  if ((decoded.tokenVersion ?? 0) !== (user.tokenVersion ?? 0)) {
    throw new AppError("Your session has expired. Please log in again.", 401);
  }

  if (user.accountStatus !== "active") {
    throw new AppError("Your account is unavailable.", 403);
  }

  req.user = user;

  next();
});

const protectAccountDeletion = asyncHandler(async (req, res, next) => {
  const { user, decoded } = await getAuthenticatedUser(req);

  if (user.accountStatus === "active") {
    if ((decoded.tokenVersion ?? 0) !== (user.tokenVersion ?? 0)) {
      throw new AppError("Your session has expired. Please log in again.", 401);
    }
  } else if (user.accountStatus !== "deletion_pending") {
    throw new AppError("Account deletion is not available.", 403);
  }

  req.user = user;

  next();
});

module.exports = {
  protect,
  protectAccountDeletion,
};

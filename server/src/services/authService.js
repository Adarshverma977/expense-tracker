const bcrypt = require("bcryptjs");

const User = require("../models/User");
const AppError = require("../utils/AppError");

const registerUser = async (userData) => {
  const { name, email, password, currency } = userData;

  // Check whether user already exists
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new AppError("An account with this email already exists", 409);
  }

  // Hash password before storing it
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create new user
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    currency,
  });

  // Return user without password
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    currency: user.currency,
    createdAt: user.createdAt,
  };
};

module.exports = {
  registerUser,
};

const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const User = require("../models/User");

const EMAIL_CHANGE_EXPIRY_MS = 15 * 60 * 1000;
const PASSWORD_SALT_ROUNDS = 12;

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const getUserProfile = async (userId) => {
  const user = await User.findOne({
    _id: userId,
    accountStatus: "active",
  }).select(
    "name email currency avatar preferences emailVerified emailVerifiedAt createdAt",
  );

  if (!user) {
    throw createError("User not found.", 404);
  }

  return user;
};

const updateUserProfile = async (userId, updates) => {
  const allowedUpdates = {};

  if (updates.name !== undefined) {
    allowedUpdates.name = updates.name;
  }

  if (updates.avatar !== undefined) {
    allowedUpdates.avatar = updates.avatar;
  }

  if (Object.keys(allowedUpdates).length === 0) {
    throw createError("No valid profile fields provided.", 400);
  }

  const user = await User.findOneAndUpdate(
    {
      _id: userId,
      accountStatus: "active",
    },
    {
      $set: allowedUpdates,
    },
    {
      new: true,
      runValidators: true,
    },
  ).select(
    "name email currency avatar preferences emailVerified emailVerifiedAt createdAt",
  );

  if (!user) {
    throw createError("User not found or account is unavailable.", 404);
  }

  return user;
};

const updateUserPreferences = async (userId, updates) => {
  const allowedUpdates = {};

  if (updates.theme !== undefined) {
    allowedUpdates["preferences.theme"] = updates.theme;
  }

  if (updates.dateFormat !== undefined) {
    allowedUpdates["preferences.dateFormat"] = updates.dateFormat;
  }

  if (updates.language !== undefined) {
    allowedUpdates["preferences.language"] = updates.language;
  }

  if (Object.keys(allowedUpdates).length === 0) {
    throw createError("No valid preference fields provided.", 400);
  }

  const user = await User.findOneAndUpdate(
    {
      _id: userId,
      accountStatus: "active",
    },
    {
      $set: allowedUpdates,
    },
    {
      new: true,
      runValidators: true,
    },
  ).select(
    "name email currency avatar preferences emailVerified emailVerifiedAt createdAt",
  );

  if (!user) {
    throw createError("User not found or account is unavailable.", 404);
  }

  return user;
};

const changeUserPassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findOne({
    _id: userId,
    accountStatus: "active",
  }).select("+password tokenVersion");

  if (!user) {
    throw createError("User not found or account is unavailable.", 404);
  }

  const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

  if (!isPasswordValid) {
    throw createError("Current password is incorrect.", 400);
  }

  const hashedPassword = await bcrypt.hash(newPassword, PASSWORD_SALT_ROUNDS);

  const currentTokenVersion = user.tokenVersion || 0;

  const updatedUser = await User.findOneAndUpdate(
    {
      _id: userId,
      accountStatus: "active",
      password: user.password,
      $or: [
        { tokenVersion: currentTokenVersion },
        { tokenVersion: { $exists: false } },
      ],
    },
    {
      $set: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
      $inc: {
        tokenVersion: 1,
      },
    },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!updatedUser) {
    throw createError("Password could not be changed. Please try again.", 409);
  }

  return true;
};

const requestUserEmailChange = async (userId, newEmail) => {
  const normalizedEmail = newEmail.trim().toLowerCase();

  const user = await User.findOne({
    _id: userId,
    accountStatus: "active",
  }).select("email");

  if (!user) {
    throw createError("User not found or account is unavailable.", 404);
  }

  if (user.email === normalizedEmail) {
    throw createError(
      "New email must be different from your current email.",
      400,
    );
  }

  const existingUser = await User.exists({
    email: normalizedEmail,
    _id: { $ne: userId },
  });

  if (existingUser) {
    throw createError("This email address is already in use.", 409);
  }

  const verificationToken = crypto.randomBytes(32).toString("hex");

  const hashedToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");

  const expiresAt = new Date(Date.now() + EMAIL_CHANGE_EXPIRY_MS);

  const updatedUser = await User.findOneAndUpdate(
    {
      _id: userId,
      accountStatus: "active",
    },
    {
      $set: {
        pendingEmail: normalizedEmail,
        emailChangeToken: hashedToken,
        emailChangeExpires: expiresAt,
      },
    },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!updatedUser) {
    throw createError("Could not request email change.", 409);
  }

  return {
    verificationToken,
    pendingEmail: normalizedEmail,
    expiresAt,
  };
};

const verifyUserEmailChange = async (userId, verificationToken) => {
  const hashedToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");

  const user = await User.findOne({
    _id: userId,
    accountStatus: "active",
    emailChangeToken: hashedToken,
    emailChangeExpires: { $gt: new Date() },
  }).select("+pendingEmail +emailChangeToken +emailChangeExpires");

  if (!user || !user.pendingEmail) {
    throw createError("Email verification token is invalid or expired.", 400);
  }

  try {
    const updatedUser = await User.findOneAndUpdate(
      {
        _id: userId,
        accountStatus: "active",
        pendingEmail: user.pendingEmail,
        emailChangeToken: hashedToken,
        emailChangeExpires: { $gt: new Date() },
      },
      {
        $set: {
          email: user.pendingEmail,
          emailVerified: true,
          emailVerifiedAt: new Date(),
          pendingEmail: null,
          emailChangeToken: null,
          emailChangeExpires: null,
        },
        $inc: {
          tokenVersion: 1,
        },
      },
      {
        new: true,
        runValidators: true,
      },
    ).select(
      "name email currency avatar preferences emailVerified emailVerifiedAt createdAt",
    );

    if (!updatedUser) {
      throw createError(
        "Email verification token is invalid, expired, or already used.",
        400,
      );
    }

    return updatedUser;
  } catch (error) {
    if (error.code === 11000) {
      throw createError("This email address is already in use.", 409);
    }

    throw error;
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  updateUserPreferences,
  changeUserPassword,
  requestUserEmailChange,
  verifyUserEmailChange,
};

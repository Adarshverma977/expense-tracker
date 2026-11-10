const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const User = require("../models/User");
const PendingRegistration = require("../models/PendingRegistration");

const AppError = require("../utils/AppError");
const generateToken = require("../utils/generateToken");

const {
  generateOTP,
  hashOTP,
  verifyOTP,
  getOTPExpiry,
  MAX_OTP_ATTEMPTS,
  RESEND_COOLDOWN_SECONDS,
} = require("../utils/otpUtils");

const { sendOTPEmail, sendPasswordResetEmail } = require("./emailService");

// Send registration OTP
const sendRegistrationOTP = async (userData) => {
  const { name, email, password, currency } = userData;

  const normalizedEmail = email.toLowerCase().trim();

  const existingUser = await User.findOne({
    email: normalizedEmail,
  });

  if (existingUser) {
    throw new AppError("An account with this email already exists", 409);
  }

  let pendingRegistration = await PendingRegistration.findOne({
    email: normalizedEmail,
  });

  const now = Date.now();

  if (pendingRegistration) {
    const cooldownEndsAt =
      pendingRegistration.lastSentAt.getTime() + RESEND_COOLDOWN_SECONDS * 1000;

    if (now < cooldownEndsAt) {
      const remainingSeconds = Math.ceil((cooldownEndsAt - now) / 1000);

      throw new AppError(
        `Please wait ${remainingSeconds} seconds before requesting another OTP`,
        429,
      );
    }
  }

  const otp = generateOTP();

  const passwordHash = await bcrypt.hash(password, 12);
  const otpHash = hashOTP(otp);

  if (pendingRegistration) {
    pendingRegistration.name = name;
    pendingRegistration.passwordHash = passwordHash;
    pendingRegistration.currency = currency || "INR";
    pendingRegistration.otpHash = otpHash;
    pendingRegistration.expiresAt = getOTPExpiry();
    pendingRegistration.attempts = 0;
    pendingRegistration.lastSentAt = new Date();
    pendingRegistration.sendCount += 1;
    pendingRegistration.consumedAt = null;

    await pendingRegistration.save();
  } else {
    pendingRegistration = await PendingRegistration.create({
      name,
      email: normalizedEmail,
      passwordHash,
      currency: currency || "INR",
      otpHash,
      expiresAt: getOTPExpiry(),
      attempts: 0,
      lastSentAt: new Date(),
      sendCount: 1,
      consumedAt: null,
    });
  }

  try {
    await sendOTPEmail(normalizedEmail, otp);
  } catch (error) {
    await PendingRegistration.deleteOne({
      _id: pendingRegistration._id,
    });

    throw new AppError(
      "Unable to send verification email. Please try again later.",
      503,
    );
  }

  return {
    email: normalizedEmail,
    message: "Verification OTP sent successfully",
    expiresIn: 300,
    resendAfter: RESEND_COOLDOWN_SECONDS,
  };
};

// Verify registration OTP and create account
const verifyRegistrationOTP = async ({ email, otp }) => {
  const normalizedEmail = email.toLowerCase().trim();

  const pendingRegistration = await PendingRegistration.findOne({
    email: normalizedEmail,
  }).select("+otpHash +passwordHash");

  if (!pendingRegistration) {
    throw new AppError("No pending registration found for this email", 404);
  }

  if (pendingRegistration.consumedAt) {
    throw new AppError("This OTP has already been used", 400);
  }

  if (pendingRegistration.expiresAt.getTime() <= Date.now()) {
    await PendingRegistration.deleteOne({
      _id: pendingRegistration._id,
    });

    throw new AppError("OTP has expired. Please request a new OTP.", 400);
  }

  if (pendingRegistration.attempts >= MAX_OTP_ATTEMPTS) {
    throw new AppError(
      "Maximum OTP attempts exceeded. Please request a new OTP.",
      429,
    );
  }

  const isOTPValid = verifyOTP(otp, pendingRegistration.otpHash);

  if (!isOTPValid) {
    const updatedRegistration = await PendingRegistration.findOneAndUpdate(
      {
        _id: pendingRegistration._id,
        consumedAt: null,
        expiresAt: { $gt: new Date() },
        attempts: { $lt: MAX_OTP_ATTEMPTS },
      },
      {
        $inc: { attempts: 1 },
      },
      { returnDocument: "after" },
    );

    if (!updatedRegistration) {
      throw new AppError(
        "Maximum OTP attempts exceeded. Please request a new OTP.",
        429,
      );
    }

    if (updatedRegistration.attempts >= MAX_OTP_ATTEMPTS) {
      throw new AppError(
        "Maximum OTP attempts exceeded. Please request a new OTP.",
        429,
      );
    }

    throw new AppError("Invalid OTP", 400);
  }

  const existingUser = await User.findOne({
    email: normalizedEmail,
  });

  if (existingUser) {
    throw new AppError("An account with this email already exists", 409);
  }

  const consumedRegistration = await PendingRegistration.findOneAndUpdate(
    {
      _id: pendingRegistration._id,
      otpHash: pendingRegistration.otpHash,
      consumedAt: null,
      expiresAt: { $gt: new Date() },
      attempts: { $lt: MAX_OTP_ATTEMPTS },
    },
    {
      $set: {
        consumedAt: new Date(),
      },
    },
    {
      returnDocument: "after",
      runValidators: true,
    },
  ).select("+passwordHash");

  if (!consumedRegistration) {
    throw new AppError("OTP is invalid, expired, or already used", 400);
  }

  let user;

  try {
    user = await User.create({
      name: consumedRegistration.name,
      email: consumedRegistration.email,
      password: consumedRegistration.passwordHash,
      currency: consumedRegistration.currency,
      emailVerified: true,
      emailVerifiedAt: new Date(),
    });
  } catch (error) {
    await PendingRegistration.updateOne(
      {
        _id: consumedRegistration._id,
        consumedAt: consumedRegistration.consumedAt,
      },
      {
        $set: { consumedAt: null },
      },
    );

    if (error.code === 11000) {
      throw new AppError("An account with this email already exists", 409);
    }

    throw error;
  }

  await PendingRegistration.deleteOne({
    _id: consumedRegistration._id,
  });

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    currency: user.currency,
    emailVerified: user.emailVerified,
    emailVerifiedAt: user.emailVerifiedAt,
    createdAt: user.createdAt,
  };
};

// Login
const loginUser = async (credentials) => {
  const { email, password } = credentials;

  const user = await User.findOne({
    email: email.toLowerCase().trim(),
  }).select("+password");

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new AppError("Invalid email or password", 401);
  }

  const token = generateToken(user._id);

  const safeUser = {
    id: user._id,
    name: user.name,
    email: user.email,
    currency: user.currency,
    emailVerified: user.emailVerified,
    emailVerifiedAt: user.emailVerifiedAt,
    createdAt: user.createdAt,
  };

  return {
    user: safeUser,
    token,
  };
};

// Forgot Password
const forgotPassword = async (email) => {
  const normalizedEmail = email.toLowerCase().trim();

  const genericResponse = {
    message:
      "If an account exists with this email, password reset instructions will be sent.",
  };

  const user = await User.findOne({
    email: normalizedEmail,
  });

  // Do not reveal whether an account exists.
  if (!user) {
    return genericResponse;
  }

  // Generate a cryptographically secure random token.
  const resetToken = crypto.randomBytes(32).toString("hex");

  // Store only the SHA-256 hash in the database.
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  user.passwordResetToken = hashedToken;
  user.passwordResetExpires = expiresAt;

  await user.save();

  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

  const resetUrl = new URL("/reset-password", clientUrl);
  resetUrl.searchParams.set("token", resetToken);

  try {
    await sendPasswordResetEmail(normalizedEmail, resetUrl.toString());
  } catch (error) {
    // Remove the token if email delivery fails.
    await User.updateOne(
      {
        _id: user._id,
        passwordResetToken: hashedToken,
      },
      {
        $unset: {
          passwordResetToken: 1,
          passwordResetExpires: 1,
        },
      },
    );

    console.error("Password reset email delivery failed:", error);
  }

  return genericResponse;
};

// Reset Password
const resetPassword = async ({ token, password }) => {
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const passwordHash = await bcrypt.hash(password, 12);

  // Atomic update prevents reuse of the same reset token.
  const user = await User.findOneAndUpdate(
    {
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    },
    {
      $set: {
        password: passwordHash,
      },
      $unset: {
        passwordResetToken: 1,
        passwordResetExpires: 1,
      },
    },
    {
      returnDocument: "after",
      runValidators: true,
    },
  );

  if (!user) {
    throw new AppError(
      "Password reset link is invalid or has expired. Please request a new link.",
      400,
    );
  }

  return {
    message: "Password has been reset successfully. Please log in.",
  };
};

// Disable legacy direct registration endpoint
const registerUser = async () => {
  throw new AppError(
    "Direct registration is disabled. Please use email OTP verification.",
    410,
  );
};

module.exports = {
  registerUser,
  sendRegistrationOTP,
  verifyRegistrationOTP,
  loginUser,
  forgotPassword,
  resetPassword,
};

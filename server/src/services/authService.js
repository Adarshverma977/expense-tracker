const bcrypt = require("bcryptjs");

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

const { sendOTPEmail } = require("./emailService");

// Send registration OTP
const sendRegistrationOTP = async (userData) => {
  const { name, email, password, currency } = userData;

  const normalizedEmail = email.toLowerCase().trim();

  // Check whether an account already exists.
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

  // Prevent frequent OTP requests.
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

  // Generate OTP and hash sensitive data.
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
    });
  }

  // Deliver OTP through email.
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

// Verify registration OTP and create account.
const verifyRegistrationOTP = async ({ email, otp }) => {
  const normalizedEmail = email.toLowerCase().trim();

  const pendingRegistration = await PendingRegistration.findOne({
    email: normalizedEmail,
  }).select("+otpHash +passwordHash");

  if (!pendingRegistration) {
    throw new AppError("No pending registration found for this email", 404);
  }

  // Check OTP expiry.
  if (pendingRegistration.expiresAt.getTime() <= Date.now()) {
    await PendingRegistration.deleteOne({
      _id: pendingRegistration._id,
    });

    throw new AppError("OTP has expired. Please request a new OTP.", 400);
  }

  // Check maximum verification attempts.
  if (pendingRegistration.attempts >= MAX_OTP_ATTEMPTS) {
    throw new AppError(
      "Maximum OTP attempts exceeded. Please request a new OTP.",
      429,
    );
  }

  // Verify submitted OTP.
  const isOTPValid = verifyOTP(otp, pendingRegistration.otpHash);

  if (!isOTPValid) {
    pendingRegistration.attempts += 1;

    await pendingRegistration.save();

    if (pendingRegistration.attempts >= MAX_OTP_ATTEMPTS) {
      throw new AppError(
        "Maximum OTP attempts exceeded. Please request a new OTP.",
        429,
      );
    }

    throw new AppError("Invalid OTP", 400);
  }

  // Ensure no account was created in the meantime.
  const existingUser = await User.findOne({
    email: normalizedEmail,
  });

  if (existingUser) {
    await PendingRegistration.deleteOne({
      _id: pendingRegistration._id,
    });

    throw new AppError("An account with this email already exists", 409);
  }

  // Create verified user only after successful OTP verification.
  let user;

  try {
    user = await User.create({
      name: pendingRegistration.name,
      email: pendingRegistration.email,
      password: pendingRegistration.passwordHash,
      currency: pendingRegistration.currency,
      emailVerified: true,
      emailVerifiedAt: new Date(),
    });
  } catch (error) {
    if (error.code === 11000) {
      throw new AppError("An account with this email already exists", 409);
    }

    throw error;
  }

  // Remove temporary registration data.
  await PendingRegistration.deleteOne({
    _id: pendingRegistration._id,
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

// Disable legacy direct registration endpoint.
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
};

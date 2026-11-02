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

    // Reset OTP consumption for the new OTP.
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

  // Prevent reuse of an already consumed OTP.
  if (pendingRegistration.consumedAt) {
    throw new AppError("This OTP has already been used", 400);
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

  // Atomically increment incorrect OTP attempts.
  if (!isOTPValid) {
    const updatedRegistration = await PendingRegistration.findOneAndUpdate(
      {
        _id: pendingRegistration._id,
        consumedAt: null,
        expiresAt: { $gt: new Date() },
        attempts: { $lt: MAX_OTP_ATTEMPTS },
      },
      {
        $inc: {
          attempts: 1,
        },
      },
      {
        new: true,
      },
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

  // Ensure no account was created in the meantime.
  const existingUser = await User.findOne({
    email: normalizedEmail,
  });

  if (existingUser) {
    throw new AppError("An account with this email already exists", 409);
  }

  // Atomically consume the verified OTP.
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
      new: true,
    },
  );

  if (!consumedRegistration) {
    throw new AppError("OTP is invalid, expired, or already used", 400);
  }

  // Create verified user only after successful OTP consumption.
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
    // Release the OTP if account creation failed.
    // This allows a legitimate retry.
    await PendingRegistration.updateOne(
      {
        _id: consumedRegistration._id,
        consumedAt: consumedRegistration.consumedAt,
      },
      {
        $set: {
          consumedAt: null,
        },
      },
    );

    if (error.code === 11000) {
      throw new AppError("An account with this email already exists", 409);
    }

    throw error;
  }

  // Remove temporary registration data.
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

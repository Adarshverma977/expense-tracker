
const crypto = require("crypto");
const env = require("../config/env");

const OTP_EXPIRY_MINUTES = 5;
const OTP_LENGTH = 6;
const MAX_OTP_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;

// Generate a cryptographically secure 6-digit OTP.
const generateOTP = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

// Create an HMAC hash of the OTP.
const hashOTP = (otp) => {
  return crypto
    .createHmac("sha256", env.OTP_SECRET)
    .update(otp)
    .digest("hex");
};

// Compare OTP hashes securely.
const verifyOTP = (otp, storedHash) => {
  if (
    typeof otp !== "string" ||
    !/^\d{6}$/.test(otp) ||
    typeof storedHash !== "string" ||
    !/^[a-f0-9]{64}$/i.test(storedHash)
  ) {
    return false;
  }

  const incomingHash = Buffer.from(hashOTP(otp), "hex");
  const existingHash = Buffer.from(storedHash, "hex");

  return crypto.timingSafeEqual(incomingHash, existingHash);
};

// Calculate OTP expiry time.
const getOTPExpiry = () => {
  return new Date(
    Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000
  );
};

module.exports = {
  generateOTP,
  hashOTP,
  verifyOTP,
  getOTPExpiry,
  OTP_EXPIRY_MINUTES,
  MAX_OTP_ATTEMPTS,
  RESEND_COOLDOWN_SECONDS,
};

const mongoose = require("mongoose");

const pendingRegistrationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },

    passwordHash: {
      type: String,
      required: true,
      select: false,
    },

    currency: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      default: "INR",
    },

    otpHash: {
      type: String,
      required: true,
      select: false,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    attempts: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    lastSentAt: {
      type: Date,
      required: true,
      default: Date.now,
    },

    sendCount: {
      type: Number,
      default: 1,
      min: 1,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// One pending registration per email.
pendingRegistrationSchema.index({ email: 1 }, { unique: true });

// Automatically delete expired registrations.
pendingRegistrationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const PendingRegistration = mongoose.model(
  "PendingRegistration",
  pendingRegistrationSchema,
);

module.exports = PendingRegistration;

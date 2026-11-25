const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must contain at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: [254, "Email cannot exceed 254 characters"],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must contain at least 8 characters"],
      select: false,
    },

    tokenVersion: {
      type: Number,
      default: 0,
      min: 0,
    },

    currency: {
      type: String,
      default: "INR",
      uppercase: true,
      trim: true,
    },

    avatar: {
      type: String,
      default: null,
      maxlength: [2048, "Avatar URL cannot exceed 2048 characters"],
    },

    preferences: {
      theme: {
        type: String,
        enum: ["light", "dark", "system"],
        default: "system",
      },

      dateFormat: {
        type: String,
        enum: ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"],
        default: "DD/MM/YYYY",
      },

      language: {
        type: String,
        enum: ["en", "hi"],
        default: "en",
      },
    },

    emailVerified: {
      type: Boolean,
      default: false,
    },

    emailVerifiedAt: {
      type: Date,
      default: null,
    },

    pendingEmail: {
      type: String,
      default: null,
      lowercase: true,
      trim: true,
      maxlength: [254, "Email cannot exceed 254 characters"],
      select: false,
    },

    emailChangeToken: {
      type: String,
      default: null,
      select: false,
    },

    emailChangeExpires: {
      type: Date,
      default: null,
      select: false,
    },

    accountStatus: {
      type: String,
      enum: ["active", "deletion_pending"],
      default: "active",
      required: true,
    },

    deletionRequestedAt: {
      type: Date,
      default: null,
    },

    schedulerWriteVersion: {
      type: Number,
      default: 0,
      min: 0,
    },

    passwordResetToken: {
      type: String,
      default: null,
      select: false,
    },

    passwordResetExpires: {
      type: Date,
      default: null,
      select: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const User = mongoose.model("User", userSchema);

module.exports = User;

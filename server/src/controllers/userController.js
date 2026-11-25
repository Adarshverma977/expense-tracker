const env = require("../config/env");

const {
  sendEmailChangeVerificationEmail,
} = require("../services/emailService");

const {
  getUserProfile,
  updateUserProfile,
  updateUserPreferences,
  changeUserPassword,
  requestUserEmailChange,
  verifyUserEmailChange,
} = require("../services/userService");

const { deleteUserAccount } = require("../services/accountDeletionService");

const getProfile = async (req, res, next) => {
  try {
    console.log("========== PROFILE DEBUG ==========");
    console.log("Authenticated User ID:", req.user?._id);
    console.log("Authenticated User Status:", req.user?.accountStatus);
    console.log("Authenticated User Model:", req.user?.constructor?.modelName);
    console.log("MongoDB Database:", req.user?.db?.name);

    const user = await getUserProfile(req.user._id);

    return res.status(200).json({
      success: true,
      message: "Profile fetched successfully.",
      data: { user },
    });
  } catch (error) {
    console.error("PROFILE ERROR:", error);
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const user = await updateUserProfile(req.user._id, req.body);

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

const updatePreferences = async (req, res, next) => {
  try {
    const user = await updateUserPreferences(req.user._id, req.body);

    return res.status(200).json({
      success: true,
      message: "Preferences updated successfully.",
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    await changeUserPassword(
      req.user._id,
      req.body.currentPassword,
      req.body.newPassword,
    );

    return res.status(200).json({
      success: true,
      message: "Password changed successfully. Please log in again.",
    });
  } catch (error) {
    next(error);
  }
};

const changeEmail = async (req, res, next) => {
  try {
    const result = await requestUserEmailChange(
      req.user._id,
      req.body.newEmail,
    );

    const verificationUrl =
      `${env.CLIENT_URL}/verify-email-change?token=` +
      encodeURIComponent(result.verificationToken);

    await sendEmailChangeVerificationEmail(
      result.pendingEmail,
      verificationUrl,
    );

    return res.status(200).json({
      success: true,
      message: "Verification link sent to your new email address.",
      data: {
        pendingEmail: result.pendingEmail,
        expiresAt: result.expiresAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

const verifyEmailChange = async (req, res, next) => {
  try {
    const user = await verifyUserEmailChange(req.user._id, req.body.token);

    return res.status(200).json({
      success: true,
      message: "Email address updated successfully. Please log in again.",
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

const deleteAccount = async (req, res, next) => {
  try {
    const result = await deleteUserAccount(req.user._id, req.body.password);

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updatePreferences,
  changePassword,
  changeEmail,
  verifyEmailChange,
  deleteAccount,
};

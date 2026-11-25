const express = require("express");

const {
  protect,
  protectAccountDeletion,
} = require("../middleware/authMiddleware");

const validateRequest = require("../middleware/validateRequest");

const {
  updateProfileSchema,
  updatePreferencesSchema,
  changePasswordSchema,
  changeEmailSchema,
  verifyEmailChangeSchema,
  deleteAccountSchema,
} = require("../validators/userValidator");

const {
  getProfile,
  updateProfile,
  updatePreferences,
  changePassword,
  changeEmail,
  verifyEmailChange,
  deleteAccount,
} = require("../controllers/userController");

const router = express.Router();

router.get("/profile", protect, getProfile);

router.patch(
  "/profile",
  protect,
  validateRequest(updateProfileSchema),
  updateProfile,
);

router.patch(
  "/preferences",
  protect,
  validateRequest(updatePreferencesSchema),
  updatePreferences,
);

router.patch(
  "/change-password",
  protect,
  validateRequest(changePasswordSchema),
  changePassword,
);

router.patch(
  "/change-email",
  protect,
  validateRequest(changeEmailSchema),
  changeEmail,
);

router.post(
  "/verify-email-change",
  protect,
  validateRequest(verifyEmailChangeSchema),
  verifyEmailChange,
);

router.delete(
  "/account",
  protectAccountDeletion,
  validateRequest(deleteAccountSchema),
  deleteAccount,
);

module.exports = router;

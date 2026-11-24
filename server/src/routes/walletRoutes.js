const express = require("express");

const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateRequest");

const {
  createWallet,
  getWallets,
  getWalletSummary,
  getWalletById,
  updateWallet,
  archiveWallet,
  restoreWallet,
} = require("../controllers/walletController");

const {
  createWalletSchema,
  updateWalletSchema,
  getWalletsSchema,
  walletIdSchema,
} = require("../validators/walletValidator");

router.use(protect);

router.post("/", validateRequest(createWalletSchema), createWallet);

router.get("/", validateRequest(getWalletsSchema), getWallets);

router.get("/summary", getWalletSummary);

router.get("/:id", validateRequest(walletIdSchema), getWalletById);

router.patch("/:id", validateRequest(updateWalletSchema), updateWallet);

router.patch("/:id/archive", validateRequest(walletIdSchema), archiveWallet);

router.patch("/:id/restore", validateRequest(walletIdSchema), restoreWallet);

module.exports = router;

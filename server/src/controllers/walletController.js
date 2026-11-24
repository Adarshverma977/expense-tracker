const asyncHandler = require("../utils/asyncHandler");
const walletService = require("../services/walletService");

const createWallet = asyncHandler(async (req, res) => {
  const wallet = await walletService.createWallet(req.user._id, req.body);

  res.status(201).json({
    success: true,
    message: "Wallet created successfully.",
    data: {
      wallet,
    },
  });
});

const getWallets = asyncHandler(async (req, res) => {
  const wallets = await walletService.getWallets(
    req.user._id,
    req.validatedQuery,
  );

  res.status(200).json({
    success: true,
    count: wallets.length,
    data: {
      wallets,
    },
  });
});

const getWalletSummary = asyncHandler(async (req, res) => {
  const summary = await walletService.getWalletSummary(req.user._id);

  res.status(200).json({
    success: true,
    data: {
      summary,
    },
  });
});

const getWalletById = asyncHandler(async (req, res) => {
  const wallet = await walletService.getWalletById(
    req.user._id,
    req.validatedParams.id,
  );

  res.status(200).json({
    success: true,
    data: {
      wallet,
    },
  });
});

const updateWallet = asyncHandler(async (req, res) => {
  const wallet = await walletService.updateWallet(
    req.user._id,
    req.validatedParams.id,
    req.body,
  );

  res.status(200).json({
    success: true,
    message: "Wallet updated successfully.",
    data: {
      wallet,
    },
  });
});

const archiveWallet = asyncHandler(async (req, res) => {
  const result = await walletService.archiveWallet(
    req.user._id,
    req.validatedParams.id,
  );

  res.status(200).json({
    success: true,
    ...result,
  });
});

const restoreWallet = asyncHandler(async (req, res) => {
  const result = await walletService.restoreWallet(
    req.user._id,
    req.validatedParams.id,
  );

  res.status(200).json({
    success: true,
    ...result,
  });
});

module.exports = {
  createWallet,
  getWallets,
  getWalletSummary,
  getWalletById,
  updateWallet,
  archiveWallet,
  restoreWallet,
};

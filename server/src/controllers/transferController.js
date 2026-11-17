const asyncHandler = require("../utils/asyncHandler");
const transferService = require("../services/transferService");

const createTransfer = asyncHandler(async (req, res) => {
  const transfer = await transferService.createTransfer(req.user._id, req.body);

  res.status(201).json({
    status: "success",
    message: "Money transferred successfully.",
    data: {
      transfer,
    },
  });
});

const getTransfers = asyncHandler(async (req, res) => {
  const result = await transferService.getTransfers(
    req.user._id,
    req.validatedQuery,
  );

  res.status(200).json({
    status: "success",
    data: result,
  });
});

const getTransferById = asyncHandler(async (req, res) => {
  const transfer = await transferService.getTransferById(
    req.user._id,
    req.validatedParams.id,
  );

  res.status(200).json({
    status: "success",
    data: {
      transfer,
    },
  });
});

module.exports = {
  createTransfer,
  getTransfers,
  getTransferById,
};

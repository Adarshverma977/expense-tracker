const asyncHandler = require("../utils/asyncHandler");
const billService = require("../services/billService");

const createBill = asyncHandler(async (req, res) => {
  const bill = await billService.createBill(req.user._id, req.body);

  res.status(201).json({
    status: "success",
    message: "Bill created successfully.",
    data: {
      bill,
    },
  });
});

const getBills = asyncHandler(async (req, res) => {
  const result = await billService.getBills(req.user._id, req.validatedQuery);

  res.status(200).json({
    status: "success",
    data: result,
  });
});

const getBillById = asyncHandler(async (req, res) => {
  const bill = await billService.getBillById(
    req.user._id,
    req.validatedParams.id,
  );

  res.status(200).json({
    status: "success",
    data: {
      bill,
    },
  });
});

const updateBill = asyncHandler(async (req, res) => {
  const bill = await billService.updateBill(
    req.user._id,
    req.validatedParams.id,
    req.body,
  );

  res.status(200).json({
    status: "success",
    message: "Bill updated successfully.",
    data: {
      bill,
    },
  });
});

const archiveBill = asyncHandler(async (req, res) => {
  const bill = await billService.archiveBill(
    req.user._id,
    req.validatedParams.id,
  );

  res.status(200).json({
    status: "success",
    message: "Bill archived successfully.",
    data: {
      bill,
    },
  });
});

module.exports = {
  createBill,
  getBills,
  getBillById,
  updateBill,
  archiveBill,
};

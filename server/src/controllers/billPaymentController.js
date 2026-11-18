const asyncHandler = require("../utils/asyncHandler");
const billPaymentService = require("../services/billPaymentService");

const createBillPayment = asyncHandler(async (req, res) => {
  const payment = await billPaymentService.createBillPayment(
    req.user._id,
    req.body,
  );

  res.status(201).json({
    status: "success",
    message: "Bill payment recorded successfully.",
    data: {
      payment,
    },
  });
});

const getBillPayments = asyncHandler(async (req, res) => {
  const result = await billPaymentService.getBillPayments(
    req.user._id,
    req.validatedQuery,
  );

  res.status(200).json({
    status: "success",
    data: result,
  });
});

const getBillPaymentById = asyncHandler(async (req, res) => {
  const payment = await billPaymentService.getBillPaymentById(
    req.user._id,
    req.validatedParams.id,
  );

  res.status(200).json({
    status: "success",
    data: {
      payment,
    },
  });
});

module.exports = {
  createBillPayment,
  getBillPayments,
  getBillPaymentById,
};

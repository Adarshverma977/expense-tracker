const express = require("express");

const { protect } = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateRequest");

const billPaymentController = require("../controllers/billPaymentController");

const {
  createBillPaymentSchema,
  getBillPaymentsSchema,
  billPaymentIdSchema,
} = require("../validators/billPaymentValidator");

const router = express.Router();

router.use(protect);

router
  .route("/")
  .post(
    validateRequest(createBillPaymentSchema),
    billPaymentController.createBillPayment,
  )
  .get(
    validateRequest(getBillPaymentsSchema),
    billPaymentController.getBillPayments,
  );

router.get(
  "/:id",
  validateRequest(billPaymentIdSchema),
  billPaymentController.getBillPaymentById,
);

module.exports = router;

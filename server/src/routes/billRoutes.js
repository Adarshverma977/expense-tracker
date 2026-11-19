const express = require("express");

const {
  createBill,
  getBills,
  getBillById,
  updateBill,
  archiveBill,
} = require("../controllers/billController");

const { protect } = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateRequest");

const {
  createBillSchema,
  updateBillSchema,
  getBillsSchema,
  billIdSchema,
} = require("../validators/billValidator");

const router = express.Router();

router.use(protect);

router
  .route("/")
  .post(validateRequest(createBillSchema), createBill)
  .get(validateRequest(getBillsSchema), getBills);

router
  .route("/:id")
  .get(validateRequest(billIdSchema), getBillById)
  .patch(validateRequest(updateBillSchema), updateBill);

router.patch("/:id/archive", validateRequest(billIdSchema), archiveBill);

module.exports = router;

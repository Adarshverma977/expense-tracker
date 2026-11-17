const express = require("express");

const {
  createTransfer,
  getTransfers,
  getTransferById,
} = require("../controllers/transferController");

const { protect } = require("../middlewares/authMiddleware");
const validateRequest = require("../middlewares/validateRequest");

const {
  createTransferSchema,
  getTransfersSchema,
  transferIdSchema,
} = require("../validators/transferValidator");

const router = express.Router();

router.use(protect);

router
  .route("/")
  .post(validateRequest(createTransferSchema), createTransfer)
  .get(validateRequest(getTransfersSchema), getTransfers);

router.get("/:id", validateRequest(transferIdSchema), getTransferById);

module.exports = router;

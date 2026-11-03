const express = require("express");

const router = express.Router();

const { protect } = require("../middleware/authMiddleware");

const {
  getDashboardStatsController,
} = require("../controllers/dashboardController");

// All dashboard routes require authentication.
router.use(protect);

// GET /api/dashboard
router.get("/", getDashboardStatsController);

module.exports = router;

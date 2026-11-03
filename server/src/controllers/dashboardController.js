const asyncHandler = require("../utils/asyncHandler");

const { getDashboardStats } = require("../services/dashboardService");

const getDashboardStatsController = asyncHandler(async (req, res) => {
  const dashboard = await getDashboardStats(req.user._id);

  return res.status(200).json({
    success: true,
    message: "Dashboard statistics fetched successfully.",
    data: dashboard,
  });
});

module.exports = {
  getDashboardStatsController,
};

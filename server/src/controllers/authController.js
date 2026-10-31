const asyncHandler = require("../utils/asyncHandler");
const { registerUser } = require("../services/authService");

const register = asyncHandler(async (req, res) => {
  // Get validated registration data
  const userData = req.body;

  // Execute registration business logic
  const user = await registerUser(userData);

  // Send successful response
  res.status(201).json({
    success: true,
    message: "Account registered successfully",
    data: {
      user,
    },
  });
});

module.exports = {
  register,
};

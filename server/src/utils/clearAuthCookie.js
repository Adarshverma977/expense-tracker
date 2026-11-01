const env = require("../config/env");

const clearAuthCookie = (res) => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  });
};

module.exports = clearAuthCookie;

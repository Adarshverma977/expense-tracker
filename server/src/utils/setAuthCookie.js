const env = require("../config/env");

const setAuthCookie = (res, token) => {
  res.cookie("accessToken", token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 24 * 60 * 60 * 1000,
    path: "/",
  });
};

module.exports = setAuthCookie;

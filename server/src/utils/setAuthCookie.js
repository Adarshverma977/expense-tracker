const env = require("../config/env");

const parseDurationToMilliseconds = (duration) => {
  const match = duration.match(/^\s*(\d+(?:\.\d+)?)\s*(ms|s|m|h|d|w|y)\s*$/i);

  if (!match) {
    throw new Error(
      "JWT_EXPIRES_IN must include a valid duration unit (ms, s, m, h, d, w, y).",
    );
  }

  const value = Number(match[1]);
  const unit = match[2].toLowerCase();

  const multipliers = {
    ms: 1,
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000,
    y: 365 * 24 * 60 * 60 * 1000,
  };

  return value * multipliers[unit];
};

const setAuthCookie = (res, token) => {
  const maxAge = parseDurationToMilliseconds(env.JWT_EXPIRES_IN);

  res.cookie("accessToken", token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: env.NODE_ENV === "production" ? "none" : "lax",
    maxAge,
    path: "/",
  });
};

module.exports = setAuthCookie;

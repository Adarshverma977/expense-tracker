const jwt = require("jsonwebtoken");
const env = require("../config/env");

const generateToken = (userId, tokenVersion = 0) => {
  const token = jwt.sign(
    {
      sub: userId.toString(),
      tokenVersion,
    },
    env.JWT_SECRET,
    {
      expiresIn: env.JWT_EXPIRES_IN,
      algorithm: "HS256",
    },
  );

  return token;
};

module.exports = generateToken;

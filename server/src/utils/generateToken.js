const jwt = require("jsonwebtoken");
const env = require("../config/env");

const generateToken = (userId) => {
  const token = jwt.sign(
    {
      sub: userId.toString(),
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

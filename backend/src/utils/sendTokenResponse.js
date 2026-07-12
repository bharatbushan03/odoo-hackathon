const jwtConfig = require('../config/jwt');

const generateAccessToken = (employee) => {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { id: employee.id, email: employee.email, role: employee.role, organizationId: employee.organizationId },
    jwtConfig.accessToken.secret,
    { expiresIn: jwtConfig.accessToken.expiresIn }
  );
};

const generateRefreshToken = (employee) => {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { id: employee.id },
    jwtConfig.refreshToken.secret,
    { expiresIn: jwtConfig.refreshToken.expiresIn }
  );
};

const sendTokenResponse = (employee, statusCode, res) => {
  const accessToken = generateAccessToken(employee);
  const refreshToken = generateRefreshToken(employee);

  res.status(statusCode).json({
    success: true,
    data: {
      id: employee.id,
      name: employee.name,
      email: employee.email,
      role: employee.role,
      organizationId: employee.organizationId,
    },
    tokens: {
      accessToken,
      refreshToken,
    },
  });
};

module.exports = { generateAccessToken, generateRefreshToken, sendTokenResponse };

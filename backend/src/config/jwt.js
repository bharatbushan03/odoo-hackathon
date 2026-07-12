module.exports = {
  accessToken: {
    secret: process.env.JWT_ACCESS_SECRET || 'access-secret-dev',
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  },
  refreshToken: {
    secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret-dev',
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  resetPassword: {
    secret: process.env.JWT_RESET_SECRET || 'reset-secret-dev',
    expiresIn: process.env.JWT_RESET_EXPIRES_IN || '1h',
  },
  emailVerification: {
    secret: process.env.JWT_EMAIL_VERIFY_SECRET || 'verify-secret-dev',
    expiresIn: process.env.JWT_EMAIL_VERIFY_EXPIRES_IN || '24h',
  },
};

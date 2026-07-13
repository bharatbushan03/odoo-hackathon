const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  apiPrefix: process.env.API_PREFIX || '/api/v1',

  db: {
    url: process.env.DATABASE_URL,
  },

  jwt: {
    secret: process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'default-secret',
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || process.env.JWT_EXPIRES_IN || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    resetSecret: process.env.JWT_RESET_SECRET || 'default-reset-secret',
    resetExpiresIn: process.env.JWT_RESET_EXPIRES_IN || '1h',
    emailVerifySecret: process.env.JWT_EMAIL_VERIFY_SECRET || 'default-verify-secret',
    emailVerifyExpiresIn: process.env.JWT_EMAIL_VERIFY_EXPIRES_IN || '24h',
  },

  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12,
  },

  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 5242880,
    path: process.env.UPLOAD_PATH || './uploads',
  },

  log: {
    level: process.env.LOG_LEVEL || 'debug',
    filePath: process.env.LOG_FILE_PATH || './logs',
  },
};

module.exports = config;

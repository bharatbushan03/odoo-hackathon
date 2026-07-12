const config = require('../config');
const logger = require('../config/logger');
const ApiError = require('../utils/ApiError');
const { HttpStatus } = require('../constants');

const errorConverter = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode =
      error.statusCode || (error.name === 'ZodError'
        ? HttpStatus.UNPROCESSABLE_ENTITY
        : HttpStatus.INTERNAL_SERVER_ERROR);

    const message = error.message || 'Internal server error';
    const details = error.name === 'ZodError' ? error.errors : null;

    error = new ApiError(statusCode, message, details);
  }

  next(error);
};

const errorHandler = (err, req, res, next) => {
  const { statusCode, message, details } = err;

  logger.error('Error', {
    statusCode,
    message,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    stack: config.env === 'development' ? err.stack : undefined,
  });

  const response = {
    success: false,
    message,
    ...(details && { details }),
    ...(config.env === 'development' && { stack: err.stack }),
  };

  res.status(statusCode).json(response);
};

module.exports = { errorConverter, errorHandler };

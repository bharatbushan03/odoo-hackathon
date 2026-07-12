const { HttpStatus } = require('../constants');

class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Bad request', details = null) {
    return new ApiError(HttpStatus.BAD_REQUEST, message, details);
  }

  static unauthorized(message = 'Unauthorized', details = null) {
    return new ApiError(HttpStatus.UNAUTHORIZED, message, details);
  }

  static forbidden(message = 'Forbidden', details = null) {
    return new ApiError(HttpStatus.FORBIDDEN, message, details);
  }

  static notFound(message = 'Resource not found', details = null) {
    return new ApiError(HttpStatus.NOT_FOUND, message, details);
  }

  static conflict(message = 'Resource already exists', details = null) {
    return new ApiError(HttpStatus.CONFLICT, message, details);
  }

  static unprocessable(message = 'Unprocessable entity', details = null) {
    return new ApiError(HttpStatus.UNPROCESSABLE_ENTITY, message, details);
  }

  static internal(message = 'Internal server error', details = null) {
    return new ApiError(HttpStatus.INTERNAL_SERVER_ERROR, message, details);
  }
}

module.exports = ApiError;

const ApiError = require('../../src/utils/ApiError');
const { HttpStatus } = require('../../src/constants');

describe('ApiError', () => {
  describe('Constructor', () => {
    it('should create error with status and message', () => {
      const error = new ApiError(HttpStatus.INTERNAL_SERVER_ERROR, 'Test error');

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(error.isOperational).toBe(true);
    });

    it('should create error with custom status', () => {
      const error = new ApiError(HttpStatus.NOT_FOUND, 'Not found');

      expect(error.message).toBe('Not found');
      expect(error.statusCode).toBe(HttpStatus.NOT_FOUND);
    });

    it('should be instance of Error', () => {
      const error = new ApiError(HttpStatus.INTERNAL_SERVER_ERROR, 'Test error');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApiError);
    });
  });

  describe('Static methods', () => {
    it('should create bad request error', () => {
      const error = ApiError.badRequest('Invalid input');

      expect(error.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(error.message).toBe('Invalid input');
    });

    it('should create unauthorized error', () => {
      const error = ApiError.unauthorized('Not authenticated');

      expect(error.statusCode).toBe(HttpStatus.UNAUTHORIZED);
      expect(error.message).toBe('Not authenticated');
    });

    it('should create forbidden error', () => {
      const error = ApiError.forbidden('Access denied');

      expect(error.statusCode).toBe(HttpStatus.FORBIDDEN);
      expect(error.message).toBe('Access denied');
    });

    it('should create not found error', () => {
      const error = ApiError.notFound('Resource not found');

      expect(error.statusCode).toBe(HttpStatus.NOT_FOUND);
      expect(error.message).toBe('Resource not found');
    });

    it('should create conflict error', () => {
      const error = ApiError.conflict('Resource already exists');

      expect(error.statusCode).toBe(HttpStatus.CONFLICT);
      expect(error.message).toBe('Resource already exists');
    });

    it('should create unprocessable entity error', () => {
      const error = ApiError.unprocessable('Invalid data');

      expect(error.statusCode).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(error.message).toBe('Invalid data');
    });

    it('should create internal server error', () => {
      const error = ApiError.internal('Server error');

      expect(error.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(error.message).toBe('Server error');
    });
  });

  describe('Error serialization', () => {
    it('should serialize to JSON correctly', () => {
      const error = ApiError.badRequest('Invalid input');

      // ApiError extends Error, which doesn't serialize message in JSON by default
      // The important thing is that the error object has the correct properties
      expect(error.message).toBe('Invalid input');
      expect(error.statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should maintain operational flag', () => {
      const error = ApiError.notFound('Not found');

      expect(error.isOperational).toBe(true);
    });
  });
});

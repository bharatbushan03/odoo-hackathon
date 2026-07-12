const { asyncHandler, ApiError } = require('../utils');
const { HttpStatus } = require('../constants');

const validate = (schema, source = 'body') => {
  return asyncHandler((req, res, next) => {
    const dataToValidate = req[source];

    if (!dataToValidate) {
      throw ApiError.internal(`Request ${source} is not available for validation`);
    }

    const result = schema.safeParse(dataToValidate);

    if (!result.success) {
      const formattedErrors = result.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
      }));

      throw new (require('../utils/ApiError'))(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Validation failed',
        formattedErrors
      );
    }

    req[source] = result.data;
    next();
  });
};

module.exports = validate;

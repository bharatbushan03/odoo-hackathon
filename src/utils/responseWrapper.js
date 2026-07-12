const { HttpStatus } = require('../constants');

class ResponseWrapper {
  static success(res, { data = null, message = 'Success', statusCode = HttpStatus.OK, meta = null }) {
    const response = {
      success: true,
      message,
      data,
    };
    if (meta) {
      response.meta = meta;
    }
    return res.status(statusCode).json(response);
  }

  static created(res, { data = null, message = 'Created successfully' }) {
    return ResponseWrapper.success(res, {
      data,
      message,
      statusCode: HttpStatus.CREATED,
    });
  }

  static noContent(res) {
    return res.status(HttpStatus.NO_CONTENT).end();
  }

  static paginated(res, { data = [], message = 'Success', meta }) {
    return ResponseWrapper.success(res, { data, message, meta });
  }
}

module.exports = ResponseWrapper;

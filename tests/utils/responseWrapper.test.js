const { ResponseWrapper } = require('../../src/utils');
const { HttpStatus } = require('../../src/constants');

describe('ResponseWrapper', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      end: jest.fn().mockReturnThis(),
    };
  });

  describe('success', () => {
    it('should send success response with default status 200', () => {
      const data = { data: { id: 1 }, message: 'Success' };

      ResponseWrapper.success(mockRes, data);

      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Success',
        data: { id: 1 },
      });
    });

    it('should send success response with custom status', () => {
      const data = { data: { id: 1 }, message: 'Created', statusCode: HttpStatus.CREATED };

      ResponseWrapper.success(mockRes, data);

      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.CREATED);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Created',
        data: { id: 1 },
      });
    });

    it('should handle data without message (uses default)', () => {
      const data = { data: { id: 1 } };

      ResponseWrapper.success(mockRes, data);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Success',
        data: { id: 1 },
      });
    });

    it('should handle minimal data', () => {
      ResponseWrapper.success(mockRes, {});

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Success',
        data: null,
      });
    });
  });

  describe('created', () => {
    it('should send created response with status 201', () => {
      const data = { data: { id: 1 }, message: 'Resource created' };

      ResponseWrapper.created(mockRes, data);

      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.CREATED);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Resource created',
        data: { id: 1 },
      });
    });

    it('should send created response with minimal data', () => {
      ResponseWrapper.created(mockRes, { data: { id: 1 } });

      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.CREATED);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Created successfully',
        data: { id: 1 },
      });
    });
  });

  describe('noContent', () => {
    it('should send no content response with status 204', () => {
      ResponseWrapper.noContent(mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.NO_CONTENT);
      expect(mockRes.end).toHaveBeenCalled();
    });
  });

  describe('paginated', () => {
    it('should send paginated response with meta', () => {
      const data = {
        data: [{ id: 1 }, { id: 2 }],
        meta: {
          total: 2,
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
        message: 'Data retrieved',
      };

      ResponseWrapper.paginated(mockRes, data);

      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Data retrieved',
        data: [{ id: 1 }, { id: 2 }],
        meta: {
          total: 2,
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      });
    });

    it('should handle paginated response without message', () => {
      const data = {
        data: [],
        meta: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };

      ResponseWrapper.paginated(mockRes, data);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Success',
        data: [],
        meta: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      });
    });

    it('should handle empty data array', () => {
      const data = {
        data: [],
        meta: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
        message: 'No data found',
      };

      ResponseWrapper.paginated(mockRes, data);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'No data found',
        data: [],
        meta: expect.any(Object),
      });
    });
  });

  describe('Chainable methods', () => {
    it('should allow chaining of status and json', () => {
      ResponseWrapper.success(mockRes, { data: { id: 1 } });

      expect(mockRes.status).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalled();
    });
  });
});

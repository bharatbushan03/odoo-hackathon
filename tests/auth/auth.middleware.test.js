const request = require('supertest');
const jwt = require('jsonwebtoken');
const { authenticate, authorize } = require('../../src/middleware/auth');
const { UserRole } = require('../../src/constants');
const { generateAuthToken } = require('../utils/testHelpers');
const ApiError = require('../../src/utils/ApiError');

describe('Authentication Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  describe('authenticate', () => {
    it('should authenticate user with valid token', async () => {
      const token = generateAuthToken({ id: 'user-123', role: UserRole.SUPER_ADMIN });
      req.headers.authorization = `Bearer ${token}`;

      await authenticate(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user.id).toBe('user-123');
      expect(req.user.role).toBe(UserRole.SUPER_ADMIN);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('authorize', () => {
    it('should authorize user with correct role', () => {
      req.user = { id: 'user-123', role: UserRole.SUPER_ADMIN };
      const middleware = authorize(UserRole.SUPER_ADMIN);

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should authorize user with one of multiple allowed roles', () => {
      req.user = { id: 'user-123', role: UserRole.ADMIN };
      const middleware = authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER);

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should work with all role types', () => {
      const roles = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN, UserRole.VIEWER];

      roles.forEach((role) => {
        req.user = { id: 'user-123', role };
        const middleware = authorize(role);
        next.mockClear();

        middleware(req, res, next);

        expect(next).toHaveBeenCalled();
      });
    });
  });

  describe('authenticate and authorize integration', () => {
    it('should work together when both pass', async () => {
      const token = generateAuthToken({ id: 'user-123', role: UserRole.ADMIN });
      req.headers.authorization = `Bearer ${token}`;

      await authenticate(req, res, next);
      const middleware = authorize(UserRole.ADMIN);
      middleware(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user.role).toBe(UserRole.ADMIN);
      expect(next).toHaveBeenCalledTimes(2);
    });
  });
});

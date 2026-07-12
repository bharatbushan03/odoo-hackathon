const request = require('supertest');
const app = require('../server');

// Mock database
jest.mock('../src/config/database.js', () => ({
  organization: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn()
  },
  employee: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    findByEmail: jest.fn(),
    findByResetToken: jest.fn(),
    findByVerificationToken: jest.fn()
  },
  refreshToken: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    findByToken: jest.fn(),
    revokeById: jest.fn(),
    revokeAllByEmployeeId: jest.fn()
  },
  auditLog: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    groupBy: jest.fn()
  }
}));

// Mock JSON Web Token using spies
let jwtMockSign;
let jwtMockVerify;

const prisma = require('../src/config/database');

describe('Authentication Endpoints', () => {
  // Test data
  const testOrg = {
    orgName: 'Test Organization',
    orgCode: 'TESTORG',
    name: 'Test Admin',
    email: 'admin@test.com',
    password: 'Password123'
  };

  const testAdmin = {
    name: 'Test Admin 2',
    email: 'admin2@test.com',
    password: 'Password123',
    organizationCode: 'TESTORG'
  };

  const testLogin = {
    email: 'admin@test.com',
    password: 'Password123'
  };

  let accessToken;
  let refreshToken;
  let orgId;

  // Mock data for successful operations
  const mockOrg = {
    id: 'org-123',
    name: 'Test Organization',
    code: 'TESTORG'
  };

  const mockEmployee = {
    id: 'emp-123',
    name: 'Test Admin',
    email: 'admin@test.com',
    role: 'ORG_ADMIN',
    organizationId: 'org-123'
  };

  const mockTokens = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token'
  };

  // Mock authenticated request helper
  const authHeader = (token) => `Bearer ${token}`;

  // Mock JSON Web Token spies
  let jwtMockSign;
  let jwtMockVerify;

  // Setup before each test
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock responses with call tracking
    const orgFindCalls = new Map();
    const employeeFindCalls = new Map();

    prisma.organization.findUnique.mockImplementation((where) => {
      const code = where.code;
      if (!orgFindCalls.has(code)) {
        orgFindCalls.set(code, 0);
      }
      const count = orgFindCalls.get(code);
      console.log(`org findUnique: code=${code}, count=${count}`);
      if (code === 'TESTORG') {
        if (count === 0) {
          orgFindCalls.set(code, count + 1);
          console.log('  returning null');
          return Promise.resolve(null);
        }
        console.log('  returning mockOrg');
        return Promise.resolve(mockOrg);
      }
      // For any other code (e.g., 'INVALID'), always return null
      console.log('  returning null for other code');
      return Promise.resolve(null);
    });

    prisma.employee.findByEmail.mockImplementation((email) => {
      if (!employeeFindCalls.has(email)) {
        employeeFindCalls.set(email, 0);
      }
      const count = employeeFindCalls.get(email);
      // For the first call with any email, return null (no existing user)
      // For subsequent calls with same email, return mockEmployee (existing user)
      if (count === 0) {
        employeeFindCalls.set(email, count + 1);
        return Promise.resolve(null);
      }
      return Promise.resolve(mockEmployee);
    });

    // Other mocks
    prisma.organization.create.mockResolvedValue(mockOrg);
    prisma.employee.create.mockResolvedValue(mockEmployee);
    prisma.refreshToken.create.mockResolvedValue({});

    // Mock JSON Web Token using spies
    const jwt = require('jsonwebtoken');
    jwtMockSign = jest.spyOn(jwt, 'sign')
      .mockReturnValueOnce('mock-access-token')
      .mockReturnValueOnce('mock-refresh-token')
      .mockReturnValue('mock-token');
    jwtMockVerify = jest.spyOn(jwt, 'verify')
      .mockImplementation(() => ({
        employeeId: 'emp-123',
        exp: Math.floor(Date.now() / 1000) + 60 * 60 // 1 hour expiration
      }));
    jwtMockDecode = jest.spyOn(jwt, 'decode')
      .mockImplementation((token) => {
        if (token === 'mock-access-token') {
          return {
            id: 'emp-123',
            email: 'admin@test.com',
            role: 'ORG_ADMIN',
            organizationId: 'org-123'
          };
        }
        if (token === 'mock-refresh-token') {
          return { id: 'emp-123' };
        }
        return null;
      });
  });

  // Clean up after each test
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/v1/auth/register-organization', () => {
    it('should register a new organization', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register-organization')
        .send(testOrg);

      console.log('Registration response:', res.body);

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Organization registered successfully');
      expect(res.body.data).toHaveProperty('employee');
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');

      orgId = res.body.data.employee.organizationId;
      accessToken = res.body.data.accessToken;
      refreshToken = res.body.data.refreshToken;
    });

    it('should not register organization with existing code', async () => {
      // First registration
      await request(app)
        .post('/api/v1/auth/register-organization')
        .send(testOrg);

      // Second registration with same code
      const res = await request(app)
        .post('/api/v1/auth/register-organization')
        .send(testOrg);

      expect(res.statusCode).toEqual(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Organization with this code already exists');
    });

    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register-organization')
        .send({}); // Empty body

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validation failed');
    });
  });

  describe('POST /api/v1/auth/register-admin', () => {
    beforeEach(async () => {
      // Create organization first
      const orgRes = await request(app)
        .post('/api/v1/auth/register-organization')
        .send(testOrg);

      orgId = orgRes.body.data.employee.organizationId;
    });

    it('should register a new admin', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register-admin')
        .send(testAdmin);

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Admin registered successfully');
      expect(res.body.data).toHaveProperty('employee');
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');

      accessToken = res.body.data.accessToken;
      refreshToken = res.body.data.refreshToken;
    });

    it('should not register admin with existing email', async () => {
      // First registration
      await request(app)
        .post('/api/v1/auth/register-admin')
        .send(testAdmin);

      // Second registration with same email
      const res = await request(app)
        .post('/api/v1/auth/register-admin')
        .send(testAdmin);

      expect(res.statusCode).toEqual(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Email already registered');
    });

    it('should not register admin for non-existent organization', async () => {
      const invalidAdmin = {
        name: 'Test Admin',
        email: 'admin2@test.com',
        password: 'password123',
        organizationCode: 'INVALID'
      };

      const res = await request(app)
        .post('/api/v1/auth/register-admin')
        .send(invalidAdmin);

      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Organization not found');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      // Create organization and admin
      const orgRes = await request(app)
        .post('/api/v1/auth/register-organization')
        .send(testOrg);

      orgId = orgRes.body.data.employee.organizationId;

      await request(app)
        .post('/api/v1/auth/register-admin')
        .send(testAdmin);
    });

    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send(testLogin);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Login successful');
      expect(res.body.data).toHaveProperty('employee');
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');

      accessToken = res.body.data.accessToken;
      refreshToken = res.body.data.refreshToken;
    });

    it('should not login with invalid credentials', async () => {
      const invalidLogin = {
        email: 'wrong@test.com',
        password: 'wrongpass'
      };

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send(invalidLogin);

      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid email or password');
    });

    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({}); // Empty body

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validation failed');
    });
  });

  describe('POST /api/v1/auth/refresh-token', () => {
    beforeEach(async () => {
      // Create organization and admin
      const orgRes = await request(app)
        .post('/api/v1/auth/register-organization')
        .send(testOrg);

      orgId = orgRes.body.data.employee.organizationId;

      await request(app)
        .post('/api/v1/auth/register-admin')
        .send(testAdmin);

      // Login to get tokens
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send(testLogin);

      accessToken = loginRes.body.data.accessToken;
      refreshToken = loginRes.body.data.refreshToken;
    });

    it('should refresh access token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({ refreshToken });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Token refreshed successfully');
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
    });

    it('should not refresh with invalid token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({ refreshToken: 'invalid.token.here' });

      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid or expired refresh token');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    beforeEach(async () => {
      // Create organization and admin
      const orgRes = await request(app)
        .post('/api/v1/auth/register-organization')
        .send(testOrg);

      orgId = orgRes.body.data.employee.organizationId;

      await request(app)
        .post('/api/v1/auth/register-admin')
        .send(testAdmin);

      // Login to get tokens
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send(testLogin);

      refreshToken = loginRes.body.data.refreshToken;
    });

    it('should logout successfully', async () => {
      const res = await request(app)
        .post('/api/v1/auth/logout')
        .send({ refreshToken });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Logged out successfully');
    });

    it('should handle logout with invalid token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/logout')
        .send({ refreshToken: 'invalid.token.here' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Logged out successfully');
    });
  });
});
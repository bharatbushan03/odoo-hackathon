const request = require('supertest');
const app = require('../server');
const prisma = require('../src/config/prisma');

describe('Authentication Endpoints', () => {
  // Test data
  const testOrg = {
    name: 'Test Organization',
    code: 'TESTORG'
  };

  const testAdmin = {
    name: 'Test Admin',
    email: 'admin@test.com',
    password: 'password123',
    organizationCode: 'TESTORG'
  };

  const testLogin = {
    email: 'admin@test.com',
    password: 'password123'
  };

  let accessToken;
  let refreshToken;
  let orgId;

  // Clean up before each test
  beforeEach(async () => {
    // Clean up test data
    await prisma.refreshToken.deleteMany({});
    await prisma.employee.deleteMany({});
    await prisma.organization.deleteMany({});
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/v1/auth/register-organization', () => {
    it('should register a new organization', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register-organization')
        .send(testOrg);

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
      expect(res.body.message).toBe('Validation error');
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
      expect(res.body.message).toBe('Validation error');
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
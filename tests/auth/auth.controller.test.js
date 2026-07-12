const request = require('supertest');
const bcrypt = require('bcrypt');
const { generateAuthToken, mockUser } = require('../utils/testHelpers');
const prisma = require('../../src/config/database');
const { UserRole } = require('../../src/constants');

describe('Auth Controller', () => {
  let app;

  beforeAll(() => {
    // Mock the auth routes specifically for testing
    const express = require('express');
    const { authController } = require('../../src/controllers');
    const { authenticate } = require('../../src/middleware/auth');
    const validate = require('../../src/middleware/validate');
    const { loginSchema, signupSchema, forgotPasswordSchema } = require('../../src/validators');

    app = express();
    app.use(express.json());

    const router = express.Router();
    router.post('/login', validate(loginSchema), authController.login);
    router.post('/signup', validate(signupSchema), authController.signup);
    router.get('/me', authenticate, authController.me);
    router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);

    app.use('/api/v1/auth', router);
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('password123', 12);
      const user = mockUser({
        email: 'test@example.com',
        password: hashedPassword,
        isActive: true,
      });

      prisma.user.findFirst.mockResolvedValue(user);
      prisma.user.update.mockResolvedValue(user);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.email).toBe('test@example.com');
    });

    it('should return 401 for invalid email', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 for invalid password', async () => {
      const hashedPassword = await bcrypt.hash('password123', 12);
      const user = mockUser({
        email: 'test@example.com',
        password: hashedPassword,
        isActive: true,
      });

      prisma.user.findFirst.mockResolvedValue(user);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return 403 for deactivated account', async () => {
      const hashedPassword = await bcrypt.hash('password123', 12);
      const user = mockUser({
        email: 'test@example.com',
        password: hashedPassword,
        isActive: false,
      });

      prisma.user.findFirst.mockResolvedValue(user);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for missing email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          password: 'password123',
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 for missing password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/v1/auth/signup', () => {
    it('should signup with valid data', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(mockUser({
        email: 'new@example.com',
        firstName: 'New',
        lastName: 'User',
      }));

      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          name: 'New User',
          email: 'new@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.email).toBe('new@example.com');
      expect(prisma.user.create).toHaveBeenCalled();
    });

    it('should return 409 for existing email', async () => {
      prisma.user.findFirst.mockResolvedValue(mockUser({ email: 'existing@example.com' }));

      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          name: 'Test User',
          email: 'existing@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });

    it('should handle name with multiple spaces', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(mockUser({
        firstName: 'John',
        lastName: 'Doe Smith',
      }));

      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          name: 'John  Doe  Smith',
          email: 'john@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(201);
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'John',
          lastName: 'Doe Smith',
        })
      );
    });

    it('should handle single word name', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(mockUser({
        firstName: 'John',
        lastName: '',
      }));

      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          name: 'John',
          email: 'john@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(201);
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          email: 'test@example.com',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should get user profile with valid token', async () => {
      const user = mockUser({ id: 'user-123' });
      const token = generateAuthToken({ id: 'user-123', role: UserRole.SUPER_ADMIN });

      prisma.user.findUnique.mockResolvedValue(user);

      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('user-123');
      expect(response.body.data.email).toBe(user.email);
    });

    it('should return 404 if user not found', async () => {
      const token = generateAuthToken({ id: 'nonexistent', role: UserRole.SUPER_ADMIN });

      prisma.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me');

      expect(response.status).toBe(401);
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/auth/forgot-password', () => {
    it('should return success message for existing email', async () => {
      const user = mockUser({ email: 'test@example.com' });
      prisma.user.findFirst.mockResolvedValue(user);

      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('reset link');
    });

    it('should return same message for non-existing email (security)', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('reset link');
    });

    it('should return 400 for missing email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({});

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'invalid-email' });

      expect(response.status).toBe(400);
    });
  });
});

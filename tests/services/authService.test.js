const AuthService = require('../../src/services/authService');
const { mockUser } = require('../utils/testHelpers');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const ApiError = require('../../src/utils/ApiError');

describe('AuthService', () => {
  let service;
  let mockRepository;

  beforeEach(() => {
    mockRepository = {
      findOne: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };
    service = new AuthService();
    service.userRepo = mockRepository;
  });

  describe('login', () => {
    it('should login with valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('password123', 12);
      const user = mockUser({
        id: 'user-123',
        email: 'test@example.com',
        password: hashedPassword,
        isActive: true,
        firstName: 'John',
        lastName: 'Doe',
        role: 'ADMIN',
      });

      mockRepository.findOne.mockResolvedValue(user);
      mockRepository.update.mockResolvedValue(user);

      const result = await service.login('test@example.com', 'password123');

      expect(result).toHaveProperty('token');
      expect(result.email).toBe('test@example.com');
      expect(result.name).toBe('John Doe');
      expect(result.role).toBe('ADMIN');
      expect(mockRepository.update).toHaveBeenCalledWith('user-123', {
        lastLoginAt: expect.any(Date),
      });
    });

    it('should throw unauthorized error for invalid email', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.login('nonexistent@example.com', 'password123')).rejects.toThrow(ApiError);
      await expect(service.login('nonexistent@example.com', 'password123')).rejects.toThrow('Invalid email or password');
    });

    it('should throw forbidden error for deactivated account', async () => {
      const user = mockUser({
        email: 'test@example.com',
        isActive: false,
      });

      mockRepository.findOne.mockResolvedValue(user);

      await expect(service.login('test@example.com', 'password123')).rejects.toThrow(ApiError);
      await expect(service.login('test@example.com', 'password123')).rejects.toThrow('deactivated');
    });

    it('should throw unauthorized error for invalid password', async () => {
      const hashedPassword = await bcrypt.hash('password123', 12);
      const user = mockUser({
        email: 'test@example.com',
        password: hashedPassword,
        isActive: true,
      });

      mockRepository.findOne.mockResolvedValue(user);

      await expect(service.login('test@example.com', 'wrongpassword')).rejects.toThrow(ApiError);
      await expect(service.login('test@example.com', 'wrongpassword')).rejects.toThrow('Invalid email or password');
    });

    it('should generate valid JWT token', async () => {
      const hashedPassword = await bcrypt.hash('password123', 12);
      const user = mockUser({
        id: 'user-123',
        email: 'test@example.com',
        password: hashedPassword,
        isActive: true,
        role: 'VIEWER',
      });

      mockRepository.findOne.mockResolvedValue(user);
      mockRepository.update.mockResolvedValue(user);

      const result = await service.login('test@example.com', 'password123');

      const decoded = jwt.verify(result.token, process.env.JWT_SECRET || 'test-secret-key');
      expect(decoded.id).toBe('user-123');
      expect(decoded.email).toBe('test@example.com');
      expect(decoded.role).toBe('VIEWER');
    });
  });

  describe('signup', () => {
    it('should signup with valid data', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'new@example.com',
        password: 'hashedpassword',
        role: 'VIEWER',
        employeeId: 'EMP1234567890',
      };

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue({
        id: 'user-123',
        ...userData,
      });

      const result = await service.signup('John Doe', 'new@example.com', 'password123');

      expect(result).toHaveProperty('token');
      expect(result.email).toBe('new@example.com');
      expect(result.name).toBe('John Doe');
      expect(result.role).toBe('VIEWER');
      expect(mockRepository.create).toHaveBeenCalled();
    });

    it('should throw conflict error for existing email', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser({ email: 'existing@example.com' }));

      await expect(service.signup('Test User', 'existing@example.com', 'password123')).rejects.toThrow(ApiError);
      await expect(service.signup('Test User', 'existing@example.com', 'password123')).rejects.toThrow('already registered');
    });

    it('should split name into first and last name correctly', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(mockUser());

      await service.signup('John Middle Doe', 'test@example.com', 'password123');

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'John',
          lastName: 'Middle Doe',
        })
      );
    });

    it('should handle single word name', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(mockUser());

      await service.signup('John', 'test@example.com', 'password123');

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'John',
          lastName: '',
        })
      );
    });

    it('should trim whitespace from name', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(mockUser());

      await service.signup('  John Doe  ', 'test@example.com', 'password123');

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'John',
          lastName: 'Doe',
        })
      );
    });

    it('should hash password before storing', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(mockUser());

      await service.signup('John Doe', 'test@example.com', 'password123');

      const createCall = mockRepository.create.mock.calls[0][0];
      expect(createCall.password).not.toBe('password123');
      expect(createCall.password).toHaveLength(60); // bcrypt hash length
    });

    it('should generate employee ID with timestamp', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(mockUser());

      await service.signup('John Doe', 'test@example.com', 'password123');

      const createCall = mockRepository.create.mock.calls[0][0];
      expect(createCall.employeeId).toMatch(/^EMP\d+$/);
    });

    it('should set default role as VIEWER', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(mockUser());

      await service.signup('John Doe', 'test@example.com', 'password123');

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'VIEWER',
        })
      );
    });

    it('should generate valid JWT token on signup', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        role: 'VIEWER',
      });

      const result = await service.signup('John Doe', 'test@example.com', 'password123');

      const decoded = jwt.verify(result.token, process.env.JWT_SECRET || 'test-secret-key');
      expect(decoded.id).toBe('user-123');
      expect(decoded.email).toBe('test@example.com');
    });
  });

  describe('getProfile', () => {
    it('should get user profile', async () => {
      const user = mockUser({
        id: 'user-123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        role: 'ADMIN',
        employeeId: 'EMP001',
        phone: '+1234567890',
        isActive: true,
      });

      mockRepository.findById.mockResolvedValue(user);

      const result = await service.getProfile('user-123');

      expect(result.id).toBe('user-123');
      expect(result.name).toBe('John Doe');
      expect(result.email).toBe('test@example.com');
      expect(result.role).toBe('ADMIN');
      expect(result.employeeId).toBe('EMP001');
      expect(result.phone).toBe('+1234567890');
      expect(result.isActive).toBe(true);
    });

    it('should throw not found error if user does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.getProfile('nonexistent')).rejects.toThrow(ApiError);
      await expect(service.getProfile('nonexistent')).rejects.toThrow('not found');
    });

    it('should not return password in profile', async () => {
      const user = mockUser({ password: 'hashedpassword' });
      mockRepository.findById.mockResolvedValue(user);

      const result = await service.getProfile('user-123');

      expect(result).not.toHaveProperty('password');
    });
  });

  describe('forgotPassword', () => {
    it('should return success message for existing email', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser({ email: 'test@example.com' }));

      const result = await service.forgotPassword('test@example.com');

      expect(result.message).toContain('reset link');
    });

    it('should return same message for non-existing email (security)', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.forgotPassword('nonexistent@example.com');

      expect(result.message).toContain('reset link');
    });

    it('should not throw error for any email', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.forgotPassword('any@example.com')).resolves.toBeDefined();
    });
  });
});

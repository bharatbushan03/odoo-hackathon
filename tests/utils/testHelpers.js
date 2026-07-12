const jwt = require('jsonwebtoken');

/**
 * Generate a simple UUID for testing
 */
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * Generate a mock JWT token for testing
 */
const generateAuthToken = (user = {}) => {
  const defaultUser = {
    id: generateUUID(),
    employeeId: 'EMP001',
    email: 'test@example.com',
    role: 'SUPER_ADMIN',
    firstName: 'Test',
    lastName: 'User',
    ...user,
  };

  return jwt.sign(defaultUser, process.env.JWT_SECRET || 'test-secret-key', {
    expiresIn: '1h',
  });
};

/**
 * Generate mock user data
 */
const mockUser = (overrides = {}) => ({
  id: generateUUID(),
  employeeId: 'EMP001',
  email: 'test@example.com',
  password: '$2b$12$hashedpassword',
  firstName: 'Test',
  lastName: 'User',
  role: 'SUPER_ADMIN',
  isActive: true,
  phone: '+1234567890',
  departmentId: generateUUID(),
  lastLoginAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

/**
 * Generate mock asset data
 */
const mockAsset = (overrides = {}) => ({
  id: generateUUID(),
  assetTag: 'AST001',
  name: 'Test Asset',
  description: 'Test asset description',
  category: 'HARDWARE',
  status: 'AVAILABLE',
  serialNumber: 'SN123456',
  modelNumber: 'MODEL123',
  manufacturer: 'Test Manufacturer',
  purchaseDate: new Date('2023-01-01'),
  purchaseCost: 1000.00,
  warrantyExpiry: new Date('2024-01-01'),
  location: 'Office A',
  departmentId: generateUUID(),
  assignedToId: null,
  imageUrl: null,
  notes: 'Test notes',
  createdById: generateUUID(),
  updatedById: generateUUID(),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

/**
 * Generate mock department data
 */
const mockDepartment = (overrides = {}) => ({
  id: generateUUID(),
  name: 'Test Department',
  code: 'DEPT001',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

/**
 * Generate mock organization data
 */
const mockOrganization = (overrides = {}) => ({
  id: generateUUID(),
  name: 'Test Organization',
  code: 'ORG001',
  address: '123 Test Street',
  phone: '+1234567890',
  email: 'org@example.com',
  website: 'https://example.com',
  logo: null,
  taxId: 'TAX123',
  fiscalYear: '2024',
  timezone: 'UTC',
  workingHours: '9-5',
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  ...overrides,
});

/**
 * Generate mock assignment data
 */
const mockAssignment = (overrides = {}) => ({
  id: generateUUID(),
  assetId: generateUUID(),
  userId: generateUUID(),
  assignedAt: new Date(),
  returnedAt: null,
  acceptanceStatus: 'PENDING',
  signature: null,
  signedAt: null,
  notes: 'Test assignment notes',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

/**
 * Generate mock maintenance record data
 */
const mockMaintenance = (overrides = {}) => ({
  id: generateUUID(),
  assetId: generateUUID(),
  performedById: generateUUID(),
  title: 'Test Maintenance',
  description: 'Test maintenance description',
  status: 'SCHEDULED',
  scheduledDate: new Date(),
  completedDate: null,
  cost: 100.00,
  vendorName: 'Test Vendor',
  notes: 'Test maintenance notes',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

/**
 * Generate mock notification data
 */
const mockNotification = (overrides = {}) => ({
  id: generateUUID(),
  userId: generateUUID(),
  title: 'Test Notification',
  message: 'Test notification message',
  isRead: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

/**
 * Mock notification service
 */
const mockNotificationService = {
  createNotification: jest.fn().mockResolvedValue(mockNotification()),
  getNotifications: jest.fn().mockResolvedValue({
    data: [mockNotification()],
    meta: {
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  }),
  markAsRead: jest.fn().mockResolvedValue(mockNotification({ isRead: true })),
  markAllAsRead: jest.fn().mockResolvedValue({ count: 1 }),
};

module.exports = {
  generateAuthToken,
  mockUser,
  mockAsset,
  mockDepartment,
  mockOrganization,
  mockAssignment,
  mockMaintenance,
  mockNotification,
  mockNotificationService,
};

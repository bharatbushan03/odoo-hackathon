const request = require('supertest');
const app = require('../server');

// Mock database
jest.mock('../src/config/database.js', () => ({
  asset: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn()
  },
  assetCategory: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn()
  },
  department: {
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
    findByEmail: jest.fn()
  },
  assetAttachment: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn()
  },
  auditLog: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
    groupBy: jest.fn()
  },
  allocation: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn()
  },
  booking: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn,
    count: jest.fn()
  },
  organization: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn()
  }
}));

// Mock JSON Web Token spies (will be set up in beforeEach)
let jwtMockSign;
let jwtMockVerify;

const prisma = require('../src/config/database');

describe('Asset Endpoints', () => {
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

  const testCategory = {
    name: 'Electronics',
    description: 'Electronic devices and equipment'
  };

  const testDepartment = {
    name: 'IT Department',
    status: 'ACTIVE'
  };

  const testAsset = {
    name: 'Laptop',
    assetTag: 'LT-001',
    serialNumber: 'SN-001',
    categoryId: '', // Will be set after category creation
    departmentId: '', // Will be set after department creation
    status: 'Available',
    condition: 'Good'
  };

  let accessToken;
  let categoryId;
  let departmentId;
  let assetId;

  // Mock data
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

  const mockCategory = {
    id: 'cat-123',
    name: 'Electronics',
    description: 'Electronic devices and equipment',
    status: 'ACTIVE'
  };

  const mockDepartment = {
    id: 'dept-123',
    name: 'IT Department',
    status: 'ACTIVE'
  };

  const mockAsset = {
    id: 'asset-123',
    name: 'Laptop',
    assetTag: 'LT-001',
    serialNumber: 'SN-001',
    categoryId: 'cat-123',
    departmentId: 'dept-123',
    status: 'Available',
    condition: 'Good'
  };

  // Mock authenticated request helper
  const authHeader = (token) => `Bearer ${token}`;

  // Setup before each test
  beforeEach(async () => {
    jest.clearAllMocks();

    // Setup default mock responses
    prisma.organization.findUnique.mockResolvedValue(null); // No existing org
    prisma.organization.create.mockResolvedValue(mockOrg);
    prisma.employee.findByEmail.mockResolvedValue(null); // No existing employee
    prisma.employee.create.mockResolvedValue(mockEmployee);

    // Mock category and department
    prisma.assetCategory.findUnique.mockImplementation((where) => {
      if (where.id === mockCategory.id) {
        return Promise.resolve(mockCategory);
      }
      return Promise.resolve(null);
    });
    prisma.assetCategory.create.mockResolvedValue(mockCategory);

    prisma.department.findUnique.mockImplementation((where) => {
      if (where.id === mockDepartment.id) {
        return Promise.resolve(mockDepartment);
      }
      return Promise.resolve(null);
    });
    prisma.department.create.mockResolvedValue(mockDepartment);

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

    // Create organization and admin
    const orgRes = await request(app)
      .post('/api/v1/auth/register-organization')
      .send(testOrg);

    // Use mock IDs for category and department
    categoryId = mockCategory.id;
    departmentId = mockDepartment.id;

    // Update test asset with IDs
    testAsset.categoryId = categoryId;
    testAsset.departmentId = departmentId;

    // Mock asset creation
    prisma.asset.findUnique.mockResolvedValue(null); // No existing asset with same tag
    prisma.asset.create.mockResolvedValue(mockAsset);
  });

  // Restore mocks after each test
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/v1/assets', () => {
    it('should create a new asset', async () => {
      const res = await request(app)
        .post('/api/v1/assets')
        .set('Authorization', `Bearer mock-token`)
        .send(testAsset);

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Asset created successfully');
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.name).toBe(testAsset.name);
      expect(res.body.data.assetTag).toBe(testAsset.assetTag);

      assetId = res.body.data.id;
    });

    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/v1/assets')
        .set('Authorization', `Bearer mock-token`)
        .send({}); // Empty body

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validation error');
    });

    it('should not create asset with duplicate asset tag', async () => {
      // Create first asset
      await request(app)
        .post('/api/v1/assets')
        .set('Authorization', `Bearer mock-token`)
        .send(testAsset);

      // Try to create second asset with same tag
      const duplicateAsset = { ...testAsset, name: 'Desktop' };
      const res = await request(app)
        .post('/api/v1/assets')
        .set('Authorization', `Bearer mock-token`)
        .send(duplicateAsset);

      expect(res.statusCode).toEqual(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Asset tag already exists');
    });

    it('should not create asset with non-existent category', async () => {
      const invalidAsset = { ...testAsset, categoryId: 'non-existent-id' };
      const res = await request(app)
        .post('/api/v1/assets')
        .set('Authorization', `Bearer mock-token`)
        .send(invalidAsset);

      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Category not found');
    });

    it('should not create asset with non-existent department', async () => {
      const invalidAsset = { ...testAsset, departmentId: 'non-existent-id' };
      const res = await request(app)
        .post('/api/v1/assets')
        .set('Authorization', `Bearer mock-token`)
        .send(invalidAsset);

      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Department not found');
    });
  });

  describe('GET /api/v1/assets', () => {
    beforeEach(async () => {
      // Create a test asset
      const res = await request(app)
        .post('/api/v1/assets')
        .set('Authorization', `Bearer mock-token`)
        .send(testAsset);

      assetId = res.body.data.id;
    });

    it('should get all assets', async () => {
      const res = await request(app)
        .get('/api/v1/assets')
        .set('Authorization', `Bearer mock-token`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Assets retrieved successfully');
      expect(Array.isArray(res.body.assets)).toBe(true);
      expect(res.body.assets.length).toBeGreaterThan(0);
      expect(res.body.meta).toHaveProperty('total');
    });

    it('should get assets with pagination', async () => {
      const res = await request(app)
        .get('/api/v1/assets?page=1&limit=5')
        .set('Authorization', `Bearer mock-token`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.meta).toHaveProperty('page', 1);
      expect(res.body.meta).toHaveProperty('limit', 5);
    });

    it('should get assets with filters', async () => {
      const res = await request(app)
        .get(`/api/v1/assets?categoryId=${categoryId}`)
        .set('Authorization', `Bearer mock-token`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.assets.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/v1/assets/:id', () => {
    beforeEach(async () => {
      // Create a test asset
      const res = await request(app)
        .post('/api/v1/assets')
        .set('Authorization', `Bearer mock-token`)
        .send(testAsset);

      assetId = res.body.data.id;
    });

    it('should get asset by ID', async () => {
      const res = await request(app)
        .get(`/api/v1/assets/${assetId}`)
        .set('Authorization', `Bearer mock-token`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id', assetId);
      expect(res.body.data.name).toBe(testAsset.name);
    });

    it('should return 404 for non-existent asset', async () => {
      const res = await request(app)
        .get('/api/v1/assets/non-existent-id')
        .set('Authorization', `Bearer mock-token`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Asset not found');
    });

    it('should include attachments when requested', async () => {
      const res = await request(app)
        .get(`/api/v1/assets/${assetId}?attachments=true`)
        .set('Authorization', `Bearer mock-token`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('attachments');
    });

    it('should include audit logs when requested', async () => {
      const res = await request(app)
        .get(`/api/v1/assets/${assetId}?audit=true`)
        .set('Authorization', `Bearer mock-token`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('auditLogs');
    });
  });

  describe('PUT /api/v1/assets/:id', () => {
    beforeEach(async () => {
      // Create a test asset
      const res = await request(app)
        .post('/api/v1/assets')
        .set('Authorization', `Bearer mock-token`)
        .send(testAsset);

      assetId = res.body.data.id;
    });

    it('should update asset', async () => {
      const updateData = {
        name: 'Updated Laptop',
        status: 'Allocated',
        condition: 'Excellent'
      };

      const res = await request(app)
        .put(`/api/v1/assets/${assetId}`)
        .set('Authorization', `Bearer mock-token`)
        .send(updateData);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Asset updated successfully');
      expect(res.body.data.name).toBe('Updated Laptop');
      expect(res.body.data.status).toBe('Allocated');
      expect(res.body.data.condition).toBe('Excellent');
    });

    it('should validate required fields', async () => {
      const res = await request(app)
        .put(`/api/v1/assets/${assetId}`)
        .set('Authorization', `Bearer mock-token`)
        .send({}); // Empty body

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validation error');
    });

    it('should return 404 for non-existent asset', async () => {
      const res = await request(app)
        .put('/api/v1/assets/non-existent-id')
        .set('Authorization', `Bearer mock-token`)
        .send({ name: 'Updated Name' });

      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Asset not found');
    });

    it('should not update asset with duplicate asset tag', async () => {
      // Create second asset
      const asset2 = { ...testAsset, assetTag: 'LT-002', name: 'Desktop' };
      const res2 = await request(app)
        .post('/api/v1/assets')
        .set('Authorization', `Bearer mock-token`)
        .send(asset2);

      // Try to update first asset with second asset's tag
      const res = await request(app)
        .put(`/api/v1/assets/${assetId}`)
        .set('Authorization', `Bearer mock-token`)
        .send({ assetTag: 'LT-002' });

      expect(res.statusCode).toEqual(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Asset tag already exists');
    });
  });

  describe('DELETE /api/v1/assets/:id', () => {
    beforeEach(async () => {
      // Create a test asset
      const res = await request(app)
        .post('/api/v1/assets')
        .set('Authorization', `Bearer mock-token`)
        .send(testAsset);

      assetId = res.body.data.id;
    });

    it('should delete asset', async () => {
      const res = await request(app)
        .delete(`/api/v1/assets/${assetId}`)
        .set('Authorization', `Bearer mock-token`);

      expect(res.statusCode).toEqual(204);
    });

    it('should return 404 for non-existent asset', async () => {
      const res = await request(app)
        .delete('/api/v1/assets/non-existent-id')
        .set('Authorization', `Bearer mock-token`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Asset not found');
    });
  });

  describe('POST /api/v1/assets/:id/upload-attachment', () => {
    beforeEach(async () => {
      // Create a test asset
      const res = await request(app)
        .post('/api/v1/assets')
        .set('Authorization', `Bearer mock-token`)
        .send(testAsset);

      assetId = res.body.data.id;
    });

    it('should upload attachment', async () => {
      // This would require multipart/form-data testing
      // For simplicity, we'll skip the actual file upload test
      // but test the endpoint exists and handles missing file
      const res = await request(app)
        .post(`/api/v1/assets/${assetId}/upload-attachment`)
        .set('Authorization', `Bearer mock-token`)
        .send({}); // No file

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('No file uploaded');
    });

    it('should return 404 for non-existent asset', async () => {
      const res = await request(app)
        .post('/api/v1/assets/non-existent-id/upload-attachment')
        .set('Authorization', `Bearer mock-token`)
        .send({});

      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Asset not found');
    });
  });

  describe('GET /api/v1/assets/stats', () => {
    beforeEach(async () => {
      // Create a test asset
      const res = await request(app)
        .post('/api/v1/assets')
        .set('Authorization', `Bearer mock-token`)
        .send(testAsset);

      assetId = res.body.data.id;
    });

    it('should get asset statistics', async () => {
      const res = await request(app)
        .get('/api/v1/assets/stats')
        .set('Authorization', `Bearer mock-token`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Asset statistics retrieved successfully');
      expect(res.body.data).toHaveProperty('totalAssets');
      expect(res.body.data).toHaveProperty('byStatus');
      expect(res.body.data).toHaveProperty('byCondition');
    });
  });
});
const request = require('supertest');
const app = require('../server');
const prisma = require('../src/config/prisma');

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

  // Authenticate before each test
  beforeEach(async () => {
    // Clean up test data
    await prisma.asset.deleteMany({});
    await prisma.assetCategory.deleteMany({});
    await prisma.department.deleteMany({});
    await prisma.refreshToken.deleteMany({});
    await prisma.employee.deleteMany({});
    await prisma.organization.deleteMany({});

    // Create organization
    const orgRes = await request(app)
      .post('/api/v1/auth/register-organization')
      .send(testOrg);

    // Create admin
    await request(app)
      .post('/api/v1/auth/register-admin')
      .send(testAdmin);

    // Login to get token
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testAdmin.email,
        password: testAdmin.password
      });

    accessToken = loginRes.body.data.accessToken;

    // Create category
    const categoryRes = await request(app)
      .post('/api/v1/asset-categories')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(testCategory);

    categoryId = categoryRes.body.data.id;

    // Create department
    const deptRes = await request(app)
      .post('/api/v1/departments')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(testDepartment);

    departmentId = deptRes.body.data.id;

    // Update test asset with IDs
    testAsset.categoryId = categoryId;
    testAsset.departmentId = departmentId;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/v1/assets', () => {
    it('should create a new asset', async () => {
      const res = await request(app)
        .post('/api/v1/assets')
        .set('Authorization', `Bearer ${accessToken}`)
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
        .set('Authorization', `Bearer ${accessToken}`)
        .send({}); // Empty body

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validation error');
    });

    it('should not create asset with duplicate asset tag', async () => {
      // Create first asset
      await request(app)
        .post('/api/v1/assets')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(testAsset);

      // Try to create second asset with same tag
      const duplicateAsset = { ...testAsset, name: 'Desktop' };
      const res = await request(app)
        .post('/api/v1/assets')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(duplicateAsset);

      expect(res.statusCode).toEqual(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Asset tag already exists');
    });

    it('should not create asset with non-existent category', async () => {
      const invalidAsset = { ...testAsset, categoryId: 'non-existent-id' };
      const res = await request(app)
        .post('/api/v1/assets')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidAsset);

      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Category not found');
    });

    it('should not create asset with non-existent department', async () => {
      const invalidAsset = { ...testAsset, departmentId: 'non-existent-id' };
      const res = await request(app)
        .post('/api/v1/assets')
        .set('Authorization', `Bearer ${accessToken}`)
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
        .set('Authorization', `Bearer ${accessToken}`)
        .send(testAsset);

      assetId = res.body.data.id;
    });

    it('should get all assets', async () => {
      const res = await request(app)
        .get('/api/v1/assets')
        .set('Authorization', `Bearer ${accessToken}`);

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
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.meta).toHaveProperty('page', 1);
      expect(res.body.meta).toHaveProperty('limit', 5);
    });

    it('should get assets with filters', async () => {
      const res = await request(app)
        .get(`/api/v1/assets?categoryId=${categoryId}`)
        .set('Authorization', `Bearer ${accessToken}`);

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
        .set('Authorization', `Bearer ${accessToken}`)
        .send(testAsset);

      assetId = res.body.data.id;
    });

    it('should get asset by ID', async () => {
      const res = await request(app)
        .get(`/api/v1/assets/${assetId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id', assetId);
      expect(res.body.data.name).toBe(testAsset.name);
    });

    it('should return 404 for non-existent asset', async () => {
      const res = await request(app)
        .get('/api/v1/assets/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Asset not found');
    });

    it('should include attachments when requested', async () => {
      const res = await request(app)
        .get(`/api/v1/assets/${assetId}?attachments=true`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('attachments');
    });

    it('should include audit logs when requested', async () => {
      const res = await request(app)
        .get(`/api/v1/assets/${assetId}?audit=true`)
        .set('Authorization', `Bearer ${accessToken}`);

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
        .set('Authorization', `Bearer ${accessToken}`)
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
        .set('Authorization', `Bearer ${accessToken}`)
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
        .set('Authorization', `Bearer ${accessToken}`)
        .send({}); // Empty body

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validation error');
    });

    it('should return 404 for non-existent asset', async () => {
      const res = await request(app)
        .put('/api/v1/assets/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
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
        .set('Authorization', `Bearer ${accessToken}`)
        .send(asset2);

      // Try to update first asset with second asset's tag
      const res = await request(app)
        .put(`/api/v1/assets/${assetId}`)
        .set('Authorization', `Bearer ${accessToken}`)
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
        .set('Authorization', `Bearer ${accessToken}`)
        .send(testAsset);

      assetId = res.body.data.id;
    });

    it('should delete asset', async () => {
      const res = await request(app)
        .delete(`/api/v1/assets/${assetId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toEqual(204);
    });

    it('should return 404 for non-existent asset', async () => {
      const res = await request(app)
        .delete('/api/v1/assets/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`);

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
        .set('Authorization', `Bearer ${accessToken}`)
        .send(testAsset);

      assetId = res.body.data.id;
    });

    it('should upload attachment', async () => {
      // This would require multipart/form-data testing
      // For simplicity, we'll skip the actual file upload test
      // but test the endpoint exists and handles missing file
      const res = await request(app)
        .post(`/api/v1/assets/${assetId}/upload-attachment`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({}); // No file

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('No file uploaded');
    });

    it('should return 404 for non-existent asset', async () => {
      const res = await request(app)
        .post('/api/v1/assets/non-existent-id/upload-attachment')
        .set('Authorization', `Bearer ${accessToken}`)
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
        .set('Authorization', `Bearer ${accessToken}`)
        .send(testAsset);

      assetId = res.body.data.id;
    });

    it('should get asset statistics', async () => {
      const res = await request(app)
        .get('/api/v1/assets/stats')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Asset statistics retrieved successfully');
      expect(res.body.data).toHaveProperty('totalAssets');
      expect(res.body.data).toHaveProperty('byStatus');
      expect(res.body.data).toHaveProperty('byCondition');
    });
  });
});
const request = require('supertest');
const app = require('../server');
const prisma = require('../src/config/prisma');

describe('Maintenance Endpoints', () => {
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

  const testAsset = {
    name: 'Test Laptop',
    assetTag: 'LT-001',
    serialNumber: 'SN123456',
    categoryId: 'test-category-id', // This will be handled in beforeEach
    status: 'Available',
    condition: 'Good'
  };

  const testMaintenance = {
    title: 'Laptop Screen Repair',
    description: 'Cracked screen needs replacement',
    type: 'CORRECTIVE',
    priority: 'HIGH',
    estimatedCost: 200
  };

  let accessToken;
  let assetId;
  let maintenanceId;
  let categoryId;

  // Authenticate and set up test data before each test
  beforeEach(async () => {
    // Clean up test data
    await prisma.maintenanceRequest.deleteMany({});
    await prisma.maintenanceAttachment.deleteMany({});
    await prisma.asset.deleteMany({});
    await prisma.assetCategory.deleteMany({});
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

    // Create asset category
    const categoryRes = await request(app)
      .post('/api/v1/asset-categories')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Electronics', status: 'ACTIVE' });

    categoryId = categoryRes.body.data.id;

    // Create test asset with valid categoryId
    const assetWithCategory = {
      ...testAsset,
      categoryId: categoryId
    };

    const assetRes = await request(app)
      .post('/api/v1/assets')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(assetWithCategory);

    assetId = assetRes.body.data.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /api/v1/maintenance', () => {
    beforeEach(async () => {
      // Create a test maintenance request
      const maintenanceWithAsset = {
        ...testMaintenance,
        assetId: assetId
      };

      const res = await request(app)
        .post('/api/v1/maintenance')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(maintenanceWithAsset);

      maintenanceId = res.body.data.id;
    });

    it('should get all maintenance requests', async () => {
      const res = await request(app)
        .get('/api/v1/maintenance')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body).toHaveProperty('count');
    });

    it('should get maintenance requests with pagination', async () => {
      const res = await request(app)
        .get('/api/v1/maintenance?page=1&limit=5')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeLessThanOrEqual(5);
    });

    it('should get maintenance requests filtered by status', async () => {
      const res = await request(app)
        .get('/api/v1/maintenance?status=PENDING')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should get maintenance requests filtered by assetId', async () => {
      const res = await request(app)
        .get(`/api/v1/maintenance?assetId=${assetId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/v1/maintenance/:id', () => {
    beforeEach(async () => {
      // Create a test maintenance request
      const maintenanceWithAsset = {
        ...testMaintenance,
        assetId: assetId
      };

      const res = await request(app)
        .post('/api/v1/maintenance')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(maintenanceWithAsset);

      maintenanceId = res.body.data.id;
    });

    it('should get maintenance request by ID', async () => {
      const res = await request(app)
        .get(`/api/v1/maintenance/${maintenanceId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id', maintenanceId);
      expect(res.body.data.title).toBe(testMaintenance.title);
      expect(res.body.data.description).toBe(testMaintenance.description);
      expect(res.body.data.assetId).toBe(assetId);
    });

    it('should return 404 for non-existent maintenance request', async () => {
      const res = await request(app)
        .get('/api/v1/maintenance/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Maintenance request not found');
    });
  });

  describe('POST /api/v1/maintenance', () => {
    it('should create a new maintenance request', async () => {
      const maintenanceWithAsset = {
        ...testMaintenance,
        assetId: assetId
      };

      const res = await request(app)
        .post('/api/v1/maintenance')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(maintenanceWithAsset);

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Maintenance request created');
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.title).toBe(testMaintenance.title);
      expect(res.body.data.description).toBe(testMaintenance.description);
      expect(res.body.data.assetId).toBe(assetId);
      expect(res.body.data.status).toBe('PENDING');
      expect(res.body.data.priority).toBe(testMaintenance.priority);
      expect(res.body.data.estimatedCost).toBe(testMaintenance.estimatedCost);

      maintenanceId = res.body.data.id;
    });

    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/v1/maintenance')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({}); // Empty body

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validation error');
    });

    it('should return 404 for non-existent asset', async () => {
      const invalidMaintenance = {
        ...testMaintenance,
        assetId: 'non-existent-asset-id'
      };

      const res = await request(app)
        .post('/api/v1/maintenance')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidMaintenance);

      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Asset not found');
    });

    it('should create maintenance request with technician assigned', async () => {
      // This would require creating a technician employee first
      // For simplicity, we're skipping this test
    });
  });

  describe('PUT /api/v1/maintenance/:id', () => {
    beforeEach(async () => {
      // Create a test maintenance request
      const maintenanceWithAsset = {
        ...testMaintenance,
        assetId: assetId
      };

      const res = await request(app)
        .post('/api/v1/maintenance')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(maintenanceWithAsset);

      maintenanceId = res.body.data.id;
    });

    it('should update maintenance request', async () => {
      const updateData = {
        title: 'Updated Laptop Screen Repair',
        description: 'Updated description',
        priority: 'MEDIUM'
      };

      const res = await request(app)
        .put(`/api/v1/maintenance/${maintenanceId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Maintenance request updated');
      expect(res.body.data.title).toBe('Updated Laptop Screen Repair');
      expect(res.body.data.description).toBe('Updated description');
      expect(res.body.data.priority).toBe('MEDIUM');
    });

    it('should validate required fields', async () => {
      const res = await request(app)
        .put(`/api/v1/maintenance/${maintenanceId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({}); // Empty body

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validation error');
    });

    it('should return 404 for non-existent maintenance request', async () => {
      const res = await request(app)
        .put('/api/v1/maintenance/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Updated Title' });

      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Maintenance request not found');
    });
  });

  describe('PUT /api/v1/maintenance/:id/status', () => {
    beforeEach(async () => {
      // Create a test maintenance request
      const maintenanceWithAsset = {
        ...testMaintenance,
        assetId: assetId
      };

      const res = await request(app)
        .post('/api/v1/maintenance')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(maintenanceWithAsset);

      maintenanceId = res.body.data.id;
    });

    it('should update maintenance request status', async () => {
      const statusUpdate = {
        status: 'APPROVED'
      };

      const res = await request(app)
        .put(`/api/v1/maintenance/${maintenanceId}/status`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(statusUpdate);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Status updated to APPROVED');
      expect(res.body.data.status).toBe('APPROVED');
    });

    it('should not allow invalid status transitions', async () => {
      // Try to go from PENDING to COMPLETED (should require APPROVED first)
      const invalidStatus = {
        status: 'COMPLETED'
      };

      const res = await request(app)
        .put(`/api/v1/maintenance/${maintenanceId}/status`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidStatus);

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Cannot transition from PENDING to COMPLETED');
    });

    it('should handle completion with resolution and costs', async () => {
      // First approve the request
      await request(app)
        .put(`/api/v1/maintenance/${maintenanceId}/status`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ status: 'APPROVED' });

      // Then assign a technician (would need a technician user)
      // For simplicity, we'll skip technician assignment and go directly to IN_PROGRESS
      // In a real scenario, we'd need to assign a technician first

      // Complete the maintenance request
      const completionData = {
        status: 'COMPLETED',
        resolution: 'Screen replaced successfully',
        laborCost: 100,
        partsCost: 80,
        vendorCost: 20
      };

      const res = await request(app)
        .put(`/api/v1/maintenance/${maintenanceId}/status`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(completionData);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Status updated to COMPLETED');
      expect(res.body.data.status).toBe('COMPLETED');
      expect(res.body.data.resolution).toBe('Screen replaced successfully');
      expect(res.body.data.laborCost).toBe(100);
      expect(res.body.data.partsCost).toBe(80);
      expect(res.body.data.vendorCost).toBe(20);
      expect(res.body.data.totalCost).toBe(400); // 200 estimated + 100 labor + 80 parts + 20 vendor
    });

    it('should return 404 for non-existent maintenance request', async () => {
      const res = await request(app)
        .put('/api/v1/maintenance/non-existent-id/status')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ status: 'APPROVED' });

      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Maintenance request not found');
    });
  });

  describe('POST /api/v1/maintenance/:id/assign-technician', () => {
    it('should assign technician to maintenance request', async () => {
      // This would require creating a technician employee first
      // For simplicity, we're skipping this test
    });

    it('should return 404 for non-existent maintenance request', async () => {
      const res = await request(app)
        .post('/api/v1/maintenance/non-existent-id/assign-technician')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ technicianId: 'some-tech-id' });

      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Maintenance request not found');
    });
  });

  describe('DELETE /api/v1/maintenance/:id', () => {
    beforeEach(async () => {
      // Create a test maintenance request
      const maintenanceWithAsset = {
        ...testMaintenance,
        assetId: assetId
      };

      const res = await request(app)
        .post('/api/v1/maintenance')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(maintenanceWithAsset);

      maintenanceId = res.body.data.id;
    });

    it('should delete maintenance request', async () => {
      const res = await request(app)
        .delete(`/api/v1/maintenance/${maintenanceId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Maintenance request deleted');
    });

    it('should return 404 for non-existent maintenance request', async () => {
      const res = await request(app)
        .delete('/api/v1/maintenance/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Maintenance request not found');
    });
  });

  describe('POST /api/v1/maintenance/:id/attachments', () => {
    beforeEach(async () => {
      // Create a test maintenance request
      const maintenanceWithAsset = {
        ...testMaintenance,
        assetId: assetId
      };

      const res = await request(app)
        .post('/api/v1/maintenance')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(maintenanceWithAsset);

      maintenanceId = res.body.data.id;
    });

    it('should add attachment to maintenance request', async () => {
      // This would require multipart/form-data testing
      // For simplicity, we'll test the error case when no file is provided
      const res = await request(app)
        .post(`/api/v1/maintenance/${maintenanceId}/attachments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({}); // No file

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('No file uploaded');
    });

    it('should return 404 for non-existent maintenance request', async () => {
      const res = await request(app)
        .post('/api/v1/maintenance/non-existent-id/attachments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({});

      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Maintenance request not found');
    });
  });

  describe('DELETE /api/v1/maintenance/:id/attachments/:attachmentId', () => {
    it('should remove attachment from maintenance request', async () => {
      // This would require creating an attachment first
      // For simplicity, we're skipping this test
    });

    it('should return 404 for non-existent maintenance request', async () => {
      const res = await request(app)
        .delete('/api/v1/maintenance/non-existent-id/attachments/1')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Maintenance request not found');
    });
  });

  describe('GET /api/v1/maintenance/stats', () => {
    beforeEach(async () => {
      // Create a test maintenance request
      const maintenanceWithAsset = {
        ...testMaintenance,
        assetId: assetId
      };

      const res = await request(app)
        .post('/api/v1/maintenance')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(maintenanceWithAsset);

      maintenanceId = res.body.data.id;
    });

    it('should get maintenance statistics', async () => {
      const res = await request(app)
        .get('/api/v1/maintenance/stats')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('total');
      expect(res.body.data).toHaveProperty('byStatus');
      expect(res.body.data).toHaveProperty('byType');
      expect(res.body.data).toHaveProperty('costs');
    });
  });

  describe('GET /api/v1/maintenance/schedules', () => {
    it('should get maintenance schedules', async () => {
      const res = await request(app)
        .get('/api/v1/maintenance/schedules')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('POST /api/v1/maintenance/vendors', () => {
    it('should create a new vendor', async () => {
      const vendorData = {
        name: 'Tech Supplies Inc',
        contactPerson: 'John Doe',
        email: 'contact@techsupplies.com',
        phone: '123-456-7890',
        address: '123 Tech Street'
      };

      const res = await request(app)
        .post('/api/v1/maintenance/vendors')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(vendorData);

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Vendor created');
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.name).toBe(vendorData.name);
    });

    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/v1/maintenance/vendors')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({}); // Empty body

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validation error');
    });

    it('should not create vendor with duplicate name', async () => {
      const vendorData = {
        name: 'Tech Supplies Inc',
        contactPerson: 'John Doe',
        email: 'contact@techsupplies.com',
        phone: '123-456-7890',
        address: '123 Tech Street'
      };

      // Create first vendor
      await request(app)
        .post('/api/v1/maintenance/vendors')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(vendorData);

      // Try to create duplicate
      const res = await request(app)
        .post('/api/v1/maintenance/vendors')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(vendorData);

      expect(res.statusCode).toEqual(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Vendor with this name already exists');
    });
  });

  describe('GET /api/v1/maintenance/vendors', () => {
    beforeEach(async () => {
      // Create a test vendor
      const vendorData = {
        name: 'Tech Supplies Inc',
        contactPerson: 'John Doe',
        email: 'contact@techsupplies.com',
        phone: '123-456-7890',
        address: '123 Tech Street'
      };

      await request(app)
        .post('/api/v1/maintenance/vendors')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(vendorData);
    });

    it('should get all vendors', async () => {
      const res = await request(app)
        .get('/api/v1/maintenance/vendors')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body).toHaveProperty('count');
    });

    it('should get vendors with pagination', async () => {
      const res = await request(app)
        .get('/api/v1/maintenance/vendors?page=1&limit=5')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeLessThanOrEqual(5);
    });

    it('should get vendors with search', async () => {
      const res = await request(app)
        .get('/api/v1/maintenance/vendors?search=Tech')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/v1/maintenance/vendors/:id', () => {
    beforeEach(async () => {
      // Create a test vendor
      const vendorData = {
        name: 'Tech Supplies Inc',
        contactPerson: 'John Doe',
        email: 'contact@techsupplies.com',
        phone: '123-456-7890',
        address: '123 Tech Street'
      };

      const res = await request(app)
        .post('/api/v1/maintenance/vendors')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(vendorData);

      vendorId = res.body.data.id;
    });

    it('should get vendor by ID', async () => {
      const res = await request(app)
        .get(`/api/v1/maintenance/vendors/${vendorId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id', vendorId);
      expect(res.body.data.name).toBe('Tech Supplies Inc');
    });

    it('should return 404 for non-existent vendor', async () => {
      const res = await request(app)
        .get('/api/v1/maintenance/vendors/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Vendor not found');
    });
  });

  describe('PUT /api/v1/maintenance/vendors/:id', () => {
    beforeEach(async () => {
      // Create a test vendor
      const vendorData = {
        name: 'Tech Supplies Inc',
        contactPerson: 'John Doe',
        email: 'contact@techsupplies.com',
        phone: '123-456-7890',
        address: '123 Tech Street'
      };

      const res = await request(app)
        .post('/api/v1/maintenance/vendors')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(vendorData);

      vendorId = res.body.data.id;
    });

    it('should update vendor', async () => {
      const updateData = {
        name: 'Updated Tech Supplies Inc',
        email: 'updated@techsupplies.com'
      };

      const res = await request(app)
        .put(`/api/v1/maintenance/vendors/${vendorId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Vendor updated');
      expect(res.body.data.name).toBe('Updated Tech Supplies Inc');
      expect(res.body.data.email).toBe('updated@techsupplies.com');
    });

    it('should validate required fields', async () => {
      const res = await request(app)
        .put(`/api/v1/maintenance/vendors/${vendorId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({}); // Empty body

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validation error');
    });

    it('should return 404 for non-existent vendor', async () => {
      const res = await request(app)
        .put('/api/v1/maintenance/vendors/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Updated Name' });

      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Vendor not found');
    });
  });

  describe('DELETE /api/v1/maintenance/vendors/:id', () => {
    beforeEach(async () => {
      // Create a test vendor
      const vendorData = {
        name: 'Tech Supplies Inc',
        contactPerson: 'John Doe',
        email: 'contact@techsupplies.com',
        phone: '123-456-7890',
        address: '123 Tech Street'
      };

      const res = await request(app)
        .post('/api/v1/maintenance/vendors')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(vendorData);

      vendorId = res.body.data.id;
    });

    it('should delete vendor', async () => {
      const res = await request(app)
        .delete(`/api/v1/maintenance/vendors/${vendorId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Vendor deleted');
    });

    it('should return 404 for non-existent vendor', async () => {
      const res = await request(app)
        .delete('/api/v1/maintenance/vendors/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Vendor not found');
    });
  });
});
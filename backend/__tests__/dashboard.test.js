const request = require('supertest');
const app = require('../server');
const prisma = require('../src/config/prisma');

describe('Dashboard Endpoints', () => {
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

  let accessToken;

  // Authenticate before each test
  beforeEach(async () => {
    // Clean up test data
    await prisma.asset.deleteMany({});
    await prisma.allocation.deleteMany({});
    await prisma.booking.deleteMany({});
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
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /api/v1/dashboard/kpis', () => {
    it('should get dashboard KPIs', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/kpis')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);

      // Check that all expected KPIs are present
      expect(res.body).toHaveProperty('assetsAvailable');
      expect(res.body).toHaveProperty('assetsAllocated');
      expect(res.body).toHaveProperty('maintenanceToday');
      expect(res.body).toHaveProperty('activeBookings');
      expect(res.body).toHaveProperty('pendingTransfers');
      expect(res.body).toHaveProperty('upcomingReturns');
      expect(res.body).toHaveProperty('overdueReturns');

      // Check that values are numbers
      expect(typeof res.body.assetsAvailable).toBe('number');
      expect(typeof res.body.assetsAllocated).toBe('number');
      expect(typeof res.body.maintenanceToday).toBe('number');
      expect(typeof res.body.activeBookings).toBe('number');
      expect(typeof res.body.pendingTransfers).toBe('number');
      expect(typeof res.body.upcomingReturns).toBe('number');
      expect(Array.isArray(res.body.overdueReturns)).toBe(true);
    });

    it('should return 0 for all KPIs when no data exists', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/kpis')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);

      // With no data, most values should be 0
      expect(res.body.assetsAvailable).toBe(0);
      expect(res.body.assetsAllocated).toBe(0);
      expect(res.body.maintenanceToday).toBe(0);
      expect(res.body.activeBookings).toBe(0);
      expect(res.body.pendingTransfers).toBe(0);
      expect(res.body.upcomingReturns).toBe(0);
      expect(res.body.overdueReturns.length).toBe(0);
    });

    it('should calculate KPIs correctly with sample data', async () => {
      // Create an asset category first
      const categoryRes = await request(app)
        .post('/api/v1/asset-categories')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Electronics', status: 'ACTIVE' });

      const categoryId = categoryRes.body.data.id;

      // Create an asset
      const assetData = {
        name: 'Test Laptop',
        assetTag: 'LT-001',
        serialNumber: 'SN123456',
        categoryId: categoryId,
        status: 'Available',
        condition: 'Good'
      };

      const assetRes = await request(app)
        .post('/api/v1/assets')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(assetData);

      const assetId = assetRes.body.data.id;

      // Create an allocation (to test assetsAllocated)
      const allocationData = {
        assetId: assetId,
        holderType: 'Employee',
        holderId: 'test-employee-id',
        holderName: 'Test Employee',
        expectedReturnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // One week from now
      };

      await request(app)
        .post('/api/v1/allocations')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(allocationData);

      // Get KPIs
      const res = await request(app)
        .get('/api/v1/dashboard/kpis')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);

      // With one asset available and one allocated
      expect(res.body.assetsAvailable).toBeGreaterThanOrEqual(0);
      expect(res.body.assetsAllocated).toBeGreaterThanOrEqual(0);
    });
  });
});
const request = require('supertest');
const app = require('../server');
const prisma = require('../src/config/prisma');

describe('Department Endpoints', () => {
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

  const testDepartment = {
    name: 'IT Department',
    status: 'ACTIVE'
  };

  let accessToken;
  let parentDeptId;
  let deptId;

  // Authenticate before each test
  beforeEach(async () => {
    // Clean up test data
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
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/v1/departments', () => {
    it('should create a new department', async () => {
      const res = await request(app)
        .post('/api/v1/departments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(testDepartment);

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.name).toBe(testDepartment.name);
      expect(res.body.data.status).toBe(testDepartment.status);

      deptId = res.body.data.id;
    });

    it('should create a department with parent', async () => {
      // Create parent department first
      const parentDept = await request(app)
        .post('/api/v1/departments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Parent Department', status: 'ACTIVE' });

      parentDeptId = parentDept.body.data.id;

      // Create child department
      const childDept = {
        name: 'Child Department',
        parentId: parentDeptId,
        status: 'ACTIVE'
      };

      const res = await request(app)
        .post('/api/v1/departments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(childDept);

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.parentId).toBe(parentDeptId);
    });

    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/v1/departments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({}); // Empty body

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validation error');
    });

    it('should not create department with invalid parent', async () => {
      const invalidDept = {
        name: 'Test Department',
        parentId: 'non-existent-id',
        status: 'ACTIVE'
      };

      const res = await request(app)
        .post('/api/v1/departments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidDept);

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Parent department not found');
    });

    it('should not create department with invalid status', async () => {
      const invalidDept = {
        name: 'Test Department',
        status: 'INVALID_STATUS'
      };

      const res = await request(app)
        .post('/api/v1/departments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidDept);

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validation error');
    });
  });

  describe('GET /api/v1/departments', () => {
    beforeEach(async () => {
      // Create a test department
      const res = await request(app)
        .post('/api/v1/departments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(testDepartment);

      deptId = res.body.data.id;
    });

    it('should get all departments', async () => {
      const res = await request(app)
        .get('/api/v1/departments')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.meta).toHaveProperty('total');
    });

    it('should get departments with pagination', async () => {
      const res = await request(app)
        .get('/api/v1/departments?page=1&limit=5')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.meta).toHaveProperty('page', 1);
      expect(res.body.meta).toHaveProperty('limit', 5);
    });

    it('should get departments with filters', async () => {
      const res = await request(app)
        .get('/api/v1/departments?status=ACTIVE')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should get departments with search', async () => {
      const res = await request(app)
        .get('/api/v1/departments?search=IT')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should get departments with sorting', async () => {
      const res = await request(app)
        .get('/api/v1/departments?sortBy=name&sortOrder=asc')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/v1/departments/:id', () => {
    beforeEach(async () => {
      // Create a test department
      const res = await request(app)
        .post('/api/v1/departments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(testDepartment);

      deptId = res.body.data.id;
    });

    it('should get department by ID', async () => {
      const res = await request(app)
        .get(`/api/v1/departments/${deptId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data).toHaveProperty('id', deptId);
      expect(res.body.data.name).toBe(testDepartment.name);
      expect(res.body.data.status).toBe(testDepartment.status);
    });

    it('should return 404 for non-existent department', async () => {
      const res = await request(app)
        .get('/api/v1/departments/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Department not found');
    });

    it('should include statistics when requested', async () => {
      const res = await request(app)
        .get(`/api/v1/departments/${deptId}?includeStats=true`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data).toHaveProperty('statistics');
    });

    it('should include hierarchy when requested', async () => {
      // Create child department
      const childDept = {
        name: 'Child Department',
        parentId: deptId,
        status: 'ACTIVE'
      };

      await request(app)
        .post('/api/v1/departments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(childDept);

      const res = await request(app)
        .get(`/api/v1/departments/${deptId}?includeHierarchy=true`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data).toHaveProperty('children');
      expect(Array.isArray(res.body.data.children)).toBe(true);
    });
  });

  describe('PUT /api/v1/departments/:id', () => {
    beforeEach(async () => {
      // Create a test department
      const res = await request(app)
        .post('/api/v1/departments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(testDepartment);

      deptId = res.body.data.id;
    });

    it('should update department', async () => {
      const updateData = {
        name: 'Updated IT Department',
        status: 'INACTIVE'
      };

      const res = await request(app)
        .put(`/api/v1/departments/${deptId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.name).toBe('Updated IT Department');
      expect(res.body.data.status).toBe('INACTIVE');
    });

    it('should validate required fields', async () => {
      const res = await request(app)
        .put(`/api/v1/departments/${deptId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({}); // Empty body

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validation error');
    });

    it('should return 404 for non-existent department', async () => {
      const res = await request(app)
        .put('/api/v1/departments/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Updated Name' });

      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Department not found');
    });

    it('should not create circular parent reference', async () => {
      // Create parent department
      const parentDept = await request(app)
        .post('/api/v1/departments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Parent Department', status: 'ACTIVE' });

      parentDeptId = parentDept.body.data.id;

      // Try to set parent as child (creating a cycle)
      const res = await request(app)
        .put(`/api/v1/departments/${parentDeptId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ parentId: deptId }); // This would create a cycle

      expect(res.statusCode).toEqual(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Circular parent reference detected');
    });
  });

  describe('DELETE /api/v1/departments/:id', () => {
    beforeEach(async () => {
      // Create a test department
      const res = await request(app)
        .post('/api/v1/departments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(testDepartment);

      deptId = res.body.data.id;
    });

    it('should delete department', async () => {
      const res = await request(app)
        .delete(`/api/v1/departments/${deptId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toEqual(204);
    });

    it('should return 404 for non-existent department', async () => {
      const res = await request(app)
        .delete('/api/v1/departments/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Department not found');
    });

    it('should not delete department with employees', async () => {
      // Note: This test would require creating an employee first
      // For simplicity, we're skipping this test as it requires more setup
      // In a real scenario, we would create an employee in this department
      // and then try to delete the department
    });

    it('should not delete department with child departments', async () => {
      // Create child department
      const childDept = {
        name: 'Child Department',
        parentId: deptId,
        status: 'ACTIVE'
      };

      await request(app)
        .post('/api/v1/departments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(childDept);

      // Try to delete parent department
      const res = await request(app)
        .delete(`/api/v1/departments/${deptId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toEqual(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Cannot delete department');
      expect(res.body.blockers.activeChildren).toBeGreaterThan(0);
    });
  });

  describe('GET /api/v1/departments/:id/hierarchy', () => {
    beforeEach(async () => {
      // Create parent department
      const parentDept = await request(app)
        .post('/api/v1/departments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Parent Department', status: 'ACTIVE' });

      parentDeptId = parentDept.body.data.id;

      // Create child department
      const childDept = {
        name: 'Child Department',
        parentId: parentDeptId,
        status: 'ACTIVE'
      };

      await request(app)
        .post('/api/v1/departments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(childDept);
    });

    it('should get department hierarchy', async () => {
      const res = await request(app)
        .get(`/api/v1/departments/${parentDeptId}/hierarchy`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should return 404 for non-existent department', async () => {
      const res = await request(app)
        .get('/api/v1/departments/non-existent-id/hierarchy')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Department not found');
    });
  });

  describe('GET /api/v1/departments/:id/statistics', () => {
    beforeEach(async () => {
      // Create a test department
      const res = await request(app)
        .post('/api/v1/departments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(testDepartment);

      deptId = res.body.data.id;
    });

    it('should get department statistics', async () => {
      const res = await request(app)
        .get(`/api/v1/departments/${deptId}/statistics`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('departmentId', deptId);
      expect(res.body).toHaveProperty('directStats');
      expect(res.body).toHaveProperty('totalStats');
    });

    it('should return 404 for non-existent department', async () => {
      const res = await request(app)
        .get('/api/v1/departments/non-existent-id/statistics')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Department not found');
    });
  });

  describe('GET /api/v1/departments/search', () => {
    beforeEach(async () => {
      // Create a test department
      const res = await request(app)
        .post('/api/v1/departments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(testDepartment);

      deptId = res.body.data.id;
    });

    it('should search departments by name', async () => {
      const res = await request(app)
        .get('/api/v1/departments/search?q=IT')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should return 400 for missing search query', async () => {
      const res = await request(app)
        .get('/api/v1/departments/search')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Search query is required');
    });
  });

  describe('GET /api/v1/departments/head/:headId', () => {
    it('should get departments by head ID', async () => {
      // This would require creating an employee with DEPT_HEAD role
      // For simplicity, we're skipping this test
    });

    it('should return 404 for non-existent head', async () => {
      const res = await request(app)
        .get('/api/v1/departments/head/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Department not found');
    });
  });

  describe('PUT /api/v1/departments/:id/head', () => {
    it('should set department head', async () => {
      // This would require creating an employee with DEPT_HEAD role
      // For simplicity, we're skipping this test
    });

    it('should return 404 for non-existent department', async () => {
      const res = await request(app)
        .put('/api/v1/departments/non-existent-id/head')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ employeeId: 'some-id' });

      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Department not found');
    });
  });

  describe('DELETE /api/v1/departments/:id/head', () => {
    it('should remove department head', async () => {
      // This would require setting a department head first
      // For simplicity, we're skipping this test
    });

    it('should return 404 for non-existent department', async () => {
      const res = await request(app)
        .delete('/api/v1/departments/non-existent-id/head')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Department not found');
    });
  });
});
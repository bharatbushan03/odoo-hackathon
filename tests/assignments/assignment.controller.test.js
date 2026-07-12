const request = require('supertest');
const { generateAuthToken, mockAsset, mockUser, mockAssignment, mockNotificationService } = require('../utils/testHelpers');
const prisma = require('../../src/config/database');
const { UserRole } = require('../../src/constants');

describe('Assignment Controller', () => {
  let app;
  let authToken;
  let adminToken;

  beforeAll(() => {
    app = require('../utils/testApp');
    authToken = generateAuthToken({ id: 'user-123', role: UserRole.SUPER_ADMIN });
    adminToken = generateAuthToken({ id: 'admin-123', role: UserRole.ADMIN });
  });

  describe('POST /api/v1/assignments', () => {
    it('should assign asset to user', async () => {
      const asset = mockAsset({ id: 'asset-123', status: 'AVAILABLE' });
      const user = mockUser({ id: 'user-456' });
      const assignment = mockAssignment({
        assetId: 'asset-123',
        userId: 'user-456',
      });

      prisma.asset.findUnique.mockResolvedValue(asset);
      prisma.user.findUnique.mockResolvedValue(user);
      prisma.assetAssignment.create.mockResolvedValue(assignment);
      prisma.asset.update.mockResolvedValue({ ...asset, status: 'ASSIGNED' });

      const response = await request(app)
        .post('/api/v1/assignments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          assetId: 'asset-123',
          userId: 'user-456',
          notes: 'Test assignment',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(prisma.assetAssignment.create).toHaveBeenCalled();
    });

    it('should return 404 if asset not found', async () => {
      prisma.asset.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/v1/assignments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          assetId: 'nonexistent-asset',
          userId: 'user-456',
        });

      expect(response.status).toBe(404);
    });

    it('should return 409 if asset is not available', async () => {
      const asset = mockAsset({ id: 'asset-123', status: 'ASSIGNED' });
      prisma.asset.findUnique.mockResolvedValue(asset);

      const response = await request(app)
        .post('/api/v1/assignments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          assetId: 'asset-123',
          userId: 'user-456',
        });

      expect(response.status).toBe(409);
    });

    it('should return 404 if user not found', async () => {
      const asset = mockAsset({ id: 'asset-123', status: 'AVAILABLE' });
      prisma.asset.findUnique.mockResolvedValue(asset);
      prisma.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/v1/assignments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          assetId: 'asset-123',
          userId: 'nonexistent-user',
        });

      expect(response.status).toBe(404);
    });

    it('should allow MANAGER to assign assets', async () => {
      const managerToken = generateAuthToken({ id: 'manager-123', role: UserRole.MANAGER });
      const asset = mockAsset({ id: 'asset-123', status: 'AVAILABLE' });
      const user = mockUser({ id: 'user-456' });
      const assignment = mockAssignment();

      prisma.asset.findUnique.mockResolvedValue(asset);
      prisma.user.findUnique.mockResolvedValue(user);
      prisma.assetAssignment.create.mockResolvedValue(assignment);
      prisma.asset.update.mockResolvedValue({ ...asset, status: 'ASSIGNED' });

      const response = await request(app)
        .post('/api/v1/assignments')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          assetId: 'asset-123',
          userId: 'user-456',
        });

      expect(response.status).toBe(201);
    });

    it('should return 403 for unauthorized role', async () => {
      const viewerToken = generateAuthToken({ id: 'viewer-123', role: UserRole.VIEWER });

      const response = await request(app)
        .post('/api/v1/assignments')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          assetId: 'asset-123',
          userId: 'user-456',
        });

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/v1/assignments/transfer', () => {
    it('should transfer asset between users', async () => {
      const asset = mockAsset({ id: 'asset-123' });
      const fromUser = mockUser({ id: 'user-456', firstName: 'John', lastName: 'Doe' });
      const toUser = mockUser({ id: 'user-789', firstName: 'Jane', lastName: 'Smith' });
      const activeAssignment = mockAssignment({
        id: 'assignment-123',
        assetId: 'asset-123',
        userId: 'user-456',
        acceptanceStatus: 'ACCEPTED',
        returnedAt: null,
      });
      const newAssignment = mockAssignment({
        assetId: 'asset-123',
        userId: 'user-789',
        acceptanceStatus: 'PENDING',
      });

      prisma.asset.findUnique.mockResolvedValue(asset);
      prisma.user.findUnique
        .mockResolvedValueOnce(toUser)
        .mockResolvedValueOnce(fromUser);
      prisma.assetAssignment.findFirst.mockResolvedValue(activeAssignment);
      prisma.assetAssignment.update.mockResolvedValue({ ...activeAssignment, returnedAt: new Date() });
      prisma.assetAssignment.create.mockResolvedValue(newAssignment);
      prisma.asset.update.mockResolvedValue(asset);

      const response = await request(app)
        .post('/api/v1/assignments/transfer')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          assetId: 'asset-123',
          fromUserId: 'user-456',
          toUserId: 'user-789',
          notes: 'Transfer requested',
        });

      expect(response.status).toBe(200);
      expect(prisma.assetAssignment.create).toHaveBeenCalled();
    });

    it('should return 404 if no active assignment found', async () => {
      const asset = mockAsset({ id: 'asset-123' });
      const fromUser = mockUser({ id: 'user-456' });
      const toUser = mockUser({ id: 'user-789' });

      prisma.asset.findUnique.mockResolvedValue(asset);
      prisma.user.findUnique
        .mockResolvedValueOnce(toUser)
        .mockResolvedValueOnce(fromUser);
      prisma.assetAssignment.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/v1/assignments/transfer')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          assetId: 'asset-123',
          fromUserId: 'user-456',
          toUserId: 'user-789',
        });

      expect(response.status).toBe(404);
    });

    it('should return 403 for unauthorized role', async () => {
      const viewerToken = generateAuthToken({ id: 'viewer-123', role: UserRole.VIEWER });

      const response = await request(app)
        .post('/api/v1/assignments/transfer')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          assetId: 'asset-123',
          fromUserId: 'user-456',
          toUserId: 'user-789',
        });

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/v1/assignments/history', () => {
    it('should get assignment history', async () => {
      const assignments = [mockAssignment(), mockAssignment()];
      prisma.assetAssignment.findMany.mockResolvedValue(assignments);
      prisma.assetAssignment.count.mockResolvedValue(2);

      const response = await request(app)
        .get('/api/v1/assignments/history')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should support filtering by assetId', async () => {
      prisma.assetAssignment.findMany.mockResolvedValue([]);
      prisma.assetAssignment.count.mockResolvedValue(0);

      const response = await request(app)
        .get('/api/v1/assignments/history?assetId=asset-123')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });

    it('should support filtering by userId', async () => {
      prisma.assetAssignment.findMany.mockResolvedValue([]);
      prisma.assetAssignment.count.mockResolvedValue(0);

      const response = await request(app)
        .get('/api/v1/assignments/history?userId=user-123')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });

    it('should support filtering by acceptanceStatus', async () => {
      prisma.assetAssignment.findMany.mockResolvedValue([]);
      prisma.assetAssignment.count.mockResolvedValue(0);

      const response = await request(app)
        .get('/api/v1/assignments/history?acceptanceStatus=PENDING')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });

    it('should allow TECHNICIAN to view history', async () => {
      const technicianToken = generateAuthToken({ id: 'tech-123', role: UserRole.TECHNICIAN });
      prisma.assetAssignment.findMany.mockResolvedValue([]);
      prisma.assetAssignment.count.mockResolvedValue(0);

      const response = await request(app)
        .get('/api/v1/assignments/history')
        .set('Authorization', `Bearer ${technicianToken}`);

      expect(response.status).toBe(200);
    });

    it('should return 403 for unauthorized role', async () => {
      const viewerToken = generateAuthToken({ id: 'viewer-123', role: UserRole.VIEWER });

      const response = await request(app)
        .get('/api/v1/assignments/history')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(response.status).toBe(403);
    });

    it('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .get('/api/v1/assignments/history');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/assignments/:id/accept', () => {
    it('should accept assignment', async () => {
      const userToken = generateAuthToken({ id: 'user-456', role: UserRole.VIEWER });
      const assignment = mockAssignment({
        id: 'assignment-123',
        userId: 'user-456',
        acceptanceStatus: 'PENDING',
      });
      const asset = mockAsset({ id: 'asset-123' });

      prisma.assetAssignment.findUnique.mockResolvedValue({
        ...assignment,
        asset,
        user: mockUser({ id: 'user-456' }),
      });
      prisma.assetAssignment.update.mockResolvedValue({
        ...assignment,
        acceptanceStatus: 'ACCEPTED',
        signature: 'signature-data',
        signedAt: new Date(),
      });
      prisma.asset.update.mockResolvedValue({ ...asset, assignedToId: 'user-456' });

      const response = await request(app)
        .post('/api/v1/assignments/assignment-123/accept')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ signature: 'signature-data' });

      expect(response.status).toBe(200);
      expect(prisma.assetAssignment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            acceptanceStatus: 'ACCEPTED',
          }),
        })
      );
    });

    it('should return 404 if assignment not found', async () => {
      const userToken = generateAuthToken({ id: 'user-456', role: UserRole.VIEWER });
      prisma.assetAssignment.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/v1/assignments/assignment-123/accept')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ signature: 'signature-data' });

      expect(response.status).toBe(404);
    });

    it('should return 403 if user is not the assignee', async () => {
      const userToken = generateAuthToken({ id: 'user-789', role: UserRole.VIEWER });
      const assignment = mockAssignment({
        id: 'assignment-123',
        userId: 'user-456',
        acceptanceStatus: 'PENDING',
      });

      prisma.assetAssignment.findUnique.mockResolvedValue({
        ...assignment,
        asset: mockAsset(),
        user: mockUser({ id: 'user-456' }),
      });

      const response = await request(app)
        .post('/api/v1/assignments/assignment-123/accept')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ signature: 'signature-data' });

      expect(response.status).toBe(403);
    });

    it('should return 400 if assignment is not pending', async () => {
      const userToken = generateAuthToken({ id: 'user-456', role: UserRole.VIEWER });
      const assignment = mockAssignment({
        id: 'assignment-123',
        userId: 'user-456',
        acceptanceStatus: 'ACCEPTED',
      });

      prisma.assetAssignment.findUnique.mockResolvedValue({
        ...assignment,
        asset: mockAsset(),
        user: mockUser({ id: 'user-456' }),
      });

      const response = await request(app)
        .post('/api/v1/assignments/assignment-123/accept')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ signature: 'signature-data' });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/v1/assignments/:id/reject', () => {
    it('should reject assignment', async () => {
      const userToken = generateAuthToken({ id: 'user-456', role: UserRole.VIEWER });
      const assignment = mockAssignment({
        id: 'assignment-123',
        userId: 'user-456',
        acceptanceStatus: 'PENDING',
        notes: 'Original notes',
      });
      const asset = mockAsset({ id: 'asset-123' });

      prisma.assetAssignment.findUnique.mockResolvedValue({
        ...assignment,
        asset,
      });
      prisma.assetAssignment.update.mockResolvedValue({
        ...assignment,
        acceptanceStatus: 'REJECTED',
        notes: 'Original notes\nRejection notes',
      });
      prisma.asset.update.mockResolvedValue({ ...asset, status: 'AVAILABLE' });

      const response = await request(app)
        .post('/api/v1/assignments/assignment-123/reject')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ notes: 'Rejection notes' });

      expect(response.status).toBe(200);
      expect(prisma.assetAssignment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            acceptanceStatus: 'REJECTED',
          }),
        })
      );
    });

    it('should return 404 if assignment not found', async () => {
      const userToken = generateAuthToken({ id: 'user-456', role: UserRole.VIEWER });
      prisma.assetAssignment.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/v1/assignments/assignment-123/reject')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ notes: 'Rejection notes' });

      expect(response.status).toBe(404);
    });

    it('should return 403 if user is not the assignee', async () => {
      const userToken = generateAuthToken({ id: 'user-789', role: UserRole.VIEWER });
      const assignment = mockAssignment({
        id: 'assignment-123',
        userId: 'user-456',
        acceptanceStatus: 'PENDING',
      });

      prisma.assetAssignment.findUnique.mockResolvedValue({
        ...assignment,
        asset: mockAsset(),
      });

      const response = await request(app)
        .post('/api/v1/assignments/assignment-123/reject')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ notes: 'Rejection notes' });

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/v1/assignments/:id/return', () => {
    it('should return asset', async () => {
      const assignment = mockAssignment({
        id: 'assignment-123',
        userId: 'user-456',
        acceptanceStatus: 'ACCEPTED',
        returnedAt: null,
        notes: 'Original notes',
      });
      const asset = mockAsset({ id: 'asset-123', status: 'ASSIGNED' });

      prisma.assetAssignment.findUnique.mockResolvedValue({
        ...assignment,
        asset,
      });
      prisma.assetAssignment.update.mockResolvedValue({
        ...assignment,
        returnedAt: new Date(),
        notes: 'Original notes\nReturn notes',
      });
      prisma.asset.update.mockResolvedValue({
        ...asset,
        status: 'AVAILABLE',
        assignedToId: null,
      });

      const response = await request(app)
        .post('/api/v1/assignments/assignment-123/return')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ notes: 'Return notes' });

      expect(response.status).toBe(200);
      expect(prisma.asset.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'AVAILABLE',
            assignedToId: null,
          }),
        })
      );
    });

    it('should return 400 if assignment is not accepted', async () => {
      const assignment = mockAssignment({
        id: 'assignment-123',
        acceptanceStatus: 'PENDING',
      });

      prisma.assetAssignment.findUnique.mockResolvedValue({
        ...assignment,
        asset: mockAsset(),
      });

      const response = await request(app)
        .post('/api/v1/assignments/assignment-123/return')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ notes: 'Return notes' });

      expect(response.status).toBe(400);
    });

    it('should return 400 if asset already returned', async () => {
      const assignment = mockAssignment({
        id: 'assignment-123',
        acceptanceStatus: 'ACCEPTED',
        returnedAt: new Date(),
      });

      prisma.assetAssignment.findUnique.mockResolvedValue({
        ...assignment,
        asset: mockAsset(),
      });

      const response = await request(app)
        .post('/api/v1/assignments/assignment-123/return')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ notes: 'Return notes' });

      expect(response.status).toBe(400);
    });

    it('should return 403 for unauthorized role', async () => {
      const viewerToken = generateAuthToken({ id: 'viewer-123', role: UserRole.VIEWER });

      const response = await request(app)
        .post('/api/v1/assignments/assignment-123/return')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ notes: 'Return notes' });

      expect(response.status).toBe(403);
    });
  });
});

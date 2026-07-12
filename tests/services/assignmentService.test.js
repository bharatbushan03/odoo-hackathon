const AssignmentService = require('../../src/services/assignmentService');
const { mockAsset, mockUser, mockAssignment, mockNotificationService } = require('../utils/testHelpers');
const ApiError = require('../../src/utils/ApiError');
const prisma = require('../../src/config/database');

describe('AssignmentService', () => {
  let service;
  let mockRepository;
  let mockNotificationSvc;

  beforeEach(() => {
    mockRepository = {
      findHistory: jest.fn(),
    };
    mockNotificationSvc = mockNotificationService;
    service = new AssignmentService(mockRepository, mockNotificationSvc, prisma);
  });

  describe('assignAsset', () => {
    it('should assign asset to user', async () => {
      const asset = mockAsset({ id: 'asset-123', status: 'AVAILABLE' });
      const user = mockUser({ id: 'user-456' });
      const assignment = mockAssignment({ assetId: 'asset-123', userId: 'user-456' });

      prisma.asset.findUnique.mockResolvedValue(asset);
      prisma.user.findUnique.mockResolvedValue(user);
      prisma.assetAssignment.create.mockResolvedValue(assignment);
      prisma.asset.update.mockResolvedValue({ ...asset, status: 'ASSIGNED' });

      const result = await service.assignAsset({
        assetId: 'asset-123',
        userId: 'user-456',
        notes: 'Test assignment',
      });

      expect(result).toEqual(assignment);
      expect(prisma.assetAssignment.create).toHaveBeenCalled();
      expect(prisma.asset.update).toHaveBeenCalledWith({
        where: { id: 'asset-123' },
        data: { status: 'ASSIGNED' },
      });
      expect(mockNotificationSvc.createNotification).toHaveBeenCalled();
    });

    it('should throw not found error if asset does not exist', async () => {
      prisma.asset.findUnique.mockResolvedValue(null);

      await expect(service.assignAsset({ assetId: 'nonexistent', userId: 'user-123' })).rejects.toThrow(ApiError);
      await expect(service.assignAsset({ assetId: 'nonexistent', userId: 'user-123' })).rejects.toThrow('not found');
    });

    it('should throw conflict error if asset is not available', async () => {
      const asset = mockAsset({ id: 'asset-123', status: 'ASSIGNED' });
      prisma.asset.findUnique.mockResolvedValue(asset);

      await expect(service.assignAsset({ assetId: 'asset-123', userId: 'user-123' })).rejects.toThrow(ApiError);
      await expect(service.assignAsset({ assetId: 'asset-123', userId: 'user-123' })).rejects.toThrow('not available');
    });

    it('should throw not found error if user does not exist', async () => {
      const asset = mockAsset({ id: 'asset-123', status: 'AVAILABLE' });
      prisma.asset.findUnique.mockResolvedValue(asset);
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.assignAsset({ assetId: 'asset-123', userId: 'nonexistent' })).rejects.toThrow(ApiError);
    });

    it('should use custom assignedAt date if provided', async () => {
      const asset = mockAsset({ id: 'asset-123', status: 'AVAILABLE' });
      const user = mockUser({ id: 'user-456' });
      const assignment = mockAssignment();
      const customDate = '2023-01-01T00:00:00.000Z';

      prisma.asset.findUnique.mockResolvedValue(asset);
      prisma.user.findUnique.mockResolvedValue(user);
      prisma.assetAssignment.create.mockResolvedValue(assignment);
      prisma.asset.update.mockResolvedValue({ ...asset, status: 'ASSIGNED' });

      await service.assignAsset({
        assetId: 'asset-123',
        userId: 'user-456',
        assignedAt: customDate,
      });

      expect(prisma.assetAssignment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            assignedAt: new Date(customDate),
          }),
        })
      );
    });
  });

  describe('acceptAssignment', () => {
    it('should accept assignment', async () => {
      const assignment = mockAssignment({
        id: 'assignment-123',
        userId: 'user-456',
        acceptanceStatus: 'PENDING',
      });
      const asset = mockAsset({ id: 'asset-123' });
      const user = mockUser({ id: 'user-456' });

      prisma.assetAssignment.findUnique.mockResolvedValue({
        ...assignment,
        asset,
        user,
      });
      prisma.assetAssignment.update.mockResolvedValue({
        ...assignment,
        acceptanceStatus: 'ACCEPTED',
        signature: 'sig',
        signedAt: new Date(),
      });
      prisma.asset.update.mockResolvedValue({ ...asset, assignedToId: 'user-456' });

      const result = await service.acceptAssignment('assignment-123', 'user-456', 'signature-data');

      expect(result.acceptanceStatus).toBe('ACCEPTED');
      expect(prisma.assetAssignment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'assignment-123' },
          data: expect.objectContaining({
            acceptanceStatus: 'ACCEPTED',
            signature: 'signature-data',
          }),
        })
      );
      expect(prisma.asset.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: expect.any(String) },
          data: { assignedToId: 'user-456' },
        })
      );
    });

    it('should throw not found error if assignment does not exist', async () => {
      prisma.assetAssignment.findUnique.mockResolvedValue(null);

      await expect(service.acceptAssignment('nonexistent', 'user-123', 'sig')).rejects.toThrow(ApiError);
    });

    it('should throw forbidden error if user is not the assignee', async () => {
      const assignment = mockAssignment({ userId: 'user-456' });
      prisma.assetAssignment.findUnique.mockResolvedValue({
        ...assignment,
        asset: mockAsset(),
        user: mockUser(),
      });

      await expect(service.acceptAssignment('assignment-123', 'user-789', 'sig')).rejects.toThrow(ApiError);
      await expect(service.acceptAssignment('assignment-123', 'user-789', 'sig')).rejects.toThrow('permission');
    });

    it('should throw bad request error if assignment is not pending', async () => {
      const assignment = mockAssignment({
        userId: 'user-456',
        acceptanceStatus: 'ACCEPTED',
      });
      prisma.assetAssignment.findUnique.mockResolvedValue({
        ...assignment,
        asset: mockAsset(),
        user: mockUser(),
      });

      await expect(service.acceptAssignment('assignment-123', 'user-456', 'sig')).rejects.toThrow(ApiError);
      await expect(service.acceptAssignment('assignment-123', 'user-456', 'sig')).rejects.toThrow('ACCEPTED');
    });
  });

  describe('rejectAssignment', () => {
    it('should reject assignment', async () => {
      const assignment = mockAssignment({
        id: 'assignment-123',
        userId: 'user-456',
        acceptanceStatus: 'PENDING',
        notes: 'Original',
      });
      const asset = mockAsset({ id: 'asset-123' });

      prisma.assetAssignment.findUnique.mockResolvedValue({
        ...assignment,
        asset,
      });
      prisma.assetAssignment.update.mockResolvedValue({
        ...assignment,
        acceptanceStatus: 'REJECTED',
        notes: 'Original\nRejection',
      });
      prisma.asset.update.mockResolvedValue({ ...asset, status: 'AVAILABLE' });

      const result = await service.rejectAssignment('assignment-123', 'user-456', 'Rejection');

      expect(result.acceptanceStatus).toBe('REJECTED');
      expect(prisma.assetAssignment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'assignment-123' },
          data: expect.objectContaining({
            acceptanceStatus: 'REJECTED',
          }),
        })
      );
      expect(prisma.asset.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: expect.any(String) },
          data: { status: 'AVAILABLE' },
        })
      );
    });

    it('should handle null notes in rejection', async () => {
      const assignment = mockAssignment({
        userId: 'user-456',
        acceptanceStatus: 'PENDING',
        notes: null,
      });
      prisma.assetAssignment.findUnique.mockResolvedValue({
        ...assignment,
        asset: mockAsset(),
      });
      prisma.assetAssignment.update.mockResolvedValue(assignment);
      prisma.asset.update.mockResolvedValue(mockAsset());

      await service.rejectAssignment('assignment-123', 'user-456', null);

      expect(prisma.assetAssignment.update).toHaveBeenCalled();
    });
  });

  describe('returnAsset', () => {
    it('should return asset', async () => {
      const assignment = mockAssignment({
        id: 'assignment-123',
        userId: 'user-456',
        acceptanceStatus: 'ACCEPTED',
        returnedAt: null,
        notes: 'Original',
      });
      const asset = mockAsset({ id: 'asset-123', status: 'ASSIGNED' });

      prisma.assetAssignment.findUnique.mockResolvedValue({
        ...assignment,
        asset,
      });
      prisma.assetAssignment.update.mockResolvedValue({
        ...assignment,
        returnedAt: new Date(),
        notes: 'Original\nReturn',
      });
      prisma.asset.update.mockResolvedValue({
        ...asset,
        status: 'AVAILABLE',
        assignedToId: null,
      });

      const result = await service.returnAsset('assignment-123', { notes: 'Return' });

      expect(result.returnedAt).toBeDefined();
      expect(prisma.assetAssignment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'assignment-123' },
          data: expect.objectContaining({
            returnedAt: expect.any(Date),
          }),
        })
      );
      expect(prisma.asset.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: expect.any(String) },
          data: {
            status: 'AVAILABLE',
            assignedToId: null,
          },
        })
      );
    });

    it('should throw bad request error if assignment is not accepted', async () => {
      const assignment = mockAssignment({
        acceptanceStatus: 'PENDING',
      });
      prisma.assetAssignment.findUnique.mockResolvedValue({
        ...assignment,
        asset: mockAsset(),
      });

      await expect(service.returnAsset('assignment-123', {})).rejects.toThrow(ApiError);
      await expect(service.returnAsset('assignment-123', {})).rejects.toThrow('accepted');
    });

    it('should throw bad request error if asset already returned', async () => {
      const assignment = mockAssignment({
        acceptanceStatus: 'ACCEPTED',
        returnedAt: new Date(),
      });
      prisma.assetAssignment.findUnique.mockResolvedValue({
        ...assignment,
        asset: mockAsset(),
      });

      await expect(service.returnAsset('assignment-123', {})).rejects.toThrow(ApiError);
      await expect(service.returnAsset('assignment-123', {})).rejects.toThrow('Asset has already been returned');
    });
  });

  describe('transferAsset', () => {
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

      const result = await service.transferAsset({
        assetId: 'asset-123',
        fromUserId: 'user-456',
        toUserId: 'user-789',
      });

      expect(result).toEqual(newAssignment);
      expect(prisma.assetAssignment.create).toHaveBeenCalled();
      expect(mockNotificationSvc.createNotification).toHaveBeenCalledTimes(2);
    });

    it('should throw not found error if no active assignment exists', async () => {
      const asset = mockAsset();
      const fromUser = mockUser();
      const toUser = mockUser();

      prisma.asset.findUnique.mockResolvedValue(asset);
      prisma.user.findUnique
        .mockResolvedValueOnce(toUser)
        .mockResolvedValueOnce(fromUser);
      prisma.assetAssignment.findFirst.mockResolvedValue(null);

      await expect(service.transferAsset({
        assetId: 'asset-123',
        fromUserId: 'user-456',
        toUserId: 'user-789',
      })).rejects.toThrow(ApiError);
    });
  });

  describe('getHistory', () => {
    it('should get assignment history', async () => {
      const mockResult = {
        data: [mockAssignment()],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
      };

      mockRepository.findHistory.mockResolvedValue(mockResult);

      const result = await service.getHistory({ page: 1, limit: 10 });

      expect(result).toEqual(mockResult);
      expect(mockRepository.findHistory).toHaveBeenCalledWith({ page: 1, limit: 10 });
    });
  });
});

const AssignmentRepository = require('../../src/repositories/assignmentRepository');
const { mockAssignment } = require('../utils/testHelpers');
const prisma = require('../../src/config/database');

describe('AssignmentRepository', () => {
  let repository;

  beforeEach(() => {
    repository = new AssignmentRepository();
  });

  describe('findHistory', () => {
    it('should find assignment history with pagination', async () => {
      const mockAssignments = [mockAssignment(), mockAssignment()];
      prisma.assetAssignment.findMany.mockResolvedValue(mockAssignments);
      prisma.assetAssignment.count.mockResolvedValue(2);

      const result = await repository.findHistory({
        page: 1,
        limit: 10,
      });

      expect(result.data).toEqual(mockAssignments);
      expect(result.meta.total).toBe(2);
      expect(prisma.assetAssignment.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          asset: true,
          user: true,
        },
      });
    });

    it('should filter by assetId', async () => {
      prisma.assetAssignment.findMany.mockResolvedValue([]);
      prisma.assetAssignment.count.mockResolvedValue(0);

      await repository.findHistory({
        assetId: 'asset-123',
      });

      expect(prisma.assetAssignment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            assetId: 'asset-123',
          }),
        })
      );
    });

    it('should filter by userId', async () => {
      prisma.assetAssignment.findMany.mockResolvedValue([]);
      prisma.assetAssignment.count.mockResolvedValue(0);

      await repository.findHistory({
        userId: 'user-123',
      });

      expect(prisma.assetAssignment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-123',
          }),
        })
      );
    });

    it('should filter by acceptanceStatus', async () => {
      prisma.assetAssignment.findMany.mockResolvedValue([]);
      prisma.assetAssignment.count.mockResolvedValue(0);

      await repository.findHistory({
        acceptanceStatus: 'ACCEPTED',
      });

      expect(prisma.assetAssignment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            acceptanceStatus: 'ACCEPTED',
          }),
        })
      );
    });

    it('should apply multiple filters', async () => {
      prisma.assetAssignment.findMany.mockResolvedValue([]);
      prisma.assetAssignment.count.mockResolvedValue(0);

      await repository.findHistory({
        assetId: 'asset-123',
        userId: 'user-123',
        acceptanceStatus: 'PENDING',
      });

      expect(prisma.assetAssignment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            assetId: 'asset-123',
            userId: 'user-123',
            acceptanceStatus: 'PENDING',
          }),
        })
      );
    });

    it('should order by createdAt desc by default', async () => {
      prisma.assetAssignment.findMany.mockResolvedValue([]);
      prisma.assetAssignment.count.mockResolvedValue(0);

      await repository.findHistory({});

      expect(prisma.assetAssignment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        })
      );
    });

    it('should include asset and user relations', async () => {
      prisma.assetAssignment.findMany.mockResolvedValue([]);
      prisma.assetAssignment.count.mockResolvedValue(0);

      await repository.findHistory({});

      expect(prisma.assetAssignment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            asset: true,
            user: true,
          }),
        })
      );
    });
  });

  describe('findActiveAssignment', () => {
    it('should find active assignment for an asset', async () => {
      const mockAssignmentData = {
        ...mockAssignment(),
        asset: { id: 'asset-123', name: 'Test Asset' },
        user: { id: 'user-123', firstName: 'John', lastName: 'Doe' },
      };
      prisma.assetAssignment.findFirst.mockResolvedValue(mockAssignmentData);

      const result = await repository.findActiveAssignment('asset-123');

      expect(result).toEqual(mockAssignmentData);
      expect(prisma.assetAssignment.findFirst).toHaveBeenCalledWith({
        where: {
          assetId: 'asset-123',
          returnedAt: null,
          acceptanceStatus: {
            in: ['PENDING', 'ACCEPTED'],
          },
        },
        include: {
          asset: true,
          user: true,
        },
      });
    });

    it('should return null if no active assignment found', async () => {
      prisma.assetAssignment.findFirst.mockResolvedValue(null);

      const result = await repository.findActiveAssignment('asset-123');

      expect(result).toBeNull();
    });
  });
});

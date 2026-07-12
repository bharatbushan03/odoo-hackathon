const DashboardRepository = require('../../src/repositories/dashboardRepository');
const { mockAsset, mockDepartment, mockAssignment, mockMaintenance } = require('../utils/testHelpers');
const prisma = require('../../src/config/database');

describe('DashboardRepository', () => {
  let repository;

  beforeEach(() => {
    repository = new DashboardRepository();
  });

  describe('getDashboardRawData', () => {
    it('should fetch all dashboard data in parallel', async () => {
      const mockData = {
        totalAssets: 100,
        assetsByCategory: [
          { category: 'HARDWARE', _count: { id: 50 } },
          { category: 'SOFTWARE', _count: { id: 30 } },
        ],
        assetsByDepartment: [
          { departmentId: 'dept-1', _count: { id: 40 } },
        ],
        assetsByLocation: [
          { location: 'Office A', _count: { id: 60 } },
        ],
        underMaintenanceCount: 10,
        warrantyExpiringCount: 5,
        allPurchases: [
          mockAsset({ purchaseDate: new Date(), purchaseCost: 1000 }),
        ],
        topVendors: [
          { vendorName: 'Vendor A', _sum: { cost: 5000 } },
        ],
        recentAssignments: [
          { ...mockAssignment(), asset: mockAsset(), user: { firstName: 'John', lastName: 'Doe' } },
        ],
        recentMaintenance: [
          { ...mockMaintenance(), asset: mockAsset(), performedBy: { firstName: 'Jane', lastName: 'Smith' } },
        ],
        departments: [
          mockDepartment({ id: 'dept-1', name: 'IT', code: 'IT' }),
        ],
      };

      prisma.asset.count.mockResolvedValueOnce(mockData.totalAssets);
      prisma.asset.groupBy
        .mockResolvedValueOnce(mockData.assetsByCategory)
        .mockResolvedValueOnce(mockData.assetsByDepartment)
        .mockResolvedValueOnce(mockData.assetsByLocation);
      prisma.asset.count
        .mockResolvedValueOnce(mockData.underMaintenanceCount)
        .mockResolvedValueOnce(mockData.warrantyExpiringCount);
      prisma.asset.findMany.mockResolvedValue(mockData.allPurchases);
      prisma.maintenanceRecord.groupBy.mockResolvedValue(mockData.topVendors);
      prisma.assetAssignment.findMany.mockResolvedValue(mockData.recentAssignments);
      prisma.maintenanceRecord.findMany.mockResolvedValue(mockData.recentMaintenance);
      prisma.department.findMany.mockResolvedValue(mockData.departments);

      const result = await repository.getDashboardRawData();

      expect(result.totalAssets).toBe(mockData.totalAssets);
      expect(result.assetsByCategory).toEqual(mockData.assetsByCategory);
      expect(result.underMaintenanceCount).toBe(mockData.underMaintenanceCount);
      expect(result.warrantyExpiringCount).toBe(mockData.warrantyExpiringCount);
      expect(prisma.asset.count).toHaveBeenCalledTimes(3);
      expect(prisma.asset.groupBy).toHaveBeenCalledTimes(3);
      expect(prisma.asset.findMany).toHaveBeenCalledTimes(1);
      expect(prisma.maintenanceRecord.groupBy).toHaveBeenCalledTimes(1);
      expect(prisma.assetAssignment.findMany).toHaveBeenCalledTimes(1);
      expect(prisma.maintenanceRecord.findMany).toHaveBeenCalledTimes(1);
      expect(prisma.department.findMany).toHaveBeenCalledTimes(1);
    });

    it('should handle empty data', async () => {
      prisma.asset.count.mockResolvedValue(0);
      prisma.asset.groupBy.mockResolvedValue([]);
      prisma.asset.count.mockResolvedValue(0);
      prisma.asset.findMany.mockResolvedValue([]);
      prisma.maintenanceRecord.groupBy.mockResolvedValue([]);
      prisma.assetAssignment.findMany.mockResolvedValue([]);
      prisma.maintenanceRecord.findMany.mockResolvedValue([]);
      prisma.department.findMany.mockResolvedValue([]);

      const result = await repository.getDashboardRawData();

      expect(result.totalAssets).toBe(0);
      expect(result.assetsByCategory).toEqual([]);
      expect(result.assetsByDepartment).toEqual([]);
      expect(result.assetsByLocation).toEqual([]);
      expect(result.underMaintenanceCount).toBe(0);
      expect(result.warrantyExpiringCount).toBe(0);
      expect(result.allPurchases).toEqual([]);
      expect(result.topVendors).toEqual([]);
      expect(result.recentAssignments).toEqual([]);
      expect(result.recentMaintenance).toEqual([]);
      expect(result.departments).toEqual([]);
    });

    it('should filter assets with purchase cost and date', async () => {
      prisma.asset.count.mockResolvedValue(0);
      prisma.asset.groupBy.mockResolvedValue([]);
      prisma.asset.count.mockResolvedValue(0);
      prisma.asset.findMany.mockResolvedValue([]);
      prisma.maintenanceRecord.groupBy.mockResolvedValue([]);
      prisma.assetAssignment.findMany.mockResolvedValue([]);
      prisma.maintenanceRecord.findMany.mockResolvedValue([]);
      prisma.department.findMany.mockResolvedValue([]);

      await repository.getDashboardRawData();

      expect(prisma.asset.findMany).toHaveBeenCalledWith({
        select: {
          purchaseDate: true,
          purchaseCost: true,
        },
        where: {
          purchaseCost: { not: null },
          purchaseDate: { not: null },
        },
      });
    });

    it('should filter maintenance records for top vendors', async () => {
      prisma.asset.count.mockResolvedValue(0);
      prisma.asset.groupBy.mockResolvedValue([]);
      prisma.asset.count.mockResolvedValue(0);
      prisma.asset.findMany.mockResolvedValue([]);
      prisma.maintenanceRecord.groupBy.mockResolvedValue([]);
      prisma.assetAssignment.findMany.mockResolvedValue([]);
      prisma.maintenanceRecord.findMany.mockResolvedValue([]);
      prisma.department.findMany.mockResolvedValue([]);

      await repository.getDashboardRawData();

      expect(prisma.maintenanceRecord.groupBy).toHaveBeenCalledWith({
        by: ['vendorName'],
        _sum: {
          cost: true,
        },
        where: {
          vendorName: { not: null, notIn: [''] },
          cost: { not: null },
        },
        orderBy: {
          _sum: {
            cost: 'desc',
          },
        },
        take: 5,
      });
    });

    it('should fetch recent assignments with specific fields', async () => {
      prisma.asset.count.mockResolvedValue(0);
      prisma.asset.groupBy.mockResolvedValue([]);
      prisma.asset.count.mockResolvedValue(0);
      prisma.asset.findMany.mockResolvedValue([]);
      prisma.maintenanceRecord.groupBy.mockResolvedValue([]);
      prisma.assetAssignment.findMany.mockResolvedValue([]);
      prisma.maintenanceRecord.findMany.mockResolvedValue([]);
      prisma.department.findMany.mockResolvedValue([]);

      await repository.getDashboardRawData();

      expect(prisma.assetAssignment.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          asset: { select: { name: true, assetTag: true } },
          user: { select: { firstName: true, lastName: true } },
        },
      });
    });

    it('should fetch recent maintenance with specific fields', async () => {
      prisma.asset.count.mockResolvedValue(0);
      prisma.asset.groupBy.mockResolvedValue([]);
      prisma.asset.count.mockResolvedValue(0);
      prisma.asset.findMany.mockResolvedValue([]);
      prisma.maintenanceRecord.groupBy.mockResolvedValue([]);
      prisma.assetAssignment.findMany.mockResolvedValue([]);
      prisma.maintenanceRecord.findMany.mockResolvedValue([]);
      prisma.department.findMany.mockResolvedValue([]);

      await repository.getDashboardRawData();

      expect(prisma.maintenanceRecord.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          asset: { select: { name: true, assetTag: true } },
          performedBy: { select: { firstName: true, lastName: true } },
        },
      });
    });

    it('should fetch departments with specific fields', async () => {
      prisma.asset.count.mockResolvedValue(0);
      prisma.asset.groupBy.mockResolvedValue([]);
      prisma.asset.count.mockResolvedValue(0);
      prisma.asset.findMany.mockResolvedValue([]);
      prisma.maintenanceRecord.groupBy.mockResolvedValue([]);
      prisma.assetAssignment.findMany.mockResolvedValue([]);
      prisma.maintenanceRecord.findMany.mockResolvedValue([]);
      prisma.department.findMany.mockResolvedValue([]);

      await repository.getDashboardRawData();

      expect(prisma.department.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          name: true,
          code: true,
        },
      });
    });

    it('should count assets under maintenance correctly', async () => {
      prisma.asset.count.mockResolvedValueOnce(0);
      prisma.asset.groupBy.mockResolvedValue([]);
      prisma.asset.count.mockResolvedValueOnce(15);
      prisma.asset.count.mockResolvedValueOnce(0);
      prisma.asset.findMany.mockResolvedValue([]);
      prisma.maintenanceRecord.groupBy.mockResolvedValue([]);
      prisma.assetAssignment.findMany.mockResolvedValue([]);
      prisma.maintenanceRecord.findMany.mockResolvedValue([]);
      prisma.department.findMany.mockResolvedValue([]);

      const result = await repository.getDashboardRawData();

      expect(result.underMaintenanceCount).toBe(15);
      expect(prisma.asset.count).toHaveBeenCalledWith({
        where: { status: 'UNDER_MAINTENANCE' },
      });
    });

    it('should count warranty expiring assets within date range', async () => {
      prisma.asset.count.mockResolvedValueOnce(0);
      prisma.asset.groupBy.mockResolvedValue([]);
      prisma.asset.count.mockResolvedValueOnce(0);
      prisma.asset.count.mockResolvedValueOnce(8);
      prisma.asset.findMany.mockResolvedValue([]);
      prisma.maintenanceRecord.groupBy.mockResolvedValue([]);
      prisma.assetAssignment.findMany.mockResolvedValue([]);
      prisma.maintenanceRecord.findMany.mockResolvedValue([]);
      prisma.department.findMany.mockResolvedValue([]);

      const result = await repository.getDashboardRawData();

      expect(result.warrantyExpiringCount).toBe(8);
      expect(prisma.asset.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            warrantyExpiry: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        })
      );
    });
  });
});

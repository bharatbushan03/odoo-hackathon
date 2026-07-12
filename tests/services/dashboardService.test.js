const DashboardService = require('../../src/services/dashboardService');
const { mockAsset, mockDepartment, mockAssignment, mockMaintenance } = require('../utils/testHelpers');

describe('DashboardService', () => {
  let service;
  let mockRepository;

  beforeEach(() => {
    mockRepository = {
      getDashboardRawData: jest.fn(),
    };
    service = new DashboardService(mockRepository);
  });

  describe('getSummary', () => {
    it('should process dashboard data correctly', async () => {
      const now = new Date();
      const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      const mockRawData = {
        totalAssets: 100,
        assetsByCategory: [
          { category: 'HARDWARE', _count: { id: 50 } },
          { category: 'SOFTWARE', _count: { id: 30 } },
          { category: 'VEHICLE', _count: { id: 20 } },
        ],
        assetsByDepartment: [
          { departmentId: 'dept-1', _count: { id: 40 } },
          { departmentId: 'dept-2', _count: { id: 60 } },
        ],
        assetsByLocation: [
          { location: 'Office A', _count: { id: 60 } },
          { location: 'Office B', _count: { id: 40 } },
        ],
        underMaintenanceCount: 10,
        warrantyExpiringCount: 5,
        allPurchases: [
          mockAsset({
            purchaseDate: oneMonthAgo,
            purchaseCost: 1000.00,
          }),
        ],
        topVendors: [
          { vendorName: 'Vendor A', _sum: { cost: 5000.00 } },
        ],
        recentAssignments: [
          {
            ...mockAssignment({ createdAt: now }),
            asset: mockAsset({ name: 'Laptop', assetTag: 'AST001' }),
            user: { firstName: 'John', lastName: 'Doe' },
          },
        ],
        recentMaintenance: [
          {
            ...mockMaintenance({ createdAt: now }),
            asset: mockAsset({ name: 'Server', assetTag: 'AST002' }),
            performedBy: { firstName: 'Jane', lastName: 'Smith' },
          },
        ],
        departments: [
          mockDepartment({ id: 'dept-1', name: 'IT', code: 'IT' }),
          mockDepartment({ id: 'dept-2', name: 'HR', code: 'HR' }),
        ],
      };

      mockRepository.getDashboardRawData.mockResolvedValue(mockRawData);

      const result = await service.getSummary();

      expect(result.totalAssets).toBe(100);
      expect(result.assetsUnderMaintenance).toBe(10);
      expect(result.warrantyExpiring).toBe(5);
      expect(result.assetsByCategory).toHaveLength(3);
      expect(result.assetsByCategory[0]).toEqual({
        category: 'HARDWARE',
        count: 50,
      });
      expect(result.assetsByDepartment).toHaveLength(2);
      expect(result.assetsByDepartment[0]).toEqual({
        departmentName: 'IT',
        departmentCode: 'IT',
        count: 40,
      });
      expect(result.assetsByLocation).toHaveLength(2);
      expect(result.assetsByLocation[0]).toEqual({
        location: 'Office A',
        count: 60,
      });
      expect(result.monthlyPurchases).toHaveLength(12);
      expect(result.depreciationSummary).toBeDefined();
      expect(result.topVendors).toHaveLength(1);
      expect(result.topVendors[0]).toEqual({
        vendorName: 'Vendor A',
        totalSpend: 5000.00,
      });
      expect(result.recentActivities).toHaveLength(2);
    });

    it('should handle assets without department assignment', async () => {
      const mockRawData = {
        totalAssets: 0,
        assetsByCategory: [],
        assetsByDepartment: [
          { departmentId: null, _count: { id: 10 } },
        ],
        assetsByLocation: [],
        underMaintenanceCount: 0,
        warrantyExpiringCount: 0,
        allPurchases: [],
        topVendors: [],
        recentAssignments: [],
        recentMaintenance: [],
        departments: [],
      };

      mockRepository.getDashboardRawData.mockResolvedValue(mockRawData);

      const result = await service.getSummary();

      expect(result.assetsByDepartment[0]).toEqual({
        departmentName: 'Unassigned',
        departmentCode: 'N/A',
        count: 10,
      });
    });

    it('should handle assets without location', async () => {
      const mockRawData = {
        totalAssets: 0,
        assetsByCategory: [],
        assetsByDepartment: [],
        assetsByLocation: [
          { location: null, _count: { id: 5 } },
        ],
        underMaintenanceCount: 0,
        warrantyExpiringCount: 0,
        allPurchases: [],
        topVendors: [],
        recentAssignments: [],
        recentMaintenance: [],
        departments: [],
      };

      mockRepository.getDashboardRawData.mockResolvedValue(mockRawData);

      const result = await service.getSummary();

      expect(result.assetsByLocation[0]).toEqual({
        location: 'Unknown',
        count: 5,
      });
    });

    it('should calculate depreciation correctly', async () => {
      const now = new Date();
      const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

      const mockRawData = {
        totalAssets: 1,
        assetsByCategory: [],
        assetsByDepartment: [],
        assetsByLocation: [],
        underMaintenanceCount: 0,
        warrantyExpiringCount: 0,
        allPurchases: [
          mockAsset({
            purchaseDate: oneYearAgo,
            purchaseCost: 12000.00,
          }),
        ],
        topVendors: [],
        recentAssignments: [],
        recentMaintenance: [],
        departments: [],
      };

      mockRepository.getDashboardRawData.mockResolvedValue(mockRawData);

      const result = await service.getSummary();

      expect(result.depreciationSummary.totalOriginalCost).toBe(12000.00);
      expect(result.depreciationSummary.totalCurrentValue).toBeGreaterThan(0);
      expect(result.depreciationSummary.totalDepreciated).toBeGreaterThan(0);
      expect(result.depreciationSummary.totalDepreciated).toBeLessThan(12000.00);
    });

    it('should handle fully depreciated assets', async () => {
      const now = new Date();
      const sixYearsAgo = new Date(now.getFullYear() - 6, now.getMonth(), now.getDate());

      const mockRawData = {
        totalAssets: 1,
        assetsByCategory: [],
        assetsByDepartment: [],
        assetsByLocation: [],
        underMaintenanceCount: 0,
        warrantyExpiringCount: 0,
        allPurchases: [
          mockAsset({
            purchaseDate: sixYearsAgo,
            purchaseCost: 12000.00,
          }),
        ],
        topVendors: [],
        recentAssignments: [],
        recentMaintenance: [],
        departments: [],
      };

      mockRepository.getDashboardRawData.mockResolvedValue(mockRawData);

      const result = await service.getSummary();

      expect(result.depreciationSummary.totalCurrentValue).toBe(0);
      expect(result.depreciationSummary.totalDepreciated).toBe(12000.00);
    });

    it('should handle future purchase dates', async () => {
      const now = new Date();
      const futureDate = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

      const mockRawData = {
        totalAssets: 1,
        assetsByCategory: [],
        assetsByDepartment: [],
        assetsByLocation: [],
        underMaintenanceCount: 0,
        warrantyExpiringCount: 0,
        allPurchases: [
          mockAsset({
            purchaseDate: futureDate,
            purchaseCost: 12000.00,
          }),
        ],
        topVendors: [],
        recentAssignments: [],
        recentMaintenance: [],
        departments: [],
      };

      mockRepository.getDashboardRawData.mockResolvedValue(mockRawData);

      const result = await service.getSummary();

      expect(result.depreciationSummary.totalCurrentValue).toBe(12000.00);
      expect(result.depreciationSummary.totalDepreciated).toBe(0);
    });

    it('should generate 12 months of purchase data', async () => {
      const mockRawData = {
        totalAssets: 0,
        assetsByCategory: [],
        assetsByDepartment: [],
        assetsByLocation: [],
        underMaintenanceCount: 0,
        warrantyExpiringCount: 0,
        allPurchases: [],
        topVendors: [],
        recentAssignments: [],
        recentMaintenance: [],
        departments: [],
      };

      mockRepository.getDashboardRawData.mockResolvedValue(mockRawData);

      const result = await service.getSummary();

      expect(result.monthlyPurchases).toHaveLength(12);
      result.monthlyPurchases.forEach((month) => {
        expect(month).toHaveProperty('month');
        expect(month).toHaveProperty('totalCost');
        expect(month).toHaveProperty('count');
      });
    });

    it('should sort recent activities by timestamp', async () => {
      const now = new Date();
      const older = new Date(now.getTime() - 100000);

      const mockRawData = {
        totalAssets: 0,
        assetsByCategory: [],
        assetsByDepartment: [],
        assetsByLocation: [],
        underMaintenanceCount: 0,
        warrantyExpiringCount: 0,
        allPurchases: [],
        topVendors: [],
        recentAssignments: [
          {
            ...mockAssignment({ createdAt: older }),
            asset: mockAsset({ name: 'Old Asset', assetTag: 'AST001' }),
            user: { firstName: 'John', lastName: 'Doe' },
          },
          {
            ...mockAssignment({ createdAt: now }),
            asset: mockAsset({ name: 'New Asset', assetTag: 'AST002' }),
            user: { firstName: 'Jane', lastName: 'Smith' },
          },
        ],
        recentMaintenance: [],
        departments: [],
      };

      mockRepository.getDashboardRawData.mockResolvedValue(mockRawData);

      const result = await service.getSummary();

      expect(result.recentActivities[0].description).toContain('New Asset');
      expect(result.recentActivities[1].description).toContain('Old Asset');
    });

    it('should limit recent activities to 10', async () => {
      const mockRawData = {
        totalAssets: 0,
        assetsByCategory: [],
        assetsByDepartment: [],
        assetsByLocation: [],
        underMaintenanceCount: 0,
        warrantyExpiringCount: 0,
        allPurchases: [],
        topVendors: [],
        recentAssignments: Array.from({ length: 15 }, (_, i) => ({
          ...mockAssignment(),
          asset: mockAsset({ name: `Asset ${i}`, assetTag: `AST${i}` }),
          user: { firstName: 'User', lastName: `${i}` },
        })),
        recentMaintenance: [],
        departments: [],
      };

      mockRepository.getDashboardRawData.mockResolvedValue(mockRawData);

      const result = await service.getSummary();

      expect(result.recentActivities).toHaveLength(10);
    });

    it('should handle maintenance without performedBy', async () => {
      const mockRawData = {
        totalAssets: 0,
        assetsByCategory: [],
        assetsByDepartment: [],
        assetsByLocation: [],
        underMaintenanceCount: 0,
        warrantyExpiringCount: 0,
        allPurchases: [],
        topVendors: [],
        recentAssignments: [],
        recentMaintenance: [
          {
            ...mockMaintenance(),
            asset: mockAsset({ name: 'Server', assetTag: 'AST001' }),
            performedBy: null,
          },
        ],
        departments: [],
      };

      mockRepository.getDashboardRawData.mockResolvedValue(mockRawData);

      const result = await service.getSummary();

      expect(result.recentActivities[0].description).toContain('external vendor');
    });

    it('should handle null costs in top vendors', async () => {
      const mockRawData = {
        totalAssets: 0,
        assetsByCategory: [],
        assetsByDepartment: [],
        assetsByLocation: [],
        underMaintenanceCount: 0,
        warrantyExpiringCount: 0,
        allPurchases: [],
        topVendors: [
          { vendorName: 'Vendor A', _sum: { cost: null } },
        ],
        recentAssignments: [],
        recentMaintenance: [],
        departments: [],
      };

      mockRepository.getDashboardRawData.mockResolvedValue(mockRawData);

      const result = await service.getSummary();

      expect(result.topVendors[0].totalSpend).toBe(0);
    });
  });
});

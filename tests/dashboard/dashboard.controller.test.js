const request = require('supertest');
const { generateAuthToken, mockAsset, mockDepartment, mockAssignment, mockMaintenance } = require('../utils/testHelpers');
const prisma = require('../../src/config/database');
const { UserRole } = require('../../src/constants');

describe('Dashboard Controller', () => {
  let app;
  let authToken;

  beforeAll(() => {
    app = require('../utils/testApp');
    authToken = generateAuthToken({ id: 'user-123', role: UserRole.SUPER_ADMIN });
  });

  describe('GET /api/v1/dashboard', () => {
    it('should get dashboard summary with all data', async () => {
      const mockDashboardData = {
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
            purchaseDate: new Date('2023-01-01'),
            purchaseCost: 1000.00,
          }),
          mockAsset({
            purchaseDate: new Date('2023-06-01'),
            purchaseCost: 2000.00,
          }),
        ],
        topVendors: [
          { vendorName: 'Vendor A', _sum: { cost: 5000.00 } },
          { vendorName: 'Vendor B', _sum: { cost: 3000.00 } },
        ],
        recentAssignments: [
          {
            ...mockAssignment(),
            asset: mockAsset({ name: 'Laptop', assetTag: 'AST001' }),
            user: { firstName: 'John', lastName: 'Doe' },
          },
        ],
        recentMaintenance: [
          {
            ...mockMaintenance(),
            asset: mockAsset({ name: 'Server', assetTag: 'AST002' }),
            performedBy: { firstName: 'Jane', lastName: 'Smith' },
          },
        ],
        departments: [
          mockDepartment({ id: 'dept-1', name: 'IT', code: 'IT' }),
          mockDepartment({ id: 'dept-2', name: 'HR', code: 'HR' }),
        ],
      };

      prisma.asset.count.mockResolvedValue(mockDashboardData.totalAssets);
      prisma.asset.groupBy
        .mockResolvedValueOnce(mockDashboardData.assetsByCategory)
        .mockResolvedValueOnce(mockDashboardData.assetsByDepartment)
        .mockResolvedValueOnce(mockDashboardData.assetsByLocation);
      prisma.asset.count
        .mockResolvedValueOnce(mockDashboardData.underMaintenanceCount)
        .mockResolvedValueOnce(mockDashboardData.warrantyExpiringCount);
      prisma.asset.findMany.mockResolvedValue(mockDashboardData.allPurchases);
      prisma.maintenanceRecord.groupBy.mockResolvedValue(mockDashboardData.topVendors);
      prisma.assetAssignment.findMany.mockResolvedValue(mockDashboardData.recentAssignments);
      prisma.maintenanceRecord.findMany.mockResolvedValue(mockDashboardData.recentMaintenance);
      prisma.department.findMany.mockResolvedValue(mockDashboardData.departments);

      const response = await request(app)
        .get('/api/v1/dashboard')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.totalAssets).toBe(100);
      expect(response.body.data.assetsUnderMaintenance).toBe(10);
      expect(response.body.data.warrantyExpiring).toBe(5);
      expect(response.body.data.assetsByCategory).toHaveLength(3);
      expect(response.body.data.assetsByDepartment).toHaveLength(2);
      expect(response.body.data.assetsByLocation).toHaveLength(2);
      expect(response.body.data.monthlyPurchases).toBeDefined();
      expect(response.body.data.depreciationSummary).toBeDefined();
      expect(response.body.data.topVendors).toHaveLength(2);
      expect(response.body.data.recentActivities).toBeDefined();
    });

    it('should handle empty data gracefully', async () => {
      prisma.asset.count.mockResolvedValue(0);
      prisma.asset.groupBy
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      prisma.asset.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      prisma.asset.findMany.mockResolvedValue([]);
      prisma.maintenanceRecord.groupBy.mockResolvedValue([]);
      prisma.assetAssignment.findMany.mockResolvedValue([]);
      prisma.maintenanceRecord.findMany.mockResolvedValue([]);
      prisma.department.findMany.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/v1/dashboard')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.totalAssets).toBe(0);
      expect(response.body.data.assetsByCategory).toEqual([]);
      expect(response.body.data.assetsByDepartment).toEqual([]);
      expect(response.body.data.assetsByLocation).toEqual([]);
      expect(response.body.data.monthlyPurchases).toHaveLength(12);
      expect(response.body.data.topVendors).toEqual([]);
      expect(response.body.data.recentActivities).toEqual([]);
    });

    it('should calculate depreciation correctly', async () => {
      const now = new Date();
      const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      const threeYearsAgo = new Date(now.getFullYear() - 3, now.getMonth(), now.getDate());

      const mockDashboardData = {
        totalAssets: 2,
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
          mockAsset({
            purchaseDate: threeYearsAgo,
            purchaseCost: 12000.00,
          }),
        ],
        topVendors: [],
        recentAssignments: [],
        recentMaintenance: [],
        departments: [],
      };

      prisma.asset.count.mockResolvedValue(mockDashboardData.totalAssets);
      prisma.asset.groupBy
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      prisma.asset.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      prisma.asset.findMany.mockResolvedValue(mockDashboardData.allPurchases);
      prisma.maintenanceRecord.groupBy.mockResolvedValue([]);
      prisma.assetAssignment.findMany.mockResolvedValue([]);
      prisma.maintenanceRecord.findMany.mockResolvedValue([]);
      prisma.department.findMany.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/v1/dashboard')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.depreciationSummary).toBeDefined();
      expect(response.body.data.depreciationSummary.totalOriginalCost).toBe(24000.00);
      expect(response.body.data.depreciationSummary.totalCurrentValue).toBeGreaterThan(0);
      expect(response.body.data.depreciationSummary.totalDepreciated).toBeGreaterThan(0);
    });

    it('should handle assets without purchase cost or date', async () => {
      const mockDashboardData = {
        totalAssets: 2,
        assetsByCategory: [],
        assetsByDepartment: [],
        assetsByLocation: [],
        underMaintenanceCount: 0,
        warrantyExpiringCount: 0,
        allPurchases: [
          mockAsset({
            purchaseDate: null,
            purchaseCost: null,
          }),
          mockAsset({
            purchaseDate: new Date(),
            purchaseCost: null,
          }),
        ],
        topVendors: [],
        recentAssignments: [],
        recentMaintenance: [],
        departments: [],
      };

      prisma.asset.count.mockResolvedValue(mockDashboardData.totalAssets);
      prisma.asset.groupBy
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      prisma.asset.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      prisma.asset.findMany.mockResolvedValue(mockDashboardData.allPurchases);
      prisma.maintenanceRecord.groupBy.mockResolvedValue([]);
      prisma.assetAssignment.findMany.mockResolvedValue([]);
      prisma.maintenanceRecord.findMany.mockResolvedValue([]);
      prisma.department.findMany.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/v1/dashboard')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.depreciationSummary.totalOriginalCost).toBe(0);
    });

    it('should generate monthly purchases for last 12 months', async () => {
      const mockDashboardData = {
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

      prisma.asset.count.mockResolvedValue(mockDashboardData.totalAssets);
      prisma.asset.groupBy
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      prisma.asset.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      prisma.asset.findMany.mockResolvedValue(mockDashboardData.allPurchases);
      prisma.maintenanceRecord.groupBy.mockResolvedValue([]);
      prisma.assetAssignment.findMany.mockResolvedValue([]);
      prisma.maintenanceRecord.findMany.mockResolvedValue([]);
      prisma.department.findMany.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/v1/dashboard')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.monthlyPurchases).toHaveLength(12);
      expect(response.body.data.monthlyPurchases[0].month).toBeDefined();
      expect(response.body.data.monthlyPurchases[0].totalCost).toBe(0);
      expect(response.body.data.monthlyPurchases[0].count).toBe(0);
    });

    it('should handle assets without department assignment', async () => {
      const mockDashboardData = {
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

      prisma.asset.count.mockResolvedValue(mockDashboardData.totalAssets);
      prisma.asset.groupBy
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(mockDashboardData.assetsByDepartment)
        .mockResolvedValueOnce([]);
      prisma.asset.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      prisma.asset.findMany.mockResolvedValue(mockDashboardData.allPurchases);
      prisma.maintenanceRecord.groupBy.mockResolvedValue([]);
      prisma.assetAssignment.findMany.mockResolvedValue([]);
      prisma.maintenanceRecord.findMany.mockResolvedValue([]);
      prisma.department.findMany.mockResolvedValue(mockDashboardData.departments);

      const response = await request(app)
        .get('/api/v1/dashboard')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.assetsByDepartment).toHaveLength(1);
      expect(response.body.data.assetsByDepartment[0].departmentName).toBe('Unassigned');
      expect(response.body.data.assetsByDepartment[0].departmentCode).toBe('N/A');
    });

    it('should handle assets without location', async () => {
      const mockDashboardData = {
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

      prisma.asset.count.mockResolvedValue(mockDashboardData.totalAssets);
      prisma.asset.groupBy
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(mockDashboardData.assetsByLocation);
      prisma.asset.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      prisma.asset.findMany.mockResolvedValue(mockDashboardData.allPurchases);
      prisma.maintenanceRecord.groupBy.mockResolvedValue([]);
      prisma.assetAssignment.findMany.mockResolvedValue([]);
      prisma.maintenanceRecord.findMany.mockResolvedValue([]);
      prisma.department.findMany.mockResolvedValue(mockDashboardData.departments);

      const response = await request(app)
        .get('/api/v1/dashboard')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.assetsByLocation).toHaveLength(1);
      expect(response.body.data.assetsByLocation[0].location).toBe('Unknown');
    });

    it('should sort recent activities by timestamp', async () => {
      const now = new Date();
      const older = new Date(now.getTime() - 100000);

      const mockDashboardData = {
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

      prisma.asset.count.mockResolvedValue(mockDashboardData.totalAssets);
      prisma.asset.groupBy
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      prisma.asset.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      prisma.asset.findMany.mockResolvedValue(mockDashboardData.allPurchases);
      prisma.maintenanceRecord.groupBy.mockResolvedValue([]);
      prisma.assetAssignment.findMany.mockResolvedValue(mockDashboardData.recentAssignments);
      prisma.maintenanceRecord.findMany.mockResolvedValue(mockDashboardData.recentMaintenance);
      prisma.department.findMany.mockResolvedValue(mockDashboardData.departments);

      const response = await request(app)
        .get('/api/v1/dashboard')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.recentActivities).toHaveLength(2);
      expect(response.body.data.recentActivities[0].description).toContain('New Asset');
    });

    it('should limit recent activities to 10', async () => {
      const mockDashboardData = {
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

      prisma.asset.count.mockResolvedValue(mockDashboardData.totalAssets);
      prisma.asset.groupBy
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      prisma.asset.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      prisma.asset.findMany.mockResolvedValue(mockDashboardData.allPurchases);
      prisma.maintenanceRecord.groupBy.mockResolvedValue([]);
      prisma.assetAssignment.findMany.mockResolvedValue(mockDashboardData.recentAssignments);
      prisma.maintenanceRecord.findMany.mockResolvedValue(mockDashboardData.recentMaintenance);
      prisma.department.findMany.mockResolvedValue(mockDashboardData.departments);

      const response = await request(app)
        .get('/api/v1/dashboard')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.recentActivities).toHaveLength(10);
    });

    it('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .get('/api/v1/dashboard');

      expect(response.status).toBe(401);
    });

    it('should allow all authenticated roles to access dashboard', async () => {
      const roles = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN, UserRole.VIEWER];

      for (const role of roles) {
        const roleToken = generateAuthToken({ id: 'user-123', role });

        prisma.asset.count.mockResolvedValue(0);
        prisma.asset.groupBy.mockResolvedValue([]);
        prisma.asset.count.mockResolvedValue(0);
        prisma.asset.findMany.mockResolvedValue([]);
        prisma.maintenanceRecord.groupBy.mockResolvedValue([]);
        prisma.assetAssignment.findMany.mockResolvedValue([]);
        prisma.maintenanceRecord.findMany.mockResolvedValue([]);
        prisma.department.findMany.mockResolvedValue([]);

        const response = await request(app)
          .get('/api/v1/dashboard')
          .set('Authorization', `Bearer ${roleToken}`);

        expect(response.status).toBe(200);
      }
    });
  });
});

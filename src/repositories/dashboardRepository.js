const prisma = require('../config/database');

class DashboardRepository {
  constructor(dbClient = prisma) {
    this.db = dbClient;
  }

  async getDashboardRawData() {
    const now = new Date();
    const in30Days = new Date();
    in30Days.setDate(now.getDate() + 30);

    // Run all database calls in parallel using Promise.all
    const [
      totalAssets,
      assetsByCategory,
      assetsByDepartment,
      assetsByLocation,
      underMaintenanceCount,
      warrantyExpiringCount,
      allPurchases,
      topVendors,
      recentAssignments,
      recentMaintenance,
      departments,
    ] = await Promise.all([
      // 1. Total Assets
      this.db.asset.count(),

      // 2. Assets by Category
      this.db.asset.groupBy({
        by: ['category'],
        _count: { id: true },
      }),

      // 3. Assets by Department ID
      this.db.asset.groupBy({
        by: ['departmentId'],
        _count: { id: true },
      }),

      // 4. Assets by Location
      this.db.asset.groupBy({
        by: ['location'],
        _count: { id: true },
      }),

      // 5. Assets Under Maintenance count
      this.db.asset.count({
        where: { status: 'UNDER_MAINTENANCE' },
      }),

      // 6. Warranty Expiring count
      this.db.asset.count({
        where: {
          warrantyExpiry: {
            gte: now,
            lte: in30Days,
          },
        },
      }),

      // 7. Monthly Purchases & Depreciation Raw Data
      this.db.asset.findMany({
        select: {
          purchaseDate: true,
          purchaseCost: true,
        },
        where: {
          purchaseCost: { not: null },
          purchaseDate: { not: null },
        },
      }),

      // 8. Top Vendors by spend
      this.db.maintenanceRecord.groupBy({
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
      }),

      // 9. Recent Assignments (for Recent Activities feed)
      this.db.assetAssignment.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          asset: { select: { name: true, assetTag: true } },
          user: { select: { firstName: true, lastName: true } },
        },
      }),

      // 10. Recent Maintenance (for Recent Activities feed)
      this.db.maintenanceRecord.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          asset: { select: { name: true, assetTag: true } },
          performedBy: { select: { firstName: true, lastName: true } },
        },
      }),

      // 11. Fetch all departments to map department IDs to names quickly
      this.db.department.findMany({
        select: {
          id: true,
          name: true,
          code: true,
        },
      }),
    ]);

    return {
      totalAssets,
      assetsByCategory,
      assetsByDepartment,
      assetsByLocation,
      underMaintenanceCount,
      warrantyExpiringCount,
      allPurchases,
      topVendors,
      recentAssignments,
      recentMaintenance,
      departments,
    };
  }
}

module.exports = DashboardRepository;

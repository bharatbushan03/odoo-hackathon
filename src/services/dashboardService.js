const ApiError = require('../utils/ApiError');

class DashboardService {
  constructor(dashboardRepository) {
    this.dashboardRepository = dashboardRepository;
  }

  getSummary = async () => {
    const raw = await this.dashboardRepository.getDashboardRawData();
    const now = new Date();

    // 1. Process Assets by Category
    const assetsByCategory = raw.assetsByCategory.map((item) => ({
      category: item.category,
      count: item._count.id,
    }));

    // 2. Process Assets by Department
    const deptMap = new Map(raw.departments.map((d) => [d.id, d]));
    const assetsByDepartment = raw.assetsByDepartment.map((item) => {
      const dept = item.departmentId ? deptMap.get(item.departmentId) : null;
      return {
        departmentName: dept ? dept.name : 'Unassigned',
        departmentCode: dept ? dept.code : 'N/A',
        count: item._count.id,
      };
    });

    // 3. Process Assets by Location
    const assetsByLocation = raw.assetsByLocation.map((item) => ({
      location: item.location || 'Unknown',
      count: item._count.id,
    }));

    // 4. Process Monthly Purchases (last 12 months)
    const monthlyMap = {};
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap[key] = { month: key, totalCost: 0, count: 0 };
    }

    raw.allPurchases.forEach((asset) => {
      const pDate = new Date(asset.purchaseDate);
      const key = `${pDate.getFullYear()}-${String(pDate.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyMap[key]) {
        const cost = Number(asset.purchaseCost) || 0;
        monthlyMap[key].totalCost += cost;
        monthlyMap[key].count += 1;
      }
    });

    const monthlyPurchases = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month));

    // 5. Process Depreciation Summary
    let totalOriginalCost = 0;
    let totalCurrentValue = 0;
    const lifespanMonths = 60; // 5 years

    raw.allPurchases.forEach((asset) => {
      const cost = Number(asset.purchaseCost) || 0;
      totalOriginalCost += cost;

      const pDate = new Date(asset.purchaseDate);
      if (pDate > now) {
        totalCurrentValue += cost;
      } else {
        const diffMonths = (now.getFullYear() - pDate.getFullYear()) * 12 + (now.getMonth() - pDate.getMonth());
        if (diffMonths >= lifespanMonths) {
          totalCurrentValue += 0;
        } else {
          const value = cost * (1 - diffMonths / lifespanMonths);
          totalCurrentValue += value;
        }
      }
    });

    const depreciationSummary = {
      totalOriginalCost: parseFloat(totalOriginalCost.toFixed(2)),
      totalCurrentValue: parseFloat(totalCurrentValue.toFixed(2)),
      totalDepreciated: parseFloat((totalOriginalCost - totalCurrentValue).toFixed(2)),
    };

    // 6. Process Top Vendors
    const topVendors = raw.topVendors.map((v) => ({
      vendorName: v.vendorName,
      totalSpend: Number(v._sum.cost) || 0,
    }));

    // 7. Process Recent Activities
    const activities = [];

    raw.recentAssignments.forEach((h) => {
      activities.push({
        type: 'ASSIGNMENT',
        description: `Asset "${h.asset.name}" (${h.asset.assetTag}) was assigned to ${h.user.firstName} ${h.user.lastName} (Status: ${h.acceptanceStatus})`,
        timestamp: h.createdAt,
      });
    });

    raw.recentMaintenance.forEach((m) => {
      const performed = m.performedBy ? `${m.performedBy.firstName} ${m.performedBy.lastName}` : 'external vendor';
      activities.push({
        type: 'MAINTENANCE',
        description: `Maintenance "${m.title}" status updated to ${m.status} (by ${performed}) for asset "${m.asset.name}" (${m.asset.assetTag})`,
        timestamp: m.createdAt,
      });
    });

    const recentActivities = activities
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);

    return {
      totalAssets: raw.totalAssets,
      assetsUnderMaintenance: raw.underMaintenanceCount,
      warrantyExpiring: raw.warrantyExpiringCount,
      assetsByCategory,
      assetsByDepartment,
      assetsByLocation,
      monthlyPurchases,
      depreciationSummary,
      topVendors,
      recentActivities,
    };
  };
}

module.exports = DashboardService;

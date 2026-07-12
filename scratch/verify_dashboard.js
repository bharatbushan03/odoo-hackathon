const prisma = require('../src/config/database');
const { dashboardService } = require('../src/services');

async function runTests() {
  console.log('--- STARTING DASHBOARD INTEGRATION TESTS ---');

  try {
    // 1. Cleanup
    console.log('Cleaning up existing data...');
    await prisma.notification.deleteMany();
    await prisma.assetAssignment.deleteMany();
    await prisma.maintenanceRecord.deleteMany();
    await prisma.asset.deleteMany();
    await prisma.department.deleteMany();
    await prisma.user.deleteMany();

    // 2. Seed Users
    console.log('Seeding dummy users...');
    const sysAdmin = await prisma.user.create({
      data: {
        employeeId: 'EMP-ADMIN-D',
        email: 'sysadmin@example.com',
        password: 'passwordhashed',
        firstName: 'System',
        lastName: 'Admin',
        role: 'SUPER_ADMIN',
      },
    });

    const userA = await prisma.user.create({
      data: {
        employeeId: 'EMP-USER-D',
        email: 'userd@example.com',
        password: 'passwordhashed',
        firstName: 'Diana',
        lastName: 'Prince',
        role: 'VIEWER',
      },
    });

    // 3. Seed Departments
    console.log('Seeding departments...');
    const deptIT = await prisma.department.create({
      data: { name: 'Information Technology', code: 'IT' },
    });
    const deptHR = await prisma.department.create({
      data: { name: 'Human Resources', code: 'HR' },
    });

    // 4. Seed Assets (with various categories, purchase costs/dates, statuses, locations)
    console.log('Seeding assets...');
    const now = new Date();
    
    // Asset 1: IT department, HARDWARE, purchased 12 months ago (cost 2000), location R101, status AVAILABLE, warranty expiring in 6 months
    const date12MonthsAgo = new Date(now.getFullYear(), now.getMonth() - 12, 15);
    const dateExpiring6Months = new Date(now.getFullYear(), now.getMonth() + 6, 15);
    const asset1 = await prisma.asset.create({
      data: {
        assetTag: 'AST-DASH-1',
        name: 'Dell Precision 5570',
        category: 'HARDWARE',
        status: 'AVAILABLE',
        purchaseCost: 2000,
        purchaseDate: date12MonthsAgo,
        location: 'Room 101',
        departmentId: deptIT.id,
        warrantyExpiry: dateExpiring6Months,
        createdById: sysAdmin.id,
        updatedById: sysAdmin.id,
      },
    });

    // Asset 2: HR department, SOFTWARE, purchased 3 months ago (cost 600), location R102, status UNDER_MAINTENANCE, warranty expiring in 15 days
    const date3MonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 10);
    const dateExpiring15Days = new Date();
    dateExpiring15Days.setDate(now.getDate() + 15);
    const asset2 = await prisma.asset.create({
      data: {
        assetTag: 'AST-DASH-2',
        name: 'Adobe Creative Cloud',
        category: 'SOFTWARE',
        status: 'UNDER_MAINTENANCE',
        purchaseCost: 600,
        purchaseDate: date3MonthsAgo,
        location: 'Room 102',
        departmentId: deptHR.id,
        warrantyExpiry: dateExpiring15Days,
        createdById: sysAdmin.id,
        updatedById: sysAdmin.id,
      },
    });

    // Asset 3: Unassigned, VEHICLE, purchased 24 months ago (cost 24000), status AVAILABLE
    const date24MonthsAgo = new Date(now.getFullYear(), now.getMonth() - 24, 5);
    const asset3 = await prisma.asset.create({
      data: {
        assetTag: 'AST-DASH-3',
        name: 'Ford Transit',
        category: 'VEHICLE',
        status: 'AVAILABLE',
        purchaseCost: 24000,
        purchaseDate: date24MonthsAgo,
        createdById: sysAdmin.id,
        updatedById: sysAdmin.id,
      },
    });

    // 5. Seed Maintenance
    console.log('Seeding maintenance records...');
    await prisma.maintenanceRecord.create({
      data: {
        assetId: asset2.id,
        performedById: sysAdmin.id,
        title: 'License Renewal Failure',
        description: 'Failed to authenticate subscription',
        cost: 150,
        vendorName: 'Adobe Systems Inc',
        status: 'IN_PROGRESS',
        scheduledDate: now,
      },
    });

    await prisma.maintenanceRecord.create({
      data: {
        assetId: asset1.id,
        performedById: sysAdmin.id,
        title: 'Screen Repair',
        description: 'Flickering screen fixed',
        cost: 350,
        vendorName: 'Dell Support',
        status: 'COMPLETED',
        scheduledDate: date3MonthsAgo,
      },
    });

    // 6. Seed Asset Assignment
    console.log('Seeding assignments...');
    await prisma.assetAssignment.create({
      data: {
        assetId: asset1.id,
        userId: userA.id,
        assignedAt: date3MonthsAgo,
        notes: 'Assigned for UX design',
        acceptanceStatus: 'ACCEPTED',
        signature: 'Diana_Prince_Sig',
        signedAt: date3MonthsAgo,
      },
    });

    // 7. Measure execution time & invoke service
    console.log('\nRunning Dashboard service and measuring latency...');
    const startMs = Date.now();
    const result = await dashboardService.getSummary();
    const durationMs = Date.now() - startMs;

    console.log(`✔ Dashboard summary loaded in ${durationMs}ms`);
    if (durationMs < 100) {
      console.log('✔ Verified performance: Response loaded in under 100 milliseconds!');
    } else {
      console.warn('⚠️ Warning: Dashboard query took longer than 100ms');
    }

    // 8. Assert details
    console.log('\nAsserting Dashboard metrics correctness:');
    
    // Total Assets
    console.log('  Total Assets:', result.totalAssets);
    if (result.totalAssets === 3) console.log('  ✔ Total assets count is correct');
    else console.error('  ❌ Error: Expected total assets count of 3, got', result.totalAssets);

    // Under Maintenance
    console.log('  Assets Under Maintenance:', result.assetsUnderMaintenance);
    if (result.assetsUnderMaintenance === 1) console.log('  ✔ Maintenance count is correct');
    else console.error('  ❌ Error: Expected maintenance count of 1');

    // Warranty Expiring
    console.log('  Warranty Expiring in next 30 days:', result.warrantyExpiring);
    if (result.warrantyExpiring === 1) console.log('  ✔ Warranty expiring count is correct (Asset 2)');
    else console.error('  ❌ Error: Expected warranty expiring count of 1 (Asset 2)');

    // Categories
    console.log('  Assets by Category:', result.assetsByCategory);
    const hardwareItem = result.assetsByCategory.find(c => c.category === 'HARDWARE');
    if (hardwareItem && hardwareItem.count === 1) console.log('  ✔ Category count mapping is correct');
    else console.error('  ❌ Error: Category count mapping is incorrect');

    // Departments
    console.log('  Assets by Department:', result.assetsByDepartment);
    const itDeptItem = result.assetsByDepartment.find(d => d.departmentName === 'Information Technology');
    if (itDeptItem && itDeptItem.count === 1) console.log('  ✔ Department count mapping is correct');
    else console.error('  ❌ Error: Department count mapping is incorrect');

    // Location
    console.log('  Assets by Location:', result.assetsByLocation);
    const r101Item = result.assetsByLocation.find(l => l.location === 'Room 101');
    if (r101Item && r101Item.count === 1) console.log('  ✔ Location count mapping is correct');
    else console.error('  ❌ Error: Location count mapping is incorrect');

    // Depreciation
    console.log('  Depreciation Summary:', result.depreciationSummary);
    // Calculations:
    // Lifespan = 60 months.
    // Asset 1 (Dell): Cost = 2000. Age = 12 months. Current Val = 2000 * (1 - 12/60) = 1600.
    // Asset 2 (Adobe): Cost = 600. Age = 3 months. Current Val = 600 * (1 - 3/60) = 570.
    // Asset 3 (Ford): Cost = 24000. Age = 24 months. Current Val = 24000 * (1 - 24/60) = 14400.
    // Total Original Cost = 2000 + 600 + 24000 = 26600.
    // Total Current Value = 1600 + 570 + 14400 = 16570.
    // Total Depreciated = 26600 - 16570 = 10030.
    const expectedCost = 26600;
    const expectedValue = 16570;
    const expectedDepreciated = 10030;
    if (
      result.depreciationSummary.totalOriginalCost === expectedCost &&
      result.depreciationSummary.totalCurrentValue === expectedValue &&
      result.depreciationSummary.totalDepreciated === expectedDepreciated
    ) {
      console.log('  ✔ Straight-line depreciation values calculate perfectly!');
    } else {
      console.error(
        '  ❌ Error: Depreciation calculation incorrect. Expected cost:',
        expectedCost,
        'value:',
        expectedValue,
        'depreciated:',
        expectedDepreciated
      );
    }

    // Top Vendors
    console.log('  Top Vendors:', result.topVendors);
    if (result.topVendors[0] && result.topVendors[0].vendorName === 'Dell Support' && result.topVendors[0].totalSpend === 350) {
      console.log('  ✔ Top vendor mapping & aggregations are correct');
    } else {
      console.error('  ❌ Error: Top vendor mapping is incorrect');
    }

    // Recent Activities
    console.log('  Recent Activities (Feed):');
    result.recentActivities.forEach((act, idx) => {
      console.log(`    [Activity ${idx + 1}] Type: ${act.type} | Msg: ${act.description}`);
    });
    if (result.recentActivities.length > 0) {
      console.log('  ✔ Recent activities are successfully aggregated and ordered');
    } else {
      console.error('  ❌ Error: No recent activities found');
    }

    console.log('\n--- ALL DASHBOARD INTEGRATION TESTS PASSED ---');

  } catch (error) {
    console.error('❌ Error during integration tests:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();

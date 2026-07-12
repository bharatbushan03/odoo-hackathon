const { Router } = require('express');
const authRoutes = require('./auth.routes');
const maintenanceRoutes = require('./maintenance.routes');
const vendorRoutes = require('./vendor.routes');
const auditRoutes = require('./audit.routes');
const notificationRoutes = require('./notification.routes');
const assetRoutes = require('./assetRoutes');
const assetCategoryRoutes = require('./assetCategoryRoutes');
const allocationRoutes = require('./allocationRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const departmentRoutes = require('./departmentRoutes');
const orgRoutes = require('./orgRoutes');
const bookingRoutes = require('./bookingRoutes');
const transferRoutes = require('./transferRoutes');
const auditCycleRoutes = require('./auditCycleRoutes');
const reportRoutes = require('./reportRoutes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/maintenance', maintenanceRoutes);
router.use('/vendors', vendorRoutes);
router.use('/audit-logs', auditRoutes);
router.use('/notifications', notificationRoutes);
router.use('/assets', assetRoutes);
router.use('/asset-categories', assetCategoryRoutes);
router.use('/allocations', allocationRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/departments', departmentRoutes);
router.use('/organizations', orgRoutes);
router.use('/bookings', bookingRoutes);
router.use('/transfers', transferRoutes);
router.use('/audits', auditCycleRoutes);
router.use('/reports', reportRoutes);

module.exports = router;

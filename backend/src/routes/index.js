const { Router } = require('express');
const authRoutes = require('./auth.routes');
const maintenanceRoutes = require('./maintenance.routes');
const vendorRoutes = require('./vendor.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/maintenance', maintenanceRoutes);
router.use('/vendors', vendorRoutes);

module.exports = router;

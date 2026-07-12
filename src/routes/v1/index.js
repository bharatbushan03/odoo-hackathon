const express = require('express');
const { ResponseWrapper } = require('../../utils');

const organizationRoutes = require('./organizationRoutes');
const assignmentRoutes = require('./assignmentRoutes');
const notificationRoutes = require('./notificationRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const authRoutes = require('./authRoutes');

const router = express.Router();

router.get('/health', (req, res) => {
  ResponseWrapper.success(res, {
    message: 'API is running',
    data: {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    },
  });
});

router.use('/auth', authRoutes);
router.use('/organizations', organizationRoutes);
router.use('/assignments', assignmentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;

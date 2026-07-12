const express = require('express');
const { ResponseWrapper } = require('../../utils');

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

module.exports = router;

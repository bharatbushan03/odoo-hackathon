const express = require('express');
const { kpis } = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.get('/kpis', authenticate, kpis);

module.exports = router;

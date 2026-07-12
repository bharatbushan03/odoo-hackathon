const express = require('express');
const { createAllocation, returnAllocation } = require('../controllers/allocationController');
const { authenticate, requireRoles } = require('../middleware/auth');

const router = express.Router();
router.post('/', authenticate, requireRoles('ADMIN', 'ASSET_MANAGER'), createAllocation);
router.post('/:id/return', authenticate, requireRoles('ADMIN', 'ASSET_MANAGER'), returnAllocation);

module.exports = router;

const express = require('express');
const { createAllocation, returnAllocation } = require('../controllers/allocationController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.post('/', authenticate, authorize('ADMIN', 'ASSET_MANAGER'), createAllocation);
router.post('/:id/return', authenticate, authorize('ADMIN', 'ASSET_MANAGER'), returnAllocation);

module.exports = router;

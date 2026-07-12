const express = require('express');
const { createAsset, listAssets } = require('../controllers/assetController');
const { authenticate, requireRoles } = require('../middleware/auth');

const router = express.Router();
router.post('/', authenticate, requireRoles('ADMIN', 'ASSET_MANAGER'), createAsset);
router.get('/', authenticate, listAssets);

module.exports = router;

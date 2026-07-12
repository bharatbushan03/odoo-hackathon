const express = require('express');
const { createAsset, listAssets } = require('../controllers/assetController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.post('/', authenticate, authorize('ADMIN', 'ASSET_MANAGER'), createAsset);
router.get('/', authenticate, listAssets);

module.exports = router;

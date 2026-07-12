const { Router } = require('express');
const authRoutes = require('./auth.routes');
const assetCategoryRoutes = require('./assetCategoryRoutes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/asset-categories', assetCategoryRoutes);

module.exports = router;

const express = require('express');
const assetCategoryController = require('../controllers/assetCategoryController');
const { authenticate, requireRoles } = require('../middleware/auth');

const router = express.Router();

// Admin and Asset Manager routes
const adminOrAssetManager = [authenticate, requireRoles('ADMIN', 'ASSET_MANAGER')];

// Basic CRUD operations
router.post('/', ...adminOrAssetManager, assetCategoryController.createCategory);
router.get('/', authenticate, assetCategoryController.listCategories);
router.get('/search', authenticate, assetCategoryController.searchCategories);
router.get('/hierarchy', authenticate, assetCategoryController.getCategoryHierarchy);
router.get('/root', authenticate, assetCategoryController.getRootCategories);
router.get('/parent/:parentId', authenticate, assetCategoryController.getChildCategories);
router.get('/:id', authenticate, assetCategoryController.getCategory);
router.get('/:id/statistics', authenticate, assetCategoryController.getCategoryStatistics);
router.put('/:id', ...adminOrAssetManager, assetCategoryController.updateCategory);
router.delete('/:id', ...adminOrAssetManager, assetCategoryController.deleteCategory);

module.exports = router;
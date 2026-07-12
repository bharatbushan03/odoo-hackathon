const express = require('express');
const org = require('../controllers/orgController');
const { authenticate, authorize } = require('../middleware/auth');

const admin = [authenticate, authorize('ADMIN')];
const router = express.Router();

router.post('/departments', ...admin, org.createDepartment);
router.get('/departments', ...admin, org.listDepartments);
router.get('/departments/:id', ...admin, org.getDepartment);
router.put('/departments/:id', ...admin, org.updateDepartment);
router.delete('/departments/:id', ...admin, org.deleteDepartment);
router.post('/categories', ...admin, org.createCategory);
router.get('/categories', ...admin, org.listCategories);
router.get('/categories/:id', ...admin, org.getCategory);
router.put('/categories/:id', ...admin, org.updateCategory);
router.delete('/categories/:id', ...admin, org.deleteCategory);
router.get('/employees', ...admin, org.listEmployees);
router.put('/employees/:id', ...admin, org.updateEmployee);
router.post('/employees/:id/promote', ...admin, org.promoteEmployee);

module.exports = router;

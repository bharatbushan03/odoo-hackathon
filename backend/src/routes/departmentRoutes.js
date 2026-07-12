const express = require('express');
const departmentController = require('../controllers/departmentController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Admin-only routes
const admin = [authenticate, authorize('ADMIN')];

// Basic CRUD operations
router.post('/departments', ...admin, departmentController.createDepartment);
router.get('/departments', ...admin, departmentController.listDepartments);
router.get('/departments/search', ...admin, departmentController.searchDepartments);
router.get('/departments/hierarchy', ...admin, departmentController.getDepartmentHierarchy);
router.get('/departments/:id', ...admin, departmentController.getDepartment);
router.put('/departments/:id', ...admin, departmentController.updateDepartment);
router.delete('/departments/:id', ...admin, departmentController.deleteDepartment);

// Department head operations
router.post('/departments/:id/head', ...admin, departmentController.setDepartmentHead);
router.delete('/departments/:id/head', ...admin, departmentController.removeDepartmentHead);

// Department statistics
router.get('/departments/:id/statistics', ...admin, departmentController.getDepartmentStatistics);

// Get departments by head
router.get('/departments/by-head/:headId', ...admin, departmentController.getDepartmentsByHead);

module.exports = router;
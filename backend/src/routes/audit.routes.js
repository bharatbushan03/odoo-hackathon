const { Router } = require('express');
const ctrl = require('../controllers/audit.controller');
const { authenticate, authorize } = require('../middleware/auth');

const router = Router();

router.use(authenticate);

router.get('/', ctrl.list);
router.get('/summary', ctrl.getSummary);
router.get('/cleanup', authorize('SUPER_ADMIN', 'ORG_ADMIN'), ctrl.cleanup);
router.get('/:entityType/:entityId', ctrl.getByEntity);
router.get('/:id', ctrl.getById);

module.exports = router;

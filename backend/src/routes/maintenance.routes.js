const { Router } = require('express');
const ctrl = require('../controllers/maintenance.controller');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const v = require('../validators/maintenance.validator');

const router = Router();

router.use(authenticate);

router.get('/', v.list, validate, ctrl.list);
router.post('/', v.create, validate, ctrl.create);
router.get('/stats', ctrl.getStats);
router.get('/schedules', ctrl.getSchedules);
router.get('/:id', ctrl.getById);
router.put('/:id', v.update, validate, ctrl.update);
router.delete('/:id', ctrl.remove);
router.patch('/:id/status', v.updateStatus, validate, ctrl.updateStatus);
router.post('/:id/assign', v.assignTechnician, validate, ctrl.assignTechnician);
router.post('/:id/attachments', v.addAttachment, validate, ctrl.addAttachment);
router.delete('/:id/attachments/:attachmentId', ctrl.removeAttachment);

module.exports = router;

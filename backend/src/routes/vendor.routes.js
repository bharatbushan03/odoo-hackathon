const { Router } = require('express');
const ctrl = require('../controllers/maintenance.controller');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const v = require('../validators/maintenance.validator');

const router = Router();

router.use(authenticate);

router.get('/', ctrl.listVendors);
router.post('/', v.createVendor, validate, ctrl.createVendor);
router.get('/:id', ctrl.getVendor);
router.put('/:id', v.updateVendor, validate, ctrl.updateVendor);
router.delete('/:id', ctrl.removeVendor);

module.exports = router;

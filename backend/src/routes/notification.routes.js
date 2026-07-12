const { Router } = require('express');
const ctrl = require('../controllers/notification.controller');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const v = require('../validators/notification.validator');

const router = Router();

router.use(authenticate);

router.get('/', v.list, validate, ctrl.list);
router.get('/unread-count', ctrl.unreadCount);
router.patch('/read-all', v.markAllRead, validate, ctrl.markAllAsRead);
router.patch('/:id/read', v.markRead, validate, ctrl.markAsRead);
router.delete('/:id', v.remove, validate, ctrl.remove);

module.exports = router;

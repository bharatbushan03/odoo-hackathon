const express = require('express');
const { notificationController } = require('../../controllers');
const { authenticate } = require('../../middleware/auth');

const router = express.Router();

router.get('/', authenticate, notificationController.getMyNotifications);
router.put('/mark-all-read', authenticate, notificationController.markAllAsRead);
router.put('/:id/read', authenticate, notificationController.markAsRead);

module.exports = router;

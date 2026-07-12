const notifService = require('../services/notification.service');
const asyncHandler = require('../utils/asyncHandler');

const list = asyncHandler(async (req, res) => {
  const notifications = await notifService.list(req.user.id, req.query);
  res.json({ success: true, data: notifications, count: notifications.length });
});

const unreadCount = asyncHandler(async (req, res) => {
  const count = await notifService.unreadCount(req.user.id);
  res.json({ success: true, data: { count } });
});

const markAsRead = asyncHandler(async (req, res) => {
  const notif = await notifService.markAsRead(req.params.id, req.user.id);
  res.json({ success: true, message: 'Notification marked as read', data: notif });
});

const markAllAsRead = asyncHandler(async (req, res) => {
  const result = await notifService.markAllAsRead(req.user.id, req.body.type);
  res.json({ success: true, message: `${result.count} notifications marked as read`, data: result });
});

const remove = asyncHandler(async (req, res) => {
  await notifService.remove(req.params.id, req.user.id);
  res.json({ success: true, message: 'Notification deleted' });
});

module.exports = { list, unreadCount, markAsRead, markAllAsRead, remove };

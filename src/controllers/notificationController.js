const { asyncHandler, ResponseWrapper } = require('../utils');

class NotificationController {
  constructor(notificationService) {
    this.notificationService = notificationService;
  }

  getMyNotifications = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const isRead = req.query.isRead === 'true' ? true : req.query.isRead === 'false' ? false : undefined;

    const result = await this.notificationService.getNotifications({
      userId: req.user.id,
      isRead,
      page,
      limit,
    });

    return ResponseWrapper.paginated(res, {
      data: result.data,
      meta: result.meta,
      message: 'Notifications retrieved successfully',
    });
  });

  markAsRead = asyncHandler(async (req, res) => {
    const notif = await this.notificationService.markAsRead(req.params.id, req.user.id);
    return ResponseWrapper.success(res, {
      data: notif,
      message: 'Notification marked as read',
    });
  });

  markAllAsRead = asyncHandler(async (req, res) => {
    await this.notificationService.markAllAsRead(req.user.id);
    return ResponseWrapper.success(res, {
      message: 'All notifications marked as read',
    });
  });
}

module.exports = NotificationController;

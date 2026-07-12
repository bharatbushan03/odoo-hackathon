const ApiError = require('../utils/ApiError');

class NotificationService {
  constructor(notificationRepository) {
    this.notificationRepository = notificationRepository;
  }

  createNotification = async (userId, title, message) => {
    return this.notificationRepository.create({
      userId,
      title,
      message,
    });
  };

  getNotifications = async (params) => {
    return this.notificationRepository.findUserNotifications(params);
  };

  markAsRead = async (id, userId) => {
    const notif = await this.notificationRepository.findById(id);
    if (!notif) {
      throw ApiError.notFound('Notification not found');
    }
    if (notif.userId !== userId) {
      throw ApiError.forbidden('You do not have permission to access this notification');
    }
    return this.notificationRepository.markAsRead(id, userId);
  };

  markAllAsRead = async (userId) => {
    return this.notificationRepository.markAllAsRead(userId);
  };
}

module.exports = NotificationService;

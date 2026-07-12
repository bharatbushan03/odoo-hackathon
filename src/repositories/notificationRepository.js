const prisma = require('../config/database');
const BaseRepository = require('./baseRepository');

class NotificationRepository extends BaseRepository {
  constructor(dbClient = prisma) {
    super('notification');
    this.db = dbClient;
    this.model = dbClient.notification;
  }

  async findUserNotifications(params = {}) {
    const { userId, isRead, page = 1, limit = 10 } = params;
    const where = { userId };
    if (isRead !== undefined) {
      where.isRead = isRead;
    }

    return this.findWithPagination({
      page,
      limit,
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRead(id, userId) {
    return this.model.update({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId) {
    return this.model.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}

module.exports = NotificationRepository;

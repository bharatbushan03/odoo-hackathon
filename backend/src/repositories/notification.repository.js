const prisma = require('../config/database');

const findMany = (employeeId, filters = {}) => {
  const where = { employeeId };
  const { type, isRead, fromDate, toDate } = filters;

  if (type) where.type = type;
  if (isRead !== undefined) where.isRead = isRead === 'true' || isRead === true;
  if (fromDate || toDate) {
    where.createdAt = {};
    if (fromDate) where.createdAt.gte = new Date(fromDate);
    if (toDate) where.createdAt.lte = new Date(toDate);
  }

  return prisma.notification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
};

const findById = (id) =>
  prisma.notification.findUnique({ where: { id } });

const create = (data) =>
  prisma.notification.create({ data });

const markAsRead = (id) =>
  prisma.notification.update({
    where: { id },
    data: { isRead: true, readAt: new Date() },
  });

const markAllAsRead = (employeeId, type) => {
  const where = { employeeId, isRead: false };
  if (type) where.type = type;

  return prisma.notification.updateMany({
    where,
    data: { isRead: true, readAt: new Date() },
  });
};

const unreadCount = (employeeId) =>
  prisma.notification.count({
    where: { employeeId, isRead: false },
  });

const deleteById = (id) =>
  prisma.notification.delete({ where: { id } });

const deleteOld = (cutoffDate) =>
  prisma.notification.deleteMany({
    where: { createdAt: { lt: cutoffDate } },
  });

module.exports = { findMany, findById, create, markAsRead, markAllAsRead, unreadCount, deleteById, deleteOld };

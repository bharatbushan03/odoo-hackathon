const notifRepo = require('../repositories/notification.repository');
const emailService = require('./email.service');
const prisma = require('../config/database');
const AppError = require('../utils/AppError');

const list = async (employeeId, filters = {}) => {
  return notifRepo.findMany(employeeId, filters);
};

const unreadCount = async (employeeId) => {
  return notifRepo.unreadCount(employeeId);
};

const markAsRead = async (id, employeeId) => {
  const notif = await notifRepo.findById(id);
  if (!notif) throw new AppError('Notification not found', 404);
  if (notif.employeeId !== employeeId) throw new AppError('Access denied', 403);
  return notifRepo.markAsRead(id);
};

const markAllAsRead = async (employeeId, type) => {
  const result = await notifRepo.markAllAsRead(employeeId, type);
  return { count: result.count };
};

const remove = async (id, employeeId) => {
  const notif = await notifRepo.findById(id);
  if (!notif) throw new AppError('Notification not found', 404);
  if (notif.employeeId !== employeeId) throw new AppError('Access denied', 403);
  return notifRepo.deleteById(id);
};

const create = async ({ organizationId, employeeId, type, title, message, referenceType, referenceId, sendEmail = false }) => {
  const notif = await notifRepo.create({
    organizationId,
    employeeId,
    type,
    title,
    message,
    referenceType,
    referenceId,
  });

  if (sendEmail) {
    try {
      const employee = await prisma.employee.findUnique({ where: { id: employeeId }, select: { email: true, name: true } });
      if (employee) {
        await emailService.sendNotificationEmail({
          to: employee.email,
          name: employee.name,
          type,
          title,
          message,
          referenceType,
          referenceId,
        });
      }
    } catch (err) {
      console.error('Failed to send notification email:', err.message);
    }
  }

  return notif;
};

const notifyAssignment = async ({ organizationId, employeeId, assetId, assetName, assignedToName, sendEmail = true }) => {
  return create({
    organizationId,
    employeeId,
    type: 'ASSIGNMENT',
    title: 'Asset Assignment',
    message: `Asset "${assetName}" has been assigned to ${assignedToName}`,
    referenceType: 'Asset',
    referenceId: assetId,
    sendEmail,
  });
};

const notifyMaintenance = async ({ organizationId, employeeId, maintenanceId, title, status, sendEmail = true }) => {
  const actionLabels = {
    REQUESTED: 'requested',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    TECHNICIAN_ASSIGNED: 'technician assigned',
    IN_PROGRESS: 'in progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
  };

  return create({
    organizationId,
    employeeId,
    type: 'MAINTENANCE',
    title: 'Maintenance Update',
    message: `Maintenance "${title}" is ${actionLabels[status] || status.toLowerCase()}`,
    referenceType: 'MaintenanceRequest',
    referenceId: maintenanceId,
    sendEmail,
  });
};

const notifyApprovalRequest = async ({ organizationId, employeeId, entityType, entityId, title, requestedBy, sendEmail = true }) => {
  return create({
    organizationId,
    employeeId,
    type: 'APPROVAL_REQUEST',
    title: 'Approval Required',
    message: `${requestedBy} requested approval for ${entityType}: "${title}"`,
    referenceType: entityType,
    referenceId: entityId,
    sendEmail,
  });
};

const notifyApproved = async ({ organizationId, employeeId, entityType, entityId, title, sendEmail = true }) => {
  return create({
    organizationId,
    employeeId,
    type: 'APPROVED',
    title: 'Request Approved',
    message: `Your ${entityType} "${title}" has been approved`,
    referenceType: entityType,
    referenceId: entityId,
    sendEmail,
  });
};

const notifyRejected = async ({ organizationId, employeeId, entityType, entityId, title, sendEmail = true }) => {
  return create({
    organizationId,
    employeeId,
    type: 'REJECTED',
    title: 'Request Rejected',
    message: `Your ${entityType} "${title}" has been rejected`,
    referenceType: entityType,
    referenceId: entityId,
    sendEmail,
  });
};

const notifyWarrantyExpiry = async ({ organizationId, employeeId, assetId, assetName, expiryDate, sendEmail = true }) => {
  return create({
    organizationId,
    employeeId,
    type: 'WARRANTY_EXPIRY',
    title: 'Warranty Expiring',
    message: `Warranty for "${assetName}" expires on ${expiryDate.toISOString().split('T')[0]}`,
    referenceType: 'Asset',
    referenceId: assetId,
    sendEmail,
  });
};

module.exports = {
  list, unreadCount, markAsRead, markAllAsRead, remove,
  create, notifyAssignment, notifyMaintenance, notifyApprovalRequest,
  notifyApproved, notifyRejected, notifyWarrantyExpiry,
};

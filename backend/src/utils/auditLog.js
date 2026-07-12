const prisma = require('../config/database');

const log = async ({ organizationId, employeeId, action, entityType, entityId, description, oldValues, newValues, ipAddress, userAgent }) => {
  try {
    return await prisma.auditLog.create({
      data: {
        organizationId,
        employeeId,
        action,
        entityType,
        entityId,
        description,
        oldValues: oldValues || undefined,
        newValues: newValues || undefined,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
    return null;
  }
};

const logAuth = async ({ organizationId, employeeId, action, ipAddress, userAgent }) =>
  log({ organizationId, employeeId, action, entityType: 'Auth', description: `User ${action.toLowerCase()}`, ipAddress, userAgent });

const logCRUD = async ({ organizationId, employeeId, action, entityType, entityId, description, oldValues, newValues, ipAddress, userAgent }) =>
  log({ organizationId, employeeId, action, entityType, entityId, description, oldValues, newValues, ipAddress, userAgent });

const logAssignment = async ({ organizationId, employeeId, assetId, assignedTo, ipAddress, userAgent }) =>
  log({ organizationId, employeeId, action: 'ASSIGN', entityType: 'Asset', entityId: assetId, description: `Asset assigned to ${assignedTo}`, ipAddress, userAgent });

const logTransfer = async ({ organizationId, employeeId, assetId, from, to, ipAddress, userAgent }) =>
  log({ organizationId, employeeId, action: 'TRANSFER', entityType: 'Asset', entityId: assetId, description: `Asset transferred from ${from} to ${to}`, ipAddress, userAgent });

const logMaintenance = async ({ organizationId, employeeId, action, maintenanceId, description, oldValues, newValues, ipAddress, userAgent }) =>
  log({ organizationId, employeeId, action, entityType: 'MaintenanceRequest', entityId: maintenanceId, description, oldValues, newValues, ipAddress, userAgent });

const logApproval = async ({ organizationId, employeeId, action, entityType, entityId, description, ipAddress, userAgent }) =>
  log({ organizationId, employeeId, action, entityType, entityId, description, ipAddress, userAgent });

const getAuditLogs = async (organizationId, filters = {}, pagination = {}) => {
  const { action, entityType, entityId, employeeId, fromDate, toDate, search } = filters;
  const { page = 1, limit = 50 } = pagination;
  const skip = (page - 1) * limit;

  const where = { organizationId };
  if (action) where.action = action;
  if (entityType) where.entityType = entityType;
  if (entityId) where.entityId = entityId;
  if (employeeId) where.employeeId = employeeId;
  if (fromDate || toDate) {
    where.createdAt = {};
    if (fromDate) where.createdAt.gte = new Date(fromDate);
    if (toDate) where.createdAt.lte = new Date(toDate);
  }
  if (search) {
    where.description = { contains: search, mode: 'insensitive' };
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        employee: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total, page, limit, totalPages: Math.ceil(total / limit) };
};

const getAuditLogById = async (id) => {
  const logEntry = await prisma.auditLog.findUnique({
    where: { id },
    include: {
      employee: { select: { id: true, name: true, email: true, role: true } },
    },
  });
  return logEntry;
};

const getEntityAuditLogs = async (entityType, entityId, pagination = {}) => {
  const { page = 1, limit = 50 } = pagination;
  const skip = (page - 1) * limit;

  const where = { entityType, entityId };

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        employee: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total, page, limit, totalPages: Math.ceil(total / limit) };
};

const getActivitySummary = async (organizationId, filters = {}) => {
  const { fromDate, toDate } = filters;
  const where = { organizationId };
  if (fromDate || toDate) {
    where.createdAt = {};
    if (fromDate) where.createdAt.gte = new Date(fromDate);
    if (toDate) where.createdAt.lte = new Date(toDate);
  }

  const summary = await prisma.auditLog.groupBy({
    by: ['action', 'entityType'],
    where,
    _count: { id: true },
    _min: { createdAt: true },
    _max: { createdAt: true },
  });

  return summary.map((item) => ({
    action: item.action,
    entityType: item.entityType,
    count: item._count.id,
    firstActivity: item._min.createdAt,
    lastActivity: item._max.createdAt,
  }));
};

const logAssetChange = async ({ assetId, action, oldValues, newValues, employeeId, role, description, organizationId }) => {
  return log({
    organizationId,
    employeeId,
    action,
    entityType: 'Asset',
    entityId: assetId,
    description: description || `Asset ${action.toLowerCase()}`,
    oldValues,
    newValues,
  });
};

const cleanupOldAuditLogs = async (cutoffDate) => {
  const result = await prisma.auditLog.deleteMany({
    where: { createdAt: { lt: cutoffDate } },
  });
  return { deletedCount: result.count };
};

module.exports = {
  log,
  logAuth,
  logCRUD,
  logAssignment,
  logTransfer,
  logMaintenance,
  logApproval,
  getAuditLogs,
  getAuditLogById,
  getEntityAuditLogs,
  getActivitySummary,
  cleanupOldAuditLogs,
  logAssetChange,
};

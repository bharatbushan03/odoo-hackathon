const prisma = require('../config/prisma');

async function logAssetChange(assetId, action, oldValues, newValues, changedBy, changedByRole = 'SYSTEM') {
  try {
    const auditLog = await prisma.auditLog.create({
      {
        action,
        entityType: 'Asset',
        entityId: assetId,
        oldValues: oldValues ? JSON.stringify(oldValues) : null,
        newValues: newValues ? JSON.stringify(newValues) : null,
        changedBy,
        changedByRole
      }
    });
    return auditLog;
  } catch (error) {
    console.error('Failed to log asset change:', error);
    return null;
  }
}

async function getAssetChanges(assetId, options = {}) {
  try {
    const { limit = 50, page = 1 } = options;
    const skip = (page - 1) * limit;

    const [changes, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: { entityType: 'Asset', entityId: assetId },
        include: {
          actor: {
            include: {
              department: {
                select: { name: true }
              }
            }
          }
        },
        orderBy: { changedAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.auditLog.count({
        where: { entityType: 'Asset', entityId: assetId }
      })
    ]);

    return {
      changes,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  } catch (error) {
    console.error('Failed to get asset changes:', error);
    throw error;
  }
}

async function getAuditLogs(filters = {}, options = {}) {
  try {
    const { 
      entityType = 'Asset',
      entityId,
      actorId,
      action,
      changedByRole,
      startDate,
      endDate,
      limit = 50, 
      page = 1 
    } = filters;

    const { sortBy = 'changedAt', sortOrder = 'desc' } = options;

    const where = { entityType };
    
    if (entityId) where.entityId = entityId;
    if (actorId) where.changedBy = actorId;
    if (action) where.action = action;
    if (changedByRole) where.changedByRole = changedByRole;
    if (startDate || endDate) {
      where.changedAt = {};
      if (startDate) where.changedAt.gte = new Date(startDate);
      if (endDate) where.changedAt.lte = new Date(endDate);
    }

    const orderBy = {};
    orderBy[sortBy] = sortOrder === 'asc' ? 'asc' : 'desc';

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          actor: {
            select: {
              id: true,
              name: true,
              email: true,
              department: {
                select: { name: true }
              }
            }
          }
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.auditLog.count({ where })
    ]);

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  } catch (error) {
    console.error('Failed to get audit logs:', error);
    throw error;
  }
}

async function getAuditLog(id) {
  try {
    const log = await prisma.auditLog.findUnique({
      where: { id },
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
            department: {
              select: { name: true }
            }
          }
        }
      }
    });

    if (!log) {
      return null;
    }

    const parsedChanges = {
      ...log,
      oldValues: log.oldValues ? JSON.parse(log.oldValues) : null,
      newValues: log.newValues ? JSON.parse(log.newValues) : null
    };

    return parsedChanges;
  } catch (error) {
    console.error('Failed to get audit log:', error);
    throw error;
  }
}

function formatChangeDescription(action, oldValues, newValues) {
  let description = '';
  
  switch (action) {
    case 'CREATE':
      description = 'Asset created';
      break;
    case 'UPDATE':
      description = 'Asset updated';
      break;
    case 'DELETE':
      description = 'Asset deleted';
      break;
    case 'ASSIGN':
      description = 'Asset assigned to employee';
      break;
    case 'UNASSIGN':
      description = 'Asset unassigned from employee';
      break;
    case 'UPDATE_STATUS':
      description = 'Asset status updated';
      break;
    case 'UPDATE_LOCATION':
      description = 'Asset location updated';
      break;
    default:
      description = `${action} asset`;
  }

  if (oldValues && newValues) {
    const changedFields = Object.keys(oldValues).filter(field => 
      oldValues[field] !== newValues[field]
    );

    if (changedFields.length > 0) {
      const fieldNames = changedFields.map(field => {
        const fieldName = field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        return fieldName;
      });

      description += ` - Fields changed: ${fieldNames.join(', ')}`;
    }
  }

  return description;
}

async function getActivitySummary(filters = {}) {
  try {
    const { 
      startDate, 
      endDate, 
      changedByRole 
    } = filters;

    const where = {};
    if (startDate || endDate) {
      where.changedAt = {};
      if (startDate) where.changedAt.gte = new Date(startDate);
      if (endDate) where.changedAt.lte = new Date(endDate);
    }
    if (changedByRole) {
      where.changedByRole = changedByRole;
    }

    const activitySummary = await prisma.auditLog.groupBy({
      by: ['action', 'changedByRole'],
      where,
      _count: true,
      _min: { changedAt: true },
      _max: { changedAt: true }
    });

    const summary = activitySummary.map(item => ({
      action: item.action,
      role: item.changedByRole,
      count: item._count,
      firstActivity: item._min.changedAt,
      lastActivity: item._max.changedAt
    }));

    return summary;
  } catch (error) {
    console.error('Failed to get activity summary:', error);
    throw error;
  }
}

async function getAssetChangeDetail(assetId, field, options = {}) {
  try {
    const { 
      startDate, 
      endDate, 
      limit = 50 
    } = options;

    let logs = await prisma.auditLog.findMany({
      where: { 
        entityType: 'Asset',
        entityId: assetId,
        action: 'UPDATE'
      },
      skip: 0,
      take: limit
    });

    let fieldLogs = [];
    
    for (const log of logs) {
      try {
        const oldValues = log.oldValues ? JSON.parse(log.oldValues) : {};
        const newValues = log.newValues ? JSON.parse(log.newValues) : {};

        if (oldValues[field] !== undefined || newValues[field] !== undefined) {
          fieldLogs.push({
            logId: log.id,
            timestamp: log.changedAt,
            old: oldValues[field],
            new: newValues[field],
            actor: log.actor,
            description: formatChangeDescription(log.action, oldValues, newValues)
          });
        }
      } catch (parseError) {
        continue;
      }
    }

    return fieldLogs.sort((a, b) => a.timestamp - b.timestamp);
  } catch (error) {
    console.error('Failed to get asset change detail:', error);
    throw error;
  }
}

async function cleanupOldAuditLogs(cutoffDate, limit = 1000) {
  try {
    const deletedCount = await prisma.auditLog.deleteMany({
      where: {
        changedAt: {
          lt: cutoffDate
        }
      },
      take: limit
    });

    return {
      success: true,
      deletedCount
    };
  } catch (error) {
    console.error('Failed to cleanup audit logs:', error);
    throw error;
  }
}

module.exports = {
  logAssetChange,
  getAssetChanges,
  getAuditLogs,
  getAuditLog,
  formatChangeDescription,
  getActivitySummary,
  getAssetChangeDetail,
  cleanupOldAuditLogs
};
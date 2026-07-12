const auditLog = require('../utils/auditLog');
const asyncHandler = require('../utils/asyncHandler');

const list = asyncHandler(async (req, res) => {
  const result = await auditLog.getAuditLogs(req.user.organizationId, req.query, { page: req.query.page, limit: req.query.limit });
  res.json({ success: true, ...result });
});

const getById = asyncHandler(async (req, res) => {
  const logEntry = await auditLog.getAuditLogById(req.params.id);
  if (!logEntry) return res.status(404).json({ success: false, message: 'Audit log not found' });
  res.json({ success: true, data: logEntry });
});

const getByEntity = asyncHandler(async (req, res) => {
  const { entityType, entityId } = req.params;
  const result = await auditLog.getEntityAuditLogs(entityType, entityId, { page: req.query.page, limit: req.query.limit });
  res.json({ success: true, ...result });
});

const getSummary = asyncHandler(async (req, res) => {
  const summary = await auditLog.getActivitySummary(req.user.organizationId, req.query);
  res.json({ success: true, data: summary });
});

const cleanup = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days) || 90;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  const result = await auditLog.cleanupOldAuditLogs(cutoffDate);
  res.json({ success: true, message: `Cleaned up ${result.deletedCount} audit logs older than ${days} days`, data: result });
});

module.exports = { list, getById, getByEntity, getSummary, cleanup };

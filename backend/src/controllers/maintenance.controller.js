const maintenanceService = require('../services/maintenance.service');
const auditLog = require('../utils/auditLog');
const notifService = require('../services/notification.service');
const asyncHandler = require('../utils/asyncHandler');

const getIp = (req) => req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';
const getUa = (req) => req.headers['user-agent'] || '';

const list = asyncHandler(async (req, res) => {
  const records = await maintenanceService.list(req.user.organizationId, req.query);
  res.json({ success: true, data: records, count: records.length });
});

const getById = asyncHandler(async (req, res) => {
  const record = await maintenanceService.getById(req.params.id);
  res.json({ success: true, data: record });
});

const create = asyncHandler(async (req, res) => {
  const record = await maintenanceService.create(req.user.id, req.body);
  auditLog.logMaintenance({ organizationId: req.user.organizationId, employeeId: req.user.id, action: 'CREATE', maintenanceId: record.id, description: `Maintenance request created: ${record.title}`, ipAddress: getIp(req), userAgent: getUa(req) });
  notifService.notifyMaintenance({ organizationId: req.user.organizationId, employeeId: req.user.id, maintenanceId: record.id, title: record.title, status: 'REQUESTED' });
  if (req.body.technicianId && req.body.technicianId !== req.user.id) {
    notifService.notifyMaintenance({ organizationId: req.user.organizationId, employeeId: req.body.technicianId, maintenanceId: record.id, title: record.title, status: 'TECHNICIAN_ASSIGNED' });
  }
  res.status(201).json({ success: true, message: 'Maintenance request created', data: record });
});

const update = asyncHandler(async (req, res) => {
  const before = await maintenanceService.getById(req.params.id);
  const record = await maintenanceService.update(req.params.id, req.body);
  auditLog.logMaintenance({ organizationId: req.user.organizationId, employeeId: req.user.id, action: 'UPDATE', maintenanceId: record.id, description: `Maintenance request updated: ${record.title}`, oldValues: { title: before.title, status: before.status, priority: before.priority }, newValues: { title: record.title, status: record.status, priority: record.priority }, ipAddress: getIp(req), userAgent: getUa(req) });
  res.json({ success: true, message: 'Maintenance request updated', data: record });
});

const updateStatus = asyncHandler(async (req, res) => {
  const before = await maintenanceService.getById(req.params.id);
  const record = await maintenanceService.updateStatus(req.params.id, req.user.id, req.body);
  const action = req.body.status === 'COMPLETED' ? 'MAINTENANCE_COMPLETE' : req.body.status === 'APPROVED' ? 'APPROVE' : req.body.status === 'REJECTED' ? 'REJECT' : 'STATUS_CHANGE';
  auditLog.logMaintenance({ organizationId: req.user.organizationId, employeeId: req.user.id, action, maintenanceId: record.id, description: `Status changed from ${before.status} to ${record.status}`, oldValues: { status: before.status }, newValues: { status: record.status }, ipAddress: getIp(req), userAgent: getUa(req) });
  notifService.notifyMaintenance({ organizationId: req.user.organizationId, employeeId: before.raisedById, maintenanceId: record.id, title: record.title, status: record.status });
  if (record.technicianId && record.technicianId !== before.raisedById) {
    notifService.notifyMaintenance({ organizationId: req.user.organizationId, employeeId: record.technicianId, maintenanceId: record.id, title: record.title, status: record.status });
  }
  if (req.body.status === 'APPROVAL_REQUEST' && req.body.approverId) {
    notifService.notifyApprovalRequest({ organizationId: req.user.organizationId, employeeId: req.body.approverId, entityType: 'MaintenanceRequest', entityId: record.id, title: record.title, requestedBy: req.user.name });
  }
  if (req.body.status === 'APPROVED') {
    notifService.notifyApproved({ organizationId: req.user.organizationId, employeeId: before.raisedById, entityType: 'MaintenanceRequest', entityId: record.id, title: record.title });
  }
  if (req.body.status === 'REJECTED') {
    notifService.notifyRejected({ organizationId: req.user.organizationId, employeeId: before.raisedById, entityType: 'MaintenanceRequest', entityId: record.id, title: record.title });
  }
  res.json({ success: true, message: `Status updated to ${req.body.status}`, data: record });
});

const assignTechnician = asyncHandler(async (req, res) => {
  const record = await maintenanceService.assignTechnician(req.params.id, req.body.technicianId);
  auditLog.logAssignment({ organizationId: req.user.organizationId, employeeId: req.user.id, assetId: record.assetId, assignedTo: req.body.technicianId, ipAddress: getIp(req), userAgent: getUa(req) });
  notifService.notifyMaintenance({ organizationId: req.user.organizationId, employeeId: req.body.technicianId, maintenanceId: record.id, title: record.title, status: 'TECHNICIAN_ASSIGNED' });
  res.json({ success: true, message: 'Technician assigned', data: record });
});

const remove = asyncHandler(async (req, res) => {
  const before = await maintenanceService.getById(req.params.id);
  await maintenanceService.remove(req.params.id);
  auditLog.logMaintenance({ organizationId: req.user.organizationId, employeeId: req.user.id, action: 'DELETE', maintenanceId: req.params.id, description: `Maintenance request deleted: ${before.title}`, ipAddress: getIp(req), userAgent: getUa(req) });
  res.json({ success: true, message: 'Maintenance request deleted' });
});

const addAttachment = asyncHandler(async (req, res) => {
  const attachment = await maintenanceService.addAttachment(req.params.id, req.user.id, req.body);
  res.status(201).json({ success: true, message: 'Attachment added', data: attachment });
});

const removeAttachment = asyncHandler(async (req, res) => {
  await maintenanceService.removeAttachment(req.params.id, req.params.attachmentId);
  res.json({ success: true, message: 'Attachment deleted' });
});

const getStats = asyncHandler(async (req, res) => {
  const stats = await maintenanceService.getStats(req.user.organizationId);
  res.json({ success: true, data: stats });
});

const getSchedules = asyncHandler(async (req, res) => {
  const schedules = await maintenanceService.getSchedules(req.user.organizationId);
  res.json({ success: true, data: schedules, count: schedules.length });
});

const createVendor = asyncHandler(async (req, res) => {
  const vendor = await maintenanceService.createVendor(req.user.organizationId, req.body);
  auditLog.logCRUD({ organizationId: req.user.organizationId, employeeId: req.user.id, action: 'CREATE', entityType: 'Vendor', entityId: vendor.id, description: `Vendor created: ${vendor.name}`, ipAddress: getIp(req), userAgent: getUa(req) });
  res.status(201).json({ success: true, message: 'Vendor created', data: vendor });
});

const listVendors = asyncHandler(async (req, res) => {
  const vendors = await maintenanceService.listVendors(req.user.organizationId, req.query);
  res.json({ success: true, data: vendors, count: vendors.length });
});

const getVendor = asyncHandler(async (req, res) => {
  const vendor = await maintenanceService.getVendor(req.params.id);
  res.json({ success: true, data: vendor });
});

const updateVendor = asyncHandler(async (req, res) => {
  const vendor = await maintenanceService.updateVendor(req.params.id, req.body);
  auditLog.logCRUD({ organizationId: req.user.organizationId, employeeId: req.user.id, action: 'UPDATE', entityType: 'Vendor', entityId: vendor.id, description: `Vendor updated: ${vendor.name}`, newValues: { name: vendor.name }, ipAddress: getIp(req), userAgent: getUa(req) });
  res.json({ success: true, message: 'Vendor updated', data: vendor });
});

const removeVendor = asyncHandler(async (req, res) => {
  const vendor = await maintenanceService.getVendor(req.params.id);
  await maintenanceService.removeVendor(req.params.id);
  auditLog.logCRUD({ organizationId: req.user.organizationId, employeeId: req.user.id, action: 'DELETE', entityType: 'Vendor', entityId: req.params.id, description: `Vendor deleted: ${vendor.name}`, ipAddress: getIp(req), userAgent: getUa(req) });
  res.json({ success: true, message: 'Vendor deleted' });
});

module.exports = {
  list, getById, create, update, updateStatus, assignTechnician, remove,
  addAttachment, removeAttachment, getStats, getSchedules,
  createVendor, listVendors, getVendor, updateVendor, removeVendor,
};

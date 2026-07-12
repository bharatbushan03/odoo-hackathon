const maintenanceService = require('../services/maintenance.service');
const asyncHandler = require('../utils/asyncHandler');

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
  res.status(201).json({ success: true, message: 'Maintenance request created', data: record });
});

const update = asyncHandler(async (req, res) => {
  const record = await maintenanceService.update(req.params.id, req.body);
  res.json({ success: true, message: 'Maintenance request updated', data: record });
});

const updateStatus = asyncHandler(async (req, res) => {
  const record = await maintenanceService.updateStatus(req.params.id, req.user.id, req.body);
  res.json({ success: true, message: `Status updated to ${req.body.status}`, data: record });
});

const assignTechnician = asyncHandler(async (req, res) => {
  const record = await maintenanceService.assignTechnician(req.params.id, req.body.technicianId);
  res.json({ success: true, message: 'Technician assigned', data: record });
});

const remove = asyncHandler(async (req, res) => {
  await maintenanceService.remove(req.params.id);
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
  res.json({ success: true, message: 'Vendor updated', data: vendor });
});

const removeVendor = asyncHandler(async (req, res) => {
  await maintenanceService.removeVendor(req.params.id);
  res.json({ success: true, message: 'Vendor deleted' });
});

module.exports = {
  list, getById, create, update, updateStatus, assignTechnician, remove,
  addAttachment, removeAttachment, getStats, getSchedules,
  createVendor, listVendors, getVendor, updateVendor, removeVendor,
};

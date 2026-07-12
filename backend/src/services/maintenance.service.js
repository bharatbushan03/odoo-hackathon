const maintenanceRepo = require('../repositories/maintenance.repository');
const vendorRepo = require('../repositories/vendor.repository');
const attachmentRepo = require('../repositories/maintenanceAttachment.repository');
const prisma = require('../config/database');
const AppError = require('../utils/AppError');

const STATUS_FLOW = {
  REQUESTED: ['PENDING', 'CANCELLED'],
  PENDING: ['APPROVED', 'REJECTED', 'CANCELLED'],
  APPROVED: ['TECHNICIAN_ASSIGNED', 'CANCELLED'],
  REJECTED: [],
  TECHNICIAN_ASSIGNED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

const list = async (organizationId, filters = {}) => {
  const requests = await maintenanceRepo.findMany(filters);
  return requests.filter((r) => r.asset && r.asset.organizationId === organizationId).map((r) => {
    const { asset, ...rest } = r;
    return { ...rest, asset };
  });
};

const getById = async (id) => {
  const record = await maintenanceRepo.findById(id);
  if (!record) throw new AppError('Maintenance request not found', 404);
  return record;
};

const create = async (employeeId, data) => {
  const asset = await prisma.asset.findUnique({ where: { id: data.assetId } });
  if (!asset) throw new AppError('Asset not found', 404);

  const totalCost = (data.estimatedCost || 0);

  const record = await maintenanceRepo.create({
    assetId: data.assetId,
    type: data.type || 'CORRECTIVE',
    title: data.title,
    description: data.description,
    priority: data.priority || 'MEDIUM',
    scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : null,
    startDate: data.startDate ? new Date(data.startDate) : null,
    isRecurring: data.isRecurring || false,
    frequency: data.frequency || null,
    nextDueDate: data.isRecurring && data.scheduledDate ? new Date(data.scheduledDate) : null,
    raisedById: employeeId,
    technicianId: data.technicianId || null,
    vendorId: data.vendorId || null,
    estimatedCost: data.estimatedCost || 0,
    totalCost,
    issue: data.issue,
    notes: data.notes,
  });

  return record;
};

const update = async (id, data) => {
  const existing = await maintenanceRepo.findById(id);
  if (!existing) throw new AppError('Maintenance request not found', 404);

  const updateData = { ...data };
  if (data.scheduledDate !== undefined) updateData.scheduledDate = data.scheduledDate ? new Date(data.scheduledDate) : null;
  if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null;
  if (data.frequency !== undefined) updateData.frequency = data.frequency || null;
  if (data.technicianId !== undefined) updateData.technicianId = data.technicianId || null;
  if (data.vendorId !== undefined) updateData.vendorId = data.vendorId || null;

  if (data.estimatedCost !== undefined || data.laborCost !== undefined || data.partsCost !== undefined || data.vendorCost !== undefined) {
    updateData.totalCost = (data.estimatedCost ?? existing.estimatedCost) +
      (data.laborCost ?? existing.laborCost) +
      (data.partsCost ?? existing.partsCost) +
      (data.vendorCost ?? existing.vendorCost);
  }

  return maintenanceRepo.updateById(id, updateData);
};

const updateStatus = async (id, employeeId, { status, resolution, partsUsed, laborCost, partsCost, vendorCost }) => {
  const existing = await maintenanceRepo.findById(id);
  if (!existing) throw new AppError('Maintenance request not found', 404);

  const allowedTransitions = STATUS_FLOW[existing.status];
  if (!allowedTransitions || !allowedTransitions.includes(status)) {
    throw new AppError(`Cannot transition from ${existing.status} to ${status}`, 400);
  }

  const updateData = { status };

  if (status === 'COMPLETED') {
    updateData.completionDate = new Date();
    updateData.resolvedAt = new Date();
    updateData.completedById = employeeId;
    if (resolution) updateData.resolution = resolution;
    if (partsUsed) updateData.partsUsed = partsUsed;
    if (laborCost !== undefined) updateData.laborCost = laborCost;
    if (partsCost !== undefined) updateData.partsCost = partsCost;
    if (vendorCost !== undefined) updateData.vendorCost = vendorCost;

    updateData.totalCost = (laborCost ?? existing.laborCost) +
      (partsCost ?? existing.partsCost) +
      (vendorCost ?? existing.vendorCost) +
      existing.estimatedCost;
  }

  if (status === 'TECHNICIAN_ASSIGNED' && existing.technicianId) {
    updateData.startDate = existing.startDate || new Date();
  }

  if (status === 'APPROVED') {
    updateData.approvedById = employeeId;
  }

  if (status === 'IN_PROGRESS') {
    updateData.startDate = existing.startDate || new Date();
  }

  return maintenanceRepo.updateById(id, updateData);
};

const assignTechnician = async (id, technicianId) => {
  const existing = await maintenanceRepo.findById(id);
  if (!existing) throw new AppError('Maintenance request not found', 404);

  const technician = await prisma.employee.findUnique({ where: { id: technicianId } });
  if (!technician) throw new AppError('Technician not found', 404);

  return maintenanceRepo.updateById(id, {
    technicianId,
    status: existing.status === 'REQUESTED' || existing.status === 'PENDING' ? 'TECHNICIAN_ASSIGNED' : existing.status,
    startDate: existing.startDate || new Date(),
  });
};

const remove = async (id) => {
  const existing = await maintenanceRepo.findById(id);
  if (!existing) throw new AppError('Maintenance request not found', 404);
  return maintenanceRepo.softDeleteById(id);
};

const addAttachment = async (maintenanceRequestId, uploadedById, data) => {
  const existing = await maintenanceRepo.findById(maintenanceRequestId);
  if (!existing) throw new AppError('Maintenance request not found', 404);

  return attachmentRepo.create({
    maintenanceRequestId,
    fileName: data.fileName,
    filePath: data.filePath,
    fileType: data.fileType,
    fileSize: data.fileSize,
    uploadedById,
  });
};

const removeAttachment = async (maintenanceRequestId, attachmentId) => {
  const attachment = await attachmentRepo.findById(attachmentId);
  if (!attachment || attachment.maintenanceRequestId !== maintenanceRequestId) {
    throw new AppError('Attachment not found', 404);
  }
  return attachmentRepo.deleteById(attachmentId);
};

const getStats = async (organizationId) => {
  const where = { deletedAt: null };
  const assets = await prisma.asset.findMany({ where: { organizationId }, select: { id: true } });
  const assetIds = assets.map((a) => a.id);
  where.assetId = { in: assetIds };

  const statusCount = await maintenanceRepo.countByStatus(where);
  const costs = await maintenanceRepo.sumCosts(where);

  const typeCount = await prisma.maintenanceRequest.groupBy({
    by: ['type'],
    where,
    _count: { type: true },
  });

  const totalCount = await prisma.maintenanceRequest.count({ where });

  const statusMap = {};
  statusCount.forEach((s) => { statusMap[s.status] = s._count.status; });

  const typeMap = {};
  typeCount.forEach((t) => { typeMap[t.type] = t._count.type; });

  return {
    total: totalCount,
    byStatus: statusMap,
    byType: typeMap,
    costs: {
      totalLabor: costs._sum.laborCost || 0,
      totalParts: costs._sum.partsCost || 0,
      totalVendor: costs._sum.vendorCost || 0,
      totalOverall: costs._sum.totalCost || 0,
      averageCost: costs._avg.totalCost || 0,
    },
  };
};

const getSchedules = async (organizationId) => {
  const assets = await prisma.asset.findMany({ where: { organizationId }, select: { id: true } });
  const assetIds = assets.map((a) => a.id);

  const now = new Date();
  return maintenanceRepo.findMany({
    assetId: { in: assetIds },
    OR: [
      { scheduledDate: { not: null }, status: { notIn: ['COMPLETED', 'CANCELLED'] } },
      { isRecurring: true, status: { notIn: ['CANCELLED'] } },
    ],
  });
};

const createVendor = async (organizationId, data) => {
  const existing = await prisma.vendor.findFirst({
    where: { organizationId, name: data.name, deletedAt: null },
  });
  if (existing) throw new AppError('Vendor with this name already exists', 409);
  return vendorRepo.create({ ...data, organizationId });
};

const listVendors = async (organizationId, filters = {}) =>
  vendorRepo.findMany(organizationId, filters);

const getVendor = async (id) => {
  const vendor = await vendorRepo.findById(id);
  if (!vendor) throw new AppError('Vendor not found', 404);
  return vendor;
};

const updateVendor = async (id, data) => {
  const existing = await vendorRepo.findById(id);
  if (!existing) throw new AppError('Vendor not found', 404);
  return vendorRepo.updateById(id, data);
};

const removeVendor = async (id) => {
  const existing = await vendorRepo.findById(id);
  if (!existing) throw new AppError('Vendor not found', 404);
  return vendorRepo.softDeleteById(id);
};

module.exports = {
  list, getById, create, update, updateStatus, assignTechnician, remove,
  addAttachment, removeAttachment, getStats, getSchedules,
  createVendor, listVendors, getVendor, updateVendor, removeVendor,
};

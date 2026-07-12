const prisma = require('../config/database');

const findMany = (filters = {}) => {
  const where = { deletedAt: null };
  const { status, type, priority, assetId, technicianId, vendorId, fromDate, toDate, search } = filters;

  if (status) where.status = status;
  if (type) where.type = type;
  if (priority) where.priority = priority;
  if (assetId) where.assetId = assetId;
  if (technicianId) where.technicianId = technicianId;
  if (vendorId) where.vendorId = vendorId;
  if (fromDate || toDate) {
    where.createdAt = {};
    if (fromDate) where.createdAt.gte = new Date(fromDate);
    if (toDate) where.createdAt.lte = new Date(toDate);
  }
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { issue: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  return prisma.maintenanceRequest.findMany({
    where,
    include: {
      asset: { select: { id: true, name: true, assetTag: true, serialNumber: true } },
      raisedBy: { select: { id: true, name: true, email: true } },
      technician: { select: { id: true, name: true, email: true } },
      approvedBy: { select: { id: true, name: true } },
      completedBy: { select: { id: true, name: true } },
      vendor: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

const findById = (id) =>
  prisma.maintenanceRequest.findFirst({
    where: { id, deletedAt: null },
    include: {
      asset: { select: { id: true, name: true, assetTag: true, serialNumber: true, status: true, currentLocation: true } },
      raisedBy: { select: { id: true, name: true, email: true } },
      technician: { select: { id: true, name: true, email: true } },
      approvedBy: { select: { id: true, name: true } },
      completedBy: { select: { id: true, name: true } },
      vendor: { select: { id: true, name: true, contactPerson: true, phone: true, email: true } },
      attachments: {
        select: { id: true, fileName: true, filePath: true, fileType: true, fileSize: true, uploadedAt: true, uploadedBy: { select: { id: true, name: true } } },
      },
    },
  });

const create = (data) =>
  prisma.maintenanceRequest.create({
    data,
    include: {
      asset: { select: { id: true, name: true, assetTag: true } },
      raisedBy: { select: { id: true, name: true, email: true } },
    },
  });

const updateById = (id, data) =>
  prisma.maintenanceRequest.update({
    where: { id },
    data,
    include: {
      asset: { select: { id: true, name: true, assetTag: true } },
      raisedBy: { select: { id: true, name: true } },
      technician: { select: { id: true, name: true } },
    },
  });

const softDeleteById = (id) =>
  prisma.maintenanceRequest.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

const getStats = (organizationId) =>
  prisma.maintenanceRequest.findMany({
    where: { deletedAt: null },
    include: { asset: { select: { organizationId: true } } },
  });

const countByStatus = (where) =>
  prisma.maintenanceRequest.groupBy({
    by: ['status'],
    where,
    _count: { status: true },
  });

const sumCosts = (where) =>
  prisma.maintenanceRequest.aggregate({
    where,
    _sum: { laborCost: true, partsCost: true, vendorCost: true, totalCost: true },
    _avg: { totalCost: true },
  });

module.exports = { findMany, findById, create, updateById, softDeleteById, getStats, countByStatus, sumCosts };

const prisma = require('../config/database');

const create = (data) =>
  prisma.maintenanceAttachment.create({ data });

const findByMaintenanceId = (maintenanceRequestId) =>
  prisma.maintenanceAttachment.findMany({
    where: { maintenanceRequestId },
    select: { id: true, fileName: true, filePath: true, fileType: true, fileSize: true, uploadedAt: true, uploadedBy: { select: { id: true, name: true } } },
    orderBy: { uploadedAt: 'desc' },
  });

const findById = (id) =>
  prisma.maintenanceAttachment.findUnique({ where: { id } });

const deleteById = (id) =>
  prisma.maintenanceAttachment.delete({ where: { id } });

module.exports = { create, findByMaintenanceId, findById, deleteById };

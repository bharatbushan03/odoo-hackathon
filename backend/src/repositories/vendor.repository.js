const prisma = require('../config/database');

const findMany = (organizationId, filters = {}) => {
  const where = { organizationId, deletedAt: null };
  if (filters.isActive !== undefined) where.isActive = filters.isActive;
  if (filters.isPreferred !== undefined) where.isPreferred = filters.isPreferred;
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { contactPerson: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } },
    ];
  }
  return prisma.vendor.findMany({
    where,
    orderBy: { name: 'asc' },
  });
};

const findById = (id) =>
  prisma.vendor.findFirst({
    where: { id, deletedAt: null },
    include: { _count: { select: { maintenanceRequests: true } } },
  });

const create = (data) =>
  prisma.vendor.create({ data });

const updateById = (id, data) =>
  prisma.vendor.update({ where: { id }, data });

const softDeleteById = (id) =>
  prisma.vendor.update({ where: { id }, data: { deletedAt: new Date() } });

module.exports = { findMany, findById, create, updateById, softDeleteById };

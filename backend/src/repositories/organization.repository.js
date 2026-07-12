const prisma = require('../config/database');

const create = (data) =>
  prisma.organization.create({ data });

const findByCode = (code) =>
  prisma.organization.findUnique({ where: { code, deletedAt: null } });

const findById = (id) =>
  prisma.organization.findUnique({ where: { id, deletedAt: null } });

module.exports = { create, findByCode, findById };

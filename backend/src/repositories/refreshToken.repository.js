const prisma = require('../config/database');

const create = (data) =>
  prisma.refreshToken.create({ data });

const findByToken = (token) =>
  prisma.refreshToken.findUnique({ where: { token } });

const revokeById = (id) =>
  prisma.refreshToken.update({ where: { id }, data: { revokedAt: new Date() } });

const revokeAllByEmployeeId = (employeeId) =>
  prisma.refreshToken.updateMany({
    where: { employeeId, revokedAt: null },
    data: { revokedAt: new Date() },
  });

const deleteExpired = () =>
  prisma.refreshToken.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });

module.exports = { create, findByToken, revokeById, revokeAllByEmployeeId, deleteExpired };

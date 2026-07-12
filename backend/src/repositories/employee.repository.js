const prisma = require('../config/database');

const create = (data) =>
  prisma.employee.create({ data });

const findByEmail = (email) =>
  prisma.employee.findUnique({ where: { email, deletedAt: null } });

const findById = (id) =>
  prisma.employee.findUnique({ where: { id, deletedAt: null } });

const updateById = (id, data) =>
  prisma.employee.update({ where: { id }, data });

const findByResetToken = (token) =>
  prisma.employee.findFirst({
    where: { resetPasswordToken: token, resetPasswordExpires: { gte: new Date() }, deletedAt: null },
  });

const findByVerificationToken = (token) =>
  prisma.employee.findFirst({
    where: { emailVerificationToken: token, emailVerificationExpires: { gte: new Date() }, deletedAt: null },
  });

module.exports = { create, findByEmail, findById, updateById, findByResetToken, findByVerificationToken };

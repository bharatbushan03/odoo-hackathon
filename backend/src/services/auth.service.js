const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const employeeRepo = require('../repositories/employee.repository');
const organizationRepo = require('../repositories/organization.repository');
const refreshTokenRepo = require('../repositories/refreshToken.repository');
const jwtConfig = require('../config/jwt');
const AppError = require('../utils/AppError');
const emailService = require('./email.service');

const SALT_ROUNDS = 12;

const hashPassword = async (password) => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

const generateAccessToken = (employee) => {
  return jwt.sign(
    { id: employee.id, email: employee.email, role: employee.role, organizationId: employee.organizationId },
    jwtConfig.accessToken.secret,
    { expiresIn: jwtConfig.accessToken.expiresIn }
  );
};

const generateRefreshToken = (employee) => {
  const token = jwt.sign(
    { id: employee.id },
    jwtConfig.refreshToken.secret,
    { expiresIn: jwtConfig.refreshToken.expiresIn }
  );

  const payload = jwt.decode(token);
  const expiresAt = new Date(payload.exp * 1000);

  return { token, expiresAt };
};

const saveRefreshToken = async (employeeId, token, expiresAt) => {
  return refreshTokenRepo.create({ token, employeeId, expiresAt });
};

const generateTokenPair = async (employee) => {
  const accessToken = generateAccessToken(employee);
  const { token: refreshToken, expiresAt } = generateRefreshToken(employee);
  await saveRefreshToken(employee.id, refreshToken, expiresAt);
  return { accessToken, refreshToken };
};

const registerOrganization = async ({ orgName, orgCode, name, email, password }) => {
  const existingOrg = await organizationRepo.findByCode(orgCode);
  if (existingOrg) {
    throw new AppError('Organization with this code already exists', 409);
  }

  const existingEmployee = await employeeRepo.findByEmail(email);
  if (existingEmployee) {
    throw new AppError('Email already registered', 409);
  }

  const org = await organizationRepo.create({ name: orgName, code: orgCode });
  const hashedPw = await hashPassword(password);

  const employee = await employeeRepo.create({
    name,
    email,
    password: hashedPw,
    role: 'ORG_ADMIN',
    organizationId: org.id,
  });

  const tokens = await generateTokenPair(employee);

  return {
    employee: { id: employee.id, name: employee.name, email: employee.email, role: employee.role, organizationId: employee.organizationId },
    ...tokens,
  };
};

const registerAdmin = async ({ name, email, password, organizationCode }) => {
  const org = await organizationRepo.findByCode(organizationCode);
  if (!org) {
    throw new AppError('Organization not found', 404);
  }

  const existingEmployee = await employeeRepo.findByEmail(email);
  if (existingEmployee) {
    throw new AppError('Email already registered', 409);
  }

  const hashedPw = await hashPassword(password);
  const employee = await employeeRepo.create({
    name,
    email,
    password: hashedPw,
    role: 'ORG_ADMIN',
    organizationId: org.id,
  });

  const tokens = await generateTokenPair(employee);

  return {
    employee: { id: employee.id, name: employee.name, email: employee.email, role: employee.role, organizationId: employee.organizationId },
    ...tokens,
  };
};

const login = async ({ email, password }) => {
  const employee = await employeeRepo.findByEmail(email);
  if (!employee) {
    throw new AppError('Invalid email or password', 401);
  }

  const isMatch = await bcrypt.compare(password, employee.password);
  if (!isMatch) {
    throw new AppError('Invalid email or password', 401);
  }

  const tokens = await generateTokenPair(employee);

  return {
    employee: { id: employee.id, name: employee.name, email: employee.email, role: employee.role, organizationId: employee.organizationId },
    ...tokens,
  };
};

const refreshToken = async (oldToken) => {
  let decoded;
  try {
    decoded = jwt.verify(oldToken, jwtConfig.refreshToken.secret);
  } catch {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  const storedToken = await refreshTokenRepo.findByToken(oldToken);
  if (!storedToken || storedToken.revokedAt) {
    if (storedToken) {
      await refreshTokenRepo.revokeAllByEmployeeId(storedToken.employeeId);
    }
    throw new AppError('Refresh token has been revoked', 401);
  }

  await refreshTokenRepo.revokeById(storedToken.id);

  const employee = await employeeRepo.findById(decoded.id);
  if (!employee) {
    throw new AppError('User not found', 401);
  }

  const tokens = await generateTokenPair(employee);

  return {
    employee: { id: employee.id, name: employee.name, email: employee.email, role: employee.role, organizationId: employee.organizationId },
    ...tokens,
  };
};

const logout = async (token) => {
  const storedToken = await refreshTokenRepo.findByToken(token);
  if (storedToken && !storedToken.revokedAt) {
    await refreshTokenRepo.revokeById(storedToken.id);
  }
};

const forgotPassword = async ({ email }) => {
  const employee = await employeeRepo.findByEmail(email);
  if (!employee) {
    return;
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetExpires = new Date(Date.now() + 60 * 60 * 1000);

  await employeeRepo.updateById(employee.id, {
    resetPasswordToken: resetToken,
    resetPasswordExpires: resetExpires,
  });

  try {
    await emailService.sendPasswordResetEmail(employee.email, resetToken);
  } catch {
    await employeeRepo.updateById(employee.id, {
      resetPasswordToken: null,
      resetPasswordExpires: null,
    });
  }
};

const resetPassword = async ({ token, password }) => {
  const employee = await employeeRepo.findByResetToken(token);
  if (!employee) {
    throw new AppError('Invalid or expired reset token', 400);
  }

  const hashedPw = await hashPassword(password);
  await employeeRepo.updateById(employee.id, {
    password: hashedPw,
    resetPasswordToken: null,
    resetPasswordExpires: null,
  });
};

const changePassword = async (employeeId, { currentPassword, newPassword }) => {
  const employee = await employeeRepo.findById(employeeId);
  if (!employee) {
    throw new AppError('User not found', 404);
  }

  const isMatch = await bcrypt.compare(currentPassword, employee.password);
  if (!isMatch) {
    throw new AppError('Current password is incorrect', 400);
  }

  const hashedPw = await hashPassword(newPassword);
  await employeeRepo.updateById(employeeId, { password: hashedPw });
  await refreshTokenRepo.revokeAllByEmployeeId(employeeId);
};

const verifyEmail = async ({ token }) => {
  const employee = await employeeRepo.findByVerificationToken(token);
  if (!employee) {
    throw new AppError('Invalid or expired verification token', 400);
  }

  await employeeRepo.updateById(employee.id, {
    emailVerified: true,
    emailVerificationToken: null,
    emailVerificationExpires: null,
  });
};

module.exports = {
  registerOrganization,
  registerAdmin,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
  verifyEmail,
  generateTokenPair,
};

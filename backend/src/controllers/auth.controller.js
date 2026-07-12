const authService = require('../services/auth.service');
const auditLog = require('../utils/auditLog');
const asyncHandler = require('../utils/asyncHandler');

const getIp = (req) => req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';
const getUa = (req) => req.headers['user-agent'] || '';

const registerOrganization = asyncHandler(async (req, res) => {
  console.log('controller registerOrganization called');
  const result = await authService.registerOrganization(req.body);
  auditLog.logAuth({ organizationId: result.employee.organizationId, employeeId: result.employee.id, action: 'REGISTER_ORG', ipAddress: getIp(req), userAgent: getUa(req) });
  res.status(201).json({ success: true, message: 'Organization registered successfully', data: result });
});

const registerAdmin = asyncHandler(async (req, res) => {
  const result = await authService.registerAdmin(req.body);
  auditLog.logAuth({ organizationId: result.employee.organizationId, employeeId: result.employee.id, action: 'REGISTER_ADMIN', ipAddress: getIp(req), userAgent: getUa(req) });
  res.status(201).json({ success: true, message: 'Admin registered successfully', data: result });
});

const registerEmployee = asyncHandler(async (req, res) => {
  const result = await authService.registerEmployee(req.body);
  auditLog.logAuth({ organizationId: result.employee.organizationId, employeeId: result.employee.id, action: 'REGISTER_EMPLOYEE', ipAddress: getIp(req), userAgent: getUa(req) });
  res.status(201).json({ success: true, message: 'Employee registered successfully', data: result });
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  auditLog.logAuth({ organizationId: result.employee.organizationId, employeeId: result.employee.id, action: 'LOGIN', ipAddress: getIp(req), userAgent: getUa(req) });
  res.json({ success: true, message: 'Login successful', data: result });
});

const refreshToken = asyncHandler(async (req, res) => {
  const result = await authService.refreshToken(req.body.refreshToken);
  res.json({ success: true, message: 'Token refreshed successfully', data: result });
});

const logout = asyncHandler(async (req, res) => {
  const result = await authService.logout(req.body.refreshToken);
  res.json({ success: true, message: 'Logged out successfully' });
});

const forgotPassword = asyncHandler(async (req, res) => {
  await authService.forgotPassword(req.body);
  res.json({ success: true, message: 'If the email exists, a reset link has been sent' });
});

const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.body);
  res.json({ success: true, message: 'Password reset successfully' });
});

const changePassword = asyncHandler(async (req, res) => {
  await authService.changePassword(req.user.id, req.body);
  res.json({ success: true, message: 'Password changed successfully' });
});

const verifyEmail = asyncHandler(async (req, res) => {
  await authService.verifyEmail(req.body);
  res.json({ success: true, message: 'Email verified successfully' });
});

module.exports = {
  registerOrganization,
  registerAdmin,
  registerEmployee,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
  verifyEmail,
};

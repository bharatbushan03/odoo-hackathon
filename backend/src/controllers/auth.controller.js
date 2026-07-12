const authService = require('../services/auth.service');
const asyncHandler = require('../utils/asyncHandler');

const registerOrganization = asyncHandler(async (req, res) => {
  const result = await authService.registerOrganization(req.body);
  res.status(201).json({ success: true, message: 'Organization registered successfully', data: result });
});

const registerAdmin = asyncHandler(async (req, res) => {
  const result = await authService.registerAdmin(req.body);
  res.status(201).json({ success: true, message: 'Admin registered successfully', data: result });
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  res.json({ success: true, message: 'Login successful', data: result });
});

const refreshToken = asyncHandler(async (req, res) => {
  const result = await authService.refreshToken(req.body.refreshToken);
  res.json({ success: true, message: 'Token refreshed successfully', data: result });
});

const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.body.refreshToken);
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
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
  verifyEmail,
};

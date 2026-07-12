const { body } = require('express-validator');

const registerOrganization = [
  body('orgName').trim().notEmpty().withMessage('Organization name is required'),
  body('orgCode').trim().notEmpty().withMessage('Organization code is required'),
  body('name').trim().notEmpty().withMessage('Admin name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain a number'),
];

const registerAdmin = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain a number'),
  body('organizationCode').trim().notEmpty().withMessage('Organization code is required'),
];

const registerEmployee = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain a number'),
  body('organizationCode').trim().notEmpty().withMessage('Organization code is required'),
];

const login = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const refreshToken = [
  body('refreshToken').notEmpty().withMessage('Refresh token is required'),
];

const logout = [
  body('refreshToken').notEmpty().withMessage('Refresh token is required'),
];

const forgotPassword = [
  body('email').isEmail().withMessage('Valid email is required'),
];

const resetPassword = [
  body('token').notEmpty().withMessage('Token is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain a number'),
];

const changePassword = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('New password must contain an uppercase letter')
    .matches(/[a-z]/).withMessage('New password must contain a lowercase letter')
    .matches(/[0-9]/).withMessage('New password must contain a number'),
];

const verifyEmail = [
  body('token').notEmpty().withMessage('Verification token is required'),
];

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

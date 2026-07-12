const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const validate = require('../middleware/validate');
const validators = require('../validators/auth.validator');

const router = Router();

router.post('/register-organization', authLimiter, validators.registerOrganization, validate, authController.registerOrganization);
router.post('/register', authLimiter, validators.registerAdmin, validate, authController.registerAdmin);
router.post('/login', authLimiter, validators.login, validate, authController.login);
router.post('/refresh-token', authLimiter, validators.refreshToken, validate, authController.refreshToken);
router.post('/logout', authLimiter, validators.logout, validate, authController.logout);
router.post('/forgot-password', authLimiter, validators.forgotPassword, validate, authController.forgotPassword);
router.post('/reset-password', authLimiter, validators.resetPassword, validate, authController.resetPassword);
router.post('/verify-email', authLimiter, validators.verifyEmail, validate, authController.verifyEmail);
router.post('/change-password', authenticate, validators.changePassword, validate, authController.changePassword);

module.exports = router;

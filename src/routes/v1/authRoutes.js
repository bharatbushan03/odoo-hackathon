const express = require('express');
const { authController } = require('../../controllers');
const { authenticate } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { loginSchema, signupSchema, forgotPasswordSchema } = require('../../validators');

const router = express.Router();

router.post('/login', validate(loginSchema), authController.login);
router.post('/signup', validate(signupSchema), authController.signup);
router.get('/me', authenticate, authController.me);
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);

module.exports = router;

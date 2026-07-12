const express = require('express');
const { signup, login, forgotPassword, me } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.post('/signup', signup);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.get('/me', authenticate, me);

module.exports = router;

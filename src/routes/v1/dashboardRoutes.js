const express = require('express');
const { dashboardController } = require('../../controllers');
const { authenticate } = require('../../middleware/auth');

const router = express.Router();

router.get('/', authenticate, dashboardController.getSummary);

module.exports = router;

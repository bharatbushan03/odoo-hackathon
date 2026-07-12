const express = require('express');
const config = require('../config');
const v1Routes = require('./v1');

const router = express.Router();

router.use(config.apiPrefix, v1Routes);

module.exports = router;

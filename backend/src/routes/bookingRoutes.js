const express = require('express');
const { createBooking, listBookings, getBooking, cancelBooking } = require('../controllers/bookingController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.post('/', authorize('EMPLOYEE', 'ADMIN', 'ASSET_MANAGER', 'DEPT_HEAD'), createBooking);
router.get('/', authorize('EMPLOYEE', 'ADMIN', 'ASSET_MANAGER', 'DEPT_HEAD'), listBookings);
router.get('/:id', authorize('EMPLOYEE', 'ADMIN', 'ASSET_MANAGER', 'DEPT_HEAD'), getBooking);
router.patch('/:id/cancel', authorize('EMPLOYEE', 'ADMIN', 'ASSET_MANAGER', 'DEPT_HEAD'), cancelBooking);

module.exports = router;
const express = require('express');
const {
  createBooking,
  getMyBookings,
  cancelBooking,
  scanEntry,
  scanExit,
} = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

const router = express.Router();

router.post('/', protect, authorize('user'), createBooking);
router.get('/my', protect, authorize('user'), getMyBookings);
router.patch('/:id/cancel', protect, authorize('user'), cancelBooking);

router.post('/entry', protect, authorize('guard', 'admin'), scanEntry);
router.post('/exit', protect, authorize('guard', 'admin'), scanExit);

module.exports = router;

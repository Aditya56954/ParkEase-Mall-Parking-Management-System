const express = require('express');
const {
  createMall,
  getMyMalls,
  listMalls,
  getMall,
  approveMall,
  rejectMall,
  assignGuard,
} = require('../controllers/mallController');
const { generateSlots, listSlots } = require('../controllers/slotController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

const router = express.Router();

router.post('/', protect, authorize('mallOwner'), createMall);
router.get('/my', protect, authorize('mallOwner'), getMyMalls);
router.get('/', protect, listMalls);
router.get('/:id', protect, getMall);

router.patch('/:id/approve', protect, authorize('admin'), approveMall);
router.patch('/:id/reject', protect, authorize('admin'), rejectMall);
router.patch('/:id/assign-guard', protect, authorize('mallOwner', 'admin'), assignGuard);

// Slots nested under a mall
router.post('/:mallId/slots/generate', protect, authorize('mallOwner', 'admin'), generateSlots);
router.get('/:mallId/slots', protect, listSlots);

module.exports = router;

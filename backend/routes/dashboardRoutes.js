const express = require('express');
const { getMallDashboard, getAdminOverview } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

const router = express.Router();

router.get('/admin/overview', protect, authorize('admin'), getAdminOverview);
router.get('/:mallId', protect, authorize('mallOwner', 'admin'), getMallDashboard);

module.exports = router;

const express = require('express');
const {
  createPrivilegedUser,
  listUsers,
  deactivateUser,
  assignGuard,
} = require('../controllers/adminController');

const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

const router = express.Router();

router.use(protect, authorize('admin'));

router.post('/users', createPrivilegedUser);
router.get('/users', listUsers);
router.patch('/users/:id/deactivate', deactivateUser);

// NEW ROUTE
router.patch('/guards/:id/assign', assignGuard);

module.exports = router;
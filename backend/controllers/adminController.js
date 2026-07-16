const User = require('../models/User');
const Mall = require('../models/Mall');
const { asyncHandler } = require('../middleware/errorHandler');

// @route PATCH /api/admin/guards/:id/assign
// @access admin
const assignGuard = asyncHandler(async (req, res) => {
  const { mallId } = req.body;

  const guard = await User.findById(req.params.id);

  if (!guard) {
    return res.status(404).json({
      success: false,
      message: 'Guard not found',
    });
  }

  if (guard.role !== 'guard') {
    return res.status(400).json({
      success: false,
      message: 'User is not a guard',
    });
  }

  const mall = await Mall.findById(mallId);

  if (!mall) {
    return res.status(404).json({
      success: false,
      message: 'Mall not found',
    });
  }

  guard.assignedMall = mall._id;
  await guard.save();

  res.json({
    success: true,
    message: 'Guard assigned successfully',
    data: guard,
  });
});


// @route POST /api/admin/users
// @access admin
// Only admins can create 'guard' or 'admin' accounts - this is the sole
// entry point for privileged roles, since /api/auth/register deliberately
// refuses to assign them.
const createPrivilegedUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!['guard', 'admin', 'mallOwner', 'user'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Invalid role' });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) return res.status(409).json({ success: false, message: 'Email already registered' });

  const user = await User.create({ name, email, password, role });

  res.status(201).json({
    success: true,
    data: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
});

// @route GET /api/admin/users
// @access admin
const listUsers = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.role) filter.role = req.query.role;

 const users = await User.find(filter)
  .populate('assignedMall', 'name')
  .sort('-createdAt');
  res.json({ success: true, data: users });
});

// @route PATCH /api/admin/users/:id/deactivate
// @access admin
const deactivateUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, data: user });
});

module.exports = {
  createPrivilegedUser,
  listUsers,
  deactivateUser,
  assignGuard,
};

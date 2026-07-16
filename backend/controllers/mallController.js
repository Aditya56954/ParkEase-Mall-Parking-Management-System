const Mall = require('../models/Mall');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');

// @route POST /api/malls
// @access mallOwner
// Creates a mall in 'pending' state. It cannot accept bookings/slots until
// an admin approves it (see approveMall below).
const createMall = asyncHandler(async (req, res) => {
  const { name, address, lat, lng } = req.body;
  if (!name || !address) {
    return res.status(400).json({ success: false, message: 'name and address are required' });
  }

  const mall = await Mall.create({
    name,
    address,
    location: { lat, lng },
    owner: req.user._id,
    status: 'pending',
  });

  res.status(201).json({ success: true, data: mall });
});

// @route GET /api/malls/my
// @access mallOwner
const getMyMalls = asyncHandler(async (req, res) => {
  const malls = await Mall.find({ owner: req.user._id }).sort('-createdAt');
  res.json({ success: true, data: malls });
});

// @route GET /api/malls
// @access admin (all malls), public users get only approved malls
const listMalls = asyncHandler(async (req, res) => {
  const filter = req.user && req.user.role === 'admin' ? {} : { status: 'approved' };
  if (req.query.status && req.user && req.user.role === 'admin') filter.status = req.query.status;

  const malls = await Mall.find(filter).populate('owner', 'name email').sort('-createdAt');
  res.json({ success: true, data: malls });
});

// @route GET /api/malls/:id
const getMall = asyncHandler(async (req, res) => {
  const mall = await Mall.findById(req.params.id).populate('owner', 'name email');
  if (!mall) return res.status(404).json({ success: false, message: 'Mall not found' });
  res.json({ success: true, data: mall });
});

// @route PATCH /api/malls/:id/approve
// @access admin
const approveMall = asyncHandler(async (req, res) => {
  const mall = await Mall.findById(req.params.id);
  if (!mall) return res.status(404).json({ success: false, message: 'Mall not found' });
  if (mall.status !== 'pending') {
    return res.status(400).json({ success: false, message: `Mall is already ${mall.status}` });
  }

  mall.status = 'approved';
  mall.reviewedBy = req.user._id;
  mall.reviewedAt = new Date();
  mall.rejectionReason = null;
  await mall.save();

  res.json({ success: true, data: mall });
});

// @route PATCH /api/malls/:id/reject
// @access admin
const rejectMall = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const mall = await Mall.findById(req.params.id);
  if (!mall) return res.status(404).json({ success: false, message: 'Mall not found' });
  if (mall.status !== 'pending') {
    return res.status(400).json({ success: false, message: `Mall is already ${mall.status}` });
  }

  mall.status = 'rejected';
  mall.rejectionReason = reason || 'Not specified';
  mall.reviewedBy = req.user._id;
  mall.reviewedAt = new Date();
  await mall.save();

  res.json({ success: true, data: mall });
});

// @route PATCH /api/malls/:id/assign-guard
// @access mallOwner (own mall only) or admin
const assignGuard = asyncHandler(async (req, res) => {
  const { guardId } = req.body;
  const mall = await Mall.findById(req.params.id);
  if (!mall) return res.status(404).json({ success: false, message: 'Mall not found' });

  if (req.user.role === 'mallOwner' && String(mall.owner) !== String(req.user._id)) {
    return res.status(403).json({ success: false, message: 'You do not own this mall' });
  }
  if (mall.status !== 'approved') {
    return res.status(400).json({ success: false, message: 'Mall must be approved before assigning guards' });
  }

  const guard = await User.findById(guardId);
  if (!guard || guard.role !== 'guard') {
    return res.status(400).json({ success: false, message: 'guardId must reference a user with role "guard"' });
  }

  guard.assignedMall = mall._id;
  await guard.save();

  res.json({ success: true, data: { guardId: guard._id, assignedMall: mall._id } });
});

module.exports = { createMall, getMyMalls, listMalls, getMall, approveMall, rejectMall, assignGuard };

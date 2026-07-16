const mongoose = require('mongoose');
const Mall = require('../models/Mall');
const Slot = require('../models/Slot');
const Booking = require('../models/Booking');
const { asyncHandler } = require('../middleware/errorHandler');

// @route GET /api/dashboard/:mallId
// @access mallOwner (own mall) or admin
// Runs slot-count and revenue aggregations concurrently with Promise.all
// instead of sequentially - they read different collections and don't
// depend on each other, so there's no reason to pay their latency twice.
const getMallDashboard = asyncHandler(async (req, res) => {
  const { mallId } = req.params;

  const mall = await Mall.findById(mallId);
  if (!mall) return res.status(404).json({ success: false, message: 'Mall not found' });
  if (req.user.role === 'mallOwner' && String(mall.owner) !== String(req.user._id)) {
    return res.status(403).json({ success: false, message: 'You do not own this mall' });
  }

  const mallObjectId = new mongoose.Types.ObjectId(mallId);

  const [slotCounts, revenueStats] = await Promise.all([
    Slot.aggregate([
      { $match: { mall: mallObjectId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Booking.aggregate([
      { $match: { mall: mallObjectId, status: 'completed' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          completedBookings: { $sum: 1 },
          avgAmount: { $avg: '$amount' },
        },
      },
    ]),
  ]);

  const slotSummary = { available: 0, booked: 0, occupied: 0, disabled: 0 };
  slotCounts.forEach((s) => {
    slotSummary[s._id] = s.count;
  });

  const revenue = revenueStats[0] || { totalRevenue: 0, completedBookings: 0, avgAmount: 0 };

  res.json({
    success: true,
    data: {
      mall: { id: mall._id, name: mall.name, status: mall.status, totalSlots: mall.totalSlots },
      slots: slotSummary,
      revenue: {
        totalRevenue: revenue.totalRevenue,
        completedBookings: revenue.completedBookings,
        avgAmount: Math.round((revenue.avgAmount || 0) * 100) / 100,
      },
    },
  });
});

// @route GET /api/dashboard/admin/overview
// @access admin
// Platform-wide view: same parallelization idea across all malls.
const getAdminOverview = asyncHandler(async (req, res) => {
  const [mallStatusCounts, slotStatusCounts, revenueStats] = await Promise.all([
    Mall.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Slot.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Booking.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, totalRevenue: { $sum: '$amount' }, completedBookings: { $sum: 1 } } },
    ]),
  ]);

  const toMap = (arr) => arr.reduce((acc, x) => ({ ...acc, [x._id]: x.count }), {});
  const revenue = revenueStats[0] || { totalRevenue: 0, completedBookings: 0 };

  res.json({
    success: true,
    data: {
      malls: toMap(mallStatusCounts),
      slots: toMap(slotStatusCounts),
      revenue: { totalRevenue: revenue.totalRevenue, completedBookings: revenue.completedBookings },
    },
  });
});

module.exports = { getMallDashboard, getAdminOverview };

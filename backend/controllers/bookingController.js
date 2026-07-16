const Mall = require('../models/Mall');
const Slot = require('../models/Slot');
const Booking = require('../models/Booking');
const { asyncHandler } = require('../middleware/errorHandler');
const { generateToken, generateQRDataUrl } = require('../utils/qr');
const { calculateAmount } = require('../utils/billing');

// @route POST /api/bookings
// @access user
// Auto-allocates a slot and creates a booking + QR code.
//
// Concurrency notes:
// 1. Slot allocation uses findOneAndUpdate({mall, status:'available'}, {$set:{status:'booked'}})
//    which is a single atomic document operation in MongoDB - two simultaneous
//    requests can never be handed the same slot, even without a session/transaction.
// 2. The one-active-booking-per-user rule is enforced by a partial unique index
//    on Booking (see models/Booking.js), not just an application-level check -
//    so it holds even if two requests from the same user race each other.
// 3. If the Booking insert fails after a slot was already claimed (e.g. because
//    of #2), the slot is released back to 'available' as a compensating action.
const createBooking = asyncHandler(async (req, res) => {
  const { mallId, vehicleNumber } = req.body;
  if (!mallId || !vehicleNumber) {
    return res.status(400).json({ success: false, message: 'mallId and vehicleNumber are required' });
  }

  const mall = await Mall.findById(mallId);
  if (!mall || mall.status !== 'approved') {
    return res.status(400).json({ success: false, message: 'Mall not found or not approved' });
  }

  // Step 1: atomically claim a free slot
  const slot = await Slot.findOneAndUpdate(
    { mall: mall._id, status: 'available' },
    { $set: { status: 'booked' } },
    { new: true }
  );

  if (!slot) {
    return res.status(409).json({ success: false, message: 'No available slots in this mall right now' });
  }

  const ratePerHour = Number(process.env.RATE_PER_HOUR || 30);
  const qrToken = generateToken();

  let booking;
  try {
    booking = await Booking.create({
      user: req.user._id,
      mall: mall._id,
      slot: slot._id,
      vehicleNumber,
      qrToken,
      ratePerHour,
      status: 'booked',
    });
  } catch (err) {
    // Compensating action: release the slot we claimed above since no booking
    // actually exists for it (most likely cause: duplicate active-booking index hit).
    await Slot.findByIdAndUpdate(slot._id, { $set: { status: 'available' } });
    throw err;
  }

  const qrDataUrl = await generateQRDataUrl(qrToken);

  res.status(201).json({
    success: true,
    data: {
      booking,
      qrCode: qrDataUrl,
    },
  });
});

// @route GET /api/bookings/my
// @access user
const getMyBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id })
    .populate('mall', 'name address')
    .populate('slot', 'slotNumber floor')
    .sort('-createdAt');
  res.json({ success: true, data: bookings });
});

// @route PATCH /api/bookings/:id/cancel
// @access user (own booking, only before entry)
const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
  if (String(booking.user) !== String(req.user._id)) {
    return res.status(403).json({ success: false, message: 'Not your booking' });
  }
  if (booking.status !== 'booked') {
    return res.status(400).json({ success: false, message: `Cannot cancel a booking with status '${booking.status}'` });
  }

  booking.status = 'cancelled';
  await booking.save();
  await Slot.findByIdAndUpdate(booking.slot, { $set: { status: 'available' } });

  res.json({ success: true, data: booking });
});

// @route POST /api/bookings/entry
// @access guard
// Body: { qrToken }
const scanEntry = asyncHandler(async (req, res) => {
  const { qrToken } = req.body;
  if (!qrToken) return res.status(400).json({ success: false, message: 'qrToken is required' });

  const booking = await Booking.findOne({ qrToken }).populate('slot');
  if (!booking) return res.status(404).json({ success: false, message: 'Invalid QR code / booking not found' });

  if (req.user.role === 'guard' && String(req.user.assignedMall) !== String(booking.mall)) {
    return res.status(403).json({ success: false, message: 'This booking belongs to a different mall' });
  }

  if (booking.status !== 'booked') {
    return res.status(400).json({
      success: false,
      message: `Entry rejected: booking status is '${booking.status}', expected 'booked'`,
    });
  }

  booking.status = 'active';
  booking.entryTime = new Date();
  await booking.save();

  await Slot.findByIdAndUpdate(booking.slot._id, { $set: { status: 'occupied' } });

  res.json({ success: true, message: 'Entry approved', data: booking });
});

// @route POST /api/bookings/exit
// @access guard
// Body: { qrToken }
const scanExit = asyncHandler(async (req, res) => {
  const { qrToken } = req.body;
  if (!qrToken) return res.status(400).json({ success: false, message: 'qrToken is required' });

  const booking = await Booking.findOne({ qrToken });
  if (!booking) return res.status(404).json({ success: false, message: 'Invalid QR code / booking not found' });

  if (req.user.role === 'guard' && String(req.user.assignedMall) !== String(booking.mall)) {
    return res.status(403).json({ success: false, message: 'This booking belongs to a different mall' });
  }

  // Server-side state validation: exit can only be processed for a booking
  // that actually entered. This blocks skipping straight to exit, replaying
  // an old QR after checkout, etc.
  if (booking.status !== 'active') {
    return res.status(400).json({
      success: false,
      message: `Exit rejected: booking status is '${booking.status}', expected 'active'`,
    });
  }

  const exitTime = new Date();
  const { minutes, hours, amount } = calculateAmount(booking.entryTime, exitTime, booking.ratePerHour);

  booking.status = 'completed';
  booking.exitTime = exitTime;
  booking.amount = amount;
  await booking.save();

  await Slot.findByIdAndUpdate(booking.slot, { $set: { status: 'available' } });

  res.json({
    success: true,
    message: 'Exit approved',
    data: { booking, billing: { minutes, hours, ratePerHour: booking.ratePerHour, amount } },
  });
});

module.exports = { createBooking, getMyBookings, cancelBooking, scanEntry, scanExit };

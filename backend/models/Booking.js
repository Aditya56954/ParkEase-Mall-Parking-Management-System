const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    mall: { type: mongoose.Schema.Types.ObjectId, ref: 'Mall', required: true },
    slot: { type: mongoose.Schema.Types.ObjectId, ref: 'Slot', required: true },
    vehicleNumber: { type: String, required: true, uppercase: true, trim: true },

    // booked   -> slot reserved, vehicle not yet on premises
    // active   -> vehicle has entered (QR scanned at entry gate)
    // completed-> vehicle has exited, billed
    // cancelled-> booking cancelled before entry
    status: {
      type: String,
      enum: ['booked', 'active', 'completed', 'cancelled'],
      default: 'booked',
    },

    qrToken: { type: String, required: true, unique: true },

    entryTime: { type: Date, default: null },
    exitTime: { type: Date, default: null },

    ratePerHour: { type: Number, required: true },
    amount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Enforces "one active booking per user": a partial unique index that only
// applies while status is 'booked' or 'active'. Mongo rejects a second insert
// for the same user while one of those documents already exists, so the
// constraint holds even under concurrent requests (not just app-level checks).
bookingSchema.index(
  { user: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ['booked', 'active'] } },
  }
);

bookingSchema.index({ mall: 1, status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);

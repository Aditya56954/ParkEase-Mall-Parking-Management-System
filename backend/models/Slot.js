const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema(
  {
    mall: { type: mongoose.Schema.Types.ObjectId, ref: 'Mall', required: true },
    slotNumber: { type: String, required: true },
    floor: { type: String, default: 'Ground' },
    status: {
      type: String,
      enum: ['available', 'booked', 'occupied', 'disabled'],
      default: 'available',
    },
  },
  { timestamps: true }
);

// A slot number must be unique within a given mall
slotSchema.index({ mall: 1, slotNumber: 1 }, { unique: true });
// Speeds up the "find one available slot in mall" query used for auto-allocation
slotSchema.index({ mall: 1, status: 1 });

module.exports = mongoose.model('Slot', slotSchema);

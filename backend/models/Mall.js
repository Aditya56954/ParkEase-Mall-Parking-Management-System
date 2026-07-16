const mongoose = require('mongoose');

const mallSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true },
    location: {
      lat: { type: Number },
      lng: { type: Number },
    },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    rejectionReason: { type: String, default: null },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
    totalSlots: { type: Number, default: 0 }, // kept in sync when slots are generated
  },
  { timestamps: true }
);

module.exports = mongoose.model('Mall', mallSchema);

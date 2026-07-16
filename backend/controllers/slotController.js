const Mall = require('../models/Mall');
const Slot = require('../models/Slot');
const { asyncHandler } = require('../middleware/errorHandler');

// @route POST /api/malls/:mallId/slots/generate
// @access mallOwner (own approved mall) or admin
// Bulk-creates slots, e.g. { "floor": "P1", "count": 50, "prefix": "P1-" }
const generateSlots = asyncHandler(async (req, res) => {
  const { floor = 'Ground', count, prefix = '' } = req.body;
  const mall = await Mall.findById(req.params.mallId);
  if (!mall) return res.status(404).json({ success: false, message: 'Mall not found' });

  if (req.user.role === 'mallOwner' && String(mall.owner) !== String(req.user._id)) {
    return res.status(403).json({ success: false, message: 'You do not own this mall' });
  }
  if (mall.status !== 'approved') {
    return res.status(400).json({ success: false, message: 'Mall must be approved before adding slots' });
  }
  if (!count || count < 1 || count > 2000) {
    return res.status(400).json({ success: false, message: 'count must be between 1 and 2000' });
  }

  const existingCount = await Slot.countDocuments({ mall: mall._id });
  const docs = Array.from({ length: count }, (_, i) => ({
    mall: mall._id,
    floor,
    slotNumber: `${prefix}${existingCount + i + 1}`,
  }));

  const created = await Slot.insertMany(docs, { ordered: false });

  mall.totalSlots = existingCount + created.length;
  await mall.save();

  res.status(201).json({ success: true, data: { created: created.length, totalSlots: mall.totalSlots } });
});

// @route GET /api/malls/:mallId/slots
const listSlots = asyncHandler(async (req, res) => {
  const filter = { mall: req.params.mallId };
  if (req.query.status) filter.status = req.query.status;

  const slots = await Slot.find(filter).sort('slotNumber');
  res.json({ success: true, data: slots });
});

module.exports = { generateSlots, listSlots };

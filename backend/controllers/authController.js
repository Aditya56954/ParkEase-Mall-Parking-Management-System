const User = require('../models/User');
const generateJWT = require('../utils/generateJWT');
const { asyncHandler } = require('../middleware/errorHandler');

// @route POST /api/auth/register
// @desc  Register a user. Public self-registration is allowed for 'user' and
//        'mallOwner' roles only - 'guard' and 'admin' accounts must be created
//        by an admin (see adminController) so privileged roles can't be
//        self-assigned.
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'name, email and password are required' });
  }

  const allowedSelfRoles = ['user', 'mallOwner'];
  const finalRole = allowedSelfRoles.includes(role) ? role : 'user';

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ success: false, message: 'Email already registered' });
  }

  const user = await User.create({ name, email, password, role: finalRole });

  res.status(201).json({
    success: true,
    data: {
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      token: generateJWT(user._id),
    },
  });
});

// @route POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'email and password are required' });
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }
  if (!user.isActive) {
    return res.status(403).json({ success: false, message: 'Account is deactivated' });
  }

  res.json({
    success: true,
    data: {
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      token: generateJWT(user._id),
    },
  });
});

// @route GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, data: req.user });
});

module.exports = { register, login, getMe };

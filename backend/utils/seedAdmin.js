/**
 * Bootstraps the very first admin account, since privileged accounts can
 * only otherwise be created by an existing admin (chicken-and-egg problem).
 * Run with: npm run seed:admin
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');

(async () => {
  await connectDB();

  const email = (process.env.ADMIN_EMAIL || 'admin@parkease.com').toLowerCase();
  const existing = await User.findOne({ email });

  if (existing) {
    console.log(`Admin already exists: ${email}`);
  } else {
    await User.create({
      name: process.env.ADMIN_NAME || 'Super Admin',
      email,
      password: process.env.ADMIN_PASSWORD || 'ChangeMe123!',
      role: 'admin',
    });
    console.log(`Admin created: ${email}`);
  }

  await mongoose.disconnect();
  process.exit(0);
})();

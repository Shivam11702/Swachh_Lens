const bcrypt = require('bcryptjs');
const { connect, mongoose } = require('../src/db');
const { User } = require('../src/models');

// Creates (or rotates) the admin account from env vars.
// Production requires ADMIN_EMAIL + ADMIN_PASSWORD to be set explicitly;
// this script refuses to run with missing or weak passwords.
//
//   npm run seed:admin   # uses ADMIN_EMAIL / ADMIN_PASSWORD from .env
//
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

const WEAK_PASSWORDS = ['12345', 'password', 'admin', 'Admin@12345', 'admin123'];

function validateInput() {
  const problems = [];
  if (!ADMIN_EMAIL || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ADMIN_EMAIL)) {
    problems.push('ADMIN_EMAIL must be a valid email address.');
  }
  if (!ADMIN_PASSWORD) {
    problems.push('ADMIN_PASSWORD must be set.');
  } else {
    if (ADMIN_PASSWORD.length < 12) {
      problems.push('ADMIN_PASSWORD must be at least 12 characters.');
    }
    if (WEAK_PASSWORDS.includes(ADMIN_PASSWORD)) {
      problems.push('ADMIN_PASSWORD is a known weak/common password.');
    }
  }
  if (problems.length > 0) {
    console.error('Seed admin validation failed:');
    problems.forEach((p) => console.error(`  - ${p}`));
    process.exit(1);
  }
}

async function seedAdmin() {
  await connect();

  validateInput();

  const email = ADMIN_EMAIL.toLowerCase();
  const password_hash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  const existing = await User.findOne({ email });
  if (existing) {
    await User.updateOne({ email }, { $set: { password_hash, is_active: true, role: 'admin' } });
    console.log(`Admin password rotated: ${email} (id: ${existing.user_id})`);
  } else {
    const user_id = `U${Date.now()}${Math.random().toString(36).substring(2, 8)}`;
    await User.create({
      user_id,
      email,
      password_hash,
      name: 'Swach Lens Admin',
      role: 'admin',
      phone: '+91 90000 00000',
      is_active: true,
    });
    console.log(`Created admin: ${email} (id: ${user_id})`);
  }
}

seedAdmin()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
  });

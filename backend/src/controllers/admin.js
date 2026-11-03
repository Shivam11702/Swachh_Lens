const { User } = require('../models');
const { connect } = require('../db');
const { asyncHandler } = require('../utils/response');
const { NotFoundError, ForbiddenError } = require('../utils/errors');
const { logger } = require('../utils/logger');
const { requireAuth, hasPermission } = require('../middleware/auth');

async function listUsers(req, res) {
  await connect();
  
  if (!hasPermission(req.user.role, 'users:read')) {
    throw new ForbiddenError();
  }
  
  const { page, limit, role, team_id, is_active } = req.validated.query;
  
  const q = {};
  if (role) q.role = role;
  if (team_id) q.team_id = team_id;
  if (is_active !== undefined) q.is_active = is_active;
  
  const skip = Math.max(0, (page - 1)) * limit;
  
  const [items, total] = await Promise.all([
    User.find(q).select('-password_hash').sort({ created_at: -1 }).skip(skip).limit(Number(limit)).lean(),
    User.countDocuments(q),
  ]);
  
  return res.json({
    success: true,
    data: items,
    meta: {
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
  });
}

async function getUser(req, res) {
  await connect();
  
  if (!hasPermission(req.user.role, 'users:read')) {
    throw new ForbiddenError();
  }
  
  const user = await User.findById(req.params.userId).select('-password_hash').lean();
  if (!user) {
    throw new NotFoundError('User');
  }
  
  return res.json({
    success: true,
    data: user,
  });
}

async function createUser(req, res) {
  await connect();
  
  if (!hasPermission(req.user.role, 'users:create')) {
    throw new ForbiddenError();
  }
  
  const { email, password, name, role, team_id, phone } = req.validated.body;
  
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new ValidationError('Email already registered');
  }
  
  const bcrypt = require('bcryptjs');
  const password_hash = await bcrypt.hash(password, 12);
  const user_id = `U${Date.now()}${Math.random().toString(36).substring(2, 8)}`;
  
  const user = new User({ 
    user_id, 
    email: email.toLowerCase(), 
    password_hash, 
    name, 
    role: role || 'citizen', 
    team_id, 
    phone 
  });
  await user.save();
  
  logger.info('User created by admin', { userId: user_id, email, createdBy: req.user.userId });
  
  const { password_hash: _, ...safeUser } = user.toObject();
  
  return res.status(201).json({
    success: true,
    data: safeUser,
  });
}

async function updateUser(req, res) {
  await connect();
  
  if (!hasPermission(req.user.role, 'users:update')) {
    throw new ForbiddenError();
  }
  
  const allowedUpdates = ['name', 'phone', 'avatar_url', 'preferences', 'role', 'team_id', 'is_active'];
  const updateData = {};
  for (const key of allowedUpdates) {
    if (req.validated.body[key] !== undefined) updateData[key] = req.validated.body[key];
  }
  updateData.updated_at = new Date();
  
  const user = await User.findByIdAndUpdate(
    req.params.userId,
    { $set: updateData },
    { new: true }
  ).select('-password_hash').lean();
  
  if (!user) {
    throw new NotFoundError('User');
  }
  
  logger.info('User updated by admin', { userId: req.params.userId, updatedBy: req.user.userId });
  
  return res.json({
    success: true,
    data: user,
  });
}

async function deleteUser(req, res) {
  await connect();
  
  if (!hasPermission(req.user.role, 'users:delete')) {
    throw new ForbiddenError();
  }
  
  const user = await User.findByIdAndDelete(req.params.userId).lean();
  if (!user) {
    throw new NotFoundError('User');
  }
  
  logger.info('User deleted by admin', { userId: req.params.userId, deletedBy: req.user.userId });
  
  return res.json({
    success: true,
    data: { message: 'User deleted' },
  });
}

module.exports = {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
};
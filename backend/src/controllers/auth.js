const { User } = require('../models');
const { connect } = require('../db');
const bcrypt = require('bcryptjs');
const { generateToken, verifyToken } = require('../middleware/auth');
const { asyncHandler } = require('../utils/response');
const { ValidationError, UnauthorizedError, NotFoundError, ForbiddenError } = require('../utils/errors');
const { logger } = require('../utils/logger');

async function register(req, res) {
  await connect();
  
  const { email, password, name, role, team_id, phone } = req.validated.body;
  
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new ValidationError('Email already registered');
  }
  
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
  
  const token = generateToken(user.toObject());
  
  logger.info('User registered', { userId: user_id, email });
  
  return res.status(201).json({
    success: true,
    data: {
      user: { 
        userId: user.user_id, 
        email: user.email, 
        name: user.name, 
        role: user.role,
        teamId: user.team_id,
      }, 
      token 
    },
  });
}

async function login(req, res) {
  await connect();
  
  const { email, password, rememberMe } = req.validated.body;
  
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new UnauthorizedError('Invalid credentials');
  }
  
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    throw new UnauthorizedError('Invalid credentials');
  }
  
  if (!user.is_active) {
    throw new ForbiddenError('Account deactivated');
  }
  
  await User.findByIdAndUpdate(user._id, { $set: { last_login: new Date() } });
  
  const token = generateToken(user.toObject(), rememberMe);
  
  logger.info('User logged in', { userId: user.user_id, email, rememberMe });
  
  return res.json({
    success: true,
    data: {
      user: { 
        userId: user.user_id, 
        email: user.email, 
        name: user.name, 
        role: user.role,
        teamId: user.team_id,
      }, 
      token 
    },
  });
}

async function getMe(req, res) {
  await connect();
  
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError();
  }
  
  const token = authHeader.substring(7);
  const decoded = verifyToken(token);
  if (!decoded) {
    throw new UnauthorizedError('Invalid or expired token');
  }
  
  const user = await User.findOne({ user_id: decoded.userId }).select('-password_hash').lean();
  if (!user) {
    throw new NotFoundError('User');
  }
  
  return res.json({
    success: true,
    data: user,
  });
}

async function updateMe(req, res) {
  await connect();
  
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError();
  }
  
  const token = authHeader.substring(7);
  const decoded = verifyToken(token);
  if (!decoded) {
    throw new UnauthorizedError('Invalid or expired token');
  }
  
  const allowedUpdates = ['name', 'phone', 'avatar_url', 'preferences'];
  const updateData = {};
  for (const key of allowedUpdates) {
    if (req.validated.body[key] !== undefined) updateData[key] = req.validated.body[key];
  }
  updateData.updated_at = new Date();
  
  const user = await User.findByIdAndUpdate(
    decoded.userId,
    { $set: updateData },
    { new: true }
  ).select('-password_hash').lean();
  
  if (!user) {
    throw new NotFoundError('User');
  }
  
  logger.info('User profile updated', { userId: decoded.userId });
  
  return res.json({
    success: true,
    data: user,
  });
}

module.exports = {
  register,
  login,
  getMe,
  updateMe,
};
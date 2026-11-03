const jwt = require('jsonwebtoken');
const { connect } = require('../db');
const { User } = require('../models');
const config = require('../config');

// JWT secret from config (fails fast in production if not set)
const JWT_SECRET = config.jwt.secret;
const JWT_EXPIRES_IN = config.jwt.expiresIn;

// Role hierarchy: higher number = more permissions
const ROLES = {
  citizen: 1,
  team_member: 2,
  team_lead: 3,
  admin: 4,
  super_admin: 5
};

const PERMISSIONS = {
  // Report permissions
  'reports:create': [ROLES.citizen, ROLES.team_member, ROLES.team_lead, ROLES.admin, ROLES.super_admin],
  'reports:read': [ROLES.citizen, ROLES.team_member, ROLES.team_lead, ROLES.admin, ROLES.super_admin],
  'reports:update': [ROLES.team_member, ROLES.team_lead, ROLES.admin, ROLES.super_admin],
  'reports:delete': [ROLES.admin, ROLES.super_admin],
  'reports:assign': [ROLES.team_lead, ROLES.admin, ROLES.super_admin],
  'reports:close': [ROLES.team_lead, ROLES.admin, ROLES.super_admin],
  'reports:bulk': [ROLES.admin, ROLES.super_admin],
  
  // Team/Vehicle permissions
  'teams:read': [ROLES.citizen, ROLES.team_member, ROLES.team_lead, ROLES.admin, ROLES.super_admin],
  'teams:create': [ROLES.admin, ROLES.super_admin],
  'teams:update': [ROLES.team_lead, ROLES.admin, ROLES.super_admin],
  'teams:delete': [ROLES.admin, ROLES.super_admin],
  
  'vehicles:read': [ROLES.citizen, ROLES.team_member, ROLES.team_lead, ROLES.admin, ROLES.super_admin],
  'vehicles:create': [ROLES.admin, ROLES.super_admin],
  'vehicles:update': [ROLES.team_lead, ROLES.admin, ROLES.super_admin],
  'vehicles:delete': [ROLES.admin, ROLES.super_admin],
  
  // Analytics permissions
  'analytics:read': [ROLES.team_lead, ROLES.admin, ROLES.super_admin],
  'analytics:export': [ROLES.admin, ROLES.super_admin],
  
  // Admin permissions
  'users:read': [ROLES.admin, ROLES.super_admin],
  'users:create': [ROLES.super_admin],
  'users:update': [ROLES.admin, ROLES.super_admin],
  'users:delete': [ROLES.super_admin],
  'system:config': [ROLES.super_admin],
};

function generateToken(user, rememberMe = false) {
  const payload = {
    userId: user.user_id || user._id,
    email: user.email,
    role: user.role || 'citizen',
    teamId: user.team_id || null,
  };
  const expiresIn = rememberMe ? '30d' : JWT_EXPIRES_IN;
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return null;
  }
}

function hasPermission(userRole, permission) {
  const userLevel = ROLES[userRole] || 0;
  const allowedLevels = PERMISSIONS[permission] || [];
  return allowedLevels.some(level => userLevel >= level);
}

function requireAuth(requiredPermission = null) {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      if (!decoded) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }
      
      // Fetch fresh user data from DB
      await connect();
      const user = await User.findOne({ user_id: decoded.userId }).lean();
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }
      
      req.user = {
        userId: user.user_id,
        email: user.email,
        role: user.role,
        teamId: user.team_id,
        name: user.name,
      };
      
      // Check permission if required
      if (requiredPermission && !hasPermission(req.user.role, requiredPermission)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      
      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(500).json({ error: 'Authentication error' });
    }
  };
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  
  const token = authHeader.substring(7);
  const decoded = verifyToken(token);
  if (!decoded) {
    return next();
  }
  
  req.user = {
    userId: decoded.userId,
    email: decoded.email,
    role: decoded.role,
    teamId: decoded.teamId,
  };
  next();
}

module.exports = {
  generateToken,
  verifyToken,
  hasPermission,
  requireAuth,
  optionalAuth,
  ROLES,
  PERMISSIONS,
  JWT_SECRET,
};
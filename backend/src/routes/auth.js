const express = require('express');
const { asyncHandler } = require('../utils/response');
const { authRateLimiter } = require('../middleware/security');
const { validate, userRegisterSchema, userLoginSchema, userUpdateSchema } = require('../validators/schemas');
const { register, login, getMe, updateMe } = require('../controllers/auth');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { AuditLog, logAudit, ACTIONS } = require('../models');

const router = express.Router();

router.post('/register', authRateLimiter, validate(userRegisterSchema), asyncHandler(async (req, res) => {
  await register(req, res);
  await logAudit({
    user_id: res.locals.userId || null,
    user_role: 'citizen',
    action: ACTIONS.USER_CREATE,
    resource_type: 'user',
    resource_id: res.locals.userId || 'unknown',
    changes: { email: req.body.email, role: req.body.role || 'citizen' },
    ip_address: req.ip,
    user_agent: req.get('user-agent'),
    success: true,
  });
}));

router.post('/login', authRateLimiter, validate(userLoginSchema), asyncHandler(async (req, res) => {
  await login(req, res);
  await logAudit({
    user_id: res.locals.userId || null,
    user_role: res.locals.userRole || 'unknown',
    action: ACTIONS.USER_LOGIN,
    resource_type: 'user',
    resource_id: res.locals.userId || 'unknown',
    changes: { email: req.body.email },
    ip_address: req.ip,
    user_agent: req.get('user-agent'),
    success: true,
  });
}));

router.get('/me', requireAuth(), asyncHandler(getMe));

router.put('/me', requireAuth(), validate(userUpdateSchema), asyncHandler(async (req, res) => {
  await updateMe(req, res);
  await logAudit({
    user_id: req.user.userId,
    user_role: req.user.role,
    action: ACTIONS.USER_UPDATE,
    resource_type: 'user',
    resource_id: req.user.userId,
    changes: req.body,
    ip_address: req.ip,
    user_agent: req.get('user-agent'),
    success: true,
  });
}));

router.post('/push/subscribe', requireAuth(), asyncHandler(async (req, res) => {
  const { registerPushSubscription } = require('../controllers/notifications');
  await registerPushSubscription(req, res);
}));

router.post('/push/unsubscribe', requireAuth(), asyncHandler(async (req, res) => {
  const { unregisterPushSubscription } = require('../controllers/notifications');
  await unregisterPushSubscription(req, res);
}));

module.exports = router;
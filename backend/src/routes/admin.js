const express = require('express');
const { asyncHandler } = require('../utils/response');
const { validate, userRegisterSchema, userUpdateSchema, listQuerySchema } = require('../validators/schemas');
const { listUsers, getUser, createUser, updateUser, deleteUser } = require('../controllers/admin');
const { requireAuth } = require('../middleware/auth');
const { AuditLog, logAudit, ACTIONS } = require('../models');

const router = express.Router();

router.use(requireAuth());

router.get('/', validate(listQuerySchema, 'query'), asyncHandler(listUsers));

router.get('/:userId', asyncHandler(getUser));

router.post('/', validate(userRegisterSchema), asyncHandler(async (req, res) => {
  await createUser(req, res);
  await logAudit({
    user_id: req.user.userId,
    user_role: req.user.role,
    action: ACTIONS.USER_CREATE,
    resource_type: 'user',
    resource_id: res.locals.userId || 'unknown',
    changes: { email: req.body.email, role: req.body.role || 'citizen' },
    ip_address: req.ip,
    user_agent: req.get('user-agent'),
    success: true,
  });
}));

router.put('/:userId', validate(userUpdateSchema), asyncHandler(async (req, res) => {
  await updateUser(req, res);
  await logAudit({
    user_id: req.user.userId,
    user_role: req.user.role,
    action: ACTIONS.USER_UPDATE,
    resource_type: 'user',
    resource_id: req.params.userId,
    changes: req.body,
    ip_address: req.ip,
    user_agent: req.get('user-agent'),
    success: true,
  });
}));

router.delete('/:userId', asyncHandler(async (req, res) => {
  await deleteUser(req, res);
  await logAudit({
    user_id: req.user.userId,
    user_role: req.user.role,
    action: ACTIONS.USER_DELETE,
    resource_type: 'user',
    resource_id: req.params.userId,
    changes: {},
    ip_address: req.ip,
    user_agent: req.get('user-agent'),
    success: true,
  });
}));

router.get('/audit/logs', asyncHandler(async (req, res) => {
  const { getAuditLogs } = require('../models/audit');
  await getAuditLogs(req, res);
}));

module.exports = router;
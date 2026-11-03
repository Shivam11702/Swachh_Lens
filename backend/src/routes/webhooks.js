const express = require('express');
const { asyncHandler } = require('../utils/response');
const { validate, webhookCreateSchema, webhookUpdateSchema } = require('../validators/schemas');
const { listWebhooks, createWebhook, updateWebhook, deleteWebhook, testWebhook } = require('../controllers/webhooks');
const { requireAuth } = require('../middleware/auth');
const { AuditLog, logAudit, ACTIONS } = require('../models');

const router = express.Router();

router.use(requireAuth());

router.get('/', asyncHandler(listWebhooks));

router.post('/', validate(webhookCreateSchema), asyncHandler(async (req, res) => {
  await createWebhook(req, res);
  await logAudit({
    user_id: req.user.userId,
    user_role: req.user.role,
    action: ACTIONS.WEBHOOK_CREATE,
    resource_type: 'webhook',
    resource_id: res.locals.webhookId || 'unknown',
    changes: { url: req.body.url, events: req.body.events },
    ip_address: req.ip,
    user_agent: req.get('user-agent'),
    success: true,
  });
}));

router.put('/:webhookId', validate(webhookUpdateSchema), asyncHandler(async (req, res) => {
  await updateWebhook(req, res);
  await logAudit({
    user_id: req.user.userId,
    user_role: req.user.role,
    action: ACTIONS.WEBHOOK_UPDATE,
    resource_type: 'webhook',
    resource_id: req.params.webhookId,
    changes: req.body,
    ip_address: req.ip,
    user_agent: req.get('user-agent'),
    success: true,
  });
}));

router.delete('/:webhookId', asyncHandler(async (req, res) => {
  await deleteWebhook(req, res);
  await logAudit({
    user_id: req.user.userId,
    user_role: req.user.role,
    action: ACTIONS.WEBHOOK_DELETE,
    resource_type: 'webhook',
    resource_id: req.params.webhookId,
    changes: {},
    ip_address: req.ip,
    user_agent: req.get('user-agent'),
    success: true,
  });
}));

router.post('/:webhookId/test', asyncHandler(testWebhook));

module.exports = router;
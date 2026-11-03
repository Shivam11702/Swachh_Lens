const express = require('express');
const { asyncHandler } = require('../utils/response');
const { predict, retrainModel, getModelStatus } = require('../controllers/ml');
const { requireAuth } = require('../middleware/auth');
const { AuditLog, logAudit, ACTIONS } = require('../models');

const router = express.Router();

router.post('/predict', requireAuth(), asyncHandler(async (req, res) => {
  await predict(req, res);
}));

router.get('/status', requireAuth(), asyncHandler(getModelStatus));

router.post('/retrain', requireAuth(), asyncHandler(async (req, res) => {
  await retrainModel(req, res);
  await logAudit({
    user_id: req.user.userId,
    user_role: req.user.role,
    action: 'ml.retrain',
    resource_type: 'ml_model',
    resource_id: req.body.model_type || 'unknown',
    changes: { report_ids: req.body.report_ids?.length, labels: req.body.labels },
    ip_address: req.ip,
    user_agent: req.get('user-agent'),
    success: true,
  });
}));

module.exports = router;
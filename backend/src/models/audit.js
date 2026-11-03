const { connect, mongoose } = require('../db');
const { Schema } = mongoose;

const AuditLogSchema = new Schema({
  user_id: { type: String, index: true },
  user_role: String,
  action: { type: String, required: true, index: true },
  resource_type: { type: String, required: true, index: true },
  resource_id: { type: String, index: true },
  changes: Schema.Types.Mixed,
  metadata: Schema.Types.Mixed,
  ip_address: String,
  user_agent: String,
  success: { type: Boolean, default: true },
  error_message: String,
  created_at: { type: Date, default: Date.now, index: true },
});

AuditLogSchema.index({ created_at: -1 });
AuditLogSchema.index({ user_id: 1, created_at: -1 });
AuditLogSchema.index({ resource_type: 1, resource_id: 1 });

const AuditLog = mongoose.model('AuditLog', AuditLogSchema);

async function logAudit(data) {
  try {
    await connect();
    const log = new AuditLog(data);
    await log.save();
  } catch (error) {
    console.error('Audit log failed:', error);
  }
}

async function getAuditLogs(req, res) {
  await connect();
  
  if (!req.user || !['admin', 'super_admin'].includes(req.user.role)) {
    throw new ForbiddenError();
  }
  
  const { page = 1, limit = 50, user_id, action, resource_type, resource_id, startDate, endDate, success } = req.query;
  
  const q = {};
  if (user_id) q.user_id = user_id;
  if (action) q.action = action;
  if (resource_type) q.resource_type = resource_type;
  if (resource_id) q.resource_id = resource_id;
  if (success !== undefined) q.success = success === 'true';
  if (startDate || endDate) {
    q.created_at = {};
    if (startDate) q.created_at.$gte = new Date(startDate);
    if (endDate) q.created_at.$lte = new Date(endDate);
  }
  
  const skip = Math.max(0, (page - 1)) * limit;
  
  const [items, total] = await Promise.all([
    AuditLog.find(q).sort({ created_at: -1 }).skip(skip).limit(Number(limit)).lean(),
    AuditLog.countDocuments(q),
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

const ACTIONS = {
  REPORT_CREATE: 'report.create',
  REPORT_UPDATE: 'report.update',
  REPORT_DELETE: 'report.delete',
  REPORT_ASSIGN: 'report.assign',
  REPORT_STATUS_CHANGE: 'report.status_change',
  REPORT_COMMENT: 'report.comment',
  TEAM_CREATE: 'team.create',
  TEAM_UPDATE: 'team.update',
  TEAM_DELETE: 'team.delete',
  VEHICLE_CREATE: 'vehicle.create',
  VEHICLE_UPDATE: 'vehicle.update',
  VEHICLE_DELETE: 'vehicle.delete',
  USER_CREATE: 'user.create',
  USER_UPDATE: 'user.update',
  USER_DELETE: 'user.delete',
  USER_LOGIN: 'user.login',
  WEBHOOK_CREATE: 'webhook.create',
  WEBHOOK_UPDATE: 'webhook.update',
  WEBHOOK_DELETE: 'webhook.delete',
};

module.exports = {
  AuditLog,
  logAudit,
  getAuditLogs,
  ACTIONS,
};
const express = require('express');
const { asyncHandler } = require('../utils/response');
const { validate, teamCreateSchema, teamUpdateSchema, vehicleCreateSchema, vehicleUpdateSchema, listQuerySchema } = require('../validators/schemas');
const { listTeams, createTeam, updateTeam, addTeamMember, removeTeamMember, listVehicles, createVehicle, updateVehicle } = require('../controllers/teams');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { AuditLog, logAudit, ACTIONS } = require('../models');

const router = express.Router();

router.get('/', optionalAuth, asyncHandler(listTeams));

router.post('/', requireAuth('teams:create'), validate(teamCreateSchema), asyncHandler(async (req, res) => {
  await createTeam(req, res);
  await logAudit({
    user_id: req.user.userId,
    user_role: req.user.role,
    action: ACTIONS.TEAM_CREATE,
    resource_type: 'team',
    resource_id: req.body.team_id,
    changes: req.body,
    ip_address: req.ip,
    user_agent: req.get('user-agent'),
    success: true,
  });
}));

router.put('/:teamId', requireAuth('teams:update'), validate(teamUpdateSchema), asyncHandler(async (req, res) => {
  await updateTeam(req, res);
  await logAudit({
    user_id: req.user.userId,
    user_role: req.user.role,
    action: ACTIONS.TEAM_UPDATE,
    resource_type: 'team',
    resource_id: req.params.teamId,
    changes: req.body,
    ip_address: req.ip,
    user_agent: req.get('user-agent'),
    success: true,
  });
}));

router.post('/:teamId/members', requireAuth('teams:update'), asyncHandler(async (req, res) => {
  await addTeamMember(req, res);
  await logAudit({
    user_id: req.user.userId,
    user_role: req.user.role,
    action: ACTIONS.TEAM_UPDATE,
    resource_type: 'team',
    resource_id: req.params.teamId,
    changes: { addedMember: req.body.userId },
    ip_address: req.ip,
    user_agent: req.get('user-agent'),
    success: true,
  });
}));

router.delete('/:teamId/members/:userId', requireAuth('teams:update'), asyncHandler(async (req, res) => {
  await removeTeamMember(req, res);
  await logAudit({
    user_id: req.user.userId,
    user_role: req.user.role,
    action: ACTIONS.TEAM_UPDATE,
    resource_type: 'team',
    resource_id: req.params.teamId,
    changes: { removedMember: req.params.userId },
    ip_address: req.ip,
    user_agent: req.get('user-agent'),
    success: true,
  });
}));

router.get('/vehicles', optionalAuth, asyncHandler(listVehicles));

router.post('/vehicles', requireAuth('vehicles:create'), validate(vehicleCreateSchema), asyncHandler(async (req, res) => {
  await createVehicle(req, res);
  await logAudit({
    user_id: req.user.userId,
    user_role: req.user.role,
    action: ACTIONS.VEHICLE_CREATE,
    resource_type: 'vehicle',
    resource_id: req.body.vehicle_id,
    changes: req.body,
    ip_address: req.ip,
    user_agent: req.get('user-agent'),
    success: true,
  });
}));

router.put('/vehicles/:vehicleId', requireAuth('vehicles:update'), validate(vehicleUpdateSchema), asyncHandler(async (req, res) => {
  await updateVehicle(req, res);
  await logAudit({
    user_id: req.user.userId,
    user_role: req.user.role,
    action: ACTIONS.VEHICLE_UPDATE,
    resource_type: 'vehicle',
    resource_id: req.params.vehicleId,
    changes: req.body,
    ip_address: req.ip,
    user_agent: req.get('user-agent'),
    success: true,
  });
}));

module.exports = router;
const { Team, Vehicle, User } = require('../models');
const { connect } = require('../db');
const { getIo } = require('../socket');
const { asyncHandler } = require('../utils/response');
const { NotFoundError, ValidationError } = require('../utils/errors');
const { logger } = require('../utils/logger');

async function listTeams(req, res) {
  await connect();
  
  const teams = await Team.find().lean();
  
  return res.json({
    success: true,
    data: teams,
  });
}

async function createTeam(req, res) {
  await connect();
  
  const { team_id, name, capabilities, vehicle_types, lead_id, coverage_area } = req.validated.body;
  
  const existing = await Team.findOne({ team_id });
  if (existing) {
    throw new ValidationError('Team ID already exists');
  }
  
  const team = new Team({ 
    team_id, 
    name, 
    capabilities: capabilities || [], 
    vehicle_types: vehicle_types || [], 
    available: true, 
    lead_id, 
    coverage_area: coverage_area || { type: 'Polygon', coordinates: [] } 
  });
  await team.save();
  
  logger.info('Team created', { teamId: team_id });
  
  return res.status(201).json({
    success: true,
    data: team.toObject(),
  });
}

async function updateTeam(req, res) {
  await connect();
  
  const { teamId } = req.params;
  const allowedUpdates = ['name', 'capabilities', 'vehicle_types', 'available', 'lead_id', 'coverage_area'];
  
  const updateData = {};
  for (const key of allowedUpdates) {
    if (req.validated.body[key] !== undefined) updateData[key] = req.validated.body[key];
  }
  
  const team = await Team.findOneAndUpdate(
    { team_id: teamId },
    { $set: updateData },
    { new: true }
  ).lean();
  
  if (!team) {
    throw new NotFoundError('Team');
  }
  
  logger.info('Team updated', { teamId });
  
  return res.json({
    success: true,
    data: team,
  });
}

async function addTeamMember(req, res) {
  await connect();
  
  const { teamId } = req.params;
  const { userId } = req.validated.body;
  
  const team = await Team.findOneAndUpdate(
    { team_id: teamId },
    { $addToSet: { members: userId } },
    { new: true }
  ).lean();
  
  if (!team) {
    throw new NotFoundError('Team');
  }
  
  await User.findByIdAndUpdate(userId, { $set: { team_id: teamId } });
  
  logger.info('Team member added', { teamId, userId });
  
  return res.json({
    success: true,
    data: team,
  });
}

async function removeTeamMember(req, res) {
  await connect();
  
  const { teamId, userId } = req.params;
  
  const team = await Team.findOneAndUpdate(
    { team_id: teamId },
    { $pull: { members: userId } },
    { new: true }
  ).lean();
  
  if (!team) {
    throw new NotFoundError('Team');
  }
  
  await User.findByIdAndUpdate(userId, { $unset: { team_id: '' } });
  
  logger.info('Team member removed', { teamId, userId });
  
  return res.json({
    success: true,
    data: team,
  });
}

async function listVehicles(req, res) {
  await connect();
  
  const vehicles = await Vehicle.find().lean();
  
  return res.json({
    success: true,
    data: vehicles,
  });
}

async function createVehicle(req, res) {
  await connect();
  
  const { vehicle_id, type, capacity_m3, team_id } = req.validated.body;
  
  const existing = await Vehicle.findOne({ vehicle_id });
  if (existing) {
    throw new ValidationError('Vehicle ID already exists');
  }
  
  const vehicle = new Vehicle({ 
    vehicle_id, 
    type, 
    capacity_m3, 
    available: true, 
    team_id 
  });
  await vehicle.save();
  
  logger.info('Vehicle created', { vehicleId: vehicle_id });
  
  return res.status(201).json({
    success: true,
    data: vehicle.toObject(),
  });
}

async function updateVehicle(req, res) {
  await connect();
  
  const { vehicleId } = req.params;
  const allowedUpdates = ['type', 'capacity_m3', 'available', 'team_id', 'current_location', 'last_maintenance'];
  
  const updateData = {};
  for (const key of allowedUpdates) {
    if (req.validated.body[key] !== undefined) updateData[key] = req.validated.body[key];
  }
  
  const vehicle = await Vehicle.findOneAndUpdate(
    { vehicle_id: vehicleId },
    { $set: updateData },
    { new: true }
  ).lean();
  
  if (!vehicle) {
    throw new NotFoundError('Vehicle');
  }
  
  logger.info('Vehicle updated', { vehicleId });
  
  return res.json({
    success: true,
    data: vehicle,
  });
}

module.exports = {
  listTeams,
  createTeam,
  updateTeam,
  addTeamMember,
  removeTeamMember,
  listVehicles,
  createVehicle,
  updateVehicle,
};
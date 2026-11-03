const { Report, Team, Vehicle, User } = require('./index');
const { connect } = require('../db');
const bcrypt = require('bcryptjs');
const { getIo } = require('../socket');

const DEFAULT_TEAMS = [
  { team_id: 'team-1', name: 'General Cleanup', capabilities: ['garbage_dump','plastic_waste','organic_waste','overflowing_bin'], vehicle_types: ['small_van','medium_truck'], available: true },
  { team_id: 'team-2', name: 'Hazardous Response', capabilities: ['hazardous_waste','e_waste'], vehicle_types: ['medium_truck'], available: true },
  { team_id: 'team-3', name: 'Drain & Blockage', capabilities: ['drain_blockage'], vehicle_types: ['small_van'], available: true },
];

const DEFAULT_VEHICLES = [
  { vehicle_id: 'vehicle-1', type: 'small_van', capacity_m3: 1.0, available: true },
  { vehicle_id: 'vehicle-2', type: 'medium_truck', capacity_m3: 3.5, available: true },
  { vehicle_id: 'vehicle-3', type: 'large_truck', capacity_m3: 6.0, available: true },
];

async function ensureBootstrap() {
  await connect();
  const teamCount = await Team.countDocuments();
  if (teamCount === 0) await Team.insertMany(DEFAULT_TEAMS);
  const vehicleCount = await Vehicle.countDocuments();
  if (vehicleCount === 0) await Vehicle.insertMany(DEFAULT_VEHICLES);
}

async function getNextReportSeq(dateKey) {
  await connect();
  const { Counter } = require('./index');
  const r = await Counter.findByIdAndUpdate(`report:${dateKey}`, { $inc: { seq: 1 } }, { upsert: true, new: true, setDefaultsOnInsert: true });
  return r.seq;
}

function makeReportId(dateKey, seq) {
  return `REP-${dateKey}-${String(seq).padStart(3, '0')}`;
}

function makeDisplayId(seq) {
  return `Report ${seq}`;
}

async function createReport({ user_id = null, photos, videos = [], gps, timestamp, comment = null, category = null, estimated_volume = null, landmark = null }) {
  await ensureBootstrap();
  const dateKey = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const seq = await getNextReportSeq(dateKey);
  const reportId = makeReportId(dateKey, seq);
  const reportDoc = new Report({ 
    report_id: reportId, 
    display_id: makeDisplayId(seq), 
    user_id, 
    photos, 
    videos, 
    gps, 
    timestamp, 
    comment, 
    category, 
    estimated_volume, 
    landmark, 
    status: 'pending', 
    created_at: new Date() 
  });
  await reportDoc.save();
  try { 
    const io = getIo(); 
    io.emit('report:created', reportDoc.toObject()); 
  } catch(e) {}
  return reportId;
}

async function getReport(reportId) {
  await ensureBootstrap();
  const report = await Report.findOne({ report_id: reportId }).lean();
  if (!report) {
    const error = new Error(`Report ${reportId} not found`);
    error.statusCode = 404;
    throw error;
  }
  return report;
}

async function setReportStatus(reportId, status) {
  await ensureBootstrap();
  await Report.updateOne({ report_id: reportId }, { $set: { status, updated_at: new Date() } });
}

async function transitionReportStatus(reportId, toStatus, userId = 'system', note = '') {
  await ensureBootstrap();
  const report = await Report.findOne({ report_id: reportId });
  if (!report) {
    const err = new Error('Report not found');
    err.statusCode = 404;
    throw err;
  }
  const from = report.status;
  const allowed = VALID_STATUS_TRANSITIONS[from] || [];
  if (!allowed.includes(toStatus)) {
    const err = new Error(`Invalid transition: ${from} -> ${toStatus}`);
    err.statusCode = 400;
    err.code = 'INVALID_TRANSITION';
    throw err;
  }
  const entry = {
    type: 'status',
    from,
    to: toStatus,
    note: note || undefined,
    user_id: userId,
    created_at: new Date(),
  };
  const updated = await Report.findOneAndUpdate(
    { report_id: reportId },
    { $set: { status: toStatus, updated_at: new Date() }, $push: { history: entry } },
    { new: true }
  ).lean();
  try {
    const io = getIo();
    io.emit('report:updated', updated);
  } catch (e) {}
  return updated;
}

async function setMlResults(reportId, mlResults) {
  await ensureBootstrap();
  await Report.updateOne(
    { report_id: reportId }, 
    { 
      $set: { ml_results: mlResults, status: 'ready', updated_at: new Date() }, 
      $push: { history: { type: 'ml', payload: mlResults, created_at: new Date() } } 
    }
  );
  try { 
    const io = getIo(); 
    const updated = await Report.findOne({ report_id: reportId }).lean(); 
    io.emit('report:updated', updated); 
  } catch(e) {}
}

async function addComment(reportId, author, text) {
  await ensureBootstrap();
  const comment = { author: author || null, text, created_at: new Date() };
  await Report.updateOne(
    { report_id: reportId }, 
    { 
      $push: { comments: comment, history: { type: 'comment', payload: comment, created_at: new Date() } }, 
      $set: { updated_at: new Date() } 
    }
  );
  const updated = await Report.findOne({ report_id: reportId }).lean();
  try { 
    const io = getIo(); 
    io.emit('report:commented', updated); 
  } catch(e) {}
  return updated;
}

async function setAssignment(reportId, assignment) {
  await ensureBootstrap();
  const now = new Date();
  const update = {
    $set: { assignment, status: 'assigned', updated_at: now },
    $push: { history: { type: 'assignment', payload: assignment, created_at: now } }
  };
  await Report.updateOne({ report_id: reportId }, update);
  try { 
    const io = getIo(); 
    const updated = await Report.findOne({ report_id: reportId }).lean(); 
    io.emit('report:updated', updated); 
  } catch(e) {}
}

async function listTeams() {
  await ensureBootstrap();
  return Team.find().lean();
}

async function listVehicles() {
  await ensureBootstrap();
  return Vehicle.find().lean();
}

async function findReportsNearby(gps, radiusMeters = 100.0) {
  await ensureBootstrap();
  const all = await Report.find({ gps: { $exists: true, $ne: null } }).lean();
  return all.filter((report) => report.gps && haversineDistanceMeters(gps, report.gps) <= radiusMeters);
}

async function listReports({ page = 1, limit = 20, status, priority, search } = {}) {
  await ensureBootstrap();
  const q = {};
  if (status) q.status = status;
  if (priority) q['ml_results.priority'] = priority;
  if (search) q.$or = [{ report_id: new RegExp(search, 'i') }, { comment: new RegExp(search, 'i') }];

  const skip = Math.max(0, (page - 1)) * limit;
  const [items, total] = await Promise.all([
    Report.find(q).sort({ created_at: -1 }).skip(skip).limit(Number(limit)).lean(),
    Report.countDocuments(q),
  ]);
  return { items, total, page: Number(page), limit: Number(limit) };
}

function haversineDistanceMeters(source, target) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371000.0;
  const lat1 = toRad(source.lat);
  const lon1 = toRad(source.lon);
  const lat2 = toRad(target.lat);
  const lon2 = toRad(target.lon);
  const dlat = lat2 - lat1;
  const dlon = lon2 - lon1;
  const a = Math.sin(dlat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dlon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function createUser({ email, password, name, role = 'citizen', team_id = null, phone = null }) {
  await connect();
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    const error = new Error('Email already registered');
    error.statusCode = 409;
    throw error;
  }
  const password_hash = await bcrypt.hash(password, 12);
  const user_id = `U${Date.now()}${Math.random().toString(36).substr(2, 6)}`;
  const user = new User({ user_id, email: email.toLowerCase(), password_hash, name, role, team_id, phone });
  await user.save();
  return user.toObject();
}

async function getUserByEmail(email) {
  await connect();
  return User.findOne({ email: email.toLowerCase() }).lean();
}

async function getUserById(userId) {
  await connect();
  return User.findById(userId).lean();
}

async function verifyPassword(user, password) {
  return bcrypt.compare(password, user.password_hash);
}

async function updateUser(userId, updates) {
  await connect();
  const allowedUpdates = ['name', 'phone', 'avatar_url', 'preferences', 'role', 'team_id', 'is_active'];
  const updateData = {};
  for (const key of allowedUpdates) {
    if (updates[key] !== undefined) updateData[key] = updates[key];
  }
  updateData.updated_at = new Date();
  const user = await User.findByIdAndUpdate(userId, { $set: updateData }, { new: true }).lean();
  return user;
}

async function listUsers({ page = 1, limit = 20, role, team_id, is_active } = {}) {
  await connect();
  const q = {};
  if (role) q.role = role;
  if (team_id) q.team_id = team_id;
  if (is_active !== undefined) q.is_active = is_active;
  const skip = Math.max(0, (page - 1)) * limit;
  const [items, total] = await Promise.all([
    User.find(q).select('-password_hash').sort({ created_at: -1 }).skip(skip).limit(Number(limit)).lean(),
    User.countDocuments(q),
  ]);
  return { items, total, page: Number(page), limit: Number(limit) };
}

async function createTeam({ team_id, name, capabilities, vehicle_types, lead_id, coverage_area }) {
  await connect();
  const team = new Team({ team_id, name, capabilities, vehicle_types, available: true, lead_id, coverage_area });
  await team.save();
  return team.toObject();
}

async function updateTeam(teamId, updates) {
  await connect();
  const allowedUpdates = ['name', 'capabilities', 'vehicle_types', 'available', 'lead_id', 'coverage_area', 'members'];
  const updateData = {};
  for (const key of allowedUpdates) {
    if (updates[key] !== undefined) updateData[key] = updates[key];
  }
  const team = await Team.findOneAndUpdate({ team_id: teamId }, { $set: updateData }, { new: true }).lean();
  return team;
}

async function addTeamMember(teamId, userId) {
  await connect();
  const team = await Team.findOneAndUpdate(
    { team_id: teamId },
    { $addToSet: { members: userId } },
    { new: true }
  ).lean();
  return team;
}

async function removeTeamMember(teamId, userId) {
  await connect();
  const team = await Team.findOneAndUpdate(
    { team_id: teamId },
    { $pull: { members: userId } },
    { new: true }
  ).lean();
  return team;
}

async function createVehicle({ vehicle_id, type, capacity_m3, team_id }) {
  await connect();
  const vehicle = new Vehicle({ vehicle_id, type, capacity_m3, available: true, team_id });
  await vehicle.save();
  return vehicle.toObject();
}

async function updateVehicle(vehicleId, updates) {
  await connect();
  const allowedUpdates = ['type', 'capacity_m3', 'available', 'team_id', 'current_location', 'last_maintenance'];
  const updateData = {};
  for (const key of allowedUpdates) {
    if (updates[key] !== undefined) updateData[key] = updates[key];
  }
  const vehicle = await Vehicle.findOneAndUpdate({ vehicle_id: vehicleId }, { $set: updateData }, { new: true }).lean();
  return vehicle;
}

const VALID_STATUS_TRANSITIONS = {
  pending: ['ready', 'cancelled'],
  ready: ['assigned', 'pending'],
  assigned: ['in_progress', 'ready', 'cancelled'],
  in_progress: ['completed', 'assigned'],
  completed: ['closed', 'in_progress'],
  closed: [],
  cancelled: ['pending'],
};

module.exports = {
  createReport,
  getReport,
  setReportStatus,
  transitionReportStatus,
  setMlResults,
  addComment,
  setAssignment,
  listTeams,
  listVehicles,
  findReportsNearby,
  listReports,
  haversineDistanceMeters,
  createUser,
  getUserByEmail,
  getUserById,
  verifyPassword,
  updateUser,
  listUsers,
  createTeam,
  updateTeam,
  addTeamMember,
  removeTeamMember,
  createVehicle,
  updateVehicle,
  VALID_STATUS_TRANSITIONS,
};
const { Report, Team, Vehicle, User } = require('../models');
const { connect } = require('../db');
const { getIo } = require('../socket');
const { processReport } = require('../services/ml');
const { suggestAssignment } = require('../services/assignment');
const { haversineDistanceMeters, createReport: createReportModel } = require('../models/reports');
const { asyncHandler } = require('../utils/response');
const { ValidationError, NotFoundError, ForbiddenError } = require('../utils/errors');
const { logger } = require('../utils/logger');

async function createReport(req, res) {
  await connect();
  
  const { photos, gps, timestamp, comment, category, estimated_volume, landmark, user_id } = req.validated.body;
  
  const reportId = await createReportModel({
    user_id: user_id || (req.user?.userId || null),
    photos,
    videos: [],
    gps,
    timestamp: timestamp ? new Date(timestamp) : new Date(),
    comment,
    category: category || null,
    estimated_volume: estimated_volume || null,
    landmark: landmark || null,
  });
  
  const report = await Report.findOne({ report_id: reportId }).lean();
  res.locals.reportId = reportId;
  
  try {
    const io = getIo();
    io.emit('report:created', report);
  } catch (e) {
    logger.warn('Socket emit failed', { error: e.message });
  }
  
  const existingReports = report?.gps ? await Report.find({ _id: { $ne: report._id }, gps: { $exists: true, $ne: null } }).lean() : [];
  const mlResults = await processReport(report, existingReports);

  const assignmentSuggestion = await suggestAssignment({ ...report, ml_results: mlResults });
  mlResults.suggested_team_id = assignmentSuggestion.team_id;
  mlResults.suggested_vehicle_type = assignmentSuggestion.vehicle_type;
  
  await Report.updateOne(
    { _id: report._id },
    { 
      $set: { ml_results: mlResults, status: 'ready', updated_at: new Date() },
      $push: { history: { type: 'ml', payload: mlResults, created_at: new Date() } }
    }
  );
  
  const updatedReport = await Report.findById(report._id).lean();
  
  try {
    const io = getIo();
    io.emit('report:updated', updatedReport);
  } catch (e) {
    logger.warn('Socket emit failed', { error: e.message });
  }
  
  logger.info('Report created', { reportId: updatedReport.report_id });
  
  return res.status(201).json({
    success: true,
    data: updatedReport,
  });
}

async function getReport(req, res) {
  await connect();
  
  const report = await Report.findOne({ report_id: req.params.reportId }).lean();
  
  if (!report) {
    throw new NotFoundError('Report');
  }
  
  return res.json({
    success: true,
    data: report,
  });
}

async function updateReportAction(req, res) {
  await connect();
  
  const reportId = req.params.reportId;
  const report = await Report.findOne({ report_id: reportId });
  
  if (!report) {
    throw new NotFoundError('Report');
  }
  
  const { team_id, vehicle_id, scheduled_time, note } = req.validated.body;
  
  const now = new Date();
  const assignment = { team_id, vehicle_id, scheduled_time: scheduled_time ? new Date(scheduled_time) : null, note };
  
  await Report.updateOne(
    { report_id: reportId },
    {
      $set: { assignment, status: 'assigned', updated_at: now },
      $push: { history: { type: 'assignment', payload: assignment, created_at: now } }
    }
  );
  
  const updated = await Report.findOne({ report_id: reportId }).lean();
  
  try {
    const io = getIo();
    io.emit('report:updated', updated);
  } catch (e) {
    logger.warn('Socket emit failed', { error: e.message });
  }
  
  logger.info('Report assigned', { reportId, teamId: team_id, vehicleId: vehicle_id });
  
  return res.json({
    success: true,
    data: updated,
  });
}

async function updateReport(req, res) {
  await connect();
  
  const reportId = req.params.reportId;
  const report = await Report.findOne({ report_id: reportId });
  
  if (!report) {
    throw new NotFoundError('Report');
  }
  
  const { comment, category, estimated_volume, landmark, gps, user_id } = req.validated.body;
  
  const update = {};
  if (comment !== undefined) update.comment = comment;
  if (category !== undefined) update.category = category;
  if (estimated_volume !== undefined) update.estimated_volume = estimated_volume;
  if (landmark !== undefined) update.landmark = landmark;
  if (gps !== undefined) update.gps = gps;
  update.updated_at = new Date();
  
  await Report.updateOne({ report_id: reportId }, { $set: update });
  
  const updated = await Report.findOne({ report_id: reportId }).lean();
  
  try {
    const io = getIo();
    io.emit('report:updated', updated);
  } catch (e) {
    logger.warn('Socket emit failed', { error: e.message });
  }
  
  logger.info('Report updated', { reportId, fields: Object.keys(update) });
  
  return res.json({
    success: true,
    data: updated,
  });
}

async function addComment(req, res) {
  await connect();
  
  const { author, text } = req.validated.body;
  const reportId = req.params.reportId;
  
  const comment = { author: author || req.user?.name || null, text, created_at: new Date() };
  
  const updated = await Report.findOneAndUpdate(
    { report_id: reportId },
    { 
      $push: { comments: comment, history: { type: 'comment', payload: comment, created_at: new Date() } },
      $set: { updated_at: new Date() }
    },
    { new: true }
  ).lean();
  
  if (!updated) {
    throw new NotFoundError('Report');
  }
  
  try {
    const io = getIo();
    io.emit('report:commented', updated);
  } catch (e) {
    logger.warn('Socket emit failed', { error: e.message });
  }
  
  return res.json({
    success: true,
    data: updated,
  });
}

async function listReports(req, res) {
  await connect();
  
  const { page, limit, status, priority, search, startDate, endDate, lat, lon, radiusKm, assignedTeamId, assignedVehicleId, sortBy, sortOrder } = req.validated.query;
  
  const q = {};
  if (status) q.status = status;
  if (priority) q['ml_results.priority'] = priority;
  if (search) q.$or = [{ report_id: new RegExp(search, 'i') }, { comment: new RegExp(search, 'i') }];
  if (startDate || endDate) {
    q.created_at = {};
    if (startDate) q.created_at.$gte = new Date(startDate);
    if (endDate) q.created_at.$lte = new Date(endDate);
  }
  if (assignedTeamId) q['assignment.team_id'] = assignedTeamId;
  if (assignedVehicleId) q['assignment.vehicle_id'] = assignedVehicleId;
  
  let geoFilteredIds = null;
  if (lat !== undefined && lon !== undefined && radiusKm) {
    const allReports = await Report.find({ gps: { $exists: true, $ne: null } }).lean();
    const nearby = allReports.filter(r => haversineDistanceMeters({ lat, lon }, r.gps) <= radiusKm * 1000);
    geoFilteredIds = nearby.map(r => r.report_id);
    if (geoFilteredIds.length === 0) {
      return res.json({
        success: true,
        data: [],
        meta: { pagination: { page: Number(page), limit: Number(limit), total: 0, totalPages: 0 } }
      });
    }
    q.report_id = { $in: geoFilteredIds };
  }
  
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
  
  const skip = Math.max(0, (page - 1)) * limit;
  
  const [items, total] = await Promise.all([
    Report.find(q).sort(sort).skip(skip).limit(Number(limit)).lean(),
    Report.countDocuments(q),
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

async function searchReportsAdvanced(req, res) {
  await connect();
  
  const { page, limit, status, priority, search, startDate, endDate, lat, lon, radiusKm, assignedTeamId, assignedVehicleId, sortBy, sortOrder } = req.validated.query;
  
  const q = {};
  if (status) q.status = status;
  if (priority) q['ml_results.priority'] = priority;
  if (search) q.$or = [{ report_id: new RegExp(search, 'i') }, { comment: new RegExp(search, 'i') }];
  if (startDate || endDate) {
    q.created_at = {};
    if (startDate) q.created_at.$gte = new Date(startDate);
    if (endDate) q.created_at.$lte = new Date(endDate);
  }
  if (assignedTeamId) q['assignment.team_id'] = assignedTeamId;
  if (assignedVehicleId) q['assignment.vehicle_id'] = assignedVehicleId;
  
  let geoFilteredIds = null;
  if (lat !== undefined && lon !== undefined && radiusKm) {
    const allReports = await Report.find({ gps: { $exists: true, $ne: null } }).lean();
    const nearby = allReports.filter(r => haversineDistanceMeters({ lat, lon }, r.gps) <= radiusKm * 1000);
    geoFilteredIds = nearby.map(r => r.report_id);
    if (geoFilteredIds.length === 0) {
      return res.json({
        success: true,
        data: [],
        meta: { pagination: { page: Number(page), limit: Number(limit), total: 0, totalPages: 0 } }
      });
    }
    q.report_id = { $in: geoFilteredIds };
  }
  
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
  
  const skip = Math.max(0, (page - 1)) * limit;
  
  const [items, total] = await Promise.all([
    Report.find(q).sort(sort).skip(skip).limit(Number(limit)).lean(),
    Report.countDocuments(q),
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

async function getHotspots(req, res) {
  await connect();
  
  const { bbox, start, end, gridSize } = req.validated.query;
  
  const matchStage = {};
  if (bbox) {
    const coords = bbox.split(',').map(parseFloat);
    if (coords.length === 4) {
      matchStage.gps = {
        $geoWithin: {
          $box: [[coords[0], coords[1]], [coords[2], coords[3]]]
        }
      };
    }
  }
  if (start || end) {
    matchStage.created_at = {};
    if (start) matchStage.created_at.$gte = new Date(start);
    if (end) matchStage.created_at.$lte = new Date(end);
  }
  
  const pipeline = [
    { $match: matchStage },
    { $match: { gps: { $exists: true, $ne: null } } },
    {
      $project: {
        report_id: 1,
        gps: 1,
        status: 1,
        priority: '$ml_results.priority',
        classification: '$ml_results.classification.0.label',
        created_at: 1,
        gridLat: { $floor: { $divide: ['$gps.lat', gridSize] } },
        gridLon: { $floor: { $divide: ['$gps.lon', gridSize] } },
      }
    },
    {
      $group: {
        _id: { gridLat: '$gridLat', gridLon: '$gridLon' },
        count: { $sum: 1 },
        avgLat: { $avg: '$gps.lat' },
        avgLon: { $avg: '$gps.lon' },
        priorities: { $push: '$priority' },
        classifications: { $push: '$classification' },
        statuses: { $push: '$status' },
        reports: { $push: '$report_id' },
      }
    },
    {
      $project: {
        _id: 0,
        bbox: ['$avgLon', '$avgLat'],
        report_count: '$count',
        average_priority: {
          $switch: {
            branches: [
              { case: { $gt: [{ $size: { $filter: { input: '$priorities', as: 'p', cond: { $eq: ['$$p', 'urgent'] } } } }, 0] }, then: 'urgent' },
              { case: { $gt: [{ $size: { $filter: { input: '$priorities', as: 'p', cond: { $eq: ['$$p', 'high'] } } } }, 0] }, then: 'high' },
              { case: { $gt: [{ $size: { $filter: { input: '$priorities', as: 'p', cond: { $eq: ['$$p', 'medium'] } } } }, 0] }, then: 'medium' },
            ],
            default: 'low'
          }
        },
        issue_types: { $setUnion: ['$classifications'] },
        reports: 1,
      }
    },
    { $sort: { report_count: -1 } },
    { $limit: 100 },
  ];
  
  const hotspots = await Report.aggregate(pipeline);
  
  return res.json({
    success: true,
    data: hotspots,
  });
}

async function getHeatmap(req, res) {
  await connect();
  
  const { bbox, gridSize } = req.validated.query;
  
  const matchStage = {};
  if (bbox) {
    const coords = bbox.split(',').map(parseFloat);
    if (coords.length === 4) {
      matchStage.gps = { $geoWithin: { $box: [[coords[0], coords[1]], [coords[2], coords[3]]] } };
    }
  }
  
  const pipeline = [
    { $match: matchStage },
    { $match: { gps: { $exists: true, $ne: null } } },
    {
      $project: {
        lat: '$gps.lat',
        lon: '$gps.lon',
        weight: { 
          $switch: { 
            branches: [
              { case: { $eq: ['$ml_results.priority', 'urgent'] }, then: 10 },
              { case: { $eq: ['$ml_results.priority', 'high'] }, then: 7 },
              { case: { $eq: ['$ml_results.priority', 'medium'] }, then: 4 },
            ], 
            default: 1 
          } 
        },
      }
    },
    { $limit: 10000 },
  ];
  
  const points = await Report.aggregate(pipeline);
  
  return res.json({
    success: true,
    data: points,
  });
}

async function getTimeseries(req, res) {
  await connect();
  
  const { interval, start, end } = req.validated.query;
  
  const startDate = start ? new Date(start) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const endDate = end ? new Date(end) : new Date();
  
  let groupFormat;
  switch (interval) {
    case 'hour': groupFormat = { $dateToString: { format: '%Y-%m-%d %H:00', date: '$created_at' } }; break;
    case 'day': groupFormat = { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } }; break;
    case 'week': groupFormat = { $dateToString: { format: '%Y-W%U', date: '$created_at' } }; break;
    case 'month': groupFormat = { $dateToString: { format: '%Y-%m', date: '$created_at' } }; break;
    default: groupFormat = { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } };
  }
  
  const pipeline = [
    { $match: { created_at: { $gte: startDate, $lte: endDate } } },
    { $group: { _id: groupFormat, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ];
  
  const data = await Report.aggregate(pipeline);
  
  return res.json({
    success: true,
    data: { interval, start: startDate, end: endDate, data },
  });
}

async function getReportsCount(req, res) {
  await connect();
  
  const count = await Report.countDocuments();
  const sample = await Report.find().limit(5).lean();
  
  return res.json({
    success: true,
    data: {
      count,
      sample,
      connection: {
        readyState: require('mongoose').connection.readyState,
        dbName: require('mongoose').connection.name,
      },
    },
  });
}

module.exports = {
  createReport,
  getReport,
  updateReport,
  updateReportAction,
  addComment,
  listReports,
  searchReportsAdvanced,
  getHotspots,
  getHeatmap,
  getTimeseries,
  getReportsCount,
};

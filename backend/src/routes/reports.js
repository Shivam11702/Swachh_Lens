const express = require('express');
const multer = require('multer');
const path = require('path');
const { asyncHandler } = require('../utils/response');
const { uploadRateLimiter } = require('../middleware/security');
const { validate, reportCreateSchema, reportActionSchema, reportUpdateSchema, listQuerySchema, hotspotQuerySchema, heatmapQuerySchema, timeseriesQuerySchema } = require('../validators/schemas');
const { createReport, getReport, updateReport, updateReportAction, addComment, listReports, searchReportsAdvanced, getHotspots, getHeatmap, getTimeseries, getReportsCount } = require('../controllers/reports');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { storeMediaFiles } = require('../services/storage');
const { AuditLog, logAudit, ACTIONS } = require('../models');

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', '..', 'uploads'));
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, unique + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image uploads are allowed'), false);
    }
    cb(null, true);
  }
});

function parseGpsField(gpsField) {
  if (!gpsField) return null;
  if (typeof gpsField === 'object') return gpsField;
  const s = ('' + gpsField).trim();
  const m = s.match(/(-?\d+\.?\d*)/g);
  if (m && m.length >= 2) {
    return { lat: parseFloat(m[0]), lon: parseFloat(m[1]) };
  }
  try {
    return JSON.parse(s);
  } catch (e) {
    return null;
  }
}

function parseGpsFromBody(body = {}) {
  const parsedGps = parseGpsField(body.gps || body.gps_raw || body.gps_json || body.gps_str);
  if (parsedGps) {
    return parsedGps;
  }

  if (body.lat !== undefined && body.lon !== undefined) {
    const lat = Number(body.lat);
    const lon = Number(body.lon);
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      return { lat, lon };
    }
  }

  return null;
}

router.post('/', uploadRateLimiter, upload.array('photos', 8), asyncHandler(async (req, res) => {
  const photos = await storeMediaFiles(req.files);
  
  if (!photos || photos.length === 0) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'At least one photo is required' }
    });
  }
  
  const body = req.body || {};
  const gps = parseGpsFromBody(body);
  const timestamp = body.timestamp || new Date().toISOString();
  const comment = body.comment || null;
  const category = body.category || null;
  const estimated_volume = body.estimated_volume || null;
  const landmark = body.landmark || null;
  const user_id = body.user_id || body.userId || (req.user?.userId || null);
  
  const validatedData = reportCreateSchema.safeParse({
    photos,
    gps,
    timestamp,
    comment,
    category,
    estimated_volume,
    landmark,
    user_id,
  });
  
  if (!validatedData.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: validatedData.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
      },
    });
  }
  
  req.validated = { body: validatedData.data };
  
  await createReport(req, res);
  
  await logAudit({
    user_id: req.user?.userId || null,
    user_role: req.user?.role || 'anonymous',
    action: ACTIONS.REPORT_CREATE,
    resource_type: 'report',
    resource_id: res.locals.reportId || 'unknown',
    changes: { photos: photos.length, gps, comment },
    ip_address: req.ip,
    user_agent: req.get('user-agent'),
    success: true,
  });
}));

router.get('/', optionalAuth, validate(listQuerySchema, 'query'), asyncHandler(listReports));
router.get('/search', optionalAuth, validate(listQuerySchema, 'query'), asyncHandler(searchReportsAdvanced));
router.get('/hotspots', optionalAuth, validate(hotspotQuerySchema, 'query'), asyncHandler(getHotspots));
router.get('/hotspots/heatmap', optionalAuth, validate(heatmapQuerySchema, 'query'), asyncHandler(getHeatmap));
router.get('/analytics/timeseries', optionalAuth, validate(timeseriesQuerySchema, 'query'), asyncHandler(getTimeseries));
router.get('/debug/count', asyncHandler(getReportsCount));

router.get('/:reportId', optionalAuth, asyncHandler(getReport));

router.patch('/:reportId', requireAuth('reports:update'), validate(reportUpdateSchema, 'body'), asyncHandler(updateReport));

router.post('/:reportId/action', requireAuth('reports:assign'), validate(reportActionSchema, 'body'), asyncHandler(updateReportAction));

router.post('/:reportId/comments', optionalAuth, asyncHandler(async (req, res) => {
  await addComment(req, res);
  await logAudit({
    user_id: req.user?.userId || null,
    user_role: req.user?.role || 'anonymous',
    action: ACTIONS.REPORT_COMMENT,
    resource_type: 'report',
    resource_id: req.params.reportId,
    changes: { comment: req.body.text },
    ip_address: req.ip,
    user_agent: req.get('user-agent'),
    success: true,
  });
}));

router.post('/:reportId/status', requireAuth('reports:update'), asyncHandler(async (req, res) => {
  const { transitionReportStatus } = require('../models/reports');
  const { status, note } = req.body;
  if (!status) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'status is required' } });
  const userId = req.user?.userId || 'system';
  const updated = await transitionReportStatus(req.params.reportId, status, userId, note || '');
  
  await logAudit({
    user_id: req.user?.userId,
    user_role: req.user?.role,
    action: ACTIONS.REPORT_STATUS_CHANGE,
    resource_type: 'report',
    resource_id: req.params.reportId,
    changes: { from: req.body.fromStatus, to: status, note },
    ip_address: req.ip,
    user_agent: req.get('user-agent'),
    success: true,
  });
  
  return res.json({ success: true, data: updated });
}));

router.get('/:reportId/history', optionalAuth, asyncHandler(async (req, res) => {
  const { getReportHistory } = require('../models/reports');
  const history = await getReportHistory(req.params.reportId);
  return res.json({ success: true, data: history });
}));

router.get('/status/transitions', (req, res) => {
  const { VALID_STATUS_TRANSITIONS } = require('../models/reports');
  return res.json({ success: true, data: VALID_STATUS_TRANSITIONS });
});

module.exports = router;

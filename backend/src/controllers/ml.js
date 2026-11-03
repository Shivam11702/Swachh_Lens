const { Report } = require('../models');
const { connect } = require('../db');
const { asyncHandler } = require('../utils/response');
const { NotFoundError, ExternalServiceError } = require('../utils/errors');
const { logger } = require('../utils/logger');
const config = require('../config');

async function predict(req, res) {
  const { image_uri, gps } = req.body;
  
  if (!image_uri) {
    throw new ValidationError('image_uri is required');
  }
  
  if (config.ml.provider === 'stub') {
    return res.json({
      success: true,
      data: {
        classification: [{ label: 'garbage_dump', confidence: 0.8 }],
        volume_bin: 'medium',
        priority: 'medium',
        triage_score: 4,
        suggested_team_id: null,
        suggested_vehicle_type: null,
        duplicate_of: null,
      },
    });
  }
  
  try {
    const response = await fetch(`${config.ml.pythonServiceUrl}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_uri, gps }),
      signal: AbortSignal.timeout(config.ml.timeout),
    });
    
    if (!response.ok) {
      throw new Error(`ML service returned ${response.status}`);
    }
    
    const result = await response.json();
    
    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('ML prediction failed', { error: error.message });
    throw new ExternalServiceError('ML service', error.message);
  }
}

async function retrainModel(req, res) {
  if (!req.user || req.user.role !== 'super_admin') {
    throw new ForbiddenError();
  }
  
  const { model_type, report_ids, labels } = req.body;
  
  try {
    const response = await fetch(`${config.ml.pythonServiceUrl}/retrain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model_type, report_ids, labels }),
      signal: AbortSignal.timeout(config.ml.timeout * 10),
    });
    
    if (!response.ok) {
      throw new Error(`ML service returned ${response.status}`);
    }
    
    const result = await response.json();
    
    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Model retraining failed', { error: error.message });
    throw new ExternalServiceError('ML service', error.message);
  }
}

async function getModelStatus(req, res) {
  try {
    const response = await fetch(`${config.ml.pythonServiceUrl}/status`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    
    if (!response.ok) {
      throw new Error(`ML service returned ${response.status}`);
    }
    
    const result = await response.json();
    
    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('ML status check failed', { error: error.message });
    return res.json({
      success: true,
      data: { status: 'unavailable', error: error.message },
    });
  }
}

module.exports = {
  predict,
  retrainModel,
  getModelStatus,
};
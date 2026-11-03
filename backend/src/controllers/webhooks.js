const { connect } = require('../db');
const { Webhook } = require('../models');
const { asyncHandler } = require('../utils/response');
const { NotFoundError, ValidationError, ForbiddenError } = require('../utils/errors');
const { logger } = require('../utils/logger');
const config = require('../config');
const crypto = require('crypto');

const VALID_EVENTS = [
  'report.created',
  'report.updated',
  'report.status_changed',
  'report.assigned',
  'report.completed',
  'report.commented',
];

async function listWebhooks(req, res) {
  await connect();
  
  if (!req.user || !['admin', 'super_admin'].includes(req.user.role)) {
    throw new ForbiddenError();
  }
  
  const webhooks = await Webhook.find().sort({ created_at: -1 }).lean();
  
  return res.json({
    success: true,
    data: webhooks,
  });
}

async function createWebhook(req, res) {
  await connect();
  
  if (!req.user || !['admin', 'super_admin'].includes(req.user.role)) {
    throw new ForbiddenError();
  }
  
  const { url, events, secret, active } = req.validated.body;
  
  if (!events.every(e => VALID_EVENTS.includes(e))) {
    throw new ValidationError('Invalid event types');
  }
  
  const webhookSecret = secret || crypto.randomBytes(32).toString('hex');
  
  const webhook = new Webhook({
    url,
    events,
    secret: webhookSecret,
    active: active !== false,
    created_by: req.user.userId,
  });
  await webhook.save();
  
  logger.info('Webhook created', { webhookId: webhook._id, url });
  
  return res.status(201).json({
    success: true,
    data: webhook.toObject(),
  });
}

async function updateWebhook(req, res) {
  await connect();
  
  if (!req.user || !['admin', 'super_admin'].includes(req.user.role)) {
    throw new ForbiddenError();
  }
  
  const { url, events, secret, active } = req.validated.body;
  
  if (events && !events.every(e => VALID_EVENTS.includes(e))) {
    throw new ValidationError('Invalid event types');
  }
  
  const updateData = {};
  if (url !== undefined) updateData.url = url;
  if (events !== undefined) updateData.events = events;
  if (secret !== undefined) updateData.secret = secret;
  if (active !== undefined) updateData.active = active;
  updateData.updated_at = new Date();
  
  const webhook = await Webhook.findByIdAndUpdate(
    req.params.webhookId,
    { $set: updateData },
    { new: true }
  ).lean();
  
  if (!webhook) {
    throw new NotFoundError('Webhook');
  }
  
  logger.info('Webhook updated', { webhookId: req.params.webhookId });
  
  return res.json({
    success: true,
    data: webhook,
  });
}

async function deleteWebhook(req, res) {
  await connect();
  
  if (!req.user || !['admin', 'super_admin'].includes(req.user.role)) {
    throw new ForbiddenError();
  }
  
  const webhook = await Webhook.findByIdAndDelete(req.params.webhookId).lean();
  if (!webhook) {
    throw new NotFoundError('Webhook');
  }
  
  logger.info('Webhook deleted', { webhookId: req.params.webhookId });
  
  return res.json({
    success: true,
    data: { message: 'Webhook deleted' },
  });
}

async function triggerWebhook(event, payload) {
  if (!config.webhooks.enabled) return;
  
  await connect();
  
  const webhooks = await Webhook.find({ active: true, events: event }).lean();
  
  for (const webhook of webhooks) {
    deliverWebhook(webhook, event, payload);
  }
}

async function deliverWebhook(webhook, event, payload) {
  const timestamp = Date.now().toString();
  const signature = crypto
    .createHmac('sha256', webhook.secret)
    .update(`${timestamp}.${JSON.stringify(payload)}`)
    .digest('hex');
  
  const headers = {
    'Content-Type': 'application/json',
    'X-Webhook-Event': event,
    'X-Webhook-Timestamp': timestamp,
    'X-Webhook-Signature': signature,
    'X-Webhook-Delivery': crypto.randomUUID(),
  };
  
  let attempt = 0;
  const maxAttempts = config.webhooks.retryAttempts;
  
  while (attempt < maxAttempts) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.webhooks.timeout);
      
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ event, payload, timestamp: new Date().toISOString() }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        logger.info('Webhook delivered', { webhookId: webhook._id, event, deliveryId: headers['X-Webhook-Delivery'] });
        await Webhook.findByIdAndUpdate(webhook._id, {
          $set: { last_delivery: new Date(), last_status: response.status },
          $inc: { success_count: 1 },
        });
        return;
      }
      
      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      attempt++;
      logger.warn('Webhook delivery failed', { 
        webhookId: webhook._id, 
        event, 
        attempt, 
        error: error.message 
      });
      
      if (attempt >= maxAttempts) {
        await Webhook.findByIdAndUpdate(webhook._id, {
          $set: { last_delivery: new Date(), last_status: 0, last_error: error.message },
          $inc: { failure_count: 1 },
        });
        break;
      }
      
      await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
    }
  }
}

async function testWebhook(req, res) {
  await connect();
  
  if (!req.user || !['admin', 'super_admin'].includes(req.user.role)) {
    throw new ForbiddenError();
  }
  
  const webhook = await Webhook.findById(req.params.webhookId).lean();
  if (!webhook) {
    throw new NotFoundError('Webhook');
  }
  
  await deliverWebhook(webhook, 'test', { message: 'Test webhook delivery' });
  
  return res.json({
    success: true,
    data: { message: 'Test webhook sent' },
  });
}

module.exports = {
  listWebhooks,
  createWebhook,
  updateWebhook,
  deleteWebhook,
  triggerWebhook,
  testWebhook,
  VALID_EVENTS,
};
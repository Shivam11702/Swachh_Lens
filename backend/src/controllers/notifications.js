const { connect } = require('../db');
const { User } = require('../models');
const { asyncHandler } = require('../utils/response');
const { NotFoundError, ForbiddenError } = require('../utils/errors');
const { logger } = require('../utils/logger');
const config = require('../config');
const nodemailer = require('nodemailer');
const webPush = require('web-push');

let emailTransporter = null;
if (config.notifications.email.enabled && config.notifications.email.host) {
  emailTransporter = nodemailer.createTransport({
    host: config.notifications.email.host,
    port: config.notifications.email.port,
    secure: config.notifications.email.port === 465,
    auth: {
      user: config.notifications.email.user,
      pass: config.notifications.email.pass,
    },
  });
}

if (config.notifications.push.enabled && config.notifications.push.vapidPublicKey) {
  webPush.setVapidDetails(
    config.notifications.push.vapidSubject,
    config.notifications.push.vapidPublicKey,
    config.notifications.push.vapidPrivateKey
  );
}

async function sendEmail(to, subject, html, text) {
  if (!emailTransporter) {
    logger.warn('Email transporter not configured');
    return false;
  }
  
  try {
    await emailTransporter.sendMail({
      from: config.notifications.email.from,
      to,
      subject,
      html,
      text,
    });
    return true;
  } catch (error) {
    logger.error('Email send failed', { error: error.message, to });
    return false;
  }
}

async function sendPush(subscription, payload) {
  if (!config.notifications.push.enabled) {
    return false;
  }
  
  try {
    await webPush.sendNotification(subscription, JSON.stringify(payload));
    return true;
  } catch (error) {
    logger.error('Push notification failed', { error: error.message });
    if (error.statusCode === 410) {
      // Subscription expired, should be removed
    }
    return false;
  }
}

async function sendSMS(to, message) {
  if (!config.notifications.sms.enabled) {
    return false;
  }
  
  // Implementation depends on provider (Twilio, etc.)
  logger.warn('SMS not implemented', { to });
  return false;
}

async function notifyReportCreated(report) {
  const { User } = require('../models');
  await connect();
  
  // Notify team leads and admins in the area
  const users = await User.find({ 
    role: { $in: ['team_lead', 'admin', 'super_admin'] },
    is_active: true,
  }).lean();
  
  const notification = {
    type: 'report.created',
    title: 'New Waste Report',
    body: `New report ${report.report_id} submitted`,
    data: { reportId: report.report_id },
  };
  
  for (const user of users) {
    if (user.preferences?.notifications?.email) {
      await sendEmail(user.email, 'New Waste Report', 
        `<p>New report <strong>${report.report_id}</strong> submitted.</p>`,
        `New report ${report.report_id} submitted`
      );
    }
    if (user.preferences?.notifications?.push && user.push_subscription) {
      await sendPush(user.push_subscription, notification);
    }
  }
}

async function notifyReportAssigned(report) {
  if (!report.assignment?.team_id) return;
  
  const { User } = require('../models');
  await connect();
  
  const users = await User.find({ 
    team_id: report.assignment.team_id,
    is_active: true,
  }).lean();
  
  for (const user of users) {
    if (user.preferences?.notifications?.email) {
      await sendEmail(user.email, 'Report Assigned',
        `<p>Report <strong>${report.report_id}</strong> has been assigned to your team.</p>`,
        `Report ${report.report_id} assigned to your team`
      );
    }
    if (user.preferences?.notifications?.push && user.push_subscription) {
      await sendPush(user.push_subscription, {
        type: 'report.assigned',
        title: 'Report Assigned',
        body: `Report ${report.report_id} assigned to your team`,
        data: { reportId: report.report_id },
      });
    }
  }
}

async function notifyReportStatusChanged(report, fromStatus, toStatus, note) {
  if (report.user_id) {
    const { User } = require('../models');
    await connect();
    
    const user = await User.findOne({ user_id: report.user_id }).lean();
    if (user && user.preferences?.notifications?.email) {
      await sendEmail(user.email, 'Report Status Updated',
        `<p>Your report <strong>${report.report_id}</strong> status changed from <strong>${fromStatus}</strong> to <strong>${toStatus}</strong>.</p>${note ? `<p>Note: ${note}</p>` : ''}`,
        `Report ${report.report_id} status: ${fromStatus} -> ${toStatus}`
      );
    }
  }
}

async function registerPushSubscription(req, res) {
  await connect();
  
  const { subscription } = req.validated.body;
  
  if (!subscription || !subscription.endpoint) {
    throw new ValidationError('Invalid push subscription');
  }
  
  await User.findOneAndUpdate({ user_id: req.user.userId }, {
    $set: { push_subscription: subscription }
  });
  
  return res.json({
    success: true,
    data: { message: 'Push subscription registered' },
  });
}

async function unregisterPushSubscription(req, res) {
  await connect();
  
  await User.findOneAndUpdate({ user_id: req.user.userId }, {
    $unset: { push_subscription: '' }
  });
  
  return res.json({
    success: true,
    data: { message: 'Push subscription removed' },
  });
}

module.exports = {
  sendEmail,
  sendPush,
  sendSMS,
  notifyReportCreated,
  notifyReportAssigned,
  notifyReportStatusChanged,
  registerPushSubscription,
  unregisterPushSubscription,
};
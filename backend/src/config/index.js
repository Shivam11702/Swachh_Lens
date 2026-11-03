const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env'), override: true });

const env = process.env.NODE_ENV || 'development';

const defaultStorageProvider = process.env.STORAGE_PROVIDER ||
  (process.env.IMAGEKIT_PUBLIC_KEY && process.env.IMAGEKIT_PRIVATE_KEY && process.env.IMAGEKIT_ENDPOINT_URL
    ? 'imagekit'
    : 'local');

const jwtSecret = process.env.JWT_SECRET || 'swachhlens-dev-secret-change-in-production';
const corsOrigin = process.env.CORS_ORIGIN || '*';

// Refuse to boot in production with weak/missing security config.
function assertProductionConfig() {
  if (env !== 'production') return;

  const problems = [];
  if (!process.env.JWT_SECRET) {
    problems.push('JWT_SECRET must be set to a strong secret in production.');
  } else if (jwtSecret === 'swachhlens-dev-secret-change-in-production') {
    problems.push('JWT_SECRET must not use the development default in production.');
  }
  if (jwtSecret.length < 32) {
    problems.push('JWT_SECRET must be at least 32 characters long.');
  }
  if (!process.env.CORS_ORIGIN) {
    problems.push('CORS_ORIGIN must be set to your frontend origin in production.');
  }
  if (corsOrigin === '*') {
    problems.push('CORS_ORIGIN must not be "*" in production.');
  }

  if (problems.length > 0) {
    console.error('[config] Production configuration errors:');
    problems.forEach((p) => console.error(`  - ${p}`));
    throw new Error('Refusing to start in production with invalid configuration.');
  }
}

assertProductionConfig();

module.exports = {
  env,
  port: parseInt(process.env.PORT || '8000', 10),
  host: process.env.HOST || '0.0.0.0',
  
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/swachhlens',
  },
  
  jwt: {
    secret: jwtSecret,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  
  cors: {
    origin: corsOrigin,
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },
  
  storage: {
    provider: defaultStorageProvider,
    local: {
      uploadsDir: path.join(__dirname, '..', '..', 'uploads'),
      publicUrl: process.env.LOCAL_PUBLIC_URL || 'http://localhost:8000',
    },
    s3: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1',
      bucket: process.env.AWS_S3_BUCKET,
      publicUrl: process.env.AWS_S3_PUBLIC_URL,
    },
    gcs: {
      projectId: process.env.GCS_PROJECT_ID,
      keyFilename: process.env.GCS_KEY_FILE,
      bucket: process.env.GCS_BUCKET,
      publicUrl: process.env.GCS_PUBLIC_URL,
    },
    azure: {
      accountName: process.env.AZURE_STORAGE_ACCOUNT,
      accountKey: process.env.AZURE_STORAGE_KEY,
      container: process.env.AZURE_STORAGE_CONTAINER,
      publicUrl: process.env.AZURE_STORAGE_PUBLIC_URL,
    },
    imagekit: {
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
      urlEndpoint: process.env.IMAGEKIT_ENDPOINT_URL,
    },
  },
  
  ml: {
    provider: process.env.ML_PROVIDER || 'stub',
    pythonServiceUrl: process.env.ML_PYTHON_SERVICE_URL || 'http://localhost:8001',
    timeout: parseInt(process.env.ML_TIMEOUT_MS || '30000', 10),
  },
  
  notifications: {
    email: {
      enabled: process.env.EMAIL_ENABLED === 'true',
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
      from: process.env.EMAIL_FROM || 'noreply@swachhlens.local',
    },
    push: {
      enabled: process.env.PUSH_ENABLED === 'true',
      vapidPublicKey: process.env.VAPID_PUBLIC_KEY,
      vapidPrivateKey: process.env.VAPID_PRIVATE_KEY,
      vapidSubject: process.env.VAPID_SUBJECT || 'mailto:admin@swachhlens.local',
    },
    sms: {
      enabled: process.env.SMS_ENABLED === 'true',
      provider: process.env.SMS_PROVIDER || 'twilio',
      twilio: {
        accountSid: process.env.TWILIO_ACCOUNT_SID,
        authToken: process.env.TWILIO_AUTH_TOKEN,
        fromNumber: process.env.TWILIO_FROM_NUMBER,
      },
    },
  },
  
  webhooks: {
    enabled: process.env.WEBHOOKS_ENABLED === 'true',
    secret: process.env.WEBHOOK_SECRET || 'webhook-secret-change-in-production',
    timeout: parseInt(process.env.WEBHOOK_TIMEOUT_MS || '10000', 10),
    retryAttempts: parseInt(process.env.WEBHOOK_RETRY_ATTEMPTS || '3', 10),
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
  },
};

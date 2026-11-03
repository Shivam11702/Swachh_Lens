const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const config = require('../config');

const corsOptions = {
  origin: config.cors.origin,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400,
};

const corsMiddleware = cors(corsOptions);

const helmetMiddleware = helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: config.env === 'production' ? undefined : false,
});

const rateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip,
  skip: (req) => {
    if (req.path === '/health') return true;
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return true;
    return false;
  },
});

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many authentication attempts, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many uploads, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const compressionMiddleware = compression({
  level: 6,
  threshold: 1024,
});

module.exports = {
  corsMiddleware,
  helmetMiddleware,
  rateLimiter,
  authRateLimiter,
  uploadRateLimiter,
  compressionMiddleware,
};

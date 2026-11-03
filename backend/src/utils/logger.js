const winston = require('winston');
const path = require('path');
const config = require('../config');

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
    return `${timestamp} [${level.toUpperCase()}]: ${message} ${metaStr}`;
  })
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} ${level}: ${message} ${metaStr}`;
  })
);

const transports = [
  new winston.transports.Console({
    format: config.env === 'production' ? logFormat : consoleFormat,
  }),
];

if (config.env === 'production') {
  transports.push(
    new winston.transports.File({
      filename: path.join(__dirname, '..', '..', 'logs', 'error.log'),
      level: 'error',
      format: logFormat,
    }),
    new winston.transports.File({
      filename: path.join(__dirname, '..', '..', 'logs', 'combined.log'),
      format: logFormat,
    })
  );
}

const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  transports,
  defaultMeta: { service: 'swachhlens-backend' },
});

const createChildLogger = (meta) => logger.child(meta);

module.exports = { logger, createChildLogger };
const express = require('express');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env'), override: true });

const config = require('./config');
const routes = require('./routes');
const { corsMiddleware, helmetMiddleware, rateLimiter, compressionMiddleware } = require('./middleware/security');
const { connect } = require('./db');
const { init } = require('./socket');
const { logger } = require('./utils/logger');
const { handleError } = require('./utils/errors');

const app = express();

app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(compressionMiddleware);
app.use(rateLimiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const uploadsDir = path.join(__dirname, '..', 'uploads');
app.use('/uploads', express.static(uploadsDir));

const clientDistDir = path.join(__dirname, '..', '..', 'frontend', 'dist');
app.use(express.static(clientDistDir));

app.use('/api', routes);

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    env: config.env,
  });
});

app.get(/^\/(?!api\/|uploads\/|health).*/, (req, res) => {
  const indexHtml = path.join(clientDistDir, 'index.html');
  if (require('fs').existsSync(indexHtml)) {
    res.sendFile(indexHtml);
  } else {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Route ${req.method} ${req.path} not found`,
      },
    });
  }
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
});

app.use((error, req, res, next) => {
  logger.error('Unhandled error', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });
  
  const handled = handleError(error);
  res.status(handled.statusCode).json({
    success: false,
    error: handled.error,
  });
});

const http = require('http');
const server = http.createServer(app);

try {
  const { Server } = require('socket.io');
  const io = new Server(server, { cors: { origin: config.cors.origin } });
  init(io);
  io.on('connection', (socket) => {
    logger.debug('Socket connected', { socketId: socket.id });
  });
} catch (e) {
  logger.warn('Socket.IO not available', { error: e.message });
}

async function startServer() {
  try {
    await connect();
    logger.info('MongoDB connected');
    
    server.listen(config.port, config.host, () => {
      logger.info(`SwachhLens backend listening on http://${config.host}:${config.port}`);
      logger.info(`Environment: ${config.env}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

startServer();

module.exports = { app, server };
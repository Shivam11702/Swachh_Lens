class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403, 'FORBIDDEN');
  }
}

class ConflictError extends AppError {
  constructor(message) {
    super(message, 409, 'CONFLICT');
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429, 'RATE_LIMITED');
  }
}

class ExternalServiceError extends AppError {
  constructor(service, message) {
    super(`${service} error: ${message}`, 502, 'EXTERNAL_SERVICE_ERROR');
  }
}

function isAppError(error) {
  return error instanceof AppError;
}

function handleError(error) {
  if (isAppError(error)) {
    return {
      statusCode: error.statusCode,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    };
  }
  
  if (error.name === 'ValidationError') {
    return {
      statusCode: 400,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        details: Object.values(error.errors).map(e => e.message),
      },
    };
  }
  
  if (error.name === 'CastError') {
    return {
      statusCode: 400,
      error: {
        code: 'INVALID_ID',
        message: 'Invalid ID format',
      },
    };
  }
  
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return {
      statusCode: 409,
      error: {
        code: 'DUPLICATE_ENTRY',
        message: `${field} already exists`,
      },
    };
  }
  
  console.error('Unhandled error:', error);
  
  return {
    statusCode: 500,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
    },
  };
}

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  RateLimitError,
  ExternalServiceError,
  isAppError,
  handleError,
};
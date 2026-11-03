function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

function successResponse(data, meta = {}) {
  return { success: true, data, meta };
}

function errorResponse(code, message, details = null, statusCode = 500) {
  return { success: false, error: { code, message, details }, statusCode };
}

function paginatedResponse(items, total, page, limit) {
  return successResponse(items, {
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

module.exports = {
  asyncHandler,
  successResponse,
  errorResponse,
  paginatedResponse,
};
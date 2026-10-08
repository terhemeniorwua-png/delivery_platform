const { AppError } = require('../utils/errors');
const { failure } = require('../utils/response');

function notFoundHandler(req, res, next) {
  next(new AppError(404, `Route ${req.method} ${req.originalUrl} not found`));
}

// Central error handler. Never returns stack traces or raw database errors to
// the client, so credentials and internal structure stay server side.
function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  if (err instanceof AppError) {
    return failure(res, err.statusCode, err.message, err.details);
  }

  if (err.name === 'ZodError') {
    const details = err.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));
    return failure(res, 400, 'Validation failed', details);
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return failure(res, 409, 'A record with those details already exists');
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return failure(res, 409, 'The related record is missing or still in use');
  }

  if (err.name === 'SequelizeValidationError') {
    const details = err.errors.map((issue) => ({
      path: issue.path,
      message: issue.message,
    }));
    return failure(res, 400, 'Validation failed', details);
  }

  if (err.type === 'entity.parse.failed') {
    return failure(res, 400, 'Request body is not valid JSON');
  }

  if (err.type === 'entity.too.large') {
    return failure(res, 413, 'Request body is too large');
  }

  const logContext = {
    method: req.method,
    path: req.originalUrl,
    status: err.statusCode || 500,
    name: err.name,
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
  };
  console.error('[error]', JSON.stringify(logContext));

  return failure(res, 500, 'Something went wrong. Please try again later.');
}

module.exports = { notFoundHandler, errorHandler };

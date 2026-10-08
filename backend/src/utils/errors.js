class AppError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const badRequest = (message, details) => new AppError(400, message, details);
const unauthorized = (message = 'Authentication required') => new AppError(401, message);
const forbidden = (message = 'You do not have permission to perform this action') => new AppError(403, message);
const notFound = (message = 'Resource not found') => new AppError(404, message);
const conflict = (message, details) => new AppError(409, message, details);

module.exports = { AppError, badRequest, unauthorized, forbidden, notFound, conflict };

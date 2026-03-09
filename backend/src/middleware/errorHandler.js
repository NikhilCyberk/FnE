const logger = require('../logger');

/**
 * Centralized Express error-handling middleware.
 * Must be registered after all routes.
 */
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  logger.error(`${req.method} ${req.url} — ${message}`, {
    stack: err.stack,
    statusCode,
  });

  res.status(statusCode).json({
    error: statusCode === 500 ? 'Internal Server Error' : message,
    ...(process.env.NODE_ENV !== 'production' && { details: err.message }),
  });
}

module.exports = errorHandler;

/**
 * Global error handler — catches unhandled errors and returns clean JSON.
 * Never exposes stack traces in production.
 */
function errorHandler(err, req, res, _next) {
  // Log the real error server-side
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  // Handle specific error types
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'Invalid JSON',
      message: 'The request body contains malformed JSON.',
    });
  }

  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      error: 'Payload too large',
      message: 'The request body exceeds the maximum allowed size of 10KB.',
    });
  }

  // Default 500
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: statusCode === 500 ? 'Internal server error' : err.message,
    message: statusCode === 500
      ? 'An unexpected error occurred. Please try again later.'
      : err.message,
  });
}

module.exports = { errorHandler };

function notFoundHandler(req, res, next) {
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      message: `API endpoint not found: ${req.method} ${req.originalUrl}`
    });
  }

  res.status(404).render('pages/404', {
    title: 'Page Not Found | NG Global Manpower',
    url: req.originalUrl
  });
}

function globalErrorHandler(err, req, res, next) {
  console.error('[SERVER ERROR]', err);

  const statusCode = err.status || 500;
  const message = err.message || 'An unexpected error occurred on the server.';

  if (req.originalUrl.startsWith('/api/')) {
    return res.status(statusCode).json({
      success: false,
      message,
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }

  res.status(statusCode).render('pages/500', {
    title: 'Server Error | NG Global Manpower',
    statusCode,
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : null
  });
}

module.exports = {
  notFoundHandler,
  globalErrorHandler
};

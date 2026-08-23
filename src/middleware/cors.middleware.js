const config = require('../config');

/**
 * Configure CORS middleware.
 * Public endpoints (widget config, submissions) allow any origin.
 * Admin endpoints rely on JWT auth, so CORS is less critical but still configured.
 */
function configureCors() {
  return (req, res, next) => {
    const origin = req.headers.origin;

    // For public submission and widget endpoints, allow configured origins + wildcard
    const publicPaths = ['/api/submit', '/api/widgets/', '/widget.js', '/health'];
    const isPublicPath = publicPaths.some(p => req.path.startsWith(p));

    if (isPublicPath) {
      // Allow any origin for public widget endpoints
      res.set('Access-Control-Allow-Origin', origin || '*');
    } else if (origin && config.allowedOrigins.includes(origin)) {
      res.set('Access-Control-Allow-Origin', origin);
    }

    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Idempotency-Key');
    res.set('Access-Control-Max-Age', '86400');

    // Handle preflight
    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }

    next();
  };
}

module.exports = { configureCors };

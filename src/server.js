const express = require('express');
const helmet = require('helmet');
const path = require('path');
const config = require('./config');
const { configureCors } = require('./middleware/cors.middleware');
const { errorHandler } = require('./middleware/errorHandler.middleware');

// Route imports
const authRoutes = require('./layers/http/auth.routes');
const widgetRoutes = require('./layers/http/widgets.routes');
const submissionRoutes = require('./layers/http/submissions.routes');
const dashboardRoutes = require('./layers/http/dashboard.routes');

const app = express();

// ── Global middleware ──
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// ── CORS for public endpoints ──
app.use(configureCors());

// ── Serve widget.js as a versioned static asset ──
app.use('/widget.js', (req, res, next) => {
  // Long-lived cache for the versioned bundle
  res.set('Cache-Control', 'public, max-age=31536000, immutable');
  res.set('Access-Control-Allow-Origin', '*');
  next();
}, express.static(path.join(__dirname, '..', 'public', 'widget.js')));

// ── API routes ──
app.use('/api/auth', authRoutes);
app.use('/api/widgets', widgetRoutes);
app.use('/api/submit', submissionRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ── Health check ──
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Global error handler ──
app.use(errorHandler);

// ── Start server ──
if (require.main === module) {
  app.listen(config.port, () => {
    console.log(`🚀 Widget Platform API running on port ${config.port}`);
    console.log(`   Environment: ${config.nodeEnv}`);
  });
}

module.exports = app;

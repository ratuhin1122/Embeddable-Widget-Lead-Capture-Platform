require('dotenv').config();

const config = {
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database
  databaseUrl: process.env.DATABASE_URL || 'postgres://widget_user:widget_pass@localhost:5432/widget_db',

  // Auth
  jwtSecret: process.env.JWT_SECRET || 'change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  // Geo providers
  geoProviderA: process.env.GEO_PROVIDER_A_URL || 'http://ip-api.com/json',
  geoProviderB: process.env.GEO_PROVIDER_B_URL || 'https://ipapi.co',

  // Email
  smtpHost: process.env.SMTP_HOST || 'localhost',
  smtpPort: parseInt(process.env.SMTP_PORT, 10) || 1025,
  smtpFrom: process.env.SMTP_FROM || 'noreply@widget-platform.local',

  // Rate limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60000,
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX, 10) || 30,

  // CORS
  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:5500').split(',').map(s => s.trim()),
};

module.exports = config;

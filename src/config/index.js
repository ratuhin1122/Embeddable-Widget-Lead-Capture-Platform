const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const UNSAFE_JWT_SECRETS = ['change-me', 'change-me-to-a-random-string'];

const rawJwtSecret = process.env.JWT_SECRET || '';
const nodeEnv = process.env.NODE_ENV || 'development';

if (nodeEnv === 'production' && (!rawJwtSecret || UNSAFE_JWT_SECRETS.includes(rawJwtSecret))) {
  throw new Error(
    'FATAL: JWT_SECRET is missing or set to an unsafe default. Set a strong, random JWT_SECRET before running in production.'
  );
}

if (nodeEnv !== 'production' && (!rawJwtSecret || UNSAFE_JWT_SECRETS.includes(rawJwtSecret))) {
  console.warn(
    '⚠️  WARNING: JWT_SECRET is missing or set to an unsafe default. This is acceptable for local development but MUST be changed before deploying to production.'
  );
}

const config = {
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv,

  // Database
  databaseUrl: process.env.DATABASE_URL || 'postgres://widget_user:widget_pass@localhost:5432/widget_db',

  // Auth
  jwtSecret: rawJwtSecret || 'change-me',
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

  // Public base URL for embed snippets
  publicBaseUrl: process.env.PUBLIC_BASE_URL || '',
};

module.exports = config;

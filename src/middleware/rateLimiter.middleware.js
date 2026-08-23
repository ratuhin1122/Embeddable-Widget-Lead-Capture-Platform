const rateLimit = require('express-rate-limit');
const config = require('../config');

/**
 * General API rate limiter — per IP.
 */
const apiLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests',
    message: 'Rate limit exceeded. Please try again later.',
    retryAfter: Math.ceil(config.rateLimitWindowMs / 1000),
  },
});

/**
 * Stricter rate limiter for public submission endpoint — per IP.
 * Tighter window and lower max to prevent spam floods.
 */
const submissionLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 10,         // 10 submissions per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit per IP + widget combo
    const ip = req.ip || req.connection.remoteAddress;
    const widgetId = req.params.widgetId || 'unknown';
    return `${ip}:${widgetId}`;
  },
  message: {
    error: 'Too many requests',
    message: 'Too many submissions. Please wait before trying again.',
    retryAfter: 60,
  },
});

module.exports = { apiLimiter, submissionLimiter };

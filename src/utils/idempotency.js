/**
 * Idempotency key utilities.
 * Ensures that retried submissions with the same key are processed only once.
 */

const { v4: uuidv4 } = require('uuid');

/**
 * Generate a new idempotency key.
 */
function generateIdempotencyKey() {
  return uuidv4();
}

/**
 * Extract idempotency key from request headers or body.
 */
function extractIdempotencyKey(req) {
  return req.headers['x-idempotency-key'] || req.body?.idempotency_key || null;
}

module.exports = { generateIdempotencyKey, extractIdempotencyKey };

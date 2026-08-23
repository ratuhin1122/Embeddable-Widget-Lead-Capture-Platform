const express = require('express');
const router = express.Router();
const SubmissionsService = require('../logic/submissions.service');
const { submissionSchema } = require('../../validators/schemas');
const { submissionLimiter } = require('../../middleware/rateLimiter.middleware');

/**
 * POST /api/submit/:widgetId
 * PUBLIC endpoint — accepts cross-origin form submissions.
 * Pipeline: rate limit → validate → honeypot → geo → store → email → respond.
 */
router.post('/:widgetId', submissionLimiter, async (req, res, next) => {
  try {
    // Validate payload structure
    const parsed = submissionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'The submission data is invalid.',
        details: parsed.error.issues.map(i => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      });
    }

    // Extract IP (handles proxies)
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
      || req.socket?.remoteAddress
      || '127.0.0.1';

    // Process through the full submission pipeline
    const result = await SubmissionsService.processSubmission(
      req.params.widgetId,
      parsed.data,
      ipAddress
    );

    const statusCode = result._duplicate ? 200 : 201;
    res.status(statusCode).json({
      success: result.success,
      message: result.message,
      id: result.id,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

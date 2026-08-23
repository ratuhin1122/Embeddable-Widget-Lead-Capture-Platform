const WidgetsRepository = require('../data/widgets.repository');
const SubmissionsRepository = require('../data/submissions.repository');
const GeoService = require('./geo.service');
const EmailService = require('./email.service');
const UsersRepository = require('../data/users.repository');

const SubmissionsService = {
  /**
   * Process a public form submission.
   * Pipeline: validate widget → check honeypot → check idempotency →
   *           geo enrich → store → email side effect → respond.
   */
  async processSubmission(widgetId, body, ipAddress) {
    // 1. Validate widget exists and is active
    const widget = await WidgetsRepository.findById(widgetId);
    if (!widget) {
      const error = new Error('Widget not found');
      error.statusCode = 404;
      throw error;
    }

    // 2. Check honeypot — if filled, silently "accept" but don't store
    if (body._honeypot && body._honeypot.trim() !== '') {
      console.log(`[SPAM] Honeypot triggered for widget ${widgetId} from ${ipAddress}`);
      // Return fake success so bots think it worked
      return {
        success: true,
        message: 'Submission received',
        id: '00000000-0000-0000-0000-000000000000',
        _honeypotTriggered: true,
      };
    }

    // 3. Check idempotency key
    if (body.idempotency_key) {
      const existing = await SubmissionsRepository.findByIdempotencyKey(body.idempotency_key);
      if (existing) {
        return {
          success: true,
          message: 'Submission already received',
          id: existing.id,
          _duplicate: true,
        };
      }
    }

    // 4. Geo enrichment (fallback chain — never fails the submission)
    let geoData = null;
    try {
      geoData = await GeoService.enrich(ipAddress);
    } catch (err) {
      console.error(`[GEO] Unexpected error during enrichment: ${err.message}`);
      // Continue without geo data
    }

    // 5. Store the submission
    const submission = await SubmissionsRepository.create({
      widget_id: widgetId,
      user_id: widget.user_id,
      data: body.data,
      ip_address: ipAddress,
      geo_data: geoData,
      honeypot_triggered: false,
      idempotency_key: body.idempotency_key || null,
    });

    // 6. Email side effect (safe — never blocks success)
    try {
      const owner = await UsersRepository.findById(widget.user_id);
      if (owner) {
        // Fire and don't await — or await but catch errors
        await EmailService.sendSubmissionNotification(owner.email, widget, submission);
      }
    } catch (err) {
      // SAFE: email failure never blocks submission
      console.error(`[EMAIL] Side effect failed: ${err.message}`);
    }

    return {
      success: true,
      message: 'Submission received successfully',
      id: submission.id,
    };
  },
};

module.exports = SubmissionsService;

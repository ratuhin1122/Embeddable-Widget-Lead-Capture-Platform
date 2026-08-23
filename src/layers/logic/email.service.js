const nodemailer = require('nodemailer');
const config = require('../../config');

/**
 * Email notification service — safe side effect.
 * Sends notification when a new submission arrives.
 * FAILURE MUST NEVER BLOCK the submission — all errors are caught and logged.
 */
const EmailService = {
  /**
   * Get or create the SMTP transporter.
   */
  getTransporter() {
    if (!this._transporter) {
      this._transporter = nodemailer.createTransport({
        host: config.smtpHost,
        port: config.smtpPort,
        secure: false,
        // No auth needed for Mailpit
      });
    }
    return this._transporter;
  },

  /**
   * Send a submission notification email.
   * This is a SAFE side effect — any error is logged, never thrown.
   */
  async sendSubmissionNotification(ownerEmail, widget, submission) {
    try {
      const transporter = this.getTransporter();

      await transporter.sendMail({
        from: config.smtpFrom,
        to: ownerEmail,
        subject: `New submission on "${widget.title}"`,
        text: [
          `You received a new submission on your widget "${widget.title}".`,
          '',
          `Widget Type: ${widget.type}`,
          `Submission ID: ${submission.id}`,
          `Submitted at: ${submission.created_at}`,
          `IP: ${submission.ip_address}`,
          '',
          'Submission Data:',
          JSON.stringify(submission.data, null, 2),
          '',
          submission.geo_data
            ? `Location: ${submission.geo_data.city}, ${submission.geo_data.country}`
            : 'Location: Not available',
        ].join('\n'),
      });

      console.log(`[EMAIL] Notification sent to ${ownerEmail} for widget "${widget.title}"`);
      return true;
    } catch (err) {
      // SAFE SIDE EFFECT: log the error, never throw
      console.error(`[EMAIL] Failed to send notification to ${ownerEmail}: ${err.message}`);
      return false;
    }
  },
};

module.exports = EmailService;

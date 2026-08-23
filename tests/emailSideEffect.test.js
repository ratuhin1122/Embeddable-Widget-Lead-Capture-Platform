/**
 * Test: Safe Email Side Effect
 * Probe 5: Force the email/webhook to throw → submission still succeeds.
 */
const EmailService = require('../src/layers/logic/email.service');

describe('Safe Email Side Effect', () => {
  it('should return false (not throw) when email sending fails', async () => {
    // Force the transporter to throw
    const mockTransporter = {
      sendMail: jest.fn().mockRejectedValue(new Error('SMTP connection refused')),
    };

    EmailService._transporter = mockTransporter;

    const result = await EmailService.sendSubmissionNotification(
      'owner@example.com',
      { title: 'Test Widget', type: 'contact' },
      {
        id: 'test-submission-id',
        created_at: new Date().toISOString(),
        ip_address: '127.0.0.1',
        data: { name: 'Test' },
        geo_data: null,
      }
    );

    // Should return false (failure logged) — NOT throw
    expect(result).toBe(false);

    // Restore
    EmailService._transporter = null;
  });

  it('should return true when email sending succeeds', async () => {
    const mockTransporter = {
      sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' }),
    };

    EmailService._transporter = mockTransporter;

    const result = await EmailService.sendSubmissionNotification(
      'owner@example.com',
      { title: 'Test Widget', type: 'contact' },
      {
        id: 'test-submission-id',
        created_at: new Date().toISOString(),
        ip_address: '127.0.0.1',
        data: { name: 'Test' },
        geo_data: { country: 'US', city: 'New York' },
      }
    );

    expect(result).toBe(true);
    expect(mockTransporter.sendMail).toHaveBeenCalled();

    // Restore
    EmailService._transporter = null;
  });
});

const request = require('supertest');
const app = require('../src/server');
const UsersRepository = require('../src/layers/data/users.repository');
const WidgetsRepository = require('../src/layers/data/widgets.repository');

/**
 * Test: Honeypot Spam Control
 * Probe 6: Fill the honeypot field like a bot would → submission dropped or rejected.
 */
describe('Spam Control — Honeypot', () => {
  let testWidget;

  beforeAll(async () => {
    const user = await UsersRepository.create('spamtest@example.com', 'hashedpass123');
    testWidget = await WidgetsRepository.create(user.id, {
      type: 'contact',
      title: 'Honeypot Test Widget',
      fields: [{ name: 'name', type: 'text', label: 'Name', required: true }],
    });
  });

  it('should silently "accept" a submission with a filled honeypot (fake success)', async () => {
    // Bot fills the hidden honeypot field
    const res = await request(app)
      .post(`/api/submit/${testWidget.id}`)
      .set('Content-Type', 'application/json')
      .send({
        data: { name: 'Bot', email: 'bot@spam.com' },
        _honeypot: 'I am a bot filling hidden fields',
      });

    // Should return "success" to fool the bot (200 or 201)
    // but the submission should NOT actually be stored
    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);

    // The ID should be the dummy "honeypot triggered" ID
    expect(res.body.id).toBe('00000000-0000-0000-0000-000000000000');
  });

  it('should accept a submission with an empty honeypot (legitimate user)', async () => {
    // Legitimate users never fill the hidden honeypot field
    const res = await request(app)
      .post(`/api/submit/${testWidget.id}`)
      .set('Content-Type', 'application/json')
      .send({
        data: { name: 'Real User', email: 'real@example.com' },
        _honeypot: '',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.id).not.toBe('00000000-0000-0000-0000-000000000000');
  });
});

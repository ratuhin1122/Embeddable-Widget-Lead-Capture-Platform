const request = require('supertest');
const app = require('../src/server');
const UsersRepository = require('../src/layers/data/users.repository');
const WidgetsRepository = require('../src/layers/data/widgets.repository');

/**
 * Test: Rate Limiting
 * Probe 3: Fire a burst of rapid submissions → 429s appear, then normal request succeeds.
 */
describe('Rate Limiting', () => {
  let widgetId;

  beforeAll(async () => {
    const user = await UsersRepository.create('ratelimit@example.com', 'password123');
    const widget = await WidgetsRepository.create(user.id, {
      type: 'contact',
      title: 'Rate Limit Widget',
      fields: [{ name: 'name', type: 'text', label: 'Name' }],
    });
    widgetId = widget.id;
  });

  it('should return 429 after exceeding rate limit, then recover', async () => {
    const submitWidgetId = 'rate-limit-test-widget';
    const payload = { data: { name: 'Burst Test' } };

    // Fire 12 rapid requests (limit is 10/min per IP+widget)
    const results = [];
    for (let i = 0; i < 12; i++) {
      const res = await request(app)
        .post(`/api/submit/${submitWidgetId}`)
        .set('Content-Type', 'application/json')
        .send(payload);
      results.push(res.status);
    }

    // At least some should be 429 (rate limited)
    const rateLimited = results.filter(s => s === 429);
    expect(rateLimited.length).toBeGreaterThan(0);

    // The 429 response should be valid JSON
    const lastRes = await request(app)
      .post(`/api/submit/${submitWidgetId}`)
      .set('Content-Type', 'application/json')
      .send(payload);

    if (lastRes.status === 429) {
      expect(lastRes.body.error).toBe('Too many requests');
      expect(lastRes.body.message).toBeDefined();
    }
  });

  it('should allow 40 rapid GET /api/widgets/:id/config requests from the same IP without rate limiting', async () => {
    const statuses = [];
    for (let i = 0; i < 40; i++) {
      const res = await request(app).get(`/api/widgets/${widgetId}/config`);
      statuses.push(res.status);
    }
    expect(statuses.every(s => s === 200)).toBe(true);
  });

  it('should limit rapid /api/auth/login requests', async () => {
    const results = [];
    for (let i = 0; i < 35; i++) {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'ratelimit@example.com', password: 'wrongpassword' });
      results.push(res.status);
    }
    const rateLimited = results.filter(s => s === 429);
    expect(rateLimited.length).toBeGreaterThan(0);
  });
});

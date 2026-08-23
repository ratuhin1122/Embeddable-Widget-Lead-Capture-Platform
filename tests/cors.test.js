const request = require('supertest');
const app = require('../src/server');

/**
 * Test: CORS Preflight Handling
 * Probe 1 context: Cross-origin requests must work — CORS headers correct, OPTIONS handled.
 */
describe('CORS Preflight', () => {
  it('should respond to OPTIONS preflight with correct CORS headers', async () => {
    const res = await request(app)
      .options('/api/submit/test-widget-id')
      .set('Origin', 'http://localhost:5500')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'Content-Type');

    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-methods']).toContain('POST');
    expect(res.headers['access-control-allow-headers']).toContain('Content-Type');
  });

  it('should include CORS headers on actual POST to submission endpoint', async () => {
    const res = await request(app)
      .post('/api/submit/nonexistent-widget')
      .set('Origin', 'http://localhost:5500')
      .set('Content-Type', 'application/json')
      .send({ data: { name: 'test' } });

    // Should have CORS headers regardless of the response status
    expect(res.headers['access-control-allow-origin']).toBeDefined();
  });

  it('should include CORS headers on widget config endpoint', async () => {
    const res = await request(app)
      .get('/api/widgets/some-id/config')
      .set('Origin', 'http://localhost:5500');

    expect(res.headers['access-control-allow-origin']).toBeDefined();
  });
});

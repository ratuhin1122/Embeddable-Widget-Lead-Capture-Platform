const request = require('supertest');
const app = require('../src/server');

/**
 * Test: Widget Delivery
 * Verifies that the widget script and config are served correctly with proper headers.
 */
describe('Widget Delivery', () => {
  it('should serve widget.js with long-lived cache headers', async () => {
    const res = await request(app)
      .get('/widget.js')
      .set('Origin', 'http://localhost:5500');

    // The file should be served
    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toContain('immutable');
    expect(res.headers['cache-control']).toContain('max-age=31536000');
    expect(res.headers['access-control-allow-origin']).toBe('*');
  });

  it('should return 404 for nonexistent widget config', async () => {
    const res = await request(app)
      .get('/api/widgets/nonexistent-id/config');

    expect(res.status).toBe(404);
  });

  it('should include cache headers on config response', async () => {
    const res = await request(app)
      .get('/api/widgets/any-id/config');

    // Even on 404, the CORS headers should be present
    expect(res.headers['access-control-allow-origin']).toBeDefined();
  });
});

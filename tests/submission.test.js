const request = require('supertest');
const app = require('../src/server');

/**
 * Test: Input Validation
 * Probe 2: Malformed and oversized payloads → clean 4xx JSON errors, never a 500.
 */
describe('Input Validation', () => {
  describe('Malformed payloads', () => {
    it('should reject a submission with no data field — 400', async () => {
      const res = await request(app)
        .post('/api/submit/some-widget-id')
        .set('Content-Type', 'application/json')
        .send({ wrongField: 'test' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
      expect(res.body).not.toHaveProperty('stack'); // No stack trace leaks
    });

    it('should reject invalid JSON — 400', async () => {
      const res = await request(app)
        .post('/api/submit/some-widget-id')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }}}');

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should reject registration with invalid email — 400', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'not-an-email', password: 'password123' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
      expect(res.body.details).toBeDefined();
    });

    it('should reject registration with short password — 400', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: '123' });

      expect(res.status).toBe(400);
      expect(res.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'password' }),
        ])
      );
    });
  });

  describe('Oversized payloads', () => {
    it('should reject a payload larger than 10KB — 413', async () => {
      // Create a payload larger than 10KB
      const largeData = { data: { content: 'x'.repeat(15000) } };

      const res = await request(app)
        .post('/api/submit/some-widget-id')
        .set('Content-Type', 'application/json')
        .send(largeData);

      expect(res.status).toBe(413);
      expect(res.body.error).toBeDefined();
    });
  });

  describe('Auth validation', () => {
    it('should reject widget creation without auth — 401', async () => {
      const res = await request(app)
        .post('/api/widgets')
        .send({ type: 'contact', title: 'Test', fields: [{ name: 'email', type: 'email', label: 'Email' }] });

      expect(res.status).toBe(401);
      expect(res.body.error).toBeDefined();
    });

    it('should reject dashboard access without auth — 401', async () => {
      const res = await request(app).get('/api/dashboard/submissions');
      expect(res.status).toBe(401);
    });
  });
});

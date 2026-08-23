const request = require('supertest');
const app = require('../src/server');

describe('Dashboard API', () => {
  let token;
  let widgetId;

  beforeAll(async () => {
    const authRes = await request(app)
      .post('/api/auth/register')
      .send({ email: 'dashowner@example.com', password: 'password123' });
    token = authRes.body.token;

    const widgetRes = await request(app)
      .post('/api/widgets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'signup',
        title: 'Dashboard Test Widget',
        fields: [{ name: 'email', type: 'email', label: 'Email' }],
      });
    widgetId = widgetRes.body.widget.id;

    // Submit some entries
    await request(app)
      .post(`/api/submit/${widgetId}`)
      .send({ data: { email: 'lead1@example.com' } });

    await request(app)
      .post(`/api/submit/${widgetId}`)
      .send({ data: { email: 'lead2@example.com' } });
  });

  it('GET /api/dashboard/submissions returns paginated results', async () => {
    const res = await request(app)
      .get('/api/dashboard/submissions?page=1&limit=10')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.submissions).toBeDefined();
    expect(res.body.pagination).toBeDefined();
    expect(res.body.submissions.length).toBeGreaterThanOrEqual(2);
  });

  it('GET /api/dashboard/stats returns aggregated metrics', async () => {
    const res = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.total_submissions).toBeGreaterThanOrEqual(2);
    expect(res.body.submissions_by_day).toBeDefined();
    expect(res.body.submissions_by_widget).toBeDefined();
  });

  it('GET /api/dashboard/geo returns location breakdown', async () => {
    const res = await request(app)
      .get('/api/dashboard/geo')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.geo_distribution).toBeDefined();
  });
});

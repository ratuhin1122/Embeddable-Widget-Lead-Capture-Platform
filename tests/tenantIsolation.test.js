const request = require('supertest');
const app = require('../src/server');

describe('Multi-Tenant Isolation', () => {
  let tokenUserA;
  let tokenUserB;
  let widgetAId;

  beforeAll(async () => {
    // Register User A
    const resA = await request(app)
      .post('/api/auth/register')
      .send({ email: 'tenantA@example.com', password: 'password123' });
    tokenUserA = resA.body.token;

    // Register User B
    const resB = await request(app)
      .post('/api/auth/register')
      .send({ email: 'tenantB@example.com', password: 'password123' });
    tokenUserB = resB.body.token;

    // User A creates a widget
    const widgetRes = await request(app)
      .post('/api/widgets')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({
        type: 'contact',
        title: 'Tenant A Secret Widget',
        fields: [{ name: 'name', type: 'text', label: 'Name' }],
      });
    widgetAId = widgetRes.body.widget.id;
  });

  it('User B cannot view User A widget in their widget list', async () => {
    const res = await request(app)
      .get('/api/widgets')
      .set('Authorization', `Bearer ${tokenUserB}`);

    expect(res.status).toBe(200);
    const ids = res.body.widgets.map(w => w.id);
    expect(ids).not.toContain(widgetAId);
  });

  it('User B cannot get User A widget by ID (returns 404)', async () => {
    const res = await request(app)
      .get(`/api/widgets/${widgetAId}`)
      .set('Authorization', `Bearer ${tokenUserB}`);

    expect(res.status).toBe(404);
  });

  it('User B cannot update User A widget (returns 404)', async () => {
    const res = await request(app)
      .put(`/api/widgets/${widgetAId}`)
      .set('Authorization', `Bearer ${tokenUserB}`)
      .send({ title: 'Hacked by B' });

    expect(res.status).toBe(404);
  });

  it('User B cannot delete User A widget (returns 404)', async () => {
    const res = await request(app)
      .delete(`/api/widgets/${widgetAId}`)
      .set('Authorization', `Bearer ${tokenUserB}`);

    expect(res.status).toBe(404);
  });
});

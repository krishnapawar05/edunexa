import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from './app.js';

describe('EduNexa Core Server Foundation', () => {
  it('GET /api/health should return 200 with standardized success envelope', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('service', 'EduNexa ERP Core Engine');
    expect(res.body.data).toHaveProperty('uptimeSeconds');
    expect(res.body.data).toHaveProperty('database');
  });

  it('GET /api/undefined-endpoint should return 404 with structured error envelope', async () => {
    const res = await request(app).get('/api/undefined-endpoint');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toHaveProperty('code', 'NOT_FOUND');
  });
});

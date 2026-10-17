import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from './app.js';
import { env } from './config/env.js';

describe('EduNexa Core Server Foundation', () => {
  it('GET /api/health should return 200 with standardized success envelope', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('service', 'EduNexa ERP Core Engine');
    expect(res.body.data).toHaveProperty('uptimeSeconds');
    expect(res.body.data).toHaveProperty('database');
    expect(res.body.data.database).toHaveProperty('status');
  });

  it('GET /api/undefined-endpoint should return 404 with structured error envelope', async () => {
    const res = await request(app).get('/api/undefined-endpoint');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toHaveProperty('code', 'NOT_FOUND');
    expect(res.body.error).toHaveProperty('message');
  });

  it('CORS and Security Headers should be present on responses', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'http://localhost:5173');
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-dns-prefetch-control']).toBe('off');
  });

  it('Environment configuration should enforce validated types', () => {
    expect(['development', 'production', 'test']).toContain(env.nodeEnv);
    expect(typeof env.port).toBe('number');
    expect(env.port).toBeGreaterThan(0);
    expect(typeof env.jwtAccessSecret).toBe('string');
    expect(env.jwtAccessSecret.length).toBeGreaterThan(0);
  });
});

import { test, expect } from '@playwright/test';
import { getValidator } from './helpers/schema-validator';

const BASE_URL = 'https://restful-booker.herokuapp.com';

test.describe('POST /auth', () => {

  const validateAuth200 = getValidator('auth-openapi.yaml', '/auth', 'post', '200');

  test('200 + valid token for correct credentials', async ({ request }) => {
    const start = Date.now();
    const res = await request.post(`${BASE_URL}/auth`, {
      data: {
        username: process.env.RESTFUL_BOOKER_USER || 'admin',
        password: process.env.RESTFUL_BOOKER_PASS || 'password123'
      }
    });
    const latencyMs = Date.now() - start;

    expect(res.status()).toBe(200);
    expect(latencyMs).toBeLessThan(2000);

    const body = await res.json();
    const { valid, errors } = validateAuth200(body);
    expect(valid, `Schema validation failed: ${errors.join(', ')}`).toBe(true);

    // Keep the length constraint assertion
    expect(body.token.length).toBeGreaterThanOrEqual(10);
  });

  test('200 + bad credentials for wrong password', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/auth`, {
      data: {
        username: 'admin',
        password: 'badpassword'
      }
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    
    const { valid, errors } = validateAuth200(body);
    expect(valid, `Schema validation failed: ${errors.join(', ')}`).toBe(true);
    expect(body.reason).toBe('Bad credentials');
  });

  test('200 + bad credentials for missing credentials', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/auth`, {
      data: {}
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    
    const { valid, errors } = validateAuth200(body);
    expect(valid, `Schema validation failed: ${errors.join(', ')}`).toBe(true);
    expect(body.reason).toBe('Bad credentials');
  });

});

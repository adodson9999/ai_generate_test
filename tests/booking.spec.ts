import { test, expect } from './fixtures/auth-token';
import { getValidator } from './helpers/schema-validator';

const BASE_URL = 'https://restful-booker.herokuapp.com';
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

test.describe('GET /booking/{id}', () => {
  let validBookingId: number;
  const validateGet = getValidator('booking-openapi.yaml', '/booking/{id}', 'get', '200');

  test.beforeAll(async ({ request }) => {
    const res = await request.get(`${BASE_URL}/booking`);
    const ids = await res.json();
    validBookingId = ids[0].bookingid;
  });

  test('200 + schema-valid booking for a known ID', async ({ request }) => {
    const start = Date.now();
    const res = await request.get(`${BASE_URL}/booking/${validBookingId}`);
    const latencyMs = Date.now() - start;

    expect(res.status()).toBe(200);
    expect(latencyMs).toBeLessThan(2000);

    const body = await res.json();
    const { valid, errors } = validateGet(body);
    expect(valid, `Schema validation failed: ${errors.join(', ')}`).toBe(true);

    // Keep the constraint assertions
    expect(body.totalprice).toBeGreaterThanOrEqual(0);
    expect(body.bookingdates.checkin).toMatch(ISO_DATE);
    expect(body.bookingdates.checkout).toMatch(ISO_DATE);
    expect(new Date(body.bookingdates.checkout).getTime())
      .toBeGreaterThanOrEqual(new Date(body.bookingdates.checkin).getTime());
  });

  test('404 for a non-existent ID', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/booking/99999999`);
    expect(res.status()).toBe(404);
  });
});

test.describe('Protected endpoints', () => {
  let validBookingId: number;
  const updatePayload = {
    firstname: "James",
    lastname: "Brown",
    totalprice: 111,
    depositpaid: true,
    bookingdates: {
      checkin: "2026-01-01",
      checkout: "2026-01-02"
    },
    additionalneeds: "Breakfast"
  };

  test.beforeAll(async ({ request }) => {
    const res = await request.post(`${BASE_URL}/booking`, {
      data: updatePayload
    });
    const body = await res.json();
    validBookingId = body.bookingid;
  });

  test('PUT 403 without token, 200 with token', async ({ request, authToken }) => {
    const resNoAuth = await request.put(`${BASE_URL}/booking/${validBookingId}`, {
      data: updatePayload
    });
    expect(resNoAuth.status()).toBe(403);

    const resAuth = await request.put(`${BASE_URL}/booking/${validBookingId}`, {
      headers: { Cookie: `token=${authToken}` },
      data: updatePayload
    });
    expect(resAuth.status()).toBe(200);
  });

  test('PATCH 403 without token, 200 with token', async ({ request, authToken }) => {
    const resNoAuth = await request.patch(`${BASE_URL}/booking/${validBookingId}`, {
      data: { firstname: "Jane" }
    });
    expect(resNoAuth.status()).toBe(403);

    const resAuth = await request.patch(`${BASE_URL}/booking/${validBookingId}`, {
      headers: { Cookie: `token=${authToken}` },
      data: { firstname: "Jane" }
    });
    expect(resAuth.status()).toBe(200);
  });

  test('DELETE 403 without token, 201 with token', async ({ request, authToken }) => {
    const resNoAuth = await request.delete(`${BASE_URL}/booking/${validBookingId}`);
    expect(resNoAuth.status()).toBe(403);

    const resAuth = await request.delete(`${BASE_URL}/booking/${validBookingId}`, {
      headers: { Cookie: `token=${authToken}` }
    });
    expect(resAuth.status()).toBe(201);
  });
});

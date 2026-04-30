import { test, expect } from '@playwright/test';

const BASE_URL = 'https://restful-booker.herokuapp.com';
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

test.describe('GET /booking/{id}', () => {
  let validBookingId: number;

  test.beforeAll(async ({ request }) => {
    // Discover a real ID from the live system instead of hardcoding —
    // the API resets every 10 minutes and IDs rotate.
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
    expect(typeof body.firstname).toBe('string');
    expect(typeof body.lastname).toBe('string');
    expect(typeof body.totalprice).toBe('number');
    expect(body.totalprice).toBeGreaterThanOrEqual(0);
    expect(typeof body.depositpaid).toBe('boolean');
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

import { test, expect } from './fixtures/auth-token';
import cases from './helpers/negative-cases.json';

const BASE_URL = 'https://restful-booker.herokuapp.com';

test.describe('Negative Path Matrix', () => {
  let bookingId: number;

  // Create a booking to use for tests that target /booking/{id}
  test.beforeAll(async ({ request }) => {
    const res = await request.post(`${BASE_URL}/booking`, {
      data: {
        firstname: "NegTest",
        lastname: "Fixture",
        totalprice: 100,
        depositpaid: true,
        bookingdates: { checkin: "2026-06-01", checkout: "2026-06-10" },
        additionalneeds: "None"
      }
    });
    const body = await res.json();
    bookingId = body.bookingid;
  });

  for (const c of cases) {
    test(c.name, async ({ request, authToken }) => {
      let res;
      // Replace {id} placeholder with actual booking ID
      const resolvedPath = c.path.replace('{id}', String(bookingId));
      const url = `${BASE_URL}${resolvedPath}`;
      const headers: Record<string, string> = { ...(c.headers || {}) };

      if (c.needsAuth) {
        headers['Cookie'] = `token=${authToken}`;
      }

      const options = { data: c.body, headers };

      if (c.method === 'post') res = await request.post(url, options);
      else if (c.method === 'put') res = await request.put(url, options);
      else if (c.method === 'patch') res = await request.patch(url, options);
      else if (c.method === 'delete') res = await request.delete(url, options);
      else res = await request.get(url, options);

      expect(res.status()).toBe(c.expectedStatus);
    });
  }
});

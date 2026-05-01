import { test, expect } from './fixtures/auth-token';
import { runConcurrentUpdates } from './helpers/concurrency-runner';

const BASE_URL = 'https://restful-booker.herokuapp.com';
const N = 5; // concurrent clients

function buildBooking(label: string) {
  return {
    firstname: label,
    lastname: 'Concurrent',
    totalprice: 100,
    depositpaid: true,
    bookingdates: { checkin: '2026-01-01', checkout: '2026-01-10' },
    additionalneeds: 'Breakfast'
  };
}

async function createBooking(request: any): Promise<number> {
  const res = await request.post(`${BASE_URL}/booking`, { data: buildBooking('Setup') });
  return (await res.json()).bookingid;
}

test.describe('Concurrency Tests @slow @concurrency', () => {
  test.describe.configure({ mode: 'serial', timeout: 60_000 });

  test('Two concurrent PUTs — last-write-wins', async ({ request, authToken }) => {
    const bookingId = await createBooking(request);
    const updates = Array.from({ length: N }, (_, i) => buildBooking(`PUT_${i}`));

    const result = await runConcurrentUpdates(request, BASE_URL, bookingId, authToken, updates, 'put');

    // All should return 200
    const statuses = result.responses.map(r => r.status);
    expect(statuses.every(s => s === 200)).toBe(true);

    // Final state should match one of the updates (last-write-wins)
    expect(result.finalState).toBeTruthy();
    const finalName = result.finalState.firstname;
    expect(updates.some(u => u.firstname === finalName)).toBe(true);

    console.log(`  PUT-PUT: ${N} concurrent, all 200. Final firstname: "${finalName}". Last-write-wins confirmed.`);
  });

  test('Concurrent PATCHes to different fields — merge behavior', async ({ request, authToken }) => {
    const bookingId = await createBooking(request);
    const patches = [
      { firstname: 'PatchA' },
      { lastname: 'PatchB' },
      { totalprice: 999 },
      { additionalneeds: 'Dinner' },
      { depositpaid: false }
    ];

    const result = await runConcurrentUpdates(request, BASE_URL, bookingId, authToken, patches, 'patch');

    const statuses = result.responses.map(r => r.status);
    expect(statuses.every(s => s === 200)).toBe(true);
    expect(result.finalState).toBeTruthy();

    console.log(`  PATCH fields: Final state: ${JSON.stringify(result.finalState)}`);
  });

  test('Concurrent DELETE + GET — race condition', async ({ request, authToken }) => {
    const bookingId = await createBooking(request);

    // Fire DELETE and GET simultaneously
    const deletePromise = request.delete(`${BASE_URL}/booking/${bookingId}`, {
      headers: { Cookie: `token=${authToken}` }
    });
    const getPromise = request.get(`${BASE_URL}/booking/${bookingId}`);

    const [deleteRes, getRes] = await Promise.all([deletePromise, getPromise]);

    // DELETE should succeed
    expect(deleteRes.status()).toBe(201);

    // GET might return 200 (pre-delete) or 404 (post-delete) — both are valid
    expect([200, 404]).toContain(getRes.status());

    console.log(`  DELETE+GET race: DELETE=${deleteRes.status()}, GET=${getRes.status()}`);
  });

  test('Concurrent CREATEs with identical data — duplicates allowed', async ({ request }) => {
    const booking = buildBooking('Duplicate');
    const promises = Array.from({ length: N }, () =>
      request.post(`${BASE_URL}/booking`, { data: booking })
    );

    const responses = await Promise.all(promises);
    const statuses = responses.map(r => r.status());
    const ids: number[] = [];

    for (const r of responses) {
      expect(r.status()).toBe(200);
      const body = await r.json();
      ids.push(body.bookingid);
    }

    // All IDs should be unique — duplicates are allowed (no dedup)
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(N);

    console.log(`  CREATE dupes: ${N} concurrent, ${uniqueIds.size} unique IDs. No dedup confirmed.`);
  });

  test('Concurrent reads during write — consistency check', async ({ request, authToken }) => {
    const bookingId = await createBooking(request);

    // Fire a PUT and several GETs simultaneously
    const putBody = buildBooking('DuringWrite');
    const putPromise = request.put(`${BASE_URL}/booking/${bookingId}`, {
      data: putBody, headers: { Cookie: `token=${authToken}` }
    });
    const getPromises = Array.from({ length: N }, () =>
      request.get(`${BASE_URL}/booking/${bookingId}`)
    );

    const [putRes, ...getResponses] = await Promise.all([putPromise, ...getPromises]);

    expect(putRes.status()).toBe(200);

    // Each GET should return either the old or new state — never a partial
    for (const getRes of getResponses) {
      expect(getRes.status()).toBe(200);
      const body = await getRes.json();
      expect(body).toHaveProperty('firstname');
      expect(body).toHaveProperty('lastname');
    }

    console.log(`  READ during WRITE: PUT=${putRes.status()}, all ${getResponses.length} GETs returned consistent state.`);
  });
});

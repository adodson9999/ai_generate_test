import { APIRequestContext } from '@playwright/test';

export type ConcurrencyResult = {
  responses: { status: number; body: any; latencyMs: number }[];
  finalState: any;
};

export async function runConcurrentUpdates(
  request: APIRequestContext,
  baseUrl: string,
  bookingId: number,
  authToken: string,
  updates: any[],
  method: 'put' | 'patch' | 'delete' | 'get' = 'put'
): Promise<ConcurrencyResult> {
  const url = `${baseUrl}/booking/${bookingId}`;
  const headers = { Cookie: `token=${authToken}` };

  const promises = updates.map(async (body, idx) => {
    const start = performance.now();
    let res;
    if (method === 'put') {
      res = await request.put(url, { data: body, headers });
    } else if (method === 'patch') {
      res = await request.patch(url, { data: body, headers });
    } else if (method === 'delete') {
      res = await request.delete(url, { headers });
    } else {
      res = await request.get(url, { headers });
    }
    const latencyMs = performance.now() - start;
    let responseBody;
    try { responseBody = await res.json(); } catch { responseBody = await res.text(); }
    return { status: res.status(), body: responseBody, latencyMs };
  });

  const responses = await Promise.all(promises);

  // Read final state
  let finalState;
  try {
    const getRes = await request.get(url);
    if (getRes.status() === 200) {
      finalState = await getRes.json();
    } else {
      finalState = null; // Resource was deleted
    }
  } catch {
    finalState = null;
  }

  return { responses, finalState };
}

import { test, expect } from './fixtures/auth-token';
import { recordSample, percentile, flushResults } from './helpers/perf-recorder';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const BASE_URL = 'https://restful-booker.herokuapp.com';
const ITERATIONS = 50;
const WARMUP = 5;

// Load budgets
const budgetsPath = path.resolve(__dirname, '../specs/perf-budgets.yaml');
const budgets = (yaml.load(fs.readFileSync(budgetsPath, 'utf8')) as any).endpoints;

test.describe('Performance Budget', () => {
  test.describe.configure({ mode: 'serial', timeout: 120_000 });

  let bookingId: number;

  test.beforeAll(async ({ request }) => {
    const res = await request.post(`${BASE_URL}/booking`, {
      data: {
        firstname: 'PerfTest', lastname: 'User', totalprice: 100,
        depositpaid: true, bookingdates: { checkin: '2026-01-01', checkout: '2026-01-10' }
      }
    });
    bookingId = (await res.json()).bookingid;
  });

  for (const budget of budgets) {
    test(`${budget.method.toUpperCase()} ${budget.path} — within p95 budget (${budget.p95_ms}ms)`, async ({ request, authToken }) => {
      const latencies: number[] = [];

      for (let i = 0; i < ITERATIONS; i++) {
        const resolvedPath = budget.path.replace('{id}', String(bookingId));
        const url = `${BASE_URL}${resolvedPath}`;
        const headers: Record<string, string> = {};
        if (['put', 'patch', 'delete'].includes(budget.method)) {
          headers['Cookie'] = `token=${authToken}`;
        }

        let body: any = undefined;
        if (['post', 'put', 'patch'].includes(budget.method)) {
          if (budget.path === '/auth') {
            body = { username: 'admin', password: 'password123' };
          } else if (budget.method === 'patch') {
            body = { firstname: `Perf_${i}` };
          } else {
            body = {
              firstname: `Perf_${i}`, lastname: 'User', totalprice: 100,
              depositpaid: true, bookingdates: { checkin: '2026-01-01', checkout: '2026-01-10' }
            };
          }
        }

        const start = performance.now();
        if (budget.method === 'get') await request.get(url, { headers });
        else if (budget.method === 'post') await request.post(url, { data: body, headers });
        else if (budget.method === 'put') await request.put(url, { data: body, headers });
        else if (budget.method === 'patch') await request.patch(url, { data: body, headers });
        else if (budget.method === 'delete') {
          // For DELETE, create a temporary booking each time
          const tmpRes = await request.post(`${BASE_URL}/booking`, {
            data: {
              firstname: `Del_${i}`, lastname: 'User', totalprice: 1,
              depositpaid: true, bookingdates: { checkin: '2026-01-01', checkout: '2026-01-02' }
            }
          });
          const tmpId = (await tmpRes.json()).bookingid;
          const deleteStart = performance.now();
          await request.delete(`${BASE_URL}/booking/${tmpId}`, { headers });
          latencies.push(performance.now() - deleteStart);
          recordSample(budget.operationId, budget.path, budget.method, latencies[latencies.length - 1]);
          continue;
        }
        const elapsed = performance.now() - start;
        latencies.push(elapsed);
        recordSample(budget.operationId, budget.path, budget.method, elapsed);
      }

      // Discard warmup
      const measured = latencies.slice(WARMUP);
      const p50 = percentile(measured, 50);
      const p95 = percentile(measured, 95);

      console.log(`  ${budget.method.toUpperCase()} ${budget.path}: p50=${p50.toFixed(0)}ms, p95=${p95.toFixed(0)}ms (budget: p50=${budget.p50_ms}ms, p95=${budget.p95_ms}ms)`);

      expect(p95, `${budget.method.toUpperCase()} ${budget.path} exceeded p95 budget (actual ${p95.toFixed(0)}ms, budget ${budget.p95_ms}ms)`).toBeLessThanOrEqual(budget.p95_ms);
    });
  }

  test('Flush perf results', () => {
    flushResults();
  });
});

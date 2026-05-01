import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

export type NegativeCase = {
  name: string;
  operationId: string;
  path: string;
  method: string;
  body?: any;
  headers?: Record<string, string>;
  expectedStatus: number;
  needsAuth?: boolean;   // If true, include a valid auth token
  quirk?: string;        // Documents deviation from spec (does NOT skip the test)
};

const buildValidBody = () => ({
  firstname: "John",
  lastname: "Doe",
  totalprice: 111,
  depositpaid: true,
  bookingdates: {
    checkin: "2026-01-01",
    checkout: "2026-01-02"
  },
  additionalneeds: "Breakfast"
});

export function generateNegativeCases(): NegativeCase[] {
  const matrixPath = path.resolve(__dirname, '../../specs/negative-matrix.yaml');
  const matrixContent = fs.readFileSync(matrixPath, 'utf8');
  const matrix = yaml.load(matrixContent) as any;

  const cases: NegativeCase[] = [];

  for (const endpoint of matrix.endpoints) {
    const { operationId, path: apiPath, method, apply } = endpoint;
    const isProtected = ['put', 'patch', 'delete'].includes(method.toLowerCase());

    // ── Missing required fields ──────────────────────────────────────
    if (apply.includes('missing_required')) {
      const requiredFields = ['firstname', 'lastname', 'totalprice', 'depositpaid', 'bookingdates'];
      for (const field of requiredFields) {
        const body = buildValidBody();
        delete (body as any)[field];

        if (method.toLowerCase() === 'post') {
          // POST with missing fields → API returns 500 Internal Server Error
          cases.push({
            name: `${method.toUpperCase()} ${apiPath} — missing required field '${field}'`,
            operationId, path: apiPath, method, body,
            expectedStatus: 500,
            quirk: "API returns 500 instead of 400 for missing required fields on POST"
          });
        } else {
          // PUT with missing fields (with auth) → API returns 400 Bad Request
          cases.push({
            name: `${method.toUpperCase()} ${apiPath} — missing required field '${field}'`,
            operationId, path: apiPath, method, body,
            expectedStatus: 400,
            needsAuth: true
          });
        }
      }
    }

    // ── Wrong types ──────────────────────────────────────────────────
    if (apply.includes('wrong_type')) {
      // totalprice as string
      const bodyStr = buildValidBody();
      (bodyStr as any).totalprice = "111";
      cases.push({
        name: `${method.toUpperCase()} ${apiPath} — 'totalprice' as string`,
        operationId, path: apiPath, method, body: bodyStr,
        expectedStatus: 200,
        needsAuth: isProtected,
        quirk: "API silently accepts string where number is expected"
      });

      // firstname as number
      const bodyNum = buildValidBody();
      (bodyNum as any).firstname = 123;
      if (method.toLowerCase() === 'post' || method.toLowerCase() === 'put') {
        // POST and PUT with firstname as number → 500
        cases.push({
          name: `${method.toUpperCase()} ${apiPath} — 'firstname' as number`,
          operationId, path: apiPath, method, body: bodyNum,
          expectedStatus: 500,
          needsAuth: isProtected,
          quirk: "API returns 500 instead of 400 when firstname is a number"
        });
      } else {
        // PATCH with firstname as number (with auth) → 200
        cases.push({
          name: `${method.toUpperCase()} ${apiPath} — 'firstname' as number`,
          operationId, path: apiPath, method, body: bodyNum,
          expectedStatus: 200,
          needsAuth: true,
          quirk: "API silently accepts number where string is expected"
        });
      }
    }

    // ── Format violations ────────────────────────────────────────────
    if (apply.includes('format')) {
      const body = buildValidBody();
      body.bookingdates.checkin = "not-a-date";
      cases.push({
        name: `${method.toUpperCase()} ${apiPath} — invalid date format for 'checkin'`,
        operationId, path: apiPath, method, body,
        expectedStatus: 200,
        needsAuth: isProtected,
        quirk: "API silently accepts invalid date strings"
      });
    }

    // ── Constraint violations ────────────────────────────────────────
    if (apply.includes('constraint')) {
      const body = buildValidBody();
      body.totalprice = -10;
      cases.push({
        name: `${method.toUpperCase()} ${apiPath} — 'totalprice' less than minimum (0)`,
        operationId, path: apiPath, method, body,
        expectedStatus: 200,
        needsAuth: isProtected,
        quirk: "API silently accepts negative totalprice"
      });
    }

    // ── Auth checks ──────────────────────────────────────────────────
    if (apply.includes('auth') && isProtected) {
      cases.push({
        name: `${method.toUpperCase()} ${apiPath} — missing auth token`,
        operationId, path: apiPath, method, body: buildValidBody(),
        expectedStatus: 403
      });
      cases.push({
        name: `${method.toUpperCase()} ${apiPath} — invalid auth token`,
        operationId, path: apiPath, method, body: buildValidBody(),
        headers: { Cookie: 'token=invalid123' },
        expectedStatus: 403
      });
    }

    // ── Non-existent resource ────────────────────────────────────────
    if (apply.includes('resource') && apiPath.includes('{id}')) {
      if (method.toLowerCase() === 'get') {
        cases.push({
          name: `${method.toUpperCase()} ${apiPath} — non-existent resource ID`,
          operationId, path: apiPath.replace('{id}', '99999999'), method, body: buildValidBody(),
          expectedStatus: 404
        });
      } else {
        // PUT/PATCH/DELETE on non-existent ID with valid auth → 405
        cases.push({
          name: `${method.toUpperCase()} ${apiPath} — non-existent resource ID`,
          operationId, path: apiPath.replace('{id}', '99999999'), method, body: buildValidBody(),
          expectedStatus: 405,
          needsAuth: true,
          quirk: "API returns 405 instead of 404 for non-existent resource on protected endpoints"
        });
      }
    }

    // ── Wrong HTTP method ────────────────────────────────────────────
    if (apply.includes('method')) {
      const wrongMethod = method.toLowerCase() === 'post' ? 'patch' : 'post';
      cases.push({
        name: `${wrongMethod.toUpperCase()} ${apiPath} — wrong HTTP method`,
        operationId, path: apiPath, method: wrongMethod, body: buildValidBody(),
        expectedStatus: 404,
        quirk: "API returns 404 instead of 405 for wrong HTTP method"
      });
    }
  }

  return cases;
}

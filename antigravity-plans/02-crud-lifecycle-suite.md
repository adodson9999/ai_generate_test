# Plan 02 — CRUD Lifecycle Suite

## Goal
Build a chained Create → Read → Update → Patch → Delete test that walks a single booking through its full lifecycle in one ordered run, asserting state at every step.

## Why this matters
Single-endpoint tests prove an endpoint works. A lifecycle test proves the *system* works: that a created resource is readable, an updated resource keeps its ID, a patched resource preserves untouched fields, and a deleted resource is actually gone. This is the test that catches contract-level regressions.

## Inputs
Read these files first:
- `specs/booking-openapi.yaml` — extend it with the full set of verbs
- Plan 01's outputs — `tests/fixtures/auth-token.ts` and `cypress/support/auth.js`
- `prompts/api-test-gen.md`

## Deliverables
Create:
- `specs/booking-lifecycle.feature` — Gherkin file with one scenario containing 5 steps (Create, Read, Update, Patch, Delete) chained by booking ID
- `specs/booking-lifecycle-openapi.yaml` — full OpenAPI fragment covering POST/GET/PUT/PATCH/DELETE on `/booking` and `/booking/:id`
- `tests/booking-lifecycle.spec.ts` — Playwright suite running serially, sharing state via `test.describe.configure({ mode: 'serial' })`
- `cypress/e2e/booking-lifecycle.cy.js` — Cypress suite using before/beforeEach to thread the booking ID through tests

## Acceptance criteria
- The suite creates a booking with random data (use the date format Restful-Booker expects: `YYYY-MM-DD`).
- It reads the booking back and asserts every field round-trips.
- It updates the entire booking (PUT) and asserts the response reflects the new values.
- It patches one field (PATCH) and asserts the patched field changed *and* unrelated fields are unchanged.
- It deletes the booking and asserts a follow-up GET returns 404.
- If any step fails, downstream steps are skipped (not failed) — the suite must report the *first* failure clearly.
- The booking ID is never hardcoded.
- The suite is idempotent — running it twice in a row both pass.

## Constraints
- No fixture files. Use a builder function for the request body (Plan 09 will replace this with a proper factory; for now inline is fine).
- Do not depend on a specific booking already existing in the sandbox.
- Tests must run in serial within this file but must not block other test files from running in parallel.
- Use the auth fixture from Plan 01 — do not redeclare auth logic.

## Suggested approach
1. Read the apidoc to confirm PUT vs PATCH semantics — Restful-Booker's PUT requires the full body, PATCH accepts partial.
2. Confirm date format and number formats for `totalprice` via a quick curl.
3. Write the feature file as a single scenario with five steps. Each step has a clear Given/When/Then.
4. Write the OpenAPI fragment covering all five operations with their request bodies and response schemas.
5. Generate Playwright and Cypress suites via the hero prompt with one important deviation: tests in this file share state, so the prompt's "no fixture files" rule still holds, but tests pass the ID forward via a closure variable (Playwright) or `Cypress.env('bookingId')` (Cypress).
6. Run both suites twice in a row. Confirm idempotency.

## Verification commands
```
npm run test:playwright -- tests/booking-lifecycle.spec.ts --repeat-each=2
npm run test:cypress -- --spec cypress/e2e/booking-lifecycle.cy.js
npm run test:cypress -- --spec cypress/e2e/booking-lifecycle.cy.js   # prove idempotency
```

## Walkthrough requirements
- Diff of the new feature file, OpenAPI fragment, and both test files
- Terminal output showing both Playwright runs (×2 for repeat) green and both Cypress runs green
- A short note in the artifact explaining the PUT vs PATCH distinction the agent had to handle
- A screenshot of the Playwright HTML report showing the lifecycle suite's 5 chained tests in green

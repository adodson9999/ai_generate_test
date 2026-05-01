# Plan 04 — Negative Path Matrix

## Goal
Generate a comprehensive negative-test matrix covering every documented error response, every required-field-missing case, every type-mismatch case, and every boundary violation — driven directly off the OpenAPI fragment.

## Why this matters
Most "AI-generated test" demos only show happy-path output. Negative coverage is where reliability lives. A matrix-driven approach proves the generation pipeline isn't just a one-trick prompt — it can fan out from one OpenAPI fragment to dozens of negative cases without a human writing each one.

## Inputs
- All OpenAPI fragments in `specs/`
- `prompts/api-test-gen.md` — its negative-test rule (one per documented error response) is the floor; this plan goes further
- Outputs from Plans 01-03

## Deliverables
Create:
- `specs/negative-matrix.yaml` — config file enumerating which violation classes apply to which endpoints (see Constraints below for shape)
- `tests/helpers/negative-generator.ts` — code that reads an OpenAPI fragment + the matrix config and generates a list of `{ name, request, expectedStatus, expectedReason }` cases
- `tests/booking.negative.spec.ts` — Playwright suite that consumes the generator output via `test.each` (or Playwright's parameterize pattern)
- `cypress/e2e/booking.negative.cy.js` — Cypress equivalent using a `forEach` over the generator output
- `docs/negative-matrix.md` — human-readable table of generated cases for the PR description

## Violation classes the generator must produce
For each operation in the OpenAPI fragment, generate cases for:
1. **Missing required field** — one case per required field
2. **Wrong type** — one case per typed field (string→number, number→string, etc.)
3. **Format violation** — one case per format constraint (date, email, uri)
4. **Constraint violation** — minimum/maximum, minLength/maxLength, pattern, enum
5. **Auth violation** — for protected endpoints, one case with no token, one with malformed token, one with revoked token (if applicable)
6. **Resource violation** — for path-param endpoints, one case with a non-existent ID (use ID `99999999`)
7. **Method violation** — one case per endpoint with a wrong HTTP method (e.g. `PATCH` on a `GET`-only endpoint)

## Acceptance criteria
- For the booking endpoints, the generator produces ≥ 25 distinct negative cases.
- Every case has a deterministic name like `POST /booking — totalprice as string returns 400`.
- The Playwright and Cypress suites run the same set of cases with the same names (parity).
- Cases that the live Restful-Booker API doesn't actually validate (it's a sandbox; some violations return 200 with garbage) are detected and marked `xtest` / `it.skip` with a comment naming the API quirk — they're not silently dropped.
- The total runtime of the negative suite stays under 60 seconds in both runners (parallelize within the suite).

## Constraints
- The matrix config file is the only thing a human should ever need to edit. The generator + tests are derived.
- Do not write each negative case by hand. The whole point is generation.
- The matrix config uses a shape like:
  ```yaml
  endpoints:
    - operationId: createBooking
      apply: [missing_required, wrong_type, format, constraint]
    - operationId: updateBooking
      apply: [missing_required, wrong_type, auth, resource]
  ```
- Generated cases must use `test.each` (Playwright) or a `forEach` loop (Cypress) — not a 25-test copy-paste.

## Suggested approach
1. Write `negative-generator.ts` first. Test it in isolation (3-4 unit tests in `tests/helpers/__tests__/`).
2. Write the matrix config — start with one operation, expand once the generator works.
3. Wire the generator into `booking.negative.spec.ts` with `test.each`. Run it. Expect some failures from sandbox quirks. Investigate each. Either:
   - The case is genuinely a real bug → leave it failing and flag it
   - The case is a sandbox quirk → `test.skip` with a clear comment
   - The case has wrong expectations → fix the generator
4. Mirror to Cypress.
5. Generate `docs/negative-matrix.md` from the generator output (programmatically — write a small script that prints the table).

## Verification commands
```
npm run test:playwright -- tests/helpers/__tests__/negative-generator.spec.ts
npm run test:playwright -- tests/booking.negative.spec.ts
npm run test:cypress -- --spec cypress/e2e/booking.negative.cy.js
node tests/helpers/print-negative-matrix.js > docs/negative-matrix.md
```

## Walkthrough requirements
- The full generated matrix table in `docs/negative-matrix.md`
- A list of sandbox quirks the agent encountered and how it handled each
- Total case count and runtime per runner
- A screenshot of the Playwright HTML report scrolled to show the negative suite's parameterized output

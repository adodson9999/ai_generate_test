# Plan 01 — Auth Token Lifecycle

## Goal
Add an end-to-end auth flow test suite for `POST /auth` and prove that protected endpoints (`PUT`, `PATCH`, `DELETE` on `/booking/:id`) reject unauthenticated requests and accept authenticated ones.

## Why this matters
The current repo only exercises read paths. Without auth coverage, half the API surface is untested and the resume bullet about "comprehensive E2E coverage" is hollow. This plan closes that gap and produces a reusable token fixture downstream plans depend on.

## Inputs
Read these files first:
- `specs/booking-openapi.yaml` — confirm or extend the auth scheme
- `prompts/api-test-gen.md` — output contract you must follow
- `tests/booking.spec.ts` — current Playwright structure to mirror
- `cypress/e2e/booking.cy.js` — current Cypress structure to mirror

## Deliverables
Create:
- `specs/auth.feature` — Gherkin AC for the auth flow (3 scenarios: happy path, bad creds, missing creds)
- `specs/auth-openapi.yaml` — OpenAPI fragment for `POST /auth`
- `tests/auth.spec.ts` — Playwright suite generated from those inputs via `prompts/api-test-gen.md`
- `cypress/e2e/auth.cy.js` — Cypress suite, same source
- `tests/fixtures/auth-token.ts` — Playwright fixture that exposes a valid token to dependent specs
- `cypress/support/auth.js` — Cypress equivalent (`Cypress.Commands.add('getToken', ...)`)

Modify:
- `tests/booking.spec.ts` — add one test case per protected verb (PUT, PATCH, DELETE) that demonstrates 403 without token, 200/201 with token
- `cypress/e2e/booking.cy.js` — same additions
- `README.md` — add a one-paragraph section describing the auth flow

## Acceptance criteria
- Default Restful-Booker creds (`admin / password123`) produce a 200 response with a `token` field of length ≥ 10.
- Bad creds produce a 200 response with body `{ "reason": "Bad credentials" }` (Restful-Booker quirk — yes, 200 not 401).
- Missing creds produce a 418 (Restful-Booker returns this for malformed bodies).
- The token fixture is consumed by at least one test in `tests/booking.spec.ts` without redeclaring auth logic.
- All new tests pass against the live sandbox in both runners.
- Existing tests still pass (no regressions).

## Constraints
- Do not commit credentials. Read them from `process.env.RESTFUL_BOOKER_USER` and `RESTFUL_BOOKER_PASS` with the documented defaults as fallback.
- Do not invent endpoints. Restful-Booker's auth quirks are real — confirm via the live API before encoding expected responses.
- The fixture must be importable from both individual test files and from helper files. No circular imports.

## Suggested approach
1. Browser subagent: open `https://restful-booker.herokuapp.com/apidoc/index.html` and confirm the actual auth contract (status codes, body shape).
2. Terminal: `curl -X POST https://restful-booker.herokuapp.com/auth -H "Content-Type: application/json" -d '{"username":"admin","password":"password123"}'` — confirm response shape.
3. Write `specs/auth.feature` and `specs/auth-openapi.yaml` based on the confirmed shape.
4. Run the hero prompt (`prompts/api-test-gen.md`) twice — once with `Framework: playwright`, once with `Framework: cypress`. Drop outputs into the deliverable files.
5. Implement the two fixtures.
6. Update `tests/booking.spec.ts` and `cypress/e2e/booking.cy.js` to use the fixtures for the protected verbs.
7. Run both suites. Iterate until green.

## Verification commands
The agent must run these and include their output in the Walkthrough:
```
npm run test:playwright -- tests/auth.spec.ts
npm run test:playwright            # full suite, prove no regression
npm run test:cypress -- --spec cypress/e2e/auth.cy.js
npm run test:cypress               # full suite, prove no regression
```
All four commands must exit 0.

## Walkthrough requirements
The final Antigravity artifact must include:
- File diff summary
- Terminal output of all four verification commands
- A screenshot from the browser subagent of the Restful-Booker apidoc page section that confirms the auth contract
- One paragraph explaining the Restful-Booker quirks the agent encountered (specifically: bad creds return 200, not 401)

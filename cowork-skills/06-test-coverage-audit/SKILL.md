---
name: test-coverage-audit
description: Audit a test suite against an OpenAPI specification (or a list of features) to find coverage gaps — endpoints with no tests, status codes never asserted, required fields never validated, and authentication paths never exercised. Produces a gap report with prioritized recommendations. Use whenever the user asks "what's our coverage", "what are we missing", "audit the test suite", "find coverage gaps", or mentions test coverage, contract coverage, or OpenAPI compliance. Trigger even when the user just shares an OpenAPI file and a test directory and asks for an opinion on the suite's completeness.
---

# Test Coverage Audit

Compare a test suite against the OpenAPI specification it claims to cover, identify the gaps, and produce a prioritized gap report.

## When to use this skill

The user has a test suite and an OpenAPI spec, and wants to know what's covered and what isn't. They might phrase it as:
- "Audit my test coverage"
- "What endpoints don't have tests?"
- "Are we covering all the error responses?"
- "Show me the gaps"

Code coverage tools (Istanbul, c8) measure *line* coverage. This skill measures *contract* coverage — which endpoints, methods, and status codes are exercised. The two are different and complementary; this skill produces the contract one.

## Inputs

- One or more OpenAPI 3 files (the contract)
- A test directory (Playwright `tests/`, Cypress `cypress/e2e/`, or both)
- Optionally, a recent test report (JSON) showing which tests actually ran

## What you produce

A coverage audit file `coverage-audit-<date>.md` with this structure:

```markdown
# Coverage Audit — <date>

## Summary
- <N> endpoints in spec
- <M> endpoints exercised by at least one test (X%)
- <K> status codes asserted across all tests (Y% of declared status codes)
- <gap count> gaps prioritized below

## Coverage matrix
| Endpoint | GET | POST | PUT | PATCH | DELETE |
|----------|-----|------|-----|-------|--------|
| /booking | ✅  | ❌   | -   | -     | -      |
| ...      |     |      |     |       |        |

(✅ = tested, ❌ = declared in spec but no test, - = not in spec, ⚠️ = test exists but does not assert response shape)

## Gaps by priority

### P0 — Untested write paths
<list>

### P1 — Untested error responses on tested endpoints
<list>

### P2 — Tested endpoints with no schema validation
<list>

### P3 — Tested endpoints with no negative cases
<list>

## Recommendations
<concrete next plans, with links to the relevant skills if applicable>
```

## How to do it

### Step 1 — Parse the OpenAPI spec(s)
Build a list of every operation: `{ method, path, operationId, declaredStatusCodes, requiresAuth }`.

### Step 2 — Parse the test files
For each test file, extract:
- HTTP calls being made (method + path) — find via regex on `request.<method>(`, `cy.request({ method:`, `fetch(`, etc.
- Status codes being asserted on those calls — find via `expect(res.status()).toBe(<num>)`, `expect(res.status).to.eq(<num>)`
- Whether schema validation is being called — search for `validateSchema`, `ajv.compile`, or the helper from Plan 03

This is heuristic, not precise. That's fine — the audit is a starting point for human review, not a build gate.

### Step 3 — Match calls to operations
For each HTTP call extracted from tests, find the matching OpenAPI operation. Match by method + path-pattern (treat `:id`, `${id}`, `{id}` as equivalent path params).

Keep a count: per operation, how many tests touch it, and which status codes are asserted across those tests.

### Step 4 — Compute the matrix
For each operation:
- 0 tests → ❌
- 1+ tests, but only success status codes asserted → ⚠️ (no negative coverage)
- 1+ tests, success + at least one error status asserted → ✅ but watch for missing schemas
- 1+ tests with schema validation → ✅✅ (best case, but mark as plain ✅ in matrix for readability)

### Step 5 — Prioritize gaps
- **P0**: No tests on a write endpoint (POST, PUT, PATCH, DELETE). Write paths have side effects; absence of tests is highest risk.
- **P1**: Tested endpoint, but ≥1 declared error status code is never asserted. The endpoint can fail in ways no test covers.
- **P2**: Tested endpoint with no schema validation. Tests pass even if response shape changes.
- **P3**: Tested endpoint, only happy path. Suggest adding 2-3 negative cases via the negative-matrix pattern (see Plan 04).

### Step 6 — Recommend next steps
For each P0 / P1 gap, suggest a concrete follow-up:
- "Run skill `nl-spec-to-test-prompt` with operation `createBooking` to get a starter prompt"
- "Run skill `gherkin-feature-author` to draft scenarios for the missing error cases"
- "Use Antigravity Plan 04 (Negative Path Matrix) to fan out negative coverage on tested endpoints"

If the gaps suggest a structural issue (e.g., 80% of endpoints are untested), call that out as the headline finding rather than just listing 80 P0 items.

## Heuristics and edge cases

**Tests that build URLs dynamically (`baseURL + '/booking/' + id`)**
Extract by joining string concats. Imperfect; surface uncertain matches as "Possibly tested — verify manually."

**Tests that hit unrelated endpoints as setup**
Don't double-count. A POST in a `before()` block to seed data isn't coverage of POST.

**OpenAPI specs that declare error responses generically (`default: ErrorResponse`)**
Treat as "any 4xx/5xx" rather than a specific code. Coverage of any 4xx counts.

**Tests written in a different language/framework than the obvious one**
Search the whole repo. Don't assume Playwright tests live in `tests/`.

## Quality bar

- The coverage matrix is complete (every operation in the spec appears, every method column is filled)
- Every gap has a priority assignment, no "we'll figure it out later"
- Recommendations are linkable to specific follow-up plans or skills
- The summary numbers match the matrix (don't claim 80% coverage if the matrix shows 50%)

## What not to do

- Don't conflate code coverage with contract coverage. They measure different things.
- Don't recommend "achieve 100% coverage" as a goal. Some endpoints (admin-only, internal-only, deprecated) may not be worth testing. Note them and move on.
- Don't audit the audit by running the tests. The audit is static analysis. If the user wants to verify the coverage by running, that's a separate skill.

## Example

**User input:**
> "Here's our OpenAPI and our `tests/` and `cypress/e2e/` folders. Audit it."

**Your output:**
A `coverage-audit-2026-04-30.md` showing:
- Summary: "12 endpoints in spec, 5 exercised by tests (42%). 3 P0 gaps on write endpoints."
- Matrix with 12 rows
- P0 list of three POST/PUT/DELETE endpoints with no tests
- Recommendations naming the next 3 prompts to run

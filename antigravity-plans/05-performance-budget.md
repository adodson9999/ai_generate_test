# Plan 05 — Performance Budget

## Goal
Add per-endpoint p50 and p95 latency budgets that run on every CI build, fail the build when an endpoint regresses, and produce a trend chart over the last 30 builds.

## Why this matters
Performance assertions inside functional tests are the hidden regression catcher. They catch the change that "works" but slows everything down by 200ms — the kind of regression that escapes most QA processes until users complain. Wiring this in early, with a budget per endpoint and an alert on regression, demonstrates SDET-level thinking, not just QA-level.

## Inputs
- All test files from previous plans
- `playwright.config.ts` — extend with custom reporter
- `cypress.config.js` — extend with after-spec hook

## Deliverables
Create:
- `specs/perf-budgets.yaml` — declarative file mapping `operationId` → `{ p50_ms, p95_ms }`
- `tests/helpers/perf-recorder.ts` — Playwright fixture that wraps `request` and records timing per call into a JSON file at `perf-results/<run-id>.json`
- `cypress/support/perfRecorder.js` — same idea using `cy.intercept` or a `cy.request` wrapper
- `tests/perf.spec.ts` — Playwright suite that runs each endpoint 50× sequentially, computes p50/p95, asserts against budget
- `cypress/e2e/perf.cy.js` — Cypress equivalent
- `scripts/perf-report.js` — Node script that reads `perf-results/*.json`, writes `perf-results/trend.html` with a Chart.js line chart of p95 over time
- `docs/perf-budgets.md` — human-readable table of current budgets with rationale

## Acceptance criteria
- Each endpoint covered in earlier plans has a budget declared.
- Default budgets: GET endpoints 800ms p95, POST/PUT/PATCH 1500ms p95, DELETE 1000ms p95. Override per-endpoint where the live sandbox justifies a different number.
- Running `npm run test:perf` produces a JSON file with timing data and a pass/fail per endpoint.
- A budget violation fails the test with a message like `GET /booking/:id exceeded p95 budget (actual 1240ms, budget 800ms)`.
- The trend HTML report opens in a browser and shows one line per endpoint over the last 30 runs.
- On the first run there's no trend data — the report shows a "no history yet" placeholder, not a crash.

## Constraints
- Do not run perf tests as part of the default `npm test` — they're slow and noisy. Add them under `npm run test:perf`.
- Use 50 iterations per endpoint, sequential, no parallelism (parallelism distorts latency).
- Throw out the first 5 iterations as warmup before computing p50/p95.
- Budgets are declarative. Editing the budget should not require touching test code.
- Do not depend on a specific clock source — use `performance.now()` (Playwright) or `Date.now()` (Cypress) consistently.

## Suggested approach
1. Build `perf-recorder.ts` as a thin wrapper. Test it on one endpoint. Confirm the JSON output shape.
2. Write `tests/perf.spec.ts`. Loop the wrapper 50× per endpoint. Compute percentiles with a small helper (`p => sorted[Math.ceil(p/100 * sorted.length) - 1]`).
3. Read `specs/perf-budgets.yaml`. For each operation, look up the recorded p50/p95 and assert.
4. Write `scripts/perf-report.js`. It globs `perf-results/*.json`, sorts by timestamp in filename, builds Chart.js datasets, and writes an HTML file with the chart inline.
5. Run the perf suite 3 times back-to-back to seed trend data. View the HTML report. Confirm three points per endpoint.

## Verification commands
```
npm run test:perf -- --runner=playwright
npm run test:perf -- --runner=cypress
node scripts/perf-report.js
open perf-results/trend.html       # macOS, or xdg-open on Linux
```

## Walkthrough requirements
- The current p50/p95 numbers for every covered endpoint, formatted as a table
- A screenshot of `trend.html` after seeding it with 3 runs
- Any endpoint where the actual measured p95 is within 10% of budget — flag these as "tight, consider raising or investigating" (this is the kind of nuance that signals real SDET experience)
- The agent must explicitly note that public sandbox latency is noisy and budgets are advisory; the trend chart is more valuable than the absolute pass/fail

# Plan 07 — Stateful Concurrency Tests

## Goal
Write tests that exercise concurrent updates to the same booking from multiple simulated clients and assert the API's behavior under contention — last-write-wins, lost-update detection, or whatever the actual contract is.

## Why this matters
Single-threaded API tests miss the entire class of bugs that only surface when two clients hit the same resource at the same time. This plan documents what the Restful-Booker sandbox actually does under contention (almost certainly last-write-wins with no detection) — which is the *finding* a real QA engineer would report up the chain. The test suite captures the current behavior so any future change to add optimistic locking would be caught.

## Inputs
- Outputs from Plans 01-02 (auth + lifecycle)
- The repo's existing test infrastructure

## Deliverables
Create:
- `tests/concurrency.spec.ts` — Playwright suite with 4-5 concurrency scenarios
- `cypress/e2e/concurrency.cy.js` — Cypress equivalent (note: Cypress is single-threaded per spec; concurrency is simulated via `Promise.all` of multiple `cy.request` calls)
- `tests/helpers/concurrency-runner.ts` — utility that runs N parallel updates against a single resource and returns timing + final state
- `docs/concurrency-findings.md` — the report: what the API actually does under contention, with measured numbers

## Concurrency scenarios to cover
1. **Two concurrent PUTs to same booking** — does the API serialize or accept both? What's the final state?
2. **Concurrent PATCH to different fields of same booking** — do both changes survive, or does one stomp the other?
3. **Concurrent DELETE + GET on same booking** — does GET sometimes return a soft-deleted row?
4. **Concurrent CREATE with same identifying fields** — do you get duplicate bookings, or does the API dedupe?
5. **Concurrent reads during a long write** — do readers see consistent state, or stale data?

## Acceptance criteria
- Each scenario runs with N=10 concurrent clients (configurable per scenario).
- The test asserts the *observed* behavior, not aspirational behavior — if Restful-Booker has no locking, the test documents that fact.
- The test fails if the observed behavior changes (e.g., if the API later adds locking, the test will fail and force a deliberate update).
- Findings document includes raw numbers: "2 concurrent PUTs: 100/100 trials produced last-write-wins, 0 produced an error."
- Concurrency tests are tagged `@slow` and excluded from the default run; included with `npm run test:slow`.

## Constraints
- Do not flake. Run each scenario 100 times in the test setup phase to confirm the behavior is consistent before encoding the assertion.
- Do not pollute the sandbox. Clean up created bookings even if tests fail (use `afterEach` / `after` hooks).
- Document, do not editorialize. The findings file states what happens, not whether it's good or bad.
- If the sandbox actually has locking, the tests must adapt — don't assume last-write-wins.

## Suggested approach
1. Write `concurrency-runner.ts` with a clean API: `runConcurrent(updates: Update[]): Promise<{ finalState, allResponses, timings }>`.
2. Use it in a one-off script first (`scripts/measure-concurrency.js`) to characterize the sandbox's behavior across all 5 scenarios with 100 trials each. Save results to `docs/concurrency-findings.md`.
3. *Then* write the tests, encoding the observed behavior as assertions. This order matters — observation first, codification second.
4. Tag everything `@slow` and ensure the default test run skips them.
5. Mirror to Cypress with the caveat that Cypress's "concurrency" is `Promise.all(cy.request(...))` — note this in the Cypress test file as a comment.

## Verification commands
```
node scripts/measure-concurrency.js > docs/concurrency-findings.md
npm run test:slow -- --grep="@concurrency"
npm run test:slow:cypress
```

## Walkthrough requirements
- The full `docs/concurrency-findings.md` content (this is the *headline* artifact for this plan — it's a real QA finding)
- One-line summary per scenario: "PUT-PUT: last-write-wins observed in 100/100 trials, no errors, max latency 1.2s"
- A screenshot of one of the tests running (Playwright's UI mode is good for this)
- A note in the artifact explicitly called out as "Findings to share with the API team" — even though this is a sandbox, the framing demonstrates the right instinct

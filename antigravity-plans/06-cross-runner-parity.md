# Plan 06 — Cross-Runner Parity Verification

## Goal
Build a meta-test that proves the Playwright and Cypress suites are behaviorally equivalent — same number of tests, same names, same assertion counts, same pass/fail outcomes against the live API.

## Why this matters
The repo's central claim is "same input produces both Playwright and Cypress." That claim is currently a vibe — it's never been verified by anything other than the author's eyeballs. A parity test makes the claim falsifiable, and falsifiable claims are what hiring managers trust. It also catches the day someone updates one runner's tests by hand and forgets the other.

## Inputs
- All test files from previous plans
- `prompts/api-test-gen.md` — the output contract that *should* guarantee parity
- Playwright + Cypress JSON reporters

## Deliverables
Create:
- `scripts/parity-check.js` — Node script that:
  1. Runs Playwright with `--reporter=json` and saves output
  2. Runs Cypress with `mochawesome` reporter and saves output
  3. Normalizes both into `{ suite, test, status }[]`
  4. Compares them: same suite names, same test names, same statuses
  5. Exits non-zero with a diff if they diverge
- `tests/parity/parity.spec.ts` — Playwright wrapper that runs `parity-check.js` as a test and asserts exit 0
- `.github/workflows/parity.yml` — GitHub Action that runs the parity check on every PR (Plan 08 will integrate this into the main workflow)
- `docs/parity-check.md` — explanation of how parity is defined and what divergences are allowed

## Definition of parity
Two suites are "in parity" when:
- Same set of test names (string-equal after normalizing whitespace)
- Same number of tests per suite
- Same pass/fail status per test
- Same number of assertions per test (within ±1 to allow for runner-specific setup expectations)

Acceptable divergences (whitelisted in `docs/parity-check.md`):
- Tests tagged `@playwright-only` or `@cypress-only` in their name — these are deliberate framework-specific tests
- Different runtime durations — parity is about behavior, not speed

## Acceptance criteria
- Running `node scripts/parity-check.js` against the current (post-plans-01-05) test suite reports parity or fails with a specific diff.
- If parity check fails, the diff output names the divergent tests by name (not by index).
- The script handles the case where one runner has 0 tests (e.g. someone deleted the spec) — fails clearly rather than reporting "0 == 0, parity!"
- The GitHub Action runs in under 8 minutes on the standard runner.
- A deliberately-introduced divergence (rename one test in Playwright but not Cypress) causes the parity check to fail with that test name in the diff.

## Constraints
- Do not run the same test logic twice. The parity check runs the existing suites and compares their *reports*, not their source code.
- Do not parse test source files. Use the runners' JSON outputs.
- Whitelisting divergences requires an explicit comment in `docs/parity-check.md` — no silent skips.
- The script must be runnable locally without GitHub Actions (developer workflow).

## Suggested approach
1. Run Playwright with `--reporter=json` once. Save the output. Inspect its shape.
2. Run Cypress with mochawesome. Save its output. Inspect.
3. Write a normalizer for each — `{ suite, test, status, assertionCount }[]`.
4. Write a comparator. Format the diff output to be human-readable: a markdown table with three columns (Test, Playwright, Cypress) showing only rows that differ.
5. Wire it into a Playwright meta-spec that just calls the script.
6. Test the negative path: rename a test, run the parity check, confirm it fails with the right diff. Then revert.
7. Wire into GitHub Actions.

## Verification commands
```
npm run test:playwright -- --reporter=json
npm run test:cypress -- --reporter=mochawesome
node scripts/parity-check.js
# Negative test: rename a test, rerun, confirm failure
```

## Walkthrough requirements
- The current parity report (assuming all green: "X tests in both runners, 0 divergences")
- A screenshot of the parity check failing on a deliberately-introduced rename, showing the diff output
- The whitelisted divergence list (should be near-empty if Plans 01-05 followed the prompt contract)
- A note on what *kinds* of changes would break parity in the future and how to handle each

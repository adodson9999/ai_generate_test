---
name: flaky-test-triage
description: Analyze CI logs, Playwright traces, Cypress videos, or test report JSON to identify flaky tests, classify the flakiness root cause (timing, network, data dependency, environment, true bug), and produce a triage report with quarantine recommendations and fix priority. Use whenever the user mentions flakes, flaky tests, intermittent failures, "passed locally but failed in CI", retry behavior, test reliability, quarantine lists, or pastes in CI logs / Playwright trace output / mocha reporter JSON. Trigger even when the user describes a one-off failure they're not sure is flaky — this skill helps determine that.
---

# Flaky Test Triage

Take raw test failure data and produce a triage report that classifies failures, names root causes, and recommends actions — quarantine, fix, retry, or accept.

## When to use this skill

The user has:
- A CI run with red tests
- A Playwright trace they don't want to read by hand
- A list of "intermittent" failures over the last week
- A suspicion that one test is flaky but isn't sure

Their goal is to know what to do about it. Your job is to convert the raw data into a decision.

## Inputs you accept

Any combination of:
- CI log text (paste)
- Playwright trace.zip (path) — open with `npx playwright show-trace`
- Cypress video (path) — analyze the screenshot/video metadata
- JUnit XML reports
- Mochawesome JSON reports
- Just a description ("test_login passed yesterday, failed today, passed on rerun")

## What you produce

A triage report file `triage-<date>.md` with this structure:

```markdown
# Flake Triage — <date>

## Summary
<one paragraph: how many failures examined, how many classified as flaky vs real>

## Findings
| Test | Verdict | Root cause | Recommendation | Priority |
|------|---------|------------|----------------|----------|
| ...  | ...     | ...        | ...            | ...      |

## Detail

### <test name>
**Verdict:** <Flaky | Real bug | Environmental | Inconclusive>
**Root cause:** <one sentence>
**Evidence:** <quoted log lines, trace timestamp, etc.>
**Recommendation:** <quarantine | fix | rerun | investigate>
**Fix sketch:** <if recommendation is "fix">

(repeat per test)

## Quarantine list
<tests to add to .skip / .ignore until fixed>

## Watchlist
<tests to flag for monitoring but not quarantine yet>
```

## How to do it

### Step 1 — Inventory the failures
For each failure, record:
- Test name and file path
- Failure mode (assertion, timeout, exception, network)
- Timing (duration, time of day, day of week if known)
- Environment (CI vs local, browser, OS, runner version)

If the input is a Playwright trace, open it via `npx playwright show-trace <path>` (the user's machine — give them the command if needed) and pull out the timeline data. Key signals: very short timings followed by a timeout, network requests that hang, frame detachments.

### Step 2 — Classify each failure
Use this decision tree:

**Did it pass on retry without code change?**
- Yes → flaky. Continue to find the cause.
- No → real bug. Stop classifying, start fixing.

**Does the failure correlate with timing?** (signs: timeout, "element not visible", "navigation interrupted")
- Yes → likely timing/race condition flake. Common root causes:
  - Implicit waits assuming default timing
  - Animations not waited for
  - Race between test action and app state change
- Recommendation: replace fixed waits with web-first assertions, add explicit waits on the element's actual state.

**Does the failure correlate with shared state?** (signs: "fixture already exists", "duplicate ID", DB constraint errors)
- Yes → data dependency flake. Tests are not isolated.
- Recommendation: per-test data factory, cleanup hooks, or unique IDs per run.

**Does the failure correlate with network or external service?** (signs: 5xx, ECONNRESET, DNS errors)
- Yes → environmental flake.
- Recommendation: retry at the runner level, mock the dependency, or accept the flake with monitoring.

**Does the failure happen only in CI, never locally?**
- Likely environment difference: timezone, locale, headless vs headed, viewport.
- Recommendation: align CI environment with local; add explicit `TZ`, locale, viewport config to test setup.

**Failure is non-deterministic with no clear pattern?**
- Inconclusive — needs more data. Recommendation: rerun N times, log more, then re-triage.

### Step 3 — Set priority
- **P0**: blocks releases, fails > 5% of runs, no workaround
- **P1**: fails 1-5% of runs, workaround available (retry)
- **P2**: fails < 1% of runs, low impact
- **Quarantine**: fails consistently but root cause isn't a real bug; skip until fixed

### Step 4 — Recommend
For each failure, name one of:
- **Fix** — provide a one-line fix sketch
- **Quarantine** — add to skip list with a comment naming the issue
- **Rerun** — if the runner supports retry-on-failure for this test class
- **Accept** — for flakes that are external and not worth the engineering cost
- **Investigate** — when there isn't enough data yet

### Step 5 — Write the report
Use the template above. Be specific. Bad: "Test is timing-related." Good: "Test waits 2000ms for a network call that returns in 1800ms p50, 2400ms p95. Fix: replace fixed wait with `waitForResponse` on the specific endpoint."

## Patterns and anti-patterns

**Common Playwright flakes:**
- `page.click()` before navigation completes → use `await page.waitForLoadState('networkidle')` or web-first assertions
- `expect(locator).toBeVisible()` without timeout adjustment → use `expect(locator).toBeVisible({ timeout: 10000 })` for slow-rendering elements
- Stale element refs → re-query the locator after a navigation

**Common Cypress flakes:**
- `cy.wait(500)` everywhere → replace with `cy.intercept().as('alias')` and `cy.wait('@alias')`
- Test order dependence → use `Cypress.env('isolatedTest', true)` patterns
- Detached-element errors after re-render → query inside `cy.get(selector).should('be.visible')` chains

**Common API test flakes:**
- Public sandbox resets (Restful-Booker every ~10 min) → discover IDs at runtime
- Rate limits → respect retry-after headers, space out tests
- Race conditions on shared resources → use unique resources per test

## Quality bar

- Every failure classified, no "I don't know" without an Investigate recommendation with a clear next step
- Recommendations are actionable in one PR
- Quarantine list has reasons and target unblock dates
- Report is short enough that an engineering manager will actually read it (under 2 pages for 10 failures)

## What not to do

- Don't recommend retry-on-failure as a default. It hides real bugs. Retry is for known-environmental flakes only.
- Don't quarantine more than 5% of the suite. If you're hitting that, the suite has structural problems and the report should call that out as the headline finding.
- Don't blame "the test is flaky" without naming a root cause. Every flake has a root cause; the question is whether finding it is worth the cost.

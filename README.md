# AI-Generated Test Demo

This repo demonstrates AI-assisted test generation and QA automation strategy: natural-language specs plus OpenAPI fragments go in, Playwright and Cypress suites come out, with parity checks, perf checks, and an AI-focused Python POC alongside the JS test harnesses.

## What's here

- `specs/` - source-of-truth feature files and OpenAPI fragments (`booking`, `auth`, lifecycle, negative matrix, perf budgets)
- `tests/` - Playwright API suites, fixtures, factories, helpers, and perf/concurrency coverage
- `cypress/e2e/` - Cypress parity suites for core functional and negative-path scenarios
- `scripts/parity-check.js` - cross-runner parity report (Playwright vs Cypress)
- `ai-test-poc/` - Python AI testing POC (self-healing locators, content validation, synthetic data, model governance)
- `antigravity-plans/` and `cowork-skills/` - implementation planning artifacts and reusable QA skill prompts

## Methodology

The anchor artifact is `prompts/api-test-gen.md`. It enforces a deterministic output contract: one positive test per success response, one negative test per error response, presence-and-type assertions for required schema fields, constraint assertions (format/minimum/regex/enum), and non-functional ACs (latency) as separate assertions. The same requirements are expressed in both Playwright and Cypress to keep parity visible.

## Run

```bash
# 1. Install dependencies
npm install

# 2. Install Playwright's browsers (first run only)
npx playwright install chromium

# 3. Run the Playwright suite
npm run test:playwright

# 4. Run the Cypress suite
npm run test:cypress

# 5. Run cross-runner parity
node scripts/parity-check.js
```

Suites hit `https://restful-booker.herokuapp.com` directly. They discover a live booking ID at runtime (the public sandbox resets periodically and IDs rotate), so there is no local fixture seeding step.

## Target API

[Restful-Booker](https://restful-booker.herokuapp.com/) — a public sandbox API maintained for testing tool demos.

## Auth Flow

While the read paths (`GET`) are public, the mutation endpoints (`PUT`, `PATCH`, `DELETE`) require an auth token. The suite generates this token on the fly via `POST /auth` using default sandbox credentials. Tests needing auth consume a Playwright or Cypress fixture that supplies the token. (Note: Restful-Booker's auth API has some quirks, such as returning `200 OK` even for bad or missing credentials, which the generated tests reflect).

## Regenerating the tests

1. Edit `specs/booking-lookup.feature` and/or `specs/booking-openapi.yaml`.
2. Open `prompts/api-test-gen.md` and fill the `<paste …>` placeholders with the current spec contents.
3. Set `Framework:` to `playwright` or `cypress` and run the prompt against your model of choice.
4. Drop the output into `tests/booking.spec.ts` or `cypress/e2e/booking.cy.js`.

The output contract in the prompt is what keeps both runners in lockstep.

## Planning and review artifacts

- `Feature_Implementation_Plan_20260501_135857.md` - capability audit plus prioritized feature roadmap with an execution checklist
- `REVIEW_IMPLEMENTATION_PLAN_20260501_143637_myself.md` - implementation review, findings register, and closure tracker

These docs are maintained as living planning artifacts and should be updated as features are completed.

## CI notes

- Main CI workflow runs Playwright, Cypress, parity-check, and perf-budget jobs.
- GitHub Pages publishing was intentionally removed from CI to avoid `gh-pages` push permission failures.

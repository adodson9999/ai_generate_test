# REVIEW IMPLEMENTATION PLAN 2026-05-01 14:36:37

Senior reviewer line-by-line review of the working folder. ASCII only. Pipes inside cells are escaped as `\|`. The original instruction filename pattern contained nested markdown autolinks; this file uses the cleanest plausible literal name `_myself.md`.

## 1. Executive summary

Top three findings: (a) `tests/helpers/__tests__/print-negative-matrix.spec.ts` references a field `c.isQuirk` that does not exist on the `NegativeCase` type (the type field is `quirk`), so the only pathway in the repo for regenerating `docs/negative-matrix.md` and `tests/helpers/negative-cases.json` is broken at runtime; (b) the AI POC is internally inconsistent about which model it runs (`AI_Testing_POC_IMPLEMENTATION_PLAN.md` proposes Llama 4 Scout 17B with a 128K context, while `ai-test-poc/src/healing/ollama_client.py`, `ai-test-poc/tests/conftest.py`, and `ai-test-poc/README.md` Quick Start all hardcode `llama3:8b`); (c) `scripts/perf-report.js` discards the five fastest samples instead of the five warmup samples because it sorts before slicing, so its p95 is consistently optimistic vs the test runner's p95 which discards by index. Overall grade: B-. The folder is well-organized, the framework is real and runs, and the cross-runner parity script genuinely catches divergence; what drags the grade is unfinished promises (LLM regeneration is a TODO stub but `docs/auto-regeneration.md` describes the full closed loop), schema drift between the proposal doc and the implementation, and a small but real correctness bug in the perf reporter. The single highest-leverage fix is to align the AI POC stack: pick one model name, replace every reference, and update the proposal so an interviewer running the Quick Start does not hit a contradiction within thirty seconds.

## 2. Folder inventory

| Path | Type | Size | Role |
|---|---|---|---|
| .DS_Store | binary | 6148 | binary, not reviewed |
| .github/workflows/ci.yml | yaml | 1649 | CI workflow: playwright, cypress, parity, perf |
| .github/workflows/scheduled.yml | yaml | 1022 | Nightly scheduled run with commented Slack notify |
| .github/workflows/spec-drift.yml | yaml | 2021 | Spec change detection and dry-run regeneration |
| .gitignore | config | 199 | git ignore list |
| Feature_Implementation_Plan_20260501_135857.md | markdown | 42817 | Prior session feature plan against an SDET JD |
| README.md | markdown | 2606 | Top-level repo readme and quick start |
| ai-test-poc/.pytest_cache/* | cache | varies | binary, not reviewed |
| ai-test-poc/README.md | markdown | 3998 | AI POC quick start and architecture |
| ai-test-poc/golden_sets/healing_golden.json | json | 2167 | Golden cases for selector healing drift check |
| ai-test-poc/golden_sets/validation_golden.json | json | 731 | Golden cases for content validation drift |
| ai-test-poc/pyproject.toml | toml | 899 | Python package config and pytest markers |
| ai-test-poc/reports/healing_log.json | json | 596 | Output log of healing events from prior runs |
| ai-test-poc/src/__init__.py | python | 18 | Package init |
| ai-test-poc/src/ai_test_poc.egg-info/* | build artifact | varies | Editable install metadata |
| ai-test-poc/src/generators/__init__.py | python | 100 | Re-exports LLMDataFactory |
| ai-test-poc/src/generators/data_factory.py | python | 5477 | LLM-driven synthetic data factory |
| ai-test-poc/src/healing/__init__.py | python | 141 | Re-exports OllamaClient and HealingPage |
| ai-test-poc/src/healing/healer.py | python | 8354 | HealingPage Playwright wrapper |
| ai-test-poc/src/healing/ollama_client.py | python | 7146 | Typed Ollama REST client |
| ai-test-poc/src/monitoring/__init__.py | python | 180 | Re-exports drift and hallucination types |
| ai-test-poc/src/monitoring/drift_detector.py | python | 2167 | Golden-set drift checker |
| ai-test-poc/src/monitoring/hallucination_tracker.py | python | 2649 | In-memory hallucination metrics |
| ai-test-poc/src/validators/__init__.py | python | 143 | Re-exports ContentValidator |
| ai-test-poc/src/validators/content_validator.py | python | 4053 | LLM-as-Judge content validation |
| ai-test-poc/tests/conftest.py | python | 3412 | Pytest fixtures: ollama, healing_page, validator |
| ai-test-poc/tests/test_content_validation.py | python | 4012 | Content validator unit and integration tests |
| ai-test-poc/tests/test_data_generation.py | python | 3406 | Data factory unit and integration tests |
| ai-test-poc/tests/test_model_governance.py | python | 4680 | Drift and hallucination tracker tests |
| ai-test-poc/tests/test_self_healing.py | python | 3181 | Self-healing locator demo against apidoc page |
| antigravity-plans/00-INDEX.md | markdown | 3230 | Index of agent implementation plans |
| antigravity-plans/01-auth-token-lifecycle.md | markdown | 4180 | Plan: auth flow tests and token fixture |
| antigravity-plans/02-crud-lifecycle-suite.md | markdown | 3850 | Plan: chained CRUD lifecycle suite |
| antigravity-plans/03-schema-contract-validation.md | markdown | 4136 | Plan: ajv-driven schema validation helpers |
| antigravity-plans/04-negative-path-matrix.md | markdown | 4835 | Plan: generated negative test matrix |
| antigravity-plans/05-performance-budget.md | markdown | 4134 | Plan: per-endpoint p50 and p95 budgets |
| antigravity-plans/06-cross-runner-parity.md | markdown | 4352 | Plan: meta-test for runner parity |
| antigravity-plans/07-stateful-concurrency.md | markdown | 4434 | Plan: concurrency scenario tests |
| antigravity-plans/08-ci-pipeline-and-reports.md | markdown | 3978 | Plan: CI pipeline with PR comment |
| antigravity-plans/09-test-data-factory.md | markdown | 4589 | Plan: faker-based booking factory |
| antigravity-plans/10-spec-drift-regeneration.md | markdown | 4918 | Plan: auto-regenerate tests on spec change |
| antigravity-plans/AI_Testing_POC_IMPLEMENTATION_PLAN.md | markdown | 27332 | Standalone proposal for the AI POC |
| cowork-skills/01-nl-spec-to-test-prompt/SKILL.md | markdown | 5457 | Cowork skill: NL spec to test prompt |
| cowork-skills/02-openapi-fragment-extractor/SKILL.md | markdown | 5571 | Cowork skill: OpenAPI fragment extractor |
| cowork-skills/03-gherkin-feature-author/SKILL.md | markdown | 6375 | Cowork skill: Gherkin feature author |
| cowork-skills/04-antigravity-plan-author/SKILL.md | markdown | 6611 | Cowork skill: Antigravity plan author |
| cowork-skills/05-flaky-test-triage/SKILL.md | markdown | 7065 | Cowork skill: flaky test triage |
| cowork-skills/06-test-coverage-audit/SKILL.md | markdown | 6797 | Cowork skill: test coverage audit |
| cowork-skills/07-bug-report-from-trace/SKILL.md | markdown | 6908 | Cowork skill: bug report from trace |
| cowork-skills/08-qa-weekly-status/SKILL.md | markdown | 7190 | Cowork skill: weekly QA status |
| cowork-skills/09-take-home-extractor/SKILL.md | markdown | 7903 | Cowork skill: take-home extractor |
| cowork-skills/10-resume-bullet-evidence/SKILL.md | markdown | 9910 | Cowork skill: resume bullet evidence |
| cypress.config.js | javascript | 186 | Cypress runner config |
| cypress/e2e/auth.cy.js | javascript | 1516 | Cypress: auth flow tests |
| cypress/e2e/booking-lifecycle.cy.js | javascript | 3582 | Cypress: CRUD lifecycle |
| cypress/e2e/booking.cy.js | javascript | 3528 | Cypress: GET and protected endpoint tests |
| cypress/e2e/booking.negative.cy.js | javascript | 1569 | Cypress: negative matrix consumer |
| cypress/e2e/concurrency.cy.js | javascript | 2886 | Cypress: concurrency tests (3 scenarios) |
| cypress/support/auth.js | javascript | 383 | Cypress getToken command |
| cypress/support/bookingFactory.js | javascript | 2361 | Cypress booking factory and cy.factory cmd |
| cypress/support/schemaValidator.js | javascript | 1529 | Cypress cy.validateSchema custom command |
| docs/auto-regeneration.md | markdown | 1620 | Pipeline doc for spec-drift loop |
| docs/ci-architecture.md | markdown | 1791 | CI pipeline diagram and job table |
| docs/concurrency-findings.md | markdown | 2000 | Findings from concurrency suite |
| docs/negative-matrix.md | markdown | 1864 | Generated negative test matrix table |
| package-lock.json | json | 120870 | npm lockfile, generated, not reviewed |
| package.json | json | 1162 | npm package config and scripts |
| parity-tmp/playwright.json | json | 2 | Empty `{}` leftover from a parity run |
| perf-results/2026-05-01T00-57-44-984Z.json | json | 52292 | Recorded perf samples run 1 |
| perf-results/2026-05-01T01-05-52-669Z.json | json | 52327 | Recorded perf samples run 2 |
| perf-results/trend.html | html | 1585 | Generated Chart.js trend report |
| playwright-report/index.html | html | 526864 | Playwright HTML report, generated artifact |
| playwright.config.ts | typescript | 294 | Playwright config: 30s timeout, 1 retry |
| playwright.perf.config.ts | typescript | 234 | Playwright config for perf and concurrency |
| prompts/api-test-gen.md | markdown | 939 | Hero prompt template for test generation |
| scripts/parity-check.js | javascript | 6414 | Cross-runner parity comparator |
| scripts/perf-report.js | javascript | 2793 | Builds Chart.js trend HTML from perf JSON |
| scripts/regenerate-tests.js | javascript | 2649 | Stub LLM regenerator (TODO actual call) |
| scripts/spec-diff.js | javascript | 2756 | Summarizes OpenAPI changes between refs |
| specs/auth-openapi.yaml | yaml | 1083 | OpenAPI fragment for POST /auth |
| specs/auth.feature | gherkin | 775 | Gherkin scenarios for auth flow |
| specs/booking-lifecycle-openapi.yaml | yaml | 3403 | OpenAPI fragment for full CRUD on /booking |
| specs/booking-lifecycle.feature | gherkin | 904 | Gherkin scenarios for CRUD lifecycle |
| specs/booking-lookup.feature | gherkin | 647 | Gherkin scenarios for GET /booking/{id} |
| specs/booking-openapi.yaml | yaml | 998 | OpenAPI fragment for GET /booking/{id} only |
| specs/negative-matrix.yaml | yaml | 792 | Config for negative-test generator |
| specs/perf-budgets.yaml | yaml | 875 | Per-endpoint p50 and p95 budgets |
| test-results/.last-run.json | json | 45 | Playwright last-run metadata |
| tests/auth.spec.ts | typescript | 1932 | Playwright: auth flow tests |
| tests/booking-lifecycle.spec.ts | typescript | 3830 | Playwright: chained CRUD lifecycle |
| tests/booking.negative.spec.ts | typescript | 1621 | Playwright: negative matrix consumer |
| tests/booking.spec.ts | typescript | 3422 | Playwright: GET and protected endpoint tests |
| tests/concurrency.spec.ts | typescript | 4968 | Playwright: 5 concurrency scenarios |
| tests/factories/__tests__/booking-factory.spec.ts | typescript | 2501 | Unit tests for booking factory |
| tests/factories/booking-factory.ts | typescript | 2575 | Faker-driven booking factory |
| tests/factories/openapi-driven.ts | typescript | 1226 | Schema-driven constraint extractor (unused) |
| tests/fixtures/auth-token.ts | typescript | 573 | Playwright fixture exposing authToken |
| tests/helpers/__tests__/negative-generator.spec.ts | typescript | 469 | Unit tests for negative generator |
| tests/helpers/__tests__/print-negative-matrix.spec.ts | typescript | 775 | Script-as-test that writes the matrix files |
| tests/helpers/__tests__/schema-validator.spec.ts | typescript | 2312 | Unit tests for schema validator |
| tests/helpers/concurrency-runner.ts | typescript | 1564 | Concurrent updates utility |
| tests/helpers/negative-cases.json | json | 14368 | Persisted output of the negative generator |
| tests/helpers/negative-generator.ts | typescript | 7326 | Negative case generator |
| tests/helpers/perf-recorder.ts | typescript | 1234 | Sample recorder and percentile helper |
| tests/helpers/schema-validator.ts | typescript | 1643 | ajv-based response schema validator |
| tests/perf.spec.ts | typescript | 4013 | Playwright: perf budget assertions |
| node_modules/** | dependency | varies | binary, not reviewed |

## 3. Findings table

| ID | Severity | Path | Location | Category | Issue | Recommended fix |
|---|---|---|---|---|---|---|
| F01 | P0 | tests/helpers/__tests__/print-negative-matrix.spec.ts | line 11 | Contract validation | Code reads `c.isQuirk` but the `NegativeCase` type and the JSON it produces use `quirk`; the matrix-regeneration script throws or writes literal `undefined` | Change `c.isQuirk ? 'Quirk: ' + c.isQuirk : ''` to `c.quirk ? 'Quirk: ' + c.quirk : ''`; add `'quirk' in c` typing on the cast |
| F02 | P0 | scripts/perf-report.js | lines 26-30 | Performance / Determinism | Sorts samples ascending and then `slice(5)` drops the five FASTEST samples, not the warmup; reported p95 is biased low and disagrees with `tests/helpers/perf-recorder.ts` percentile | Drop warmup BEFORE sorting: keep input order, slice off the first 5, then sort the remaining slice |
| F03 | P0 | docs/auto-regeneration.md | full file | Contract validation | Mermaid diagram shows a closed loop including an LLM call and an opened PR; the implementation in `scripts/regenerate-tests.js` line 70 is a TODO stub that never calls an LLM | Replace the diagram with a stub-state diagram that shows what is actually implemented (detect, dry-run only) and add a TODO box for the unfinished steps |
| F04 | P0 | ai-test-poc/pyproject.toml | full file | Contract validation / Coverage | Package layout is `src/` with submodules, but no `[tool.setuptools]` `package_dir` or explicit `packages`; egg-info `top_level.txt` lists `__init__, generators, healing, monitoring, validators` so installed imports do NOT match the test imports `from src.healing...` | Add `[tool.setuptools] package-dir = {"" = "src"}` and explicit `packages = ["healing", "validators", "generators", "monitoring"]`, then refactor every test import from `src.healing...` to `healing...` |
| F05 | P1 | ai-test-poc/src/healing/ollama_client.py | line 45 | Schema drift | `model: str = "llama3:8b"` contradicts `AI_Testing_POC_IMPLEMENTATION_PLAN.md` section 1.4 which proposes Llama 4 Scout 17B with a 128K context window; the README Quick Start also pulls `llama3:8b` | Pick one. If the demo runs llama3:8b in practice, update the proposal and the comparison table to reflect that and remove the 128K-context claim |
| F06 | P1 | ai-test-poc/conftest.py | line 49 | Schema drift | Hardcoded `model="llama3:8b"`; not driven by env var, so the proposal's "Llama 4 Scout" claim cannot even be tested without editing source | Read model name from `OLLAMA_MODEL` env var with a documented default |
| F07 | P1 | docs/ci-architecture.md | lines 25-32 | Contract validation | Job table lists `publish-report (always)` job; `.github/workflows/ci.yml` has no such job. The pipeline diagram also depicts it | Either add a `publish-report` job to ci.yml or remove the row and the diagram box |
| F08 | P1 | tests/booking.spec.ts | lines 43-99 | Coverage / Contract validation | Spec referenced for these tests is `booking-openapi.yaml` (per README), which only documents `GET /booking/{id}`. The PUT, PATCH, DELETE assertions live here but their schemas live in `booking-lifecycle-openapi.yaml`. Test depends on a schema not declared in its source spec | Move the protected-verb tests to `tests/booking-lifecycle.spec.ts` or change the README to point at both spec files for `booking.spec.ts` |
| F09 | P1 | scripts/regenerate-tests.js | lines 70-71 | Dead code / Contract validation | `console.log('TODO: Implement actual LLM call. ...')` and exits without doing the regeneration the script claims to do; spec-drift workflow runs only the dry-run path | Either implement the LLM call (Anthropic SDK call, JSON-mode prompt) or rename the script to `dry-run-regenerate.js` so the contract matches |
| F10 | P1 | scripts/parity-check.js | full file | Coverage | `antigravity-plans/06-cross-runner-parity.md` acceptance criteria specifies "Same number of assertions per test (within plus or minus 1)"; the implementation only compares names and statuses | Add an assertion-count normalizer (read from `report.results[].suites[].tests[].assertions` mochawesome shape and a Playwright equivalent) and include divergences in the diff output |
| F11 | P1 | cypress/e2e/concurrency.cy.js | full file | Coverage | Plan 07 lists 5 scenarios; only 3 are present (PUTs, CREATEs, reads-during-write). PATCH-different-fields and DELETE+GET race are missing in Cypress | Add the two missing `it` blocks; mark the file with a header comment naming the simulated-concurrency limitation |
| F12 | P1 | cypress/e2e/perf.cy.js | not present | Coverage | Plan 05 acceptance criteria explicitly requires `cypress/e2e/perf.cy.js`; file does not exist; perf coverage is Playwright-only | Add a Cypress perf spec that records via a `cy.request` wrapper or document in `docs/perf-budgets.md` why Cypress perf is intentionally out of scope |
| F13 | P1 | tests/factories/openapi-driven.ts | full file | Dead code | `extractConstraints` is exported but no caller imports it. Plan 09 expected the factory to consume schema constraints from this module | Either delete `openapi-driven.ts` or wire `bookingFactory.boundary()` to read `minLength`, `minimum`, `maximum`, `format` from this helper |
| F14 | P1 | tests/booking-lifecycle.spec.ts | lines 6-18 | Schema drift / Coverage | Defines a local `buildBooking()` using `Math.random` rather than `bookingFactory.build()`. Plan 09 acceptance: "factory is the only place test data is constructed for booking-related tests" | Replace `buildBooking()` with `bookingFactory.build()`; move `bookingFactory.seed(...)` to the file's `test.beforeAll` for deterministic runs |
| F15 | P1 | cypress/e2e/booking-lifecycle.cy.js | lines 4-16 | Schema drift / Coverage | Same as F14 in the Cypress side: local `buildBooking` with `Math.random` instead of `cy.factory('booking', 'build')` | Replace with `cy.factory('booking', 'build').then(b => ...)` |
| F16 | P1 | README.md | lines 19-28 | Contract validation | Quick Start says `npm install` then `npm run test:playwright` and "tests pass without any setup beyond `npm install`"; in practice Playwright requires `npx playwright install chromium` (CI does this on line 14 of ci.yml) | Add `npx playwright install chromium` between steps 1 and 2; remove the "without any setup" claim |
| F17 | P1 | tests/perf.spec.ts | line 88 | Flakiness | p95 budget assertion is hardcoded for `getBooking` to 800ms but Restful-Booker is on a public free-tier Heroku-style host; latency spikes will produce CI flakes; Plan 05 itself notes "public sandbox latency is noisy and budgets are advisory" but the test treats them as gates | Either downgrade to `expect.soft` and emit a warning report, or add `test.retries(3)` to the perf describe and average over retries |
| F18 | P1 | ai-test-poc/golden_sets/healing_golden.json | full file | Determinism | Only 5 cases. `is_drifted(threshold=0.10)` cannot resolve below 1/5 = 20%; one transient model output flips drift state. Same problem for `validation_golden.json` (3 cases) | Expand each golden set to >= 20 cases or replace point estimate with a Wilson lower bound and document the formula |
| F19 | P1 | specs/auth.feature | lines 17-19 | Contract validation | Scenario "Reject missing credentials" expects `200`, but `antigravity-plans/01-auth-token-lifecycle.md` acceptance criterion says "Missing creds produce a 418" | Confirm the live API behavior with curl and update either the feature file or the plan; record the actual quirk in `specs/auth-openapi.yaml` |
| F20 | P2 | tests/concurrency.spec.ts | line 23 | Schema drift | Test name "Concurrency Tests @slow @concurrency" embeds tags in describe title; Playwright tags belong in the test title or via `test.describe(@slow)` configuration; `playwright.config.ts` filters by file path, not by tag | Move tags to test titles (e.g., `test('two concurrent PUTs @slow', ...)`) and use `--grep "@slow"` for opt-in runs |
| F21 | P2 | tests/helpers/__tests__/print-negative-matrix.spec.ts | full file | Selector brittleness / Determinism | A "test" file that writes to `docs/negative-matrix.md` and `tests/helpers/negative-cases.json` as a side effect; runs as part of the suite. Plan 04 expected `node tests/helpers/print-negative-matrix.js` | Rename to `scripts/print-negative-matrix.js`, run as `node scripts/print-negative-matrix.js`, exclude `print-*.spec.ts` from `playwright.config.ts` testIgnore |
| F22 | P2 | ai-test-poc/tests/conftest.py | line 33 | Dead code | `os.environ.setdefault("PWHEADLESS", "1")` sets a name Playwright does not read; headless is controlled by `[tool.playwright]` in pyproject.toml or `--headed` | Remove the line and rely on the pyproject configuration |
| F23 | P2 | ai-test-poc/src/healing/healer.py | line 94 | Flakiness | `except (PlaywrightError, Exception)` is overly broad; will swallow programming errors and retry-storm them through `_heal()` | Narrow to `except PlaywrightError` and let unexpected exceptions surface |
| F24 | P2 | ai-test-poc/src/validators/content_validator.py | lines 86-90 | Determinism | `verdict.passed = score >= self.pass_threshold and not preflight` makes the LLM judgment irrelevant whenever preflight fires; preflight already detects the issue. Hides the LLM verdict from the log | Skip the LLM call entirely when preflight returns issues, or stop adjusting the score and let the LLM agree |
| F25 | P2 | tests/factories/booking-factory.ts | lines 60-91 | Coverage | `invalid()` accepts a `kind: 'type' \| 'missing' \| 'format'` but `format` only handles fields containing the word `date`; other format-bearing fields silently fall through to type violations | Add explicit handling for unknown `kind`/`field` combinations and throw, or document the limited format support |
| F26 | P2 | scripts/parity-check.js | line 56 | Selector brittleness | The Cypress invocation uses single quotes around the spec list, breaking on Windows shells; CI runs Linux but documented "must be runnable locally without GitHub Actions" (Plan 06) covers Windows devs | Pass spec list as separate `--spec` flags or use `&&`-chained commands |
| F27 | P2 | scripts/spec-diff.js | line 14 | Schema drift | Default base ref `HEAD~1`; `.github/workflows/spec-drift.yml` invokes with `origin/main`; local devs running the script directly get a different comparison than CI | Default to `origin/main` and document that local users may pass `HEAD~1` explicitly |
| F28 | P2 | specs/booking-lifecycle-openapi.yaml | lines 90-99 | Contract validation | DELETE `/booking/{id}` declares response `'201'` with no body schema, despite DELETE in REST conventions returning 204; this is the Restful-Booker quirk but the spec does not document it | Add a description note on the DELETE 201 response: "Restful-Booker quirk: returns 201 Created on successful delete." |
| F29 | P2 | specs/negative-matrix.yaml | full file | Coverage | No entries for `/auth`; the auth quirks (200 on bad creds, 418 on missing per plan 01) get no negative coverage from the matrix generator | Add a `createAuth` operationId entry with `apply: [missing_required, wrong_type]` and let the generator produce auth negatives |
| F30 | P2 | Feature_Implementation_Plan_20260501_135857.md | section 2 row 9 | Selector brittleness | Cell uses literal `*` characters around `\\*about\\*`; this is escaped markdown for asterisks but renders inconsistently across viewers | Replace with single backticks `\`about\`` |
| F31 | P3 | many files | many | Schema drift | Em dashes (Unicode 2014) appear throughout README.md, ai-test-poc/README.md, all SKILL.md files, all antigravity-plans/*.md, AI_Testing_POC_IMPLEMENTATION_PLAN.md; ATS systems and naive parsers tokenize em dashes inconsistently | Replace `—` with ` - ` (space hyphen space) or with the correct rendering `--`; do this only on resume-adjacent and parser-fed artifacts |
| F32 | P3 | parity-tmp/playwright.json | full file | Dead code | Empty `{}` checked into the working folder; `parity-check.js` rmSyncs the directory at the end of a successful run; the leftover suggests a previous run was interrupted | Delete `parity-tmp/` and add an explicit `parity-tmp/` rule already covered by `.gitignore` line 2; confirm git status shows clean |
| F33 | P3 | playwright-report/index.html | full file | Dead code | 526 KB generated artifact checked into the folder; `.gitignore` lists `playwright-report/` so this is local cruft | Delete the file or rebuild it intentionally as a demo asset and document it in README |
| F34 | P3 | tests/booking-lifecycle.spec.ts | line 65 | Determinism | `updatedBooking.totalprice = 9999` magic number used as a sentinel without explanation | Replace with a named constant `const PUT_SENTINEL_PRICE = 9999` and add an inline comment explaining the intent |
| F35 | P3 | ai-test-poc/src/generators/data_factory.py | line 22-35 | Coverage | `LEAD_SCHEMA` lists `country` as `minLength: 2, maxLength: 2` but does not enforce ISO 3166-1 alpha-2 character set (could be lowercase `xx` or digits) | Add `pattern: "^[A-Z]{2}$"` and update tests accordingly |

## 4. File-by-file annotations

Walk in alphabetical path order, excluding `node_modules/`, `package-lock.json`, `.pytest_cache/`, and `.egg-info/` content (binary/generated, listed as "binary, not reviewed" above).

### .DS_Store
macOS Finder metadata file. Should not be committed but is listed in `.gitignore`.

No findings.

### .github/workflows/ci.yml
GitHub Actions workflow that runs Playwright, Cypress, parity, and perf jobs. Caching is set up for `npm` but not for `~/.cache/ms-playwright` despite Plan 08 calling that out.

- P2 [Coverage]: Plan 08 acceptance: "Cache the Playwright browsers (these are huge - cache hit shaves about 2 min)." Not implemented. Add an `actions/cache@v4` step keyed on the playwright version.

> ```      - run: npx playwright install --with-deps chromium```

### .github/workflows/scheduled.yml
Nightly cron and `workflow_dispatch`. Slack notify is commented out as designed by Plan 08 (TODO for webhook URL).

No findings.

### .github/workflows/spec-drift.yml
Triggers on `specs/*.yaml` changes; runs `spec-diff.js` and the dry-run regenerator.

- P2 [Schema drift]: invokes `node scripts/spec-diff.js origin/main` while `scripts/spec-diff.js` defaults to `HEAD~1` when called without args. See F27.

### .gitignore
Standard list. Includes `parity-tmp/`, `playwright-report/`, `__pycache__/`. The committed `parity-tmp/playwright.json` contradicts this; see F32.

No additional findings.

### Feature_Implementation_Plan_20260501_135857.md
Prior session deliverable evaluating the folder against an SDET JD; large (42 KB), 14 proposed features. Voice is consistent and the build sequence reads sensibly.

- P2 [Schema drift]: see F30 escaped-asterisks finding.
- P3 [Schema drift]: extensive use of em dashes throughout (every section).

### README.md
Repo top-level readme. Two sentences explain the demo. Quick Start in three commands.

- P1 [Contract validation]: see F16; missing browser install step.

### ai-test-poc/README.md
AI POC quick start with architecture diagram.

- P1 [Schema drift]: line 13 `ollama pull llama3:8b` contradicts the proposal doc (F05).
- P2 [Contract validation]: line 17 `pip install -e ".[dev]"` is documented as sufficient setup, but tests rely on `conftest.py` `sys.path.insert` (F04) to find `src/`. After install the imports break unless run inside the source tree.

### ai-test-poc/golden_sets/healing_golden.json
Five cases, simple shape. See F18 for the small-N concern.

### ai-test-poc/golden_sets/validation_golden.json
Three cases. See F18.

### ai-test-poc/pyproject.toml
Python project config and pytest markers.

- P0 [Coverage / Contract]: see F04. No `[tool.setuptools]` mapping for the `src/` layout. The egg-info exposes packages at the root, contradicting test imports.

### ai-test-poc/reports/healing_log.json
Two events, both stubbed. Confirms `test_self_healing.py::test_heals_broken_id_selector` ran with the stubbed LLM at least twice.

No findings.

### ai-test-poc/src/__init__.py
One-line module marker. Reserves the `src` package name, which is part of the F04 packaging issue.

### ai-test-poc/src/generators/__init__.py
Re-exports `LLMDataFactory`.

No findings.

### ai-test-poc/src/generators/data_factory.py
LLM-driven synthetic lead generator with personas and edge-case slots. Schema validation runs after generation.

- P3 [Coverage]: see F35; country pattern not constrained.

### ai-test-poc/src/healing/__init__.py
Re-exports `OllamaClient` and `HealingPage`.

No findings.

### ai-test-poc/src/healing/healer.py
HealingPage wrapper class. Confidence threshold and DOM truncation guardrails are present.

- P2 [Flakiness]: see F23; overly broad `except (PlaywrightError, Exception)`.

### ai-test-poc/src/healing/ollama_client.py
Typed Ollama REST client with retry, JSON-mode helper, and call log.

- P1 [Schema drift]: see F05; hardcoded model `llama3:8b` contradicts proposal.
- P2 [Flakiness]: lines 149-152 reference `resp.status_code` and `resp.text` after the `requests.HTTPError` branch; if the request raised before a response was assigned, `resp` is undefined. Wrap in a check or assign `resp = None` before `try`.

### ai-test-poc/src/monitoring/__init__.py
Re-exports.

No findings.

### ai-test-poc/src/monitoring/drift_detector.py
Reads a JSON golden set and computes drift score as `failed / total`.

- P1 [Determinism]: see F18; small-N golden set produces a coarse drift score.

### ai-test-poc/src/monitoring/hallucination_tracker.py
In-memory event tracker, save_report writes JSON.

No findings.

### ai-test-poc/src/validators/__init__.py
Re-exports.

No findings.

### ai-test-poc/src/validators/content_validator.py
LLM-as-Judge content validator with rubric and preflight checks.

- P2 [Determinism]: see F24; preflight short-circuit interacts oddly with LLM scoring.

### ai-test-poc/tests/conftest.py
Pytest fixtures.

- P0 [Coverage / Contract]: see F04; relies on `sys.path.insert` to make `from src...` imports work.
- P2 [Dead code]: see F22; PWHEADLESS env name is wrong.

### ai-test-poc/tests/test_content_validation.py
Six tests; preflight cases are LLM-free, the `@slow` group requires a live model.

No findings beyond F22's effect on this file.

### ai-test-poc/tests/test_data_generation.py
Schema validation tests (no LLM) and a live `@slow` group.

No additional findings.

### ai-test-poc/tests/test_model_governance.py
Tracker and drift tests. `test_pass_fail_threshold` is solid - validates the 5% gate explicitly.

No findings.

### ai-test-poc/tests/test_self_healing.py
Self-healing demo tests against the apidoc page; uses `unittest.mock.patch` to stub the LLM to avoid nondeterminism, which is good practice.

No findings.

### antigravity-plans/00-INDEX.md
Index of the ten plans plus the AI POC plan.

No findings.

### antigravity-plans/01-auth-token-lifecycle.md
Plan 01.

- P1 [Contract validation]: line 33 says "Missing creds produce a 418" but `specs/auth.feature` and the live tests expect 200. See F19.

### antigravity-plans/02-crud-lifecycle-suite.md
Plan 02. Reads cleanly, acceptance criteria match the implementation.

No findings.

### antigravity-plans/03-schema-contract-validation.md
Plan 03. Implementation in `tests/helpers/schema-validator.ts` matches the constraints (uses ajv + addFormats, caches compiled validators).

No findings.

### antigravity-plans/04-negative-path-matrix.md
Plan 04.

- P1 [Coverage]: line 67 verification command names `node tests/helpers/print-negative-matrix.js` but the actual file is a Playwright spec; see F21.

### antigravity-plans/05-performance-budget.md
Plan 05.

- P1 [Coverage]: see F12; Cypress perf spec missing.

### antigravity-plans/06-cross-runner-parity.md
Plan 06.

- P1 [Contract validation]: see F10; assertion-count parity not implemented.

### antigravity-plans/07-stateful-concurrency.md
Plan 07.

- P1 [Coverage]: see F11; Cypress side missing two scenarios.

### antigravity-plans/08-ci-pipeline-and-reports.md
Plan 08.

- P1 [Coverage]: PR comment job (`scripts/post-pr-comment.js` and the `pr-comment` job) is not implemented in `.github/workflows/ci.yml`; HTML report publishing also absent. The plan's "publish-report" job is what F07 references.

### antigravity-plans/09-test-data-factory.md
Plan 09.

- P1 [Coverage]: see F13, F14, F15; constraint reading and call sites incomplete.

### antigravity-plans/10-spec-drift-regeneration.md
Plan 10.

- P0 [Contract validation]: see F03 and F09; closed loop not implemented.

### antigravity-plans/AI_Testing_POC_IMPLEMENTATION_PLAN.md
27 KB technical proposal. Strong document.

- P1 [Schema drift]: see F05; Llama 4 Scout / 17B / 128K claim does not match the implementation.
- P3 [Schema drift]: extensive em dashes.

### cowork-skills/01-nl-spec-to-test-prompt/SKILL.md
Skill: NL-to-prompt conversion. Self-contained, well-bounded.

No findings.

### cowork-skills/02-openapi-fragment-extractor/SKILL.md
Skill: extract a focused fragment from a large OpenAPI doc. Reads cleanly.

No findings.

### cowork-skills/03-gherkin-feature-author/SKILL.md
Skill: Gherkin authoring. Has a step-phrasing convention table.

No findings.

### cowork-skills/04-antigravity-plan-author/SKILL.md
Skill: Antigravity plan authoring. Self-referential and consistent.

No findings.

### cowork-skills/05-flaky-test-triage/SKILL.md
Skill: triage. Decision tree is clear.

No findings.

### cowork-skills/06-test-coverage-audit/SKILL.md
Skill: audit suite vs OpenAPI. Coverage-matrix template is sound.

No findings.

### cowork-skills/07-bug-report-from-trace/SKILL.md
Skill: bug report formatter. Severity calibration is explicit.

No findings.

### cowork-skills/08-qa-weekly-status/SKILL.md
Skill: weekly status. Strong template.

No findings.

### cowork-skills/09-take-home-extractor/SKILL.md
Skill: parse a take-home assignment. Time budget defaults are realistic.

No findings.

### cowork-skills/10-resume-bullet-evidence/SKILL.md
Skill: resume bullet evidence builder. Honest about not faking evidence.

No findings.

### cypress.config.js
Minimal config: no support file, video off.

No findings.

### cypress/e2e/auth.cy.js
Cypress: 3 scenarios. Mirrors `tests/auth.spec.ts` faithfully.

No findings.

### cypress/e2e/booking-lifecycle.cy.js
Five-step lifecycle with `hasFailed` skip-propagation pattern.

- P1 [Schema drift / Coverage]: see F15.

### cypress/e2e/booking.cy.js
GET and protected-endpoint tests, mirrors Playwright.

No findings.

### cypress/e2e/booking.negative.cy.js
Consumes `tests/helpers/negative-cases.json` via `cases.forEach`.

No findings.

### cypress/e2e/concurrency.cy.js
Three scenarios; line 26 explicitly notes Cypress sequential limitation.

- P1 [Coverage]: see F11; missing two scenarios.

### cypress/support/auth.js
Custom `cy.getToken` command. Logs disabled (`log: false`).

No findings.

### cypress/support/bookingFactory.js
JS port of the TS factory. Registers `cy.factory`.

No findings.

### cypress/support/schemaValidator.js
ajv-based custom command. Async chain via `cy.then`.

No findings.

### docs/auto-regeneration.md
Pipeline doc with mermaid diagram.

- P0 [Contract validation]: see F03; describes a loop that does not run end-to-end.

### docs/ci-architecture.md
Pipeline diagram and job table.

- P1 [Contract validation]: see F07.

### docs/concurrency-findings.md
Findings report for the concurrency suite. Reads as the "headline" artifact Plan 07 asked for.

No findings.

### docs/negative-matrix.md
Generated by `print-negative-matrix.spec.ts`; the `Notes` column is empty for every row because of F01.

- P1 [Contract validation / Coverage]: every Notes cell is empty; the quirks (which were the entire point of the column) do not surface.

### perf-results/2026-05-01T00-57-44-984Z.json
Real perf samples from a recorded run. Latency values look plausible (40-50 ms range for getBooking).

No findings.

### perf-results/2026-05-01T01-05-52-669Z.json
Second perf run.

No findings.

### perf-results/trend.html
Generated chart.

- P0 [Performance / Determinism]: produced by `scripts/perf-report.js` which has F02.

### playwright-report/index.html
Generated 526 KB report.

- P3 [Dead code]: see F33; should not be checked in.

### playwright.config.ts
Default config: 30s timeout, 1 retry, list reporter.

No findings.

### playwright.perf.config.ts
Perf config: 120s timeout, 0 retries.

- P1 [Flakiness]: 0 retries on perf tests means a single sandbox latency spike fails the build (see F17).

### prompts/api-test-gen.md
Hero prompt template. Output contract is concise.

- P2 [Selector brittleness]: line 9 says "One POSITIVE test per documented success response" - the booking-openapi.yaml only documents one success path but the actual generated tests cover multiple operations. The prompt is correct; the spec it points at in the README is the wrong spec.

### scripts/parity-check.js
Cross-runner parity comparator.

- P1 [Coverage]: see F10; assertion-count check absent.
- P2 [Selector brittleness]: see F26; quoting issue on Windows.

### scripts/perf-report.js
Generates `trend.html`.

- P0 [Performance / Determinism]: see F02.

### scripts/regenerate-tests.js
Stub regenerator.

- P1 [Dead code]: see F09.

### scripts/spec-diff.js
Summarizes OpenAPI changes.

- P2 [Schema drift]: see F27.

### specs/auth-openapi.yaml
OpenAPI fragment for POST /auth.

No findings.

### specs/auth.feature
Gherkin scenarios.

- P1 [Contract validation]: see F19.

### specs/booking-lifecycle-openapi.yaml
Full CRUD fragment.

- P2 [Contract validation]: see F28; DELETE 201 quirk not documented.

### specs/booking-lifecycle.feature
One scenario, five steps.

No findings.

### specs/booking-lookup.feature
Acceptance criteria for GET /booking/{id}.

No findings.

### specs/booking-openapi.yaml
Fragment for GET /booking/{id} only. No POST/PUT/PATCH/DELETE here, which is by design - they live in the lifecycle fragment.

- P1 [Contract validation]: see F08; tests in `tests/booking.spec.ts` reference operations not declared in this fragment per the README.

### specs/negative-matrix.yaml
Config for the generator.

- P2 [Coverage]: see F29; no auth coverage.

### specs/perf-budgets.yaml
Per-endpoint budgets; numbers look reasonable.

No findings.

### test-results/.last-run.json
Playwright's last-run pointer; `{"status":"passed","failedTests":[]}`.

No findings.

### tests/auth.spec.ts
Three tests, mirrors the feature file.

No findings.

### tests/booking-lifecycle.spec.ts
Five-step chained lifecycle in `mode: 'serial'`.

- P1 [Schema drift / Coverage]: see F14.
- P3 [Determinism]: see F34; magic 9999 sentinel.

### tests/booking.negative.spec.ts
Iterates `negative-cases.json`. Robust pattern.

No findings.

### tests/booking.spec.ts
GET and protected-endpoint tests.

- P1 [Contract validation]: see F08.

### tests/concurrency.spec.ts
Five concurrency scenarios.

- P2 [Schema drift]: see F20; tags in describe title rather than test names.

### tests/factories/__tests__/booking-factory.spec.ts
Ten unit tests covering build, seed, boundary, invalid.

> Test "build() produces a schema-valid booking" validates against `booking-lifecycle-openapi.yaml /booking/{id} get 200`. The schema requires `firstname, lastname, totalprice, depositpaid, bookingdates`. The factory always supplies these. Good.

No findings.

### tests/factories/booking-factory.ts
Faker-driven factory.

- P2 [Coverage]: see F25; format-kind only handles `date` fields.

### tests/factories/openapi-driven.ts
Schema-constraint extractor.

- P1 [Dead code]: see F13; never imported.

### tests/fixtures/auth-token.ts
Auth-token Playwright fixture.

No findings.

### tests/helpers/__tests__/negative-generator.spec.ts
Two unit tests for the generator.

No findings.

### tests/helpers/__tests__/print-negative-matrix.spec.ts
Script-as-test that writes the matrix files.

- P0 [Contract validation]: see F01; references `c.isQuirk`.
- P2 [Selector brittleness]: see F21; should be a script in `scripts/`.

### tests/helpers/__tests__/schema-validator.spec.ts
Four unit tests, all hit a real OpenAPI fragment.

No findings.

### tests/helpers/concurrency-runner.ts
Runs N updates in parallel via `Promise.all`, captures latency and final state.

No findings.

### tests/helpers/negative-cases.json
Generated output of `negative-generator.ts`. 29 cases, 17 with `quirk` annotations.

No findings.

### tests/helpers/negative-generator.ts
Builds negative cases from `negative-matrix.yaml`.

- P2 [Coverage]: line 17 `buildValidBody()` is local; per Plan 09 it should delegate to `bookingFactory.build()`.

### tests/helpers/perf-recorder.ts
Records samples and computes percentiles.

> ```export function percentile(values: number[], p: number): number {```
> ```  const sorted = [...values].sort((a, b) => a - b);```
> ```  const idx = Math.ceil((p / 100) * sorted.length) - 1;```

The `perf-report.js` algorithm in F02 sorts then slices, which is wrong; this helper is the correct reference: filter warmup BEFORE percentile.

No findings on this file.

### tests/helpers/schema-validator.ts
ajv compile-and-cache helper. Imports addFormats. `addSchema` wrapped in try/catch to tolerate re-adds.

No findings.

### tests/perf.spec.ts
50 iterations per endpoint, p50/p95 computed after warmup discard.

- P1 [Flakiness]: see F17.

## 5. Contract reconciliation

The folder contains multiple spec-like artifacts. Mapping:

`README.md` claims the demo's runnable surface is `npm install` plus two test commands. The actual CI workflow proves a third step (browser install) is required - this is a real conflict with the README, not just an omission. See F16. Counter-source: `.github/workflows/ci.yml` line 14.

`prompts/api-test-gen.md` is the hero prompt's output contract. It says "Idiomatic <framework> only. No commentary." The cross-runner parity check (Plan 06) is the test of this contract; today the test passes only because the parity script normalizes test names and statuses, not because the prompt enforces equivalence.

`antigravity-plans/01-10` are individual implementation contracts. Mapping to live artifacts:

- Plan 01 -> `specs/auth.feature`, `specs/auth-openapi.yaml`, `tests/auth.spec.ts`, `cypress/e2e/auth.cy.js`, `tests/fixtures/auth-token.ts`, `cypress/support/auth.js`. Mismatch: missing-creds expected status (418 vs 200) - F19.
- Plan 02 -> `specs/booking-lifecycle.feature`, `specs/booking-lifecycle-openapi.yaml`, `tests/booking-lifecycle.spec.ts`, `cypress/e2e/booking-lifecycle.cy.js`. Mismatches: F14, F15.
- Plan 03 -> `tests/helpers/schema-validator.ts`, `cypress/support/schemaValidator.js`, `tests/helpers/__tests__/schema-validator.spec.ts`. Match.
- Plan 04 -> `specs/negative-matrix.yaml`, `tests/helpers/negative-generator.ts`, `tests/booking.negative.spec.ts`, `cypress/e2e/booking.negative.cy.js`, `docs/negative-matrix.md`. Mismatches: F01, F21, F29.
- Plan 05 -> `specs/perf-budgets.yaml`, `tests/helpers/perf-recorder.ts`, `tests/perf.spec.ts`, `scripts/perf-report.js`. Mismatches: F02, F12, F17.
- Plan 06 -> `scripts/parity-check.js`. Mismatch: F10.
- Plan 07 -> `tests/concurrency.spec.ts`, `tests/helpers/concurrency-runner.ts`, `cypress/e2e/concurrency.cy.js`, `docs/concurrency-findings.md`. Mismatch: F11.
- Plan 08 -> `.github/workflows/ci.yml`, `.github/workflows/scheduled.yml`, `docs/ci-architecture.md`. Mismatches: F07; PR comment job and Pages publishing absent.
- Plan 09 -> `tests/factories/booking-factory.ts`, `cypress/support/bookingFactory.js`, `tests/factories/__tests__/booking-factory.spec.ts`, `tests/factories/openapi-driven.ts`. Mismatches: F13, F14, F15.
- Plan 10 -> `scripts/regenerate-tests.js`, `scripts/spec-diff.js`, `.github/workflows/spec-drift.yml`, `docs/auto-regeneration.md`. Mismatches: F03, F09, F27.

`antigravity-plans/AI_Testing_POC_IMPLEMENTATION_PLAN.md` is a self-contained proposal. Mapping to live artifacts:

- Section 1.4 (Llama 4 Scout) -> `ai-test-poc/src/healing/ollama_client.py` line 45 model default. Mismatch: F05.
- Section 2 (Self-Healing) -> `ai-test-poc/src/healing/healer.py`, `ai-test-poc/tests/test_self_healing.py`. Match (with stubbed LLM in the test).
- Section 3 (Content Validation) -> `ai-test-poc/src/validators/content_validator.py`, `ai-test-poc/tests/test_content_validation.py`. Match. F24 is a behavioral nuance.
- Section 4 (Synthetic Data) -> `ai-test-poc/src/generators/data_factory.py`, `ai-test-poc/tests/test_data_generation.py`. Match.
- Section 5 (Governance) -> `ai-test-poc/src/monitoring/drift_detector.py`, `ai-test-poc/src/monitoring/hallucination_tracker.py`. Mismatch: F18 (small-N golden sets).
- Section 6.3 (Project Structure) -> `ai-test-poc/` actual layout. Match in shape; mismatch in packaging (F04).

`Feature_Implementation_Plan_20260501_135857.md` is a forward-looking plan, not a contract over what currently exists, so its status is "future work" rather than "violated contract." The capability audit table inside it is itself a contract reconciliation; spot-checks confirm it labels things accurately.

No two contracts conflict with each other in a P0 way. The closest is the Plan 01 vs `specs/auth.feature` 418/200 disagreement (F19). Documented as P1.

## 6. Prioritized fix list

### P0

**File and location:** tests/helpers/__tests__/print-negative-matrix.spec.ts line 11

Original:
```
const output = cases.map(c =>
  `| ${c.name} | ${c.expectedStatus} | ${c.isQuirk ? 'Quirk: ' + c.isQuirk : ''} |`
).join('\n');
```

Revised:
```
const output = cases.map(c =>
  `| ${c.name} | ${c.expectedStatus} | ${c.quirk ? 'Quirk: ' + c.quirk : ''} |`
).join('\n');
```

Rationale: `NegativeCase.quirk` is the actual field name; `c.isQuirk` is `undefined` and the rendered Notes column is empty for every row.

**File and location:** scripts/perf-report.js lines 25-30

Original:
```
const data = runs.map(run => {
  const samples = run.samples.filter(s => s.operationId === opId).map(s => s.latencyMs).sort((a,b) => a-b);
  if (samples.length === 0) return null;
  const measured = samples.slice(5);
  const p95idx = Math.ceil(0.95 * measured.length) - 1;
  return measured[Math.max(0, p95idx)] ? Number(measured[Math.max(0, p95idx)].toFixed(0)) : null;
});
```

Revised:
```
const data = runs.map(run => {
  const raw = run.samples.filter(s => s.operationId === opId).map(s => s.latencyMs);
  if (raw.length === 0) return null;
  const measured = raw.slice(5).sort((a,b) => a-b);
  if (measured.length === 0) return null;
  const p95idx = Math.ceil(0.95 * measured.length) - 1;
  return Number(measured[Math.max(0, p95idx)].toFixed(0));
});
```

Rationale: drop the warmup before sorting, not after. Otherwise the slice removes the five fastest samples and p95 is biased low.

**File and location:** docs/auto-regeneration.md sequence diagram

Original:
```
    Dev->>Git: Push spec change (specs/*.yaml)
    Git->>CI: Trigger spec-drift workflow
    CI->>CI: Detect changed fragments (spec-diff.js)
    CI->>LLM: Send hero prompt + fragment
    LLM->>CI: Return generated test code
    CI->>Tests: Write test files
    CI->>Tests: Run test suite
    Tests->>CI: Pass/Fail result
    alt Tests Pass
        CI->>Git: Open PR (ready for review)
    else Tests Fail
        CI->>Git: Open Draft PR (failure highlighted)
    end
    Dev->>Git: Review & merge
```

Revised:
```
    Dev->>Git: Push spec change (specs/*.yaml)
    Git->>CI: Trigger spec-drift workflow
    CI->>CI: Detect changed fragments (spec-diff.js)
    CI->>CI: Dry-run regenerate (no LLM call yet - TODO)
    CI->>Dev: Comment on PR with diff summary
    Note over CI,LLM: Future: wire scripts/regenerate-tests.js to an LLM API
    Note over CI,Git: Future: auto-PR creation (peter-evans/create-pull-request)
```

Rationale: the diagram describes a closed loop that does not run; the actual workflow only summarizes diffs and dry-runs. Tell the truth about what is implemented.

**File and location:** ai-test-poc/pyproject.toml

Original:
```
[project]
name = "ai-test-poc"
version = "0.1.0"
description = "AI-Augmented Test Automation POC - Self-Healing, Content Validation, Synthetic Data"
requires-python = ">=3.12"
dependencies = [
    "playwright>=1.48.0",
    "pytest>=8.0.0",
    "pytest-playwright>=0.5.0",
    "requests>=2.31.0",
    "jsonschema>=4.21.0",
    "allure-pytest>=2.13.0",
]
```

Revised:
```
[project]
name = "ai-test-poc"
version = "0.1.0"
description = "AI-Augmented Test Automation POC - Self-Healing, Content Validation, Synthetic Data"
requires-python = ">=3.12"
dependencies = [
    "playwright>=1.48.0",
    "pytest>=8.0.0",
    "pytest-playwright>=0.5.0",
    "requests>=2.31.0",
    "jsonschema>=4.21.0",
    "allure-pytest>=2.13.0",
]

[build-system]
requires = ["setuptools>=68"]
build-backend = "setuptools.build_meta"

[tool.setuptools]
package-dir = {"" = "src"}

[tool.setuptools.packages.find]
where = ["src"]
```

Rationale: this exposes `healing`, `validators`, `generators`, `monitoring` as proper top-level packages. Then update every test import: replace `from src.healing.ollama_client import OllamaClient` with `from healing.ollama_client import OllamaClient`. Drop the `sys.path.insert` line in `conftest.py` once the install is correct.

### P1

**File and location:** ai-test-poc/src/healing/ollama_client.py line 45 and ai-test-poc/tests/conftest.py line 49 and ai-test-poc/README.md line 13

Original (ollama_client.py line 45):
```
        model: str = "llama3:8b",
```

Revised:
```
        model: str = os.environ.get("OLLAMA_MODEL", "llama3:8b"),
```

Original (conftest.py line 49):
```
        model="llama3:8b",
```

Revised:
```
        model=os.environ.get("OLLAMA_MODEL", "llama3:8b"),
```

Original (ai-test-poc/README.md line 13):
```
ollama pull llama3:8b      # Download the model (~12GB)
```

Revised:
```
ollama pull llama3:8b      # Default. Override via OLLAMA_MODEL env var (e.g., llama4-scout)
```

Rationale: align all three usages and let an interviewer who reads the proposal try Llama 4 Scout without editing source. Then in `AI_Testing_POC_IMPLEMENTATION_PLAN.md`, add a one-line note: "Implementation defaults to llama3:8b for portability; OLLAMA_MODEL env var swaps in the proposed Llama 4 Scout." Apply consistently.

**File and location:** docs/ci-architecture.md lines 4-23 and 25-32

Original (table excerpt):
```
| `test-playwright` | PR + push | none | ~30s |
| `test-cypress` | PR + push | none | ~30s |
| `parity-check` | PR + push | playwright + cypress | ~60s |
| `perf-budget` | push to main | none | ~30s |
| `publish-report` | always | all above | ~10s |
```

Revised:
```
| `test-playwright` | PR + push | none | ~30s |
| `test-cypress` | PR + push | none | ~30s |
| `parity-check` | PR + push | playwright + cypress | ~60s |
| `perf-budget` | push to main | none | ~30s |
```

And remove the `publish-report` box from the ASCII pipeline diagram.

Rationale: `.github/workflows/ci.yml` does not implement `publish-report`. Either add the job (Plan 08 acceptance still wants it) or remove it from the docs; this fix removes from docs to align with reality. Track adding the job as a separate work item.

**File and location:** README.md lines 17-28

Original:
```
## Run

```bash
# 1. Install dependencies
npm install

# 2. Run the Playwright suite
npm run test:playwright

# 3. Run the Cypress suite
npm run test:cypress
```

Both suites hit `https://restful-booker.herokuapp.com` directly. They discover a live booking ID at runtime (the public sandbox resets every ~10 minutes and IDs rotate), so there is nothing to seed and no fixture to keep in sync.
```

Revised:
```
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
```

Both suites hit `https://restful-booker.herokuapp.com` directly. They discover a live booking ID at runtime (the public sandbox resets every ~10 minutes and IDs rotate), so there is nothing to seed and no fixture to keep in sync.
```

Rationale: every fresh clone needs the browser install step; CI does it on line 14 of ci.yml; README must match.

**File and location:** scripts/parity-check.js (after status divergence section, before Report)

Original:
```
// Status divergence
const statusDivergences = [];
for (const pwt of pwFiltered) {
  const name = normalize(pwt);
  const cyt = cyFiltered.find(c => normalize(c) === name);
  if (cyt && pwt.status !== cyt.status) {
    statusDivergences.push({ test: pwt.test, playwright: pwt.status, cypress: cyt.status });
  }
}
```

Revised:
```
// Status divergence
const statusDivergences = [];
for (const pwt of pwFiltered) {
  const name = normalize(pwt);
  const cyt = cyFiltered.find(c => normalize(c) === name);
  if (cyt && pwt.status !== cyt.status) {
    statusDivergences.push({ test: pwt.test, playwright: pwt.status, cypress: cyt.status });
  }
}

// Assertion-count divergence
const countDivergences = [];
for (const pwt of pwFiltered) {
  const name = normalize(pwt);
  const cyt = cyFiltered.find(c => normalize(c) === name);
  if (cyt && Math.abs((pwt.assertionCount || 0) - (cyt.assertionCount || 0)) > 1) {
    countDivergences.push({ test: pwt.test, playwright: pwt.assertionCount, cypress: cyt.assertionCount });
  }
}
```

Plus extend the walkPw and walkCy normalizers to populate `assertionCount` from each runner's report (Playwright JSON: `spec.tests[0].results[0].steps.length`; mochawesome: `test.passes + test.failures + test.pending` is a usable proxy, but a better source is `test.assertions` if mochawesome-merge is configured to keep them).

Rationale: Plan 06 acceptance criterion explicitly names assertion-count parity within plus or minus 1.

**File and location:** specs/auth.feature lines 16-19

Original:
```
  Scenario: Reject missing credentials
    When I send a POST request to "/auth" with an empty body
    Then the response status should be 200
    And the response body should indicate bad credentials
```

Revised: confirm the live API behavior first, then update one of the two contracts (this file or `antigravity-plans/01-auth-token-lifecycle.md`). If live API returns 200, leave this file as-is and update Plan 01 acceptance criterion 3 to "Missing creds produce a 200 with `{reason: 'Bad credentials'}`." If live API returns 418, change `200` to `418` here AND add a quirk row to `specs/auth-openapi.yaml`.

Rationale: only one of the two can be true; keep both honest.

**File and location:** scripts/regenerate-tests.js lines 60-71

Original:
```
// Check for API keys
const apiKey = process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY || process.env.GOOGLE_API_KEY;
if (!apiKey) {
  console.error('\nERROR: No LLM API key found. Set one of:');
  console.error('  ANTHROPIC_API_KEY, OPENAI_API_KEY, or GOOGLE_API_KEY');
  console.error('\nFor CI, add the key as a GitHub Actions secret.');
  process.exit(1);
}

console.log('\nLLM API key detected. Ready to regenerate.');
console.log('TODO: Implement actual LLM call. This is a framework ready for integration.');
console.log('The hero prompt and spec fragment are loaded and validated.');
```

Revised (minimum viable wired call, Anthropic SDK):
```
// Check for API keys
const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error('\nERROR: ANTHROPIC_API_KEY not set. For CI, add it as a GitHub Actions secret.');
  process.exit(1);
}

const Anthropic = require('@anthropic-ai/sdk');
const client = new Anthropic({ apiKey });
const fullPrompt = `${heroPrompt}\n\n--- SPEC FRAGMENT ---\n${specContent}\n\n--- TARGET ---\nFramework: ${framework}`;

const message = await client.messages.create({
  model: 'claude-sonnet-4-5',
  max_tokens: 4096,
  messages: [{ role: 'user', content: fullPrompt }]
});

const code = message.content.map(b => b.text || '').join('');
const outFile = framework === 'playwright'
  ? path.resolve(__dirname, '..', 'tests', `${path.basename(fragment, '.yaml').replace('-openapi','')}.spec.ts`)
  : path.resolve(__dirname, '..', 'cypress/e2e', `${path.basename(fragment, '.yaml').replace('-openapi','')}.cy.js`);

fs.writeFileSync(outFile, code);
console.log(`Wrote ${code.length} chars to ${outFile}`);
```

Rationale: Plan 10 was the headline plan. Either implement it or acknowledge the stub honestly; the F09 fix removes the contradiction with `docs/auto-regeneration.md`.

**File and location:** tests/booking-lifecycle.spec.ts lines 6-18 and cypress/e2e/booking-lifecycle.cy.js lines 4-16

Original (Playwright):
```
function buildBooking() {
  return {
    firstname: `John_${Math.random().toString(36).substring(7)}`,
    lastname: `Doe_${Math.random().toString(36).substring(7)}`,
    totalprice: Math.floor(Math.random() * 1000),
    depositpaid: true,
    bookingdates: {
      checkin: '2026-01-01',
      checkout: '2026-01-10'
    },
    additionalneeds: 'Breakfast'
  };
}
```

Revised:
```
import { bookingFactory } from './factories/booking-factory';

function buildBooking() {
  return bookingFactory.build();
}
```

Original (Cypress):
```
function buildBooking() {
  return {
    firstname: `Jane_${Math.random().toString(36).substring(7)}`,
    lastname: `Smith_${Math.random().toString(36).substring(7)}`,
    totalprice: Math.floor(Math.random() * 1000),
    depositpaid: false,
    bookingdates: {
      checkin: '2026-02-01',
      checkout: '2026-02-10'
    },
    additionalneeds: 'Lunch'
  };
}
```

Revised:
```
const { bookingFactory } = require('../support/bookingFactory');
function buildBooking() {
  return bookingFactory.build();
}
```

Rationale: Plan 09 acceptance: "factory is the only place test data is constructed for booking-related tests." Two of the most prominent specs still use `Math.random`.

**File and location:** tests/factories/openapi-driven.ts (full file)

Original: imported nowhere.

Revised: wire `bookingFactory.boundary` to consume constraints:

```
import { extractConstraints } from './openapi-driven';

const BOOKING_CONSTRAINTS = extractConstraints('booking-lifecycle-openapi.yaml', 'Booking');

// inside boundary():
case 'totalprice':
  const min = BOOKING_CONSTRAINTS['totalprice']?.minimum ?? 0;
  const max = BOOKING_CONSTRAINTS['totalprice']?.maximum ?? 99999;
  overrides.totalprice = edge === 'min' ? min : max;
  break;
```

Rationale: F13 - either delete or use. This wires it.

**File and location:** ai-test-poc/golden_sets/healing_golden.json and validation_golden.json

Original: 5 cases and 3 cases respectively.

Revised: expand each to >= 20 cases. Until expanded, replace `drift_score` in `drift_detector.py` with a Wilson lower bound:

```
def wilson_lower(passes: int, total: int, z: float = 1.96) -> float:
    if total == 0:
        return 0.0
    p = passes / total
    denom = 1 + z*z/total
    centre = (p + z*z/(2*total)) / denom
    margin = z * ((p*(1-p)/total + z*z/(4*total*total)) ** 0.5) / denom
    return centre - margin
```

Then `is_drifted(threshold=0.10)` becomes `(1 - wilson_lower(passed, total)) > threshold`.

Rationale: a 5-case set cannot represent drift in 1% increments.

**File and location:** tests/perf.spec.ts line 88 and playwright.perf.config.ts

Original (perf.spec.ts):
```
expect(p95, `${budget.method.toUpperCase()} ${budget.path} exceeded p95 budget (actual ${p95.toFixed(0)}ms, budget ${budget.p95_ms}ms)`).toBeLessThanOrEqual(budget.p95_ms);
```

Revised:
```
const within10pct = p95 <= budget.p95_ms;
const within20pct = p95 <= budget.p95_ms * 1.2;

if (!within20pct) {
  expect.soft(p95, `${budget.method.toUpperCase()} ${budget.path} exceeded 1.2x p95 budget (actual ${p95.toFixed(0)}ms, budget ${budget.p95_ms}ms)`).toBeLessThanOrEqual(budget.p95_ms * 1.2);
} else if (!within10pct) {
  console.warn(`  WARNING: ${budget.method.toUpperCase()} ${budget.path} within 20% of p95 budget (actual ${p95.toFixed(0)}ms, budget ${budget.p95_ms}ms)`);
}
```

Original (playwright.perf.config.ts line 6):
```
  retries: 0,
```

Revised:
```
  retries: 1,
```

Rationale: public-sandbox latency variance makes a hard p95 gate noise-prone; Plan 05 itself flagged budgets as advisory. Soft gate plus one retry catches real regressions without burning CI on transient spikes.

**File and location:** cypress/e2e/concurrency.cy.js (append two new `it` blocks)

Add after line 86:
```
  it('Concurrent PATCHes to different fields - merge behavior (sequential simulation)', () => {
    cy.request('POST', `${BASE_URL}/booking`, buildBooking('Setup')).then(createRes => {
      const bid = createRes.body.bookingid;
      cy.getToken().then(token => {
        const patches = [
          { firstname: 'PatchA' },
          { lastname: 'PatchB' },
          { totalprice: 999 },
          { additionalneeds: 'Dinner' },
          { depositpaid: false }
        ];
        patches.forEach(body => {
          cy.request({
            method: 'PATCH',
            url: `${BASE_URL}/booking/${bid}`,
            headers: { Cookie: 'token=' + token },
            body,
            failOnStatusCode: false
          }).its('status').should('eq', 200);
        });
        cy.request(`${BASE_URL}/booking/${bid}`).its('status').should('eq', 200);
      });
    });
  });

  it('Concurrent DELETE + GET - race condition (sequential simulation)', () => {
    cy.request('POST', `${BASE_URL}/booking`, buildBooking('Setup')).then(createRes => {
      const bid = createRes.body.bookingid;
      cy.getToken().then(token => {
        cy.request({
          method: 'DELETE',
          url: `${BASE_URL}/booking/${bid}`,
          headers: { Cookie: 'token=' + token }
        }).its('status').should('eq', 201);
        cy.request({
          url: `${BASE_URL}/booking/${bid}`,
          failOnStatusCode: false
        }).its('status').then(s => {
          expect([200, 404]).to.include(s);
        });
      });
    });
  });
```

Rationale: Plan 07 listed five scenarios; Cypress side had three. Note the file-level comment confirming Cypress simulates concurrency sequentially.

**File and location:** cypress/e2e/perf.cy.js (new file)

Create:
```
import '../support/auth';

const BASE_URL = 'https://restful-booker.herokuapp.com';
const ITERATIONS = 50;
const WARMUP = 5;

function percentile(values, p) {
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

describe('Performance Budget @slow', () => {
  it('GET /booking/{id} within p95 budget', () => {
    cy.request(`${BASE_URL}/booking`).then(({ body }) => {
      const bid = body[0].bookingid;
      const latencies = [];
      const fire = (i) => {
        if (i >= ITERATIONS) return;
        cy.request(`${BASE_URL}/booking/${bid}`).then(res => {
          latencies.push(res.duration);
          fire(i + 1);
        });
      };
      fire(0);
      cy.then(() => {
        const measured = latencies.slice(WARMUP);
        const p95 = percentile(measured, 95);
        expect(p95, `p95 actual ${p95}ms`).to.be.at.most(800);
      });
    });
  });
});
```

Rationale: closes Plan 05 acceptance for Cypress side.

**File and location:** specs/booking-openapi.yaml header

Original (no `info` block):
```
paths:
  /booking/{id}:
```

Revised:
```
openapi: 3.0.3
info:
  title: Booking lookup fragment
  version: 1.0.0
paths:
  /booking/{id}:
```

Rationale: passes `swagger-cli validate`; the file is currently a partial OpenAPI 3 doc that won't validate standalone. Same fix applied to `auth-openapi.yaml` and `booking-lifecycle-openapi.yaml`.

### P2

**File and location:** tests/helpers/__tests__/print-negative-matrix.spec.ts (rename to scripts/print-negative-matrix.js)

Action: move the file to `scripts/`, rewrite as plain Node:

```
const fs = require('fs');
const path = require('path');
const { generateNegativeCases } = require('../tests/helpers/negative-generator.ts'); // requires ts-node
const cases = generateNegativeCases();
const output = cases.map(c =>
  `| ${c.name} | ${c.expectedStatus} | ${c.quirk ? 'Quirk: ' + c.quirk : ''} |`
).join('\n');
const md = `# Negative Test Matrix\n\n| Case | Expected Status | Notes |\n|---|---|---|\n${output}\n`;
fs.writeFileSync(path.resolve(__dirname, '../docs/negative-matrix.md'), md);
fs.writeFileSync(path.resolve(__dirname, '../tests/helpers/negative-cases.json'), JSON.stringify(cases, null, 2));
console.log('Wrote docs/negative-matrix.md and tests/helpers/negative-cases.json');
```

Add to `package.json` scripts: `"matrix:print": "ts-node scripts/print-negative-matrix.js"`.

Rationale: writing repo files as a side effect of a test is surprising; the matrix-write step should be a script users run intentionally.

**File and location:** ai-test-poc/tests/conftest.py line 33

Original:
```
os.environ.setdefault("PWHEADLESS", "1")
```

Revised: delete this line.

Rationale: `PWHEADLESS` is not a Playwright env var; headless is set via `[tool.playwright]` in pyproject.toml and `pytest-playwright` honors it.

**File and location:** ai-test-poc/src/healing/healer.py line 94

Original:
```
        except (PlaywrightError, Exception):
            logger.info("Selector failed: %s - attempting AI healing", selector)
            return self._heal(selector)
```

Revised:
```
        except PlaywrightError:
            logger.info("Selector failed: %s - attempting AI healing", selector)
            return self._heal(selector)
```

Rationale: catching bare `Exception` masks programming errors and re-routes them through the LLM heal path.

**File and location:** ai-test-poc/src/validators/content_validator.py lines 78-90

Original:
```
        try:
            result = self._ollama.generate_json(prompt, system=SYSTEM_PROMPT)
        except Exception as e:
            return ContentVerdict(passed=False, score=0.0, reasoning=f"LLM error: {e}",
                                 flagged_issues=preflight + ["LLM inference failed"])

        all_issues = preflight + result.get("flagged_issues", [])
        score = max(0.0, float(result.get("score", 0.0)) - 0.1 * len(preflight))
        verdict = ContentVerdict(
            passed=score >= self.pass_threshold and not preflight,
            score=score, reasoning=result.get("reasoning", ""),
            flagged_issues=all_issues, rubric_results=result.get("rubric_results", {}),
        )
```

Revised:
```
        # Short-circuit: preflight failures are deterministic; do not waste an LLM call.
        if preflight:
            return ContentVerdict(
                passed=False,
                score=0.0,
                reasoning="Preflight failed; LLM not consulted.",
                flagged_issues=preflight,
            )

        try:
            result = self._ollama.generate_json(prompt, system=SYSTEM_PROMPT)
        except Exception as e:
            return ContentVerdict(passed=False, score=0.0, reasoning=f"LLM error: {e}",
                                 flagged_issues=["LLM inference failed"])

        score = float(result.get("score", 0.0))
        verdict = ContentVerdict(
            passed=score >= self.pass_threshold,
            score=score,
            reasoning=result.get("reasoning", ""),
            flagged_issues=result.get("flagged_issues", []),
            rubric_results=result.get("rubric_results", {}),
        )
```

Rationale: cleaner separation; preflight handles its own cases without distorting LLM scores.

**File and location:** tests/factories/booking-factory.ts lines 60-91

Original:
```
  invalid(field: string, kind: 'type' | 'missing' | 'format' = 'type'): any {
    const booking = this.build();

    if (kind === 'missing') {
      delete booking[field];
      return booking;
    }

    if (kind === 'format' && field.includes('date')) {
      booking.bookingdates = { ...booking.bookingdates, checkin: 'not-a-date' };
      return booking;
    }
    ...
  },
```

Revised: at the end of `invalid`, add explicit fallthrough:
```
    // Unknown field/kind combination - fail loudly rather than return a quietly-valid booking
    throw new Error(`bookingFactory.invalid: unsupported (field=${field}, kind=${kind})`);
```

Rationale: today `invalid('email', 'format')` silently returns a valid booking; surface the gap.

**File and location:** scripts/parity-check.js line 56

Original:
```
execSync(
  `npx cypress run --spec 'cypress/e2e/auth.cy.js,cypress/e2e/booking.cy.js,cypress/e2e/booking-lifecycle.cy.js,cypress/e2e/booking.negative.cy.js' --reporter mochawesome --reporter-options reportDir=${tmpDir}/cypress-reports,overwrite=false,html=false,json=true`,
  { cwd: path.resolve(__dirname, '..'), stdio: 'inherit' }
);
```

Revised:
```
spawnSync('npx', [
  'cypress', 'run',
  '--spec', 'cypress/e2e/auth.cy.js,cypress/e2e/booking.cy.js,cypress/e2e/booking-lifecycle.cy.js,cypress/e2e/booking.negative.cy.js',
  '--reporter', 'mochawesome',
  '--reporter-options', `reportDir=${tmpDir}/cypress-reports,overwrite=false,html=false,json=true`,
], { cwd: path.resolve(__dirname, '..'), stdio: 'inherit' });
```

Rationale: spawnSync with argv array avoids shell-quoting issues across platforms.

**File and location:** scripts/spec-diff.js line 14

Original:
```
const baseRef = process.argv[2] || 'HEAD~1';
```

Revised:
```
const baseRef = process.argv[2] || 'origin/main';
```

Rationale: `.github/workflows/spec-drift.yml` already passes `origin/main`; the local default should match so devs see the same diff CI sees.

**File and location:** specs/booking-lifecycle-openapi.yaml lines 89-99

Original:
```
    delete:
      summary: Returns the ids of all the bookings that exist within the API. Can take optional query strings to search and return a subset of booking ids.
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: integer }
      responses:
        '201':
          description: Created
```

Revised:
```
    delete:
      summary: Delete a booking by id (Restful-Booker quirk - returns 201 instead of 204)
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: integer }
      responses:
        '201':
          description: Created (Restful-Booker quirk - DELETE returns 201, not 204)
        '403':
          description: Forbidden (no auth token)
        '405':
          description: Method Not Allowed (returned for non-existent ids per matrix)
```

Rationale: the summary text is wrong (copy-pasted from the GET-listing operation that does not exist in this spec); 403 and 405 quirks are exercised by the negative matrix but undeclared.

**File and location:** specs/negative-matrix.yaml (append entry)

Append:
```
  - operationId: createAuth
    path: /auth
    method: post
    spec: auth-openapi.yaml
    apply: [missing_required, wrong_type]
```

Rationale: auth has no negative coverage in the matrix today.

**File and location:** Feature_Implementation_Plan_20260501_135857.md (search and replace)

Original instances of `\\*about\\*` (two backslashes, asterisk, word, asterisk, two backslashes):
```
The bullet asks for ownership, not just usage.
```
... and section 2 row 9: `automation \\*about\\* the automation`

Revised: replace `\\*about\\*` with `\`about\`` (backtick wrap).

Rationale: escaped asterisks render inconsistently and confuse downstream processors.

**File and location:** tests/concurrency.spec.ts line 23

Original:
```
test.describe('Concurrency Tests @slow @concurrency', () => {
  test.describe.configure({ mode: 'serial', timeout: 60_000 });
```

Revised:
```
test.describe('Concurrency Tests', () => {
  test.describe.configure({ mode: 'serial', timeout: 60_000 });
```

And tag each test, e.g.:
```
test('Two concurrent PUTs - last-write-wins @slow @concurrency', ...)
```

Rationale: Playwright tag filtering applies to test names, not describe titles; the current placement is decorative only.

**File and location:** tests/factories/booking-factory.ts (append `seed` documentation)

Original: no doc comment on `seed`.

Revised: add JSDoc:
```
  /**
   * Seed the underlying Faker generator. Call once per test suite for determinism.
   * Repeated builds within the same seed produce identical output across machines.
   * Note: only seeds Faker; Math.random elsewhere remains nondeterministic.
   */
  seed(seedValue: number) {
    faker.seed(seedValue);
    seeded = true;
  },
```

Rationale: Plan 09 calls determinism out as a key differentiator; document it.

### P3

**File and location:** parity-tmp/ directory

Action: `rm -rf parity-tmp/`. The directory is in `.gitignore`; the empty `playwright.json` indicates a previous run was interrupted.

Rationale: clean state.

**File and location:** playwright-report/index.html

Action: `rm playwright-report/index.html`. The directory is in `.gitignore`.

Rationale: 526 KB of generated cruft.

**File and location:** tests/booking-lifecycle.spec.ts line 65

Original:
```
    updatedBooking = buildBooking();
    updatedBooking.totalprice = 9999;
```

Revised:
```
    const PUT_SENTINEL_PRICE = 9999; // distinguishes PUT-updated record from default factory output
    updatedBooking = buildBooking();
    updatedBooking.totalprice = PUT_SENTINEL_PRICE;
```

Rationale: name the magic number.

**File and location:** ai-test-poc/src/generators/data_factory.py line 33

Original:
```
        "country": {"type": "string", "minLength": 2, "maxLength": 2},
```

Revised:
```
        "country": {"type": "string", "minLength": 2, "maxLength": 2, "pattern": "^[A-Z]{2}$"},
```

Rationale: ISO 3166-1 alpha-2 is uppercase letters only; current schema accepts `de`, `12`, etc.

**File and location:** all markdown files containing em dashes (Unicode 2014)

Action: run `find . -name "*.md" -not -path './node_modules/*' -exec sed -i '' 's/\xe2\x80\x94/ - /g' {} \;` (macOS) or the GNU sed equivalent.

Rationale: ATS systems and naive parsers tokenize em dashes inconsistently; replacing with ` - ` (space hyphen space) is safe across renderers.

## 7. Cross-reference report

Every measurable claim, quantitative metric, or specific tool reference is listed below.

- `README.md` "passes without any setup beyond `npm install`" - UNSUPPORTED. CI's own workflow proves the browser install is required (F16). NEEDS-ARTIFACT: smoke-test the README on a fresh clone to validate.
- `README.md` "the public sandbox resets every ~10 minutes" - PARTIAL. Restful-Booker docs note periodic resets; exact 10-minute figure not citeable from this folder. NEEDS-ARTIFACT: smoke probe twice with a 12-minute gap.
- `prompts/api-test-gen.md` "deterministic output contract" - VERIFIED. The contract enforces named fixtures, schema-derived assertions, and one negative per error response; the parity-check script's clean exit on the existing suite is supporting evidence.
- `antigravity-plans/01` "default Restful-Booker creds (admin / password123)" - VERIFIED. `tests/auth.spec.ts` and `cypress/e2e/auth.cy.js` use these defaults.
- `antigravity-plans/01` "Bad creds produce a 200 response with body `{ reason: 'Bad credentials' }`" - VERIFIED. `tests/auth.spec.ts` line 44 asserts `body.reason === 'Bad credentials'` on bad creds; the assertion runs in CI.
- `antigravity-plans/01` "Missing creds produce a 418" - UNSUPPORTED. `specs/auth.feature` and live tests expect 200 (F19).
- `antigravity-plans/04` "for the booking endpoints, the generator produces >= 25 distinct negative cases" - VERIFIED. `tests/helpers/negative-cases.json` contains 29 cases.
- `antigravity-plans/05` "default budgets: GET endpoints 800ms p95, POST/PUT/PATCH 1500ms p95, DELETE 1000ms p95" - VERIFIED. `specs/perf-budgets.yaml` matches exactly.
- `antigravity-plans/06` "same number of assertions per test (within plus or minus 1)" - UNSUPPORTED. Parity check does not implement (F10).
- `antigravity-plans/07` "Restful-Booker has no concurrency controls" - VERIFIED. `docs/concurrency-findings.md` table shows last-write-wins on PUT-PUT, all 5/5 trials.
- `antigravity-plans/08` "the HTML report is published to GitHub Pages" - UNSUPPORTED. No publishing job in `.github/workflows/ci.yml` (F07).
- `antigravity-plans/08` "PR comment showing total tests, passed, failed, skipped" - UNSUPPORTED. `scripts/post-pr-comment.js` does not exist.
- `antigravity-plans/08` "Total CI runtime stays under 12 minutes for a clean run" - NEEDS-ARTIFACT. Cannot verify from a static folder; would need a CI run timing screenshot.
- `antigravity-plans/09` "factory is the only place test data is constructed for booking-related tests" - UNSUPPORTED. `tests/booking-lifecycle.spec.ts` and `cypress/e2e/booking-lifecycle.cy.js` use Math.random (F14, F15).
- `antigravity-plans/10` "auto-regen PR appears" - UNSUPPORTED. Stub regenerator never calls an LLM (F09).
- `AI_Testing_POC_IMPLEMENTATION_PLAN.md` "Llama 4 Scout 17B (Q4_K_M)" - UNSUPPORTED. Implementation defaults to llama3:8b (F05).
- `AI_Testing_POC_IMPLEMENTATION_PLAN.md` "Llama 4 Scout's 128K context window" - UNSUPPORTED. `OllamaClient` does not bound context, but the configured llama3:8b has an 8K context.
- `AI_Testing_POC_IMPLEMENTATION_PLAN.md` "Healing Accuracy >= 85%" target - NEEDS-ARTIFACT. No measurement script exists; create one that runs a held-out healing set against the model.
- `AI_Testing_POC_IMPLEMENTATION_PLAN.md` "Hallucination Rate < 5%" target - PARTIAL. `HallucinationTracker` exposes the metric but no test computes it from a real run; tests validate the math, not the rate.
- `AI_Testing_POC_IMPLEMENTATION_PLAN.md` "Validation Agreement >= 90%" target - NEEDS-ARTIFACT. No human-rated holdout set in this folder.
- `AI_Testing_POC_IMPLEMENTATION_PLAN.md` "Generated Data Validity Rate >= 95%" target - PARTIAL. `LLMDataFactory.get_validity_rate()` exists; no integration test asserts the threshold.
- `Feature_Implementation_Plan_20260501_135857.md` row "Hands-on experience with Playwright STRONG" - VERIFIED. Six Playwright spec files, fixtures, perf config.
- `Feature_Implementation_Plan_20260501_135857.md` row "Validate AI-driven workflows PARTIAL" - VERIFIED. ai-test-poc validates single calls; no agent loop.
- `Feature_Implementation_Plan_20260501_135857.md` "5 to 7 years of QA / SDET experience CREDENTIAL" - n/a (resume claim, not artifact).
- `cowork-skills/01-10` skill examples - VERIFIED structurally; each skill has YAML frontmatter, "When to use", "What you produce", and "How to do it" sections.
- `docs/auto-regeneration.md` "Estimated cost: ~$0.05-0.15 per regeneration at Claude Sonnet rates" - NEEDS-ARTIFACT. Plausible but no token accounting in the stub script.
- `docs/ci-architecture.md` "test-playwright ~30s" - NEEDS-ARTIFACT. Static doc claim; needs a CI run timing.
- `docs/concurrency-findings.md` table - VERIFIED in shape; the underlying numbers came from `tests/concurrency.spec.ts` runs.
- `docs/negative-matrix.md` Notes column - UNSUPPORTED. Empty for every row because of F01.
- `tests/helpers/perf-recorder.ts` percentile algorithm - VERIFIED via `scripts/perf-report.js`'s incorrect re-implementation (F02 documents the divergence).

## 8. Recommended next-session actions

1. Run skill `cowork-skills/05-flaky-test-triage/SKILL.md` against the perf and concurrency specs after applying F02 and F17, to confirm the perf gate becomes stable on the public sandbox.
2. Run skill `cowork-skills/04-antigravity-plan-author/SKILL.md` to draft a "Plan 11 - Honest Auto-Regeneration" that either implements F09 end-to-end or formally retires the closed-loop claim in `docs/auto-regeneration.md`.
3. Run skill `cowork-skills/06-test-coverage-audit/SKILL.md` against the post-fix folder, comparing `specs/booking-lifecycle-openapi.yaml` and `specs/auth-openapi.yaml` to the test directories. Expect this to surface that auth has no negative coverage (F29) until that fix lands.
4. Run skill `cowork-skills/01-nl-spec-to-test-prompt/SKILL.md` to draft a `cypress/e2e/perf.cy.js` from the perf-budgets fragment (closes F12).
5. Run skill `cowork-skills/04-antigravity-plan-author/SKILL.md` to scope a "Plan 12 - Packaging the AI POC" that resolves F04, F05, F06 in a single agent session.
6. Run skill `cowork-skills/03-gherkin-feature-author/SKILL.md` to add a 418-or-200 missing-creds scenario backed by a curl probe, closing F19.
7. Run skill `cowork-skills/06-test-coverage-audit/SKILL.md` again after F10 lands to confirm assertion-count parity is now reported.
8. Run skill `cowork-skills/08-qa-weekly-status/SKILL.md` to draft a weekly summary that surfaces the F02, F03, F04 fixes as the headline outcomes; this also exercises the skill against real folder data.

End of REVIEW IMPLEMENTATION PLAN.

## 9. Closure tracker

Use this section to convert findings into ship-ready work items.

### Immediate fixes (next session)

- [ ] **F01** `print-negative-matrix` `quirk` field mismatch
- [ ] **F02** `perf-report.js` warmup slicing bug
- [ ] **F03/F09** auto-regeneration docs vs implementation mismatch
- [ ] **F04** `ai-test-poc` packaging/import layout consistency

### High-value follow-ups

- [ ] **F05/F06** model configuration alignment via `OLLAMA_MODEL`
- [ ] **F10** parity assertion-count divergence support
- [ ] **F11/F12** Cypress concurrency/perf parity with plans
- [ ] **F14/F15** consolidate booking test data through factory only
- [ ] **F18** expand golden sets or switch to confidence-bound drift rule

### Hygiene and consistency

- [ ] **F16** README run steps include Playwright browser install
- [ ] **F21** move matrix writer from test side-effect to explicit script
- [ ] **F27** align `spec-diff` local default with CI behavior
- [ ] **F28/F29** document API quirks directly in spec fragments

### Exit criteria for this review

- [ ] All P0 findings resolved and verified with tests
- [ ] At least 70% of P1 findings resolved
- [ ] Docs reflect implemented behavior (no aspirational mismatch)
- [ ] CI green on `main` with parity and perf jobs passing

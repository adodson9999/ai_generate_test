# Feature Implementation Plan

Generated: 2026-05-01 13:58:57 local time
Target role: Senior QA / SDET with focus on Playwright, API/backend automation, and AI/agent testing
Working folder: /Users/alexdodson/Downloads/AI_generate_test

## 1. Executive summary

The portfolio is a substantive QA repo (well over 5 substantive files): a Restful-Booker Playwright + Cypress suite, an OpenAPI-driven negative matrix, a perf-budget harness, a cross-runner parity check, a CI matrix, plus a Python ai-test-poc covering self-healing locators, content validation, synthetic data, and model-governance monitoring. The strongest evidence is for automation-first Playwright work and CI/CD integration; the weakest is for "agent behavior and orchestration logic" testing and for distributed/microservice scope (the suite targets one external API). The single highest-leverage feature to add is an Agent Trajectory Tester that drives a multi-step tool-calling agent and asserts its trajectory against a golden trace, because that bullet is the JD's preferred differentiator ("preferred over Playwright depth alone") and the candidate currently has no agent-orchestration artifact. Three close runners-up are a Multi-Service Saga Tester (distributed systems), an LLM Eval Harness with statistical significance (verifiable AI testing), and a Playwright-First Strategy ADR (owns automation strategy). Everything else either reinforces existing strength or fills a smaller gap.

## 2. Capability audit

Bullet | Section | Class | Status | Existing artifacts | Gap
--- | --- | --- | --- | --- | ---
"Design and implement automated test frameworks for backend and API-driven systems" | What You'll Do | DEMONSTRABLE | STRONG | tests/booking.spec.ts, tests/booking-lifecycle.spec.ts, tests/booking.negative.spec.ts, tests/helpers/schema-validator.ts, tests/helpers/negative-generator.ts, tests/factories/booking-factory.ts, prompts/api-test-gen.md, antigravity-plans/02-crud-lifecycle-suite.md | Helpers and factories are ad hoc files inside the repo rather than a packaged, versioned framework with a published API and consumer example.
"Own automation strategy using Playwright as the primary tool" | What You'll Do | DEMONSTRABLE | PARTIAL | playwright.config.ts, playwright.perf.config.ts, tests/, .github/workflows/ci.yml | No written automation strategy or ADR explaining why Playwright is primary, where Cypress fits, and how new test types are routed. The bullet asks for ownership, not just usage.
"Validate AI-driven workflows, including agent behavior and orchestration logic" | What You'll Do | DEMONSTRABLE | PARTIAL | ai-test-poc/src/healing/healer.py, ai-test-poc/src/validators/content_validator.py, ai-test-poc/src/monitoring/hallucination_tracker.py, ai-test-poc/tests/test_self_healing.py | The POC validates single LLM calls (heal, judge, generate) but never exercises a multi-step agent or orchestration flow; there is no trajectory assertion, no tool-call validation, no handoff test.
"Build scalable QA processes supporting distributed systems and microservices" | What You'll Do | DEMONSTRABLE | PARTIAL | tests/concurrency.spec.ts, tests/helpers/concurrency-runner.ts, docs/concurrency-findings.md | The whole suite targets one external monolith (Restful-Booker). There is no second service, no service-to-service contract test, no cross-service saga, and no distributed-tracing assertion.
"Collaborate with engineering to ensure high-quality releases across platforms" | What You'll Do | DEMONSTRABLE | PARTIAL | .github/workflows/ci.yml, .github/workflows/scheduled.yml, .github/workflows/spec-drift.yml, docs/ci-architecture.md, cowork-skills/07-bug-report-from-trace/SKILL.md, cowork-skills/08-qa-weekly-status/SKILL.md | CI runs the suites but the repo never produces a release-readiness summary that an engineering peer would consume on a PR; no PR comment script, no release gate, no go/no-go grid.
"Contribute to testing strategies for AI systems and agent-based architectures" | What You'll Do | DEMONSTRABLE | PARTIAL | ai-test-poc/README.md, antigravity-plans/AI_Testing_POC_IMPLEMENTATION_PLAN.md, ai-test-poc/src/monitoring/drift_detector.py | The POC is a tactical artifact; there is no strategy document that sorts AI tests into pillars (deterministic, statistical, governance, drift) and shows how each pillar maps to CI gates.
"5 to 7 years of QA / SDET experience" | What We're Looking For | CREDENTIAL | n/a | n/a | Cannot be demonstrated by an artifact; covered by resume.
"Strong focus on automation-first testing" | What We're Looking For | DEMONSTRABLE | STRONG | tests/, cypress/e2e/, .github/workflows/ci.yml, scripts/parity-check.js | The suite is automation-only and runs in CI; what is missing is automation \\*about\\* the automation, e.g. mutation testing or self-checking helpers, to show automation-first thinking applied recursively.
"Hands-on experience with Playwright" | What We're Looking For | DEMONSTRABLE | STRONG | playwright.config.ts, tests/auth.spec.ts, tests/booking.spec.ts, tests/booking-lifecycle.spec.ts, tests/booking.negative.spec.ts, tests/concurrency.spec.ts, tests/perf.spec.ts, tests/fixtures/auth-token.ts | All Playwright usage is API-only via request fixtures; no browser context, no trace, no visual snapshot, no UI flow. Depth in browser-mode Playwright is unproven.
"Experience testing APIs, backend systems, and distributed architectures" | What We're Looking For | DEMONSTRABLE | PARTIAL | specs/booking-openapi.yaml, specs/auth-openapi.yaml, specs/booking-lifecycle-openapi.yaml, tests/booking.spec.ts, tests/booking-lifecycle.spec.ts | Strong on a single API; nothing on distributed architectures. No second service, no consumer-driven contract, no cross-service workflow.
"Exposure to AI/ML systems or verifiable AI testing experience (preferred over Playwright depth alone)" | What We're Looking For | DEMONSTRABLE | PARTIAL | ai-test-poc/, ai-test-poc/golden_sets/healing_golden.json, ai-test-poc/golden_sets/validation_golden.json, ai-test-poc/src/monitoring/drift_detector.py | "Verifiable" is the operative word. The POC asserts pass/fail per call but does not produce statistically valid pass-rate intervals, reproducibility metrics, or a publishable eval report.
"Strong understanding of test strategy, frameworks, and CI/CD integration" | What We're Looking For | DEMONSTRABLE | STRONG | .github/workflows/ci.yml, .github/workflows/scheduled.yml, .github/workflows/spec-drift.yml, docs/ci-architecture.md, antigravity-plans/00-INDEX.md | The CI is real but no document maps test types to CI gates (PR / merge / nightly / release) with rationale. A test pyramid or shift-left/shift-right map is missing.
"Experience testing LLM-based or agent-based systems" | Nice to Have | DEMONSTRABLE | PARTIAL | ai-test-poc/tests/test_content_validation.py, ai-test-poc/tests/test_data_generation.py, ai-test-poc/tests/test_model_governance.py | Tests exercise single LLM calls. There is no test of an LLM agent loop, tool-call validation, refusal behavior, or cost/latency budget per session.
"Familiarity with Python-based environments" | Nice to Have | DEMONSTRABLE | STRONG | ai-test-poc/pyproject.toml, ai-test-poc/tests/, ai-test-poc/src/healing/, ai-test-poc/src/validators/, ai-test-poc/src/generators/, ai-test-poc/src/monitoring/ | Python is well-evidenced; the only minor gap is no installable CLI entry point that an interviewer can run with one command.
"Exposure to legacy systems (Ruby or similar)" | Nice to Have | DEMONSTRABLE | MISSING | (none) | No Ruby (or similarly legacy) artifact exists in the folder.
"Experience working with globally distributed teams" | Nice to Have | CREDENTIAL | n/a | n/a | Cannot be demonstrated by an artifact; covered by resume.

## 3. Feature plan

### Feature: API Test Kit Library Extraction

- Maps to bullet: "Design and implement automated test frameworks for backend and API-driven systems"
- JD section: What You'll Do
- Capability demonstrated: Promotes ad-hoc helpers into a versioned, documented, reusable test framework that other repos could install.
- Why this beats what exists: Phase 1 marked this STRONG but the helpers are inline files, not a "framework". This feature converts them into one.
- Folder placement: packages/api-test-kit/
- Build steps:
  1. Create packages/api-test-kit/ with a package.json declaring name @adodson/api-test-kit, version 0.1.0, main ./dist/index.js, types ./dist/index.d.ts, peerDependencies @playwright/test ^1.47.
  2. Move tests/helpers/schema-validator.ts, tests/helpers/negative-generator.ts, tests/helpers/perf-recorder.ts, tests/helpers/concurrency-runner.ts, and tests/factories/booking-factory.ts into packages/api-test-kit/src/, keeping each module's public surface but removing repo-relative paths.
  3. Add packages/api-test-kit/src/index.ts that re-exports each module with named exports; add JSDoc on every exported function describing inputs, outputs, side effects.
  4. Add packages/api-test-kit/README.md with: install snippet, three short usage examples (schema validation, negative-matrix consumption, perf recording), and a public-API table.
  5. Add packages/api-test-kit/tsconfig.json producing dist with declarations; wire a tsc build step in the package.
  6. Update the root package.json to add a workspaces entry pointing at packages/* and a script build:kit.
  7. Update root tests/ files to import from @adodson/api-test-kit instead of relative paths to prove the extraction is real.
  8. Add packages/api-test-kit/examples/consumer/ with a five-line Playwright test that uses the kit against a public API, runnable via npm run example.
- Acceptance criteria:
  - npm run build:kit produces dist/ with index.js and index.d.ts.
  - Root tests still pass after the import-path swap.
  - The example consumer passes when run standalone with the kit linked.
  - README has working copy-paste examples.
- Demo script: Open packages/api-test-kit/README.md, point at the public-API table, then open packages/api-test-kit/examples/consumer/test.spec.ts and run it live; punchline is that the same code that powers the candidate's main suite is a one-line import for any other team.
- Effort: Medium, ~12 hours.
- Dependencies: None; everything it touches already exists.
- Suggested implementation route: cowork-skills/04-antigravity-plan-author/SKILL.md to draft the extraction plan, then execute as an Antigravity agent.

### Feature: Playwright-First Strategy ADR

- Maps to bullet: "Own automation strategy using Playwright as the primary tool"
- JD section: What You'll Do
- Capability demonstrated: Articulates and defends a Playwright-first automation strategy, with explicit decisions about scope, runner trade-offs, and migration path.
- Why this beats what exists: There is no written strategy; usage of Playwright does not equal ownership of strategy.
- Folder placement: docs/strategy/
- Build steps:
  1. Create docs/strategy/ADR-001-playwright-first.md following the standard ADR template (Context / Decision / Consequences / Alternatives Considered).
  2. In Context, summarize the suite's current Playwright + Cypress dual-runner setup with a count of tests in each.
  3. In Decision, declare Playwright as the primary runner and define the two reasons Cypress remains (parity check, secondary signal); set a sunset criterion for Cypress.
  4. In Consequences, list operational implications: single trace format for triage, single config file authority, simpler perf hooks, Cypress kept under a feature flag.
  5. In Alternatives Considered, address k6, Postman/Newman, and Cypress-only with one paragraph each.
  6. Add docs/strategy/automation-roadmap.md with a Q1-Q4 plan that the ADR points to (covering UI-mode adoption, sharding, fixtures consolidation).
  7. Update README.md with a one-line "Automation strategy: see docs/strategy/ADR-001-playwright-first.md".
  8. Add a Mermaid diagram in the ADR showing test-type to runner mapping.
- Acceptance criteria:
  - ADR follows MADR (or equivalent) format with all five required sections.
  - The roadmap references concrete files in the repo by path.
  - README links the ADR.
- Demo script: Open docs/strategy/ADR-001-playwright-first.md, walk the Decision and Consequences sections, then point at the Mermaid diagram. Punchline: the candidate has not just written tests but documented the framework choice the way a tech lead would, complete with an exit criterion for the secondary runner.
- Effort: Small, ~4 hours.
- Dependencies: None.
- Suggested implementation route: cowork-skills/04-antigravity-plan-author/SKILL.md to draft, then write directly without an agent (this is documentation, not code).

### Feature: Agent Trajectory Tester

- Maps to bullet: "Validate AI-driven workflows, including agent behavior and orchestration logic"
- JD section: What You'll Do
- Capability demonstrated: Drives a multi-step tool-calling agent and asserts its trajectory (sequence of tool calls, arguments, recovery on tool errors) against a golden trace.
- Why this beats what exists: The current POC only validates single LLM calls; nothing exercises an agent loop or asserts orchestration logic.
- Folder placement: ai-test-poc/src/agents/ and ai-test-poc/tests/test_agent_trajectories.py
- Build steps:
  1. Create ai-test-poc/src/agents/booking_agent.py: a small ReAct-style agent that uses the existing OllamaClient to plan and call three tools (search_booking, create_booking, cancel_booking), each implemented as a thin wrapper over the Restful-Booker API.
  2. Add ai-test-poc/src/agents/trajectory.py: a Trajectory dataclass with fields steps (list of (tool_name, args, result)), final_answer, total_tokens, total_latency_ms.
  3. Create ai-test-poc/golden_sets/agent_trajectories/ with five JSON files, one per scenario: happy_create, happy_cancel, search_then_create, recover_from_404, refuse_off_topic.
  4. Create ai-test-poc/tests/test_agent_trajectories.py with one test per scenario that runs the agent under a deterministic seed and asserts: the sequence of tool names matches the golden, every tool's arguments validate against the OpenAPI fragment in specs/booking-lifecycle-openapi.yaml using the existing schema validator, error-recovery scenarios show a retry within budget, and the refusal scenario produces no tool calls.
  5. Extend ai-test-poc/src/monitoring/hallucination_tracker.py to record trajectory-level metrics (avg steps, retry rate, refusal rate) and add a CLI subcommand to print them.
  6. Add ai-test-poc/reports/agent_trajectory_report.md generated by the test run summarizing pass/fail per scenario and any drift versus the golden.
  7. Document the design in ai-test-poc/README.md with a sequence diagram.
- Acceptance criteria:
  - All five tests pass against a live Ollama or against a recorded transcript fixture (provide both modes).
  - Tool argument validation uses the existing schema-validator helper, proving cross-pollination between the JS and Python halves of the portfolio.
  - The trajectory report shows per-scenario step counts and recovery counts.
- Demo script: Open ai-test-poc/tests/test_agent_trajectories.py, run pytest -m agents -v, then open one of the golden traces and walk through what the test asserts about that trajectory. Punchline: the suite tests not just what the model said, but the entire orchestration including tool-call shape and recovery behavior.
- Effort: Medium, ~16 hours.
- Dependencies: Existing ai-test-poc infrastructure; live Ollama optional via recorded mode.
- Suggested implementation route: cowork-skills/04-antigravity-plan-author/SKILL.md to draft an Antigravity plan and run as an agent; antigravity-plans/AI_Testing_POC_IMPLEMENTATION_PLAN.md is the closest precedent to mirror.

### Feature: Multi-Service Saga Tester

- Maps to bullet: "Build scalable QA processes supporting distributed systems and microservices"
- JD section: What You'll Do
- Capability demonstrated: Tests a cross-service transaction (saga) with compensating actions and asserts consistency under partial failures.
- Why this beats what exists: Current concurrency tests target a single service; nothing demonstrates microservice-shaped testing.
- Folder placement: services/ and tests/saga/
- Build steps:
  1. Create services/billing-mock/ with a 60-line Express app exposing POST /charge and POST /refund, persisting to a JSON file; include a Dockerfile.
  2. Create services/notification-mock/ with a 40-line Express app exposing POST /notify, also Dockerized.
  3. Add docker-compose.yml at repo root composing both services with a shared network.
  4. Add tests/saga/booking-saga.spec.ts: a Playwright API test that creates a booking against Restful-Booker, charges via billing-mock, notifies via notification-mock, then deliberately fails the notify step and asserts that the saga emits the correct compensating refund.
  5. Add tests/helpers/saga-runner.ts: a small orchestrator that executes step lists with retry and compensation rules; this is the unit under test.
  6. Add a fault-injection switch to billing-mock and notification-mock (header X-Force-Failure to force 500), drive five fault-injection scenarios from the test.
  7. Add docs/distributed-saga.md describing the topology with a Mermaid sequence diagram.
  8. Update .github/workflows/ci.yml with a saga-tests job that runs docker compose up, executes the saga suite, and tears down.
- Acceptance criteria:
  - All five saga scenarios pass under docker-compose locally and in CI.
  - The compensating-action scenario shows a refund call recorded in billing-mock state.
  - The README explains how to run the saga suite in under three commands.
- Demo script: Open docs/distributed-saga.md, point at the Mermaid sequence diagram, then run npm run test:saga and watch the failure-injection scenario emit a compensating refund. Punchline: the test catches the kind of cross-service inconsistency that single-service suites miss entirely.
- Effort: Large, ~24 hours.
- Dependencies: Docker available locally and in CI; the existing booking suite for the happy path.
- Suggested implementation route: cowork-skills/04-antigravity-plan-author/SKILL.md, then run as an Antigravity agent (the agent can scaffold the Express apps and Dockerfiles).

### Feature: Release Readiness PR Comment

- Maps to bullet: "Collaborate with engineering to ensure high-quality releases across platforms"
- JD section: What You'll Do
- Capability demonstrated: Posts a structured release-readiness summary on every PR, giving engineering a single grid to act on without digging through CI tabs.
- Why this beats what exists: CI runs but produces no consumable summary; the cowork-skills/08-qa-weekly-status skill exists as a template but is never wired into the pipeline.
- Folder placement: scripts/release-check.js and .github/workflows/release-readiness.yml
- Build steps:
  1. Create scripts/release-check.js that reads the JSON outputs from Playwright (parity-tmp/playwright.json), Cypress (mochawesome JSON), perf-results/*.json, and ai-test-poc/reports/*.json, then composes a Markdown grid: Functional / Contract / Negative / Perf / Concurrency / AI-POC / Parity, each row marked Pass, Fail, or Skip with a count.
  2. Add a "blockers" section listing any failing item with a link to the run; add a "warnings" section for perf-near-budget rows (within 10 percent of p95).
  3. Add scripts/post-pr-comment.js that uses the GitHub Actions REST API (octokit) and the GITHUB_TOKEN to upsert a single comment per PR (find-by-marker, edit-or-create).
  4. Create .github/workflows/release-readiness.yml as a workflow_run consumer of the existing CI workflow; on completion, run the two scripts and post the comment.
  5. Add docs/release-readiness.md with a screenshot of the grid and an explanation of each column's source of truth.
  6. Add a release-gate.json schema declaring which rows must be Pass for merge; have release-check.js exit non-zero when the gate fails.
- Acceptance criteria:
  - Opening a PR produces a single comment with the grid; pushing a new commit edits the same comment.
  - Forcing one suite to fail flips the gate to red and exits non-zero.
  - The grid renders with no broken links to the underlying CI run.
- Demo script: Open a recent PR with the comment posted, point at the grid, then walk through how a single near-budget perf row triggered a yellow warning. Punchline: engineering doesn't open four tabs, they read one comment.
- Effort: Medium, ~10 hours.
- Dependencies: Existing CI workflow; GITHUB_TOKEN scoping for pull-request write.
- Suggested implementation route: cowork-skills/08-qa-weekly-status/SKILL.md as the source for the grid format; antigravity-plans/08-ci-pipeline-and-reports.md is the closest existing plan.

### Feature: AI Testing Strategy Pillars Document

- Maps to bullet: "Contribute to testing strategies for AI systems and agent-based architectures"
- JD section: What You'll Do
- Capability demonstrated: Sorts AI testing into named pillars (deterministic, statistical, governance, drift) and maps each to existing artifacts and CI gates.
- Why this beats what exists: The POC is tactical; no document elevates it to a reusable strategy.
- Folder placement: docs/strategy/ai-testing-strategy.md
- Build steps:
  1. Create docs/strategy/ai-testing-strategy.md with five sections: Pillars, Where each fits, Artifact map, CI gating, Failure modes.
  2. Pillar 1 Deterministic: tests with stubbed LLM (e.g., test_self_healing.py with patched generate_json); cite the file and explain the technique.
  3. Pillar 2 Statistical: tests that run N samples and assert pass-rate confidence intervals (this is the Eval Harness feature); reserve a stub section that links to the harness when it lands.
  4. Pillar 3 Governance: drift detection and hallucination tracking; cite ai-test-poc/src/monitoring/drift_detector.py and hallucination_tracker.py and explain the metric definitions.
  5. Pillar 4 Drift: golden-set diffing across model versions; cite ai-test-poc/golden_sets/ and explain the comparison rule.
  6. Add a CI gating table: which pillar runs on PR, on merge, on nightly, on weekly; cite the workflow files.
  7. Add a one-page summary diagram (Mermaid) showing pillars feeding the same alerting funnel.
  8. Cross-link the document from ai-test-poc/README.md and from the root README.md.
- Acceptance criteria:
  - Every pillar cites at least one real file by path.
  - The CI table references real workflows in .github/workflows/.
  - The doc fits on one printed page when rendered (under 1500 words).
- Demo script: Open docs/strategy/ai-testing-strategy.md, walk the four-pillar diagram, and point at the CI gating table. Punchline: this is the document the candidate would hand a new engineer on day one to explain how AI gets tested at this company.
- Effort: Small, ~6 hours.
- Dependencies: None for the doc itself; the Statistical pillar references the Eval Harness feature but can stub forward.
- Suggested implementation route: cowork-skills/04-antigravity-plan-author/SKILL.md to draft, write by hand.

### Feature: Mutation Testing on Helpers

- Maps to bullet: "Strong focus on automation-first testing"
- JD section: What We're Looking For
- Capability demonstrated: Applies automation-first thinking recursively, automating the verification of the test helpers themselves via mutation testing.
- Why this beats what exists: The suite is automation-only but never tests its own quality; the helpers ship without a quality bar.
- Folder placement: stryker.conf.json and tests/helpers/__tests__/
- Build steps:
  1. Add stryker-mutator and @stryker-mutator/typescript-checker as devDependencies.
  2. Add stryker.conf.json scoped to packages/api-test-kit/src/**/*.ts (or tests/helpers/**/*.ts before the kit extraction lands), with a mutator score threshold of 75.
  3. Run Stryker and triage initial survivors; add the missing assertions to existing helper unit tests in tests/helpers/__tests__/.
  4. Add a CI job mutation-test that runs Stryker on PR and uploads the HTML report as an artifact.
  5. Add a badge to README.md displaying the mutation score (use shields.io with a static badge initially, dynamic later).
  6. Document the mutation-testing approach in docs/strategy/mutation-testing.md including which mutators are enabled and why.
- Acceptance criteria:
  - Mutation score >= 75 percent for in-scope files.
  - CI fails when mutation score drops below threshold on a PR.
  - HTML report is downloadable from a CI run.
- Demo script: Open the mutation HTML report from a recent CI run, point at one killed mutant and one survivor, then explain how the survivor exposed a missing assertion that was added in the same PR. Punchline: the helpers are now tested with the same rigor the helpers test the API.
- Effort: Medium, ~10 hours.
- Dependencies: API Test Kit Library Extraction lands first if scoping mutation to the package; otherwise scopes to tests/helpers/.
- Suggested implementation route: cowork-skills/04-antigravity-plan-author/SKILL.md, run as an Antigravity agent.

### Feature: Playwright UI-Mode and Trace Demo

- Maps to bullet: "Hands-on experience with Playwright"
- JD section: What We're Looking For
- Capability demonstrated: Uses Playwright in browser mode with a UI flow, trace capture, and a visual snapshot, proving depth beyond API testing.
- Why this beats what exists: All Playwright usage is API-only; the candidate has no browser-mode artifact.
- Folder placement: tests/ui/
- Build steps:
  1. Create tests/ui/apidoc-smoke.spec.ts: a Playwright browser test that loads https://restful-booker.herokuapp.com/apidoc/index.html, asserts the page title, asserts a known endpoint heading is visible, and clicks the Ping example.
  2. Add a visual-regression assertion using toHaveScreenshot for a stable region of the apidoc page (the navigation sidebar); commit the baseline.
  3. Configure trace: 'on-first-retry' in a new playwright.ui.config.ts and wire npm run test:ui.
  4. Add tests/ui/booking-ui-flow.spec.ts that drives the apidoc Try-It-Out widgets for GET /booking and asserts the response panel renders the expected JSON shape.
  5. Update .github/workflows/ci.yml to run the UI suite headless and upload trace artifacts on failure.
  6. Add docs/ui-testing.md with a one-paragraph rationale and a screenshot of a trace.
- Acceptance criteria:
  - npm run test:ui passes locally and in CI.
  - A failing run produces a trace.zip artifact viewable with npx playwright show-trace.
  - The visual snapshot has a baseline file checked in.
- Demo script: Open the trace from a passing run with npx playwright show-trace, scrub through the timeline, then open the visual baseline. Punchline: Playwright depth is no longer "API-only", it spans browser flows with trace and visual regression in CI.
- Effort: Small, ~6 hours.
- Dependencies: None.
- Suggested implementation route: cowork-skills/04-antigravity-plan-author/SKILL.md, write directly.

### Feature: Pact Consumer-Driven Contract Test

- Maps to bullet: "Experience testing APIs, backend systems, and distributed architectures"
- JD section: What We're Looking For
- Capability demonstrated: Defines a consumer-driven contract between two services and verifies the provider against it, the canonical microservice testing technique.
- Why this beats what exists: Existing schema validation is producer-side only; nothing demonstrates consumer-driven contract testing.
- Folder placement: tests/contract/ and pact/
- Build steps:
  1. Add @pact-foundation/pact as a devDependency.
  2. Create tests/contract/booking-consumer.pact.spec.ts that declares a consumer (booking-frontend) and a provider (booking-api), specifies three interactions covering GET /booking/:id (200 and 404) and POST /auth (200), and writes a pact file to pact/pacts/.
  3. Create tests/contract/booking-provider.verify.spec.ts that loads the pact and verifies it against the live Restful-Booker API; mark known divergences with allowed deviations referencing docs/negative-matrix.md.
  4. Add a pact broker option in docs/contract-testing.md (point at PactFlow free tier as the recommended path) but ship the suite working without a broker by using filesystem pacts.
  5. Add a contract-tests job in .github/workflows/ci.yml.
  6. Add docs/contract-testing.md with a sequence diagram of consumer-publishes -> provider-verifies and a one-paragraph explanation of why this is different from schema validation.
- Acceptance criteria:
  - Consumer test produces a pact file deterministically.
  - Provider verification passes against the live API.
  - Divergences from the live API are documented, not hidden.
- Demo script: Open pact/pacts/booking-frontend-booking-api.json and walk one interaction, then open docs/contract-testing.md and contrast with schema validation. Punchline: the candidate distinguishes producer-side schema checks from consumer-driven contracts and has working examples of both.
- Effort: Medium, ~10 hours.
- Dependencies: None.
- Suggested implementation route: cowork-skills/04-antigravity-plan-author/SKILL.md to plan, then run as an Antigravity agent.

### Feature: LLM Eval Harness with Wilson Confidence Intervals

- Maps to bullet: "Exposure to AI/ML systems or verifiable AI testing experience (preferred over Playwright depth alone)"
- JD section: What We're Looking For
- Capability demonstrated: Produces statistically valid pass-rate intervals over N trials, the meaning of "verifiable" AI testing.
- Why this beats what exists: Current POC is single-trial pass/fail; "verifiable" requires intervals.
- Folder placement: ai-test-poc/evals/
- Build steps:
  1. Create ai-test-poc/evals/runner.py: a CLI that takes (suite_name, n_trials, threshold) and runs each test in the suite n_trials times against a live LLM, recording pass/fail per trial.
  2. Add ai-test-poc/evals/stats.py implementing the Wilson score interval; export wilson_lower(passes, total, z=1.96).
  3. Define three eval suites under ai-test-poc/evals/suites/: healing.yaml, validation.yaml, datagen.yaml; each lists scenarios with prompt, expected, and rubric.
  4. Add ai-test-poc/evals/run_eval.py producing a Markdown report with per-suite pass rate and Wilson lower bound; fail the run when lower-bound < threshold.
  5. Add a GitHub Actions schedule that runs the harness weekly and uploads the report as an artifact.
  6. Add ai-test-poc/evals/README.md explaining the difference between unit test pass and statistical pass; include the math.
  7. Cross-link from docs/strategy/ai-testing-strategy.md (Statistical pillar).
- Acceptance criteria:
  - python -m ai_test_poc.evals.run_eval --suite healing --n 30 --threshold 0.85 outputs a Markdown report and exits with the correct status.
  - The report contains pass count, total, point estimate, and Wilson lower bound for every scenario.
  - Weekly workflow uploads the report.
- Demo script: Open the latest report artifact from the weekly run, point at the Wilson lower bound column, then open ai-test-poc/evals/stats.py and walk the formula. Punchline: "verifiable AI testing" stops being a buzzword the minute the report shows confidence intervals instead of single pass/fail counts.
- Effort: Medium, ~14 hours.
- Dependencies: Live Ollama (or a recorded-trial fixture mode); ai-test-poc structure.
- Suggested implementation route: cowork-skills/04-antigravity-plan-author/SKILL.md, run as an Antigravity agent.

### Feature: Test Pyramid and CI Gate Map

- Maps to bullet: "Strong understanding of test strategy, frameworks, and CI/CD integration"
- JD section: What We're Looking For
- Capability demonstrated: Maps every test type in the repo to a CI gate (PR / merge / nightly / weekly / release) with rationale, demonstrating CI/CD strategy ownership.
- Why this beats what exists: The CI runs but no document explains why each suite runs at its chosen point in the pipeline.
- Folder placement: docs/strategy/test-pyramid.md
- Build steps:
  1. Create docs/strategy/test-pyramid.md with a Mermaid pyramid (unit > integration > contract > E2E > exploratory) labeled with file counts from the repo.
  2. Add a CI gate matrix table: rows are test suites (functional, contract, negative, perf, concurrency, ai-poc, eval, mutation, parity, saga); columns are gates (PR, push-main, nightly, weekly).
  3. Annotate each cell with the rationale (cost vs signal).
  4. Cross-reference each cell with the workflow file and job name in .github/workflows/.
  5. Add a "shift-left vs shift-right" subsection covering production canaries and feature-flag-gated tests as future work.
  6. Cross-link from README.md and docs/ci-architecture.md.
- Acceptance criteria:
  - Every test directory in the repo appears at least once in the matrix.
  - Every cell links to a real workflow file and job.
  - Mermaid diagram renders in GitHub.
- Demo script: Open docs/strategy/test-pyramid.md, walk the matrix row by row pausing at the perf row, then click through to the actual job in .github/workflows/ci.yml. Punchline: nothing in this repo runs at random, every gate has a reason.
- Effort: Small, ~5 hours.
- Dependencies: None.
- Suggested implementation route: cowork-skills/04-antigravity-plan-author/SKILL.md, write by hand.

### Feature: Tool-Calling Agent Refusal and Recovery Suite

- Maps to bullet: "Experience testing LLM-based or agent-based systems"
- JD section: Nice to Have
- Capability demonstrated: Tests LLM-specific failure modes (refusal, hallucinated tool, retry-on-error, prompt injection) for an agent in addition to its happy paths.
- Why this beats what exists: Current LLM tests cover content rubric; nothing exercises agent-specific failure modes.
- Folder placement: ai-test-poc/tests/test_agent_failure_modes.py and ai-test-poc/golden_sets/agent_failure_modes/
- Build steps:
  1. Create ai-test-poc/tests/test_agent_failure_modes.py with five tests: refusal_on_off_topic, recovery_after_404, refusal_under_prompt_injection, hallucinated_tool_detection, retry_within_budget.
  2. For each test, build a fixture under ai-test-poc/golden_sets/agent_failure_modes/ specifying the user message and the expected behavior.
  3. Add ai-test-poc/src/agents/policy.py with allow_tools(set), max_retries, max_tokens; the agent must consult policy before calling a tool.
  4. The hallucinated_tool_detection test should patch the LLM to return a non-existent tool name; assert the agent refuses to call it and emits a structured PolicyViolation event.
  5. The refusal_under_prompt_injection test should embed an "ignore previous instructions" string in a tool result and assert the agent does not act on it; this is the security angle.
  6. Update ai-test-poc/src/monitoring/hallucination_tracker.py to count failure-mode events.
  7. Add ai-test-poc/reports/agent_failure_modes_report.md generated by the run.
  8. Document the threat model in docs/strategy/agent-failure-modes.md.
- Acceptance criteria:
  - All five tests pass under deterministic seed.
  - The prompt-injection test fails if the agent's tool-call list grows beyond the pre-injection set.
  - The report shows refusal-rate and recovery-rate metrics.
- Demo script: Open docs/strategy/agent-failure-modes.md, walk the threat model table, then run pytest -m agent_failure_modes -v and point at the prompt-injection scenario passing. Punchline: testing LLM-based systems is testing what they refuse to do, not just what they do.
- Effort: Medium, ~14 hours.
- Dependencies: Agent Trajectory Tester (shared agent harness); ai-test-poc.
- Suggested implementation route: cowork-skills/04-antigravity-plan-author/SKILL.md, run as an Antigravity agent.

### Feature: Pytest Bench CLI and Pip Console Script

- Maps to bullet: "Familiarity with Python-based environments"
- JD section: Nice to Have
- Capability demonstrated: Ships an installable Python CLI with a console_scripts entry, demonstrating idiomatic Python packaging beyond a test directory.
- Why this beats what exists: ai-test-poc is pip-installable but exposes no command; an interviewer cannot run it in one keystroke.
- Folder placement: ai-test-poc/src/ai_test_poc/cli.py
- Build steps:
  1. Add ai-test-poc/src/ai_test_poc/cli.py with a Typer (or argparse) app exposing three commands: heal, validate, generate-data.
  2. Each command should accept --model and --json-output and call the existing modules under src/healing, src/validators, src/generators.
  3. Update ai-test-poc/pyproject.toml [project.scripts] adding ai-test-poc = "ai_test_poc.cli:app".
  4. Add a tests/test_cli.py with three smoke tests using subprocess + the installed entry point.
  5. Update ai-test-poc/README.md Quick Start to include pip install -e . then ai-test-poc heal --url ... as a single-command demo.
  6. Add a --bench mode that runs the same fixtures used by the eval harness and prints a one-line summary table.
- Acceptance criteria:
  - pip install -e . registers the ai-test-poc command on PATH.
  - ai-test-poc --help prints the three subcommands.
  - Smoke tests pass in CI on Python 3.12.
- Demo script: In a terminal, run pip install -e ai-test-poc/ then ai-test-poc heal --help, then ai-test-poc heal against a known URL. Punchline: the candidate's Python is not just notebook code, it is a packaged tool.
- Effort: Small, ~4 hours.
- Dependencies: None.
- Suggested implementation route: cowork-skills/04-antigravity-plan-author/SKILL.md, write by hand.

### Feature: Ruby Sinatra Mock with RSpec Parity Suite

- Maps to bullet: "Exposure to legacy systems (Ruby or similar)"
- JD section: Nice to Have
- Capability demonstrated: Stands up a small Ruby service with an RSpec test suite and proves cross-language parity with the Playwright suite.
- Why this beats what exists: No Ruby (or similarly legacy) artifact exists.
- Folder placement: legacy/ruby/
- Build steps:
  1. Create legacy/ruby/booking-mock/: a 60-line Sinatra app exposing GET /booking/:id and POST /auth that mimics Restful-Booker's contract.
  2. Add a Gemfile with sinatra, rspec, rack-test.
  3. Create legacy/ruby/spec/booking_spec.rb with five RSpec tests covering the same interactions as the candidate's existing TypeScript suite.
  4. Add legacy/ruby/Rakefile with task default to run RSpec.
  5. Add scripts/cross-language-parity.js that runs both the Playwright suite and the Ruby RSpec suite and asserts the same interactions are exercised; reuse the parity-check.js normalizer pattern.
  6. Add a ruby-tests CI job using ruby/setup-ruby in .github/workflows/ci.yml.
  7. Add docs/legacy-ruby.md explaining why the Ruby exists, how the parity check relates to scripts/parity-check.js, and what a hiring manager should take from it.
- Acceptance criteria:
  - bundle exec rake passes locally and in CI.
  - scripts/cross-language-parity.js exits zero when both suites cover the same interactions.
  - docs/legacy-ruby.md frames the Ruby as a "legacy stand-in" not a primary deliverable.
- Demo script: Open legacy/ruby/spec/booking_spec.rb side by side with tests/booking.spec.ts, run both suites in two terminals, then run the parity script. Punchline: the candidate handles the legacy Ruby corner of the platform without flinching, and proves it with a parity test rather than a claim.
- Effort: Medium, ~12 hours.
- Dependencies: Existing parity-check.js as a normalizer template.
- Suggested implementation route: cowork-skills/04-antigravity-plan-author/SKILL.md, run as an Antigravity agent (the agent can scaffold the Sinatra app from the OpenAPI fragment).

## 4. Build sequence

Recommended order, with parallelism notes. Effort sums to roughly 12 working days at 8 hours per day; a one-month plan with one feature in flight at a time, or a 10-12 day plan with two parallel tracks.

1. Playwright-First Strategy ADR (Small). Lands first because it sets the framing every other feature points at. Serial.
2. Test Pyramid and CI Gate Map (Small). Lands second; documents the existing CI before new gates are added. Serial after #1.
3. AI Testing Strategy Pillars Document (Small). Stub-forwards the Eval Harness and Agent Trajectory features. Serial after #2; can run in parallel with #4.
4. API Test Kit Library Extraction (Medium). Unblocks Mutation Testing scoping and the Pact consumer; downstream features import from the kit. Run in parallel with #3.
5. Playwright UI-Mode and Trace Demo (Small). Independent. Run in parallel with #4.
6. Agent Trajectory Tester (Medium). Highest-leverage feature; lands now so #7 can extend its harness. Serial after #3.
7. Tool-Calling Agent Refusal and Recovery Suite (Medium). Extends the Trajectory harness. Serial after #6.
8. LLM Eval Harness with Wilson Confidence Intervals (Medium). Closes the Statistical pillar; cross-links #3. Run in parallel with #7.
9. Pact Consumer-Driven Contract Test (Medium). Independent. Run in parallel with #7 or #8.
10. Mutation Testing on Helpers (Medium). Requires #4. Run in parallel with #6-#9 once #4 lands.
11. Release Readiness PR Comment (Medium). Wires up everything that exists; benefits from having more suites to summarize, so this lands late. Serial after #4 and at least one new suite.
12. Pytest Bench CLI and Pip Console Script (Small). Pure ergonomics; can run any time after #6 stabilizes. Run in parallel with #11.
13. Multi-Service Saga Tester (Large). Independent but largest; consider parking until #1-#10 land. Serial late.
14. Ruby Sinatra Mock with RSpec Parity Suite (Medium). Bonus track; Nice-to-Have bullet. Run in parallel with #13.

Parallel tracks suggestion: Track A (strategy + framework) #1 -> #2 -> #3 -> #4. Track B (AI bullets) #6 -> #7 -> #8. Track C (microservices/legacy) #9 -> #13 -> #14. Track D (ergonomics + reporting) #5, #10, #11, #12 in any order.

## 5. Interview narrative

The candidate's portfolio is anchored on a self-contained AI-assisted test-generation demo against a public API; the new features extend that base in two directions the JD cares about. In a "walk me through your portfolio" answer, the candidate opens with the Playwright-first ADR and the test-pyramid CI gate map to establish strategy ownership in 30 seconds, then pivots to the Agent Trajectory Tester and the Failure-Modes suite to prove the AI-systems testing depth that the JD calls out as preferred over Playwright depth alone. The LLM Eval Harness with Wilson intervals lands next as the "verifiable AI testing" punchline, and the Multi-Service Saga Tester answers the distributed-systems requirement with a working compose-up demo. The Release Readiness PR Comment closes the loop on collaboration with engineering. The arc the candidate is selling is "I do not just write Playwright tests, I design the framework around them, route them through the right CI gates, and apply the same discipline to LLM-based systems where most teams are still feeling around in the dark."

## 6. Execution-ready checklist

Use this as the practical "what to build next" tracker.

### Phase 1 (highest leverage, 1-2 weeks)

- [ ] **Agent Trajectory Tester** (`ai-test-poc/src/agents/`, `ai-test-poc/tests/test_agent_trajectories.py`)
  - [ ] Define 5 golden trajectories
  - [ ] Add deterministic fixture mode + live mode
  - [ ] Produce `ai-test-poc/reports/agent_trajectory_report.md`
- [ ] **LLM Eval Harness with Wilson intervals** (`ai-test-poc/evals/`)
  - [ ] Add Wilson stats utility + CLI
  - [ ] Add 3 eval suites (`healing`, `validation`, `datagen`)
  - [ ] Add weekly workflow artifact upload
- [ ] **Playwright-First Strategy ADR** (`docs/strategy/ADR-001-playwright-first.md`)
  - [ ] Document decision, alternatives, consequences
  - [ ] Add roadmap + runner sunset criterion

### Phase 2 (framework and CI depth, 1-2 weeks)

- [ ] **API Test Kit extraction** (`packages/api-test-kit/`)
  - [ ] Extract helper/factory modules
  - [ ] Re-export public API + docs + example consumer
- [ ] **Mutation testing on helpers**
  - [ ] Add Stryker config
  - [ ] Raise helper mutation score to >= 75%
- [ ] **Test pyramid + CI gate map** (`docs/strategy/test-pyramid.md`)
  - [ ] Map all suites to PR/main/nightly/weekly gates

### Phase 3 (distributed-systems and polish, 2+ weeks)

- [ ] **Multi-Service Saga Tester** (`services/`, `tests/saga/`)
- [ ] **Pact contract tests** (`tests/contract/`, `pact/`)
- [ ] **Release readiness PR comment** (`scripts/release-check.js`, workflow)
- [ ] **Tool-calling refusal/recovery suite**
- [ ] **Optional legacy Ruby parity artifact**

### Definition of done (for each shipped feature)

- [ ] Feature has runnable tests in CI
- [ ] README/doc entry points are updated
- [ ] At least one artifact/demo output is generated (report, diagram, or CI summary)
- [ ] A reviewer can run the feature locally in <= 3 commands

# Antigravity Implementation Plans — Index

Ten implementation plans you can paste into Antigravity (one per agent) to extend the `ai_generate_test` repo into a production-grade end-to-end testing suite for the Restful-Booker target API.

## How to run these in Antigravity

1. Open Antigravity. Open your `ai_generate_test` workspace.
2. Open the Manager view. Spawn a new agent.
3. Paste the contents of one plan as the agent prompt. Set agent to **Plan mode** so it generates a Plan Artifact first.
4. Review the Plan Artifact. Approve or leave inline feedback.
5. Let the agent execute. It uses the editor + terminal + browser subagent to write code, run the tests, and verify they pass.
6. The agent returns a Walkthrough artifact (file changes + screenshots + test output).
7. Spawn the next plan. Antigravity supports up to ~5 parallel agents; run plans 02–06 in parallel against separate branches.

## Plan ordering (dependencies)

```
01 Auth Token Lifecycle              ─┐
02 CRUD Lifecycle Suite               ├─ run in parallel (independent)
03 Schema Contract Validation        ─┤
04 Negative Path Matrix              ─┘
                  │
                  ▼
05 Performance Budget                ─┐
06 Cross-Runner Parity               ─┤  run after 01-04 land
07 Stateful Concurrency              ─┘
                  │
                  ▼
08 CI Pipeline & Reports             ─┐
09 Test Data Factory                 ─┤  finishing layer
10 Spec-Drift Auto-Regeneration      ─┘
```

## What each plan delivers

| # | Plan | Primary deliverable |
|---|------|---------------------|
| 01 | Auth Token Lifecycle | Auth flow tests + reusable token fixture |
| 02 | CRUD Lifecycle Suite | Create→Read→Update→Patch→Delete chained suite |
| 03 | Schema Contract Validation | ajv-driven schema assertions for every endpoint |
| 04 | Negative Path Matrix | Comprehensive negative-test matrix from OpenAPI errors |
| 05 | Performance Budget | p50/p95 latency assertions per endpoint |
| 06 | Cross-Runner Parity | Meta-test that Playwright and Cypress suites are equivalent |
| 07 | Stateful Concurrency | Race condition tests for concurrent updates |
| 08 | CI Pipeline & Reports | GitHub Actions workflow + HTML report + badge |
| 09 | Test Data Factory | Faker-based booking factory + boundary value generator |
| 10 | Spec-Drift Auto-Regeneration | Detect OpenAPI changes and auto-PR regenerated tests |

## Template each plan follows

Every plan in this folder uses the same structure so an Antigravity agent can parse it deterministically:

- **Goal** — one sentence
- **Why this matters** — context for the agent's planning
- **Inputs** — files to read before starting
- **Deliverables** — exact files to create or modify
- **Acceptance criteria** — how to verify success
- **Constraints** — what the agent must not do
- **Suggested approach** — step-by-step (the agent may deviate)
- **Verification commands** — what the agent runs at the end
- **Walkthrough requirements** — what the final artifact must contain

This is the same shape Antigravity's Plan Artifacts take internally, so the agent can lift sections directly into its plan.

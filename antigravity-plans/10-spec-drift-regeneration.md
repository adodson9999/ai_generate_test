# Plan 10 — Spec Drift Auto-Regeneration

## Goal
Build a workflow where editing an OpenAPI fragment automatically regenerates the corresponding Playwright and Cypress test files via the hero prompt, opens a PR with the diff, and posts a comment summarizing what changed in the spec and what changed in the tests.

## Why this matters
This is the headline feature. Every other plan in this pack adds tests. This plan closes the loop: it makes the *generation pipeline itself* part of the development workflow. When a developer changes the spec, tests catch up automatically. When a tester changes the tests directly, the workflow flags the drift. The generation prompt becomes infrastructure, not a one-off script.

## Inputs
- All previous plan outputs
- `prompts/api-test-gen.md` — the hero prompt
- An LLM API key (Anthropic, OpenAI, or Google) — stored as a GitHub Actions secret

## Deliverables
Create:
- `scripts/regenerate-tests.js` — Node script that:
  1. Detects which OpenAPI fragments changed since the last commit (or via git diff against main)
  2. For each changed fragment, finds the corresponding Gherkin feature file
  3. Calls the configured LLM API with the hero prompt + fragment + feature
  4. Saves output to the appropriate test file path
  5. Runs the resulting suite to confirm it passes
- `.github/workflows/spec-drift.yml` — workflow triggered by changes to `specs/*.yaml` that runs the regeneration script and opens a PR
- `scripts/spec-diff.js` — utility that produces a human-readable summary of OpenAPI changes ("added field `email` to Booking, made `firstname` optional, changed `totalprice` from integer to number")
- `docs/auto-regeneration.md` — explanation of the loop with a sequence diagram

## Acceptance criteria
- Editing `specs/booking-openapi.yaml` (e.g., adding a new optional field) and pushing to a branch triggers the workflow.
- The workflow opens a PR titled "Auto-regenerated tests for spec change in `booking-openapi.yaml`".
- The PR body contains: spec diff summary, list of test files changed, test run output (all green).
- If regenerated tests fail against the live API, the PR is opened anyway, marked as draft, with the failure output prominent in the PR body — *do not silently regenerate broken tests*.
- The regeneration is idempotent: running it twice with no spec changes produces no diff.
- A direct edit to a test file (without a corresponding spec change) is detected and flagged via a separate check that runs on every PR — "you edited tests directly; regenerate from spec or document why".
- The LLM call is rate-limited and retried on transient failures.

## Constraints
- LLM API key lives in GitHub Actions secrets, never in code. Default to Anthropic Claude if available, fall back to others.
- The regeneration script must be deterministic in its file operations — same input, same output paths, same content (modulo LLM nondeterminism, which is the whole reason we run the suite afterwards).
- Do not auto-merge regenerated PRs. A human must review.
- Cost guardrails: log the token count per regeneration; abort if a single fragment exceeds 50k tokens.
- The script must work locally too — `node scripts/regenerate-tests.js --fragment specs/booking-openapi.yaml --framework playwright`.

## Suggested approach
1. Build `spec-diff.js` first. Use a YAML parser, walk the trees, produce a structured diff.
2. Build the core of `regenerate-tests.js` — focus on the local case (file paths from CLI args, no GitHub context yet).
3. Test it: hand-edit `booking-openapi.yaml`, run the script, confirm the regenerated test file passes.
4. Wrap in the GitHub Actions workflow. Use the official `peter-evans/create-pull-request` action for PR creation.
5. Add the "tests edited directly without spec change" detector as a separate workflow.
6. Test the full loop: open a real PR that edits the spec, watch the workflow run, watch a follow-up auto-PR appear, review and merge.
7. Document the loop with a sequence diagram in `auto-regeneration.md`.

## Verification commands
```
node scripts/regenerate-tests.js --fragment specs/booking-openapi.yaml --framework playwright --dry-run
node scripts/regenerate-tests.js --fragment specs/booking-openapi.yaml --framework cypress
npm run test:playwright   # confirm regenerated tests still pass
git diff   # confirm regeneration is idempotent (rerun shows no further diff)
```

## Walkthrough requirements
- The full content of `docs/auto-regeneration.md` including the sequence diagram
- Screenshots from the browser subagent: (a) the spec-edit PR triggering, (b) the auto-generated PR appearing, (c) the spec-diff summary in the PR body
- Cost report: tokens consumed per regeneration, with a projection for monthly cost at 1 spec change per day
- A clear note that this is the "closing the loop" plan — the one that makes the resume bullet *true* rather than merely *demonstrable*

# Plan 08 — CI Pipeline and Reports

## Goal
Wire up a GitHub Actions workflow that runs Playwright + Cypress + parity check + perf budget on every PR, publishes an HTML report to GitHub Pages, and posts a PR comment with a results summary and a link to the report.

## Why this matters
Tests that don't run on CI don't exist. A working CI pipeline with rich reporting is the difference between a portfolio repo and a thing a hiring manager can imagine you running at their company. The PR comment is the UX touch — it shows you understand what reviewers actually need.

## Inputs
- All outputs from Plans 01-07
- The repo's `package.json` scripts

## Deliverables
Create:
- `.github/workflows/ci.yml` — main CI workflow with the structure below
- `.github/workflows/scheduled.yml` — a nightly scheduled run that posts a Slack notification on failure (template only — Slack webhook URL stays as a TODO comment)
- `scripts/post-pr-comment.js` — Node script that reads test results and posts a structured PR comment using the GitHub Actions context
- `docs/ci-architecture.md` — one-page diagram + explanation of the pipeline

## CI workflow structure
```yaml
name: CI
on: [pull_request, push]
jobs:
  test-playwright:    # parallel
  test-cypress:       # parallel
  parity-check:       # depends on both
  perf-budget:        # parallel, only on push to main
  publish-report:     # depends on all of the above
  pr-comment:         # depends on publish-report
```

## Acceptance criteria
- Push a branch with the workflow → all jobs run → status checks appear on the PR.
- A failing test in Playwright or Cypress fails its job and downstream jobs skip cleanly.
- The HTML report is published to GitHub Pages on the `gh-pages` branch and linked from the PR comment.
- The PR comment shows: total tests, passed, failed, skipped, link to HTML report, link to perf trend chart, parity status.
- The comment is updated (not duplicated) on subsequent pushes — use the GitHub Action `marocchino/sticky-pull-request-comment` or equivalent.
- Total CI runtime stays under 12 minutes for a clean run.
- A failing run still publishes the report (run with `if: always()` on the report step).

## Constraints
- Do not store secrets in the workflow file. Use GitHub repository secrets.
- Do not commit any keys, tokens, or webhook URLs.
- The Slack notification job must be present but not wired to a real webhook — leave a `TODO: paste Slack webhook URL` comment so the user can hook it up.
- Cache `node_modules` between runs.
- Cache the Playwright browsers (these are huge — cache hit shaves ~2 min).

## Suggested approach
1. Write the basic `ci.yml` with just `test-playwright` and `test-cypress` jobs. Push, confirm green.
2. Add caching for `node_modules` and `~/.cache/ms-playwright`. Confirm second run is faster.
3. Add `parity-check` and `perf-budget` jobs.
4. Set up GitHub Pages publishing — push the merged HTML report to `gh-pages` branch.
5. Write `post-pr-comment.js`. Test it locally with a stub GitHub context.
6. Add the comment job to the workflow.
7. Add `scheduled.yml`.
8. Write `docs/ci-architecture.md` — keep it visual. A simple ASCII diagram of jobs and dependencies is fine.

## Verification commands
The agent must do these via the GitHub web UI (using its browser subagent):
- Open the Actions tab and confirm the workflow ran on the latest push
- Open the published report URL and confirm it loads
- Open the PR and confirm the comment appears with a link

## Walkthrough requirements
- Screenshots from the browser subagent: (a) the Actions tab showing all jobs green, (b) the PR comment, (c) the published HTML report
- The full `ci.yml` file in the diff
- The CI architecture doc with the ASCII diagram rendered
- Total wall-clock time for a clean run, called out explicitly
- A short note on what would need to change to run this on a private repo (mostly: the Pages publishing step, since private GitHub Pages is restricted)

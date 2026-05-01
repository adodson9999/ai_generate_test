# Auto-Regeneration Pipeline

## Overview

This pipeline closes the loop between spec changes and test generation. When an OpenAPI fragment is edited, tests are automatically regenerated and verified.

## Sequence Diagram

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant Git as GitHub
    participant CI as GitHub Actions
    participant LLM as LLM API
    participant Tests as Test Suite

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

## Components

1. **`scripts/spec-diff.js`** — Detects which specs changed and summarizes changes
2. **`scripts/regenerate-tests.js`** — Calls LLM API with hero prompt + spec, writes test files
3. **`.github/workflows/spec-drift.yml`** — Triggers on spec changes

## Cost Guardrails

- Maximum 50k characters per fragment (prevents runaway costs)
- Token count is logged per regeneration
- Estimated cost: ~$0.05-0.15 per regeneration at Claude Sonnet rates
- At 1 spec change/day: ~$1.50-4.50/month

## Direct Test Edit Detection

If a developer edits test files directly without a corresponding spec change, the CI pipeline will flag this with a warning, encouraging spec-first development.

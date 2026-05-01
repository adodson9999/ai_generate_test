# CI Architecture

## Pipeline Diagram

```
┌──────────────────┐     ┌──────────────────┐
│  test-playwright │     │  test-cypress    │     ┌──────────────────┐
│  (parallel)      │     │  (parallel)      │     │  perf-budget     │
│                  │     │                  │     │  (main only)     │
└────────┬─────────┘     └────────┬─────────┘     └──────────────────┘
         │                        │
         └───────────┬────────────┘
                     │
              ┌──────┴──────┐
              │ parity-check│
              │  (depends)  │
              └─────────────┘
```

## Jobs

| Job | Trigger | Dependencies | Duration |
|---|---|---|---|
| `test-playwright` | PR + push | none | ~30s |
| `test-cypress` | PR + push | none | ~30s |
| `parity-check` | PR + push | playwright + cypress | ~60s |
| `perf-budget` | push to main | none | ~30s |

## Future Work

- **Report publishing** (GitHub Pages or artifact upload) - tracked as a separate feature
- **PR comment** with release-readiness grid - tracked in Feature Implementation Plan

## Private Repo Notes

For private repositories:
- GitHub Pages publishing requires GitHub Pro or an organization plan
- Replace `peaceiris/actions-gh-pages` with artifact downloads for report sharing
- Consider using Netlify or Vercel for report hosting instead

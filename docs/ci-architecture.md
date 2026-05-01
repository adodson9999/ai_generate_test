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
              └──────┬──────┘
                     │
              ┌──────┴──────┐
              │publish-report│
              │  (always)   │
              └─────────────┘
```

## Jobs

| Job | Trigger | Dependencies | Duration |
|---|---|---|---|
| `test-playwright` | PR + push | none | ~30s |
| `test-cypress` | PR + push | none | ~30s |
| `parity-check` | PR + push | playwright + cypress | ~60s |
| `perf-budget` | push to main | none | ~30s |
| `publish-report` | always | all above | ~10s |

## Private Repo Notes

For private repositories:
- GitHub Pages publishing requires GitHub Pro or an organization plan
- Replace `peaceiris/actions-gh-pages` with artifact downloads for report sharing
- Consider using Netlify or Vercel for report hosting instead

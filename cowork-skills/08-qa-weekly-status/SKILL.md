---
name: qa-weekly-status
description: Draft a weekly QA status email or Slack post from raw test data — recent test run results, open bug counts, coverage changes, and major findings — formatted for a leadership audience that has 90 seconds to read it. Use whenever the user asks for a "weekly update", "status email", "QA report", "engineering update", "Friday summary", or mentions writing a status message to leadership / engineering managers / stakeholders. Trigger especially on Thursday afternoons and Friday mornings when status report writing peaks.
---

# QA Weekly Status

Draft a weekly QA status update that a busy executive or engineering manager will actually read in under 90 seconds.

## When to use this skill

The user needs to send a weekly update. They might say:
- "Draft my Friday update"
- "Write the QA section of the engineering report"
- "Summarize this week's test results for leadership"
- "I need to send a status email by EOD"

## What you produce

A status update in one of these formats (ask which):
- **Email** — formatted with subject line, paragraphs, signature
- **Slack post** — formatted with Slack markdown (bold, bullet points, no headers)
- **JIRA / Confluence page** — formatted with proper headings and tables

Default to email if not specified.

## Template (email format)

```
Subject: QA weekly — week of <Mon date>: <one-line headline>

Top of mind
<2-3 sentences naming the most important thing leadership needs to know. NOT a recap of activity.>

This week
- <achievement or key event>
- <achievement or key event>
- <achievement or key event>

Numbers
- Tests run: <count> across <N> CI runs (<delta from last week>)
- Pass rate: <X%> (<delta from last week>)
- Open defects: <count> (P0: <n>, P1: <n>, P2+: <n>)
- Coverage: <X%> contract coverage on <api> (<delta>)

Risks and watchlist
- <risk 1 with impact and mitigation>
- <risk 2 if any>

Next week
- <committed item>
- <committed item>

<signature>
```

## How to do it

### Step 1 — Identify the headline
The headline goes in the subject line and the "Top of mind" section. It's the *one thing* the reader must know if they only read the first sentence.

Good headlines:
- "Booking API regression caught in staging; release held for fix"
- "Test suite migrated to Playwright; CI time down 40%"
- "Three P0 bugs cleared; release on track for Tuesday"

Bad headlines:
- "Weekly QA update" (not informative)
- "We did some testing" (no signal)
- "Things are going well" (no specifics)

If the user hasn't given you a headline-worthy event, ask what the most important thing this week was. Don't guess.

### Step 2 — Pull the numbers
You need:
- Test run count and pass rate this week vs last week
- Open defect count by priority
- Coverage percentage with delta
- Any notable timing or stability metric

If the user hasn't shared numbers, ask. Don't make them up. If they truly aren't tracked, drop the Numbers section entirely — better to have no number than a fake one.

### Step 3 — Write "This week"
3-4 bullets. Each bullet is one observable accomplishment, not a list of activities. Frame as outcomes, not work-done.

Bad: "Worked on Cypress migration"
Good: "Migrated 14 Cypress specs to Playwright; suite is now single-runner with 40% faster CI."

### Step 4 — Identify risks
A risk is a *future* problem that hasn't happened yet but might. Each risk gets:
- One sentence of what could happen
- Impact if it does
- Current mitigation or planned mitigation

If there are no risks worth naming, skip the section. Don't manufacture risks to fill space.

### Step 5 — Write "Next week"
2-3 committed items. Use language that signals commitment, not aspiration.

Bad: "Continue working on coverage improvements"
Good: "Land negative-path matrix for booking endpoints (PR open, expected merge Wednesday)"

### Step 6 — Write the subject line last
The subject line is a compressed version of the headline. It must:
- Fit in 80 characters
- Lead with "QA weekly"
- Include a concrete outcome or risk, not a generic word like "update"

### Step 7 — Add a signature if email
Match the user's existing signature style if visible from past emails. If unknown, leave a placeholder `<signature>`.

## Tone and length

- **Length**: 200-350 words. Anything longer won't be read.
- **Tone**: confident, factual, direct. No hedging ("we tried to", "we hope to"). State outcomes.
- **Pronouns**: "we" for team work, "I" for personal commitments, never "the team" (impersonal)
- **Avoid**: jargon ("synergy", "leverage", "stakeholder alignment"), AI tells ("furthermore", "comprehensive")

## What goes where

| Information | Where it goes |
|-------------|---------------|
| The biggest event this week | Subject + Top of mind |
| Activities | This week (as outcomes, not tasks) |
| Metrics | Numbers section |
| Future concerns | Risks |
| Commitments | Next week |
| Detailed findings | Linked, not inline |

## Quality bar

- Reader can extract the headline from the subject line alone
- Reader can extract the 3 most important things from the first 5 lines
- Every bullet under "This week" describes an outcome, not an activity
- Every number is accompanied by a delta vs last week (or noted "first week tracking")
- "Next week" items are concrete enough to verify next Friday

## What not to do

- Don't pad with activity summaries. Activities aren't outcomes.
- Don't bury bad news. If a release is at risk, that's the headline.
- Don't include items the user hasn't shared. If you don't know what shipped, ask.
- Don't write a paragraph where a bullet would do.
- Don't use the word "leverage" unless you're describing a literal lever.

## Example

**User input:**
> "Need my weekly update by 4pm. We got the Playwright + Cypress suite to parity, found a real bug in the booking auth flow (got a P1 ticket on it), CI runs are now 8 minutes down from 14. Three P2 flakes added to quarantine. Next week I want to ship the perf budget tests."

**Your output:**

```
Subject: QA weekly — wk of 4/27: Playwright/Cypress parity shipped, auth bug found and ticketed

Top of mind
Cross-runner parity is live — Playwright and Cypress now run from the same source of truth, and CI is at 8 min (down from 14). The auth-flow bug we caught this week (BOOK-1142) is a P1 — release notes will need a callout if it doesn't make the next patch.

This week
- Achieved Playwright/Cypress test parity; meta-check now runs on every PR
- Cut CI time from 14 min to 8 min via runner caching and parallelism
- Surfaced a real auth-flow bug in booking lookup (BOOK-1142, P1)
- Quarantined 3 P2 flakes pending root-cause investigation

Numbers
- Tests run: 1,428 across 47 CI runs (+18% vs last week)
- Pass rate: 98.7% (+1.2 pts; quarantines explain the lift)
- Open defects: 1 P0, 4 P1, 11 P2
- Coverage: 73% contract coverage on booking API (+8 pts)

Risks and watchlist
- BOOK-1142 needs a fix this sprint — auth bug affects ~5% of lookups. Mitigation: dev team has a candidate fix in review.

Next week
- Land per-endpoint perf budget tests (Plan 05); first trend chart by Friday
- Drive coverage to 85% on booking API by closing the 4 P1 untested paths

<signature>
```

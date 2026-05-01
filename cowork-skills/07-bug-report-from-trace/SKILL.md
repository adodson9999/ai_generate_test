---
name: bug-report-from-trace
description: Convert a Playwright trace, Cypress video/screenshots, browser DevTools network log, or raw test failure output into a polished, JIRA-ready bug report with reproduction steps, expected vs actual behavior, environment details, severity, and a one-line title that gets attention. Use whenever the user wants to file a bug, write up a defect, document a failure for the dev team, or mentions JIRA, Linear, GitHub Issues, bug ticket, defect report, or trace analysis. Trigger even when the user just shares a stack trace and asks "how should I file this".
---

# Bug Report from Trace

Take raw failure data and produce a bug report a developer can act on without asking follow-up questions.

## When to use this skill

The user has a test that failed (or a manual reproduction) and wants to file it. Their input might be:
- A Playwright `trace.zip`
- A Cypress video file path
- A pasted stack trace
- A description of what went wrong
- A screenshot

## What you produce

A bug report file `bug-<slug>.md` (or directly into the user's bug tracker via copy-paste) with this exact structure:

```markdown
# <One-line title with severity prefix>

**Severity:** <Critical | High | Medium | Low>
**Component:** <area of the system>
**Reporter:** <user>
**Date:** <YYYY-MM-DD>
**Environment:** <browser, OS, app version, API version>

## Summary
<2-3 sentence description of the bug — what was the user doing, what happened>

## Steps to reproduce
1. <action>
2. <action>
3. <action>

## Expected behavior
<what should have happened>

## Actual behavior
<what actually happened, with concrete details: status codes, error messages, console output>

## Evidence
- Trace: `<path or link>`
- Screenshot: `<path or link>`
- Console errors: <pasted, redacted>
- Network requests of interest: <pasted, redacted>

## Suspected root cause
<if the trace gives clear signal — otherwise: "Unknown; trace shows X, which suggests Y">

## Suggested next step for the dev
<one specific question or check that would advance the investigation>

## Related
<links to related bugs, PRs, or docs>
```

## How to do it

### Step 1 — Open the trace (if applicable)
For Playwright: `npx playwright show-trace <path>` opens the trace viewer in the user's browser. They'll need to do this and tell you what they see, or share screenshots.

For Cypress: the video lives under `cypress/videos/`. Screenshots under `cypress/screenshots/`. Open them.

For a stack trace: parse it. Identify the exception type, the assertion that failed, and the source file + line.

### Step 2 — Extract the essentials
You need:
- **What action was being performed** (last UI/API action before failure)
- **What was expected** (assertion or implicit contract)
- **What actually happened** (error message, status code, response body)
- **Where in the trace this happened** (timestamp or step number)
- **Environment** (browser, OS, framework version, app version if known)

If any are missing from the input, ask.

### Step 3 — Write the title
The title is the most-read part of any bug. It must:
- Lead with the symptom, not the cause ("500 returned on booking lookup" not "Cache invalidation issue")
- Be specific enough to be unique ("500 on GET /booking/:id when id is alphanumeric" not "API returns 500")
- Fit on one line in JIRA (~80 chars)
- Imply severity through specificity, not adjectives ("PII exposed in error response" beats "Critical security bug")

### Step 4 — Set severity
- **Critical**: data loss, security exposure, complete outage of a core feature, no workaround
- **High**: core feature broken with workaround, or non-core feature broken with no workaround
- **Medium**: bug in a less-used path, OR an annoying-but-not-blocking issue in a core path
- **Low**: cosmetic, edge case, or only happens in unusual environments

### Step 5 — Write Steps to Reproduce
The standard a dev shouldn't have to ask follow-ups. Each step is one observable action. Include the exact data that triggered the bug.

Bad: "Try to look up a booking with a weird ID."
Good:
1. Authenticate as `admin / password123`
2. Send `GET /booking/abc-123` with the auth cookie
3. Observe response

### Step 6 — Pull network and console evidence
Trim. Don't paste the full DevTools log. Pick:
- The failing request and its full response (headers + body)
- Console errors that appeared in the same time window
- Any preceding network failures that might be a clue

Redact any PII, credentials, or tokens that appear in the data. Replace with `<redacted>`.

### Step 7 — Suggest a root cause (if you can)
Don't speculate without evidence. If the trace shows a 500 response with stack trace text leaking, name that. If you can't tell, say so explicitly: "Root cause unclear from trace. The 500 has no body. Suggest enabling debug logging on the booking service and rerunning."

### Step 8 — One specific next step
End with one concrete question or check the dev should do next. This is the highest-leverage section of the report — it converts "here's a problem" into "here's a problem and here's the next move."

Examples:
- "Check whether `bookingid` validation in `BookingController.lookup` rejects non-numeric IDs before hitting the cache."
- "Confirm the rate limit was hit by checking the X-RateLimit headers on the failing request."
- "Reproduce locally with `BOOKING_CACHE_TTL=1` to see if cache invalidation is the trigger."

## Severity calibration

When in doubt, ask the user. Severity drives prioritization, and getting it wrong by one level wastes either everyone's time (too high) or the user's day (too low). A short "I'm planning to mark this High because <reason>; sound right?" is fine.

## Quality bar

- A dev reading the report has zero follow-up questions about reproduction
- The title fits on one line and tells you the symptom
- Severity is justified by specifics, not adjectives
- Evidence is trimmed to the minimum needed; no log dumps
- The suggested next step is one specific, actionable check

## What not to do

- Don't reproduce the entire trace as evidence. Trim ruthlessly.
- Don't speculate about root causes without evidence from the trace.
- Don't include credentials, tokens, or PII in the report. Redact.
- Don't write "doesn't work" anywhere. Always describe the specific failure mode.
- Don't include "this is critical for the business" unless it's literally critical for the business. Devs tune that out fast.

## Example

**User input:**
> "[uploaded trace.zip] Playwright test failed on the booking lookup, status was 500 instead of 200."

**Your output:**
A `bug-booking-500-on-alphanumeric-id.md` file with title "500 returned by GET /booking/:id when id contains non-numeric chars", severity High, reproduction in 3 steps, the failing request body and response headers redacted appropriately, suggested next step naming the specific controller method to check.

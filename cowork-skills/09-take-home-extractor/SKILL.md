---
name: take-home-extractor
description: Parse a coding take-home assignment, technical interview prompt, or live coding challenge brief — from PDF, email, image, or pasted text — and produce a structured task list, requirements checklist, ambiguity questions, and time budget. Use whenever the user shares a take-home assignment, says they're starting an interview, mentions QA / SDET / engineering interviews, has a coding challenge to do, or pastes in a job description that includes a homework component. Trigger especially when the user is preparing for an interview or has just received an assignment.
---

# Take-Home Assessment Extractor

Convert an interview take-home prompt into a structured plan: explicit requirements, implicit requirements, ambiguity questions, time budget, and the order of operations to maximize signal in the available time.

## When to use this skill

The user has received a coding/QA assessment and needs to:
- Understand what's actually being asked
- Identify what's likely to differentiate a strong submission from a passing one
- Plan their time
- Decide what questions to ask the recruiter before starting

## What you produce

A planning file `assessment-<company>-<role>.md` with this structure:

```markdown
# Assessment Plan — <company> / <role>

## Source
<paste of the assignment OR link, plus any constraints the recruiter shared>

## Time budget
- Stated: <e.g., "complete within 5 days, expect 4-6 hours of work">
- Effective working time: <user's realistic available time>
- Allocation:
  - Setup: <hh:mm>
  - Core requirements: <hh:mm>
  - Stretch / differentiation: <hh:mm>
  - Polish / README / submission: <hh:mm>

## Explicit requirements (must do)
1. <requirement, with verbatim quote from assignment>
2. ...

## Implicit requirements (probably must do)
1. <inferred requirement, with reasoning>
2. ...

## Differentiation opportunities (where to spend extra time)
1. <opportunity, with reasoning about why it signals>
2. ...

## Ambiguities to resolve before starting
- [ ] <question to send to recruiter>
- [ ] <question to send to recruiter>

## Order of operations
1. <first action>
2. <second action>
...

## Submission checklist
- [ ] <item>
- [ ] <item>
```

## How to do it

### Step 1 — Read the source carefully
If it's a PDF or image, extract the text fully. If it's pasted, scan for:
- Numbered/bulleted requirements (these are explicit)
- Phrases like "we'd like to see", "ideally", "bonus" (these are implicit/differentiation)
- Constraints: time limits, language requirements, framework choices
- Submission instructions (how to send back, what format, deadline)
- Evaluation criteria if listed

### Step 2 — Categorize requirements

**Explicit**: literally listed in the assignment. Quote them. Do not paraphrase.
**Implicit**: not listed but clearly expected (e.g., "the assignment says 'write tests' — implicit: tests must actually run; README must explain how to run them").
**Differentiation**: not required but high-signal. Examples:
- Cleanup commits / clean git history
- Thoughtful README explaining tradeoffs
- A `decisions.md` or ADR-style file documenting choices
- CI configuration even if not asked
- Type hints / strict mode
- Tests for the test code (yes, really — this differentiates SDETs)

### Step 3 — Identify ambiguities
Look for places where the assignment is unclear or under-specified. Common patterns:
- "Write a few tests" — how many?
- "Cover the API" — fully? Just happy path?
- "Use any framework" — does the company have a preference?
- "Submit when you're ready" — is there a deadline?

These become questions to send to the recruiter *before* starting. The cost of asking is one email; the cost of guessing wrong is several hours.

### Step 4 — Plan the time
Default split for a 4-6 hour assessment:
- 30 min: read, plan, ask questions, set up
- 2-3 hours: core requirements
- 1-1.5 hours: differentiation
- 30-60 min: polish, README, submit

For a 1-2 hour live coding: collapse to 5/60/15/10.

If the user's available time is less than the stated time, flag it and recommend descoping differentiation rather than skimping core requirements.

### Step 5 — Define the order of operations
This is where craft beats raw effort. Recommend:
1. Get the simplest possible thing running first (a hello-world version that satisfies one requirement end to end)
2. Add requirements one at a time, committing after each
3. Don't write the README last — write it first as a sketch, fill in as you go
4. Reserve the last hour for polish, not for "one more feature"

### Step 6 — Build the submission checklist
Include both content and presentation items:
- All explicit requirements implemented
- README with setup, run, test, and design notes sections
- Tests pass on a clean clone (`git clean -fdx && npm install && npm test`)
- No commented-out code or `console.log`s
- Commit history is readable
- Submission method matches what was asked

## Calibrating signal vs. effort

The user has a finite budget. Spend it where it shows the most:

**High signal per hour:**
- A clear, well-organized README
- Showing tradeoffs explicitly (a `decisions.md` file is a green flag)
- Tests for edge cases the assignment didn't ask about
- A working CI pipeline (even just one GitHub Action)

**Low signal per hour:**
- Implementing every "bonus" item if the core is incomplete
- Visual polish on UIs the assessment didn't ask for
- Adding more tests when the existing ones aren't well-named
- Adding frameworks the assignment doesn't require ("I added React Query just because")

When in doubt: depth on what's asked > breadth on what's not.

## SDET-specific assessments

If the role is SDET / QA Automation / Test Engineer:
- The single highest-signal differentiation is **a deterministic, runnable suite**. Many submissions have flaky setup; one that "just works" stands out.
- A `prompts/` folder showing how AI was used (with the actual prompts, not just the output) signals modern practice.
- Cross-framework coverage (e.g., Playwright AND Cypress) signals architectural thinking.
- Performance budgets and schema validation are differentiators rare in submissions.
- A clear separation between specs (what to test) and tests (the implementation) signals senior thinking.

## Quality bar

- The plan distinguishes *must do* from *should do* from *might do*
- Time budget adds up to the stated time
- Ambiguities are listed as actionable questions, not vague concerns
- The order of operations names a path to a working submission even if the user runs out of time at any point

## What not to do

- Don't promise the user a winning submission. Take-homes have selection effects you don't see.
- Don't recommend overengineering. A clean, complete, well-explained simple solution beats a sprawling complicated one almost every time.
- Don't underestimate setup. Especially for QA roles — tooling setup eats hours.
- Don't ask the user to clarify the assignment to *you* — list ambiguities for *them* to ask the recruiter.

## Example

**User input:**
> "Got this take-home from a fintech for an SDET role: 'Write end-to-end tests for our public booking API. You have 5 days. Use whatever framework you like. Bonus points for CI integration.' Help me plan."

**Your output:**
A plan file naming the explicit requirement (E2E tests for the booking API), implicit requirements (tests must run cleanly, README must explain framework choice and tradeoffs), differentiation opportunities (cross-runner Playwright+Cypress, schema validation, performance budgets, a `prompts/` folder if AI is used), three ambiguities to email the recruiter (which endpoints? expected coverage threshold? must run on a specific Node version?), a 4-hour time budget broken into setup/core/diff/polish, and an order of operations starting with a one-test "hello-world" Playwright suite green by hour one.

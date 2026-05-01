---
name: antigravity-plan-author
description: Draft an implementation plan in the exact format Google Antigravity's planning agent expects, so a user can paste it into a new agent and have it execute autonomously. Plans include goal, why-it-matters, inputs, deliverables, acceptance criteria, constraints, suggested approach, verification commands, and walkthrough requirements. Use whenever the user mentions Antigravity, agentic IDE, multi-agent development, or asks for an "implementation plan", "agent plan", "task spec", or "ticket-grade requirements" for a coding task. This is the meta-skill for spawning more work.
---

# Antigravity Plan Author

Draft an implementation plan that a Google Antigravity agent can consume in Plan Mode, generate a Plan Artifact from, and execute autonomously across editor + terminal + browser subagent.

## When to use this skill

The user wants to delegate a coding task to an autonomous agent and wants the task spec'd properly first. Triggers:
- "Write an Antigravity plan for X"
- "Draft a task spec for the agent to add Y"
- "What would I tell the agent to do for Z"
- "Spec out implementing W"

## What you produce

A single Markdown file `<NN>-<plan-slug>.md` containing exactly these sections, in this order:

```markdown
# Plan <NN> — <Title>

## Goal
<one sentence>

## Why this matters
<two-three sentences of context for the agent's planning>

## Inputs
<files the agent must read before starting>

## Deliverables
<exact files to create or modify>

## Acceptance criteria
<bulleted list of verifiable conditions>

## Constraints
<what the agent must not do>

## Suggested approach
<numbered step-by-step; the agent may deviate>

## Verification commands
<exact commands the agent must run>

## Walkthrough requirements
<what the final Antigravity artifact must contain>
```

## How to do each section

### Goal
One sentence. Active voice. Names the thing being built. Bad: "Improve the test suite." Good: "Add an end-to-end auth flow test suite for `POST /auth` with reusable token fixtures consumed by all protected-endpoint tests."

### Why this matters
Two or three sentences. Tells the agent what the *value* is, so it can make judgment calls when the spec is ambiguous. Good agents need motivation, not just instructions. Bad: "Auth tests are needed." Good: "The current repo only exercises read paths. Without auth coverage, half the API surface is untested. This plan closes the gap and produces a fixture downstream plans depend on."

### Inputs
Concrete file paths the agent reads before starting. Be specific. Group them: spec files, existing code to extend, prompt templates.

### Deliverables
A literal list of files to create and files to modify. Use a `Create:` and `Modify:` split when both apply. Each file gets a one-line description of what it contains.

### Acceptance criteria
Verifiable conditions. Every item must be checkable — by running a command, opening a file, or confirming a behavior. Avoid soft criteria like "code is clean" — replace with concrete checks ("`eslint .` exits 0").

### Constraints
What the agent must NOT do. This is where you save the agent from common mistakes:
- "Do not commit credentials"
- "Do not invent endpoints — confirm via the live API first"
- "Do not write each negative case by hand — generate them"

### Suggested approach
Numbered steps the agent can follow, but framed as *suggestions*. The agent may reorder or replace steps if it has a better path. Each step is one observable action ("write helper X and unit-test it" not "do testing properly").

### Verification commands
The exact terminal commands the agent runs at the end. These prove the plan worked. Format as a code block. The agent must run all of them and include the output in the Walkthrough.

### Walkthrough requirements
What the agent's final Walkthrough artifact must include. Antigravity Walkthroughs are the audit trail — they're what the human reviews. Common items:
- File diff summary
- Terminal output of verification commands
- Screenshots from the browser subagent
- Notes on anything surprising the agent encountered

## Quality bar

- Plan is 80-200 lines. Under 80 = under-specified, agent will ask too many questions. Over 200 = over-specified, you're doing the work for the agent.
- Every Acceptance Criterion is verifiable.
- Constraints are specific enough that an agent reading them can avoid them — not just generic warnings.
- Verification commands actually exist and would actually run in the agent's environment.

## Antigravity-specific knowledge

- Antigravity agents have access to: file editor, terminal, browser subagent, code execution, and parallel sub-agents. Take advantage of all of them in your plans.
- The browser subagent is genuinely useful — use it for confirming live API behavior, taking screenshots, and validating UIs. Plans that name "use the browser subagent to do X" tend to produce better Walkthroughs.
- Plan Mode generates a Plan Artifact before acting. Your plan is the input to that. The agent will refine your plan into its own Plan Artifact, then execute. This is why suggested-approach is "suggested" — the agent owns the actual plan.
- Walkthroughs are the deliverable to humans. Plans that explicitly demand artifacts (screenshots, diffs, command output) get artifacts. Plans that don't, don't.
- Manager view supports parallel agents. If the plan can be split into independent sub-plans, mention this — the user can dispatch parallel agents.

## What not to do

- Don't write the code. The plan describes what to build, not how to build it line by line.
- Don't reference files that don't exist. If a plan depends on output from another plan, name it explicitly: "Outputs from Plan 03".
- Don't skip Constraints. Empty Constraints sections produce agents that take liberties.
- Don't make Acceptance Criteria subjective. "Tests pass" is fine; "tests are well-organized" is not.

## Example invocation

**User input:**
> "I need a plan for adding visual regression tests with Percy or Chromatic to my Next.js dashboard repo."

**Your output:**
A ~150-line plan file `01-visual-regression.md` with Goal naming Percy or Chromatic (ask which), Inputs naming the existing test config files, Deliverables listing the new config + at least 5 baseline screenshots + a CI step, Acceptance Criteria including "running the suite and changing one CSS color produces a Percy/Chromatic diff", Constraints including "do not commit baseline images to the repo — use Percy's hosted storage", and Verification Commands including the Percy/Chromatic CLI invocation.

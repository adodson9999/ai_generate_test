---
name: gherkin-feature-author
description: Draft Gherkin feature files (Given/When/Then scenarios) from a one-line description, a user story, a bug report, or a half-formed acceptance criterion. Produces clean, runnable BDD scenarios with proper tagging, scenario outlines for parameterized cases, and consistent step phrasing. Use whenever the user mentions Gherkin, Cucumber, BDD, scenarios, acceptance criteria, or asks for "given/when/then", as well as when they describe a behavior they want documented as a testable spec.
---

# Gherkin Feature Author

Turn an informal description into a clean, runnable Gherkin feature file with one or more scenarios — the kind of file a Cucumber/Playwright BDD/Behave runner can consume directly.

## When to use this skill

The user has an idea for a behavior that needs a feature file:
- "Write me a Gherkin scenario for password reset"
- "Document the booking cancellation flow as BDD"
- "Convert this user story into a feature file"
- "I have three acceptance criteria — turn them into Gherkin"

## What you produce

A single `.feature` file with:
- A `Feature:` header naming the resource and capability
- An optional `Background:` block if multiple scenarios share setup
- One or more `Scenario:` blocks, or `Scenario Outline:` blocks with `Examples:` tables for parameterized cases
- Tags (`@smoke`, `@auth`, `@slow`) when they help organize runs
- Step phrasing that's consistent within the file

## How to do it

### Step 1 — Identify the actor, the action, and the outcome
Every scenario boils down to:
- **Given** a precondition (what's true before the test starts)
- **When** an action (what the actor does)
- **Then** an outcome (what the system is expected to do)

Extract these from the user's input. If any is missing, ask one short question.

### Step 2 — Decide on scenario shape
- **Single scenario** if there's one clear path
- **Multiple scenarios** if there are distinct outcomes (happy + error)
- **Scenario Outline** if the variation is *only* in input values, not behavior (e.g., "test with totalprice = 0, 1, 1000, 99999")

### Step 3 — Write the file
Use this template:

```gherkin
@<tag-by-feature> @<tag-by-priority>
Feature: <Capability under test>
  As a <role>
  I want to <action>
  So that <benefit>

  Background:
    Given <shared setup, if any>

  Scenario: <Outcome name in active voice>
    Given <precondition>
    When <action>
    Then <observable outcome>
    And <secondary assertion>

  Scenario Outline: <Outcome family name>
    Given <precondition>
    When <action with <variable>>
    Then <expected outcome with <expected_field>>

    Examples:
      | variable | expected_field |
      | value1   | result1        |
      | value2   | result2        |
```

### Step 4 — Sanity-check the steps
Before saving, audit each step:
- Length under 12 words
- Active voice ("the API returns 200" not "200 is returned")
- One assertion per `Then` — additional assertions go on `And` lines
- No implementation details ("clicks the green button" is a smell — Gherkin is the *what*, not the *how*)

### Step 5 — Save and report
Save as `<feature-slug>.feature`. Tell the user:
- The feature name and tag list
- Scenario count
- Any clarifying questions you had to skip because the user didn't answer (mark these in a comment in the file)

## Step phrasing conventions

Use these patterns consistently within a file:
- **Authentication**: `Given the user is authenticated as <role>` (not "logged in", not "has a token")
- **API state**: `Given a booking with id <X> exists` (not "there is a booking", not "booking <X> is in the database")
- **Action**: `When the user requests GET /booking/<id>` for API tests, `When the user clicks <element>` for UI tests
- **Status assertion**: `Then the response status is <code>` (not "the API returns <code>")
- **Body assertion**: `Then the response body contains <field> with value <value>`
- **Latency**: `Then the response is received within <ms>ms`

Pick one set of patterns and stick to it within a file. Across files, aim for consistency but it's not required.

## Tags to use

- `@smoke` — runs on every PR
- `@regression` — runs nightly
- `@slow` — opt-in via `--tags @slow`
- `@auth` — requires authentication
- `@api` / `@ui` — distinguishes API tests from UI tests
- `@<resource>` — e.g., `@booking`, `@auth-flow`

## Quality bar

- File parses with `@cucumber/gherkin` or `behave` parser without errors
- Every scenario has at least one `Given`, one `When`, one `Then`
- No scenario is longer than 8 steps (if it is, split it)
- `Scenario Outline` examples table has 2-6 rows (more becomes unreadable; less doesn't justify the outline)
- Tags consistently applied — if `@auth` appears once it appears on every relevant scenario

## What not to do

- Don't use `But` unless the contrast genuinely improves clarity (rarely does)
- Don't duplicate `Background` setup in individual scenarios
- Don't write tests as Gherkin — Gherkin is the spec, tests are the implementation. Steps describe behavior, not assertions about variables
- Don't include code or selectors. `When the user clicks #login-btn` is a smell — `When the user submits the login form` is right

## Example

**User input:**
> "I want a feature file for booking lookup. Happy path returns 200 and the booking. If ID doesn't exist, returns 404. Should respond in under 1 second either way."

**Your output:**
```gherkin
@booking @smoke
Feature: Booking lookup
  As a customer service representative
  I want to look up a booking by its ID
  So that I can answer customer inquiries

  Background:
    Given the booking API is reachable

  Scenario: Existing booking is returned
    Given a booking with id <id> exists
    When the user requests GET /booking/<id>
    Then the response status is 200
    And the response body contains the booking matching id <id>
    And the response is received within 1000ms

  Scenario: Non-existent booking returns 404
    Given no booking with id 99999999 exists
    When the user requests GET /booking/99999999
    Then the response status is 404
    And the response is received within 1000ms
```

Report: "Drafted `booking-lookup.feature` with 2 scenarios, tagged `@booking @smoke`. The id `<id>` placeholder in the first scenario is a runtime-discovered value — the test generator will resolve it."

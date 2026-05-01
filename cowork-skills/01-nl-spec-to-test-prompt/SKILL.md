---
name: nl-spec-to-test-prompt
description: Convert a rough natural-language description of an API endpoint or feature into a polished prompt that an LLM can use to generate Playwright and Cypress tests. Use this whenever the user has an idea for a feature, a half-written user story, a Slack message describing a behavior, or any informal description of what an API should do, and they want to turn it into structured test-generation input. Trigger on phrases like "I want to test...", "we need a test for...", "here's the rough behavior...", "draft a test prompt", or whenever the user mentions API testing, test generation, or Playwright/Cypress alongside an informal spec.
---

# NL Spec → Test Prompt

Turn an informal description into the structured input the hero test-generation prompt expects: a Gherkin feature file, an OpenAPI fragment, and a clean prompt header with all four placeholders filled.

## When to use this skill

The user has a description of a behavior they want tested. It might be:
- A bug report ("when I send a booking with totalprice as a string, the API should return 400 not 200")
- A user story ("as a customer service rep, I need to look up a booking by ID and see its full details")
- A Slack thread or email pasted in
- A half-formed feature request

The user's goal is to feed this into a test-generation prompt. Your job is to turn the informal input into the three structured artifacts the prompt needs.

## What you produce

For every invocation, produce three things:

1. **`<name>.feature`** — a Gherkin file with one or more scenarios
2. **`<name>-openapi.yaml`** — an OpenAPI 3 fragment for the relevant endpoint(s)
3. **`<name>-prompt.md`** — the hero prompt with placeholders filled, ready to paste into Claude/GPT/Gemini

Default file naming: derive `<name>` from the resource being tested (e.g., `booking-lookup`, `auth-flow`, `cancel-order`).

## How to do it

### Step 1 — Extract the verb, the resource, and the outcome
From the user's input, find:
- HTTP method (GET, POST, PUT, PATCH, DELETE) — infer if not stated
- Resource path (`/booking/:id`, `/orders`, `/users/me`)
- Success outcome ("returns the booking", "creates and returns 201")
- Error outcomes ("returns 400 if totalprice is invalid")
- Auth requirement (yes/no)
- Latency expectation (if any)

If any of these are missing, ask the user — don't guess. One short clarifying question per missing piece, no more than three total.

### Step 2 — Draft the Gherkin
One scenario per outcome. Use this template:

```gherkin
Feature: <resource> <action>
  As a <role>
  I want to <action>
  So that <benefit>

  Scenario: <happy path or error case>
    Given <precondition>
    When <action>
    Then <expected response status>
    And <expected response body assertion>
    And <non-functional assertion if any>
```

Keep each step under 12 words. If a step gets longer, split it.

### Step 3 — Draft the OpenAPI fragment
Minimum required fields for each operation:
- `operationId`
- `summary`
- `parameters` (path, query, header) with types
- `requestBody` schema (if applicable) with required fields and constraints
- `responses` for every status code mentioned in the Gherkin, each with a schema

Use `$ref` to a `components.schemas` section for any reusable type. Do not inline the same schema twice.

### Step 4 — Fill the prompt template
Use this template (it's the hero prompt with placeholders bracketed):

```
<paste the hero prompt body here, with the four placeholders replaced inline:
- the Gherkin file content
- the OpenAPI fragment content
- the base URL (ask the user if not given)
- the framework (default to "playwright" unless user says otherwise)>
```

### Step 5 — Save and present
Save the three files. Then return:
- A one-paragraph summary of what was produced
- The three filenames
- A copy-pasteable command line for running the prompt against Claude (e.g., `cat <name>-prompt.md | pbcopy`)

## Quality bar

A good output meets all of these:
- Gherkin scenarios are specific enough that a tester reading them knows what to check, not just what to do.
- OpenAPI fragment passes a YAML lint and an OpenAPI validator (use `swagger-cli validate` if available).
- Prompt is fully filled in — no `<paste here>` placeholders left.
- File names are consistent with each other and with the resource they describe.

## What not to do

- Don't invent schemas. If the user hasn't told you what fields a Booking has, ask.
- Don't add scenarios the user didn't ask for. Negative path coverage is the hero prompt's job, not yours — your job is to capture what the user described, accurately.
- Don't write the tests. That's a separate step, run by the prompt you're producing.

## Example

**User input:**
> "I need a test for when someone looks up a booking by ID. If it exists, return 200 and the booking. If not, return 404. Should respond in under 1 second."

**Your output:**
- `booking-lookup.feature` with 2 scenarios (200 happy path, 404 not found, both with latency assertion)
- `booking-lookup-openapi.yaml` with one operation (`GET /booking/{id}`) and a `Booking` schema
- `booking-lookup-prompt.md` with all four placeholders filled, framework set to `playwright`
- Summary: "Drafted Gherkin (2 scenarios) and OpenAPI fragment for GET /booking/{id}. Prompt is ready to run — paste it into Claude with `Framework: playwright` for the Playwright suite, change to `cypress` and rerun for Cypress."

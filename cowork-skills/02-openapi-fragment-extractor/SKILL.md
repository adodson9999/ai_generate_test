---
name: openapi-fragment-extractor
description: Extract a focused, self-contained OpenAPI 3 fragment for one or a few endpoints from a large API document, so the fragment can be fed into a test-generation prompt without overwhelming the context window. Use whenever the user has a giant OpenAPI/Swagger file and wants to test only specific endpoints, or whenever they need to break up a 5000-line spec into testable chunks. Trigger on phrases like "extract the booking endpoints", "pull out just /users from this spec", "give me a fragment for...", "trim this OpenAPI down to...", or any time the user mentions OpenAPI, Swagger, or API spec alongside a request to focus on specific endpoints.
---

# OpenAPI Fragment Extractor

Take a large OpenAPI document and produce a self-contained, valid OpenAPI 3 fragment containing only the endpoints the user cares about — with all referenced schemas, parameters, and security definitions resolved or inlined.

## When to use this skill

The user has:
- A 1000-line `swagger.yaml` and wants to test five endpoints out of fifty
- A multi-tag API doc and wants only the `/booking` tag
- An OpenAPI doc with deep `$ref` chains they want flattened for an LLM prompt

The hero test-generation prompt works best with a focused fragment of 100-300 lines. Bigger fragments waste tokens and confuse the model. Your job is to produce that focused fragment without losing fidelity.

## What you produce

A single file `<name>-openapi.yaml` containing:
- `openapi: 3.0.x` header copied from source
- `info` block (can be minimal — `title` and `version` are enough)
- `servers` block if present in source
- `paths` containing only the requested endpoints, complete with all operations
- `components.schemas` containing only the schemas referenced (transitively) by those endpoints
- `components.securitySchemes` if any of the endpoints require auth
- Nothing else

## How to do it

### Step 1 — Identify the endpoints
The user will tell you which endpoints to extract. They might use:
- Path patterns (`/booking/*`, `/users/me`)
- Tags (`tag:booking`)
- Operation IDs (`getBookingById, createBooking`)
- Free description ("the auth endpoints")

If the user gives a free description, find the matching endpoints in the source and confirm with them before extracting: "I'm planning to extract `/auth` (POST) and `/users/me` (GET, PUT). Sound right?"

### Step 2 — Walk the references
For each endpoint, collect:
- The full operation block (all methods)
- Path-level parameters
- Every `$ref` it contains, recursively, until no new refs are added
- Any security scheme it references via `security:`

Common ref locations to check:
- `paths.<path>.<method>.parameters[].$ref`
- `paths.<path>.<method>.requestBody.content.<mime>.schema.$ref`
- `paths.<path>.<method>.responses.<code>.content.<mime>.schema.$ref`
- Inside schemas: `properties.<field>.$ref`, `items.$ref`, `allOf[].$ref`, `oneOf[].$ref`, `additionalProperties.$ref`

### Step 3 — Emit the fragment
Build the output document with only the collected pieces. Keep refs intact (don't inline them) — refs are clearer in the output than fully inlined schemas, and the hero prompt handles `$ref` correctly.

Validate the result:
- Run `swagger-cli validate` if available
- If not available, at minimum: parse with a YAML parser, confirm no dangling `$ref` (every `#/components/schemas/X` resolves to an actual schema in the fragment)

### Step 4 — Report
Tell the user:
- How many endpoints, schemas, and security schemes the fragment contains
- The output file path
- Token count estimate (rough: chars / 4)
- Any refs that pointed outside `components` (these are unusual; surface them)

## Edge cases and how to handle them

**Source has external refs (`$ref: 'common-schemas.yaml#/...')**
Resolve and inline these — they won't be available in the fragment context.

**Source uses `allOf` to compose schemas**
Keep the `allOf` structure. Don't try to merge — the LLM handles `allOf` fine and merging loses semantic information.

**Source has multiple servers (prod, staging, dev)**
Keep all of them. The hero prompt asks for a base URL separately; the OpenAPI fragment's servers block is informational.

**Source has authentication via a flow that requires multiple endpoints (e.g., OAuth)**
If the user asks for a protected endpoint but not the auth endpoint, ask whether to include the auth endpoint too. Most of the time, yes.

**Schemas reference deprecated fields**
Keep them. Deprecation is part of the contract; tests should cover deprecated fields until they're actually removed.

## Quality bar

- The output validates as OpenAPI 3.x.
- No dangling refs.
- Total size is between 50 and 500 lines (smaller means the user probably wanted more endpoints; larger means you can probably split further).
- Schemas appear in `components.schemas` exactly once each.

## What not to do

- Don't inline `$ref` chains. Keep refs.
- Don't add fields the source didn't have ("for clarity"). The fragment must be a faithful subset.
- Don't reorder operations — keep them in source order.
- Don't strip descriptions, examples, or `x-` extensions. They're useful context for the test generator.

## Example

**User input:**
> "Extract just the booking lookup endpoint from the Restful-Booker swagger."

**Your output:**
- `booking-lookup-openapi.yaml` with `paths./booking/{id}.get`, the `Booking` schema, and the standard `200`/`404` responses
- Report: "Extracted 1 endpoint, 1 schema, 0 security schemes. Output file is 47 lines, ~600 tokens. No external refs found."

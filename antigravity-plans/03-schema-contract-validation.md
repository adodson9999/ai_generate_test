# Plan 03 — Schema Contract Validation

## Goal
Wire up runtime schema validation so every response body in the test suite is checked against the OpenAPI schema using ajv, not hand-written assertions.

## Why this matters
Hand-written field assertions drift from the spec the moment the spec changes. Schema validation makes the OpenAPI document the source of truth — when the spec changes, every test automatically validates against the new shape, and tests fail if the API response doesn't match. This is contract testing baked into the integration tests at zero extra cost.

## Inputs
- `specs/booking-openapi.yaml` and any other OpenAPI files added by previous plans
- Existing test files in `tests/` and `cypress/e2e/`
- `prompts/api-test-gen.md` — note its output contract already requires a "contract test" per endpoint

## Deliverables
Create:
- `tests/helpers/schema-validator.ts` — Playwright helper that loads an OpenAPI file, compiles a schema for a named operation+status, returns a function `(body) => { valid: boolean; errors: string[] }`
- `cypress/support/schemaValidator.js` — Cypress equivalent registered as `cy.validateSchema(operationId, status, body)`
- `tests/helpers/__tests__/schema-validator.spec.ts` — unit tests for the helper itself (3-4 cases including a deliberate schema mismatch)

Modify:
- Every test file in `tests/` and `cypress/e2e/` — replace the hand-written field-presence-and-type assertions with a single call to the schema validator. Keep the constraint assertions (format, minimum, enum) since they're more specific than schema validation alone.
- `package.json` — add `ajv` and `ajv-formats` to devDependencies if not already present

## Acceptance criteria
- The helper compiles each operation's response schema once per file (cached) and reuses it.
- A failing schema validation produces an error message that names the field, the expected type/format, and the actual value — not a raw ajv stack trace.
- Removing a required field from a Restful-Booker response (simulate via a stub) causes the schema test to fail with that exact field name.
- Both runners use the same OpenAPI file as the source of truth.
- All tests still pass after replacing field-by-field assertions with the validator.

## Constraints
- Do not write a custom JSON schema parser. Use ajv. Use `addFormats` for date/email/uri.
- Do not loosen schemas to make tests pass. If the live API doesn't match the spec, that is a finding to flag in the Walkthrough — not a reason to weaken assertions.
- The helper must work with `$ref` references inside the OpenAPI document.
- Cache the compiled validators. Do not recompile per test.

## Suggested approach
1. Add `ajv` and `ajv-formats` to `package.json`. Run `npm install`.
2. Write `schema-validator.ts`:
   - Load YAML with `js-yaml`
   - Resolve refs (use `@apidevtools/json-schema-ref-parser` if needed)
   - Pick out `paths[<path>][<method>].responses[<status>].content['application/json'].schema`
   - Compile with ajv, return validator function
3. Write the unit tests for the helper in `tests/helpers/__tests__/`. Cover: valid body, missing required field, wrong type, format violation.
4. Refactor existing tests to use it. Run continuously; expect a few real findings where the live API drifts from the spec — capture those as TODO items in the Walkthrough rather than papering over them.
5. Build the Cypress equivalent as a custom command.

## Verification commands
```
npm run test:playwright -- tests/helpers/__tests__/schema-validator.spec.ts
npm run test:playwright
npm run test:cypress
```

## Walkthrough requirements
- Diff showing the helper added and at least 5 test files refactored to use it
- Test output showing the helper's own unit tests pass
- A list of any real spec/API drift findings the agent surfaced during the refactor (this is high-value output — flag it explicitly even if the count is zero)
- Token cost comparison: roughly how many lines of hand-written assertions the helper replaced (a number like "replaced 47 lines of field-by-field assertions across 6 files with 6 schema validator calls" reads great)

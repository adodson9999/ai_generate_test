# Plan 09 — Test Data Factory

## Goal
Replace every inline test data literal with a Faker-driven factory that produces valid bookings by default and exposes overrides for boundary-value testing — sourced from the OpenAPI schema's constraints.

## Why this matters
Inline test data is a maintenance disaster. Every time the spec changes, every test gets touched. A factory pulls test data into one place, makes it deterministic (seedable for reproducibility), and unlocks boundary-value testing as a one-line operation. This is the architectural detail that separates a "tests pass" repo from a maintainable test suite.

## Inputs
- All test files from Plans 01-07
- `specs/booking-openapi.yaml` and other OpenAPI fragments
- Findings from Plan 04 about which fields have constraints

## Deliverables
Create:
- `tests/factories/booking-factory.ts` — Playwright/TypeScript factory with this API:
  ```ts
  bookingFactory.build()                       // valid booking, random data
  bookingFactory.build({ totalprice: 0 })      // override one field
  bookingFactory.boundary('firstname', 'min')  // boundary value for a field
  bookingFactory.invalid('totalprice', 'type') // invalid value of specified kind
  bookingFactory.seed(12345)                   // make it deterministic
  ```
- `cypress/support/bookingFactory.js` — Cypress equivalent registered as `cy.factory('booking', ...)`
- `tests/factories/__tests__/booking-factory.spec.ts` — unit tests for the factory (8-10 cases including determinism, override correctness, boundary values)
- `tests/factories/openapi-driven.ts` — utility that reads an OpenAPI schema and returns the constraints (min, max, format, enum) for a field — used by the boundary/invalid methods

Modify:
- Every test file that builds a booking inline → use the factory instead
- The Plan 04 negative generator → use the factory's `invalid()` method instead of its own ad-hoc generation

## Acceptance criteria
- `bookingFactory.build()` returns a booking that passes all schema validations from Plan 03.
- `bookingFactory.boundary('firstname', 'min')` returns a booking with `firstname` set to the shortest allowed value (1 character if `minLength: 1`).
- `bookingFactory.invalid('totalprice', 'type')` returns a booking with `totalprice` as a string instead of a number.
- Seeding (`bookingFactory.seed(12345)`) produces identical output across runs and across machines.
- All existing tests still pass after the refactor.
- The factory is the *only* place test data is constructed for booking-related tests — a grep for inline booking literals returns zero hits.

## Constraints
- Use `@faker-js/faker` (not the deprecated `faker`).
- Do not hardcode constraint values in the factory. Read them from the OpenAPI schema via `openapi-driven.ts`.
- Determinism: when seeded, the factory must produce identical output across machines. This means using Faker's `seed()` mechanism, not Math.random.
- Date format: Restful-Booker expects `YYYY-MM-DD`, which Faker's `date.future()` doesn't produce by default. Wrap and format.
- The factory must work with both Playwright (TypeScript) and Cypress (JavaScript). Either ship a TS source compiled to JS, or write the core in JS with TypeScript types via JSDoc.

## Suggested approach
1. Build `openapi-driven.ts` first. Test that it correctly extracts constraints for `booking.firstname.minLength`, `booking.totalprice.minimum`, etc.
2. Build the factory's `build()` method. Confirm output passes schema validation.
3. Add `seed()`, confirm determinism with a unit test (build twice with same seed → same output).
4. Add `boundary()` and `invalid()`, driven by the openapi-driven utility.
5. Refactor existing tests to use the factory. This will be a wide diff — go file by file, run the suite after each, prove no regression.
6. Update the Plan 04 negative generator to delegate to `factory.invalid()`.

## Verification commands
```
npm run test:playwright -- tests/factories/__tests__/
npm run test:playwright   # full suite, prove no regression after refactor
npm run test:cypress
grep -r "firstname:" tests/ cypress/ | grep -v "factory" | grep -v "spec" || echo "no inline literals found"
```

## Walkthrough requirements
- Diff showing the factory created
- Diff showing the refactor — pick the largest test file, show before/after side by side
- Output of the inline-literal grep proving the refactor was complete
- Determinism proof: run the factory's unit test for `seed()` 3 times, all green
- One example each of `build()`, `boundary()`, and `invalid()` output, formatted as JSON

# AI-Generated Test Demo

This repo demonstrates AI-assisted test generation: a natural-language spec and an OpenAPI 3 fragment go in, Playwright and Cypress test suites come out. Tests run against the public Restful-Booker API and pass without any setup beyond `npm install`.

## What's here

- `specs/booking-lookup.feature` — the NL acceptance criteria (input)
- `specs/booking-openapi.yaml` — the OpenAPI 3 fragment (input)
- `prompts/api-test-gen.md` — the reusable prompt template that turns the inputs into tests
- `tests/booking.spec.ts` — generated Playwright suite (output)
- `cypress/e2e/booking.cy.js` — generated Cypress suite (output)

## Methodology

The interesting artifact is `prompts/api-test-gen.md`. It enforces a deterministic output contract: one positive test per success response, one negative test per error response, presence-and-type assertions for every required schema field, constraint assertions (format/minimum/regex/enum), and non-functional ACs (latency) as separate assertions. Same input produces both Playwright and Cypress — the abstraction sits above the runner.

## Run

```bash
# 1. Install dependencies
npm install

# 2. Run the Playwright suite
npm run test:playwright

# 3. Run the Cypress suite
npm run test:cypress
```

Both suites hit `https://restful-booker.herokuapp.com` directly. They discover a live booking ID at runtime (the public sandbox resets every ~10 minutes and IDs rotate), so there is nothing to seed and no fixture to keep in sync.

## Target API

[Restful-Booker](https://restful-booker.herokuapp.com/) — a public sandbox API maintained for testing tool demos.

## Auth Flow

While the read paths (`GET`) are public, the mutation endpoints (`PUT`, `PATCH`, `DELETE`) require an auth token. The suite generates this token on the fly via `POST /auth` using default sandbox credentials. Tests needing auth consume a Playwright or Cypress fixture that supplies the token. (Note: Restful-Booker's auth API has some quirks, such as returning `200 OK` even for bad or missing credentials, which the generated tests reflect).

## Regenerating the tests

1. Edit `specs/booking-lookup.feature` and/or `specs/booking-openapi.yaml`.
2. Open `prompts/api-test-gen.md` and fill the `<paste …>` placeholders with the current spec contents.
3. Set `Framework:` to `playwright` or `cypress` and run the prompt against your model of choice.
4. Drop the output into `tests/booking.spec.ts` or `cypress/e2e/booking.cy.js`.

The output contract in the prompt is what keeps the two suites in lockstep — change the spec, regenerate both, ship.

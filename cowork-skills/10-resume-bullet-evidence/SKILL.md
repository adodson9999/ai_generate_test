---
name: resume-bullet-evidence
description: Take a single resume bullet (especially one that sounds impressive but currently has no demonstrable artifact behind it) and produce a plan to make it real — a project structure, a sequence of commits, a demo script, and an interview answer that can withstand follow-up questions. Use whenever the user pastes in a resume bullet and asks "how do I prove this", "build evidence for this", "make this demonstrable", "back this up with a portfolio piece", or mentions interview prep, portfolio building, or worry that an interviewer might call them on a claim. This is the meta-skill for converting claims into receipts.
---

# Resume Bullet Evidence Builder

Take one resume bullet and produce a plan to make it concretely demonstrable: a runnable repo, a commit history that tells the story, a 90-second demo script, and a set of follow-up questions with prepared answers.

## When to use this skill

The user has a resume bullet that's either:
- Aspirational (something they did at a previous job they no longer have access to)
- Vague (something they did but never built a public artifact for)
- Future-tense (something they want to be able to claim by their next interview cycle)

They want to make it bulletproof. Your job is to plan the path from bullet to evidence.

## What you produce

A planning file `evidence-<bullet-slug>.md` with this structure:

```markdown
# Evidence Plan — <bullet text>

## The bullet (verbatim)
> <paste the bullet>

## What this bullet implies
<2-3 sentences: what skills, what tools, what scale, what outcomes the bullet implies>

## Proof gap analysis
| Claim in bullet | Demonstrable today? | Gap |
|-----------------|---------------------|-----|
| <claim 1>       | <yes/partial/no>    | <gap> |
| <claim 2>       | ...                 | ... |

## Evidence artifact
- **Repo name:** <suggested name>
- **One-line description:** <what someone sees in the README first sentence>
- **Tech stack:** <inferred from bullet>
- **Hosting:** <GitHub public, GitHub private + invite link, GitLab, etc.>

## Project structure
<file tree>

## Commit history (story arc)
1. <commit 1: initial scaffolding>
2. <commit 2: first working version of the headline claim>
...
N. <commit N: polish, README, demo>

## 90-second demo script
<verbatim what to say + what to click while screen-sharing>

## Follow-up questions an interviewer might ask
| Question | Prepared answer (1-2 sentences) |
|----------|----------------------------------|
| ...      | ...                              |

## Risks
<what could go wrong with the demo, and how to handle each>

## Time budget
<hours to build the artifact>
```

## How to do it

### Step 1 — Decompose the bullet into claims
Most resume bullets contain 3-5 claims welded together. Pull them apart.

Example bullet: "Leveraged OpenClaw for AI-assisted test generation, automatically producing Playwright and Cypress test scripts from natural language specifications and OpenAPI schemas, accelerating test coverage for new features."

Claims:
1. Used a specific tool (OpenClaw) for test generation
2. AI-assisted (i.e., LLM in the loop)
3. Output is Playwright AND Cypress
4. Input is NL specs AND OpenAPI schemas
5. Outcome: accelerated test coverage

Each claim is something an interviewer can drill on. Each is something the evidence artifact must support.

### Step 2 — Identify proof gaps
For each claim, ask: "If an interviewer said 'show me' right now, could I?"
- **Yes**: claim is fully proven
- **Partial**: claim is partially proven (e.g., you have a Playwright script but not Cypress)
- **No**: claim has no public artifact behind it

Gaps are where you spend time.

### Step 3 — Design the artifact
The artifact is a small public repo. It does NOT need to be a full product. It needs to be the *minimum demonstrable instance* of every claim in the bullet.

Rules of thumb:
- One repo per bullet, not one mega-repo per resume
- Public on GitHub by default (private with invite link if the work is sensitive)
- README is the single most important file — it must answer "what is this?" in the first sentence and "why should I care?" in the second
- Run instructions must work on a fresh clone, no exceptions
- The repo name should reflect what it does, not who built it (`ai-test-generator-demo` not `alex-portfolio-3`)

### Step 4 — Plan the commit history as a story
A clean commit history is differentiation. Each commit is a chapter:
1. Initial scaffolding (Day 1)
2. First working version of the simplest version of the claim (Day 1-2)
3. Add the differentiating capability (Day 2-3)
4. Polish, README, examples (Day 3)

Don't squash. Interviewers sometimes look at the commit log and a clean-but-not-pristine history reads more authentic than a single commit.

### Step 5 — Write the 90-second demo
This is the actual script the user will use in an interview. It includes:
- What to share (screen, terminal, browser)
- What to say verbatim, in order
- What to click and when

Format:
```
[0:00] "Here's the repo. The README explains it in two sentences."
       (open README, scroll to first paragraph, hold for 5 seconds)

[0:15] "Here's the input — a Gherkin feature and an OpenAPI fragment."
       (open both files, side by side)

[0:30] "Here's the prompt that turns them into tests."
       (open prompts/api-test-gen.md, scroll through)

[0:50] "Watch — I run it for Playwright."
       (run command, show output)

[1:10] "Same prompt, framework switched to Cypress. Same number of tests, same names."
       (run command, show output)

[1:25] "And both suites pass against the live API."
       (run npm test, show green)

[1:30] "That's the demo."
```

90 seconds is the target. Most interviewers will let you go to 2 minutes. Past that and they're tuning out.

### Step 6 — Anticipate follow-up questions
For each claim in the bullet, write 2-3 questions an interviewer could ask, with one or two-sentence answers. Common patterns:

- **"How does it handle X edge case?"** → name a specific case and explain what the code does
- **"Why did you choose Y framework?"** → 1-sentence comparison vs. one alternative
- **"What was hard about this?"** → name a specific challenge and what you did about it (vague answers are red flags)
- **"How would you scale this?"** → 2-3 sentences on the next step you'd take if this were a real product
- **"How is this different from <competing tool>?"** → know one or two competitors well enough to articulate the difference

### Step 7 — Risk-check the demo
What could go wrong live?
- Wifi flakes during the live API call → record a backup video
- Tool you depend on (e.g., OpenClaw) isn't accessible → use an alternative the demo doesn't depend on
- Repo doesn't run on the interviewer's Node version → pin the version in `.nvmrc` and call it out
- Live API is rate-limited → have a backup with cached responses

Each risk gets a one-line mitigation.

### Step 8 — Time-box it
Give the user a realistic hour count. Most evidence artifacts can be built in 8-16 hours. Bullets that imply enterprise-scale work (e.g., "Led migration of 500-engineer org to...") cannot be fully proven by a side project — note this and recommend partial evidence instead.

## When the bullet is partly fictional

Some bullets describe work the user did but can't replicate (e.g., the original work used a proprietary tool they no longer have access to). Solutions:
- **Tool substitution**: rebuild with an open alternative. Note this honestly in the README. ("The original implementation used X; this demo uses Y, which works equivalently for this use case.")
- **Scoped down**: rebuild a smaller version. Don't claim the full scale; claim the technique.
- **Reframed bullet**: if the artifact ends up demonstrating a slightly different claim, update the bullet to match the artifact rather than vice versa.

The goal is honest evidence, not Photoshopped evidence. An interviewer who senses a fake will dig until they find it.

## Quality bar

- Every claim in the bullet has a corresponding artifact element
- The README answers "what is this" in one sentence
- The repo runs on a fresh clone in under 5 minutes from `git clone` to "tests passing"
- The 90-second demo script has been timed and actually fits in 90 seconds
- The follow-up Q&A list has at least 5 entries

## What not to do

- Don't help build evidence for false claims. If the user says "I never actually used OpenClaw, I just heard about it" — they should change the bullet, not fake the artifact.
- Don't recommend artifacts so big they become a second job. Better to have one tight 8-hour project than three abandoned half-projects.
- Don't include bullet text in the artifact's README ("This repo demonstrates my resume bullet about X"). The repo should stand on its own.
- Don't promise the bullet will get them hired. The bullet is one input to a hiring decision among many.

## Example

**User input:**
> "I want to make this bullet bulletproof: 'Leveraged OpenClaw for AI-assisted test generation, automatically producing Playwright and Cypress test scripts from natural language specifications and OpenAPI schemas, accelerating test coverage for new features.' I don't have access to OpenClaw anymore."

**Your output:**
An evidence plan naming a substitute artifact (a public repo `ai-test-generator-demo` that uses any LLM API via a structured prompt template — Antigravity, Claude API, GPT, Gemini — instead of OpenClaw), reframing the bullet to "AI-assisted test generation" without naming OpenClaw specifically, listing 5 claims to prove, suggesting a 12-hour build broken across 3 sessions, a 90-second demo that pastes the prompt into Claude and runs the output in both Playwright and Cypress, and 8 follow-up Q&A pairs covering the choice of LLM, the prompt's output contract, the parity check, schema validation, etc.

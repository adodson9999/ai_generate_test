# AI-Augmented Test Automation: Technical Proposal

**Author:** Alex Dodson — Senior QA Engineer
**Date:** April 30, 2026
**Classification:** Internal Technical Proposal — POC Phase

---

## Executive Summary

This document proposes a Proof of Concept (POC) for integrating a locally-hosted Large Language Model (LLM) into our test automation pipeline. By combining **Ollama** (running Meta's Llama 4 Scout) with a **Python/Playwright** framework, we can solve three high-value problems that traditional test automation cannot address: brittle locators that break on every UI deploy, dynamic content that can't be validated with string matching, and test data that doesn't cover real-world edge cases.

The POC is designed to run entirely on-premise — no data leaves the network, no per-token API costs, and no vendor lock-in. The total infrastructure cost is a single workstation with a supported GPU.

> **IMPORTANT:** This is not a proposal to replace existing QA processes. It is a proposal to augment them with capabilities that are currently impossible to automate — capabilities that today require a human to look at the screen and make a judgment call.

---

## 1. Architectural Overview

### 1.1 System Architecture

```
┌──────────────────────────────────────────────────────┐
│                Test Execution Layer                   │
│                                                       │
│  ┌──────────┐    ┌────────────┐    ┌──────────────┐  │
│  │  Pytest   │───▶│ Playwright │───▶│   App Under  │  │
│  │  Runner   │    │  Browser   │    │    Test       │  │
│  └────┬──┬──┘    └────────────┘    └──────────────┘  │
│       │  │                                            │
└───────┼──┼────────────────────────────────────────────┘
        │  │
        │  │   ┌──────────────────────────────────┐
        │  │   │       Decision Layer              │
        │  ├──▶│  ┌──────────────────────────────┐ │
        │  │   │  │  Locator Healer              │ │
        │  │   │  │  Content Validator           │ │
        │  │   │  │  Data Generator              │ │
        │  │   │  └──────────┬───────────────────┘ │
        │  │   └─────────────┼─────────────────────┘
        │  │                 │
        │  │   ┌─────────────▼─────────────────────┐
        │  └──▶│      AI Integration Layer         │
        │      │                                    │
        │      │  ┌──────────────┐  ┌────────────┐ │
        │      │  │ OllamaClient │─▶│ Ollama     │ │
        │      │  │              │  │ Server     │ │
        │      │  └──────────────┘  │ :11434     │ │
        │      │                    │            │ │
        │      │                    │ Llama 4    │ │
        │      │                    │ Scout 17B  │ │
        │      │                    └────────────┘ │
        │      └───────────────────────────────────┘
        │
        ▼
  ┌──────────────┐
  │   Reports    │
  │  & Logs      │
  └──────────────┘
```

### 1.2 Component Responsibilities

| Component | Role | Latency Budget |
|---|---|---|
| **Pytest Runner** | Orchestrates test execution, collects results, manages retries | — |
| **Playwright** | Browser automation, DOM capture, network interception | < 100ms per action |
| **OllamaClient** | Thin Python wrapper around Ollama's REST API (`/api/generate`) | — |
| **Ollama Server** | Hosts and serves the Llama 4 Scout model locally | — |
| **Locator Healer** | Intercepts `ElementNotFound` errors, queries LLM for replacement selectors | < 5s per heal |
| **Content Validator** | Sends dynamic text + rubric to LLM, parses structured verdict | < 3s per validation |
| **Data Generator** | Requests synthetic records from LLM with schema constraints | < 2s per record |

### 1.3 Data Flow — Single Test Execution

```
Pytest              Playwright          App Under Test       OllamaClient        Llama 4 Scout
  │                    │                     │                    │                    │
  │─ Execute step ────▶│                     │                    │                    │
  │  (click #submit)   │── Find element ────▶│                    │                    │
  │                    │                     │                    │                    │
  │                    │◀─ ElementNotFound ──│                    │                    │
  │◀─ Raise Error ─────│                     │                    │                    │
  │                    │                     │                    │                    │
  │  [Healer intercepts]                     │                    │                    │
  │                    │                     │                    │                    │
  │── Capture DOM ────▶│                     │                    │                    │
  │◀── Raw HTML ───────│                     │                    │                    │
  │                    │                     │                    │                    │
  │── POST /generate ──┼─────────────────────┼───────────────────▶│                    │
  │   {DOM + selector} │                     │                    │── Inference ──────▶│
  │                    │                     │                    │◀─ New selector ────│
  │◀── Response ───────┼─────────────────────┼────────────────────│                    │
  │                    │                     │                    │                    │
  │── Retry with ─────▶│                     │                    │                    │
  │   healed selector  │── Find element ────▶│                    │                    │
  │                    │◀─ Element found ✓ ──│                    │                    │
  │                    │                     │                    │                    │
  │── Log healing ─────│                     │                    │                    │
  │── Continue test ──▶│                     │                    │                    │
```

### 1.4 Why Llama 4 Scout Specifically

| Consideration | Llama 4 Scout | Cloud API (GPT-4, Claude) |
|---|---|---|
| **Data residency** | All data stays on-premise | PII/DOM leaves the network |
| **Cost per inference** | $0 marginal (hardware amortized) | $0.01–0.06 per call |
| **Latency** | ~500ms–3s (local GPU) | 1–8s (network + queue) |
| **Availability** | No rate limits, no outages | Subject to provider SLAs |
| **Model size** | 17B active params (MoE) | Undisclosed |
| **Context window** | 128K tokens | Varies |

Llama 4 Scout's 128K context window is critical — it allows us to pass entire DOM snapshots (10K–50K tokens) plus the test context without truncation.

---

## 2. Use Case 1: Self-Healing Locators

### 2.1 Problem Statement

UI tests break when developers change element IDs, class names, or DOM structure. Industry data suggests **30–40% of test maintenance effort** is spent updating locators after benign UI refactors. This is wasted human time that produces zero additional coverage.

### 2.2 Solution Design

```python
# conftest.py — Pytest fixture that wraps Playwright's locator resolution

import pytest
import json
from playwright.sync_api import Page, Error as PlaywrightError
from ollama_client import OllamaClient

class HealingPage:
    """Wraps a Playwright Page with AI-powered locator healing."""

    def __init__(self, page: Page, ollama: OllamaClient):
        self._page = page
        self._ollama = ollama
        self.healing_log: list[dict] = []

    def locator(self, selector: str):
        try:
            loc = self._page.locator(selector)
            loc.wait_for(timeout=3000)
            return loc
        except PlaywrightError:
            return self._heal(selector)

    def _heal(self, broken_selector: str):
        # Capture the current DOM (truncated to reduce tokens)
        dom = self._page.content()
        if len(dom) > 80_000:
            dom = dom[:80_000] + "\n<!-- truncated -->"

        prompt = f"""You are a test automation expert. A Playwright test failed because 
the selector `{broken_selector}` no longer matches any element in the page.

Here is the current DOM:
```html
{dom}
```

Analyze the DOM and suggest the best replacement CSS selector.
Return ONLY a JSON object: {{"selector": "your-selector", "confidence": 0.0-1.0, "reasoning": "why"}}
Do not return anything else."""

        response = self._ollama.generate(prompt)
        result = json.loads(response)

        if result["confidence"] < 0.6:
            raise PlaywrightError(
                f"Locator healing failed: confidence {result['confidence']} "
                f"is below threshold. Reasoning: {result['reasoning']}"
            )

        self.healing_log.append({
            "broken": broken_selector,
            "healed": result["selector"],
            "confidence": result["confidence"],
            "reasoning": result["reasoning"],
            "url": self._page.url,
        })

        return self._page.locator(result["selector"])


@pytest.fixture
def healing_page(page, ollama_client):
    hp = HealingPage(page, ollama_client)
    yield hp
    # After test: report any healings
    for event in hp.healing_log:
        print(f"  🩹 HEALED: {event['broken']} → {event['healed']} "
              f"(confidence: {event['confidence']:.0%})")
```

### 2.3 Guardrails

| Risk | Mitigation |
|---|---|
| LLM suggests a selector that matches the wrong element | Confidence threshold (0.6 minimum); human review of healing log |
| Healing masks a real bug (element was *supposed* to be removed) | Healing only fires on `ElementNotFound`, not assertion failures |
| DOM is too large for context window | Truncation with priority on `<body>` content; strip `<script>` and `<style>` tags |
| Healing adds latency to every test | Healing only runs on failure, not on the happy path |

### 2.4 Deliverables

- `src/healing/healer.py` — `HealingPage` wrapper class
- `src/healing/ollama_client.py` — Typed Ollama API client
- `tests/test_healing_demo.py` — Demo test against a real app with intentionally broken selectors
- `reports/healing_log.json` — Machine-readable log of all healing events per run

---

## 3. Use Case 2: Non-Deterministic Content Validation

### 3.1 Problem Statement

Modern applications contain dynamic content that changes on every page load: chatbot responses, AI-generated product descriptions, personalized recommendations. Traditional assertions (`assert text == "expected"`) cannot validate this content. Today, a human reads it. Tomorrow, the LLM reads it.

### 3.2 Solution Design

```python
# validators/content_validator.py

from dataclasses import dataclass
from ollama_client import OllamaClient

@dataclass
class ContentVerdict:
    passed: bool
    score: float          # 0.0 – 1.0
    reasoning: str
    flagged_issues: list[str]

class ContentValidator:
    """Validates dynamic text content against a rubric using an LLM."""

    def __init__(self, ollama: OllamaClient):
        self._ollama = ollama

    def validate(
        self,
        content: str,
        rubric: dict,
        context: str = ""
    ) -> ContentVerdict:
        """
        Args:
            content: The text to validate (e.g., chatbot response)
            rubric: Validation criteria, e.g.:
                {
                    "must_mention": ["return policy", "30 days"],
                    "must_not_mention": ["competitor names"],
                    "tone": "professional and helpful",
                    "max_length": 500,
                    "factual_claims": ["returns accepted within 30 days"]
                }
            context: Additional context (e.g., the user's question)
        """
        prompt = f"""You are a QA validator. Evaluate the following content against the rubric.

CONTEXT (what the user asked): {context}

CONTENT TO VALIDATE:
\"\"\"{content}\"\"\"

RUBRIC:
- Must mention these topics: {rubric.get('must_mention', [])}
- Must NOT mention: {rubric.get('must_not_mention', [])}
- Tone should be: {rubric.get('tone', 'professional')}
- Maximum length: {rubric.get('max_length', 'no limit')} characters
- Factual claims that must be accurate: {rubric.get('factual_claims', [])}

Return ONLY a JSON object:
{{
    "passed": true/false,
    "score": 0.0-1.0,
    "reasoning": "detailed explanation",
    "flagged_issues": ["issue 1", "issue 2"]
}}"""

        response = self._ollama.generate(prompt)
        data = json.loads(response)
        return ContentVerdict(**data)
```

### 3.3 Example: Validating a Chatbot Response

```python
# tests/test_chatbot_validation.py

def test_chatbot_returns_accurate_refund_info(healing_page, content_validator):
    page = healing_page
    page.goto("https://app.example.com/support")
    page.locator("#chat-input").fill("How do I get a refund?")
    page.locator("#chat-send").click()

    # Wait for the chatbot to respond
    response_el = page.locator(".chat-response").last
    response_el.wait_for(state="visible", timeout=10_000)
    response_text = response_el.text_content()

    # Validate with LLM — not a string match, but a semantic evaluation
    verdict = content_validator.validate(
        content=response_text,
        rubric={
            "must_mention": ["refund", "30 days", "original payment method"],
            "must_not_mention": ["competitor", "lawsuit"],
            "tone": "helpful, empathetic, professional",
            "factual_claims": [
                "Refunds are processed within 5-7 business days",
                "Items must be in original packaging"
            ],
        },
        context="Customer asked: How do I get a refund?"
    )

    assert verdict.passed, (
        f"Content validation failed (score: {verdict.score:.0%}).\n"
        f"Reasoning: {verdict.reasoning}\n"
        f"Issues: {verdict.flagged_issues}"
    )
```

### 3.4 Key Insight

This is not about testing the LLM that generates the chatbot response. It is about using a *separate* LLM as a judge — the same pattern used in LLM evaluation research (LLM-as-Judge, Zheng et al. 2023). The judge model and the production model should be different to avoid self-reinforcing biases.

---

## 4. Use Case 3: Synthetic Test Data Generation

### 4.1 Problem Statement

Lead funnel forms require test data that covers edge cases: international phone formats, Unicode names, adversarial inputs, boundary-length strings. Hand-crafting this data is tedious. Faker libraries produce syntactically valid but semantically shallow data. An LLM can produce *realistic* edge cases that a Faker library never would.

### 4.2 Solution Design

```python
# generators/data_factory.py

class LLMDataFactory:
    """Generates synthetic test data using an LLM with schema constraints."""

    def __init__(self, ollama: OllamaClient):
        self._ollama = ollama

    def generate_lead(self, persona: str = "default", edge_case: str = None) -> dict:
        """
        Generate a synthetic lead record.

        Args:
            persona: e.g., "international_user", "adversarial", "elderly"
            edge_case: e.g., "unicode_name", "max_length_fields", "sql_injection"
        """
        prompt = f"""Generate a realistic lead form submission for testing.

PERSONA: {persona}
EDGE CASE TO COVER: {edge_case or 'standard valid submission'}

The form has these fields:
- first_name (string, 1-50 chars)
- last_name (string, 1-50 chars)  
- email (valid email format)
- phone (international format with country code)
- company (string, 1-100 chars)
- job_title (string, 1-100 chars)
- message (string, 0-2000 chars)
- country (ISO 3166-1 alpha-2)

Requirements:
- Data must be realistic — it should look like a real person filled it out.
- If an edge case is specified, push the boundaries of that specific field.
- Include subtle issues that would expose validation bugs.

Return ONLY a JSON object with the field values. No explanation."""

        response = self._ollama.generate(prompt)
        return json.loads(response)

    def generate_batch(self, count: int, distribution: dict = None) -> list[dict]:
        """
        Generate a batch with a specified distribution of personas.
        Default: 60% standard, 20% international, 10% edge-case, 10% adversarial
        """
        dist = distribution or {
            "standard": 0.6,
            "international_user": 0.2,
            "boundary_values": 0.1,
            "adversarial": 0.1,
        }
        records = []
        for persona, ratio in dist.items():
            n = max(1, int(count * ratio))
            for _ in range(n):
                records.append(self.generate_lead(persona=persona))
        return records[:count]
```

### 4.3 Edge Case Categories

| Category | Example Output | What It Tests |
|---|---|---|
| **Unicode names** | `{"first_name": "Ólafur Þórðarson"}` | Character encoding, database collation |
| **Max-length fields** | 50-char first name, 2000-char message | Field truncation, UI overflow |
| **International phone** | `{"phone": "+81-3-1234-5678"}` | Phone validation regex |
| **Adversarial** | `{"company": "Acme'; DROP TABLE leads;--"}` | SQL injection, XSS |
| **Empty optional fields** | `{"message": ""}` | Null handling, required-field logic |
| **Emoji in text** | `{"message": "Love this product! 🚀🎉"}` | UTF-8 handling in backend |

---

## 5. Success Metrics & Model Governance

### 5.1 Key Performance Indicators

| Metric | Definition | Target | Measurement Method |
|---|---|---|---|
| **Healing Accuracy** | % of healed selectors that find the correct element | ≥ 85% | Manual review of healing log (sample 50 events) |
| **Healing Latency** | Time from failure detection to healed retry | < 5s p95 | Instrumentation in `HealingPage` |
| **Validation Agreement** | % of LLM verdicts that match a human reviewer's judgment | ≥ 90% | Double-blind review of 100 validation samples |
| **Data Validity Rate** | % of generated records that pass schema validation | ≥ 95% | JSON Schema validation post-generation |
| **False Positive Rate** | % of tests that pass due to healing when they should have failed | < 2% | Fault injection testing |

### 5.2 Model Drift Detection

Model drift occurs when the LLM's behavior changes across versions or after quantization. We measure it with a **golden set**:

```python
# monitoring/drift_detector.py

GOLDEN_SET = [
    {
        "input": "<html><body><button id='old-submit'>Submit</button></body></html>",
        "broken_selector": "#submit-btn",
        "expected_output_contains": "old-submit",  # Must find the right button
    },
    # ... 50 more golden cases
]

class DriftDetector:
    """Runs a fixed set of prompts against the model and compares outputs."""

    def __init__(self, ollama: OllamaClient):
        self._ollama = ollama

    def run_drift_check(self) -> dict:
        results = {"total": len(GOLDEN_SET), "passed": 0, "failed": 0, "drift_score": 0.0}

        for case in GOLDEN_SET:
            response = self._ollama.generate(case["input"])
            if case["expected_output_contains"] in response:
                results["passed"] += 1
            else:
                results["failed"] += 1

        results["drift_score"] = results["failed"] / results["total"]
        return results
        # drift_score > 0.10 → alert: model behavior has changed significantly
```

**Trigger policy:** Run the drift check:
- After every Ollama model update
- As a nightly scheduled job
- Before any model version promotion to the CI pipeline

### 5.3 Hallucination Rate Measurement

Hallucinations in this context are **factually incorrect LLM outputs that a test acts on**:

| Hallucination Type | Example | Detection Method |
|---|---|---|
| **Phantom selector** | LLM suggests `#btn-submit-v2` which doesn't exist in the DOM | Post-heal verification: `page.locator(healed).count() > 0` |
| **Fabricated fact** | Content validator says "the response mentions 30-day returns" when it doesn't | Cross-check with keyword search on original text |
| **Invalid data** | Generated email is `user@company` (no TLD) | JSON Schema validation + regex checks |
| **Confident wrong answer** | LLM returns `confidence: 0.95` for a selector that matches the wrong element | Visual regression: screenshot comparison before/after healing |

**Measurement formula:**

```
Hallucination Rate = (Phantom Selectors + Fabricated Facts + Invalid Data) 
                     / Total LLM Calls × 100

Target: < 5% across all use cases
```

---

## 6. Technical Stack & Infrastructure

### 6.1 Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Language** | Python | 3.12+ | Test framework and orchestration |
| **Browser Automation** | Playwright | 1.48+ | DOM interaction, screenshot capture |
| **Test Framework** | Pytest | 8.x | Test discovery, fixtures, reporting |
| **LLM Runtime** | Ollama | 0.6+ | Local model serving |
| **Model** | Llama 4 Scout | 17B (Q4_K_M) | Inference for all three use cases |
| **Validation** | jsonschema | 4.x | Schema validation of LLM outputs |
| **Reporting** | Allure | 2.x | Rich HTML test reports |
| **CI** | GitHub Actions | — | Automated pipeline execution |

### 6.2 Hardware Requirements

| Component | Minimum | Recommended |
|---|---|---|
| **GPU** | NVIDIA RTX 4070 (12GB VRAM) | NVIDIA RTX 4090 (24GB VRAM) |
| **RAM** | 32 GB | 64 GB |
| **Storage** | 50 GB (model weights) | 100 GB SSD |
| **CPU** | 8-core | 16-core |

> **NOTE:** Llama 4 Scout uses a Mixture-of-Experts architecture with 109B total parameters but only 17B active per inference. With Q4 quantization, it fits comfortably in 12GB VRAM.

### 6.3 Project Structure

```
ai-test-poc/
├── src/
│   ├── healing/
│   │   ├── healer.py              # HealingPage wrapper
│   │   └── ollama_client.py       # Typed Ollama REST client
│   ├── validators/
│   │   └── content_validator.py   # LLM-as-Judge content validation
│   ├── generators/
│   │   └── data_factory.py        # Synthetic data generator
│   └── monitoring/
│       ├── drift_detector.py      # Golden-set drift checks
│       └── hallucination_tracker.py
├── tests/
│   ├── test_self_healing.py
│   ├── test_content_validation.py
│   ├── test_data_generation.py
│   └── conftest.py                # Shared fixtures
├── golden_sets/
│   ├── healing_golden.json
│   └── validation_golden.json
├── reports/
│   ├── healing_log.json
│   └── drift_report.json
├── pyproject.toml
├── pytest.ini
└── README.md
```

---

## 7. Implementation Timeline

| Phase | Duration | Deliverables | Exit Criteria |
|---|---|---|---|
| **Phase 1: Foundation** | Week 1 | Ollama setup, OllamaClient, basic Pytest scaffold | Model responds to prompts < 3s |
| **Phase 2: Self-Healing** | Week 2 | HealingPage, demo test, healing log | 5 tests heal successfully on intentionally broken selectors |
| **Phase 3: Content Validation** | Week 3 | ContentValidator, rubric DSL, chatbot test | Validation agreement ≥ 85% on 50 samples |
| **Phase 4: Data Generation** | Week 4 | LLMDataFactory, batch generation, schema validation | 95% of generated records pass schema validation |
| **Phase 5: Governance** | Week 5 | Drift detector, hallucination tracker, golden sets | Drift check runs in CI, hallucination rate measured |
| **Phase 6: Documentation** | Week 6 | Final report, recorded demo, CTO presentation | Stakeholder sign-off for production pilot |

---

## 8. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| LLM output is unparseable JSON | Medium | Low | Retry with `format: json` flag; fallback to regex extraction |
| Healing masks a real bug | Low | High | Healing never fires on assertion failures, only on locator errors; CI flags all healed tests for human review |
| Model update changes behavior | Medium | Medium | Golden-set drift detection blocks deployment until reviewed |
| GPU not available in CI | High | Medium | CPU fallback with Q4 quantization (slower but functional); or dedicated GPU runner |
| Inference latency spikes | Low | Low | Timeout per call (10s); test marked `@slow` and excluded from fast feedback loop |

---

## 9. What This Proves to a Hiring Organization

This POC demonstrates:

1. **Systems thinking** — Not just "I can write a prompt," but a full pipeline with error handling, fallbacks, governance, and drift detection.
2. **Production awareness** — Data residency (on-premise LLM), cost modeling ($0 marginal vs. cloud API), and latency budgeting.
3. **QA judgment** — Understanding that AI augments human testing rather than replacing it. Every AI decision is logged, thresholded, and auditable.
4. **Engineering rigor** — Typed interfaces, JSON Schema validation of LLM outputs, golden-set regression for the AI itself, and hallucination measurement.
5. **Pragmatism** — Choosing Llama 4 Scout (128K context, 17B active params, fits on a consumer GPU) over larger models that would be impractical for a POC.

---

> **Next step:** Clone the repo, run `ollama pull llama4-scout`, and execute `pytest tests/ -v` to see all three use cases live. The healing log, validation verdicts, and generated data are written to `reports/` for review.

---

*This document was authored as part of a portfolio demonstrating AI/ML integration capability within enterprise QA engineering.*

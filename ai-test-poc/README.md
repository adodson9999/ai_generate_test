# AI-Augmented Test Automation POC

> Self-Healing Locators · Content Validation · Synthetic Data Generation

A Proof of Concept demonstrating AI-powered test automation using a **local Ollama instance** (Llama 4 Scout) with **Python/Playwright/Pytest**.

## Quick Start

```bash
# 1. Install Ollama and pull the model
brew install ollama           # macOS
ollama serve                  # Start the server (in a separate terminal)
ollama pull llama3:8b      # Download the model (~12GB)

# 2. Install Python dependencies
cd ai-test-poc
pip install -e ".[dev]"
playwright install chromium

# 3. Run tests
# Unit tests (no Ollama required)
pytest tests/test_model_governance.py -m "not slow" -v

# Full suite (requires Ollama running)
pytest tests/ -v

# Specific use case
pytest tests/test_self_healing.py -v       # Self-healing locators
pytest tests/test_content_validation.py -v  # Content validation
pytest tests/test_data_generation.py -v     # Synthetic data
```

## Architecture

```
┌─ Pytest ─────────────────────────────────────────────┐
│                                                       │
│  ┌─────────────┐  ┌───────────────┐  ┌────────────┐ │
│  │ Self-Healing │  │   Content     │  │  Data      │ │
│  │ Locators     │  │   Validator   │  │  Factory   │ │
│  └──────┬──────┘  └──────┬────────┘  └─────┬──────┘ │
│         │                │                  │         │
│         └────────────────┼──────────────────┘         │
│                          │                            │
│                  ┌───────▼───────┐                    │
│                  │ OllamaClient  │                    │
│                  └───────┬───────┘                    │
│                          │                            │
└──────────────────────────┼────────────────────────────┘
                           │
                   ┌───────▼───────┐
                   │ Ollama Server │
                   │ Llama 4 Scout │
                   │ localhost:11434│
                   └───────────────┘
```

## Project Structure

```
ai-test-poc/
├── src/
│   ├── healing/
│   │   ├── ollama_client.py       # Typed Ollama REST client
│   │   └── healer.py              # HealingPage wrapper
│   ├── validators/
│   │   └── content_validator.py   # LLM-as-Judge validation
│   ├── generators/
│   │   └── data_factory.py        # Synthetic data factory
│   └── monitoring/
│       ├── drift_detector.py      # Golden-set drift checks
│       └── hallucination_tracker.py
├── tests/
│   ├── conftest.py                # Shared fixtures
│   ├── test_self_healing.py       # Use Case 1
│   ├── test_content_validation.py # Use Case 2
│   ├── test_data_generation.py    # Use Case 3
│   └── test_model_governance.py   # Drift + hallucination tests
├── golden_sets/                   # Fixed inputs for drift detection
├── reports/                       # Generated at runtime
└── pyproject.toml
```

## Success Metrics

| Metric | Target |
|---|---|
| Healing Accuracy | ≥ 85% |
| Validation Agreement (vs. human) | ≥ 90% |
| Generated Data Validity Rate | ≥ 95% |
| Hallucination Rate | < 5% |
| Model Drift Score | < 10% |

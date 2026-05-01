"""
Shared Pytest fixtures for the AI Test POC.

Provides:
- ollama_client: Connected OllamaClient instance
- healing_page: Playwright page with AI self-healing
- content_validator: LLM content validator
- data_factory: LLM synthetic data generator
- hallucination_tracker: Cross-test hallucination tracking
"""

import sys
import json
import pytest
import logging
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.healing.ollama_client import OllamaClient
from src.healing.healer import HealingPage
from src.validators.content_validator import ContentValidator
from src.generators.data_factory import LLMDataFactory
from src.monitoring.hallucination_tracker import HallucinationTracker
import os

logger = logging.getLogger(__name__)

REPORTS_DIR = Path(__file__).parent.parent / "reports"

# Force headless mode — prevents browser windows from opening
os.environ.setdefault("PWHEADLESS", "1")


@pytest.fixture(scope="session")
def browser_context_args(browser_context_args):
    """Override default Playwright context — longer timeout for LLM-backed tests."""
    return {**browser_context_args, "ignore_https_errors": True}


@pytest.fixture(scope="session")
def ollama_client():
    """Session-scoped OllamaClient — reused across all tests."""
    client = OllamaClient(
        base_url="http://localhost:11434",
        model="llama3:8b",
        timeout=30,
        max_retries=2,
    )
    yield client
    # Log token usage at session end
    tokens = client.get_total_tokens()
    logger.info("Session total tokens: %s", tokens)


@pytest.fixture(scope="session")
def ollama_available(ollama_client):
    """Check if Ollama is available — skip LLM tests if not."""
    available = ollama_client.is_available()
    if not available:
        pytest.skip(
            "Ollama is not available at localhost:11434. "
            "Start it with: ollama serve && ollama pull llama3:8b"
        )
    return True


@pytest.fixture
def healing_page(page, ollama_client, ollama_available):
    """Playwright page wrapped with AI self-healing locators."""
    hp = HealingPage(page, ollama_client)
    yield hp
    # After test: report healings
    if hp.healing_log:
        summary = hp.get_healing_summary()
        logger.info("Healing summary: %s", json.dumps(summary, indent=2))
        # Save to reports
        REPORTS_DIR.mkdir(parents=True, exist_ok=True)
        report_file = REPORTS_DIR / "healing_log.json"
        existing = json.loads(report_file.read_text()) if report_file.exists() else []
        existing.extend(summary["events"])
        report_file.write_text(json.dumps(existing, indent=2))


@pytest.fixture(scope="session")
def content_validator(ollama_client, ollama_available):
    """Session-scoped content validator."""
    return ContentValidator(ollama_client, pass_threshold=0.7)


@pytest.fixture(scope="session")
def data_factory(ollama_client, ollama_available):
    """Session-scoped data factory."""
    return LLMDataFactory(ollama_client)


@pytest.fixture(scope="session")
def hallucination_tracker():
    """Session-scoped hallucination tracker — persists across all tests."""
    tracker = HallucinationTracker()
    yield tracker
    # Save report at session end
    tracker.save_report()
    summary = tracker.get_summary()
    logger.info("Hallucination summary: %s", json.dumps(summary, indent=2))

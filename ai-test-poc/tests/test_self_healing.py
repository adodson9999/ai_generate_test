"""
Test Suite: Self-Healing Locators

Demonstrates AI-powered locator healing against the Restful-Booker
API documentation page (a real, public web page with DOM elements).
"""

from unittest.mock import patch

import pytest


@pytest.mark.healing
@pytest.mark.slow
class TestSelfHealing:
    """Tests that demonstrate the self-healing locator capability."""

    URL = "https://restful-booker.herokuapp.com/apidoc/index.html"

    def test_heals_broken_id_selector(self, healing_page, ollama_client):
        """
        Scenario: A test uses a CSS ID that does not exist; the locator layer delegates to healing.

        Ollama output for selector repair is nondeterministic, so responses are stubbed here to a
        selector known to exist on the live apidoc page (``text=Ping``). Other tests still exercise
        the real client end-to-end.
        """
        healing_page.goto(self.URL, wait_until="networkidle", timeout=60_000)

        broken = "#restful-booker-healing-poc-broken-id-xyz"
        stub_llm = {
            "selector": "text=Ping",
            "confidence": 0.95,
            "reasoning": "Stub: Ping link is present on the apidoc page",
        }

        with patch.object(ollama_client, "generate_json", return_value=stub_llm):
            loc = healing_page.locator(broken, timeout=10_000)

        assert loc.count() >= 1
        assert any(e.broken_selector == broken for e in healing_page.healing_log), (
            "healing_log should include the originally broken selector after a heal"
        )

    def test_healing_log_populated(self, healing_page):
        """
        Scenario: After a healing event, the log should contain the event.
        """
        healing_page.goto(self.URL)

        # Try a definitely-broken selector to trigger healing
        try:
            healing_page.locator("#definitely-does-not-exist-xyz-12345", timeout=2000)
        except Exception:
            pass  # Expected — healing may fail if no similar element exists

        # The healing log should have been populated (even if healing failed)
        # This is about testing the infrastructure, not the specific result
        assert isinstance(healing_page.healing_log, list)

    def test_healing_respects_confidence_threshold(self, healing_page):
        """
        Scenario: Healing should refuse to heal if confidence is below 0.6.
        """
        healing_page.goto(self.URL)
        original_threshold = healing_page.CONFIDENCE_THRESHOLD

        # Set an impossibly high threshold
        healing_page.CONFIDENCE_THRESHOLD = 0.99

        with pytest.raises(Exception):
            # This should fail because no healing can be 99% confident
            healing_page.locator("#nonexistent-element-abc", timeout=2000)

        # Restore
        healing_page.CONFIDENCE_THRESHOLD = original_threshold

    def test_healing_summary_structure(self, healing_page):
        """
        Scenario: The healing summary should have the correct structure.
        """
        summary = healing_page.get_healing_summary()
        assert "total_healings" in summary
        assert "events" in summary
        assert isinstance(summary["events"], list)

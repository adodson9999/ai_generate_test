"""
HealingPage — Playwright Page wrapper with AI-powered self-healing locators.

When a locator fails to find an element, the healer:
1. Captures the current DOM snapshot
2. Sends it to the local LLM with the broken selector
3. Receives a suggested replacement selector with confidence score
4. Retries with the healed selector if confidence >= threshold
5. Logs the healing event for human review

Healing ONLY fires on ElementNotFound — never on assertion failures.
This prevents the AI from masking real bugs.
"""

from __future__ import annotations

import json
import re
import time
import logging
from dataclasses import dataclass, field
from typing import Any

from playwright.sync_api import Page, Locator, Error as PlaywrightError

from .ollama_client import OllamaClient

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a senior test automation engineer specializing in CSS and XPath selectors.
Your task is to analyze a DOM snapshot and suggest a replacement selector for one that no longer works.
You must return ONLY valid JSON. No explanation, no markdown, no commentary."""


@dataclass
class HealingEvent:
    """Record of a single locator healing event."""
    broken_selector: str
    healed_selector: str
    confidence: float
    reasoning: str
    url: str
    timestamp: float
    latency_ms: float
    verified: bool = False  # Set to True after post-heal verification


class HealingPage:
    """
    Wraps a Playwright Page with AI-powered locator healing.

    Usage:
        hp = HealingPage(page, ollama_client)
        hp.locator("#submit-btn").click()  # Auto-heals if selector breaks

    The healing log is available at hp.healing_log after the test.
    """

    CONFIDENCE_THRESHOLD = 0.6
    DOM_MAX_LENGTH = 80_000

    def __init__(self, page: Page, ollama: OllamaClient):
        self._page = page
        self._ollama = ollama
        self.healing_log: list[HealingEvent] = []

    @property
    def page(self) -> Page:
        """Access the underlying Playwright page for non-healed operations."""
        return self._page

    def goto(self, url: str, **kwargs) -> Any:
        """Navigate to a URL."""
        return self._page.goto(url, **kwargs)

    def locator(self, selector: str, *, timeout: int = 3000) -> Locator:
        """
        Find an element by selector, auto-healing if the selector is broken.

        Args:
            selector: CSS or XPath selector.
            timeout: Milliseconds to wait before triggering healing.

        Returns:
            A Playwright Locator pointing to the found element.

        Raises:
            PlaywrightError: If healing fails or confidence is below threshold.
        """
        try:
            loc = self._page.locator(selector)
            loc.wait_for(timeout=timeout)
            return loc
        except (PlaywrightError, Exception):
            logger.info("Selector failed: %s — attempting AI healing", selector)
            return self._heal(selector)

    def _heal(self, broken_selector: str) -> Locator:
        """
        Attempt to heal a broken selector using the LLM.

        Steps:
        1. Capture and clean the DOM
        2. Build a prompt with the DOM and broken selector
        3. Send to LLM and parse the JSON response
        4. Verify the healed selector actually finds an element
        5. Log the event and return the working locator
        """
        start = time.perf_counter()

        # Step 1: Capture DOM
        dom = self._clean_dom(self._page.content())

        # Step 2: Build prompt
        prompt = self._build_prompt(broken_selector, dom)

        # Step 3: Query LLM
        try:
            result = self._ollama.generate_json(prompt, system=SYSTEM_PROMPT)
        except Exception as e:
            raise PlaywrightError(
                f"Locator healing failed — LLM error: {e}"
            ) from e

        healed_selector = result.get("selector", "")
        confidence = float(result.get("confidence", 0.0))
        reasoning = result.get("reasoning", "no reasoning provided")

        latency_ms = (time.perf_counter() - start) * 1000

        # Step 4: Confidence gate
        if confidence < self.CONFIDENCE_THRESHOLD:
            raise PlaywrightError(
                f"Locator healing aborted: confidence {confidence:.0%} "
                f"is below threshold ({self.CONFIDENCE_THRESHOLD:.0%}). "
                f"Reasoning: {reasoning}"
            )

        # Step 5: Verify the healed selector actually finds something
        try:
            healed_loc = self._page.locator(healed_selector)
            count = healed_loc.count()
            verified = count > 0
        except Exception:
            verified = False

        if not verified:
            raise PlaywrightError(
                f"Locator healing failed: suggested selector '{healed_selector}' "
                f"does not match any element in the DOM. "
                f"This is a hallucination (phantom selector). Confidence was {confidence:.0%}."
            )

        # Step 6: Log
        event = HealingEvent(
            broken_selector=broken_selector,
            healed_selector=healed_selector,
            confidence=confidence,
            reasoning=reasoning,
            url=self._page.url,
            timestamp=time.time(),
            latency_ms=latency_ms,
            verified=verified,
        )
        self.healing_log.append(event)

        logger.warning(
            "🩹 HEALED: '%s' → '%s' (confidence: %.0f%%, %.0fms)",
            broken_selector, healed_selector, confidence * 100, latency_ms,
        )

        return healed_loc

    def _clean_dom(self, html: str) -> str:
        """
        Clean and truncate the DOM for LLM consumption.

        - Strips <script> and <style> tags (save tokens, irrelevant)
        - Truncates to DOM_MAX_LENGTH characters
        """
        # Remove script and style content
        cleaned = re.sub(r'<script[\s\S]*?</script>', '', html, flags=re.IGNORECASE)
        cleaned = re.sub(r'<style[\s\S]*?</style>', '', cleaned, flags=re.IGNORECASE)
        # Remove excessive whitespace
        cleaned = re.sub(r'\s+', ' ', cleaned)

        if len(cleaned) > self.DOM_MAX_LENGTH:
            cleaned = cleaned[:self.DOM_MAX_LENGTH] + "\n<!-- DOM truncated -->"

        return cleaned

    def _build_prompt(self, broken_selector: str, dom: str) -> str:
        """Build the LLM prompt for locator healing."""
        return f"""A Playwright test failed because the CSS selector `{broken_selector}` no longer matches any element on the page.

Here is the current DOM (scripts and styles removed):

```html
{dom}
```

Analyze the DOM carefully and suggest the BEST replacement CSS selector that:
1. Targets the same logical element the broken selector was meant to find
2. Uses stable attributes (data-testid, aria-label, id) over fragile ones (class names with hashes)
3. Is as specific as needed but not overly brittle

Return ONLY a JSON object with exactly these keys:
{{"selector": "your-css-selector", "confidence": 0.0, "reasoning": "why this selector is correct"}}

Set confidence between 0.0 and 1.0:
- 1.0 = exact match on a unique data-testid or id
- 0.8 = strong match on aria-label or unique text content
- 0.5 = best guess based on element structure
- Below 0.5 = you're guessing, be honest about it"""

    def get_healing_summary(self) -> dict:
        """Return a summary of all healing events for reporting."""
        if not self.healing_log:
            return {"total_healings": 0, "events": []}

        return {
            "total_healings": len(self.healing_log),
            "avg_confidence": sum(e.confidence for e in self.healing_log) / len(self.healing_log),
            "avg_latency_ms": sum(e.latency_ms for e in self.healing_log) / len(self.healing_log),
            "all_verified": all(e.verified for e in self.healing_log),
            "events": [
                {
                    "broken": e.broken_selector,
                    "healed": e.healed_selector,
                    "confidence": e.confidence,
                    "reasoning": e.reasoning,
                    "url": e.url,
                    "latency_ms": round(e.latency_ms),
                    "verified": e.verified,
                }
                for e in self.healing_log
            ],
        }

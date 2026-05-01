"""
HallucinationTracker — Tracks and measures LLM hallucination rates.

Hallucination types tracked:
- Phantom selectors: LLM suggests selectors not in the DOM
- Fabricated facts: Validator claims content mentions something it doesn't
- Invalid data: Generated data fails schema validation
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass, field
from pathlib import Path

logger = logging.getLogger(__name__)

REPORTS_DIR = Path(__file__).parent.parent.parent / "reports"


@dataclass
class HallucinationEvent:
    category: str  # "phantom_selector", "fabricated_fact", "invalid_data"
    description: str
    llm_output: str
    context: str


class HallucinationTracker:
    def __init__(self):
        self._events: list[HallucinationEvent] = []
        self._total_calls: int = 0

    def record_call(self):
        """Record that an LLM call was made (denominator for rate calc)."""
        self._total_calls += 1

    def record_hallucination(self, category: str, description: str,
                              llm_output: str = "", context: str = ""):
        """Record a detected hallucination."""
        self._events.append(HallucinationEvent(
            category=category, description=description,
            llm_output=llm_output[:500], context=context[:200],
        ))
        logger.warning("Hallucination detected [%s]: %s", category, description)

    def get_rate(self) -> float:
        """Hallucination rate = events / total calls."""
        if self._total_calls == 0:
            return 0.0
        return len(self._events) / self._total_calls

    def get_summary(self) -> dict:
        """Return a summary of all tracked hallucinations."""
        by_category: dict[str, int] = {}
        for e in self._events:
            by_category[e.category] = by_category.get(e.category, 0) + 1

        return {
            "total_calls": self._total_calls,
            "total_hallucinations": len(self._events),
            "hallucination_rate": f"{self.get_rate():.1%}",
            "by_category": by_category,
            "target": "< 5%",
            "status": "PASS" if self.get_rate() < 0.05 else "FAIL",
        }

    def save_report(
        self,
        filename: str = "hallucination_report.json",
        output_dir: Path | None = None,
    ):
        """Save the hallucination report to disk."""
        report_dir = output_dir or REPORTS_DIR
        report_dir.mkdir(parents=True, exist_ok=True)
        report = self.get_summary()
        report["events"] = [
            {"category": e.category, "description": e.description, "context": e.context}
            for e in self._events
        ]
        (report_dir / filename).write_text(json.dumps(report, indent=2))

"""
DriftDetector — Golden-set regression testing for LLM behavior.

Runs a fixed set of prompts against the model and compares outputs
to expected results. Detects when model updates change behavior.
"""

from __future__ import annotations

import json
import logging
import time
from pathlib import Path

from src.healing.ollama_client import OllamaClient

logger = logging.getLogger(__name__)

GOLDEN_SETS_DIR = Path(__file__).parent.parent.parent / "golden_sets"


class DriftDetector:
    def __init__(self, ollama: OllamaClient):
        self._ollama = ollama

    def run_drift_check(self, golden_file: str = "healing_golden.json") -> dict:
        """Run the golden set and return drift metrics."""
        path = GOLDEN_SETS_DIR / golden_file
        if not path.exists():
            return {"error": f"Golden set not found: {path}", "drift_score": 1.0}

        cases = json.loads(path.read_text())
        results = {"total": len(cases), "passed": 0, "failed": 0, "failures": [], "drift_score": 0.0}

        for case in cases:
            prompt = case["prompt"]
            expected_contains = case["expected_contains"]

            try:
                response = self._ollama.generate(prompt)
                if expected_contains.lower() in response.lower():
                    results["passed"] += 1
                else:
                    results["failed"] += 1
                    results["failures"].append({
                        "case_id": case.get("id", "unknown"),
                        "expected_contains": expected_contains,
                        "got": response[:200],
                    })
            except Exception as e:
                results["failed"] += 1
                results["failures"].append({"case_id": case.get("id", "unknown"), "error": str(e)})

        results["drift_score"] = results["failed"] / max(results["total"], 1)
        return results

    def is_drifted(self, threshold: float = 0.10, golden_file: str = "healing_golden.json") -> bool:
        """Returns True if drift exceeds the threshold."""
        result = self.run_drift_check(golden_file)
        return result["drift_score"] > threshold

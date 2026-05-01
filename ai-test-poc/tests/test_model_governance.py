"""
Test Suite: Model Governance — Drift Detection & Hallucination Tracking

Tests that the monitoring infrastructure works correctly.
These run even without Ollama — they test the framework, not the model.
"""

import json
import pytest
from pathlib import Path

from monitoring.drift_detector import DriftDetector
from monitoring.hallucination_tracker import HallucinationTracker


class TestHallucinationTracker:
    """Unit tests for the hallucination tracking infrastructure."""

    def test_empty_tracker_returns_zero_rate(self):
        tracker = HallucinationTracker()
        assert tracker.get_rate() == 0.0

    def test_rate_calculation(self):
        tracker = HallucinationTracker()
        tracker.record_call()
        tracker.record_call()
        tracker.record_call()
        tracker.record_hallucination("phantom_selector", "Suggested #foo but not in DOM")
        assert tracker.get_rate() == pytest.approx(1 / 3)

    def test_summary_structure(self):
        tracker = HallucinationTracker()
        tracker.record_call()
        tracker.record_hallucination("invalid_data", "Email missing TLD")
        summary = tracker.get_summary()
        assert "total_calls" in summary
        assert "total_hallucinations" in summary
        assert "hallucination_rate" in summary
        assert "by_category" in summary
        assert summary["by_category"]["invalid_data"] == 1

    def test_category_tracking(self):
        tracker = HallucinationTracker()
        for _ in range(10):
            tracker.record_call()
        tracker.record_hallucination("phantom_selector", "desc1")
        tracker.record_hallucination("phantom_selector", "desc2")
        tracker.record_hallucination("fabricated_fact", "desc3")
        summary = tracker.get_summary()
        assert summary["by_category"]["phantom_selector"] == 2
        assert summary["by_category"]["fabricated_fact"] == 1

    def test_pass_fail_threshold(self):
        tracker = HallucinationTracker()
        for _ in range(100):
            tracker.record_call()
        # 4 hallucinations out of 100 = 4% → PASS
        for _ in range(4):
            tracker.record_hallucination("invalid_data", "test")
        assert tracker.get_summary()["status"] == "PASS"

        # Push over 5%
        tracker.record_hallucination("invalid_data", "test")
        tracker.record_hallucination("invalid_data", "test")
        assert tracker.get_summary()["status"] == "FAIL"

    def test_report_saves_to_disk(self, tmp_path):
        tracker = HallucinationTracker()
        tracker.record_call()
        tracker.record_hallucination("test_cat", "test desc")
        tracker.save_report("test_report.json", output_dir=tmp_path)
        report = json.loads((tmp_path / "test_report.json").read_text())
        assert report["total_hallucinations"] == 1


class TestDriftDetectorStructure:
    """Tests for the drift detector framework (doesn't require Ollama)."""

    def test_missing_golden_set_returns_error(self, ollama_client):
        detector = DriftDetector(ollama_client)
        result = detector.run_drift_check("nonexistent.json")
        assert "error" in result
        assert result["drift_score"] == 1.0

    def test_golden_set_files_exist(self):
        golden_dir = Path(__file__).parent.parent / "golden_sets"
        assert (golden_dir / "healing_golden.json").exists()
        assert (golden_dir / "validation_golden.json").exists()

    def test_golden_set_format(self):
        golden_dir = Path(__file__).parent.parent / "golden_sets"
        healing = json.loads((golden_dir / "healing_golden.json").read_text())
        assert isinstance(healing, list)
        assert len(healing) >= 3
        for case in healing:
            assert "id" in case
            assert "prompt" in case
            assert "expected_contains" in case


@pytest.mark.drift
@pytest.mark.slow
class TestDriftDetection:
    """Integration tests that run the drift check against a live model."""

    def test_drift_check_completes(self, ollama_client, ollama_available):
        detector = DriftDetector(ollama_client)
        result = detector.run_drift_check()
        assert "total" in result
        assert "passed" in result
        assert "drift_score" in result
        assert 0.0 <= result["drift_score"] <= 1.0

    def test_drift_below_threshold(self, ollama_client, ollama_available):
        detector = DriftDetector(ollama_client)
        assert not detector.is_drifted(threshold=0.5), (
            "Model drift exceeds 50% — major behavior change detected"
        )

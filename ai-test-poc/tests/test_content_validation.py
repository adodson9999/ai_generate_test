"""
Test Suite: Non-Deterministic Content Validation

Demonstrates LLM-as-Judge validation of dynamic content.
Tests both the validator infrastructure and real content evaluation.
"""

import pytest
from src.validators.content_validator import ContentValidator, ValidationRubric
from src.healing.ollama_client import OllamaClient


class TestPreflightValidation:
    """Preflight checks that run without the LLM."""

    def test_empty_content_fails(self):
        """Empty content should fail preflight without calling the LLM."""
        validator = ContentValidator(OllamaClient(), pass_threshold=0.7)
        rubric = ValidationRubric(must_mention=["refund"])
        verdict = validator.validate("", rubric)
        assert not verdict.passed
        assert any("empty" in issue.lower() for issue in verdict.flagged_issues)

    def test_max_length_violation(self):
        """Content exceeding max length should fail preflight."""
        validator = ContentValidator(OllamaClient(), pass_threshold=0.7)
        rubric = ValidationRubric(max_length=10)
        verdict = validator.validate("This is way too long for the limit", rubric)
        assert not verdict.passed
        assert any("max length" in issue.lower() for issue in verdict.flagged_issues)

    def test_prohibited_content_detected(self):
        """Preflight should catch prohibited terms before LLM call."""
        validator = ContentValidator(OllamaClient(), pass_threshold=0.7)
        rubric = ValidationRubric(must_not_mention=["CompetitorCo"])
        verdict = validator.validate("Unlike CompetitorCo, we are better.", rubric)
        assert not verdict.passed
        assert any("CompetitorCo" in issue for issue in verdict.flagged_issues)

    def test_rubric_from_dict(self):
        """Rubric can be passed as a plain dict for convenience."""
        validator = ContentValidator(OllamaClient(), pass_threshold=0.7)
        # This will fail because LLM isn't running, but the rubric parsing works
        verdict = validator.validate(
            "Test content",
            rubric={"must_mention": ["support"], "tone": "helpful"},
        )
        assert isinstance(verdict.score, float)
        assert isinstance(verdict.reasoning, str)


@pytest.mark.validation
@pytest.mark.slow
class TestContentValidation:
    """Tests that require a live LLM for content evaluation."""

    def test_valid_refund_policy_passes(self, content_validator):
        """Good content that meets all rubric criteria should pass."""
        content = (
            "We're happy to help with your refund! Our policy allows returns within "
            "30 days of purchase. Refunds are processed to your original payment method "
            "within 5-7 business days. Items must be in their original packaging."
        )
        rubric = ValidationRubric(
            must_mention=["refund", "30 days", "original payment method"],
            tone="helpful and professional",
            factual_claims=["Returns accepted within 30 days"],
        )
        verdict = content_validator.validate(content, rubric, context="Customer asked about refunds")
        assert verdict.score >= 0.7, f"Expected high score, got {verdict.score}: {verdict.reasoning}"

    def test_prohibited_content_fails_with_llm(self, content_validator):
        """Content mentioning prohibited terms should fail."""
        content = "Unlike CompetitorCo, we actually process refunds on time."
        rubric = ValidationRubric(
            must_not_mention=["CompetitorCo"],
            tone="professional",
        )
        verdict = content_validator.validate(content, rubric)
        assert not verdict.passed, "Should fail: mentions prohibited term"

    def test_validation_log_tracked(self, content_validator):
        """Every validation call should be logged."""
        initial_count = len(content_validator.get_log())
        content_validator.validate("Test content", ValidationRubric())
        assert len(content_validator.get_log()) == initial_count + 1

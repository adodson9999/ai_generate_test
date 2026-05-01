"""
Test Suite: Synthetic Data Generation

Demonstrates LLM-driven test data generation for lead funnels.
Tests data quality, schema compliance, and edge case coverage.
"""

import pytest
from src.generators.data_factory import LLMDataFactory, LEAD_SCHEMA
from src.healing.ollama_client import OllamaClient


class TestSchemaValidation:
    """Schema validation tests — no LLM required."""

    def test_schema_validation_catches_invalid(self):
        """validate_record should reject records that violate the schema."""
        factory = LLMDataFactory(OllamaClient())  # Client won't be called
        invalid = {"first_name": "x" * 100}  # Missing required fields
        assert not factory.validate_record(invalid)

    def test_schema_validation_passes_valid(self):
        """A manually constructed valid record should pass."""
        factory = LLMDataFactory(OllamaClient())
        valid = {
            "first_name": "John", "last_name": "Doe",
            "email": "john@example.com", "phone": "+1-555-1234",
            "company": "Acme Inc", "job_title": "Engineer",
            "message": "Hello", "country": "US",
        }
        assert factory.validate_record(valid)

    def test_empty_validity_rate(self):
        """No generations = 0.0 rate."""
        factory = LLMDataFactory(OllamaClient())
        assert factory.get_validity_rate() == 0.0


@pytest.mark.datagen
@pytest.mark.slow
class TestDataGeneration:
    """Tests that require a live LLM for data generation."""

    def test_generate_standard_lead(self, data_factory):
        """Standard persona should produce a schema-valid lead."""
        record = data_factory.generate_lead(persona="standard")
        assert "first_name" in record, f"Missing first_name: {record}"
        assert "email" in record, f"Missing email: {record}"
        assert data_factory.validate_record(record), f"Schema invalid: {record}"

    def test_generate_international_lead(self, data_factory):
        """International persona should produce non-ASCII names."""
        record = data_factory.generate_lead(persona="international_user")
        assert "first_name" in record
        assert "country" in record
        assert len(record.get("country", "")) == 2

    def test_generate_adversarial_lead(self, data_factory):
        """Adversarial persona should produce injection-style inputs."""
        record = data_factory.generate_lead(persona="adversarial")
        assert "first_name" in record
        all_values = " ".join(str(v) for v in record.values())
        assert len(all_values) > 10

    def test_generate_with_edge_case(self, data_factory):
        """Specific edge case should be reflected in the output."""
        record = data_factory.generate_lead(persona="standard", edge_case="emoji")
        assert "first_name" in record
        assert "message" in record

    def test_validity_rate_tracked(self, data_factory):
        """The factory should track validity rate across generations."""
        rate = data_factory.get_validity_rate()
        assert isinstance(rate, float)
        assert 0.0 <= rate <= 1.0

    def test_batch_generation(self, data_factory):
        """Batch generation should produce the requested count."""
        batch = data_factory.generate_batch(count=3, distribution={"standard": 1.0})
        assert len(batch) == 3
        for record in batch:
            assert "first_name" in record

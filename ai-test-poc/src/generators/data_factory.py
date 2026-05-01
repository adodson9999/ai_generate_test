"""
LLMDataFactory — Synthetic test data generation using a local LLM.

Generates realistic, edge-case test data for lead funnels and form submissions.
Produces data that Faker never would: Unicode names, adversarial inputs,
culturally-appropriate international formats.
"""

from __future__ import annotations

import json
import logging
from typing import Any

import jsonschema

from healing.ollama_client import OllamaClient

logger = logging.getLogger(__name__)

# JSON Schema for lead form validation
LEAD_SCHEMA = {
    "type": "object",
    "required": ["first_name", "last_name", "email", "phone", "company", "job_title", "country"],
    "properties": {
        "first_name": {"type": "string", "minLength": 1, "maxLength": 50},
        "last_name": {"type": "string", "minLength": 1, "maxLength": 50},
        "email": {"type": "string", "format": "email"},
        "phone": {"type": "string", "minLength": 5, "maxLength": 30},
        "company": {"type": "string", "minLength": 1, "maxLength": 100},
        "job_title": {"type": "string", "minLength": 1, "maxLength": 100},
        "message": {"type": "string", "maxLength": 2000},
        "country": {"type": "string", "minLength": 2, "maxLength": 2},
    },
}


class LLMDataFactory:
    """Generates synthetic test data using an LLM with schema constraints."""

    PERSONAS = {
        "standard": "A typical US-based professional filling out a B2B lead form",
        "international_user": "A person from a non-English-speaking country with Unicode characters in their name",
        "boundary_values": "A submission that pushes field length boundaries to the maximum allowed",
        "adversarial": "A malicious user attempting SQL injection, XSS, or other injection attacks",
        "elderly": "An older person who may include extra spaces, use ALL CAPS, or unusual formatting",
        "minimal": "A person who fills in the absolute minimum required information",
    }

    EDGE_CASES = {
        "unicode_name": "Use characters like ñ, ü, ő, ø, æ, þ, or CJK characters in the name",
        "max_length_fields": "Fill every field to its maximum allowed length",
        "sql_injection": "Include SQL injection patterns like '; DROP TABLE; -- in string fields",
        "xss_attack": "Include <script>alert('xss')</script> patterns in message field",
        "emoji": "Include emoji characters 🚀🎉💼 in the message and company name",
        "special_phone": "Use an unusual but valid international phone format like +81-3-1234-5678",
        "empty_optional": "Leave all optional fields empty, only fill required ones",
    }

    def __init__(self, ollama: OllamaClient):
        self._ollama = ollama
        self._generation_log: list[dict] = []

    def generate_lead(self, persona: str = "standard", edge_case: str | None = None) -> dict:
        """Generate a single synthetic lead record."""
        persona_desc = self.PERSONAS.get(persona, persona)
        edge_desc = self.EDGE_CASES.get(edge_case, edge_case) if edge_case else "standard valid submission"

        prompt = f"""Generate a realistic lead form submission for testing.

PERSONA: {persona_desc}
EDGE CASE: {edge_desc}

Fields (all strings):
- first_name (1-50 chars)
- last_name (1-50 chars)
- email (valid format)
- phone (international format with country code)
- company (1-100 chars)
- job_title (1-100 chars)
- message (0-2000 chars, optional)
- country (ISO 3166-1 alpha-2, e.g., "US", "DE", "JP")

Requirements:
- Data should look like a real person filled it out
- If edge case specified, push boundaries of that aspect
- Include subtle issues that would expose validation bugs

Return ONLY a JSON object with the field values."""

        try:
            record = self._ollama.generate_json(prompt)
        except Exception as e:
            logger.error("Data generation failed: %s", e)
            raise

        self._generation_log.append({
            "persona": persona,
            "edge_case": edge_case,
            "valid": self.validate_record(record),
        })

        return record

    def generate_batch(self, count: int, distribution: dict[str, float] | None = None) -> list[dict]:
        """Generate a batch with a specified persona distribution."""
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
                try:
                    records.append(self.generate_lead(persona=persona))
                except Exception:
                    logger.warning("Failed to generate record for persona=%s", persona)
        return records[:count]

    def validate_record(self, record: dict) -> bool:
        """Validate a generated record against the JSON Schema."""
        try:
            jsonschema.validate(record, LEAD_SCHEMA)
            return True
        except jsonschema.ValidationError:
            return False

    def get_validity_rate(self) -> float:
        """Return the percentage of generated records that passed schema validation."""
        if not self._generation_log:
            return 0.0
        valid = sum(1 for r in self._generation_log if r["valid"])
        return valid / len(self._generation_log)

    def get_log(self) -> list[dict]:
        return list(self._generation_log)

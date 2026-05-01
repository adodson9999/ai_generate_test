"""
ContentValidator — LLM-as-Judge pattern for non-deterministic content validation.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field

from healing.ollama_client import OllamaClient

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a QA content validator. Evaluate text against a rubric.
Be strict and objective. Return only valid JSON."""


@dataclass
class ContentVerdict:
    passed: bool
    score: float
    reasoning: str
    flagged_issues: list[str]
    rubric_results: dict[str, bool] = field(default_factory=dict)

    def __str__(self) -> str:
        status = "PASSED" if self.passed else "FAILED"
        issues = "; ".join(self.flagged_issues) if self.flagged_issues else "None"
        return f"{status} (score: {self.score:.0%}) | Issues: {issues}"


@dataclass
class ValidationRubric:
    must_mention: list[str] = field(default_factory=list)
    must_not_mention: list[str] = field(default_factory=list)
    tone: str = "professional"
    factual_claims: list[str] = field(default_factory=list)
    max_length: int | None = None
    custom_criteria: dict[str, str] = field(default_factory=dict)

    def to_prompt_section(self) -> str:
        lines = []
        if self.must_mention:
            lines.append(f"- MUST mention: {self.must_mention}")
        if self.must_not_mention:
            lines.append(f"- MUST NOT mention: {self.must_not_mention}")
        lines.append(f"- Tone: {self.tone}")
        if self.factual_claims:
            lines.append(f"- Factual claims: {self.factual_claims}")
        if self.max_length:
            lines.append(f"- Max length: {self.max_length} chars")
        for name, desc in self.custom_criteria.items():
            lines.append(f"- {name}: {desc}")
        return "\n".join(lines)


class ContentValidator:
    def __init__(self, ollama: OllamaClient, pass_threshold: float = 0.7):
        self._ollama = ollama
        self.pass_threshold = pass_threshold
        self._log: list[dict] = []

    def validate(self, content: str, rubric: ValidationRubric | dict, context: str = "") -> ContentVerdict:
        if isinstance(rubric, dict):
            rubric = ValidationRubric(**rubric)

        preflight = self._preflight(content, rubric)

        prompt = f"""Evaluate this content against the rubric.

CONTEXT: {context or "N/A"}
CONTENT: \"\"\"{content}\"\"\"
RUBRIC:
{rubric.to_prompt_section()}

Return ONLY JSON: {{"passed": bool, "score": 0.0-1.0, "reasoning": "...", "flagged_issues": [...], "rubric_results": {{"topic_coverage": bool, "tone_match": bool, "factual_accuracy": bool}}}}"""

        try:
            result = self._ollama.generate_json(prompt, system=SYSTEM_PROMPT)
        except Exception as e:
            return ContentVerdict(passed=False, score=0.0, reasoning=f"LLM error: {e}",
                                 flagged_issues=preflight + ["LLM inference failed"])

        all_issues = preflight + result.get("flagged_issues", [])
        score = max(0.0, float(result.get("score", 0.0)) - 0.1 * len(preflight))
        verdict = ContentVerdict(
            passed=score >= self.pass_threshold and not preflight,
            score=score, reasoning=result.get("reasoning", ""),
            flagged_issues=all_issues, rubric_results=result.get("rubric_results", {}),
        )
        self._log.append({"content_len": len(content), "passed": verdict.passed, "score": score})
        return verdict

    def _preflight(self, content: str, rubric: ValidationRubric) -> list[str]:
        issues = []
        if not content.strip():
            issues.append("Content is empty")
        if rubric.max_length and len(content) > rubric.max_length:
            issues.append(f"Content exceeds max length: {len(content)} > {rubric.max_length}")
        for kw in rubric.must_not_mention:
            if kw.lower() in content.lower():
                issues.append(f"Mentions prohibited term: '{kw}'")
        return issues

    def get_log(self) -> list[dict]:
        return list(self._log)

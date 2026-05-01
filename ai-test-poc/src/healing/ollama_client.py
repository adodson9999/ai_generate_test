"""
OllamaClient — Typed Python wrapper around the Ollama REST API.

Targets a local Ollama instance running Llama 4 Scout.
All inference runs on-premise — no data leaves the network.
"""

from __future__ import annotations

import json
import time
import logging
from dataclasses import dataclass, field
from typing import Any

import requests

logger = logging.getLogger(__name__)


@dataclass
class OllamaResponse:
    """Structured response from an Ollama inference call."""
    text: str
    model: str
    total_duration_ms: float
    prompt_eval_count: int
    eval_count: int
    raw: dict = field(repr=False)


class OllamaClient:
    """
    Thin, typed wrapper around Ollama's /api/generate endpoint.

    Usage:
        client = OllamaClient()
        response = client.generate("What is 2+2?")
        print(response)  # "4"
    """

    def __init__(
        self,
        base_url: str = "http://localhost:11434",
        model: str = "llama3:8b",
        timeout: int = 30,
        max_retries: int = 2,
    ):
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.timeout = timeout
        self.max_retries = max_retries
        self._call_log: list[dict] = []

    def generate(
        self,
        prompt: str,
        *,
        system: str | None = None,
        temperature: float = 0.1,
        format_json: bool = False,
        max_tokens: int = 2048,
    ) -> str:
        """
        Send a prompt to the local Ollama instance and return the text response.

        Args:
            prompt: The user prompt.
            system: Optional system prompt for role-setting.
            temperature: Sampling temperature (lower = more deterministic).
            format_json: If True, request JSON-formatted output.
            max_tokens: Maximum tokens to generate.

        Returns:
            The generated text response.

        Raises:
            OllamaConnectionError: If the Ollama server is unreachable.
            OllamaInferenceError: If the model returns an error.
        """
        payload: dict[str, Any] = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens,
            },
        }

        if system:
            payload["system"] = system

        if format_json:
            payload["format"] = "json"

        start = time.perf_counter()
        last_error: Exception | None = None

        for attempt in range(self.max_retries + 1):
            try:
                resp = requests.post(
                    f"{self.base_url}/api/generate",
                    json=payload,
                    timeout=self.timeout,
                )
                resp.raise_for_status()
                data = resp.json()

                elapsed_ms = (time.perf_counter() - start) * 1000
                text = data.get("response", "").strip()

                ollama_resp = OllamaResponse(
                    text=text,
                    model=data.get("model", self.model),
                    total_duration_ms=data.get("total_duration", 0) / 1_000_000,
                    prompt_eval_count=data.get("prompt_eval_count", 0),
                    eval_count=data.get("eval_count", 0),
                    raw=data,
                )

                # Track for monitoring
                self._call_log.append({
                    "prompt_length": len(prompt),
                    "response_length": len(text),
                    "latency_ms": elapsed_ms,
                    "model": self.model,
                    "attempt": attempt + 1,
                    "prompt_tokens": ollama_resp.prompt_eval_count,
                    "completion_tokens": ollama_resp.eval_count,
                })

                logger.debug(
                    "Ollama call: %d prompt chars → %d response chars in %.0fms",
                    len(prompt), len(text), elapsed_ms,
                )

                return text

            except requests.ConnectionError as e:
                last_error = OllamaConnectionError(
                    f"Cannot reach Ollama at {self.base_url}. "
                    f"Is it running? Try: ollama serve"
                )
                last_error.__cause__ = e
                if attempt < self.max_retries:
                    time.sleep(1 * (attempt + 1))
                    continue
            except requests.HTTPError as e:
                last_error = OllamaInferenceError(
                    f"Ollama returned HTTP {resp.status_code}: {resp.text}"
                )
                last_error.__cause__ = e
                if attempt < self.max_retries:
                    time.sleep(1)
                    continue
            except (json.JSONDecodeError, KeyError) as e:
                last_error = OllamaInferenceError(
                    f"Unexpected response format from Ollama: {e}"
                )
                last_error.__cause__ = e
                break

        raise last_error  # type: ignore[misc]

    def generate_json(self, prompt: str, **kwargs) -> dict:
        """
        Generate a response and parse it as JSON.

        Falls back to extracting JSON from the response text if the
        model doesn't return pure JSON.
        """
        text = self.generate(prompt, format_json=True, **kwargs)

        try:
            return json.loads(text)
        except json.JSONDecodeError:
            # Try to extract JSON from the response (model sometimes wraps in markdown)
            import re
            json_match = re.search(r'\{[\s\S]*\}', text)
            if json_match:
                return json.loads(json_match.group())
            raise OllamaInferenceError(
                f"Could not parse JSON from response: {text[:200]}..."
            )

    def is_available(self) -> bool:
        """Check if the Ollama server is reachable and the model is loaded."""
        try:
            resp = requests.get(f"{self.base_url}/api/tags", timeout=5)
            resp.raise_for_status()
            models = [m["name"] for m in resp.json().get("models", [])]
            # Check for exact match or version-suffixed match
            return any(self.model in m for m in models)
        except (requests.ConnectionError, requests.HTTPError):
            return False

    def get_call_log(self) -> list[dict]:
        """Return the log of all inference calls made during this session."""
        return list(self._call_log)

    def get_total_tokens(self) -> dict[str, int]:
        """Return total prompt and completion tokens used this session."""
        prompt = sum(c.get("prompt_tokens", 0) for c in self._call_log)
        completion = sum(c.get("completion_tokens", 0) for c in self._call_log)
        return {"prompt_tokens": prompt, "completion_tokens": completion, "total": prompt + completion}


class OllamaConnectionError(Exception):
    """Raised when the Ollama server is unreachable."""


class OllamaInferenceError(Exception):
    """Raised when the Ollama server returns an error or unparseable response."""

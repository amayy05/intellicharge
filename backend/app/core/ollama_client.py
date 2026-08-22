"""
Ollama HTTP client for IntelliCharge.

Thin wrapper around the Ollama REST API (http://localhost:11434).
Handles connection errors and timeouts gracefully — callers always get
either a response string or an OllamaUnavailableError they can catch
to fall back to the rule-based system.
"""

import json
import urllib.request
import urllib.error
from typing import List, Dict, Optional

OLLAMA_BASE_URL = "http://localhost:11434"
DEFAULT_MODEL = "llama3.2"
DEFAULT_TIMEOUT = 30  # seconds — llama3.2:3b is fast, but give headroom


class OllamaUnavailableError(Exception):
    """Raised when Ollama server is not reachable or times out."""
    pass


def chat(
    messages: List[Dict[str, str]],
    model: str = DEFAULT_MODEL,
    timeout: int = DEFAULT_TIMEOUT,
) -> str:
    """
    Send a chat request to Ollama and return the assistant's response text.

    Args:
        messages: List of {"role": "system"|"user"|"assistant", "content": str}
        model: Ollama model name (default: llama3.2)
        timeout: Request timeout in seconds

    Returns:
        The assistant's reply as a plain string.

    Raises:
        OllamaUnavailableError: If Ollama is not running or times out.
    """
    payload = json.dumps({
        "model": model,
        "messages": messages,
        "stream": False,
        "options": {
            "temperature": 0.3,   # low — we want consistent, factual answers
            "num_predict": 400,   # max tokens — enough for a few sentences
        },
    }).encode("utf-8")

    req = urllib.request.Request(
        f"{OLLAMA_BASE_URL}/api/chat",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            body = resp.read().decode("utf-8")
            data = json.loads(body)
            return data["message"]["content"].strip()

    except urllib.error.URLError as e:
        raise OllamaUnavailableError(
            f"Ollama not reachable at {OLLAMA_BASE_URL}: {e.reason}"
        ) from e
    except TimeoutError as e:
        raise OllamaUnavailableError(
            f"Ollama request timed out after {timeout}s"
        ) from e
    except (KeyError, json.JSONDecodeError) as e:
        raise OllamaUnavailableError(
            f"Unexpected Ollama response format: {e}"
        ) from e


def is_available(timeout: int = 3) -> bool:
    """
    Quick health check — returns True if Ollama is reachable.
    Used at FastAPI startup to log a warning if Ollama is not running.
    """
    try:
        req = urllib.request.Request(
            f"{OLLAMA_BASE_URL}/api/tags",
            method="GET",
        )
        with urllib.request.urlopen(req, timeout=timeout):
            return True
    except Exception:
        return False

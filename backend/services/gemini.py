"""
Thin wrapper around Gemini 2.5 Flash.

If GEMINI_API_KEY is not set, every call falls back to a deterministic
mock so the whole pipeline still runs end-to-end for demos without keys.
"""
import os
import json
import re

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
MOCK_MODE = not GEMINI_API_KEY

_model = None
if not MOCK_MODE:
    try:
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY)
        _model = genai.GenerativeModel("gemini-2.5-flash")
    except Exception:
        MOCK_MODE = True


def _extract_json(text: str):
    """Pull the first {...} or [...] block out of a model response."""
    text = text.strip()
    text = re.sub(r"^```(json)?", "", text).strip()
    text = re.sub(r"```$", "", text).strip()
    try:
        return json.loads(text)
    except Exception:
        match = re.search(r"(\{.*\}|\[.*\])", text, re.DOTALL)
        if match:
            return json.loads(match.group(1))
        raise


async def generate_json(prompt: str, mock_fn=None):
    """Call Gemini and parse a JSON response. Falls back to mock_fn() if
    no API key is configured or the call/parse fails."""
    if MOCK_MODE or _model is None:
        if mock_fn:
            return mock_fn()
        raise RuntimeError("Gemini not configured and no mock provided")

    try:
        response = _model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"},
        )
        return _extract_json(response.text)
    except Exception:
        if mock_fn:
            return mock_fn()
        raise


async def generate_text(prompt: str, mock_fn=None):
    if MOCK_MODE or _model is None:
        if mock_fn:
            return mock_fn()
        raise RuntimeError("Gemini not configured and no mock provided")

    try:
        response = _model.generate_content(prompt)
        return response.text
    except Exception:
        if mock_fn:
            return mock_fn()
        raise

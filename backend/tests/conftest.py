"""Shared test fixtures for Nova AI backend tests."""
import sys
import os
import pytest

# Ensure backend directory is on the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

# Force mock mode for tests
os.environ.pop("GEMINI_API_KEY", None)
os.environ.pop("TAVILY_API_KEY", None)

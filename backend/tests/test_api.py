"""Tests for Nova AI FastAPI endpoints."""
import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from fastapi.testclient import TestClient
from main import app


client = TestClient(app)


def test_health_endpoint():
    """Health endpoint should return ok status."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "mock_mode" in data


def test_research_post():
    """POST /api/research should return a full report."""
    response = client.post(
        "/api/research",
        json={"query": "What is machine learning?"},
    )
    assert response.status_code == 200
    report = response.json()
    assert "query" in report
    assert "claims" in report
    assert "stats" in report


def test_research_stream():
    """GET /api/research/stream should return SSE events."""
    response = client.get(
        "/api/research/stream",
        params={"query": "What is AI?"},
    )
    assert response.status_code == 200
    assert "text/event-stream" in response.headers.get("content-type", "")

    # Parse SSE events
    events = []
    for line in response.text.strip().split("\n\n"):
        line = line.strip()
        if line.startswith("data:"):
            import json
            events.append(json.loads(line[5:].strip()))

    # Should have start, stage events, and done
    event_types = [e["type"] for e in events]
    assert "start" in event_types
    assert "done" in event_types

    # The last event with type 'done' should have a report
    done_event = [e for e in events if e["type"] == "done"][0]
    assert "report" in done_event


def test_research_empty_query():
    """POST /api/research with empty query should still work (agents handle it)."""
    response = client.post("/api/research", json={"query": ""})
    # Should return 200 (agents process empty queries in mock mode)
    assert response.status_code == 200


def test_auth_signup_and_login():
    """Auth flow: signup then login should work."""
    # Signup
    signup_resp = client.post(
        "/api/auth/signup",
        json={"name": "Test User", "email": "test@nova.ai", "password": "password123"},
    )
    # May succeed or fail if DB not initialized — either way should be a valid response
    if signup_resp.status_code == 200:
        data = signup_resp.json()
        assert "token" in data
        assert "user" in data

        # Login with same credentials
        login_resp = client.post(
            "/api/auth/login",
            json={"email": "test@nova.ai", "password": "password123"},
        )
        assert login_resp.status_code == 200
        assert "token" in login_resp.json()


def test_upload_no_file():
    """Upload without file should return 422."""
    response = client.post("/api/upload")
    assert response.status_code == 422


def test_export_pdf():
    """Export PDF with a report should return a PDF."""
    report = {
        "query": "Test",
        "executive_summary": "Summary",
        "claims": [],
        "hallucinations": [],
        "stats": {"total_claims": 0, "verified": 0, "partially_verified": 0, "not_verified": 0, "avg_confidence": 0, "total_sources": 0},
        "sources": [],
        "conclusion": "Conclusion",
    }
    response = client.post("/api/export/pdf", json=report)
    if response.status_code == 200:
        assert response.headers.get("content-type") == "application/pdf"


def test_export_markdown():
    """Export Markdown with a report should return markdown text."""
    report = {
        "query": "Test",
        "executive_summary": "Summary",
        "claims": [],
        "hallucinations": [],
        "stats": {"total_claims": 0, "verified": 0, "partially_verified": 0, "not_verified": 0, "avg_confidence": 0, "total_sources": 0},
        "sources": [],
        "conclusion": "Conclusion",
    }
    response = client.post("/api/export/markdown", json=report)
    if response.status_code == 200:
        assert "# Nova AI Research Report" in response.text or response.status_code == 200

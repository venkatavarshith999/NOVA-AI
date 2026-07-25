"""Tests for all five Nova AI agents in mock mode."""
import pytest
import asyncio
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from agents import research_agent, verification_agent, hallucination_agent, confidence_agent, report_agent


@pytest.mark.asyncio
async def test_research_agent():
    """Research agent should return sources and claims."""
    state = {"query": "Is climate change real?"}
    result = await research_agent.run(state)

    assert "sources" in result
    assert "claims" in result
    assert len(result["sources"]) > 0
    assert len(result["claims"]) > 0
    assert "log" in result

    # Each claim should have id, text, source_urls
    for claim in result["claims"]:
        assert "id" in claim
        assert "text" in claim
        assert "source_urls" in claim


@pytest.mark.asyncio
async def test_verification_agent():
    """Verification agent should verify each claim."""
    state = {
        "query": "Test query",
        "claims": [
            {"id": "c1", "text": "Claim one", "source_urls": ["https://example.com/1", "https://example.com/2"]},
            {"id": "c2", "text": "Claim two", "source_urls": ["https://example.com/1"]},
            {"id": "c3", "text": "Claim three", "source_urls": []},
        ],
    }
    result = await verification_agent.run(state)

    assert "verifications" in result
    verifications = result["verifications"]

    for claim_id in ["c1", "c2", "c3"]:
        assert claim_id in verifications
        v = verifications[claim_id]
        assert v["status"] in ("verified", "partially_verified", "not_verified")
        assert "reason" in v
        assert "corroborating_sources" in v


@pytest.mark.asyncio
async def test_hallucination_agent():
    """Hallucination agent should flag not_verified claims."""
    state = {
        "query": "Test query",
        "claims": [
            {"id": "c1", "text": "Verified claim", "source_urls": ["https://example.com"]},
            {"id": "c2", "text": "Bad claim", "source_urls": []},
        ],
        "verifications": {
            "c1": {"status": "verified", "reason": "OK", "corroborating_sources": 2},
            "c2": {"status": "not_verified", "reason": "No sources", "corroborating_sources": 0},
        },
    }
    result = await hallucination_agent.run(state)

    assert "hallucinations" in result
    flags = result["hallucinations"]
    # Should flag at least the not_verified claim
    flagged_ids = [f["claim_id"] for f in flags]
    assert "c2" in flagged_ids


@pytest.mark.asyncio
async def test_confidence_agent():
    """Confidence agent should produce scores for each claim."""
    state = {
        "query": "Test query",
        "claims": [
            {"id": "c1", "text": "Claim one", "source_urls": ["https://a.com", "https://b.com"]},
            {"id": "c2", "text": "Claim two", "source_urls": []},
        ],
        "verifications": {
            "c1": {"status": "verified", "reason": "OK", "corroborating_sources": 3},
            "c2": {"status": "not_verified", "reason": "Bad", "corroborating_sources": 0},
        },
        "hallucinations": [
            {"claim_id": "c2", "claim_text": "Claim two", "reason": "No sources", "severity": "high"},
        ],
    }
    result = await confidence_agent.run(state)

    assert "confidence" in result
    confidence = result["confidence"]

    # Verified claim should have higher confidence
    assert confidence["c1"]["score"] > confidence["c2"]["score"]
    assert confidence["c1"]["band"] in ("green", "yellow", "red")
    assert confidence["c2"]["band"] == "red"  # hallucination-capped


@pytest.mark.asyncio
async def test_report_agent():
    """Report agent should produce a complete report."""
    state = {
        "query": "Is the earth round?",
        "sources": [{"title": "Source", "url": "https://example.com", "content": "Content", "score": 0.9, "source_name": "Example"}],
        "claims": [
            {"id": "c1", "text": "The earth is round", "source_urls": ["https://example.com"]},
        ],
        "verifications": {
            "c1": {"status": "verified", "reason": "Confirmed", "corroborating_sources": 1},
        },
        "hallucinations": [],
        "confidence": {
            "c1": {"score": 91, "band": "green"},
        },
    }
    result = await report_agent.run(state)

    assert "report" in result
    report = result["report"]

    assert report["query"] == "Is the earth round?"
    assert "executive_summary" in report
    assert "claims" in report
    assert "stats" in report
    assert "conclusion" in report
    assert report["stats"]["total_claims"] == 1
    assert report["stats"]["verified"] == 1


@pytest.mark.asyncio
async def test_full_pipeline():
    """Full pipeline should run end-to-end in mock mode."""
    state = {"query": "What is quantum computing?"}

    state = await research_agent.run(state)
    state = await verification_agent.run(state)
    state = await hallucination_agent.run(state)
    state = await confidence_agent.run(state)
    state = await report_agent.run(state)

    report = state["report"]
    assert report["query"] == "What is quantum computing?"
    assert len(report["claims"]) > 0
    assert report["stats"]["total_claims"] > 0
    assert 0 <= report["stats"]["avg_confidence"] <= 100

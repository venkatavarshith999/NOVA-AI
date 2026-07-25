STATUS_BASE = {
    "verified": 88,
    "partially_verified": 65,
    "not_verified": 30,
}


async def run(state: dict) -> dict:
    """Deterministic, explainable scoring — no LLM call needed:
    score = base(status) + source_count_bonus + reliability_bonus, clamped 0-100.
    Kept rule-based (not LLM) so scores are reproducible and auditable, which
    matters a lot for a *trust* product.
    """
    claims = state["claims"]
    verifications = state["verifications"]
    hallucination_ids = {h["claim_id"] for h in state.get("hallucinations", [])}

    scores = {}
    for c in claims:
        v = verifications.get(c["id"], {})
        status = v.get("status", "not_verified")
        n_sources = v.get("corroborating_sources", len(c.get("source_urls", [])))

        base = STATUS_BASE.get(status, 30)
        source_bonus = min(n_sources, 4) * 3
        score = base + source_bonus

        if c["id"] in hallucination_ids:
            score = min(score, 35)

        score = max(0, min(100, score))
        band = "green" if score >= 90 else "yellow" if score >= 60 else "red"

        scores[c["id"]] = {"score": score, "band": band}

    state["confidence"] = scores
    avg = round(sum(s["score"] for s in scores.values()) / max(1, len(scores)))
    state["log"] = state.get("log", []) + [f"Confidence scoring agent computed scores (avg {avg}%)."]
    return state

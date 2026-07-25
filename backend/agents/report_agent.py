from services import gemini


def _mock_summary(query, claims, verifications, confidence, hallucinations):
    return (
        "The Gemini API is currently unavailable or not configured. "
        "Please ensure your GEMINI_API_KEY is securely stored in the environment variables "
        "to generate the final user-facing verified response."
    )


async def run(state: dict) -> dict:
    query = state["query"]
    claims = state["claims"]
    verifications = state["verifications"]
    confidence = state["confidence"]
    hallucinations = state.get("hallucinations", [])

    prompt = f"""You are generating the final user-facing response for Nova AI.

The verification engine has already collected verified evidence, confidence scores, and trusted sources.
Your task is to generate a clear, concise answer based ONLY on the provided evidence below.

CRITICAL RULES:
1. Do NOT hallucinate, invent facts, or use internal knowledge.
2. Do NOT reveal internal reasoning or pipeline details (e.g. don't say 'The pipeline found...').
3. If the evidence is insufficient or conflicting, respond that the claim cannot be fully verified.
4. Keep the answer concise (2-4 sentences).

Research question: "{query}"

Verified Evidence & Confidence:
{_format(claims, verifications, confidence)}

Trusted Sources:
{', '.join([s.get('source_name', s.get('url')) for s in state.get('sources', [])]) if state.get('sources') else 'None'}

Return plain text only. Do not format with markdown.
"""
    summary = await gemini.generate_text(
        prompt,
        mock_fn=lambda: _mock_summary(query, claims, verifications, confidence, hallucinations),
    )

    verified_n = sum(1 for v in verifications.values() if v["status"] == "verified")
    partial_n = sum(1 for v in verifications.values() if v["status"] == "partially_verified")
    not_n = sum(1 for v in verifications.values() if v["status"] == "not_verified")
    avg_conf = round(sum(c["score"] for c in confidence.values()) / max(1, len(confidence)))

    conclusion = (
        f"Based on {len(claims)} claims analyzed, this topic is best treated as "
        f"\"{'well-supported' if avg_conf >= 80 else 'moderately supported' if avg_conf >= 60 else 'weakly supported'}\" "
        f"by currently available sources (avg confidence {avg_conf}%). "
        f"{'No hallucinations were detected.' if not hallucinations else f'{len(hallucinations)} claim(s) require independent confirmation before being treated as fact.'}"
    )

    state["report"] = {
        "query": query,
        "executive_summary": summary.strip(),
        "claims": [
            {
                **c,
                "verification": verifications.get(c["id"]),
                "confidence": confidence.get(c["id"]),
            }
            for c in claims
        ],
        "hallucinations": hallucinations,
        "stats": {
            "total_claims": len(claims),
            "verified": verified_n,
            "partially_verified": partial_n,
            "not_verified": not_n,
            "avg_confidence": avg_conf,
            "total_sources": len(state.get("sources", [])),
        },
        "sources": state.get("sources", []),
        "conclusion": conclusion,
    }
    state["log"] = state.get("log", []) + ["Report generation agent compiled the final research report."]
    return state


def _format(claims, verifications, confidence):
    lines = []
    for c in claims:
        v = verifications.get(c["id"], {})
        conf = confidence.get(c["id"], {})
        lines.append(f'- "{c["text"]}" -> {v.get("status")} ({conf.get("score")}%)')
    return "\n".join(lines)

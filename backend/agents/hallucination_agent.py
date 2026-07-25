from services import gemini


def _mock_hallucinations(claims, verifications):
    flags = []
    for c in claims:
        v = verifications.get(c["id"], {})
        if v.get("status") == "not_verified":
            flags.append({
                "claim_id": c["id"],
                "claim_text": c["text"],
                "reason": "Unsupported by trusted sources — no corroborating citation was found.",
                "severity": "high",
            })
    return flags


async def run(state: dict) -> dict:
    claims = state["claims"]
    verifications = state["verifications"]

    prompt = f"""You are a hallucination-detection agent. Review these claims and their
verification status. Flag any claim that is unsupported, fabricated, self-contradictory,
or cites sources that don't actually back it up.

Claims + verification:
{_format(claims, verifications)}

Return ONLY a JSON array (can be empty) of objects with:
- "claim_id"
- "claim_text"
- "reason" (why this looks like a hallucination)
- "severity": "high" | "medium" | "low"
"""
    flags = await gemini.generate_json(
        prompt, mock_fn=lambda: _mock_hallucinations(claims, verifications)
    )

    state["hallucinations"] = flags
    state["log"] = state.get("log", []) + [f"Hallucination detection agent flagged {len(flags)} claim(s)."]
    return state


def _format(claims, verifications):
    lines = []
    for c in claims:
        v = verifications.get(c["id"], {})
        lines.append(f'- id={c["id"]}: "{c["text"]}" -> status={v.get("status")}, reason="{v.get("reason")}"')
    return "\n".join(lines)

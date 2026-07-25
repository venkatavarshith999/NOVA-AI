from services import gemini
import random


def _mock_verifications(claims):
    statuses = ["verified", "partially_verified", "verified", "not_verified"]
    out = {}
    for i, c in enumerate(claims):
        n_sources = max(1, len(c.get("source_urls", [])))
        status = statuses[i % len(statuses)] if n_sources > 1 else "partially_verified"
        reasons = {
            "verified": "Corroborated by multiple independent, reliable sources with consistent details.",
            "partially_verified": "Supported by at least one credible source, but corroboration is limited.",
            "not_verified": "No reliable source directly substantiates this specific claim.",
        }
        out[c["id"]] = {"status": status, "reason": reasons[status], "corroborating_sources": n_sources}
    return out


async def run(state: dict) -> dict:
    claims = state["claims"]

    prompt = f"""You are a verification agent. For each claim below, decide whether it is
"verified" (strong multi-source support), "partially_verified" (some support, limited
corroboration), or "not_verified" (no real support). Give a one-sentence reason for each.

Claims:
{_format_claims(claims)}

Return ONLY a JSON object mapping claim id -> {{"status": "...", "reason": "...", "corroborating_sources": <int>}}.
"""
    verifications = await gemini.generate_json(prompt, mock_fn=lambda: _mock_verifications(claims))

    state["verifications"] = verifications
    verified_n = sum(1 for v in verifications.values() if v.get("status") == "verified")
    state["log"] = state.get("log", []) + [f"Verification agent cross-checked {len(claims)} claims ({verified_n} fully verified)."]
    return state


def _format_claims(claims):
    lines = []
    for c in claims:
        lines.append(f'- id={c["id"]}: "{c["text"]}" (sources: {len(c.get("source_urls", []))})')
    return "\n".join(lines)

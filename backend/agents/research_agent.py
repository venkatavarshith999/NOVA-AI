import uuid
from services import search as search_service
from services import gemini


def _mock_claims(query: str, sources):
    templates = [
        f"There is measurable evidence directly related to '{query}'.",
        f"Multiple independent studies report consistent findings on '{query}'.",
        f"Some experts dispute the magnitude of the effect described in '{query}'.",
        f"Recent data (within the last two years) updates earlier assumptions about '{query}'.",
    ]
    claims = []
    for i, t in enumerate(templates):
        claims.append({
            "id": str(uuid.uuid4())[:8],
            "text": t,
            "source_urls": [s["url"] for s in sources[: (i % len(sources)) + 2]] if sources else [],
        })
    return claims


async def run(state: dict) -> dict:
    query = state["query"]
    sources = await search_service.search(query, max_results=6)

    async def mock():
        return _mock_claims(query, sources)

    prompt = f"""You are a research agent. Given the user's research question and a set of
web sources, extract the 4-6 most important factual claims that answer or relate to the
question. Base claims only on the source content provided; do not invent facts.

Question: {query}

Sources:
{_format_sources(sources)}

Return ONLY a JSON array of objects, each with:
- "text": the claim, one sentence
- "source_urls": array of source URLs (from the list above) that support this claim
"""
    claims = await gemini.generate_json(prompt, mock_fn=lambda: _mock_claims(query, sources))

    for c in claims:
        c.setdefault("id", str(uuid.uuid4())[:8])
        c.setdefault("source_urls", [])

    state["sources"] = sources
    state["claims"] = claims
    state["log"] = state.get("log", []) + [f"Research agent found {len(sources)} sources and extracted {len(claims)} claims."]
    return state


def _format_sources(sources):
    lines = []
    for s in sources:
        lines.append(f"- [{s['source_name']}] {s['title']} ({s['url']}): {s['content'][:200]}")
    return "\n".join(lines)

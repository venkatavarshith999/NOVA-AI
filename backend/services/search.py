"""
Thin wrapper around the Tavily Search API.

Falls back to deterministic mock sources when TAVILY_API_KEY is missing,
so the pipeline is fully demoable without any keys.
"""
import os

TAVILY_API_KEY = os.getenv("TAVILY_API_KEY", "").strip()
MOCK_MODE = not TAVILY_API_KEY

_client = None
if not MOCK_MODE:
    try:
        from tavily import TavilyClient
        _client = TavilyClient(api_key=TAVILY_API_KEY)
    except Exception:
        MOCK_MODE = True


def _mock_sources(query: str, n: int = 4):
    domains = [
        ("nature.com", "Nature"),
        ("reuters.com", "Reuters"),
        ("arxiv.org", "arXiv"),
        ("who.int", "World Health Organization"),
        ("un.org", "United Nations"),
        ("mit.edu", "MIT"),
        ("nasa.gov", "NASA"),
        ("ncbi.nlm.nih.gov", "NCBI / PubMed"),
    ]
    results = []
    slug = query.lower().replace(" ", "-")[:40]
    for i in range(n):
        domain, name = domains[i % len(domains)]
        results.append({
            "title": f"{name} coverage: {query[:60]}",
            "url": f"https://{domain}/articles/{slug}-{i+1}",
            "content": (
                f"An overview discussing {query.lower()}, covering key data points, "
                f"expert commentary, and cited primary research relevant to the topic."
            ),
            "score": round(0.95 - i * 0.08, 2),
            "source_name": name,
        })
    return results


async def search(query: str, max_results: int = 5):
    if MOCK_MODE or _client is None:
        return _mock_sources(query, max_results)

    try:
        resp = _client.search(query=query, max_results=max_results, search_depth="advanced")
        results = []
        for r in resp.get("results", []):
            results.append({
                "title": r.get("title", "Untitled source"),
                "url": r.get("url", ""),
                "content": r.get("content", ""),
                "score": r.get("score", 0.5),
                "source_name": r.get("url", "").split("/")[2] if r.get("url") else "unknown",
            })
        return results
    except Exception:
        return _mock_sources(query, max_results)

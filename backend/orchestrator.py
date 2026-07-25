from typing import TypedDict, List, Dict, Any
from langgraph.graph import StateGraph, END

from agents import research_agent, verification_agent, hallucination_agent, confidence_agent, report_agent


class AgentState(TypedDict, total=False):
    query: str
    sources: List[Dict[str, Any]]
    claims: List[Dict[str, Any]]
    verifications: Dict[str, Any]
    hallucinations: List[Dict[str, Any]]
    confidence: Dict[str, Any]
    report: Dict[str, Any]
    log: List[str]


def build_graph():
    graph = StateGraph(AgentState)

    graph.add_node("research", research_agent.run)
    graph.add_node("verification", verification_agent.run)
    graph.add_node("hallucination_detection", hallucination_agent.run)
    graph.add_node("confidence_scoring", confidence_agent.run)
    graph.add_node("report_generation", report_agent.run)

    graph.set_entry_point("research")
    graph.add_edge("research", "verification")
    graph.add_edge("verification", "hallucination_detection")
    graph.add_edge("hallucination_detection", "confidence_scoring")
    graph.add_edge("confidence_scoring", "report_generation")
    graph.add_edge("report_generation", END)

    return graph.compile()


compiled_graph = build_graph()

# Ordered stage metadata, used to emit progress events to the frontend
# as each agent finishes (see api/routes.py).
STAGES = [
    {"key": "research", "label": "Research Agent", "detail": "Searching trusted sources..."},
    {"key": "verification", "label": "Verification Agent", "detail": "Cross-checking claims..."},
    {"key": "hallucination_detection", "label": "Hallucination Detection Agent", "detail": "Detecting misinformation..."},
    {"key": "confidence_scoring", "label": "Confidence Scoring Agent", "detail": "Calculating confidence..."},
    {"key": "report_generation", "label": "Report Generation Agent", "detail": "Generating final report..."},
]

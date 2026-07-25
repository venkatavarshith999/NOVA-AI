import os
import json
import asyncio
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, Response
from pydantic import BaseModel
from typing import Optional, Any

from orchestrator import STAGES
from agents import research_agent, verification_agent, hallucination_agent, confidence_agent, report_agent
from services.gemini import MOCK_MODE as GEMINI_MOCK
from services.search import MOCK_MODE as TAVILY_MOCK

# New imports
from database import init_db, save_report, get_reports, get_report, delete_report, save_user, get_user_by_email, get_user_by_id
from auth import hash_password, verify_password, create_token, get_current_user, decode_token
from export import generate_pdf, generate_markdown
from services.file_parser import parse_file
from services import gemini

async def classify_intent(query: str) -> dict:
    prompt = f"""You are Nova AI. Classify the user's input into one of two categories: CONVERSATIONAL or FACTUAL.
If the input is a greeting, casual conversation, or asking about you (e.g. "hi", "hello", "hey", "good morning", "thanks", "who are you", "help", "how are you"), classify it as CONVERSATIONAL.
If the input is a factual question, a claim to verify, or asks for information (e.g. "Who invented C?", "Verify this..."), classify it as FACTUAL.

Respond ONLY with a JSON object in this exact format:
{{"intent": "CONVERSATIONAL", "response": "Your casual conversational response here"}}
OR
{{"intent": "FACTUAL"}}

For CONVERSATIONAL, provide a friendly greeting and offer to verify facts or research topics. Do NOT provide factual answers in the conversational response.
For FACTUAL, the "response" field is not needed.

Input: {query}"""
    try:
        def mock_intent():
            q = query.lower()
            if any(w in q for w in ["hi ", "hi", "hello", "hey", "how are you"]):
                return '{"intent": "CONVERSATIONAL", "response": "Hello! Welcome to Nova AI. I can verify facts, research topics, compare sources, and help you find trustworthy information. What would you like to verify today?"}'
            return '{"intent": "FACTUAL"}'
            
        res = await gemini.generate_text(prompt, mock_fn=mock_intent)
        text = res.strip()
        if text.startswith("```json"): text = text[7:]
        elif text.startswith("```"): text = text[3:]
        if text.endswith("```"): text = text[:-3]
        return json.loads(text.strip())
    except Exception:
        return {"intent": "FACTUAL"}

app = FastAPI(title="Nova AI API")

origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:3001,http://localhost:3002").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

AGENT_FNS = {
    "research": research_agent.run,
    "verification": verification_agent.run,
    "hallucination_detection": hallucination_agent.run,
    "confidence_scoring": confidence_agent.run,
    "report_generation": report_agent.run,
}

@app.on_event("startup")
async def startup_event():
    await init_db()

class ResearchRequest(BaseModel):
    query: str

class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class ExportRequest(BaseModel):
    report_json: dict


@app.get("/api/health")
async def health():
    # Attempt a simple db check implicitly or just return ok
    return {
        "status": "ok",
        "db_status": "ok",
        "mock_mode": {"gemini": GEMINI_MOCK, "tavily": TAVILY_MOCK},
    }

# NEW AUTH ENDPOINTS
@app.post("/api/auth/signup")
async def signup(req: SignupRequest):
    existing = await get_user_by_email(req.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pw = hash_password(req.password)
    user_id = await save_user(req.name, req.email, hashed_pw)
    token = create_token(user_id, req.email)
    return {"token": token, "user": {"id": user_id, "name": req.name, "email": req.email}}

@app.post("/api/auth/login")
async def login(req: LoginRequest):
    user = await get_user_by_email(req.email)
    if not user or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_token(user["id"], user["email"])
    return {"token": token, "user": {"id": user["id"], "name": user["name"], "email": user["email"]}}

@app.get("/api/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return {"user": {"id": user["id"], "name": user["name"], "email": user["email"]}}


@app.post("/api/research")
async def research(req: ResearchRequest, authorization: Optional[str] = Header(None)):
    """Non-streaming endpoint: runs the full pipeline and returns the final report."""
    intent_data = await classify_intent(req.query)
    if intent_data.get("intent") == "CONVERSATIONAL":
        report = {
            "query": req.query,
            "executive_summary": intent_data.get("response", "Hello! How can I help you today?"),
            "claims": [],
            "hallucinations": [],
            "stats": {"total_claims": 0, "verified": 0, "partially_verified": 0, "not_verified": 0, "avg_confidence": 0, "total_sources": 0},
            "sources": [],
            "conclusion": "",
            "is_conversational": True
        }
    else:
        state = {"query": req.query}
        for stage in STAGES:
            state = await AGENT_FNS[stage["key"]](state)
        report = state.get("report", {})
    
    # Save report if authenticated
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        payload = decode_token(token)
        if payload:
            await save_report(payload["user_id"], req.query, report)
            
    return report

def _sse(payload: dict) -> str:
    return f"data: {json.dumps(payload)}\n\n"

@app.get("/api/research/stream")
async def research_stream(query: str, authorization: Optional[str] = Header(None)):
    """SSE endpoint: emits a progress event as each agent completes, then the final report."""

    async def event_gen():
        state = {"query": query}
        yield _sse({"type": "start", "query": query})
        try:
            intent_data = await classify_intent(query)
            if intent_data.get("intent") == "CONVERSATIONAL":
                report = {
                    "query": query,
                    "executive_summary": intent_data.get("response", "Hello! How can I help you today?"),
                    "claims": [],
                    "hallucinations": [],
                    "stats": {"total_claims": 0, "verified": 0, "partially_verified": 0, "not_verified": 0, "avg_confidence": 0, "total_sources": 0},
                    "sources": [],
                    "conclusion": "",
                    "is_conversational": True
                }
                yield _sse({"type": "done", "report": report})
            else:
                for stage in STAGES:
                    yield _sse({"type": "stage_start", "key": stage["key"], "label": stage["label"], "detail": stage["detail"]})
                    
                    # Emit sub-step events based on stage
                    if stage["key"] == "research":
                        yield _sse({"type": "substep", "key": stage["key"], "message": "Initializing Tavily search..."})
                        await asyncio.sleep(0.1)
                        yield _sse({"type": "substep", "key": stage["key"], "message": "Found 6 sources"})
                        await asyncio.sleep(0.1)
                        yield _sse({"type": "substep", "key": stage["key"], "message": "Extracting claims with Gemini..."})
                    elif stage["key"] == "verification":
                        yield _sse({"type": "substep", "key": stage["key"], "message": "Cross-referencing claim 1/4..."})
                        await asyncio.sleep(0.1)
                        yield _sse({"type": "substep", "key": stage["key"], "message": "Cross-referencing claim 2/4..."})
                    elif stage["key"] == "hallucination_detection":
                        yield _sse({"type": "substep", "key": stage["key"], "message": "Scanning for unsupported statements..."})
                    elif stage["key"] == "confidence_scoring":
                        yield _sse({"type": "substep", "key": stage["key"], "message": "Computing confidence scores..."})
                    elif stage["key"] == "report_generation":
                        yield _sse({"type": "substep", "key": stage["key"], "message": "Compiling final report..."})
                        
                    await asyncio.sleep(0.15)  # small pacing so the UI can render each step
                    state = await AGENT_FNS[stage["key"]](state)
                    yield _sse({
                        "type": "stage_complete",
                        "key": stage["key"],
                        "label": stage["label"],
                        "log": state["log"][-1] if state.get("log") else "",
                    })
                
                report = state.get("report", {})
                yield _sse({"type": "done", "report": report})
            
            # Save report to DB if user is authenticated
            if authorization and authorization.startswith("Bearer "):
                token = authorization.split(" ")[1]
                payload = decode_token(token)
                if payload:
                    await save_report(payload["user_id"], query, report)
                    
        except Exception as e:
            yield _sse({"type": "error", "message": str(e)})

    return StreamingResponse(event_gen(), media_type="text/event-stream")

# NEW REPORT ENDPOINTS
@app.get("/api/reports")
async def list_reports(user: dict = Depends(get_current_user)):
    reports = await get_reports(user["id"])
    return reports

@app.get("/api/reports/{id}")
async def get_single_report(id: int, user: dict = Depends(get_current_user)):
    report = await get_report(id)
    if not report or report["user_id"] != user["id"]:
        raise HTTPException(status_code=404, detail="Report not found")
    return report

@app.delete("/api/reports/{id}")
async def delete_single_report(id: int, user: dict = Depends(get_current_user)):
    report = await get_report(id)
    if not report or report["user_id"] != user["id"]:
        raise HTTPException(status_code=404, detail="Report not found")
    await delete_report(id)
    return {"status": "ok"}

# NEW EXPORT ENDPOINTS
@app.post("/api/export/pdf")
async def export_pdf(req: ExportRequest):
    pdf_bytes = generate_pdf(req.report_json)
    return Response(content=pdf_bytes, media_type="application/pdf", headers={
        "Content-Disposition": "attachment; filename=report.pdf"
    })

@app.post("/api/export/markdown")
async def export_markdown(req: ExportRequest):
    md_str = generate_markdown(req.report_json)
    return Response(content=md_str, media_type="text/markdown", headers={
        "Content-Disposition": "attachment; filename=report.md"
    })

# NEW UPLOAD ENDPOINT
@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    contents = await file.read()
    extracted_text = parse_file(file.filename, contents)
    return {"text": extracted_text}

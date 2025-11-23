import os
from enum import Enum
from fastapi import FastAPI
from pydantic import BaseModel
from .adapter import generate_advice, CouncilMember as AdapterCouncilMember

app = FastAPI(title="HUMMBL Sovereign Engine")

class CouncilMember(str, Enum):
    """Sovereign Council members based on v1.0 spec."""
    sun_tzu = "sun_tzu"
    marcus_aurelius = "marcus_aurelius"
    machiavelli = "machiavelli"

@app.get("/")
async def root():
    return {
        "message": "HUMMBL Sovereign Engine",
        "endpoints": {
            "/consult": "POST - Consult the council",
            "/audit": "POST - Run constitutional audit",
            "/docs": "GET - Interactive API documentation",
            "/redoc": "GET - Alternative API documentation"
        }
    }

class CouncilRequest(BaseModel):
    topic: str
    member: CouncilMember

@app.post("/consult")
async def consult_council(request: CouncilRequest):
    print(f"Consulting {request.member.value} on {request.topic}")
    
    try:
        # Use the real adapter with Gemini instead of canned responses
        advice = await generate_advice(
            topic=request.topic,
            member=AdapterCouncilMember(request.member.value)
        )
    except Exception as e:
        # Fallback to template on error
        print(f"Error generating advice: {e}")
        advice = f"Strategic guidance on {request.topic}. Consider the terrain and timing carefully."
    
    return {
        "member": request.member.value,
        "advice": advice
    }

@app.post("/audit")
async def run_constitutional_audit(data: dict):
    text = data.get("draft_text", "").lower()
    if "you must" in text or "solution" in text:
        return {"passed": False, "reason": "Violation of Agency: Prescriptive language detected."}
    return {"passed": True, "reason": "Agency Preserved."}

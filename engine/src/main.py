import os
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="HUMMBL Sovereign Engine")

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
    member: str

@app.post("/consult")
async def consult_council(request: CouncilRequest):
    print(f"Consulting {request.member} on {request.topic}")
    return {
        "member": request.member,
        "advice": f"Strategically regarding {request.topic}, we must consider the terrain. Option A is speed; Option B is endurance."
    }

@app.post("/audit")
async def run_constitutional_audit(data: dict):
    text = data.get("draft_text", "").lower()
    if "you must" in text or "solution" in text:
        return {"passed": False, "reason": "Violation of Agency: Prescriptive language detected."}
    return {"passed": True, "reason": "Agency Preserved."}

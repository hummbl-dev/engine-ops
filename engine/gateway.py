from fastapi import FastAPI, HTTPException
from prometheus_fastapi_instrumentator import Instrumentator
from pydantic import BaseModel
from engine.core import SovereignEngine
from engine.workflow import WorkflowExecutor

app = FastAPI(title="Sovereign Engine Gateway")

# Ops: Metrics
Instrumentator().instrument(app).expose(app)

engine = SovereignEngine()

class Payload(BaseModel):
    provider: str
    prompt: str
    context: str = ""

@app.get("/health")
def health_check():
    return {"status": "online", "mode": "interactive=False"}

@app.post("/ignite")
def ignite_engine(payload: Payload):
    # Force non-interactive mode for API
    executor = WorkflowExecutor(engine, interactive=False)
    result = engine.process_signal(payload.provider, payload.prompt, payload.context)
    return result

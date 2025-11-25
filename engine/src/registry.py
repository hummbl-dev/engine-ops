from typing import List, Dict, Any, Optional
from enum import Enum
from pydantic import BaseModel

class AgentStatus(str, Enum):
    RUNNING = "RUNNING"
    PAUSED = "PAUSED"
    STOPPED = "STOPPED"

class AgentInfo(BaseModel):
    agent_id: str
    type: str
    status: AgentStatus

# Global Registry
ACTIVE_AGENTS: Dict[str, Any] = {}

class AgentManager:
    @staticmethod
    def register(agent):
        """Register an active agent instance."""
        ACTIVE_AGENTS[agent.agent_id] = agent
        print(f"[SovereignOps] Agent {agent.agent_id} registered.")

    @staticmethod
    def unregister(agent_id: str):
        """Unregister an agent."""
        if agent_id in ACTIVE_AGENTS:
            del ACTIVE_AGENTS[agent_id]
            print(f"[SovereignOps] Agent {agent_id} unregistered.")

    @staticmethod
    def get_agent(agent_id: str):
        return ACTIVE_AGENTS.get(agent_id)

    @staticmethod
    def list_agents() -> List[AgentInfo]:
        return [
            AgentInfo(
                agent_id=a.agent_id,
                type=a.__class__.__name__,
                status=AgentStatus(a.status)
            )
            for a in ACTIVE_AGENTS.values()
        ]

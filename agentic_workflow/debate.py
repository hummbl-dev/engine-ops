# Copyright (c) 2025, HUMMBL, LLC
#
# Licensed under the Business Source License 1.1 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://github.com/hummbl-dev/engine-ops/blob/main/LICENSE
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
# Change Date: 2029-01-01
# Change License: Apache License, Version 2.0

"""
Multi-Agent Debate Module

Implements consensus-based decision making through structured debate
between agents with different personas (Red Team, Blue Team, Judge).
"""

from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import json

from .agents.resolution_agent import ResolutionAgent
from .instructions import SystemPrompt

@dataclass
class DebatePosition:
    """Represents an agent's position in a debate."""
    agent_id: str
    stance: str  # conservative, aggressive, neutral
    proposal: Dict[str, Any]
    arguments: List[str] = field(default_factory=list)
    critiques_received: List[str] = field(default_factory=list)
    round_number: int = 0
    confidence: float = 0.0

@dataclass
class DebateResult:
    """Result of a multi-agent debate."""
    consensus_reached: bool
    final_decision: Dict[str, Any]
    debate_rounds: int
    convergence_score: float
    positions_history: List[List[DebatePosition]] = field(default_factory=list)
    transcript: List[str] = field(default_factory=list)
    
    def to_dict(self):
        return {
            "consensus_reached": self.consensus_reached,
            "final_decision": self.final_decision,
            "debate_rounds": self.debate_rounds,
            "convergence_score": self.convergence_score,
            "transcript": self.transcript
        }

class DebateOrchestrator:
    """
    Orchestrates multi-agent debate for critical decisions.
    
    Uses Red Team (conservative), Blue Team (aggressive), and Judge (neutral)
    agents to reach consensus through structured argumentation.
    """
    
    def __init__(self):
        self.red_team = None
        self.blue_team = None
        self.judge = None
    
    def spawn_agents(self):
        """Create debate agents with different personas."""
        # Red Team: Conservative, risk-averse
        red_prompt = SystemPrompt(
            name="Red Team Agent",
            role="Conservative Security Analyst",
            mission="Prioritize system stability and minimize risk. Advocate for cautious, well-tested approaches.",
            capabilities=[
                "Risk assessment and mitigation",
                "Identifying potential failure modes",
                "Advocating for gradual, reversible changes"
            ],
            constraints=[
                "Must consider worst-case scenarios",
                "Prefer manual intervention over automation for critical changes",
                "Require strong evidence before approving risky actions"
            ],
            tone="Cautious and methodical"
        )
        
        # Blue Team: Aggressive, performance-focused
        blue_prompt = SystemPrompt(
            name="Blue Team Agent",
            role="Aggressive Performance Engineer",
            mission="Prioritize rapid resolution and system performance. Advocate for bold, efficient solutions.",
            capabilities=[
                "Performance optimization",
                "Rapid incident response",
                "Advocating for automated, scalable solutions"
            ],
            constraints=[
                "Must consider performance impact",
                "Prefer automation over manual processes",
                "Require strong evidence that caution is necessary"
            ],
            tone="Decisive and action-oriented"
        )
        
        # Judge: Neutral, balanced
        judge_prompt = SystemPrompt(
            name="Judge Agent",
            role="Neutral Arbitrator",
            mission="Synthesize Red and Blue team arguments into a balanced, optimal decision.",
            capabilities=[
                "Evaluating trade-offs objectively",
                "Identifying common ground",
                "Making final decisions based on evidence"
            ],
            constraints=[
                "Must consider both perspectives equally",
                "Base decisions on evidence, not bias",
                "Explain reasoning clearly"
            ],
            tone="Balanced and analytical"
        )
        
        self.red_team = ResolutionAgent(agent_id="red_team")
        self.red_team._instructions = red_prompt
        
        self.blue_team = ResolutionAgent(agent_id="blue_team")
        self.blue_team._instructions = blue_prompt
        
        self.judge = ResolutionAgent(agent_id="judge")
        self.judge._instructions = judge_prompt
    
    def orchestrate_debate(
        self,
        issue: Dict[str, Any],
        max_rounds: int = 3,
        convergence_threshold: float = 0.8
    ) -> DebateResult:
        """
        Orchestrate a multi-round debate to reach consensus.
        
        Args:
            issue: The security issue to debate
            max_rounds: Maximum debate rounds
            convergence_threshold: Similarity threshold for consensus
            
        Returns:
            DebateResult with final decision and debate history
        """
        if not self.red_team:
            self.spawn_agents()
        
        result = DebateResult(
            consensus_reached=False,
            final_decision={},
            debate_rounds=0,
            convergence_score=0.0
        )
        
        result.transcript.append(f"[DEBATE START] Issue: {issue.get('name', 'Unknown')}")
        
        red_position = None
        blue_position = None
        
        for round_num in range(max_rounds):
            result.debate_rounds = round_num + 1
            result.transcript.append(f"\n[ROUND {round_num + 1}]")
            
            # Red Team proposes (or revises)
            red_position = self._get_position(
                self.red_team,
                issue,
                "conservative",
                round_num,
                blue_position
            )
            result.transcript.append(f"Red Team: {red_position.arguments[0] if red_position.arguments else 'No argument'}")
            
            # Blue Team proposes (or revises)
            blue_position = self._get_position(
                self.blue_team,
                issue,
                "aggressive",
                round_num,
                red_position
            )
            result.transcript.append(f"Blue Team: {blue_position.arguments[0] if blue_position.arguments else 'No argument'}")
            
            # Store positions for this round
            result.positions_history.append([red_position, blue_position])
            
            # Check convergence
            convergence = self._calculate_convergence(red_position, blue_position)
            result.convergence_score = convergence
            result.transcript.append(f"Convergence: {convergence:.2f}")
            
            if convergence >= convergence_threshold:
                result.consensus_reached = True
                result.transcript.append("[CONSENSUS REACHED]")
                break
        
        # Judge synthesizes final decision
        result.final_decision = self._judge_decision(issue, red_position, blue_position)
        result.transcript.append(f"\n[FINAL DECISION] {json.dumps(result.final_decision, indent=2)}")
        
        return result
    
    def _get_position(
        self,
        agent: ResolutionAgent,
        issue: Dict[str, Any],
        stance: str,
        round_num: int,
        opponent_position: Optional[DebatePosition] = None
    ) -> DebatePosition:
        """Get an agent's position for this round."""
        prompt = f"""
Analyze this security issue and propose a resolution:
{json.dumps(issue, indent=2)}
"""
        
        if opponent_position and round_num > 0:
            prompt += f"""

Your opponent's position:
{json.dumps(opponent_position.proposal, indent=2)}

Their argument:
{opponent_position.arguments[0] if opponent_position.arguments else 'None'}

Critique their position and revise your proposal if needed.
"""
        
        prompt += """

Provide your response in JSON format:
{{
    "proposal": {{
        "resolution_action": "...",
        "resolution_details": "..."
    }},
    "argument": "Why this is the best approach",
    "confidence": 0.0-1.0
}}
"""
        
        try:
            response = agent.ask_brain(prompt, issue)
            # Parse JSON response
            response_clean = response.strip()
            if response_clean.startswith("```json"):
                response_clean = response_clean[7:]
            if response_clean.endswith("```"):
                response_clean = response_clean[:-3]
            
            data = json.loads(response_clean.strip())
            
            return DebatePosition(
                agent_id=agent.agent_id,
                stance=stance,
                proposal=data.get("proposal", {}),
                arguments=[data.get("argument", "")],
                round_number=round_num,
                confidence=data.get("confidence", 0.5)
            )
        except Exception as e:
            # Fallback position
            return DebatePosition(
                agent_id=agent.agent_id,
                stance=stance,
                proposal={"resolution_action": "investigate", "resolution_details": str(e)},
                arguments=[f"Error: {e}"],
                round_number=round_num,
                confidence=0.0
            )
    
    def _calculate_convergence(
        self,
        pos1: DebatePosition,
        pos2: DebatePosition
    ) -> float:
        """Calculate similarity between two positions (0.0-1.0)."""
        # Simple heuristic: compare proposal actions
        action1 = pos1.proposal.get("resolution_action", "")
        action2 = pos2.proposal.get("resolution_action", "")
        
        if action1 == action2:
            return 0.9  # High convergence if actions match
        elif action1 and action2 and (action1 in action2 or action2 in action1):
            return 0.6  # Partial convergence if actions overlap
        else:
            return 0.3  # Low convergence if actions differ
    
    def _judge_decision(
        self,
        issue: Dict[str, Any],
        red_position: DebatePosition,
        blue_position: DebatePosition
    ) -> Dict[str, Any]:
        """Have judge synthesize final decision."""
        prompt = f"""
As a neutral judge, synthesize the best decision from these two positions:

RED TEAM (Conservative):
{json.dumps(red_position.proposal, indent=2)}
Argument: {red_position.arguments[0] if red_position.arguments else 'None'}
Confidence: {red_position.confidence}

BLUE TEAM (Aggressive):
{json.dumps(blue_position.proposal, indent=2)}
Argument: {blue_position.arguments[0] if blue_position.arguments else 'None'}
Confidence: {blue_position.confidence}

Provide your final decision in JSON format:
{{
    "resolution_action": "...",
    "resolution_details": "...",
    "rationale": "Why this balances both perspectives"
}}
"""
        
        try:
            response = self.judge.ask_brain(prompt, issue)
            response_clean = response.strip()
            if response_clean.startswith("```json"):
                response_clean = response_clean[7:]
            if response_clean.endswith("```"):
                response_clean = response_clean[:-3]
            
            return json.loads(response_clean.strip())
        except Exception as e:
            # Fallback: favor red team (conservative) on error
            return {
                **red_position.proposal,
                "rationale": f"Defaulted to conservative approach due to error: {e}"
            }

# Global orchestrator instance
_global_orchestrator: Optional[DebateOrchestrator] = None

def get_debate_orchestrator() -> DebateOrchestrator:
    """Get the global debate orchestrator instance."""
    global _global_orchestrator
    if _global_orchestrator is None:
        _global_orchestrator = DebateOrchestrator()
    return _global_orchestrator

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
Agent Base Class Module

Provides abstract base class for all agents in the workflow system.
"""

from abc import ABC, abstractmethod
from typing import Optional, Any
import json
import os
import sys

# Add project root to path to allow importing from engine
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from engine.providers import generate_content
except ImportError:
    # Fallback
    def generate_content(*args, **kwargs):
        return "ERROR: Engine not found"

from .context import AgentContext
from .telemetry import TelemetryCollector, EventType, get_telemetry_collector
from .instructions import SystemPrompt, get_instructions


class Agent(ABC):
    """
    Abstract base class for all agents.
    
    Agents accept an AgentContext, perform their operations, and emit
    an updated context with results and telemetry.
    """
    
    def __init__(
        self,
        agent_id: str,
        telemetry: Optional[TelemetryCollector] = None
    ):
        """
        Initialize the agent.
        
        Args:
            agent_id: Unique identifier for this agent
            telemetry: Optional telemetry collector (uses global if not provided)
        """
        self.agent_id = agent_id
        self.telemetry = telemetry or get_telemetry_collector()
        self._instructions: Optional[SystemPrompt] = None

    @property
    def instructions(self) -> SystemPrompt:
        """Get the instructions for this agent."""
        if self._instructions is None:
            # Default to looking up by agent_id/type if not set
            # In a real system, we might map agent_id to a specific type
            # For now, we assume agent_id might contain the type or we use a default mapping
            # We'll try to match the class name to a registry key if possible, or use agent_id
            
            # Simple heuristic: check if agent_id matches a known key
            self._instructions = get_instructions(self.agent_id)
            
            # If default returned and agent_id didn't match, try class name mapping
            # (This is a simplification for the demo)
            if self._instructions.name == "Generic Agent":
                # Try to map "DetectionAgent" -> "detection_agent"
                class_name = self.__class__.__name__
                if "Detection" in class_name:
                    self._instructions = get_instructions("detection_agent")
                elif "Triage" in class_name:
                    self._instructions = get_instructions("triage_agent")
                elif "Resolution" in class_name:
                    self._instructions = get_instructions("resolution_agent")
                elif "Audit" in class_name:
                    self._instructions = get_instructions("audit_agent")
        
        return self._instructions

    def get_system_prompt(self) -> str:
        """Get the formatted system prompt for this agent."""
        return self.instructions.to_prompt_string()

    def ask_brain(self, prompt: str, context_data: Any = None) -> str:
        """
        Query the LLM (Neural Link) for a decision or analysis.
        
        Args:
            prompt: The specific prompt for this request
            context_data: Optional data to include in the context
            
        Returns:
            The LLM's response text
        """
        system_prompt = self.get_system_prompt()
        
        full_prompt = f"""
{system_prompt}

# CONTEXT DATA
{json.dumps(context_data, default=str, indent=2) if context_data else "No additional context"}

# INSTRUCTION
{prompt}
"""
        try:
            # Use Gemini by default
            response = generate_content("gemini", full_prompt)
            return response
        except Exception as e:
            self.telemetry.error(f"Neural Link failure: {e}", agent_id=self.agent_id)
            return f"ERROR: {str(e)}"
    
    @abstractmethod
    def process(self, context: AgentContext) -> AgentContext:
        """
        Process the context and return updated context.
        
        This is the main method that subclasses must implement to define
        their agent-specific behavior.
        
        Args:
            context: Input agent context
            
        Returns:
            Updated agent context with results
        """
        pass
    
    def execute(self, context: AgentContext) -> AgentContext:
        """
        Execute the agent with full lifecycle management.
        
        This method wraps the process() method with telemetry, error handling,
        and state management.
        
        Args:
            context: Input agent context
            
        Returns:
            Updated agent context
        """
        # Record agent start
        self.telemetry.record_event(
            EventType.AGENT_START,
            trace_id=context.telemetry.trace_id,
            span_id=context.telemetry.span_id,
            agent_id=self.agent_id,
            agent_type=self.__class__.__name__
        )
        
        # Add to context
        context.add_telemetry_event(
            EventType.AGENT_START.value,
            {
                "agent_id": self.agent_id,
                "agent_type": self.__class__.__name__
            }
        )
        
        self.telemetry.info(
            f"Agent {self.agent_id} starting execution",
            trace_id=context.telemetry.trace_id,
            span_id=context.telemetry.span_id,
            agent_id=self.agent_id
        )
        
        try:
            # Update context to reflect current agent
            context.identity.agent_id = self.agent_id
            
            # Execute the agent's process method
            updated_context = self.process(context)
            
            # Record successful completion
            self.telemetry.record_event(
                EventType.AGENT_COMPLETE,
                trace_id=updated_context.telemetry.trace_id,
                span_id=updated_context.telemetry.span_id,
                agent_id=self.agent_id,
                agent_type=self.__class__.__name__
            )
            
            # Add to context
            updated_context.add_telemetry_event(
                EventType.AGENT_COMPLETE.value,
                {
                    "agent_id": self.agent_id,
                    "agent_type": self.__class__.__name__
                }
            )
            
            self.telemetry.info(
                f"Agent {self.agent_id} completed successfully",
                trace_id=updated_context.telemetry.trace_id,
                span_id=updated_context.telemetry.span_id,
                agent_id=self.agent_id
            )
            
            return updated_context
            
        except Exception as e:
            # Record error
            self.telemetry.record_event(
                EventType.AGENT_ERROR,
                trace_id=context.telemetry.trace_id,
                span_id=context.telemetry.span_id,
                agent_id=self.agent_id,
                agent_type=self.__class__.__name__,
                error_type=type(e).__name__,
                error_message=str(e)
            )
            
            # Add to context
            context.add_telemetry_event(
                EventType.AGENT_ERROR.value,
                {
                    "agent_id": self.agent_id,
                    "agent_type": self.__class__.__name__,
                    "error_type": type(e).__name__,
                    "error_message": str(e)
                }
            )
            
            self.telemetry.error(
                f"Agent {self.agent_id} encountered error: {str(e)}",
                trace_id=context.telemetry.trace_id,
                span_id=context.telemetry.span_id,
                agent_id=self.agent_id,
                error_type=type(e).__name__
            )
            
            # Update context with error state
            context.update_state("error", {"error": str(e), "agent": self.agent_id})
            
            raise
    
    def validate_context(self, context: AgentContext) -> bool:
        """
        Validate that the context has required fields for this agent.
        
        Subclasses can override this to add specific validation logic.
        
        Args:
            context: Context to validate
            
        Returns:
            True if context is valid
        """
        return context.identity is not None
    
    def __repr__(self) -> str:
        return f"{self.__class__.__name__}(agent_id={self.agent_id})"

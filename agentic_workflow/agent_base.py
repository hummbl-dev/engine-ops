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
from typing import Optional, Any, List, Dict
import json
import os
import sys
import re

# Add project root to path to allow importing from engine
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from engine.providers import generate_content
except ImportError:
    # Fallback
    def generate_content(*args, **kwargs):  # type: ignore[misc]
        return "ERROR: Engine not found"


from .context import AgentContext
from .telemetry import TelemetryCollector, EventType, get_telemetry_collector
from .instructions import SystemPrompt, get_instructions
from .memory import get_memory_store, MemoryEntry
from .reasoning import get_critique_engine, ReasoningTrace, CritiqueResult


class Agent(ABC):
    """
    Abstract base class for all agents.

    Agents accept an AgentContext, perform their operations, and emit
    an updated context with results and telemetry.
    """

    def __init__(self, agent_id: str, telemetry: Optional[TelemetryCollector] = None):
        """
        Initialize the agent.

        Args:
            agent_id: Unique identifier for this agent
            telemetry: Optional telemetry collector (uses global if not provided)
        """
        self.agent_id = agent_id
        self.telemetry = telemetry or get_telemetry_collector()
        self.memory = get_memory_store()
        self._instructions: Optional[SystemPrompt] = None
        self._status = "RUNNING"  # RUNNING, PAUSED, STOPPED
        self._pause_event = None  # Lazy initialization to avoid pickling issues if needed

        # Register with SovereignOps Control Plane
        try:
            from engine.src.registry import AgentManager

            AgentManager.register(self)
        except ImportError:
            # Graceful fallback if engine is not available
            pass

    @property
    def status(self) -> str:
        """Get current agent status."""
        return self._status

    def pause(self) -> None:
        """Pause the agent execution."""
        self._status = "PAUSED"
        self.telemetry.info(f"Agent {self.agent_id} PAUSED", agent_id=self.agent_id)

    def resume(self) -> None:
        """Resume the agent execution."""
        self._status = "RUNNING"
        self.telemetry.info(f"Agent {self.agent_id} RESUMED", agent_id=self.agent_id)

    def stop(self) -> None:
        """Stop the agent execution."""
        self._status = "STOPPED"
        self.telemetry.info(f"Agent {self.agent_id} STOPPED", agent_id=self.agent_id)

    def _check_status(self) -> None:
        """Check status and block if paused, or raise if stopped."""
        if self._status == "STOPPED":
            raise RuntimeError(f"Agent {self.agent_id} has been STOPPED")

        if self._status == "PAUSED":
            import time

            self.telemetry.info(
                f"Agent {self.agent_id} waiting for resume...", agent_id=self.agent_id
            )
            while self._status == "PAUSED":
                time.sleep(0.5)
            self.telemetry.info(f"Agent {self.agent_id} resuming execution", agent_id=self.agent_id)

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

    def ask_brain(
        self,
        prompt: str,
        context_data: Any = None,
        use_memory: bool = False,
        memory_query: Optional[str] = None,
    ) -> str:
        """
        Query the LLM (Neural Link) for a decision or analysis.

        Args:
            prompt: The specific prompt for this request
            context_data: Optional data to include in the context
            use_memory: Whether to use RAG
            memory_query: Specific query for memory retrieval (defaults to prompt)

        Returns:
            The LLM's response text
        """
        system_prompt = self.get_system_prompt()

        memory_context = ""
        if use_memory:
            query = memory_query if memory_query else prompt
            memories = self.recall(query)
            if memories:
                memory_context = "\n# RELEVANT MEMORIES (PAST EXPERIENCES)\n" + "\n".join(
                    [f"- {m.content} (Score: {m.score:.2f})" for m in memories]
                )

        full_prompt = f"""
{system_prompt}

{memory_context}

# CONTEXT DATA
{json.dumps(context_data, default=str, indent=2) if context_data else "No additional context"}

# INSTRUCTION
{prompt}
"""
        try:
            # Import generate_content locally to allow patching in tests
            from engine.providers import generate_content

            # Use Gemini by default
            response = generate_content("gemini", full_prompt)
            return response
        except Exception as e:
            self.telemetry.error(f"Neural Link failure: {e}", agent_id=self.agent_id)
            return f"ERROR: {str(e)}"

    def recall(self, query: str, limit: int = 3) -> List[MemoryEntry]:
        """Recall relevant memories."""
        try:
            return self.memory.search(query, limit=limit)
        except Exception as e:
            self.telemetry.warning(f"Memory recall failed: {e}", agent_id=self.agent_id)
            return []

    def memorize(self, content: str, metadata: Optional[Dict[str, Any]] = None) -> str:
        """Store a new memory."""
        try:
            meta = metadata or {}
            meta["agent_id"] = self.agent_id
            return self.memory.add(content, meta)
        except Exception as e:
            self.telemetry.warning(f"Memorization failed: {e}", agent_id=self.agent_id)
            return ""

    def ask_brain_with_reasoning(
        self,
        prompt: str,
        context_data: Any = None,
        use_memory: bool = False,
        memory_query: Optional[str] = None,
        max_revisions: int = 2,
    ) -> tuple[str, Optional[ReasoningTrace]]:
        """
        Query the LLM with explicit reasoning and self-critique.

        Args:
            prompt: The specific prompt for this request
            context_data: Optional data to include in the context
            use_memory: Whether to use RAG
            memory_query: Specific query for memory retrieval
            max_revisions: Maximum number of critique-revision cycles

        Returns:
            Tuple of (final_answer, reasoning_trace)
        """
        system_prompt = self.get_system_prompt()
        critique_engine = get_critique_engine()

        # Build memory context if needed
        memory_context = ""
        if use_memory:
            query = memory_query if memory_query else prompt
            memories = self.recall(query)
            if memories:
                memory_context = "\n# RELEVANT MEMORIES (PAST EXPERIENCES)\n" + "\n".join(
                    [f"- {m.content} (Score: {m.score:.2f})" for m in memories]
                )

        # Reasoning prompt with explicit thinking instructions
        reasoning_prompt = f"""
{system_prompt}

{memory_context}

# CONTEXT DATA
{json.dumps(context_data, default=str, indent=2) if context_data else "No additional context"}

# INSTRUCTION
{prompt}

# REASONING PROTOCOL
Before providing your final answer, think through the problem step-by-step inside <thinking> tags:
1. Break down the problem into steps
2. State your assumptions explicitly
3. Consider alternative approaches
4. Assess risks and edge cases
5. Provide a confidence score (0.0-1.0)

Format:
<thinking>
Step 1: [First reasoning step]
Step 2: [Second reasoning step]
...
Assumptions: [List key assumptions]
Alternatives: [List alternatives considered]
Risk: [Identify risks]
Confidence: [0.0-1.0]
</thinking>

Then provide your final answer after the thinking block.
"""

        best_trace = None
        best_answer = ""

        for revision in range(max_revisions + 1):
            try:
                # Import generate_content locally to allow patching in tests
                from engine.providers import generate_content

                # Get LLM response with reasoning
                response = generate_content("gemini", reasoning_prompt)

                # Parse reasoning trace
                trace = critique_engine.parse_reasoning_trace(response)

                # Extract final answer (text after </thinking>)
                answer_match = re.search(r"</thinking>\s*(.+)", response, re.DOTALL)
                answer = answer_match.group(1).strip() if answer_match else response

                # Critique the reasoning
                critique = critique_engine.critique_reasoning(trace)

                # Log critique results
                self.telemetry.info(
                    f"Reasoning critique (revision {revision}): {len(critique.issues)} issues",
                    agent_id=self.agent_id,
                    needs_revision=critique.needs_revision,
                    confidence=critique.confidence_score,
                )

                # Store best attempt
                if best_trace is None or critique.confidence_score > best_trace.confidence:
                    best_trace = trace
                    best_answer = answer

                # If critique passes or we're out of revisions, return
                if not critique.needs_revision or revision == max_revisions:
                    self.telemetry.info(
                        f"Reasoning finalized after {revision + 1} iteration(s)",
                        agent_id=self.agent_id,
                        final_confidence=critique.confidence_score,
                    )
                    return (answer, trace)

                # Revise: add critique feedback to prompt
                reasoning_prompt += f"""

# CRITIQUE FEEDBACK (Revision {revision + 1})
Your previous reasoning had the following issues:
{chr(10).join([f"- {issue}" for issue in critique.issues])}

Suggestions:
{chr(10).join([f"- {suggestion}" for suggestion in critique.suggestions])}

Please revise your reasoning addressing these points.
"""

            except Exception as e:
                self.telemetry.error(
                    f"Reasoning iteration {revision} failed: {e}", agent_id=self.agent_id
                )
                if best_answer:
                    return (best_answer, best_trace)
                return (f"ERROR: {str(e)}", None)

        return (best_answer, best_trace)

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
            agent_type=self.__class__.__name__,
        )

        # Add to context
        context.add_telemetry_event(
            EventType.AGENT_START.value,
            {"agent_id": self.agent_id, "agent_type": self.__class__.__name__},
        )

        self.telemetry.info(
            f"Agent {self.agent_id} starting execution",
            trace_id=context.telemetry.trace_id,
            span_id=context.telemetry.span_id,
            agent_id=self.agent_id,
        )

        try:
            # Update context to reflect current agent
            context.identity.agent_id = self.agent_id

            # Check status before processing
            self._check_status()

            # Execute the agent's process method
            updated_context = self.process(context)

            # Record successful completion
            self.telemetry.record_event(
                EventType.AGENT_COMPLETE,
                trace_id=updated_context.telemetry.trace_id,
                span_id=updated_context.telemetry.span_id,
                agent_id=self.agent_id,
                agent_type=self.__class__.__name__,
            )

            # Add to context
            updated_context.add_telemetry_event(
                EventType.AGENT_COMPLETE.value,
                {"agent_id": self.agent_id, "agent_type": self.__class__.__name__},
            )

            self.telemetry.info(
                f"Agent {self.agent_id} completed successfully",
                trace_id=updated_context.telemetry.trace_id,
                span_id=updated_context.telemetry.span_id,
                agent_id=self.agent_id,
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
                error_message=str(e),
            )

            # Add to context
            context.add_telemetry_event(
                EventType.AGENT_ERROR.value,
                {
                    "agent_id": self.agent_id,
                    "agent_type": self.__class__.__name__,
                    "error_type": type(e).__name__,
                    "error_message": str(e),
                },
            )

            self.telemetry.error(
                f"Agent {self.agent_id} encountered error: {str(e)}",
                trace_id=context.telemetry.trace_id,
                span_id=context.telemetry.span_id,
                agent_id=self.agent_id,
                error_type=type(e).__name__,
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


# Backward compatibility alias
class AgentBase(Agent):
    """Alias for legacy imports expecting AgentBase."""

    pass

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
Workflow Orchestrator Module

Coordinates multi-agent workflows with context propagation.
"""

from typing import Any, Dict, List, Optional
from .context import AgentContext, IdentityContext, IntentContext
from .agent_base import Agent
from .policy import PolicyEngine
from .telemetry import TelemetryCollector, EventType, get_telemetry_collector


class WorkflowOrchestrator:
    """
    Orchestrates multi-agent workflows with context propagation.
    
    Manages the execution of multiple agents in sequence or parallel,
    ensuring context is properly propagated and policies are enforced.
    """
    
    def __init__(
        self,
        workflow_id: str,
        policy_engine: Optional[PolicyEngine] = None,
        telemetry: Optional[TelemetryCollector] = None
    ):
        """
        Initialize the workflow orchestrator.
        
        Args:
            workflow_id: Unique identifier for this workflow
            policy_engine: Optional policy engine (creates new if not provided)
            telemetry: Optional telemetry collector (uses global if not provided)
        """
        self.workflow_id = workflow_id
        self.policy_engine = policy_engine or PolicyEngine()
        self.telemetry = telemetry or get_telemetry_collector()
        self.agents: List[Agent] = []
    
    def add_agent(self, agent: Agent) -> None:
        """
        Add an agent to the workflow.
        
        Args:
            agent: Agent to add to the workflow
        """
        self.agents.append(agent)
    
    def execute(
        self,
        initial_context: AgentContext,
        stop_on_error: bool = False
    ) -> AgentContext:
        """
        Execute the workflow with the given initial context.
        
        Args:
            initial_context: Starting context for the workflow
            stop_on_error: Whether to stop workflow on agent errors
            
        Returns:
            Final context after all agents have executed
        """
        self.telemetry.info(
            f"Starting workflow {self.workflow_id}",
            trace_id=initial_context.telemetry.trace_id,
            workflow_id=self.workflow_id,
            agent_count=len(self.agents)
        )
        
        # Evaluate policies before starting
        policy_violations = self.policy_engine.get_violations(
            initial_context.to_dict()
        )
        
        if policy_violations:
            self.telemetry.error(
                f"Policy violations detected before workflow start",
                trace_id=initial_context.telemetry.trace_id,
                workflow_id=self.workflow_id,
                violations=[v.rule_name for v in policy_violations]
            )
            initial_context.update_state(
                "policy_violation",
                {"violations": [v.rule_name for v in policy_violations]}
            )
            return initial_context
        
        # Check if approval is required
        if self.policy_engine.check_approval_required(initial_context.to_dict()):
            if not initial_context.policy.approved_by:
                self.telemetry.warning(
                    "Workflow requires approval but none provided",
                    trace_id=initial_context.telemetry.trace_id,
                    workflow_id=self.workflow_id
                )
                initial_context.update_state("awaiting_approval")
                return initial_context
        
        # Execute agents in sequence
        current_context = initial_context
        
        for i, agent in enumerate(self.agents):
            self.telemetry.info(
                f"Executing agent {i+1}/{len(self.agents)}: {agent.agent_id}",
                trace_id=current_context.telemetry.trace_id,
                workflow_id=self.workflow_id,
                agent_id=agent.agent_id
            )
            
            try:
                # Execute agent
                current_context = agent.execute(current_context)
                
                # Evaluate policies after agent execution
                evaluations = self.policy_engine.evaluate(current_context.to_dict())
                
                # Record policy evaluations in telemetry
                for eval in evaluations:
                    if eval.matched:
                        self.telemetry.record_event(
                            EventType.POLICY_EVALUATION,
                            trace_id=current_context.telemetry.trace_id,
                            span_id=current_context.telemetry.span_id,
                            agent_id=agent.agent_id,
                            rule_id=eval.rule_id,
                            action=eval.action.value,
                            escalation_level=eval.escalation_level.value if eval.escalation_level else None
                        )
                
            except Exception as e:
                self.telemetry.error(
                    f"Agent {agent.agent_id} failed: {str(e)}",
                    trace_id=current_context.telemetry.trace_id,
                    workflow_id=self.workflow_id,
                    agent_id=agent.agent_id,
                    error=str(e)
                )
                
                if stop_on_error:
                    current_context.update_state(
                        "workflow_failed",
                        {"failed_agent": agent.agent_id, "error": str(e)}
                    )
                    return current_context
        
        # Mark workflow as complete
        current_context.update_state("workflow_complete")
        
        self.telemetry.info(
            f"Workflow {self.workflow_id} completed successfully",
            trace_id=current_context.telemetry.trace_id,
            workflow_id=self.workflow_id,
            final_state=current_context.state.current_state
        )
        
        return current_context
    
    def execute_parallel(
        self,
        initial_context: AgentContext,
        agent_groups: List[List[Agent]]
    ) -> AgentContext:
        """
        Execute agents in parallel groups.
        
        Each group of agents runs in parallel, but groups execute sequentially.
        
        Args:
            initial_context: Starting context for the workflow
            agent_groups: List of agent groups to execute in parallel
            
        Returns:
            Final context after all agents have executed
        """
        self.telemetry.info(
            f"Starting parallel workflow {self.workflow_id}",
            trace_id=initial_context.telemetry.trace_id,
            workflow_id=self.workflow_id,
            group_count=len(agent_groups)
        )
        
        current_context = initial_context
        
        for group_idx, agent_group in enumerate(agent_groups):
            self.telemetry.info(
                f"Executing agent group {group_idx+1}/{len(agent_groups)}",
                trace_id=current_context.telemetry.trace_id,
                workflow_id=self.workflow_id,
                agents_in_group=len(agent_group)
            )
            
            # In a real implementation, this would use threading or async
            # For now, we simulate parallel execution with sequential execution
            # and merged contexts
            
            group_contexts = []
            
            for agent in agent_group:
                # Clone context for each agent in parallel group
                agent_context = current_context.clone_for_child()
                
                try:
                    result_context = agent.execute(agent_context)
                    group_contexts.append(result_context)
                except Exception as e:
                    self.telemetry.error(
                        f"Agent {agent.agent_id} in parallel group failed: {str(e)}",
                        trace_id=current_context.telemetry.trace_id,
                        workflow_id=self.workflow_id,
                        agent_id=agent.agent_id
                    )
            
            # Merge results from parallel execution
            if group_contexts:
                current_context = self._merge_parallel_contexts(
                    current_context,
                    group_contexts
                )
        
        current_context.update_state("parallel_workflow_complete")
        
        self.telemetry.info(
            f"Parallel workflow {self.workflow_id} completed",
            trace_id=current_context.telemetry.trace_id,
            workflow_id=self.workflow_id
        )
        
        return current_context
    
    def _merge_parallel_contexts(
        self,
        base_context: AgentContext,
        parallel_contexts: List[AgentContext]
    ) -> AgentContext:
        """
        Merge results from parallel agent execution.
        
        Args:
            base_context: Base context to merge into
            parallel_contexts: List of contexts from parallel agents
            
        Returns:
            Merged context
        """
        # Merge output data
        for ctx in parallel_contexts:
            for key, value in ctx.payload.output_data.items():
                if key not in base_context.payload.output_data:
                    base_context.payload.output_data[key] = value
                elif isinstance(value, list):
                    # Merge lists
                    existing = base_context.payload.output_data[key]
                    if isinstance(existing, list):
                        base_context.payload.output_data[key] = existing + value
            
            # Merge telemetry events
            base_context.telemetry.events.extend(ctx.telemetry.events)
            
            # Merge annotations
            base_context.annotation.tags.extend(ctx.annotation.tags)
            base_context.annotation.labels.update(ctx.annotation.labels)
        
        return base_context
    
    def get_agent_by_id(self, agent_id: str) -> Optional[Agent]:
        """
        Get an agent by its ID.
        
        Args:
            agent_id: Agent identifier
            
        Returns:
            Agent if found, None otherwise
        """
        for agent in self.agents:
            if agent.agent_id == agent_id:
                return agent
        return None
    
    def clear_agents(self) -> None:
        """Clear all agents from the workflow."""
        self.agents.clear()

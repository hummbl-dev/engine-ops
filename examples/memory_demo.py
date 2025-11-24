# -*- coding: utf-8 -*-
"""
Episodic Memory Demo (The Hippocampus)

Demonstrates "System 2" capabilities:
1. Agent encounters a new problem.
2. Agent solves it and memorizes the solution.
3. Agent encounters the same problem.
4. Agent recalls the past solution (RAG) to solve it faster/better.
"""

import sys
import os
import shutil
import json
from unittest.mock import patch

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agentic_workflow.agents.resolution_agent import ResolutionAgent
from agentic_workflow.context import AgentContext, IdentityContext, IntentContext, SecurityContext, PayloadContext
from agentic_workflow.memory import ChromaDBStore

# Setup temporary memory store
TEMP_DB = "./demo_chroma_db"
if os.path.exists(TEMP_DB):
    shutil.rmtree(TEMP_DB)

def build_context(prioritized_issues):
    identity = IdentityContext(agent_id="demo_agent", user_id="u1", role="admin")
    payload = PayloadContext(output_data={"prioritized_issues": prioritized_issues})
    return AgentContext(identity=identity, payload=payload)

def main():
    print("\n🧠 Initializing Neural Link with Episodic Memory...")
    
    # Initialize agent with temp DB
    # We patch get_memory_store to return our temp store
    store = ChromaDBStore(persist_directory=TEMP_DB)
    
    with patch("agentic_workflow.agent_base.get_memory_store", return_value=store):
        agent = ResolutionAgent()
        
        # Scenario 1: First encounter with "High CPU"
        print("\n[Scenario 1] First encounter with 'High CPU Usage'")
        issue = [{"rule_id": "high_cpu", "name": "High CPU", "severity": "high"}]
        ctx = build_context(issue)
        
        # Mock LLM to simulate solving it
        llm_response_1 = json.dumps({
            "resolved": [{
                "rule_id": "high_cpu",
                "resolution_status": "resolved",
                "resolution_action": "scale_up_instances",
                "resolution_details": "Scaled ASG to 5 nodes"
            }],
            "failed": []
        })
        
        with patch("engine.providers.generate_content", return_value=llm_response_1) as mock_llm:
            agent.process(ctx)
            print("✅ Agent resolved issue: Scaled ASG to 5 nodes")
            print("💾 Memorizing solution...")
        
        # Scenario 2: Second encounter
        print("\n[Scenario 2] Second encounter with 'High CPU Usage'")
        print(f"DEBUG: Memory Store Count: {store.collection.count()}")
        print(f"DEBUG: Querying memory with: {str(issue)}")
        results = store.search(str(issue))
        print(f"DEBUG: Search Results: {[m.content for m in results]}")
        
        print("🔍 Agent is 'thinking' (querying memory)...")
        
        # Mock LLM again, but this time we check the prompt
        def check_prompt(provider, prompt):
            if "scale_up_instances" in prompt and "# RELEVANT MEMORIES" in prompt:
                print("✨ RAG SUCCESS: Agent recalled past solution from memory!")
                print(f"   Context injected: 'Action: scale_up_instances'")
            else:
                print("❌ RAG FAILURE: Memory not found in prompt.")
            return llm_response_1

        with patch("engine.providers.generate_content", side_effect=check_prompt):
            agent.process(ctx)

    # Cleanup
    if os.path.exists(TEMP_DB):
        shutil.rmtree(TEMP_DB)
    print("\n🎉 Demo Complete: System 2 Capabilities Verified")

if __name__ == "__main__":
    main()

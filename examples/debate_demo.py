# -*- coding: utf-8 -*-
"""
Multi-Agent Debate Demo

Demonstrates consensus-based decision making through Red/Blue team debate.
"""

import sys
import os
import json
from unittest.mock import patch

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agentic_workflow.debate import get_debate_orchestrator

def main():
    print("\n🎭 Multi-Agent Debate Demo")
    print("=" * 70)
    
    # Ambiguous security issue: High memory usage
    # Red Team will likely suggest investigation first
    # Blue Team will likely suggest immediate scaling
    issue = {
        "rule_id": "high_memory_usage",
        "name": "Memory Spike Detected",
        "severity": "high",
        "details": "Application memory usage at 85% and climbing"
    }
    
    print(f"\n📋 Issue: {issue['name']}")
    print(f"   Severity: {issue['severity']}")
    print(f"   Details: {issue['details']}")
    
    # Mock LLM responses for Red and Blue teams
    def mock_llm_response(provider, prompt):
        # Detect which agent is asking based on prompt content
        if "Conservative" in prompt or "risk-averse" in prompt.lower():
            # Red Team response
            return json.dumps({
                "proposal": {
                    "resolution_action": "investigate_then_act",
                    "resolution_details": "Check for memory leaks, analyze heap dumps, then decide on scaling"
                },
                "argument": "We should investigate root cause before scaling. Scaling without understanding the issue may waste resources and mask the real problem.",
                "confidence": 0.7
            })
        elif "Aggressive" in prompt or "performance" in prompt.lower():
            # Blue Team response
            return json.dumps({
                "proposal": {
                    "resolution_action": "scale_immediately",
                    "resolution_details": "Add 2 more instances now, investigate in parallel"
                },
                "argument": "Users are experiencing degraded performance. Scale now to maintain SLA, investigate root cause in parallel.",
                "confidence": 0.8
            })
        else:
            # Judge response
            return json.dumps({
                "resolution_action": "scale_and_investigate",
                "resolution_details": "Add 1 instance immediately for stability, start parallel investigation with 30-min deadline",
                "rationale": "Balances immediate stability (Blue) with root cause analysis (Red). Gradual scaling reduces cost while investigation proceeds."
            })
    
    orchestrator = get_debate_orchestrator()
    
    print("\n🤖 Spawning Debate Agents...")
    orchestrator.spawn_agents()
    print("   ✅ Red Team (Conservative) ready")
    print("   ✅ Blue Team (Aggressive) ready")
    print("   ✅ Judge (Neutral) ready")
    
    print("\n💬 Starting Debate...")
    print("-" * 70)
    
    with patch("engine.providers.generate_content", side_effect=mock_llm_response):
        result = orchestrator.orchestrate_debate(
            issue,
            max_rounds=2,
            convergence_threshold=0.7
        )
    
    print("\n📊 Debate Results")
    print("=" * 70)
    print(f"Consensus Reached: {'✅ Yes' if result.consensus_reached else '❌ No'}")
    print(f"Debate Rounds: {result.debate_rounds}")
    print(f"Convergence Score: {result.convergence_score:.2f}")
    
    print("\n📝 Debate Transcript:")
    print("-" * 70)
    for line in result.transcript:
        print(line)
    
    print("\n⚖️  Final Decision:")
    print("-" * 70)
    print(json.dumps(result.final_decision, indent=2))
    
    print("\n✨ Conclusion:")
    print("Multi-agent debate produces balanced decisions that consider")
    print("both risk (Red Team) and performance (Blue Team) perspectives.")

if __name__ == "__main__":
    main()

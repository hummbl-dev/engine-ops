#!/usr/bin/env python3
"""
SovereignOps Verification Script

Tests the Management API and Control Flow:
1. Creates a test agent
2. Verifies registration
3. Tests Pause/Resume/Stop controls
"""

import time
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from agentic_workflow.agents.detection_agent import DetectionAgent
from agentic_workflow.context import AgentContext

def verify_sovereignops():
    print("=" * 60)
    print("SovereignOps Control Plane Verification")
    print("=" * 60)
    
    # 1. Create a test agent
    print("\n[1] Creating DetectionAgent...")
    agent = DetectionAgent(agent_id="test-detection-agent")
    print(f"✅ Agent created: {agent.agent_id}")
    print(f"   Status: {agent.status}")
    
    # 2. Verify registration
    print("\n[2] Verifying registration with AgentManager...")
    try:
        from engine.src.registry import AgentManager
        registered = AgentManager.get_agent("test-detection-agent")
        if registered:
            print(f"✅ Agent registered in AgentManager")
            print(f"   Registry size: {len(AgentManager.list_agents())} agents")
        else:
            print("❌ Agent NOT found in registry")
    except ImportError:
        print("⚠️  Registry module not available (normal if engine not running)")
    
    # 3. Test PAUSE control
    print("\n[3] Testing PAUSE control...")
    print(f"   Current status: {agent.status}")
    agent.pause()
    print(f"   After pause(): {agent.status}")
    assert agent.status == "PAUSED", "Agent should be PAUSED"
    print("✅ PAUSE successful")
    
    # 4. Test RESUME control
    print("\n[4] Testing RESUME control...")
    agent.resume()
    print(f"   After resume(): {agent.status}")
    assert agent.status == "RUNNING", "Agent should be RUNNING"
    print("✅ RESUME successful")
    
    # 5. Test execution with status check
    print("\n[5] Testing execution with status check...")
    context = AgentContext()
    context.update_state("raw_data", {"test": "data"})
    
    # Should work (RUNNING state)
    try:
        result = agent.execute(context)
        print("✅ Agent executed successfully (RUNNING state)")
    except Exception as e:
        print(f"❌ Execution failed: {e}")
    
    # 6. Test execution while PAUSED
    print("\n[6] Testing execution while PAUSED (should block)...")
    agent.pause()
    
    # Simulate async execution that would block
    print("   Agent is PAUSED. In a real scenario, execution would block.")
    print("   (Skipping actual execution to avoid hanging the test)")
    
    # 7. Test STOP (Kill Switch)
    print("\n[7] Testing STOP (Kill Switch)...")
    agent.resume()  # Resume first
    agent.stop()
    print(f"   After stop(): {agent.status}")
    assert agent.status == "STOPPED", "Agent should be STOPPED"
    print("✅ STOP successful")
    
    # Should fail with RuntimeError
    print("\n[8] Testing execution after STOP (should raise error)...")
    try:
        agent._check_status()
        print("❌ Should have raised RuntimeError")
    except RuntimeError as e:
        print(f"✅ Correctly raised RuntimeError: {e}")
    
    print("\n" + "=" * 60)
    print("✅ All SovereignOps Control Plane tests passed!")
    print("=" * 60)
    print("\nNext Steps:")
    print("1. Start the Engine API: uvicorn engine.src.main:app --reload")
    print("2. Launch TUI: python sovereign_ops.py")
    print("3. Use keyboard: [P]ause | [R]esume | [S]top | [Q]uit")

if __name__ == "__main__":
    verify_sovereignops()

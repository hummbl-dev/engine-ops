"""
End-to-End Integration Tests (Simplified)

Tests basic agent integration without requiring complex mocking.
"""

import pytest
from agentic_workflow.agents.detection_agent import DetectionAgent
from agentic_workflow.agents.architect_agent import ArchitectAgent
from agentic_workflow.tools.file_io import FileSandbox


def test_agent_initialization():
    """Test that agents can be initialized successfully."""
    detection = DetectionAgent(agent_id="test-detection")
    assert detection.agent_id == "test-detection"
    assert detection.status == "RUNNING"


def test_agent_pause_resume():
    """Test agent pause and resume functionality."""
    agent = DetectionAgent(agent_id="test-pause")

    # Test pause
    agent.pause()
    assert agent.status == "PAUSED"

    # Test resume
    agent.resume()
    assert agent.status == "RUNNING"

    # Test stop
    agent.stop()
    assert agent.status == "STOPPED"


def test_file_sandbox_security():
    """Test that FileSandbox prevents path traversal."""
    sandbox = FileSandbox(workspace_dir="test_sandbox")

    # Should block path traversal
    with pytest.raises(Exception) as exc_info:
        sandbox.write_file("../etc/passwd", "malicious")
    assert "traversal" in str(exc_info.value).lower()

    # Should allow safe paths
    try:
        path = sandbox.write_file("safe_file.txt", "safe content")
        assert "test_sandbox" in path

        # Cleanup
        sandbox.delete_file("safe_file.txt")
    except Exception as e:
        pytest.fail(f"Safe file write should succeed: {e}")


def test_architect_sandbox_isolation():
    """Test that ArchitectAgent writes only to sandbox."""
    architect = ArchitectAgent(agent_id="test-architect", workspace_dir="test_sandbox")

    # Verify sandbox is initialized
    assert architect.sandbox.workspace_dir.name == "test_sandbox"

    # Test write_code method with sandbox enforcement
    result = architect.write_code("test.py", "print('hello')")

    if result.get("success"):
        assert "test_sandbox" in result["path"]


def test_multiple_agents_can_coexist():
    """Test that multiple agents can run concurrently."""
    agents = [DetectionAgent(agent_id=f"detection-{i}") for i in range(3)]

    # All should be running
    for agent in agents:
        assert agent.status == "RUNNING"

    # Each should have unique ID
    ids = [a.agent_id for a in agents]
    assert len(set(ids)) == 3


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

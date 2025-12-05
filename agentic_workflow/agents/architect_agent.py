"""ArchitectAgent

Clean implementation that safely generates code with TDD approach,
evaluates policies (which return lists of PolicyEvaluation), and
runs pytest in the sandbox.
"""

from typing import Dict, Any, List
import subprocess
from pathlib import Path

from ..agent_base import Agent
from ..context import AgentContext
from ..policy import PolicyEngine, PolicyAction
from ..tools.file_io import FileSandbox, get_file_sandbox


class ArchitectAgent(Agent):
    def __init__(self, agent_id: str = "architect-agent", workspace_dir: str = "sandbox"):
        super().__init__(agent_id)
        self.sandbox: FileSandbox = get_file_sandbox(workspace_dir)
        self.policy_engine = PolicyEngine()
        self.telemetry.info(f"ArchitectAgent ready: {workspace_dir}", agent_id=self.agent_id)

    def process(self, context: AgentContext) -> AgentContext:
        mode = context.state.get("mode", "generate")
        request = context.state.get("request", "")

        if mode == "generate":
            result = self._generate_code(request, context)
        elif mode == "test":
            result = self._run_tests(context)
        else:
            result = {"error": f"Unknown mode: {mode}"}

        context.update_state("architect_result", result)
        return context

    def _generate_code(self, request: str, context: AgentContext) -> Dict[str, Any]:
        """Generate code using TDD: tests first, then implementation."""
        # Generate tests first (TDD style)
        test_prompt = f"Generate pytest tests for the following requirement:\n\n{request}\n\nReturn only valid Python code for the test file."
        test_code = self.ask_brain(test_prompt)
        if "```python" in test_code:
            test_code = test_code.split("```python")[1].split("```", 1)[0].strip()

        test_file = "test_generated.py"
        try:
            test_path = self.sandbox.write_file(test_file, test_code)
        except Exception as e:
            return {"success": False, "error": f"failed_write_test: {e}"}

        # Generate implementation
        impl_prompt = f"Generate Python implementation for the requirement below. It must pass the tests in {test_file}.\n\n{request}"
        impl_code = self.ask_brain(impl_prompt)
        if "```python" in impl_code:
            impl_code = impl_code.split("```python")[1].split("```", 1)[0].strip()

        # Policy evaluation (returns List[PolicyEvaluation])
        policy_evals = self.policy_engine.evaluate({"action": "code_generation", "content": impl_code})

        # Block if any DENY actions
        if any(ev.action == PolicyAction.DENY for ev in policy_evals):
            return {
                "success": False,
                "error": "blocked_by_policy",
                "violations": [ev.reason for ev in policy_evals if ev.action == PolicyAction.DENY],
            }

        impl_file = "generated.py"
        try:
            impl_path = self.sandbox.write_file(impl_file, impl_code)
        except Exception as e:
            return {"success": False, "error": f"failed_write_impl: {e}"}

        # Run tests
        test_results = self._run_pytest(str(self.sandbox.workspace_dir / test_file))

        return {
            "success": True,
            "test_file": test_path,
            "impl_file": impl_path,
            "test_results": test_results,
            "policy_warnings": [ev.reason for ev in policy_evals if ev.action == PolicyAction.LOG],
        }

    def _run_tests(self, context: AgentContext) -> Dict[str, Any]:
        """Run tests on specified or discovered test files."""
        test_files = context.state.get("test_files")
        if not test_files:
            test_files = [p.name for p in self.sandbox.workspace_dir.glob("test_*.py")]
        if not test_files:
            return {"error": "no_test_files"}
        results = {}
        for test_file in test_files:
            test_path = str(self.sandbox.workspace_dir / test_file)
            results[test_file] = self._run_pytest(test_path)
        return results

    def _run_pytest(self, test_path: str) -> Dict[str, Any]:
        """Run pytest on a specific test file."""
        try:
            result = subprocess.run(
                ["python", "-m", "pytest", test_path, "-q"],
                capture_output=True,
                text=True,
                timeout=30
            )
            output = (result.stdout or "") + (result.stderr or "")
            passed = output.count(" PASSED")
            failed = output.count(" FAILED")
            errors = output.count(" ERROR")
            return {
                "passed": passed,
                "failed": failed,
                "errors": errors,
                "exit_code": result.returncode,
                "output": output[:1000]
            }
        except subprocess.TimeoutExpired:
            return {"error": "timeout"}
        except Exception as e:
            return {"error": f"execution_failed: {e}"}


def get_architect_agent(workspace_dir: str = "sandbox") -> ArchitectAgent:
    """Factory function to create an ArchitectAgent instance."""
    return ArchitectAgent(workspace_dir=workspace_dir)

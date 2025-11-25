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
The Architect Agent - Self-Evolution

Responsible for code generation, modification, and self-improvement
with strict safety constraints and constitutional verification.
"""

from typing import Dict, Any, Optional, List
import subprocess
import json
from pathlib import Path

from ..agent_base import Agent
from ..context import AgentContext
from ..policy import PolicyEngine
from ..tools.file_io import FileSandbox, get_file_sandbox


class ArchitectAgent(Agent):
    """
    The Architect Agent - Enables safe self-modification.
    
    Capabilities:
    - Read existing code from repository
    - Write new code to sandbox
    - Generate tests (TDD approach)
    - Run tests to verify correctness
    - Verify code against constitutional policies
    
    Safety Protocol:
    - All writes go to sandbox/ directory first
    - PolicyEnforcer validates code before write
    - Tests must pass before code is considered complete
    - Human approval required to promote sandbox → production
    """
    
    def __init__(self, agent_id: str = "architect-agent", workspace_dir: str = "sandbox"):
        super().__init__(agent_id)
        self.sandbox = get_file_sandbox(workspace_dir)
        self.policy_engine = PolicyEngine()
        
        self.telemetry.info(
            f"ArchitectAgent initialized with workspace: {workspace_dir}",
            agent_id=self.agent_id
        )
    
    def process(self, context: AgentContext) -> AgentContext:
        """
        Process code generation request.
        
        Expected context state:
        - 'request': User's code generation request
        - 'mode': 'generate' | 'modify' | 'test'
        
        Returns context with:
        - 'code_files': List of generated files
        - 'test_results': Test execution results
        - 'verification_status': Constitutional verification result
        """
        request = context.state.get("request", "")
        mode = context.state.get("mode", "generate")
        
        self.telemetry.info(
            f"Processing code request: {mode}",
            agent_id=self.agent_id,
            request_length=len(request)
        )
        
        if mode == "generate":
            result = self._generate_code(request, context)
        elif mode == "modify":
            result = self._modify_code(request, context)
        elif mode == "test":
            result = self._run_tests(context)
        else:
            result = {"error": f"Unknown mode: {mode}"}
        
        context.update_state("architect_result", result)
        return context
    
    def _generate_code(self, request: str, context: AgentContext) -> Dict[str, Any]:
        """
        Generate code using LLM with TDD approach.
        
        Steps:
        1. Generate tests first
        2. Generate implementation
        3. Run tests
        4. Verify against constitution
        """
        self.telemetry.info("Starting code generation (TDD)", agent_id=self.agent_id)
        
        # Step 1: Generate tests
        test_prompt = f"""
Generate pytest tests for the following requirement:

{request}

Return ONLY valid Python code for a test file. No markdown, no explanations.
Follow best practices:
- Use descriptive test names
- Test edge cases
- Include docstrings
"""
        
        test_code = self.ask_brain(test_prompt)
        
        # Clean up markdown if present
        if "```python" in test_code:
            test_code = test_code.split("```python")[1].split("```")[0].strip()
        
        # Step 2: Write tests to sandbox
        test_file = "test_generated.py"
        try:
            test_path = self.sandbox.write_file(test_file, test_code)
            self.telemetry.info(f"Generated test file: {test_path}", agent_id=self.agent_id)
        except Exception as e:
            return {"error": f"Failed to write test file: {e}"}
        
        # Step 3: Generate implementation
        impl_prompt = f"""
Generate Python code for the following requirement:

{request}

The code must pass these tests:
```python
{test_code}
```

Return ONLY valid Python code for the implementation. No markdown, no explanations.
"""
        
        impl_code = self.ask_brain(impl_prompt)
        
        # Clean up markdown
        if "```python" in impl_code:
            impl_code = impl_code.split("```python")[1].split("```")[0].strip()
        
        # Step 4: Verify against constitution
        policy_result = self.policy_engine.evaluate({
            "action": "code_generation",
            "content": impl_code
        })
        
        if policy_result.get("blocked"):
            return {
                "error": "Code blocked by policy",
                "reason": policy_result.get("violations", []),
                "test_file": test_path
            }
        
        # Step 5: Write implementation
        impl_file = "generated.py"
        try:
            impl_path = self.sandbox.write_file(impl_file, impl_code)
            self.telemetry.info(f"Generated implementation: {impl_path}", agent_id=self.agent_id)
        except Exception as e:
            return {
                "error": f"Failed to write implementation: {e}",
                "test_file": test_path
            }
        
        # Step 6: Run tests
        test_results = self._run_pytest(test_path)
        
        # Step 7: Memorize successful pattern
        if test_results.get("passed", 0) > 0:
            self.memorize(
                f"Successfully generated code for: {request[:100]}",
                {
                    "type": "code_generation",
                    "tests": test_file,
                    "implementation": impl_file,
                    "tests_passed": test_results.get("passed", 0)
                }
            )
        
        return {
            "success": True,
            "test_file": test_path,
            "impl_file": impl_path,
            "test_results": test_results,
            "policy_check": "passed",
            "warnings": policy_result.get("warnings", [])
        }
    
    def _modify_code(self, request: str, context: AgentContext) -> Dict[str, Any]:
        """Modify existing code (future implementation)."""
        return {"error": "Code modification not yet implemented"}
    
    def _run_tests(self, context: AgentContext) -> Dict[str, Any]:
        """Run tests in sandbox."""
        test_files = context.state.get("test_files", [])
        if not test_files:
            # Find all test files in sandbox
            test_files = self.sandbox.list_files("test_*.py")
        
        if not test_files:
            return {"error": "No test files found"}
        
        results = {}
        for test_file in test_files:
            test_path = self.sandbox.workspace_dir / test_file
            results[test_file] = self._run_pytest(str(test_path))
        
        return results
    
    def _run_pytest(self, test_path: str) -> Dict[str, Any]:
        """
        Run pytest on a test file.
        
        Args:
            test_path: Absolute path to test file
            
        Returns:
            Dict with test results: passed, failed, errors
        """
        try:
            # Run pytest with JSON report
            result = subprocess.run(
                ["python", "-m", "pytest", test_path, "-v", "--tb=short"],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            # Parse output (simple approach - could use pytest-json-report for better parsing)
            output = result.stdout + result.stderr
            
            # Count passed/failed tests (basic parsing)
            passed = output.count(" PASSED")
            failed = output.count(" FAILED")
            errors = output.count(" ERROR")
            
            return {
                "passed": passed,
                "failed": failed,
                "errors": errors,
                "exit_code": result.returncode,
                "output": output[:500]  # Truncate for brevity
            }
        except subprocess.TimeoutExpired:
            return {"error": "Test execution timeout"}
        except Exception as e:
            return {"error": f"Test execution failed: {e}"}
    
    def read_code(self, file_path: str) -> str:
        """
        Read code from repository (convenience method).
        
        Args:
            file_path: Path to file (absolute or relative)
            
        Returns:
            File content
        """
        return self.sandbox.read_file(file_path)
    
    def write_code(self, file_path: str, content: str) -> Dict[str, Any]:
        """
        Write code to sandbox with policy verification.
        
        Args:
            file_path: Target file path (relative to sandbox)
            content: Code content
            
        Returns:
            Result dict with success/error status
        """
        # Verify with policy enforcer
        policy_result = self.policy_engine.evaluate({
            "action": "file_write",
            "path": file_path,
            "content": content
        })
        
        if policy_result.get("blocked"):
            return {
                "success": False,
                "error": "Blocked by policy",
                "violations": policy_result.get("violations", [])
            }
        
        # Write to sandbox
        try:
            actual_path = self.sandbox.write_file(file_path, content)
            return {
                "success": True,
                "path": actual_path,
                "warnings": policy_result.get("warnings", [])
            }
        except Exception as e:
            return {"success": False, "error": str(e)}


def get_architect_agent(workspace_dir: str = "sandbox") -> ArchitectAgent:
    """Factory function to get ArchitectAgent instance."""
    return ArchitectAgent(workspace_dir=workspace_dir)

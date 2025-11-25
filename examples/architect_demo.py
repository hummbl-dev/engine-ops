#!/usr/bin/env python3
"""
The Architect Agent - Demonstration

Tests the self-evolution capability by generating a Fibonacci function.

Workflow:
1. Generate tests (TDD approach)
2. Generate implementation
3. Run tests
4. Verify against constitution
"""

import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from agentic_workflow.agents.architect_agent import ArchitectAgent
from agentic_workflow.context import AgentContext

def demo_architect():
    print("=" * 70)
    print("The Architect Agent - Self-Evolution Demo")
    print("=" * 70)
    
    # 1. Create the Architect
    print("\n[1] Initializing ArchitectAgent...")
    architect = ArchitectAgent()
    print(f"✅ Architect initialized with workspace: {architect.sandbox.workspace_dir}")
    
    # 2. Define code generation request
    request = """
Create a function `fibonacci(n)` that:
- Takes an integer n as input
- Returns the nth Fibonacci number
- Uses dynamic programming for efficiency
- Handles edge cases (n=0, n=1, negative n)
"""
    
    print(f"\n[2] Code Generation Request:")
    print(f"   {request.strip()[:80]}...")
    
    # 3. Create context
    context = AgentContext()
    context.update_state("request", request)
    context.update_state("mode", "generate")
    
    # 4. Execute the Architect
    print("\n[3] Executing Architect (TDD Workflow)...")
    print("   This will:")
    print("   - Generate tests first")
    print("   - Generate implementation")
    print("   - Run tests")
    print("   - Verify against constitution\n")
    
    result_context = architect.execute(context)
    result = result_context.state.get("architect_result", {})
    
    # 5. Display results
    print("\n" + "=" * 70)
    print("RESULTS")
    print("=" * 70)
    
    if result.get("error"):
        print(f"❌ ERROR: {result['error']}")
        if "reason" in result:
            print(f"   Reason: {result['reason']}")
        return
    
    print(f"\n✅ Code Generation Successful!")
    print(f"\n📁 Files Created:")
    print(f"   - Tests: {result.get('test_file', 'N/A')}")
    print(f"   - Implementation: {result.get('impl_file', 'N/A')}")
    
    test_results = result.get("test_results", {})
    print(f"\n🧪 Test Results:")
    print(f"   - Passed: {test_results.get('passed', 0)}")
    print(f"   - Failed: {test_results.get('failed', 0)}")
    print(f"   - Errors: {test_results.get('errors', 0)}")
    
    policy_check = result.get("policy_check", "unknown")
    print(f"\n🛡️  Constitutional Verification: {policy_check.upper()}")
    
    warnings = result.get("warnings", [])
    if warnings:
        print(f"\n⚠️  Warnings:")
        for warning in warnings:
            print(f"   - {warning}")
    
    # 6. Show generated code
    print(f"\n" + "=" * 70)
    print("GENERATED CODE")
    print("=" * 70)
    
    try:
        impl_content = architect.read_code(result.get("impl_file", ""))
        print("\n📄 Implementation:")
        print("-" * 70)
        print(impl_content[:500])  # Show first 500 chars
        if len(impl_content) > 500:
            print("... (truncated)")
        print("-" * 70)
    except Exception as e:
        print(f"Could not read implementation: {e}")
    
    # 7. Summary
    print("\n" + "=" * 70)
    print("✅ ARCHITECT DEMO COMPLETE")
    print("=" * 70)
    print("\nNext Steps:")
    print("1. Review generated code in sandbox/")
    print("2. If approved, manually copy to production")
    print("3. The Architect learns from successful patterns")

if __name__ == "__main__":
    demo_architect()

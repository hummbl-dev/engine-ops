#!/usr/bin/env python3
"""
Compliance and Governance Demo

This script demonstrates the Sovereign Stack's governance capabilities by:
1. Executing a critical workflow with security constraints
2. Enforcing policy rules (simulated)
3. Generating a comprehensive audit report
4. Verifying compliance status
"""

import sys
import os
import json
import uuid
from datetime import datetime, timezone
from dotenv import load_dotenv

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load environment variables from .env file
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))

from agentic_workflow.workflow import WorkflowOrchestrator
from agentic_workflow.context import (
    AgentContext, IdentityContext, IntentContext, SecurityContext
)
from agentic_workflow.agents.detection_agent import DetectionAgent
from agentic_workflow.agents.triage_agent import TriageAgent
from agentic_workflow.agents.resolution_agent import ResolutionAgent
from agentic_workflow.agents.audit_agent import AuditAgent
from agentic_workflow.policy import PolicyEngine, PolicyRule, PolicyAction, EscalationLevel

def main():
    print("🔒 Sovereign Stack Governance Demo")
    print("==================================")
    
    # 1. Setup Policy Engine
    print("\n[1] Initializing Policy Engine...")
    policy_engine = PolicyEngine()
    
    # Add a custom rule for the demo
    policy_engine.add_rule(PolicyRule(
        rule_id="demo_pii_check",
        name="PII Protection",
        description="Ensure PII is handled in confidential contexts only",
        condition=lambda ctx: (
            "pii" in ctx.get("payload", {}).get("input_data", {}) and 
            ctx.get("security", {}).get("data_classification") != "confidential"
        ),
        action=PolicyAction.ESCALATE,
        escalation_level=EscalationLevel.CRITICAL,
        priority=90
    ))
    print("    ✓ Default rules loaded")
    print("    ✓ Custom PII Protection rule added")

    # 2. Setup Workflow Orchestrator
    print("\n[2] Setting up Workflow Orchestrator...")
    orchestrator = WorkflowOrchestrator(
        workflow_id=f"demo-compliance-{uuid.uuid4().hex[:8]}",
        policy_engine=policy_engine
    )
    
    orchestrator.add_agent(DetectionAgent())
    orchestrator.add_agent(TriageAgent())
    orchestrator.add_agent(ResolutionAgent())
    orchestrator.add_agent(AuditAgent())
    print(f"    ✓ Workflow ID: {orchestrator.workflow_id}")
    print("    ✓ Agents registered: Detection, Triage, Resolution, Audit")

    # 3. Create Context
    print("\n[3] Creating Secure Context...")
    identity = IdentityContext(
        agent_id="governance_demo_bot",
        user_id="admin_user",
        organization_id="hummbl_corp",
        role="compliance_officer"
    )
    
    intent = IntentContext(
        primary_intent="remediate_security_incident",
        priority="critical",
        goals=["detect_breach", "contain_threat", "audit_trail"]
    )
    
    # Security context is key for governance
    context = AgentContext(identity=identity, intent=intent)
    context.security.data_classification = "confidential"
    context.security.encryption_required = True
    context.security.audit_required = True
    context.security.sensitive_fields = ["user_email", "ip_address"]
    
    context.payload.input_data = {
        "incident_type": "suspicious_login",
        "pii": True,  # This would trigger our rule if classification wasn't confidential
        "user_email": "target@example.com",
        "ip_address": "192.168.1.100",
        "metrics": {
            "failed_attempts": 15,
            "latency": 200
        }
    }
    
    print("    ✓ Identity established")
    print("    ✓ Security context configured (Confidential, Audit Required)")
    print("    ✓ Input data prepared")

    # 4. Execute Workflow
    print("\n[4] Executing Workflow...")
    start_time = datetime.now(timezone.utc)
    result = orchestrator.execute(context)
    end_time = datetime.now(timezone.utc)
    
    duration = (end_time - start_time).total_seconds()
    print(f"    ✓ Execution completed in {duration:.2f}s")
    print(f"    ✓ Final State: {result.state.current_state}")

    # 5. Analyze Results
    print("\n[5] Governance Analysis")
    print("-----------------------")
    
    audit_report = result.payload.output_data.get("audit_report", {})
    compliance_records = result.payload.output_data.get("compliance_records", [])
    
    print(f"Audit ID: {audit_report.get('audit_id')}")
    print(f"Compliance Status: {audit_report.get('compliance_status')}")
    print(f"Total Telemetry Events: {audit_report.get('execution_summary', {}).get('total_events')}")
    
    print("\nCompliance Records:")
    for record in compliance_records:
        status_icon = "✅" if record.get("compliance_status") == "compliant" else "❌"
        print(f"  {status_icon} {record.get('record_type', 'Policy Check')}: {record.get('compliance_status')}")
        if "details" in record:
            print(f"    Details: {json.dumps(record['details'], indent=2)}")

    print("\nPolicy Evaluations:")
    # We can access the policy engine history through the orchestrator if we exposed it, 
    # but for now we'll look at the audit report events if they captured it.
    # Alternatively, we can check the result context for any policy-related annotations.
    
    if result.policy.approval_required:
        print("  ⚠️  Approval Required for some actions")
    else:
        print("  ✓ No manual approval required")

    print("\nArtifact Generation:")
    print(f"  ✓ Audit Report generated with {len(audit_report.get('telemetry_events', []))} events")
    
    # Save audit report to file
    report_path = "demo_audit_report.json"
    with open(report_path, "w") as f:
        json.dump(audit_report, f, indent=2)
    print(f"  ✓ Saved full report to {report_path}")

if __name__ == "__main__":
    main()

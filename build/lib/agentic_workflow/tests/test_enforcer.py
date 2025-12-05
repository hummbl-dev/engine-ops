# -*- coding: utf-8 -*-
"""Tests for the Policy Enforcement Layer."""

import unittest
from agentic_workflow.enforcer import PolicyEnforcer, EnforcementResult

class TestPolicyEnforcer(unittest.TestCase):
    
    def setUp(self):
        self.enforcer = PolicyEnforcer()
    
    def test_dangerous_command_rm_rf(self):
        """Test that rm -rf / is blocked."""
        result = self.enforcer.validate_action("execute_command", "rm -rf /")
        self.assertFalse(result.allowed)
        self.assertEqual(result.severity, "critical")
        self.assertIn("Recursive deletion", result.reason)
    
    def test_dangerous_command_drop_table(self):
        """Test that DROP TABLE is blocked."""
        result = self.enforcer.validate_action("query_database", "DROP TABLE users")
        self.assertFalse(result.allowed)
        self.assertEqual(result.severity, "critical")
        self.assertIn("SQL table deletion", result.reason)
    
    def test_dangerous_command_fork_bomb(self):
        """Test that fork bomb is blocked."""
        result = self.enforcer.validate_action("execute_command", ":(){ :|:& };:")
        self.assertFalse(result.allowed)
        self.assertEqual(result.severity, "critical")
    
    def test_pii_ssn_detection(self):
        """Test that SSN patterns are blocked."""
        result = self.enforcer.validate_action("log_data", "User SSN: 123-45-6789")
        self.assertFalse(result.allowed)
        self.assertEqual(result.severity, "critical")
        self.assertIn("SSN pattern", result.reason)
    
    def test_pii_credit_card_detection(self):
        """Test that credit card patterns are blocked."""
        result = self.enforcer.validate_action("log_data", "Card: 4532 1234 5678 9010")
        self.assertFalse(result.allowed)
        self.assertIn("Credit card", result.reason)
    
    def test_safe_action_allowed(self):
        """Test that safe actions are allowed."""
        result = self.enforcer.validate_action("restart_service", "systemctl restart nginx")
        self.assertTrue(result.allowed)
        self.assertEqual(result.severity, "info")
    
    def test_validate_resolution(self):
        """Test resolution validation."""
        dangerous_resolution = {
            "rule_id": "cleanup",
            "resolution_action": "execute_command",
            "resolution_details": "rm -rf /"
        }
        result = self.enforcer.validate_resolution(dangerous_resolution)
        self.assertFalse(result.allowed)
        
        safe_resolution = {
            "rule_id": "restart",
            "resolution_action": "restart_service",
            "resolution_details": "nginx"
        }
        result = self.enforcer.validate_resolution(safe_resolution)
        self.assertTrue(result.allowed)

if __name__ == "__main__":
    unittest.main()

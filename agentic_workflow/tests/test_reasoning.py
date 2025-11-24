# -*- coding: utf-8 -*-
"""Tests for the Reasoning module."""

import unittest
from agentic_workflow.reasoning import ReasoningTrace, CritiqueEngine, CritiqueResult

class TestReasoningTrace(unittest.TestCase):
    
    def test_reasoning_trace_creation(self):
        """Test creating a reasoning trace."""
        trace = ReasoningTrace(
            steps=["Step 1", "Step 2"],
            confidence=0.8,
            assumptions=["Assumption 1"],
            alternatives_considered=["Alt 1"]
        )
        self.assertEqual(len(trace.steps), 2)
        self.assertEqual(trace.confidence, 0.8)

class TestCritiqueEngine(unittest.TestCase):
    
    def setUp(self):
        self.engine = CritiqueEngine()
    
    def test_parse_reasoning_trace(self):
        """Test parsing LLM output into ReasoningTrace."""
        llm_output = """<thinking>
Step 1: Analyze the problem
Step 2: Consider solutions
Assumptions: System is stable
Alternatives: Option A, Option B
Confidence: 0.75
</thinking>

Final answer here."""
        
        trace = self.engine.parse_reasoning_trace(llm_output)
        self.assertEqual(len(trace.steps), 2)
        self.assertEqual(len(trace.assumptions), 1)
        self.assertGreaterEqual(len(trace.alternatives_considered), 1)  # At least one alternative
        self.assertEqual(trace.confidence, 0.75)
    
    def test_critique_shallow_reasoning(self):
        """Test that shallow reasoning is flagged."""
        trace = ReasoningTrace(
            steps=["Step 1"],  # Too few steps
            confidence=0.9,
            raw_trace="Step 1: Do something"
        )
        critique = self.engine.critique_reasoning(trace)
        self.assertTrue(any("shallow" in issue.lower() for issue in critique.issues))
    
    def test_critique_missing_assumptions(self):
        """Test that missing assumptions are flagged."""
        trace = ReasoningTrace(
            steps=["Step 1", "Step 2", "Step 3"],
            confidence=0.95,
            assumptions=[],  # No assumptions stated
            raw_trace="Step 1: A\nStep 2: B\nStep 3: C"
        )
        critique = self.engine.critique_reasoning(trace)
        self.assertTrue(any("assumption" in issue.lower() for issue in critique.issues))
    
    def test_critique_logical_fallacy(self):
        """Test that logical fallacies are detected."""
        trace = ReasoningTrace(
            steps=["Step 1", "Step 2", "Step 3"],
            raw_trace="This is obviously the best solution. Everyone knows this."
        )
        critique = self.engine.critique_reasoning(trace)
        self.assertTrue(any("obviousness" in issue.lower() for issue in critique.issues))
    
    def test_critique_good_reasoning(self):
        """Test that good reasoning passes critique."""
        trace = ReasoningTrace(
            steps=["Step 1", "Step 2", "Step 3", "Step 4"],
            confidence=0.7,
            assumptions=["Assumption 1"],
            alternatives_considered=["Alt 1"],
            raw_trace="Step 1: A\nStep 2: B\nStep 3: C\nAssumptions: X\nAlternatives: Y\nRisk: Z"
        )
        critique = self.engine.critique_reasoning(trace)
        self.assertFalse(critique.needs_revision)
        self.assertGreater(critique.confidence_score, 0.7)

if __name__ == "__main__":
    unittest.main()

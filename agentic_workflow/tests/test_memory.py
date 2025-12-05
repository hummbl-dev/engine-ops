# -*- coding: utf-8 -*-
"""Tests for the Episodic Memory system."""

import unittest
from unittest.mock import MagicMock, patch
from agentic_workflow.memory import ChromaDBStore, MemoryEntry, get_memory_store
from agentic_workflow.agent_base import Agent
from agentic_workflow.context import AgentContext


class TestMemorySystem(unittest.TestCase):

    def setUp(self):
        # Reset global memory
        import agentic_workflow.memory

        agentic_workflow.memory._global_memory = None

    @patch("agentic_workflow.memory.CHROMA_AVAILABLE", True)
    @patch("agentic_workflow.memory.chromadb")
    def test_chromadb_store_initialization(self, mock_chroma):
        """Test that ChromaDBStore initializes correctly."""
        mock_client = MagicMock()
        mock_chroma.PersistentClient.return_value = mock_client

        store = ChromaDBStore()

        mock_chroma.PersistentClient.assert_called_once()
        mock_client.get_or_create_collection.assert_called_with(name="agent_memory")
        self.assertTrue(store.enabled)

    @patch("agentic_workflow.memory.CHROMA_AVAILABLE", True)
    @patch("agentic_workflow.memory.chromadb")
    def test_chromadb_store_add_search(self, mock_chroma):
        """Test adding and searching memories."""
        mock_client = MagicMock()
        mock_collection = MagicMock()
        mock_chroma.PersistentClient.return_value = mock_client
        mock_client.get_or_create_collection.return_value = mock_collection

        store = ChromaDBStore()

        # Test Add
        store.add("test content", {"meta": "data"})
        mock_collection.add.assert_called_once()

        # Test Search
        mock_collection.query.return_value = {
            "ids": [["id1"]],
            "documents": [["test content"]],
            "metadatas": [[{"meta": "data"}]],
            "distances": [[0.1]],
        }

        results = store.search("query")
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0].content, "test content")
        self.assertAlmostEqual(results[0].score, 1.0 / 1.1)

    def test_agent_memory_integration(self):
        """Test that Agent correctly interfaces with memory."""
        # Mock the memory store
        mock_store = MagicMock()
        mock_store.search.return_value = [MemoryEntry(content="past solution", score=0.9)]

        # Patch get_memory_store to return our mock
        with patch("agentic_workflow.agent_base.get_memory_store", return_value=mock_store):

            class TestAgent(Agent):
                def process(self, context):
                    return context

            agent = TestAgent(agent_id="test")

            # Test Memorize
            agent.memorize("new solution", {"type": "fix"})
            mock_store.add.assert_called_with("new solution", {"type": "fix", "agent_id": "test"})

            # Test Recall
            memories = agent.recall("problem")
            mock_store.search.assert_called_with("problem", limit=3)
            self.assertEqual(len(memories), 1)
            self.assertEqual(memories[0].content, "past solution")

    @patch("agentic_workflow.agent_base.Agent.get_system_prompt", return_value="System Prompt")
    @patch("engine.providers.generate_content", return_value="Response")
    def test_ask_brain_with_memory(self, mock_gen, mock_prompt):
        """Test that ask_brain includes memory context when requested."""
        mock_store = MagicMock()
        mock_store.search.return_value = [MemoryEntry(content="Past Fix", score=0.9)]

        with patch("agentic_workflow.agent_base.get_memory_store", return_value=mock_store):

            class TestAgent(Agent):
                def process(self, context):
                    return context

            agent = TestAgent(agent_id="test")

            # Call with use_memory=True
            agent.ask_brain("Fix this", use_memory=True)

            # Check that memory was searched
            mock_store.search.assert_called_with("Fix this", limit=3)

            # Check that prompt contained the memory
            called_prompt = mock_gen.call_args[0][1]
            self.assertIn("Past Fix", called_prompt)
            self.assertIn("# RELEVANT MEMORIES", called_prompt)


if __name__ == "__main__":
    unittest.main()

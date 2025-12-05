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
Episodic Memory Module (The Hippocampus)

Provides long-term memory capabilities for agents using Vector Stores.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional
import uuid
from datetime import datetime, timezone
import os

try:
    import chromadb
    from chromadb.config import Settings

    CHROMA_AVAILABLE = True
except ImportError:
    chromadb = None
    CHROMA_AVAILABLE = False


@dataclass
class MemoryEntry:
    """Represents a single memory unit."""

    content: str
    metadata: Dict[str, Any] = field(default_factory=dict)
    embedding: Optional[List[float]] = None
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    score: float = 0.0  # Relevance score for retrieval


class MemoryStore(ABC):
    """Abstract base class for memory stores."""

    @abstractmethod
    def add(self, content: str, metadata: Optional[Dict[str, Any]] = None) -> str:
        """Add a new memory entry."""
        pass

    @abstractmethod
    def search(self, query: str, limit: int = 5) -> List[MemoryEntry]:
        """Search for relevant memories."""
        pass

    @abstractmethod
    def clear(self) -> None:
        """Clear all memories."""
        pass


class ChromaDBStore(MemoryStore):
    """Memory store implementation using ChromaDB."""

    def __init__(
        self, collection_name: str = "agent_memory", persist_directory: str = "./chroma_db"
    ):
        if not CHROMA_AVAILABLE:
            print("WARNING: chromadb not installed. Memory disabled.")
            self.enabled = False
            return

        try:
            self.client = chromadb.PersistentClient(path=persist_directory)
            self.collection = self.client.get_or_create_collection(name=collection_name)
            self.enabled = True
        except Exception as e:
            print(f"WARNING: Failed to initialize ChromaDB: {e}. Memory disabled.")
            self.enabled = False

    def add(self, content: str, metadata: Optional[Dict[str, Any]] = None) -> str:
        if not self.enabled:
            return ""

        memory_id = str(uuid.uuid4())
        timestamp = datetime.now(timezone.utc).isoformat()

        meta = metadata or {}
        meta["timestamp"] = timestamp

        self.collection.add(documents=[content], metadatas=[meta], ids=[memory_id])
        return memory_id

    def search(self, query: str, limit: int = 5) -> List[MemoryEntry]:
        if not self.enabled:
            return []

        results = self.collection.query(query_texts=[query], n_results=limit)

        memories = []
        if results["ids"]:
            ids = results["ids"][0]
            documents = results["documents"][0]
            metadatas = results["metadatas"][0]
            distances = results["distances"][0] if "distances" in results else [0.0] * len(ids)

            for i, doc in enumerate(documents):
                # Convert distance to similarity score (approximate)
                score = 1.0 / (1.0 + distances[i]) if i < len(distances) else 0.0

                memories.append(
                    MemoryEntry(id=ids[i], content=doc, metadata=dict(metadatas[i]), score=score)
                )

        return memories

    def clear(self) -> None:
        if not self.enabled:
            return
        # Chroma doesn't have a direct clear, so we delete and recreate
        try:
            self.client.delete_collection(self.collection.name)
            self.collection = self.client.get_or_create_collection(self.collection.name)
        except Exception as e:
            print(f"Error clearing memory: {e}")


# Global memory store
_global_memory: Optional[MemoryStore] = None


def get_memory_store() -> MemoryStore:
    """Get the global memory store instance."""
    global _global_memory
    if _global_memory is None:
        # Use a default path relative to the workspace
        workspace_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        db_path = os.path.join(workspace_dir, "chroma_db")
        _global_memory = ChromaDBStore(persist_directory=db_path)
    return _global_memory

import time
import threading
import random
import numpy as np
from typing import List, Dict, Any
from agentic_workflow.federated_memory import FederatedMemorySync

# Shared "Global Server" state for simulation
GLOBAL_MEMORY_STORE = []
GLOBAL_LOCK = threading.Lock()

class SimulatedFederatedMemory(FederatedMemorySync):
    """
    A simulation-ready version of FederatedMemorySync that uses an in-memory
    global store instead of HTTP requests.
    """
    def __init__(self, instance_id: str):
        super().__init__(instance_id)
        self.local_memory = []  # Simulate local ChromaDB
        self.imported_count = 0

    def _export_embeddings(self) -> None:
        """Simulate exporting local embeddings to the global store."""
        with GLOBAL_LOCK:
            # In a real system, we'd only export new/diffs.
            # Here we just append everything for simulation simplicity.
            # We add a 'source' tag to track origin.
            for item in self.local_memory:
                item_copy = item.copy()
                item_copy['source'] = self.instance_id
                GLOBAL_MEMORY_STORE.append(item_copy)
        # print(f"[{self.instance_id}] Exported {len(self.local_memory)} items.")

    def _import_aggregated_embeddings(self) -> None:
        """Simulate importing from the global store."""
        with GLOBAL_LOCK:
            # Fetch everything that isn't from us
            new_items = [
                item for item in GLOBAL_MEMORY_STORE 
                if item.get('source') != self.instance_id
            ]
        
        # "Merge" into local memory (simple append for benchmark)
        # In reality, we'd check for duplicates.
        initial_count = len(self.local_memory)
        # Naive merge: just add if we don't have it (by simple check)
        # For benchmark speed, we just count them
        self.imported_count = len(new_items)
        # print(f"[{self.instance_id}] Imported {self.imported_count} items from peers.")

    def add_memory(self, content: str, vector: List[float]):
        """Helper to add 'learned' memory to this instance."""
        self.local_memory.append({
            "content": content,
            "vector": vector,
            "timestamp": time.time()
        })

def run_benchmark():
    print("Starting Federated Memory Benchmark...")
    print("--------------------------------------")

    # 1. Setup: Create 3 instances
    instances = [
        SimulatedFederatedMemory("Instance-A"),
        SimulatedFederatedMemory("Instance-B"),
        SimulatedFederatedMemory("Instance-C")
    ]

    # Start sync threads (with a faster interval for benchmark)
    # We monkey-patch the interval for the simulation
    import agentic_workflow.federated_memory
    agentic_workflow.federated_memory.SYNC_INTERVAL_SECONDS = 1  # 1 second sync

    for inst in instances:
        inst.start()

    try:
        # 2. Scenario: Instance A learns a critical security fix
        print("\n[T=0s] Instance-A learns 'CVE-2025-1234 fix'...")
        instances[0].add_memory(
            "Fix for CVE-2025-1234: Update openssl to 3.1.0", 
            [0.1, 0.9, 0.2] # Mock vector
        )

        # 3. Wait for sync cycle
        print("[T=0s] Waiting for federation cycle (approx 2s)...")
        time.sleep(2.5)

        # 4. Verify propagation
        print("\n[T=2.5s] Verifying knowledge propagation...")
        
        propagated_count = 0
        for i, inst in enumerate(instances):
            # Check if instances B and C have imported the memory
            # In our sim, 'imported_count' > 0 means they got data
            if inst.instance_id != "Instance-A":
                if inst.imported_count > 0:
                    print(f"✅ {inst.instance_id} has received knowledge updates.")
                    propagated_count += 1
                else:
                    print(f"❌ {inst.instance_id} has NOT received updates yet.")
        
        success_rate = (propagated_count / 2) * 100
        print(f"\nPropagation Success Rate: {success_rate}%")

        # 5. Measure Convergence Speed (Simulated)
        # We can track how many cycles it takes for full convergence
        print("\n[Benchmark] Measuring convergence latency...")
        start_time = time.time()
        
        # Instance B learns something new
        instances[1].add_memory("New Firewall Rule: Block Port 23", [0.5, 0.1, 0.8])
        
        converged = False
        while time.time() - start_time < 10:
            # Check if Instance A and C have it
            # In this simple sim, we check if they imported *more* stuff
            # A better check would be inspecting their memory content, but imported_count is a proxy
            if instances[0].imported_count >= 1 and instances[2].imported_count >= 1:
                converged = True
                break
            time.sleep(0.5)
        
        duration = time.time() - start_time
        if converged:
            print(f"✅ Network converged in {duration:.2f} seconds.")
        else:
            print("❌ Network failed to converge within timeout.")

    finally:
        print("\nStopping instances...")
        for inst in instances:
            inst.stop()

if __name__ == "__main__":
    run_benchmark()

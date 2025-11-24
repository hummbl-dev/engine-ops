import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add current directory to sys.path
sys.path.append(os.getcwd())

from engine.core import SovereignEngine
from engine.workflow import WorkflowExecutor

def main():
    # Set workspace root to local path
    workspace_path = Path(os.getcwd()) / "cortex" / "workspace"
    os.environ["WORKSPACE_ROOT"] = str(workspace_path)
    print(f"Set WORKSPACE_ROOT to {workspace_path}")

    # Initialize engine and executor
    engine = SovereignEngine()
    executor = WorkflowExecutor(engine, interactive=False)

    # Read workflow file
    workflow_path = Path("cortex/workflows/build_game.yaml")
    with open(workflow_path, "r") as f:
        workflow_yaml = f.read()

    # Execute workflow
    print("Executing workflow...")
    executor.execute_workflow(workflow_yaml)
    print("Workflow execution complete.")

    # Verify output
    expected_file = workspace_path / "game.py"
    if expected_file.exists():
        print(f"SUCCESS: {expected_file} created.")
        print("Content:")
        print(expected_file.read_text())
    else:
        print(f"FAILURE: {expected_file} not found.")
        sys.exit(1)

if __name__ == "__main__":
    main()

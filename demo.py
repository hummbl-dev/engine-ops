import argparse
import sys

def main():
    parser = argparse.ArgumentParser(description="Sovereign Stack CLI")
    parser.add_argument("--mode", type=str, required=True, choices=["chat", "workflow", "recall"])
    parser.add_argument("--input", type=str, help="Input file for workflow processing")
    args = parser.parse_args()

    print(f"[*] Initializing Engine in MODE: {args.mode.upper()}")
    
    if args.mode == "chat":
        print(">>> Link established. Type 'exit' to quit.")
        while True:
            i = input("You > ")
            if i == "exit": break
            print("Engine > [Simulated Response]")
            
    elif args.mode == "workflow":
        print(">>> Executing Headless Workflow...")
        from engine.core import SovereignEngine
        from engine.workflow import WorkflowExecutor
        
        engine = SovereignEngine()
        executor = WorkflowExecutor(engine, interactive=False)
        
        # Determine workflow file
        workflow_file = "cortex/workflows/sovereign_auditor.yaml"
        context = ""
        
        if args.input:
            # If input is a yaml file, treat it as the workflow
            if args.input.endswith(".yaml") or args.input.endswith(".yml"):
                workflow_file = args.input
                print(f"[+] Using workflow file: {workflow_file}")
            else:
                # Otherwise treat it as context for the default workflow
                with open(args.input, "r") as f:
                    context = f.read()
                print(f"[+] Loaded target context: {args.input}")
        
        # Load workflow
        try:
            with open(workflow_file, "r") as f:
                workflow_content = f.read()
        except FileNotFoundError:
            print(f"[!] Workflow file not found: {workflow_file}")
            return
        
        print(f"[+] Executing Workflow: {workflow_file}...")
        executor.execute_workflow(workflow_content, context=context)
        print("[✓] Workflow execution complete.")
        
    elif args.mode == "recall":
        print(">>> Accessing Memory (WAL)...")
        print("[*] 34 Records found.")

if __name__ == "__main__":
    main()

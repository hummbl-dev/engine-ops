#!/usr/bin/env python3
"""
Sovereign Intelligence Kernel
The Constitutional Enforcement Engine

Usage:
    python sovereign.py "Write a function to calculate fibonacci"
    python sovereign.py "Write a script to drop database production"
"""

import yaml
import re
import time
import sys
from rich.console import Console
from rich.panel import Panel
from rich.tree import Tree

# Initialize UI
console = Console()

class SovereignKernel:
    def __init__(self, config_path="config/constitution.yaml"):
        self.console = Console()
        self.config = self.load_config(config_path)

    def load_config(self, path):
        """Loads the Sovereign Constitution."""
        try:
            with open(path, "r") as f:
                return yaml.safe_load(f)
        except FileNotFoundError:
            self.console.print("[bold red]FATAL:[/bold red] Constitution not found at config/constitution.yaml")
            sys.exit(1)

    def glass_box_audit(self, prompt):
        """
        The Core Logic: Runs the prompt against the Constitution.
        Returns (allowed: bool, reason: str)
        """
        directives = self.config.get("directives", [])
        
        # Create the detailed visual tree for the "Glass Box"
        tree = Tree("🔍 [bold cyan]Sovereign Auditor[/bold cyan]")
        
        allowed = True
        final_reason = "Passed all checks."

        for rule in directives:
            rule_id = rule.get("id")
            pattern = rule.get("pattern")
            action = rule.get("action")
            desc = rule.get("name")
            
            # The Inspection Step
            step_node = tree.add(f"Checking Rule [bold yellow]{rule_id}[/bold yellow]: {desc}")
            time.sleep(0.3)  # Artificial latency to simulate "Thinking"
            
            if re.search(pattern, prompt):
                # VIOLATION DETECTED
                if action == "block":
                    step_node.add(f"[bold red]VIOLATION DETECTED[/bold red]")
                    step_node.add(f"Action: [bold red]BLOCK[/bold red]")
                    step_node.add(f"Reason: {rule.get('reason')}")
                    allowed = False
                    final_reason = f"Blocked by {rule_id}: {rule.get('reason')}"
                    break  # Halt immediately on block
                
                elif action == "warn":
                    step_node.add(f"[bold orange3]WARNING DETECTED[/bold orange3]")
                    step_node.add(f"Action: [bold orange3]FLAG[/bold orange3]")
            else:
                step_node.add("[green]PASSED[/green]")

        return tree, allowed, final_reason

    def execute(self, prompt):
        """The Main Loop"""
        self.console.print(Panel.fit(f"[bold white]Input:[/bold white] {prompt}", title="Sovereign Engine Input"))

        # 1. The Glass Box Phase
        tree, allowed, reason = self.glass_box_audit(prompt)
        self.console.print(Panel(tree, title="Glass Box Logic", border_style="blue"))

        # 2. The Decision Phase
        if not allowed:
            self.console.print(Panel(f"[bold red]🔒 INTERVENTION:[/bold red] {reason}", border_style="red"))
            return

        # 3. The "Model" Phase (Simulated for this demo)
        with self.console.status("[bold green]Routing to Model (Claude-3)...[/bold green]", spinner="dots"):
            time.sleep(1.5)  # Simulate network request
            response = "Here is the code you requested based on safe parameters..."
        
        self.console.print(Panel(response, title="Model Output", border_style="green"))

if __name__ == "__main__":
    # Start federated memory synchronization service
    from agentic_workflow.federated_memory import get_federated_sync_service
    sync_service = get_federated_sync_service()
    sync_service.start()

    kernel = SovereignKernel()
    
    # Get input from user
    if len(sys.argv) > 1:
        user_prompt = " ".join(sys.argv[1:])
    else:
        console.print("[bold]Enter your command:[/bold]")
        user_prompt = input("> ")

    kernel.execute(user_prompt)
    
    # Gracefully stop the sync service on exit
    sync_service.stop()

#!/usr/bin/env python3
"""
Sovereign D-T CLI
Interactive tool for exploring the Dimensional-Transformational Framework

Usage:
    sovereign-dt interactive           # Launch interactive mode
    sovereign-dt new "Model Name"      # Create new model
    sovereign-dt apply Accretion epistemic --intensity 0.4
    sovereign-dt show                  # Display current state
"""

import sys
import json
import os
from pathlib import Path
from typing import Optional
import argparse

# Add dt_framework to path
sys.path.insert(0, str(Path(__file__).parent))

from mental_model import MentalModel

# ANSI color codes
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'


class DTCli:
    """Command-line interface for D-T Framework."""
    
    def __init__(self):
        self.model: Optional[MentalModel] = None
        self.state_file = Path.home() / ".sovereign" / "dt_model.json"
        self.state_file.parent.mkdir(exist_ok=True)
    
    def load_model(self) -> bool:
        """Load saved model if exists."""
        if self.state_file.exists():
            try:
                with open(self.state_file, 'r') as f:
                    data = json.load(f)
                self.model = MentalModel(data['name'], data['dimensions'])
                return True
            except Exception as e:
                print(f"{Colors.FAIL}Error loading model: {e}{Colors.ENDC}")
        return False
    
    def save_model(self):
        """Save current model state."""
        if self.model:
            with open(self.state_file, 'w') as f:
                json.dump({
                    'name': self.model.name,
                    'dimensions': self.model.dimensions
                }, f)
    
    def new_model(self, name: str, initial: Optional[dict] = None):
        """Create a new mental model."""
        self.model = MentalModel(name, initial)
        self.save_model()
        print(f"{Colors.OKGREEN}✓ Created model: {name}{Colors.ENDC}\n")
        self.show()
    
    def set_dimension(self, dimension: str, value: float):
        """Set a specific dimension value."""
        if not self.model:
            print(f"{Colors.FAIL}No model loaded. Use 'new' first.{Colors.ENDC}")
            return
        
        if dimension not in self.model.VALID_DIMENSIONS:
            print(f"{Colors.FAIL}Invalid dimension. Choose from: {', '.join(self.model.VALID_DIMENSIONS)}{Colors.ENDC}")
            return
        
        value = max(0.0, min(1.0, value))
        self.model.dimensions[dimension] = value
        self.save_model()
        print(f"{Colors.OKGREEN}✓ Set {dimension} = {value:.3f}{Colors.ENDC}\n")
        self.show()
    
    def apply_transformation(self, transformation: str, dimension: str, intensity: float = 0.1):
        """Apply a transformation to a dimension."""
        if not self.model:
            print(f"{Colors.FAIL}No model loaded. Use 'new' first.{Colors.ENDC}")
            return
        
        print(f"{Colors.HEADER}═══ Applying Transformation ═══{Colors.ENDC}\n")
        print(f"Transformation: {Colors.BOLD}{transformation}{Colors.ENDC}")
        print(f"Target: {Colors.BOLD}{dimension}{Colors.ENDC}")
        print(f"Intensity: {Colors.BOLD}{intensity}{Colors.ENDC}\n")
        
        try:
            dims, warning, friction = self.model.apply(transformation, dimension, intensity)
            
            if warning:
                print(f"{Colors.WARNING}⚠ {warning}{Colors.ENDC}\n")
            
            if friction > 0.5:
                print(f"{Colors.FAIL}Friction: {friction:.1%} - SIGNIFICANT RESISTANCE{Colors.ENDC}\n")
            elif friction > 0:
                print(f"{Colors.WARNING}Friction: {friction:.1%}{Colors.ENDC}\n")
            else:
                print(f"{Colors.OKGREEN}Friction: 0% - FULL EFFECT{Colors.ENDC}\n")
            
            self.save_model()
            self.show()
            
        except Exception as e:
            print(f"{Colors.FAIL}Error: {e}{Colors.ENDC}")
    
    def show(self):
        """Display current model state."""
        if not self.model:
            print(f"{Colors.FAIL}No model loaded. Use 'new' first.{Colors.ENDC}")
            return
        
        print(f"{Colors.HEADER}{'═'*60}{Colors.ENDC}")
        print(f"{Colors.BOLD}{self.model.name}{Colors.ENDC}")
        print(f"{Colors.HEADER}{'═'*60}{Colors.ENDC}")
        
        for dim, val in self.model.dimensions.items():
            # Color code by value
            if val >= 0.7:
                color = Colors.OKGREEN
            elif val >= 0.4:
                color = Colors.WARNING
            else:
                color = Colors.FAIL
            
            bar_length = int(val * 30)
            bar = "█" * bar_length + "░" * (30 - bar_length)
            print(f"{dim:15} │ {color}{bar}{Colors.ENDC} {val:.3f}")
        
        print(f"{Colors.HEADER}{'═'*60}{Colors.ENDC}\n")
    
    def show_ripples(self):
        """Display ripple effect map."""
        from constraints import CouplingRegistry
        
        print(f"{Colors.HEADER}═══ Ripple Effect Map ═══{Colors.ENDC}\n")
        
        for source, targets in CouplingRegistry.RIPPLES.items():
            print(f"{Colors.BOLD}{source}:{Colors.ENDC}")
            for target, factor in targets:
                if factor > 0:
                    arrow = f"{Colors.OKGREEN}→ ⬆{Colors.ENDC}"
                    effect = "Synergistic"
                else:
                    arrow = f"{Colors.FAIL}→ ⬇{Colors.ENDC}"
                    effect = "Antagonistic"
                
                print(f"  {arrow} {target} ({effect}, {factor:+.1f})")
            print()
    
    def interactive_mode(self):
        """Launch interactive shell."""
        print(f"{Colors.HEADER}")
        print("╔══════════════════════════════════════════════════════════════╗")
        print("║     Sovereign D-T Framework - Interactive Mode              ║")
        print("╚══════════════════════════════════════════════════════════════╝")
        print(f"{Colors.ENDC}\n")
        
        # Try to load existing model
        if self.load_model():
            print(f"{Colors.OKGREEN}✓ Loaded existing model{Colors.ENDC}\n")
            self.show()
        else:
            print("No saved model found. Creating new one...\n")
            self.new_model("Interactive Session")
        
        print(f"{Colors.OKCYAN}Commands:{Colors.ENDC}")
        print("  apply <transformation> <dimension> [intensity]")
        print("  set <dimension> <value>")
        print("  show")
        print("  ripples")
        print("  reset")
        print("  export <filename>")
        print("  help")
        print("  quit")
        print()
        
        while True:
            try:
                cmd = input(f"{Colors.BOLD}dt> {Colors.ENDC}").strip()
                
                if not cmd:
                    continue
                
                parts = cmd.split()
                action = parts[0].lower()
                
                if action == 'quit' or action == 'exit':
                    print(f"{Colors.OKGREEN}Goodbye!{Colors.ENDC}")
                    break
                
                elif action == 'show':
                    self.show()
                
                elif action == 'ripples':
                    self.show_ripples()
                
                elif action == 'reset':
                    name = input("Model name: ").strip() or "New Model"
                    self.new_model(name)
                
                elif action == 'set' and len(parts) >= 3:
                    self.set_dimension(parts[1], float(parts[2]))
                
                elif action == 'apply' and len(parts) >= 3:
                    transformation = parts[1]
                    dimension = parts[2]
                    intensity = float(parts[3]) if len(parts) > 3 else 0.1
                    self.apply_transformation(transformation, dimension, intensity)
                
                elif action == 'export' and len(parts) >= 2:
                    self.model.export_history(parts[1])
                    print(f"{Colors.OKGREEN}✓ Exported to {parts[1]}{Colors.ENDC}\n")
                
                elif action == 'help':
                    print(f"{Colors.OKCYAN}Available Transformations:{Colors.ENDC}")
                    print("  " + ", ".join(self.model.VALID_TRANSFORMATIONS))
                    print(f"\n{Colors.OKCYAN}Available Dimensions:{Colors.ENDC}")
                    print("  " + ", ".join(self.model.VALID_DIMENSIONS))
                    print()
                
                else:
                    print(f"{Colors.FAIL}Unknown command. Type 'help' for usage.{Colors.ENDC}")
            
            except KeyboardInterrupt:
                print(f"\n{Colors.OKGREEN}Goodbye!{Colors.ENDC}")
                break
            except Exception as e:
                print(f"{Colors.FAIL}Error: {e}{Colors.ENDC}")


def main():
    parser = argparse.ArgumentParser(description="Sovereign D-T Framework CLI")
    subparsers = parser.add_subparsers(dest='command', help='Commands')
    
    # Interactive mode
    subparsers.add_parser('interactive', help='Launch interactive mode')
    
    # New model
    new_parser = subparsers.add_parser('new', help='Create new model')
    new_parser.add_argument('name', help='Model name')
    
    # Apply transformation
    apply_parser = subparsers.add_parser('apply', help='Apply transformation')
    apply_parser.add_argument('transformation', help='Transformation type')
    apply_parser.add_argument('dimension', help='Target dimension')
    apply_parser.add_argument('--intensity', type=float, default=0.1, help='Intensity (0.0-1.0)')
    
    # Show state
    subparsers.add_parser('show', help='Show current state')
    
    # Show ripples
    subparsers.add_parser('ripples', help='Show ripple effect map')
    
    # Set dimension
    set_parser = subparsers.add_parser('set', help='Set dimension value')
    set_parser.add_argument('dimension', help='Dimension name')
    set_parser.add_argument('value', type=float, help='Value (0.0-1.0)')
    
    args = parser.parse_args()
    cli = DTCli()
    
    if args.command == 'interactive' or args.command is None:
        cli.interactive_mode()
    elif args.command == 'new':
        cli.new_model(args.name)
    elif args.command == 'apply':
        cli.load_model()
        cli.apply_transformation(args.transformation, args.dimension, args.intensity)
    elif args.command == 'show':
        cli.load_model()
        cli.show()
    elif args.command == 'ripples':
        cli.show_ripples()
    elif args.command == 'set':
        cli.load_model()
        cli.set_dimension(args.dimension, args.value)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()

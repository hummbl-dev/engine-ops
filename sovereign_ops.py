#!/usr/bin/env python3
"""
SovereignOps Control Plane - Terminal User Interface

A real-time TUI for monitoring and controlling Sovereign Stack agents.

Usage:
    python sovereign_ops.py [--api-url http://localhost:8000]
"""

import asyncio
import httpx
from textual.app import App, ComposeResult
from textual.containers import Container, Horizontal, Vertical, ScrollableContainer
from textual.widgets import Header, Footer, Static, DataTable, Button, Label
from textual.reactive import reactive
from textual.binding import Binding
from rich.text import Text
from typing import List, Dict, Any
import sys

API_URL = "http://localhost:8000"

class AgentStatusWidget(Static):
    """Widget displaying a single agent's status."""
    
    agent_id: reactive[str] = reactive("")
    agent_type: reactive[str] = reactive("")
    status: reactive[str] = reactive("RUNNING")
    
    def render(self) -> Text:
        status_icon = {
            "RUNNING": "🟢",
            "PAUSED": "🟡",
            "STOPPED": "🔴"
        }.get(self.status, "⚪")
        
        return Text.from_markup(
            f"{status_icon} [bold cyan]{self.agent_id}[/bold cyan] ([dim]{self.agent_type}[/dim])"
        )

class AgentFleet(Vertical):
    """Sidebar showing agent fleet status."""
    
    def compose(self) -> ComposeResult:
        yield Static("🤖 [bold]Agent Fleet[/bold]", classes="section-title")
        yield ScrollableContainer(id="agent-list")

class ControlDeck(Horizontal):
    """Bottom control panel."""
    
    def compose(self) -> ComposeResult:
        yield Label("[bold]Controls:[/bold] [P]ause | [R]esume | [S]top | [Q]uit", id="controls-label")

class SovereignOpsTUI(App):
    """The SovereignOps Control Plane TUI."""
    
    TITLE = "SovereignOps Control Plane"
    CSS = """
    Screen {
        layout: grid;
        grid-size: 4 10;
        grid-columns: 1fr 3fr;
    }
    
    #agent-fleet {
        column-span: 1;
        row-span: 9;
        border: solid green;
    }
    
    #live-feed {
        column-span: 1;
        row-span: 9;
        border: solid cyan;
    }
    
    #control-deck {
        column-span: 2;
        row-span: 1;
        border: solid yellow;
    }
    
    .section-title {
       background: $boost;
        padding: 1;
    }
    """
    
    BINDINGS = [
        Binding("q", "quit", "Quit", priority=True),
        Binding("p", "pause_agent", "Pause"),
        Binding("r", "resume_agent", "Resume"),
        Binding("s", "stop_agent", "Stop"),
    ]
    
    def __init__(self, api_url: str = API_URL):
        super().__init__()
        self.api_url = api_url
        self.selected_agent = None
        self.agents = []
    
    def compose(self) -> ComposeResult:
        yield Header()
        yield AgentFleet(id="agent-fleet")
        yield ScrollableContainer(
            Static("📡 [bold]Live Agent Feed[/bold]", classes="section-title"),
            Static("Waiting for agent activity...", id="feed-content"),
            id="live-feed"
        )
        yield ControlDeck(id="control-deck")
        yield Footer()
    
    async def on_mount(self) -> None:
        """Start polling for agent status."""
        self.set_interval(1, self.refresh_agents)
    
    async def refresh_agents(self) -> None:
        """Poll the API for agent statuses."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.api_url}/agents", timeout=2.0)
                if response.status_code == 200:
                    self.agents = response.json()
                    self.update_agent_list()
        except Exception as e:
            self.log(f"Failed to fetch agents: {e}")
    
    def update_agent_list(self) -> None:
        """Update the agent list UI."""
        container = self.query_one("#agent-list", ScrollableContainer)
        container.remove_children()
        
        for agent in self.agents:
            widget = AgentStatusWidget()
            widget.agent_id = agent["agent_id"]
            widget.agent_type = agent["type"]
            widget.status = agent["status"]
            container.mount(widget)
    
    async def action_pause_agent(self) -> None:
        """Pause the first agent (demo)."""
        if self.agents:
            agent_id = self.agents[0]["agent_id"]
            await self.control_agent(agent_id, "pause")
    
    async def action_resume_agent(self) -> None:
        """Resume the first agent (demo)."""
        if self.agents:
            agent_id = self.agents[0]["agent_id"]
            await self.control_agent(agent_id, "resume")
    
    async def action_stop_agent(self) -> None:
        """Stop the first agent (demo)."""
        if self.agents:
            agent_id = self.agents[0]["agent_id"]
            await self.control_agent(agent_id, "stop")
    
    async def control_agent(self, agent_id: str, action: str) -> None:
        """Send control command to agent."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.api_url}/agents/{agent_id}/{action}",
                    timeout=2.0
                )
                if response.status_code == 200:
                    self.notify(f"Agent {agent_id} → {action.upper()}")
                else:
                    self.notify(f"Failed: {response.text}", severity="error")
        except Exception as e:
            self.notify(f"Error: {e}", severity="error")

if __name__ == "__main__":
    api_url = sys.argv[1] if len(sys.argv) > 1 else API_URL
    app = SovereignOpsTUI(api_url=api_url)
    app.run()

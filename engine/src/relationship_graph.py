"""
Relationship graph visualization for council members.
"""
from typing import Dict, List, Set, Optional
from dataclasses import dataclass
from .persona_loader import persona_loader
from .persona_schema import PersonaSchema

@dataclass
class GraphNode:
    """Node in the relationship graph."""
    persona_id: str
    name: str
    century: int
    continent: str

@dataclass
class GraphEdge:
    """Edge in the relationship graph."""
    source: str  # persona_id
    target: str  # persona_id
    relationship_type: str  # "influences" or "influenced_by"

class RelationshipGraph:
    """Build and query relationship graph between personas."""
    
    def __init__(self):
        self.nodes: Dict[str, GraphNode] = {}
        self.edges: List[GraphEdge] = []
        self._build_graph()
    
    def _build_graph(self):
        """Build graph from loaded personas."""
        personas = persona_loader.get_all_personas()
        
        # Create nodes
        for persona_id, persona in personas.items():
            self.nodes[persona_id] = GraphNode(
                persona_id=persona_id,
                name=persona.name,
                century=persona.century,
                continent=persona.continent.value
            )
        
        # Create edges from relationships
        for persona_id, persona in personas.items():
            # Influences edges (persona_id -> target)
            for target_id in persona.relationships.persona_influences:
                if target_id in self.nodes:
                    self.edges.append(GraphEdge(
                        source=persona_id,
                        target=target_id,
                        relationship_type="influences"
                    ))
            
            # Influenced_by edges (source -> persona_id)
            for source_id in persona.relationships.persona_influenced_by:
                if source_id in self.nodes:
                    self.edges.append(GraphEdge(
                        source=source_id,
                        target=persona_id,
                        relationship_type="influenced_by"
                    ))
    
    def get_influences(self, persona_id: str) -> List[str]:
        """Get list of persona_ids that this persona influences."""
        return [e.target for e in self.edges 
                if e.source == persona_id and e.relationship_type == "influences"]
    
    def get_influenced_by(self, persona_id: str) -> List[str]:
        """Get list of persona_ids that influence this persona."""
        return [e.source for e in self.edges 
                if e.target == persona_id and e.relationship_type == "influenced_by"]
    
    def get_all_connections(self, persona_id: str) -> Set[str]:
        """Get all connected persona_ids (both influences and influenced_by)."""
        influences = set(self.get_influences(persona_id))
        influenced_by = set(self.get_influenced_by(persona_id))
        return influences | influenced_by
    
    def to_dot(self) -> str:
        """Export graph as Graphviz DOT format."""
        lines = ["digraph CouncilRelationships {"]
        lines.append("  rankdir=LR;")
        lines.append("  node [shape=box, style=rounded];")
        
        # Add nodes with labels
        for node_id, node in self.nodes.items():
            label = f"{node.name}\\n({node.century}CE, {node.continent})"
            lines.append(f'  "{node_id}" [label="{label}"];')
        
        # Add edges
        for edge in self.edges:
            style = "solid" if edge.relationship_type == "influences" else "dashed"
            lines.append(f'  "{edge.source}" -> "{edge.target}" [style={style}];')
        
        lines.append("}")
        return "\n".join(lines)
    
    def to_json(self) -> Dict:
        """Export graph as JSON."""
        return {
            "nodes": [
                {
                    "id": node.persona_id,
                    "name": node.name,
                    "century": node.century,
                    "continent": node.continent
                }
                for node in self.nodes.values()
            ],
            "edges": [
                {
                    "source": edge.source,
                    "target": edge.target,
                    "type": edge.relationship_type
                }
                for edge in self.edges
            ]
        }
    
    def find_path(self, source_id: str, target_id: str, max_depth: int = 3) -> Optional[List[str]]:
        """Find shortest path between two personas using BFS."""
        if source_id == target_id:
            return [source_id]
        
        if source_id not in self.nodes or target_id not in self.nodes:
            return None
        
        # BFS
        queue = [(source_id, [source_id])]
        visited = {source_id}
        
        while queue and len(queue[0][1]) <= max_depth:
            current_id, path = queue.pop(0)
            
            # Check all connections (both directions)
            connections = self.get_all_connections(current_id)
            
            for next_id in connections:
                if next_id == target_id:
                    return path + [next_id]
                
                if next_id not in visited:
                    visited.add(next_id)
                    queue.append((next_id, path + [next_id]))
        
        return None

# Singleton instance
relationship_graph = RelationshipGraph()


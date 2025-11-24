"""
Persona YAML Loader
Loads and manages persona schemas from YAML files.
"""
import yaml
import os
import sys
from pathlib import Path
from typing import Dict, Optional, List

# Handle both module import and script execution
try:
    from .persona_schema import PersonaSchema, PersonaType, Continent
except ImportError:
    # Running as script
    sys.path.insert(0, str(Path(__file__).parent))
    from persona_schema import PersonaSchema, PersonaType, Continent

class PersonaLoader:
    """Loads and manages persona schemas from YAML files."""
    
    def __init__(self, personas_dir: Optional[Path] = None):
        """
        Initialize the persona loader.
        
        Args:
            personas_dir: Directory containing persona YAML files. 
                         Defaults to engine/personas/ relative to this file.
        """
        if personas_dir is None:
            # Default to engine/personas/ directory
            current_file = Path(__file__)
            engine_dir = current_file.parent.parent
            personas_dir = engine_dir / "personas"
        
        self.personas_dir = Path(personas_dir)
        self.personas: Dict[str, PersonaSchema] = {}
        self._persona_id_to_enum_map: Dict[str, str] = {}  # Maps persona_id to enum value
        self._enum_to_persona_id_map: Dict[str, str] = {}  # Maps enum value to persona_id
        
    def load_all(self) -> Dict[str, PersonaSchema]:
        """
        Load all persona YAML files from the personas directory.
        
        Returns:
            Dictionary mapping persona_id to PersonaSchema
        """
        if not self.personas_dir.exists():
            raise FileNotFoundError(f"Personas directory not found: {self.personas_dir}")
        
        persona_files = list(self.personas_dir.glob("*.yaml"))
        persona_files = [f for f in persona_files if f.name != "README.md"]
        
        if not persona_files:
            raise ValueError(f"No persona YAML files found in {self.personas_dir}")
        
        loaded = {}
        for file_path in persona_files:
            try:
                persona = self.load_persona(file_path)
                loaded[persona.persona_id] = persona
                
                # Build enum mapping (convert persona_id to enum-friendly format)
                enum_value = self._persona_id_to_enum(persona.persona_id)
                self._persona_id_to_enum_map[persona.persona_id] = enum_value
                self._enum_to_persona_id_map[enum_value] = persona.persona_id
                
            except Exception as e:
                print(f"Warning: Failed to load {file_path.name}: {e}")
                continue
        
        self.personas = loaded
        return loaded
    
    def load_persona(self, file_path: Path) -> PersonaSchema:
        """
        Load a single persona from a YAML file.
        
        Args:
            file_path: Path to the YAML file
            
        Returns:
            PersonaSchema instance
        """
        with open(file_path, 'r', encoding='utf-8') as f:
            data = yaml.safe_load(f)
        
        # Validate and create schema
        persona = PersonaSchema(**data)
        return persona
    
    def get_by_id(self, persona_id: str) -> Optional[PersonaSchema]:
        """Get a persona by its persona_id."""
        return self.personas.get(persona_id)
    
    def get_by_enum(self, enum_value: str) -> Optional[PersonaSchema]:
        """
        Get a persona by its enum value (e.g., 'sun_tzu', 'machiavelli').
        
        Args:
            enum_value: The enum value used in CouncilMember enum
            
        Returns:
            PersonaSchema if found, None otherwise
        """
        persona_id = self._enum_to_persona_id_map.get(enum_value)
        if persona_id:
            return self.personas.get(persona_id)
        return None
    
    def _persona_id_to_enum(self, persona_id: str) -> str:
        """
        Convert persona_id to enum value.
        
        Example: "asia_5bc_sun_tzu" -> "sun_tzu"
        """
        # Extract name part (after century)
        parts = persona_id.split('_')
        # Find where the name starts (after continent and century)
        # Format: continent_century_name
        if len(parts) >= 3:
            # Skip continent and century, join the rest
            name_parts = parts[2:]
            return '_'.join(name_parts)
        return persona_id
    
    def get_all_persona_ids(self) -> List[str]:
        """Get list of all loaded persona_ids."""
        return list(self.personas.keys())
    
    def get_all_enum_values(self) -> List[str]:
        """Get list of all enum values (for backward compatibility)."""
        return list(self._enum_to_persona_id_map.keys())
    
    def query(self, **filters) -> List[PersonaSchema]:
        """
        Query personas by lattice attributes.
        
        Args:
            **filters: Filter criteria. Supports:
                - continent: Continent enum or string
                - century: int
                - role: str or list (checks if contains)
                - gender: str
                - nationality: str
                - etc.
        
        Returns:
            List of matching PersonaSchema instances
        """
        results = []
        
        for persona in self.personas.values():
            match = True
            
            # Filter by continent
            if 'continent' in filters:
                filter_continent = filters['continent']
                if isinstance(filter_continent, str):
                    filter_continent = Continent(filter_continent)
                if persona.continent != filter_continent:
                    match = False
            
            # Filter by century
            if 'century' in filters and match:
                if persona.century != filters['century']:
                    match = False
            
            # Filter by role (supports contains for lists)
            if 'role' in filters and match:
                filter_role = filters['role']
                persona_roles = persona.lattice_attributes.role
                if isinstance(persona_roles, str):
                    persona_roles = [persona_roles]
                if filter_role not in persona_roles:
                    match = False
            
            # Filter by gender
            if 'gender' in filters and match:
                if persona.lattice_attributes.gender != filters['gender']:
                    match = False
            
            # Filter by nationality
            if 'nationality' in filters and match:
                if persona.lattice_attributes.nationality != filters['nationality']:
                    match = False
            
            # Filter by school_of_thought
            if 'school_of_thought' in filters and match:
                if persona.lattice_attributes.school_of_thought != filters['school_of_thought']:
                    match = False
            
            if match:
                results.append(persona)
        
        return results

# Global loader instance (lazy-loaded)
_loader: Optional[PersonaLoader] = None

def get_loader() -> PersonaLoader:
    """Get or create the global persona loader instance."""
    global _loader
    if _loader is None:
        _loader = PersonaLoader()
        _loader.load_all()
    return _loader

def load_persona_by_enum(enum_value: str) -> Optional[PersonaSchema]:
    """
    Convenience function to load a persona by enum value.
    
    Args:
        enum_value: The enum value (e.g., 'sun_tzu', 'machiavelli')
        
    Returns:
        PersonaSchema if found, None otherwise
    """
    loader = get_loader()
    return loader.get_by_enum(enum_value)

if __name__ == "__main__":
    # Test the loader
    loader = PersonaLoader()
    personas = loader.load_all()
    
    print(f"Loaded {len(personas)} personas\n")
    
    # Test enum mapping
    print("Enum mappings:")
    for enum_val, persona_id in list(loader._enum_to_persona_id_map.items())[:5]:
        print(f"  {enum_val:20} -> {persona_id}")
    
    # Test query
    print("\nQuery: All philosophers:")
    philosophers = loader.query(role="Philosopher")
    for p in philosophers[:3]:
        roles = p.lattice_attributes.role
        if isinstance(roles, list):
            roles_str = ", ".join(roles)
        else:
            roles_str = roles
        print(f"  - {p.name}: {roles_str}")
    
    # Test loading by enum
    print("\nTest: Load by enum 'sun_tzu':")
    sun_tzu = loader.get_by_enum("sun_tzu")
    if sun_tzu:
        print(f"  Found: {sun_tzu.name} ({sun_tzu.persona_id})")


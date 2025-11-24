"""
Integration tests for persona loader.
"""
import pytest
import yaml
from pathlib import Path
import sys

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from persona_loader import PersonaLoader, get_loader
from persona_schema import PersonaSchema, Continent, Gender

class TestPersonaLoader:
    """Test suite for PersonaLoader."""
    
    @pytest.fixture
    def loader(self):
        """Create a loader instance."""
        return PersonaLoader()
    
    def test_load_all_personas(self, loader):
        """Test loading all personas."""
        personas = loader.load_all()
        assert len(personas) == 13, f"Expected 13 personas, got {len(personas)}"
    
    def test_persona_validation(self, loader):
        """Test that all personas validate against schema."""
        personas = loader.load_all()
        for persona_id, persona in personas.items():
            assert isinstance(persona, PersonaSchema), f"{persona_id} is not a PersonaSchema"
            assert persona.persona_id == persona_id
            assert persona.name, f"{persona_id} missing name"
    
    def test_enum_mapping(self, loader):
        """Test enum to persona_id mapping."""
        loader.load_all()
        
        # Test known mappings
        test_cases = [
            ("sun_tzu", "asia_5bc_sun_tzu"),
            ("machiavelli", "eur_16c_machiavelli"),
            ("marie_curie", "eur_20c_marie_curie"),
        ]
        
        for enum_val, expected_id in test_cases:
            persona = loader.get_by_enum(enum_val)
            assert persona is not None, f"Enum {enum_val} not found"
            assert persona.persona_id == expected_id, f"Wrong persona_id for {enum_val}"
    
    def test_get_by_id(self, loader):
        """Test getting persona by persona_id."""
        loader.load_all()
        persona = loader.get_by_id("asia_5bc_sun_tzu")
        assert persona is not None
        assert persona.name == "Sun Tzu"
    
    def test_query_by_continent(self, loader):
        """Test querying by continent."""
        loader.load_all()
        europeans = loader.query(continent=Continent.EUROPE)
        assert len(europeans) == 7, f"Expected 7 Europeans, got {len(europeans)}"
        
        asians = loader.query(continent=Continent.ASIA)
        assert len(asians) == 1, f"Expected 1 Asian, got {len(asians)}"
    
    def test_query_by_gender(self, loader):
        """Test querying by gender."""
        loader.load_all()
        women = loader.query(gender=Gender.FEMALE)
        assert len(women) == 4, f"Expected 4 women, got {len(women)}"
        
        men = loader.query(gender=Gender.MALE)
        assert len(men) == 9, f"Expected 9 men, got {len(men)}"
    
    def test_query_by_role(self, loader):
        """Test querying by role."""
        loader.load_all()
        philosophers = loader.query(role="Philosopher")
        assert len(philosophers) >= 3, "Should have at least 3 philosophers"
    
    def test_query_by_century(self, loader):
        """Test querying by century."""
        loader.load_all()
        ancient = loader.query(century=-4)  # 4th century BCE
        assert len(ancient) >= 2, "Should have at least 2 from 4th century BCE"
    
    def test_multi_valued_role(self, loader):
        """Test that roles can be lists."""
        loader.load_all()
        # Find personas with multiple roles
        multi_role = [p for p in loader.personas.values() 
                     if isinstance(p.lattice_attributes.role, list) 
                     and len(p.lattice_attributes.role) > 1]
        assert len(multi_role) > 0, "Should have at least one persona with multiple roles"
    
    def test_relationships_populated(self, loader):
        """Test that relationships are populated."""
        loader.load_all()
        # Check that some personas have relationships
        with_relationships = [p for p in loader.personas.values() 
                            if (p.relationships.persona_influenced_by or 
                                p.relationships.persona_influences)]
        assert len(with_relationships) >= 5, "Should have at least 5 personas with relationships"
    
    def test_get_all_enum_values(self, loader):
        """Test getting all enum values."""
        loader.load_all()
        enum_values = loader.get_all_enum_values()
        assert len(enum_values) == 13, f"Expected 13 enum values, got {len(enum_values)}"
        assert "sun_tzu" in enum_values
        assert "machiavelli" in enum_values

class TestPersonaSchema:
    """Test persona schema validation."""
    
    def test_schema_validation(self):
        """Test that schema validates correctly."""
        from persona_schema import PersonaSchema, Continent, PersonaType
        
        valid_persona = {
            "persona_id": "test_persona",
            "name": "Test Persona",
            "persona_type": "Historical",
            "continent": "Europe",
            "century": 19,
            "core_philosophy": "Test philosophy",
            "lattice_attributes": {
                "role": "Philosopher",
                "gender": "Male"
            }
        }
        
        persona = PersonaSchema(**valid_persona)
        assert persona.name == "Test Persona"
        assert persona.continent == Continent.EUROPE
    
    def test_role_normalization(self):
        """Test that role normalizes string to list."""
        from persona_schema import LatticeAttributes
        
        # String should become list
        attrs = LatticeAttributes(role="Philosopher")
        assert isinstance(attrs.role, list)
        assert attrs.role == ["Philosopher"]
        
        # List should stay list
        attrs = LatticeAttributes(role=["Philosopher", "Scientist"])
        assert isinstance(attrs.role, list)
        assert len(attrs.role) == 2

if __name__ == "__main__":
    pytest.main([__file__, "-v"])


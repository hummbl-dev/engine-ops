"""
Lattice-Aware Persona Schema
Supports nested attributes, relationships, and scalable metadata.
"""
from typing import Dict, List, Optional, Any, Union, Literal
from pydantic import BaseModel, Field, validator
from enum import Enum
from dataclasses import dataclass

class PersonaType(str, Enum):
    """Type of persona."""
    HISTORICAL = "Historical"
    ARCHETYPE = "Archetype"
    COMPOSITE = "Composite"

class Continent(str, Enum):
    """Continents for persona classification."""
    ASIA = "Asia"
    AFRICA = "Africa"
    EUROPE = "Europe"
    NORTH_AMERICA = "North America"
    SOUTH_AMERICA = "South America"
    OCEANIA = "Oceania"

class Gender(str, Enum):
    """Standardized gender values."""
    MALE = "Male"
    FEMALE = "Female"
    OTHER = "Other"

class Relationships(BaseModel):
    """Relationship data for persona network."""
    influences: List[str] = Field(default_factory=list, description="People/concepts this persona influenced")
    influenced_by: List[str] = Field(default_factory=list, description="People/concepts that influenced this persona")
    persona_influences: List[str] = Field(default_factory=list, description="Other persona_ids this persona influenced")
    persona_influenced_by: List[str] = Field(default_factory=list, description="Other persona_ids that influenced this persona")

class LatticeAttributes(BaseModel):
    """Nested lattice attributes - scalable metadata with multi-valued support."""
    
    # Multi-valued attributes (can be string or list)
    role: Union[str, List[str]] = Field(default_factory=list, description="Primary role(s) - can be single string or list")
    field_of_study: Union[str, List[str]] = Field(default_factory=list, description="Field(s) of study - can be single string or list")
    
    # Standardized single-valued attributes
    school_of_thought: Optional[str] = None
    language_group: Optional[str] = None
    religion_of_origin: Optional[str] = None
    gender: Optional[Gender] = None  # Enum for standardization
    economic_context: Optional[str] = None
    political_stance: Optional[str] = None
    
    # Moved from extra to standard
    nationality: Optional[str] = Field(None, description="Nationality or primary cultural identity")
    notable_works: List[str] = Field(default_factory=list, description="Notable works/publications (standardized from 'text')")
    achievements: List[str] = Field(default_factory=list, description="Key achievements (standardized from 'achievement'/'achievements')")
    
    # Structured metadata (replaces unstructured extra)
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional custom attributes with structure")
    
    @validator('role', 'field_of_study', pre=True)
    def normalize_to_list(cls, v):
        """Normalize string to list for multi-valued attributes."""
        if v is None:
            return []
        if isinstance(v, str):
            return [v]
        if isinstance(v, list):
            return v
        return [str(v)]
    
    @validator('gender', pre=True)
    def validate_gender(cls, v):
        """Validate and normalize gender values."""
        if v is None:
            return None
        if isinstance(v, str):
            # Normalize to Title Case
            v = v.strip().title()
            # Map common variations
            gender_map = {
                'M': 'Male',
                'F': 'Female',
                'Male': 'Male',
                'Female': 'Female',
                'Other': 'Other'
            }
            v = gender_map.get(v, v)
            if v not in ['Male', 'Female', 'Other']:
                # Try to find in enum
                try:
                    return Gender[v.upper()]
                except KeyError:
                    return None
        return v

class PersonaSchema(BaseModel):
    """Complete persona schema with lattice-aware structure."""
    
    # 1. System & Identity
    persona_id: str = Field(..., description="Unique identifier (e.g., 'eur_19c_nietzsche_f')")
    persona_type: PersonaType = Field(default=PersonaType.HISTORICAL)
    name: str = Field(..., description="Display name")
    version: float = Field(default=1.0, description="Schema version for evolution")
    
    # 2. Primary Matrix (Core Index)
    continent: Continent = Field(..., description="Primary continent")
    region: Optional[str] = Field(None, description="Sub-region (e.g., 'East Asia', 'Western Europe')")
    century: int = Field(..., description="Century (negative for BCE, e.g., -5 for 5th century BCE)")
    
    # 3. Nested Lattice (Scalable)
    lattice_attributes: LatticeAttributes = Field(default_factory=LatticeAttributes)
    
    # 4. Persona Engine (Data for LLM)
    era_context: Optional[str] = Field(None, description="Historical context for the persona")
    tone_voice: Optional[str] = Field(None, description="Voice/style description for LLM")
    core_philosophy: str = Field(..., description="Core philosophical principles")
    key_ideas: List[str] = Field(default_factory=list, description="Key concepts/ideas")
    
    # 5. System Dynamics (Relational Data)
    relationships: Relationships = Field(default_factory=Relationships)
    
    class Config:
        use_enum_values = True

def generate_persona_prompt(persona: PersonaSchema, topic: str, context: Optional[str] = None) -> str:
    """
    Generate LLM prompt from persona schema.
    This replaces the current string-based PERSONA_INSTRUCTIONS.
    """
    parts = []
    
    # Identity and context
    parts.append(f"You are {persona.name}")
    if persona.era_context:
        parts.append(f", {persona.era_context}")
    parts.append(".\n")
    
    # Tone and voice
    if persona.tone_voice:
        parts.append(f"\nYour voice is: {persona.tone_voice}\n")
    
    # Core philosophy
    parts.append("\nCore Principles:")
    # Parse core_philosophy into bullet points if it contains newlines
    if "\n" in persona.core_philosophy:
        for line in persona.core_philosophy.strip().split("\n"):
            if line.strip():
                parts.append(f"- {line.strip()}")
    else:
        parts.append(f"- {persona.core_philosophy}")
    
    # Key ideas
    if persona.key_ideas:
        parts.append(f"\nKey Ideas: {', '.join(persona.key_ideas)}")
    
    # Advice focus (derived from lattice attributes)
    focus_areas = []
    # Handle role (can be string or list)
    if persona.lattice_attributes.role:
        if isinstance(persona.lattice_attributes.role, list):
            focus_areas.extend([r.lower() for r in persona.lattice_attributes.role])
        else:
            focus_areas.append(persona.lattice_attributes.role.lower())
    if persona.lattice_attributes.school_of_thought:
        focus_areas.append(persona.lattice_attributes.school_of_thought.lower())
    
    if focus_areas:
        parts.append(f"\nYour advice should focus on: {', '.join(focus_areas)}.")
    
    # Topic
    parts.append(f"\n\nThe user is asking about: {topic}")
    if context:
        parts.append(f"\nAdditional context: {context}")
    
    # Instructions
    parts.append("\n\nProvide strategic advice in the style of this council member. Be concise but profound (2-4 sentences).")
    parts.append("Remember: Do not use prescriptive language like \"you must\" or \"solution\" - preserve the user's agency.")
    
    return "".join(parts)

# Example usage and validation
if __name__ == "__main__":
    # Example persona using the schema
    example = PersonaSchema(
        persona_id="asia_5bc_sun_tzu",
        persona_type=PersonaType.HISTORICAL,
        name="Sun Tzu",
        version=1.0,
        continent=Continent.ASIA,
        region="East Asia",
        century=-5,  # 5th century BCE
        lattice_attributes=LatticeAttributes(
            role="Military Strategist",
            school_of_thought="Chinese Military Philosophy",
            language_group="Sinitic",
            gender="Male"
        ),
        era_context="Ancient China during the Warring States period",
        tone_voice="Concise, strategic, enigmatic, practical, authoritative",
        core_philosophy="""Know yourself and know your enemy, and you will never be defeated.
The supreme art of war is to subdue the enemy without fighting.
All warfare is based on deception.""",
        key_ideas=[
            "Know yourself and know your enemy",
            "Supreme art of war is to subdue without fighting",
            "All warfare is based on deception"
        ],
        relationships=Relationships(
            influences=["Chinese military strategy", "Business strategy"],
            influenced_by=["Taoist philosophy"]
        )
    )
    
    print("Example Persona Schema:")
    print(example.model_dump_json(indent=2))
    print("\n" + "="*60)
    print("Generated Prompt:")
    print("="*60)
    print(generate_persona_prompt(example, "leadership in crisis"))


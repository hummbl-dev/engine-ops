# Schema Analysis: Lattice-Aware Persona System

## Current System Architecture

### Current Implementation

- **Storage:** Simple Python Enum + Dictionary mapping
- **Location:** `engine/src/adapter.py`
- **Structure:**

  ```python
  class CouncilMember(str, Enum):
      sun_tzu = "sun_tzu"
      # ... 12 more members

  PERSONA_INSTRUCTIONS = {
      CouncilMember.sun_tzu: """You are Sun Tzu..."""
      # Simple string templates
  }
  ```

### Current Limitations

1. **No Metadata:** Only persona instructions, no structured data
2. **No Relationships:** Personas exist in isolation
3. **No Granularity:** Only continent-level, no region/sub-region
4. **No Scalability:** Adding new dimensions requires code changes
5. **No Queryability:** Can't filter by attributes beyond enum value
6. **Dual System:** Matrix tracking (`council_matrix.py`) is separate from persona data

## Proposed Lattice-Aware Schema

### Key Improvements

1. **Granularity:** Adds `region` (e.g., "East Asia", "Andean America")
2. **Scalability:** `lattice_attributes` allows adding dimensions without schema changes
3. **Relationships:** `influences`/`influenced_by` creates a knowledge graph
4. **Rich Metadata:** `tone_voice`, `era_context`, `key_ideas` for better LLM prompts
5. **Versioning:** `version` field allows persona evolution
6. **Queryability:** Structured data enables complex queries

### Schema Structure

```yaml
persona_id: 'eur_19c_nietzsche_f'
persona_type: 'Historical'
name: 'Friedrich Nietzsche'
version: 1.0

# Primary Matrix (Core Index)
continent: 'Europe'
region: 'Western Europe'
century: 19

# Nested Lattice (Scalable)
lattice_attributes:
  role: 'Philosopher'
  school_of_thought: 'Existentialism'
  language_group: 'Germanic'
  religion_of_origin: 'Lutheran'
  gender: 'Male'
  economic_context: 'Industrial Capitalism'

# Persona Engine (LLM Data)
era_context: 'Late 19th-century Germany...'
tone_voice: 'Fiery, aphoristic, critical'
core_philosophy: |
  Believes in the "will to power"...
key_ideas:
  - 'Will to Power'
  - 'Übermensch'

# System Dynamics (Relationships)
relationships:
  influences: ['Schopenhauer', 'Wagner']
  influenced_by: ['eur_17c_spinoza_b']
```

## Integration Analysis

### ✅ Fits Well With Current System

1. **Backward Compatible:** Can maintain enum for API compatibility
2. **Enhances Matrix:** `council_matrix.py` can use richer data
3. **Improves Prompts:** `tone_voice` + `era_context` = better LLM responses
4. **Enables Features:** Relationships enable "who influenced X?" queries

### 🔄 Migration Path

**Phase 1: Add Schema Support (Non-Breaking)**

- Create `PersonaSchema` dataclass/Pydantic model
- Load personas from YAML/JSON files
- Keep enum for backward compatibility
- Generate persona instructions from schema

**Phase 2: Enhance Matrix**

- Update `CouncilMemberProfile` to use schema
- Add relationship tracking
- Enable lattice attribute queries

**Phase 3: Advanced Features**

- Relationship graph visualization
- Dynamic persona selection based on attributes
- Multi-persona consultations ("What would X and Y say together?")

## Implementation Recommendation

### Option A: Hybrid Approach (Recommended)

- Keep enum for API stability
- Add YAML/JSON persona files with full schema
- Generate `PERSONA_INSTRUCTIONS` from schema
- Use schema for matrix and queries

**Benefits:**

- No breaking changes
- Gradual migration
- Best of both worlds

### Option B: Full Migration

- Replace enum with schema-based system
- Update all API endpoints
- Requires more testing

**Benefits:**

- Cleaner architecture
- More powerful
- More work upfront

## Example: Migrated Persona

### Current (adapter.py)

```python
CouncilMember.sun_tzu: """You are Sun Tzu, the ancient Chinese military strategist...
Core Principles:
- Know yourself and know your enemy
...
"""
```

### Proposed (personas/sun_tzu.yaml)

```yaml
persona_id: 'asia_5bc_sun_tzu'
persona_type: 'Historical'
name: 'Sun Tzu'
version: 1.0

continent: 'Asia'
region: 'East Asia'
century: -5 # 5th century BCE

lattice_attributes:
  role: 'Military Strategist'
  school_of_thought: 'Chinese Military Philosophy'
  language_group: 'Sinitic'
  religion_of_origin: 'Taoist/Confucian'
  gender: 'Male'
  economic_context: 'Warring States Period'

era_context: 'Ancient China during the Warring States period; constant warfare between states; need for strategic advantage.'

tone_voice: 'Concise, strategic, enigmatic, practical, authoritative'

core_philosophy: |
  Believes in the supreme art of war is to subdue the enemy without fighting.
  All warfare is based on deception. Appear weak when you are strong, and strong when you are weak.
  Know yourself and know your enemy, and you will never be defeated.

key_ideas:
  - 'Know yourself and know your enemy'
  - 'Supreme art of war is to subdue without fighting'
  - 'All warfare is based on deception'
  - 'Terrain, timing, and surprise'

relationships:
  influences: ['Chinese military strategy', 'Business strategy']
  influenced_by: ['Taoist philosophy', 'Confucian ethics']
```

### Generated Prompt (from schema)

```python
def generate_persona_prompt(persona: PersonaSchema, topic: str) -> str:
    return f"""You are {persona.name}, {persona.era_context}

Your voice is: {persona.tone_voice}

Core Philosophy:
{persona.core_philosophy}

Key Ideas: {', '.join(persona.key_ideas)}

The user is asking about: {topic}

Provide strategic advice in the style of this council member. Be concise but profound (2-4 sentences).
Remember: Do not use prescriptive language like "you must" or "solution" - preserve the user's agency.
"""
```

## Benefits for Our System

### 1. Better LLM Responses

- `tone_voice` ensures consistent style
- `era_context` adds historical accuracy
- `key_ideas` focuses responses

### 2. Advanced Queries

```python
# Find all philosophers from 19th century Europe
matrix.query(
    century=19,
    continent="Europe",
    lattice_attributes__role="Philosopher"
)

# Find who influenced Machiavelli
machiavelli = personas.get("eur_16c_machiavelli")
influences = machiavelli.relationships.influenced_by
```

### 3. Relationship Graph

- Visualize intellectual lineages
- "Who would agree/disagree?" queries
- Multi-persona consultations

### 4. Scalability

- Add `political_stance` to some personas without breaking others
- Add `field_of_study` without schema changes
- Version personas independently

## Next Steps

1. **Create Schema Model:** Pydantic model for persona schema
2. **Create Example Personas:** Convert 2-3 current personas to YAML
3. **Build Loader:** Load YAML → Schema → Generate prompts
4. **Test Integration:** Ensure backward compatibility
5. **Migrate Gradually:** Move personas one by one

## Conclusion

**The proposed schema is excellent and fits our system well.**

**Recommendation:** Implement Option A (Hybrid Approach)

- Maintains backward compatibility
- Enables future growth
- Improves LLM responses immediately
- Sets foundation for advanced features

**Priority:** High - This will significantly enhance the council's capabilities.

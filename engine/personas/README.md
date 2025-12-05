# Council Personas - Lattice-Aware Schema

This directory contains YAML persona files for all council members using the lattice-aware schema.

## Files

All 13 council members have been migrated to the new schema:

1. `ada_lovelace.yaml` - English mathematician, first computer programmer
2. `aristotle.yaml` - Greek philosopher, student of Plato
3. `benjamin_franklin.yaml` - American polymath, Enlightenment thinker
4. `carl_jung.yaml` - Swiss psychiatrist, analytical psychology
5. `dame_whina_cooper.yaml` - Māori leader, indigenous rights activist
6. `hypatia.yaml` - Greek-Egyptian philosopher and mathematician
7. `ibn_rushd.yaml` - Andalusian philosopher (Averroes), Medieval period
8. `machiavelli.yaml` - Italian political philosopher, Renaissance
9. `marcus_aurelius.yaml` - Roman emperor, Stoic philosopher
10. `marie_curie.yaml` - Polish-French physicist, Nobel Prize winner
11. `paulo_freire.yaml` - Brazilian educator, critical pedagogy
12. `plato.yaml` - Greek philosopher, student of Socrates
13. `sun_tzu.yaml` - Chinese military strategist, ancient period

## Schema Structure

Each persona file follows this structure:

```yaml
persona_id: 'continent_century_name' # Unique identifier
persona_type: 'Historical'
name: 'Display Name'
version: 1.0

# Primary Matrix
continent: 'Continent'
region: 'Sub-region'
century: -5 # Negative for BCE, positive for CE

# Nested Lattice (Scalable)
lattice_attributes:
  role: 'Primary role'
  school_of_thought: 'Philosophical school'
  language_group: 'Language family'
  religion_of_origin: 'Religious background'
  gender: 'Gender'
  economic_context: 'Economic system'
  field_of_study: 'Areas of expertise'
  extra: {} # Additional custom attributes

# Persona Engine (LLM Data)
era_context: 'Historical context'
tone_voice: 'Voice/style description'
core_philosophy: |
  Core principles...
key_ideas:
  - 'Key idea 1'
  - 'Key idea 2'

# System Dynamics (Relationships)
relationships:
  influences: []
  influenced_by: []
  persona_influences: [] # Other persona_ids
  persona_influenced_by: [] # Other persona_ids
```

## Usage

These YAML files can be loaded using the `PersonaSchema` model in `src/persona_schema.py`:

```python
from src.persona_schema import PersonaSchema
import yaml

with open('personas/sun_tzu.yaml') as f:
    data = yaml.safe_load(f)
    persona = PersonaSchema(**data)
    prompt = generate_persona_prompt(persona, "leadership")
```

## Next Steps

1. **Build YAML Loader:** Create loader that reads all YAML files
2. **Generate Prompts:** Use schema to generate `PERSONA_INSTRUCTIONS`
3. **Update Matrix:** Use schema data in `council_matrix.py`
4. **Add Relationships:** Populate `persona_influences` and `persona_influenced_by`

## Benefits

- ✅ **Structured Data:** All persona information in structured format
- ✅ **Scalable:** Add new attributes without schema changes
- ✅ **Queryable:** Filter by continent, century, role, etc.
- ✅ **Relationships:** Track intellectual lineages
- ✅ **Better Prompts:** `tone_voice` + `era_context` improve LLM responses

# Lattice Robustness Analysis

## Current Structure

```yaml
lattice_attributes:
  role: 'Philosopher' # Optional string
  school_of_thought: 'Existentialism' # Optional string
  language_group: 'Germanic' # Optional string
  religion_of_origin: 'Lutheran' # Optional string
  gender: 'Male' # Optional string
  economic_context: 'Industrial Capitalism' # Optional string
  political_stance: 'Anti-Nationalist' # Optional string
  field_of_study: 'Philosophy' # Optional string
  extra: {} # Dict for custom attributes
```

## Issues Identified

### 1. ⚠️ **Unstructured `extra` Dict**

**Problem:**

- No schema for `extra` attributes
- No validation
- Hard to query
- Inconsistent keys across personas

**Example:**

```yaml
extra:
  text: 'The Prince' # Some use "text"
  achievements: 'Nobel Prize' # Some use "achievements"
  achievement: 'First programmer' # Inconsistent naming
```

**Impact:** Can't reliably query `extra` attributes.

### 2. ⚠️ **No Multi-Valued Attributes**

**Problem:**

- What if someone has multiple roles? (e.g., "Philosopher" AND "Scientist")
- What if they speak multiple languages?
- Current structure only supports single strings

**Example:**

```yaml
# Current (can't represent multiple roles)
role: "Philosopher"

# Needed (multiple roles)
role: ["Philosopher", "Scientist", "Mathematician"]
```

**Impact:** Can't accurately represent complex personas.

### 3. ⚠️ **No Type Information**

**Problem:**

- All attributes are strings
- Can't distinguish between:
  - Enumerated values (gender: "Male" | "Female")
  - Free text (field_of_study: "Philosophy, Ethics, Logic")
  - Numbers (birth_year: 384)
  - Booleans (is_nobel_winner: true)
  - Lists (languages: ["Greek", "Latin"])

**Impact:** Can't validate or query effectively.

### 4. ⚠️ **No Standardized Values**

**Problem:**

- `gender: "Male"` vs `gender: "male"` vs `gender: "M"`
- `language_group: "Germanic (English)"` vs `language_group: "Germanic"`
- Inconsistent formatting makes querying difficult

**Impact:** Queries might miss matches due to case/format differences.

### 5. ⚠️ **Missing Important Attributes**

**Potential gaps:**

- `time_period` (more specific than century)
- `social_class` (nobility, commoner, etc.)
- `education_level`
- `marital_status`
- `children`
- `notable_works` (list)
- `awards` (list)
- `languages_spoken` (list)
- `birth_year` / `death_year`
- `nationality` (currently in extra, should be standard)

**Impact:** Can't query on important dimensions.

### 6. ⚠️ **No Hierarchical Attributes**

**Problem:**

- Can't represent relationships like:
  - `location: {continent: "Europe", country: "Italy", city: "Florence"}`
  - `education: {institution: "Academy", teacher: "Plato"}`

**Impact:** Can't query at different granularities.

### 7. ⚠️ **No Query Support**

**Problem:**

- How do we query `lattice_attributes.role == "Philosopher"`?
- How do we query `lattice_attributes.extra.text`?
- How do we handle partial matches?
- How do we handle case-insensitive queries?

**Impact:** Can't build effective query system.

## Proposed Enhanced Structure

### Option A: Enhanced with Types and Lists

```yaml
lattice_attributes:
  # Standard attributes with types
  role: ['Philosopher', 'Scientist'] # List for multi-valued
  school_of_thought: 'Existentialism' # String
  language_group: 'Germanic' # String (standardized)
  languages_spoken: ['German', 'French', 'Latin'] # List
  religion_of_origin: 'Lutheran' # String (standardized)
  gender: 'Male' # Enum: "Male" | "Female" | "Other"
  economic_context: 'Industrial Capitalism' # String
  political_stance: 'Anti-Nationalist' # String
  field_of_study: ['Philosophy', 'Ethics', 'Logic'] # List
  nationality: 'German' # String (moved from extra)
  birth_year: 1844 # Number
  death_year: 1900 # Number
  is_nobel_winner: false # Boolean
  notable_works: ['Beyond Good and Evil', 'Thus Spoke Zarathustra'] # List

  # Hierarchical attributes
  location:
    continent: 'Europe'
    region: 'Western Europe'
    country: 'Germany'
    city: 'Leipzig'

  education:
    - institution: 'University of Bonn'
      degree: 'PhD'
      field: 'Classical Philology'

  # Structured extra (with schema)
  metadata:
    text: 'Beyond Good and Evil'
    achievements: ['Philosopher', 'Poet']
    context: '19th century Germany'
```

### Option B: Schema-Driven with Validation

```python
class LatticeAttributes(BaseModel):
    # Core attributes (typed)
    role: List[str] = Field(default_factory=list)
    school_of_thought: Optional[str] = None
    language_group: Optional[str] = None
    languages_spoken: List[str] = Field(default_factory=list)
    religion_of_origin: Optional[str] = None
    gender: Optional[Literal["Male", "Female", "Other"]] = None
    economic_context: Optional[str] = None
    political_stance: Optional[str] = None
    field_of_study: List[str] = Field(default_factory=list)

    # Temporal
    birth_year: Optional[int] = None
    death_year: Optional[int] = None
    time_period: Optional[str] = None

    # Hierarchical
    location: Optional[Location] = None
    education: List[Education] = Field(default_factory=list)

    # Structured metadata (replaces unstructured extra)
    metadata: Dict[str, Any] = Field(default_factory=dict)

    # Validation
    @validator('gender')
    def validate_gender(cls, v):
        if v and v not in ['Male', 'Female', 'Other']:
            raise ValueError(f"Invalid gender: {v}")
        return v
```

## Recommendations

### Immediate (Before Loader)

1. **Standardize Values**
   - Create enums for: `gender`, `language_group` (standardized list)
   - Use consistent casing (Title Case for values)

2. **Move Common `extra` to Standard**
   - `nationality` → standard attribute
   - `text` → `notable_works` (list)
   - `achievements` → standard list

3. **Add Type Hints**
   - Document which attributes are lists vs strings
   - Add validation in schema

### Short-term (Loader Phase)

4. **Support Lists**
   - Allow `role: ["Philosopher", "Scientist"]`
   - Update schema to handle both string and list

5. **Structured `extra`**
   - Rename to `metadata` with documented structure
   - Or create specific fields for common extras

### Long-term (Advanced Features)

6. **Hierarchical Attributes**
   - Add `location` object
   - Add `education` list of objects

7. **Query System**
   - Build query builder for lattice attributes
   - Support: `role.contains("Philosopher")`, `birth_year > 1800`, etc.

## Critical Questions

1. **Do we need multi-valued attributes?** (e.g., multiple roles)
   - **Answer:** Yes, for accuracy

2. **Do we need type information?** (numbers, booleans, lists)
   - **Answer:** Yes, for validation and querying

3. **Do we need hierarchical attributes?**
   - **Answer:** Maybe, depends on query needs

4. **How do we query `extra`?**
   - **Answer:** Need to standardize or structure it

## Decision Matrix

| Feature         | Current | Option A | Option B | Recommendation |
| --------------- | ------- | -------- | -------- | -------------- |
| Multi-valued    | ❌      | ✅       | ✅       | **Option A/B** |
| Type safety     | ❌      | ⚠️       | ✅       | **Option B**   |
| Hierarchical    | ❌      | ✅       | ✅       | **Option A/B** |
| Query support   | ❌      | ⚠️       | ✅       | **Option B**   |
| Backward compat | ✅      | ⚠️       | ⚠️       | **Current**    |
| Complexity      | Low     | Medium   | High     | **Option A**   |

## Recommendation

**Hybrid Approach:**

1. **Immediate:** Standardize current structure, move common extras to standard
2. **Loader Phase:** Add list support for key attributes (role, field_of_study)
3. **Future:** Add hierarchical attributes and full query system

**Priority Fixes Before Loader:**

1. ✅ Standardize `gender` values (enum)
2. ✅ Move `nationality` from `extra` to standard
3. ✅ Document which attributes can be lists
4. ✅ Add validation for standardized fields

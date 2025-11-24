# Plan: Addressing Outstanding Items

**Date:** 2025-01-27  
**Status:** Planning  
**Priority:** High

---

## Overview

This plan addresses all outstanding items from the SITREP, organized by priority and feasibility.

---

## Priority 1: Critical Maintenance (Week 1-2)

### 1.1 Security Vulnerabilities Review
**Priority:** 🔴 HIGH  
**Effort:** 2-4 hours  
**Risk:** Security exposure

**Tasks:**
1. Review GitHub Dependabot alerts
   - Check: https://github.com/hummbl-dev/engine-ops/security/dependabot
   - Identify affected packages
   - Assess exploitability

2. Update Dependencies
   - Update vulnerable packages to patched versions
   - Test compatibility
   - Update `requirements.txt` and `package.json`

3. Verify Fixes
   - Run tests
   - Check for breaking changes
   - Re-scan for vulnerabilities

**Deliverables:**
- Updated dependency files
- Security audit report
- Zero high-severity vulnerabilities

**Success Criteria:**
- All high-severity vulnerabilities resolved
- No breaking changes introduced
- All tests pass

---

### 1.2 Integration Tests for Loader
**Priority:** 🟡 MEDIUM  
**Effort:** 4-6 hours  
**Risk:** Regression bugs

**Tasks:**
1. Create Test Suite
   - `tests/test_persona_loader.py`
   - Test YAML loading
   - Test enum mapping
   - Test query interface
   - Test error handling

2. Create Test Fixtures
   - Sample persona YAML files
   - Invalid schema examples
   - Edge cases

3. Add CI Integration
   - Run tests on PR
   - Run tests on commit
   - Coverage reporting

**Deliverables:**
- Test suite with >80% coverage
- CI/CD integration
- Test documentation

**Success Criteria:**
- All loader functions tested
- Edge cases covered
- CI pipeline passing

---

## Priority 2: Feature Enhancements (Week 3-4)

### 2.1 Multi-Persona Consultations
**Priority:** 🟢 MEDIUM  
**Effort:** 8-12 hours  
**Value:** High user value

**Tasks:**
1. Design API
   - New endpoint: `POST /consult/multi`
   - Request format: `{members: ["sun_tzu", "machiavelli"], topic: "strategy"}`
   - Response format: Individual + synthesized advice

2. Implement Multi-Persona Logic
   - Load multiple personas
   - Generate individual prompts
   - Synthesize responses
   - Handle conflicts/agreements

3. Update Adapter
   - Add `generate_multi_advice()` function
   - Handle parallel requests
   - Aggregate responses

4. Update Extension
   - Add multi-persona query support
   - UI for selecting multiple members
   - Display format for multiple responses

**Deliverables:**
- New API endpoint
- Multi-persona consultation logic
- Extension support
- Documentation

**Success Criteria:**
- Can consult 2-3 personas simultaneously
- Responses are coherent and distinct
- API handles errors gracefully

**Example:**
```bash
POST /consult/multi
{
  "members": ["sun_tzu", "machiavelli"],
  "topic": "leadership in crisis"
}

Response:
{
  "sun_tzu": {...},
  "machiavelli": {...},
  "synthesis": "Both emphasize..."
}
```

---

### 2.2 Relationship Graph Visualization
**Priority:** 🟢 LOW  
**Effort:** 12-16 hours  
**Value:** High visual value

**Tasks:**
1. Build Graph Data Structure
   - Create graph from relationships
   - Calculate centrality metrics
   - Identify clusters

2. Create Visualization
   - Use graphviz or d3.js
   - Interactive web interface
   - Show influence flows
   - Highlight key connections

3. Add API Endpoint
   - `GET /relationships/graph`
   - Return graph data (JSON)
   - Support filtering

4. Integration
   - Add to `/docs` interface
   - Embed in README
   - Standalone visualization page

**Deliverables:**
- Graph visualization
- API endpoint
- Interactive web interface
- Documentation

**Success Criteria:**
- Visual representation of all relationships
- Interactive exploration
- Clear influence flows

**Tech Stack Options:**
- Python: NetworkX + graphviz
- Web: D3.js or vis.js
- API: Return JSON for frontend rendering

---

## Priority 3: Developer Experience (Week 5-6)

### 3.1 Watch Mode for YAML Files
**Priority:** 🟢 LOW  
**Effort:** 4-6 hours  
**Value:** Developer productivity

**Tasks:**
1. Implement File Watcher
   - Watch `engine/personas/` directory
   - Detect YAML file changes
   - Reload affected personas

2. Hot Reload Logic
   - Validate changed files
   - Update in-memory cache
   - Log reload events

3. Error Handling
   - Graceful failure on invalid YAML
   - Keep old version on error
   - Clear error messages

4. Configuration
   - Enable/disable watch mode
   - Configurable watch paths
   - Debounce settings

**Deliverables:**
- File watcher implementation
- Hot reload functionality
- Configuration options
- Documentation

**Success Criteria:**
- Changes to YAML files auto-reload
- No server restart needed
- Errors don't crash server

**Implementation:**
```python
# In persona_loader.py
class PersonaLoader:
    def enable_watch_mode(self):
        from watchdog.observers import Observer
        from watchdog.events import FileSystemEventHandler
        
        class PersonaHandler(FileSystemEventHandler):
            def on_modified(self, event):
                if event.src_path.endswith('.yaml'):
                    self.reload_persona(event.src_path)
        
        observer = Observer()
        observer.schedule(PersonaHandler(), self.personas_dir, recursive=False)
        observer.start()
```

---

### 3.2 Advanced Query Builder UI
**Priority:** 🟢 LOW  
**Effort:** 16-20 hours  
**Value:** User experience

**Tasks:**
1. Design Query Interface
   - Visual filter builder
   - Attribute selection
   - Value input
   - Result preview

2. Implement Backend
   - Enhanced query API
   - Complex filter support
   - Sorting and pagination
   - Result formatting

3. Build Frontend
   - React/Vue component
   - Filter UI
   - Result display
   - Export functionality

4. Integration
   - Add to `/docs` interface
   - Standalone query page
   - API documentation

**Deliverables:**
- Query builder UI
- Enhanced query API
- Documentation
- Examples

**Success Criteria:**
- Users can build complex queries visually
- Results are clear and actionable
- Export functionality works

**Example Query:**
```
Find all:
- Female philosophers
- From 19th-20th century
- With Nobel Prize achievements
- Who influenced modern science
```

---

## Priority 4: Advanced Features (Week 7-8)

### 4.1 Persona Versioning System
**Priority:** 🟢 LOW  
**Effort:** 8-10 hours  
**Value:** Long-term maintenance

**Tasks:**
1. Design Versioning Schema
   - Semantic versioning (1.0, 1.1, 2.0)
   - Version metadata
   - Migration paths

2. Implement Version Storage
   - Store multiple versions
   - Version comparison
   - Rollback capability

3. Add Version API
   - `GET /personas/{id}/versions`
   - `GET /personas/{id}/versions/{version}`
   - `POST /personas/{id}/versions` (create new)

4. Migration Tools
   - Auto-migrate old versions
   - Manual migration scripts
   - Version diff tool

**Deliverables:**
- Versioning system
- Version API
- Migration tools
- Documentation

**Success Criteria:**
- Can store multiple versions
- Can query by version
- Can rollback if needed

---

### 4.2 Performance Optimization
**Priority:** 🟢 LOW (Future)  
**Effort:** 8-12 hours  
**Trigger:** Council size >50 members

**Tasks:**
1. Performance Profiling
   - Identify bottlenecks
   - Measure query times
   - Memory usage analysis

2. Optimization Strategies
   - Caching layer (Redis)
   - Indexed queries
   - Lazy loading
   - Connection pooling

3. Implementation
   - Add caching
   - Optimize queries
   - Add indexes
   - Load testing

4. Monitoring
   - Performance metrics
   - Alerting
   - Dashboard

**Deliverables:**
- Optimized loader
- Caching layer
- Performance monitoring
- Benchmarks

**Success Criteria:**
- Query time <50ms for 50+ personas
- Memory usage <100MB
- 99% cache hit rate

**Note:** Only implement when council grows beyond 50 members.

---

## Implementation Timeline

### Phase 1: Critical (Weeks 1-2)
- ✅ Security vulnerabilities review
- ✅ Integration tests

### Phase 2: Features (Weeks 3-4)
- ✅ Multi-persona consultations
- ⏸️ Relationship graph (if time permits)

### Phase 3: Developer Experience (Weeks 5-6)
- ✅ Watch mode
- ⏸️ Query builder UI (if time permits)

### Phase 4: Advanced (Weeks 7-8)
- ⏸️ Persona versioning
- ⏸️ Performance optimization (when needed)

---

## Resource Requirements

### Development Time
- **Critical:** 6-10 hours
- **Features:** 20-28 hours
- **Developer Experience:** 20-26 hours
- **Advanced:** 16-22 hours
- **Total:** 62-86 hours

### Dependencies
- Security review: None
- Integration tests: pytest, coverage
- Multi-persona: None (uses existing)
- Graph visualization: NetworkX or D3.js
- Watch mode: watchdog (Python)
- Query builder: React/Vue (optional)
- Versioning: None
- Performance: Redis (optional, for caching)

---

## Risk Assessment

### High Risk
- **Security vulnerabilities:** Could expose system
  - **Mitigation:** Address immediately

### Medium Risk
- **Multi-persona consultations:** Complex logic
  - **Mitigation:** Start with 2 personas, expand

### Low Risk
- **All other items:** Nice-to-have features
  - **Mitigation:** Implement as time permits

---

## Success Metrics

### Critical Items
- ✅ Zero high-severity vulnerabilities
- ✅ >80% test coverage
- ✅ All tests passing

### Feature Items
- ✅ Multi-persona API working
- ✅ Graph visualization functional
- ✅ Query builder usable

### Developer Experience
- ✅ Watch mode reduces dev time
- ✅ Query builder improves UX

---

## Next Steps

1. **Immediate (This Week)**
   - Review security vulnerabilities
   - Create test suite structure

2. **Short-term (Next 2 Weeks)**
   - Complete security fixes
   - Implement integration tests
   - Start multi-persona consultations

3. **Medium-term (Next Month)**
   - Complete multi-persona feature
   - Implement watch mode
   - Start graph visualization

4. **Long-term (As Needed)**
   - Query builder UI
   - Persona versioning
   - Performance optimization

---

**Status:** Ready for Implementation  
**Last Updated:** 2025-01-27


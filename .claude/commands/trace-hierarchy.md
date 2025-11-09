---
description: 7-dimensional root cause tracer - reveals hidden architectural layers causing errors
argument-hint: [symptom]
---

# 🔬 HIERARCHY TRACER: "$ARGUMENTS"

Map across 7 dimensions to find root cause hidden from standard debugging.

## PHASE 1: MAP 7 DIMENSIONS

### 1. COMPONENT TREE
`Root → Provider → Page → Container → Component → ⚠️ Symptom`
- Full tree root to symptom? Any HOCs/contexts? Props flow?

### 2. TIMING SEQUENCE
`T1: Init → T2: Mount → T3: Data → T4: Render → T5: ⚠️ Error`
- When does error fire? Before/after what initialization?

### 3. STATE FLOW
`Global → Context → Hook → Props → Component → ⚠️`
- Who owns state? Complete update chain? Multiple sources?

### 4. EVENT CHAIN
`Trigger → Handler → Update → Effect → ⚠️ Symptom`
- What started this? Direct or cascading?

### 5. DATA PATH
`API → Network → Cache → Transform → State → Props → ⚠️`
- Where does data originate? Where does it become wrong?

### 6. DEPENDENCY TREE
`External → Provider → Hook → Component → ⚠️ Missing?`
- What does symptomatic code need? Who provides? Available when?

### 7. ARCH LAYERS
`Infrastructure → Application → Domain → Presentation → ⚠️`
- Which layer has root cause? Violating boundaries?

---

## PHASE 2: CROSS-DIMENSIONAL CONFLICTS

Where dimensions collide = bugs hide:

- **Timing × Component**: Component expects data before timing provides it
- **State × Events**: Multiple update sources racing
- **Data × Component**: Shape mismatch API→Component
- **Dependency × Component**: Missing provider in tree
- **Architecture × Presentation**: Layer boundary violation

**Find the conflict = find the bug**

---

## PHASE 3: BUILD COMPLETE CHAIN

```
🎯 ROOT CAUSE (Deepest)
    ↓ [Arch/Dependency/Data layer]
    ↓ [State/Event layer]
    ↓ [Timing layer]
    ↓ [Component layer]
⚠️ SYMPTOM (Surface)
```

Mark: 🎯 Trigger | 🚦 Decision | 💣 Failure | ✅ Fix Point

---

## PHASE 4: 5-WHY EXCAVATION

1. **WHAT**: Symptom? Error message?
2. **WHERE**: Code location? Component tree position?
3. **WHEN**: Lifecycle moment? User flow?
4. **WHY**: Why execute? Why designed this way?
5. **WHO**: Who controls? Who decided architecture?

Keep asking "Why?" → hit bedrock (design constraint/external dep)

---

## PHASE 5: FIX DECISION MATRIX

| Layer | Fix | When Best | Priority |
|-------|-----|-----------|----------|
| **Arch** | Redesign flow | Systemic issue | ⭐ If repeated |
| **Dependency** | Add provider | Missing dep | ⭐⭐⭐ |
| **Data** | Transform earlier | Shape mismatch | ⭐⭐ |
| **State** | Add loading state | Async timing | ⭐⭐⭐ BEST |
| **Timing** | Delay mount | Quick fix | ❌ Fragile |
| **Component** | Null checks | Symptom only | ❌ Last resort |

**Choose earliest sensible fix point in chain**

---

## PHASE 6: OUTPUT

Create visual:
```
┌─ ARCH: [Layer] → [Layer] → ⚠️
├─ TIME: T0→T1→T2→ ⚠️ at T3
├─ STATE: [Source] → [Flow] → ⚠️
└─ FIX: ✅ Add [solution] at [location:line]
```

---

## PHASE 7: VERIFY & DOCUMENT

Verify fix across ALL 7 dimensions:
- [ ] Works in component tree? ✓
- [ ] Works across timing? ✓
- [ ] Handles state updates? ✓
- [ ] Works for all events? ✓
- [ ] Handles data shapes? ✓
- [ ] Dependencies satisfied? ✓
- [ ] Respects arch layers? ✓

Add to `/AI-MEMORY/PATTERNS.md`:
```markdown
### [Bug] - 7D Analysis
**Symptom**: [visible]
**Dimensions**: Component [X], Timing [Y], State [Z]...
**Root**: [deepest cause]
**Fix**: [location:line] [change]
**Cross-Impact**: [what changed across dimensions]
```

---

## EMERGENCY MODE

Still unclear? Spawn agents for each dimension:
- `codebase-analyzer` → complete arch map
- `container-debugger` → parent chain
- `performance-profiler` → timing
- Add 7-layer logs → compare expected vs actual

---

**NOW**: Execute 7-dimensional trace for "$ARGUMENTS". Start Phase 1.

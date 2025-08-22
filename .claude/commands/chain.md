---
description: Map the complete cause-effect chain for any bug (Rule 19)
argument-hint: [symptom or bug description]
---

# 🔗 EFFECT CHAIN MAPPING PROTOCOL

**Symptom/Bug**: "$ARGUMENTS"

Following Rule 19 from `/rules.md` - Before fixing ANY bug, map the COMPLETE chain from trigger to symptom.

## PHASE 1: WORK BACKWARDS FROM SYMPTOM

Starting from the visible problem, trace backwards:

### 1. Identify the Symptom
```
SYMPTOM: [What is the final visible problem?]
└── LOCATION: [What file/component displays this?]
    └── FUNCTION: [What function shows the symptom?]
        └── CALLER: [What calls this function?]
            └── CALLER'S CALLER: [What calls THAT?]
                └── [Continue until you find the origin...]
```

## PHASE 2: MAP THE FULL CHAIN

Draw the complete chain from trigger to symptom:

```
📍 TRIGGER POINT (Start)
    ↓
[Component/Module A] 
    ↓ (calls/triggers)
[Function/Method B]
    ↓ (updates/modifies)
[State/Data C]
    ↓ (causes)
[Effect/Side-effect D]
    ↓ (results in)
[Symptom E] 
    ↓
🔴 VISIBLE PROBLEM (End)
```

## PHASE 3: THE 3-POINT ANALYSIS

### 🎯 TRIGGER POINT
- **Where**: [Where does the chain start?]
- **Why**: [Why does it start here?]
- **Should it?**: [Should this trigger in this scenario?]

### 🚦 DECISION POINT  
- **Where**: [Where is the "should I continue?" check?]
- **Logic**: [What's the decision logic?]
- **Correct?**: [Is the logic correct?]

### 💾 MUTATION POINT
- **Where**: [Where does state actually change?]
- **What changes**: [What exactly is modified?]
- **Side effects**: [What else is affected?]

## PHASE 4: CHAIN VALIDATION

Answer these critical questions:

- [ ] **Should this chain fire?** (Often NO for mount/init scenarios)
- [ ] **Is every link necessary?** (Can we remove any?)
- [ ] **Can we break earlier?** (Stop at decision point?)
- [ ] **Any circular paths?** (A→B→C→A?)
- [ ] **Chain length?** (>5 links = too complex)

## PHASE 5: IDENTIFY FIX LOCATION

Based on the chain, where should we fix? (Choose EARLIEST sensible point)

### ✅ Option 1: PREVENT TRIGGER (Best)
- Stop the chain from starting
- Example: Don't fire useEffect on mount
- Location: [Where to prevent]

### ✅ Option 2: STOP AT DECISION (Good)  
- Add/fix the decision logic
- Example: Check if really changed before proceeding
- Location: [Where to add check]

### ❌ Option 3: HANDLE AT SYMPTOM (Bad)
- Just hide/suppress the symptom
- Example: Hide error message
- Why bad: Root cause remains

## PHASE 6: QUICK CHAIN DIAGRAM

Create a simple chain diagram:
```
[A] → [B] → [C] → [D] → [E]
         ⭕ (Circle where it breaks)
      ✅ (Fix one step BEFORE the break)
```

## PHASE 7: REAL EXAMPLE CHECK

Compare to this real example from rules.md:
```
Problem: "Pending indicator shows on page load"
Chain: TextBlock mount → useEffect → onUpdate → ExpandedView → Pending
Question: "Should mount trigger this chain?" → NO
Fix: Prevent trigger at useEffect (5 min) vs trying 3 fixes (30 min)
```

## PHASE 8: DOCUMENT THE CHAIN

Add to `/AI-MEMORY/PATTERNS.md`:
```markdown
### [Bug Name] - Effect Chain
**Symptom**: [What was visible]
**Chain**: A → B → C → D → Symptom
**Root Cause**: [Which link was wrong]
**Fix Location**: [Where fixed in chain]
**Fix**: [What was changed]
**Time Saved**: [Estimate]
```

## RED FLAGS TO WATCH FOR:

⚠️ **Chain Too Complex** if:
- More than 5 links in the chain
- Same component appears twice  
- Can't explain why each link exists
- Circular dependencies detected

## UNIVERSAL APPLICATION:

This works for ANY technology:
- **React**: Event → Handler → State → Effect → Render
- **Python**: Request → Handler → Service → Database → Response
- **Backend**: API → Validation → Logic → Database → Cache
- **System**: Input → OS → Driver → Hardware → Output

---

**NOW**: Map the chain for "$ARGUMENTS" following this protocol. Start from the symptom and work backwards!
# DEBUG LOG

> Single source of truth for all debugging. Check here FIRST before starting any investigation.

## 🔴 CURRENT ACTIVE SESSION

**Status**: No active debugging

---

## 📚 PATTERNS QUICK REFERENCE

### Pattern: Container Before Component
**Symptom**: Component error/misbehavior  
**Fix**: Check parent/wrapper first  
**Saves**: 30+ minutes

### Pattern: Stale Closure
**Symptom**: State not updating in callbacks  
**Fix**: Use functional setState: `setState(prev => ...)`  
**Saves**: 45+ minutes

### Pattern: Re-render vs Initial  
**Symptom**: "Too many components" performance  
**Fix**: Fix re-renders, not component count  
**Saves**: 1+ hour

### Pattern: Profile Before Optimize
**Symptom**: Performance issues  
**Fix**: Measure first, fix actual bottleneck  
**Saves**: 2+ hours

---

## 📝 HOW TO USE THIS LOG

### Starting Debug:
```markdown
## Iteration 1: [Brief description of what you're trying]
**Hypothesis**: [What you think is wrong]
**Test**: [What you're going to check]
```

### After Testing:
```markdown
**Result**: [What actually happened]
**Learning**: [What this tells you]
Status: ❌ Wrong / ✅ Found it / ⚠️ Partial
```

### Next Iteration:
```markdown
## Iteration 2: [New approach based on learning]
**Hypothesis**: [Refined based on Iteration 1]
...
```

---

## 📂 RECENT SESSIONS ARCHIVE

### Session: Stale Closure in DeleteBlock (2025-01-21)

#### Iteration 1: Check Sync Engine
**Hypothesis**: Sync engine corrupting data  
**Test**: Added logs to sync layer  
**Result**: Data already null when reaching sync  
**Learning**: Problem is upstream  
Status: ❌ Wrong

#### Iteration 2: Check Container Component  
**Hypothesis**: Component calling delete has issue  
**Test**: Logged handleDeleteBlock in ExpandedViewEnhanced  
**Result**: blockToDelete undefined on second delete  
**Learning**: Classic stale closure - blocks array captured once  
Status: ✅ Found it

#### Iteration 3: Verify and Fix
**Hypothesis**: Functional setState will fix closure  
**Test**: Changed to `setBlocks(prev => ...)`  
**Result**: All deletes work correctly now  
**Learning**: Functional setState prevents closure issues  
Status: ✅ Fixed

**Pattern Extracted**: Stale Closure (added to patterns above)

---

### Session: [Next session will go here]

---

## 🎯 DEBUGGING CHECKLIST

Before starting ANY debug:
- [ ] Check patterns above - is this familiar?
- [ ] Read recent sessions - similar issue?
- [ ] Start with Iteration 1 in CURRENT ACTIVE
- [ ] Follow Container Rule (check parent first)
- [ ] Add logs with iteration prefix: `[DEBUG-1]`, `[DEBUG-2]`

---

*Keep only last 5 sessions here. Older ones can be deleted or moved to separate archive.*
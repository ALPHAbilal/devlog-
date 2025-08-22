---
description: Performance optimization with mandatory profiling
argument-hint: [component or feature to optimize]
---

# ⚡ PERFORMANCE OPTIMIZATION PROTOCOL

Target: "$ARGUMENTS"

## MANDATORY: MEASURE BEFORE OPTIMIZING

### Step 1: Check Known Patterns
Read `/AI-MEMORY/PATTERNS.md` section "⚡ Performance Patterns"
- Is this already a known bottleneck?
- Is there a proven solution?

### Step 2: Profile First (Rule 8)
BEFORE any optimization:
- [ ] Open DevTools Performance tab
- [ ] Record for 3-5 seconds
- [ ] Identify operations >16ms (frame budget)
- [ ] Find EXACT function names causing delays
- [ ] Document current metrics in milliseconds

### Step 3: Performance Budgets (Rule 11)
Check against universal budgets:
- Animation Frame: 16ms (60fps)
- User Input Response: 100ms maximum
- Page Load: 3 seconds maximum
- Database Query: 100ms maximum

### Step 4: Container Check
Remember Rule 1: Check the container/parent first
- Is the parent causing re-renders?
- Is the container's architecture the issue?

### Step 5: Cost-Benefit Analysis (Rule 14)
- Complexity (1-10): ___
- Improvement (1-10): ___
- Proceed only if improvement > complexity

### Step 6: Implementation
- Use SMALLEST possible change (Rule 9)
- Create git checkpoint first
- Test in isolation

### Step 7: Verification
- [ ] Measure again with same profiling
- [ ] Document improvement metrics
- [ ] Add to `/AI-MEMORY/PATTERNS.md` if new pattern
- [ ] Update `/AI-MEMORY/NOW.md` with progress

ONLY optimize what you've measured. No assumptions.
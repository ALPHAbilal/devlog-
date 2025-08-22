# PATTERNS DISCOVERED

> Quick reference for common issues. Check here BEFORE debugging.

## Pattern: Container Before Component
**When**: Component throws error or misbehaves  
**Root Cause**: Parent/container has the actual issue  
**Fix**: Check and fix the container first  
**Example**: "memo is not defined" - container missing import, not component

## Pattern: Stale Closure in React
**When**: State not updating in callbacks/useEffect  
**Root Cause**: Closure captured old state value  
**Fix**: Use functional setState: `setState(prev => ...)`  
**Example**: deleteBlock using old blocks array

## Pattern: Re-render vs Component Count  
**When**: "Too many components" performance issue  
**Root Cause**: Components re-rendering multiple times  
**Fix**: Fix re-render triggers, not component count  
**Example**: 17 blocks rendering 3-8x each

## Pattern: Profile Before Optimize
**When**: App feels slow  
**Root Cause**: Wrong assumption about bottleneck  
**Fix**: Use DevTools Performance tab first  
**Example**: Thought DOM was slow, was actually 65ms canvas draw

## Pattern: Effect Chain Cascade
**When**: Unexpected behavior on mount/update  
**Root Cause**: Chain of effects triggering each other  
**Fix**: Break chain at earliest point (check mount status)  
**Example**: Mount → useEffect → onChange → update → loop

---

## How to Add New Pattern

After solving an issue, add it here:

```markdown
## Pattern: [Short Name]
**When**: [Symptom you see]
**Root Cause**: [What's actually wrong]  
**Fix**: [How to fix it]
**Example**: [Real example from codebase]
```

Keep patterns SHORT and ACTIONABLE.
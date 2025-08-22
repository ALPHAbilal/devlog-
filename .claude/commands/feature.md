---
description: Implement new feature following all protocols
argument-hint: [feature description]
---

# 🚀 FEATURE IMPLEMENTATION PROTOCOL

Feature: "$ARGUMENTS"

## PHASE 1: RESEARCH & CONTEXT

### Check AI-MEMORY System
1. Read `/AI-MEMORY/DECISIONS.md` - understand architecture constraints
2. Read `/AI-MEMORY/PATTERNS.md` - learn from similar implementations
3. Read `/AI-MEMORY/NOW.md` - ensure no conflicting work

### Check Existing Code
From rules.md: "NEVER assume a library is available"
- [ ] Check package.json for existing libraries
- [ ] Look at neighboring components for patterns
- [ ] Follow existing code conventions

## PHASE 2: PLANNING (Rule 20 - Plan-First Protocol)

Create implementation plan:
```markdown
## Requirements
- What: [Feature description]
- Why: [Business value]
- Where: [Files to modify]

## Implementation Steps
1. [Smallest first step]
2. [Next incremental step]
3. [Continue...]

## Success Criteria
- [ ] Works with 10x expected data (Rule 3)
- [ ] Follows 16ms frame budget if UI
- [ ] Has cleanup for any allocations
- [ ] Tested in isolation
```

## PHASE 3: IMPLEMENTATION

### Follow These Rules:
1. **Container First** - Design container architecture before components
2. **Library First** (Rule 10) - Check for existing solutions
3. **Small Batch** (Rule 9) - Smallest working change
4. **Incremental Value** (Rule 4) - Each step must work standalone
5. **Performance Budget** - Stay within limits from start

### Documentation As You Go:
- [ ] Update `/AI-MEMORY/NOW.md` with progress
- [ ] Document decisions in `/AI-MEMORY/DECISIONS.md`
- [ ] Add new patterns to `/AI-MEMORY/PATTERNS.md`

## PHASE 4: VERIFICATION

Before marking complete:
- [ ] Tested with 10x expected data
- [ ] Ran `npm run lint`
- [ ] Checked for memory leaks
- [ ] Updated all AI-MEMORY documentation
- [ ] Created git commit with clear message

Begin implementation following this protocol.
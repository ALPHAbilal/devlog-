# Debug Workflow Rules

## When to Log (NOT always)

**LOG when:**
- Error is RESOLVED → write to `AI-MEMORY/debug/[category].md`
- Starting new bug → write to `AI-MEMORY/debug/now.md`
- Pattern discovered that will save future time

**DON'T LOG when:**
- Still investigating (wait until resolved)
- Simple fix < 2 minutes
- Already documented in category file

## Debug Flow

```
1. Bug appears
   ↓
2. Check AI-MEMORY/debug/[category].md FIRST
   ↓
3. If not found → investigate
   ↓
4. When RESOLVED:
   - Add to category file (4 lines max)
   - Empty now.md
```

## now.md Format (Active Bug Only)

```markdown
# Active: [Title]
**Started**: [Date]
## Symptom
- [One line]
## Attempts
1. [What] → [✅/❌]
## Next
[What to try]
```

## Category File Format (Permanent)

```markdown
## [Bug Title] - [Date]
**Symptom**: [One line]
**Cause**: [One line]
**Fix**: [Code or one line]
**Check First**: [What to check next time]
```

## Token Rules

- 4 lines per bug max
- No prose, bullets only
- No "I tried..." narratives
- Code snippets < 5 lines
- Reference files, don't copy content

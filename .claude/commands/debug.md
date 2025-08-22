---
description: Full debugging protocol with AI-MEMORY and rules.md
argument-hint: [error message or symptom]
---

# 🐛 DEBUGGING PROTOCOL ACTIVATED

Error/Symptom: "$ARGUMENTS"

## PHASE 1: PATTERN RECOGNITION
First, check `/AI-MEMORY/PATTERNS.md` - is this error already solved?
- Search for the error message
- Search for similar symptoms
- If found, apply the proven fix immediately

## PHASE 2: UNIVERSAL DEBUGGING CHECKLIST
From `/rules.md`, complete ALL checks:

### Container Check (Rule 1)
- [ ] Identified what's ONE LEVEL ABOVE the error
- [ ] Checked that file/component FIRST
- [ ] Verified imports/dependencies in container

### Measurement Check (Rule 2)
- [ ] Have actual error output/logs
- [ ] Reading ACTUAL error, not assumptions
- [ ] Read FULL stack trace

### Double-Check Measurement (Rule 7)
- [ ] First measure: WHAT is happening?
- [ ] Second measure: WHY is it happening?
- [ ] Can explain why symptom exists

### Root Cause Analysis
- [ ] Listed ALL symptoms
- [ ] Found ONE fix for ALL symptoms
- [ ] Verified cause, not effect

## PHASE 3: COLLABORATIVE LOOP
If not solved in 5 minutes:
1. Add strategic logging with `[DEBUG-1]` prefix
2. Ask user to run and share output
3. Update `/AI-MEMORY/NOW.md` with findings
4. Iterate with `[DEBUG-2]`, `[DEBUG-3]` etc.

## PHASE 4: DOCUMENTATION
When solved:
- [ ] Add pattern to `/AI-MEMORY/PATTERNS.md`
- [ ] Update `/AI-MEMORY/NOW.md` with resolution
- [ ] Document any architecture learnings in `/AI-MEMORY/DECISIONS.md`

Begin debugging now with this protocol.
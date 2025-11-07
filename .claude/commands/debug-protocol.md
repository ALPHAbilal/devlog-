---
description: Universal Frontend Debugging Protocol - Systematic root cause analysis with guaranteed bug resolution
model: claude-sonnet-4-5-20250929
---

# Universal Frontend Debugging Protocol

You are tasked with executing a comprehensive, systematic debugging protocol that guarantees bug resolution through evidence-based root cause analysis. This command orchestrates multiple specialized subagents to implement the 7-phase Universal Frontend Debugging Protocol.

## CRITICAL: YOUR MISSION IS SYSTEMATIC BUG RESOLUTION

- Follow the 7-phase protocol systematically (Phase 1 → Phase 7)
- Use adaptive rounds (3-7 rounds) based on bug complexity
- Automatically add performance measurements without asking
- Document everything in a debugging session file
- Use terminal.md for user collaboration
- Guarantee resolution through exhaustive systematic analysis

## Initial Setup

When this command is invoked, respond with:
```
🐛 Universal Frontend Debugging Protocol Activated

I'll systematically debug this issue using a 7-phase evidence-based protocol that guarantees root cause identification. This process involves:

- 📋 7 Phases: Problem Definition → Reproduction → Observation → Hypothesis Testing → Root Cause → Solution → Prevention
- 🔄 3-7 Collaborative Rounds (adaptive based on complexity)
- 📊 Automatic Performance Measurements
- 📝 Complete Documentation in thoughts/shared/research/

Please describe the bug you're experiencing. Include:
1. What's broken (symptoms)
2. What should happen (expected behavior)
3. When it started happening
4. Any error messages or screenshots
```

Then wait for the user's bug description.

## Steps to Follow After Receiving Bug Description

### Step 0: Initialize Debugging Session

1. **Create tracking structure using TodoWrite:**
   ```
   Phase 1: Problem Definition & Evidence Collection (pending)
   Phase 2: Reproduction & Isolation (pending)
   Phase 3: Observation & Data Gathering (pending)
   Phase 4: Hypothesis Formation & Testing (pending)
   Phase 5: Root Cause Identification (pending)
   Phase 6: Solution Implementation & Verification (pending)
   Phase 7: Prevention & Learning (pending)
   ```

2. **Determine bug complexity score (0.0-1.0):**
   - Simple (0.0-0.3): Clear error message, known component, single symptom → 3 rounds
   - Moderate (0.4-0.6): Multiple symptoms, unclear source, intermittent → 5 rounds
   - Complex (0.7-1.0): System-wide, no clear pattern, rare occurrence → 7 rounds

3. **Initialize terminal.md for collaboration:**
   - Create/clear terminal.md for this session
   - Explain to user that they'll paste outputs here

### PHASE 1: Problem Definition & Evidence Collection

**Objective:** Establish precise understanding of what's broken before attempting fixes.

1. **Spawn codebase-analyzer agent** to understand the suspected component:
   ```
   Analyze the implementation of [component/feature mentioned by user].
   Focus on:
   - Entry points and main functions
   - State management patterns
   - Data flow and transformations
   - Error handling mechanisms
   Provide file:line references for all findings.
   ```

2. **Document precise symptoms:**
   - Observable behavior (exactly what appears on screen/console)
   - Expected behavior (what should happen)
   - Deviation point (exact moment behavior diverges)
   - Frequency (100% of time, intermittent, specific conditions)

3. **Establish environmental context:**
   - Browser version, OS, device type
   - Application state (what data loaded, user actions)
   - Network conditions
   - Build configuration (dev vs production)
   - Timestamps (when first appeared)

4. **Update Phase 1 as completed in TodoWrite**

### PHASE 2: Reproduction & Isolation

**Objective:** Create reliable, minimal reproduction to narrow search space.

1. **Spawn collaborative-debugger agent for Round 1:**
   ```
   We're debugging: [bug description]

   Current understanding:
   - Symptoms: [from Phase 1]
   - Component: [identified component]
   - Frequency: [from Phase 1]

   Execute Round 1: Wide Net Discovery
   - Add strategic logging to identify problem area
   - Focus on entry/exit points and state changes
   - Request user to run app and paste output to terminal.md

   This is Round 1 of estimated [3/5/7] rounds.
   ```

2. **Wait for user to provide terminal.md output**

3. **Spawn container-debugger agent:**
   ```
   Bug symptoms: [description]
   Component affected: [component name]
   Round 1 logs: [summary of terminal.md findings]

   Perform container-first analysis:
   - Check container imports and dependencies
   - Verify props/state management in parent
   - Map effect chain from trigger to symptom
   - Identify if issue is in container or component

   Provide file:line references for all findings.
   ```

4. **Analyze isolation results:**
   - Does bug occur in component isolation?
   - Specific data shapes that trigger it?
   - User interaction or automatic trigger?
   - Which features/dependencies affect it?

5. **Update Phase 2 as completed in TodoWrite**

### PHASE 3: Observation & Data Gathering

**Objective:** Collect technical evidence about what system is actually doing.

1. **Spawn performance-profiler agent (automatic measurements):**
   ```
   Bug context: [description]
   Components involved: [from Phase 2]
   Container analysis: [summary from container-debugger]

   Add performance instrumentation automatically:
   - Baseline measurements at entry/exit points
   - Memory usage tracking
   - Render count and timing
   - Network request monitoring

   Provide exact code to add with file:line locations.
   ```

2. **Add performance measurements to code** (no user confirmation needed)

3. **Spawn collaborative-debugger for Round 2:**
   ```
   Round 2: Focused Investigation

   Discoveries from Round 1: [summary]
   Container analysis: [findings]
   Performance baseline: [initial metrics]

   Add focused logging based on Round 1 discoveries:
   - Narrow to suspicious variables
   - Track trigger conditions
   - Monitor call stack

   Request user to run app and update terminal.md with new output.
   ```

4. **Analyze execution path:**
   - Review console errors/warnings chronologically
   - Inspect DOM structure vs expected structure
   - Verify network requests (endpoints, payloads, responses)
   - Track state changes through debugging session

5. **Update Phase 3 as completed in TodoWrite**

### PHASE 4: Hypothesis Formation & Testing

**Objective:** Form testable hypotheses and systematically validate/invalidate them.

1. **Generate hypotheses based on evidence:**
   - Which component/module contains faulty logic?
   - What code path executes differently than intended?
   - Which assumption in code is incorrect?
   - What interaction between components causes failure?

2. **For each hypothesis, spawn collaborative-debugger for testing rounds:**

   **Round 3: Hypothesis Testing**
   ```
   Hypothesis: [specific testable hypothesis]

   Evidence supporting: [data from Phases 1-3]
   Evidence against: [contradicting data]

   Design experiment:
   - Modify inputs: [specific changes]
   - Add assertions: [what to verify]
   - Toggle features: [what to disable]

   Add testing logs and request user to run tests via terminal.md
   ```

3. **Systematically validate/invalidate:**
   - Execute each test and record results
   - If invalidated: eliminate area, form new hypothesis
   - If validated: narrow further with new hypothesis
   - Continue until exact location pinpointed

4. **If needed, spawn additional rounds (4-5) for complex bugs:**
   ```
   Round 4: Deep Dive Investigation
   Round 5: Edge Case Analysis
   ```

5. **Update Phase 4 as completed in TodoWrite**

### PHASE 5: Root Cause Identification

**Objective:** Determine fundamental reason bug exists, not just where it manifests.

1. **Apply 5 Whys technique:**
   ```
   Why does [symptom] happen?
   → Because [immediate cause]

   Why does [immediate cause] happen?
   → Because [deeper cause]

   Why does [deeper cause] happen?
   → Because [root cause]

   [Continue until fundamental cause found]
   ```

2. **Categorize root cause:**
   - Logic error (incorrect algorithm, wrong conditional)
   - State management error (race conditions, stale closures)
   - Data error (unexpected shape, missing properties)
   - Timing error (async completion order)
   - Environmental error (browser API differences, CORS)
   - Integration error (API contract assumptions)

3. **Spawn codebase-analyzer for root cause verification:**
   ```
   Suspected root cause: [identified cause]
   Location: [file:line]
   Category: [error category]

   Analyze the code at this location to verify:
   - Is this truly the root cause?
   - What other code depends on this?
   - What would breaking change affect?
   - Are there similar patterns elsewhere?
   ```

4. **Update Phase 5 as completed in TodoWrite**

### PHASE 6: Solution Implementation & Verification

**Objective:** Fix root cause and verify no new issues introduced.

1. **Spawn frontend-expert agent for solution implementation:**
   ```
   Root cause identified: [cause]
   Location: [file:line]
   Category: [error type]
   Evidence: [all collected data]

   Implement targeted fix:
   - Address root cause, not symptoms
   - Modify minimal code necessary
   - Follow framework patterns (React/TypeScript/Tailwind)
   - Add safeguards for edge cases
   - Document why this fixes root cause

   Provide complete fix with before/after code.
   ```

2. **Implement the fix**

3. **Spawn collaborative-debugger for final verification rounds:**

   **Round [N]: Solution Testing**
   ```
   Fix implemented: [description]
   Changes made: [file:line changes]

   Verify fix effectiveness:
   - Reproduce original bug (should not occur)
   - Test edge cases
   - Add logs to confirm expected behavior

   Request user to test via terminal.md
   ```

   **Round [N+1]: Regression Check**
   ```
   Fix verified working.

   Check for regressions:
   - Test related features
   - Verify no new errors in console
   - Check performance hasn't degraded

   Request user to test broader functionality via terminal.md
   ```

4. **Update Phase 6 as completed in TodoWrite**

### PHASE 7: Prevention & Learning

**Objective:** Extract lessons to prevent similar issues and improve process.

1. **Implement preventive measures:**

   **Add tests:**
   - Unit tests for root cause scenario
   - Integration tests for user workflow
   - E2E tests if critical user path

   **Add type checking/validation:**
   - TypeScript interfaces if type error
   - PropTypes if needed
   - Runtime validation for API responses

   **Add monitoring:**
   - Error tracking for similar patterns
   - Performance monitoring if relevant

2. **Document in AI-MEMORY/PATTERNS.md:**
   ```
   ## [Bug Category]: [Brief Title]
   **Date**: [Current date]
   **Component**: [Affected component]

   ### Symptom
   [Observable behavior]

   ### Root Cause
   [Fundamental cause identified]

   ### Solution
   [Fix implemented with file:line]

   ### Prevention
   - [Test added]
   - [Pattern to avoid]
   - [Early warning signs]

   ### Related Files
   - [List all files modified]
   ```

3. **Update team practices (if applicable):**
   - Document debugging pattern in codebase
   - Create checklist for this bug type
   - Share hypothesis-testing approach
   - Build knowledge base entry

4. **Update Phase 7 as completed in TodoWrite**

### Step Final: Generate Debugging Session Document

1. **Gather metadata:**
   - Run `hack/spec_metadata.sh` for git info
   - Generate filename: `thoughts/shared/research/debug-YYYY-MM-DD-HH-MM-SS-[issue-description].md`

2. **Create comprehensive debugging document:**

```markdown
---
date: [ISO 8601 timestamp with timezone]
researcher: [From thoughts status]
git_commit: [Current commit hash]
branch: [Current branch]
repository: [Repository name]
topic: "Debugging: [Bug Description]"
tags: [debugging, frontend, bug-category, component-name]
status: resolved
rounds_completed: [N]
complexity: [simple/moderate/complex]
last_updated: [YYYY-MM-DD]
last_updated_by: [Researcher name]
---

# Debugging Session: [Bug Description]

**Date**: [Current date and time with timezone]
**Researcher**: [Name]
**Git Commit**: [Hash]
**Branch**: [Branch name]
**Complexity**: [Simple/Moderate/Complex]
**Rounds**: [N rounds completed]
**Resolution Time**: [Time taken]

## Bug Report

### Initial Symptoms
[User's original bug description]

### Expected Behavior
[What should happen]

### Environment
- Browser: [Version]
- OS: [Version]
- Build: [Dev/Production]
- Timestamp: [When started]

---

## Phase 1: Problem Definition & Evidence Collection

### Precise Symptoms Documented
- **Observable**: [Exact behavior]
- **Expected**: [Correct behavior]
- **Deviation Point**: [Where it breaks]
- **Frequency**: [How often]

### Environmental Context
[Complete environment details]

### Component Analysis
[Codebase-analyzer findings with file:line references]

---

## Phase 2: Reproduction & Isolation

### Round 1: Wide Net Discovery
**Objective**: Identify problem area

**Logging Added**:
```javascript
[Code snippets with file:line]
```

**User Output** (from terminal.md):
```
[Console output from Round 1]
```

**Discoveries**:
- [Finding 1]
- [Finding 2]

### Container Analysis
[Container-debugger findings]
- Container: [file:line]
- Issue location: [Container/Component]
- Effect chain: [Complete chain mapped]

### Isolation Results
- Component isolation: [Result]
- Data isolation: [Result]
- Interaction isolation: [Result]

---

## Phase 3: Observation & Data Gathering

### Performance Baseline
[Performance-profiler automatic measurements]
- Operation time: [X]ms
- Memory usage: [X]MB
- Render count: [X]

### Round 2: Focused Investigation
**Objective**: Narrow to suspicious area

**Focused Logging Added**:
```javascript
[Code snippets]
```

**User Output**:
```
[Console output from Round 2]
```

**Execution Path Analysis**:
1. [Step 1] at [file:line]
2. [Step 2] at [file:line]
3. [Issue occurs] at [file:line]

---

## Phase 4: Hypothesis Formation & Testing

### Hypotheses Generated
1. **Hypothesis 1**: [Description]
   - Evidence for: [Data]
   - Evidence against: [Data]
   - Status: ✅ Validated / ❌ Invalidated

2. **Hypothesis 2**: [Description]
   - Evidence for: [Data]
   - Evidence against: [Data]
   - Status: ✅ Validated / ❌ Invalidated

### Round 3: Hypothesis Testing
**Testing Hypothesis**: [Validated hypothesis]

**Experiment Design**:
```javascript
[Test code added]
```

**Results**: [Findings]

[Additional rounds 4-5 if complex bug]

---

## Phase 5: Root Cause Identification

### 5 Whys Analysis
1. **Why** does [symptom] happen?
   → Because [immediate cause]

2. **Why** does [immediate cause] happen?
   → Because [deeper cause]

3. **Why** does [deeper cause] happen?
   → Because [even deeper]

4. **Why** does [even deeper] happen?
   → Because [getting close]

5. **Why** does [getting close] happen?
   → **ROOT CAUSE**: [Fundamental reason]

### Root Cause Category
**Type**: [Logic/State/Data/Timing/Environmental/Integration]

**Location**: `[file:line]`

**Explanation**: [Why this is the true root cause, not a symptom]

### Verification
[Codebase-analyzer verification of root cause]

---

## Phase 6: Solution Implementation & Verification

### Fix Implemented

**Root Cause**: [Brief description]

**Solution**: [What was changed and why]

**Code Changes**:

**Before**:
```javascript
// [file:line]
[Original code]
```

**After**:
```javascript
// [file:line]
[Fixed code]
```

**Why This Fixes It**: [Explanation linking fix to root cause]

### Round [N]: Solution Testing
**User Testing Results**:
- ✅ Original bug no longer occurs
- ✅ Edge cases work correctly
- ✅ Expected behavior confirmed

### Round [N+1]: Regression Check
**User Testing Results**:
- ✅ Related features still work
- ✅ No new console errors
- ✅ Performance maintained
- ✅ No side effects detected

---

## Phase 7: Prevention & Learning

### Preventive Measures Implemented

#### Tests Added
- [ ] Unit test: `[test file:line]` - [Description]
- [ ] Integration test: `[test file:line]` - [Description]
- [ ] E2E test: `[test file:line]` - [Description]

#### Type Safety / Validation
- [ ] TypeScript interfaces: `[file:line]`
- [ ] Runtime validation: `[file:line]`
- [ ] PropTypes: `[file:line]`

#### Monitoring
- [ ] Error tracking for pattern: [Description]
- [ ] Performance monitoring: [Metrics tracked]
- [ ] Logging: [What's being logged]

### Pattern Documented
✅ Added to `AI-MEMORY/PATTERNS.md` with:
- Symptom identification
- Root cause explanation
- Solution pattern
- Early warning signs

### Knowledge Sharing
- [ ] Team debugging pattern documented
- [ ] Checklist created for bug type
- [ ] Knowledge base entry added

---

## Summary

### Bug Resolution
- **Symptom**: [Original symptom]
- **Root Cause**: [Identified root cause]
- **Fix**: [Solution implemented]
- **Verified**: ✅ Yes

### Debugging Metrics
- **Total Rounds**: [N]
- **Time to Resolution**: [Duration]
- **Complexity**: [Simple/Moderate/Complex]
- **Agents Used**: [List of subagents]

### Key Learnings
1. [Learning 1]
2. [Learning 2]
3. [Learning 3]

### Files Modified
- `[file:line]` - [Change description]
- `[file:line]` - [Change description]

### Related Patterns
- See: `AI-MEMORY/PATTERNS.md#[pattern-name]`
- See: `thoughts/shared/research/debug-YYYY-MM-DD-*.md`

---

## Debugging Protocol Effectiveness

This session demonstrated:
- ✅ Systematic phase progression
- ✅ Evidence-based hypothesis testing
- ✅ Container-first debugging
- ✅ Collaborative user partnership
- ✅ Root cause identification (not symptom fixing)
- ✅ Prevention implementation
- ✅ Knowledge capture

**Protocol Success**: The 7-phase Universal Frontend Debugging Protocol successfully resolved this bug through systematic analysis rather than trial-and-error.
```

3. **Sync and present findings:**
   - Present concise summary to user
   - Show final fix with file:line references
   - Confirm bug is resolved
   - Mention documentation created

---

## Important Notes

### Adaptive Rounds Strategy
- **3 rounds** (Simple): Wide net → Focused → Verify
- **5 rounds** (Moderate): Wide net → Focused → Hypothesis test → Fix → Verify
- **7 rounds** (Complex): Wide net → Focused → Hypothesis 1 → Hypothesis 2 → Fix → Verify → Regression

### Automatic Measurements
- Performance profiler automatically adds instrumentation
- No user confirmation required for adding logs
- Remove debug logs after bug resolved (optional cleanup)

### Collaboration Protocol
- User provides output via terminal.md after each round
- Clear instructions for what to test/run
- Acknowledge user's observations (ego-free discovery)
- Pivot immediately when data contradicts hypothesis

### Subagent Orchestration
Execute subagents in this priority order:
1. **codebase-analyzer**: Understand component structure
2. **collaborative-debugger**: Iterative logging and testing (multiple rounds)
3. **container-debugger**: Container-first analysis and effect chain mapping
4. **performance-profiler**: Automatic performance measurements
5. **frontend-expert**: Solution implementation

### Critical Success Factors
- Never skip phases (even if "obvious" solution found)
- Always use 5 Whys for root cause
- Document in both debugging session file AND PATTERNS.md
- Verify fix doesn't introduce regressions
- Extract learnings for prevention

### Handoff Protocol
If debugging reveals larger issues:
- **architecture-strategist**: If problem is systemic design flaw
- **safety-guardian**: If fix requires risky changes
- **security-auditor**: If security vulnerability discovered
- **implementation-planner**: If fix requires major refactoring

---

## Emergency Escalation

If after maximum rounds (7) the bug is still not resolved:

1. **Document everything discovered so far**
2. **Spawn architecture-strategist**:
   ```
   Bug remains unresolved after 7 debugging rounds.

   Evidence collected: [Complete summary]
   Hypotheses tested: [All tested hypotheses]
   Root cause suspected: [Best guess with confidence level]

   Perform architectural analysis to determine if:
   - This is a design-level issue
   - System architecture prevents proper fix
   - Multiple interacting bugs exist
   - External dependency is the cause

   Recommend path forward.
   ```

3. **Present comprehensive report to user with next steps**

---

Remember: This protocol guarantees bug resolution through systematic, evidence-based analysis. Follow all 7 phases, use adaptive rounds, and document everything. The bug WILL be found and fixed!

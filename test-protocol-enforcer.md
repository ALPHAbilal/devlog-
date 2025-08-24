# Test Scenarios for Protocol Enforcer Agent

## Overview
This document contains test scenarios to validate that the protocol-enforcer agent correctly implements all 33 rules from rules.md and prevents common AI debugging mistakes.

## Test Scenario 1: Performance Issue (Tests Rules 2, 7, 8, 11, 14)

### User Prompt
"The document viewer is running slowly when scrolling"

### Expected Agent Behavior
1. **AI-MEMORY Check**: First checks PATTERNS.md for "Canvas Animation Bottleneck" and "Profile Before Optimize"
2. **Measurement First**: Uses Performance.now() or DevTools before any optimization
3. **Double Measurement**: 
   - First: Measures WHAT is slow (scroll time in ms)
   - Second: Identifies WHY (profiling to find exact bottleneck)
4. **Cost-Benefit Analysis**: Calculates complexity vs improvement
5. **No Assumptions**: Doesn't assume "too many DOM nodes" without data

### Validation Criteria
- [ ] Agent checks AI-MEMORY before starting
- [ ] Agent profiles before suggesting virtualization
- [ ] Agent measures exact milliseconds
- [ ] Agent identifies actual bottleneck (not assumed)
- [ ] Agent calculates ROI before complex changes

## Test Scenario 2: Undefined Error (Tests Rules 1, 5, 19)

### User Prompt
"Getting error: ReferenceError: memo is not defined"

### Expected Agent Behavior
1. **Container First**: Checks parent component (ExpandedViewEnhanced.jsx) before child components
2. **Effect Chain Mapping**: Maps chain from error back to import statement
3. **Root Cause**: Identifies missing import in container, not component usage

### Validation Criteria
- [ ] Agent checks container file first
- [ ] Agent maps complete error chain
- [ ] Agent fixes at earliest point (import level)
- [ ] Agent doesn't modify multiple files unnecessarily
- [ ] Agent documents pattern if new

## Test Scenario 3: Complex Feature Implementation (Tests Rules 3, 4, 20)

### User Prompt
"Implement real-time collaboration features for document editing"

### Expected Agent Behavior
1. **Plan-First**: Creates `realtime-collab-IMPLEMENTATION-PLAN.md` before any code
2. **Complexity Acknowledgment**: Estimates proper timeline (Initial × 3 + Investigation × 2)
3. **Incremental Value**: Plans Phase 1 to work standalone
4. **Scale Design**: Considers "what happens with 1000 concurrent users?"

### Validation Criteria
- [ ] Agent creates implementation plan document
- [ ] Plan includes all required sections
- [ ] Agent requests user review of plan
- [ ] Agent considers scale from start
- [ ] Agent plans incremental delivery

## Test Scenario 4: State Management Bug (Tests Rules 16, 17, 18)

### User Prompt
"State not updating correctly in callback functions"

### Expected Agent Behavior
1. **Collaborative Loop**: Uses rounds of debugging with user
2. **Ego-Free Discovery**: Willing to pivot when logs contradict hypothesis
3. **Debugging Escalation**: Follows 4-stage ladder systematically

### Expected Rounds
```
Round 1: Wide logging to identify area
Round 2: Focus on specific state updates
Round 3: Identify stale closure issue
Round 4: Test functional setState fix
Round 5: Verify no side effects
```

### Validation Criteria
- [ ] Agent uses [DEBUG-1], [DEBUG-2] prefixes
- [ ] Agent requests terminal.md collaboration
- [ ] Agent sets 3-5 round expectation
- [ ] Agent pivots when wrong without defending
- [ ] Agent documents each round's discovery

## Test Scenario 5: Code Comprehension (Tests Rules 21-26)

### User Prompt
"Help me understand how the storage layer works in this codebase"

### Expected Agent Behavior
1. **Backward Tracing**: Starts from storage outputs (saved documents) and traces back
2. **Mental Model First**: Builds conceptual understanding before code diving
3. **T-Shaped Investigation**: Maps all storage components broadly, then dives into critical path
4. **Pattern Recognition**: Documents storage patterns found
5. **Time-Boxing**: 15min orientation, 45min exploration, 60min deep-dive

### Validation Criteria
- [ ] Agent starts from outputs, not inputs
- [ ] Agent creates mental model diagram
- [ ] Agent identifies patterns across codebase
- [ ] Agent follows time-boxed approach
- [ ] Agent checks git history for context

## Test Scenario 6: Build/Deploy Error (Tests Rules 9, 13, 15)

### User Prompt
"Production build fails but development works fine"

### Expected Agent Behavior
1. **Small Batch Verification**: Tests minimal changes
2. **Revert Checkpoint**: Creates git checkpoint before experiments
3. **Cascading Failure Prevention**: Lists all affected features

### Validation Criteria
- [ ] Agent creates git checkpoint
- [ ] Agent makes smallest possible test change
- [ ] Agent lists blast radius of changes
- [ ] Agent has rollback plan ready
- [ ] Agent tests each affected feature

## Test Scenario 7: Memory Leak (Tests Pattern Recognition)

### User Prompt
"App gets slower over time and memory usage increases"

### Expected Agent Behavior
1. **Pattern Check**: Immediately finds "Memory Leak in Effects" in PATTERNS.md
2. **Apply Known Solution**: Adds cleanup functions to useEffect
3. **Validates Fix**: Measures memory over time after fix

### Validation Criteria
- [ ] Agent finds pattern in <30 seconds
- [ ] Agent applies proven solution
- [ ] Agent validates with measurement
- [ ] Agent doesn't reinvent solution

## Scoring Rubric

Each test scenario is worth points based on protocol adherence:

| Protocol | Points | Critical? |
|----------|--------|-----------|
| AI-MEMORY Check First | 20 | Yes |
| Container Before Component | 15 | Yes |
| Measurement Before Optimization | 15 | Yes |
| Collaborative Loop Usage | 10 | No |
| Ego-Free Pivoting | 10 | No |
| Plan-First Documentation | 10 | For features |
| Effect Chain Mapping | 10 | For bugs |
| Pattern Documentation | 10 | No |

**Passing Score**: 80/100 points minimum
**Excellence Score**: 95/100 points

## How to Test

1. Launch the protocol-enforcer agent with each scenario
2. Observe agent's approach and responses
3. Check off validation criteria
4. Calculate score based on rubric
5. Document any protocol violations for improvement

## Expected Outcomes

When properly implemented, the protocol-enforcer agent should:
- Prevent 90% of common debugging mistakes
- Save 2-4 hours per complex issue
- Create persistent documentation for future reference
- Enable systematic, reproducible problem-solving
- Maintain high-quality code standards

## Red Flags (Agent Failure Indicators)

- Skips AI-MEMORY check
- Optimizes without measuring
- Modifies components before checking containers
- Makes assumptions without data
- Defends wrong hypothesis despite evidence
- Writes code before creating plan for features
- Uses Stage 4 debugging before trying Stages 1-3
- Doesn't request user collaboration when stuck

## Success Metrics

- Time to resolution: 50% faster than ad-hoc debugging
- First-attempt success rate: >80%
- Pattern reuse rate: >60% for known issues
- User collaboration rounds: 3-5 for complex issues
- Documentation created: 100% for new patterns
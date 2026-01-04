---
description: Find weaknesses and blind spots in plans before execution
argument-hint: [path to plan file]
---

# Stress Test Plan

Evaluate the plan through **7 universal dimensions** that cause plans to fail.

## Process

1. Read the plan completely
2. Spawn agents in parallel for each dimension
3. Wait for ALL agents to complete
4. Synthesize findings into report
5. Recommend amendments

---

## 7 Dimensions + Agent Mapping

### 1. Blast Radius
**What files are ACTUALLY affected that the plan doesn't mention?**

Spawn **codebase-analyzer**: "Trace all import/dependency chains from files mentioned in [plan]. List every file that imports from or is imported by these files. Return file:line references."

### 2. Intermediate States
**What breaks during the transition?**

Spawn **codebase-analyzer**: "For files being modified in [plan], identify what depends on them. Can these be modified incrementally or must they change atomically?"

### 3. Build/Compile Impact
**How does this affect build performance?**

Spawn **codebase-pattern-finder**: "Find build configuration files. Identify patterns that affect build time (wildcards, barrel files, dynamic imports). Check if plan changes interact with these."

### 4. Runtime Behavior
**What works differently after execution?**

Spawn **codebase-analyzer**: "Find initialization sequences, module load order, and singleton patterns in files being modified. Will the plan change execution order?"

### 5. Tooling Configuration
**Do existing tools still work?**

Spawn **codebase-locator**: "Find all config files (tsconfig, eslint, vite, jest, etc). Check if plan changes paths, aliases, or patterns that configs reference."

### 6. Implicit Assumptions
**What does the plan assume without stating?**

Spawn **thoughts-locator**: "Find any past decisions, research, or documentation about the areas this plan touches. What context might the plan author have assumed?"

### 7. Scope Creep Vectors
**Where will this accidentally expand?**

Spawn **codebase-analyzer**: "In files being modified, find TODO comments, FIXME, deprecated patterns, or known issues that will demand attention during execution."

---

## Output Format

```
# Stress Test: [Plan Name]

Risk Level: 🔴 HIGH / 🟡 MEDIUM / 🟢 LOW

## Blind Spots Found

| # | Dimension | Issue | Impact | Mitigation |
|---|-----------|-------|--------|------------|
| 1 | Blast Radius | ... | 🔴/🟡/🟢 | ... |

## Recommended Amendments

### Amendment 1: [Title]
Add to plan:
> [specific text]

## Pre-Flight Checklist
- [ ] [verification needed before starting]
```

---

## Agent Reference

| Agent | Purpose |
|-------|---------|
| `codebase-locator` | Find WHERE files live |
| `codebase-analyzer` | Understand HOW code works |
| `codebase-pattern-finder` | Find SIMILAR patterns |
| `thoughts-locator` | Find related docs/decisions |

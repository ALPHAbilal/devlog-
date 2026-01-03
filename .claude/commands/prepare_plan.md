---
description: Check if plan is executable without questions, generate instructions to fill gaps
---

# Prepare Plan

You are tasked with analyzing implementation plans to determine if they are "executable without asking questions" and generating instructions for another AI to fill any gaps.

## CRITICAL: What Makes a Plan Executable

A plan is only executable when someone can follow it step-by-step without needing to ask clarifying questions. This means:

- **Config files**: Exact content provided, not just "create tsconfig.json"
- **Code files**: Specific files named, not just "convert one utility"
- **Dependencies**: Exact versions listed, not just "add TypeScript"
- **Execution order**: Numbered sequence of steps
- **Success verification**: Runnable commands, not just "verify it works"
- **Modifications**: Before/after or exact changes, not just "update main.jsx"

## Initial Response

When this command is invoked:

1. **Parse the input for a plan file path**

2. **Handle input scenarios**:

   **If NO plan file provided**:
   ```
   I'll check if an implementation plan is ready for execution.

   Which plan would you like me to analyze? Please provide the path.

   Tip: List recent plans with `ls -lt thoughts/shared/plans/`
   ```
   Wait for user input.

   **If plan file provided**:
   Proceed immediately to Step 1.

## Process Steps

### Step 1: Read the Plan Completely

- Use the Read tool WITHOUT limit/offset parameters
- Understand the full scope, phases, and objectives
- Note what the plan is trying to accomplish

### Step 2: Check Against Completeness Criteria

Evaluate the plan against this checklist. **If you're unsure about any item, spawn research agents to verify before marking it incomplete.**

#### Category A: Configuration Files
For each config file mentioned, check:
- [ ] Exact file content provided (not just filename)
- [ ] All options explained or documented
- [ ] Version-specific settings noted if applicable

*If config content is missing, use the **codebase-pattern-finder** agent to find existing similar configs in the project, or use the **web-search-researcher** agent to find official recommended configurations.*

#### Category B: Dependencies
- [ ] Exact package names listed
- [ ] Exact versions specified (e.g., `^5.6.0` not just "latest")
- [ ] Dev vs production dependencies distinguished
- [ ] Any version conflicts or requirements noted

*If versions are unclear, use the **web-search-researcher** agent to find compatible versions for the project's stack.*

#### Category C: Files to Create
For each new file:
- [ ] Exact file path specified
- [ ] Purpose/content described or provided
- [ ] If code file, example content or template given

*If the plan says "create a test file" without specifics, use the **codebase-pattern-finder** agent to find existing test files to model after.*

#### Category D: Files to Modify
For each modification:
- [ ] Exact file path specified
- [ ] What to change described precisely
- [ ] Before/after shown OR exact additions listed

*If modifications are vague, use the **codebase-analyzer** agent to read the current file and understand what changes are actually needed.*

#### Category E: Execution Order
- [ ] Numbered step-by-step sequence exists
- [ ] Dependencies between steps are clear
- [ ] No ambiguous ordering ("do these in any order")
- [ ] Each step is atomic (one action, no "and" chains)

#### Category F: Success Verification
- [ ] Specific commands to run listed
- [ ] Expected output described
- [ ] Manual verification steps detailed
- [ ] All success criteria are testable

#### Category G: Proof-of-Concept Choices
If the plan mentions "pick one" or "choose a file":
- [ ] Specific file already chosen
- [ ] Rationale for choice documented

*If the plan says "convert one utility to TypeScript" without specifying which:*
1. *Use the **codebase-locator** agent to find candidate files*
2. *Use the **codebase-analyzer** agent to evaluate which is simplest*
3. *Include the recommendation in your gap instructions*

#### Category H: Goal Coverage
- [ ] Plan states a clear goal/objective
- [ ] Each success criterion maps to at least one step that achieves it
- [ ] No "orphan steps" that don't contribute to any success criterion
- [ ] No "orphan criteria" with no step to achieve them

#### Spawning Research Agents

When you need to verify or research during the checklist evaluation:

- Use the **codebase-locator** agent to find WHERE files and components live
- Use the **codebase-analyzer** agent to understand HOW specific code works
- Use the **codebase-pattern-finder** agent to find SIMILAR implementations to model after
- Use the **thoughts-locator** agent to find related documentation or past decisions
- Use the **web-search-researcher** agent to get external documentation or official configs

**Spawn multiple agents in parallel** when researching different gaps. Wait for ALL agents to complete before proceeding to Step 3.

### Step 3: Generate Gap Analysis

Create a structured report:

```
## Plan Readiness: [Plan Name]

### Status: [READY TO EXECUTE | NEEDS PREPARATION]

### Completeness Score: X/8 categories complete

---

### What's Complete
- [Category]: [What's good about it]

### What's Missing

#### [Category Name]
| Missing Item | Why It's Needed | Priority | Source | Blocks |
|--------------|-----------------|----------|--------|--------|
| [Item] | [Explanation] | High/Med/Low | 📚/🔍 | ⛔ Gap N / - |

---

### Instructions for Filling Gaps

[Generated instructions for another AI - see Step 4]
```

### Step 4: Generate Fill Instructions

For each gap, generate a paragraph instruction that another AI can execute.

**Source Classification:**
- **📚 Docs** = Requires external documentation (library APIs, official specs, version-specific syntax)
- **🔍 Codebase** = Solvable via codebase analysis (file locations, existing patterns, local decisions)

**When to flag 📚:**
- New tool/library being introduced (need API docs)
- Version-specific changes (v4 → v5 migration)
- Config syntax not seen in existing codebase
- **Ask: "Does this reference something with an official spec/docs?"** (methodologies, patterns, tool APIs)

**IMPORTANT: Do NOT research 📚 gaps.** Just flag them. The research happens separately.

**When to flag 🔍:**
- Adapting existing patterns to new use case
- Finding/categorizing files
- Understanding current code behavior
- Local decisions (which files, what order)

Format:

```
## Instructions for AI

### Gap 1: [Category - Missing Item] 📚/🔍

**Instructions for AI:**

[Single paragraph with specific, actionable instructions. Include:
- Exactly what to add/create
- Where to add it in the plan
- What to research if needed (if 📚: specify which docs)
- Expected format of the addition]

### Gap 2: [Category - Missing Item] 📚/🔍

**Instructions for AI:**

[Next instruction paragraph...]
```

### Step 4b: Generate Gap Execution Order

After identifying all gaps, determine the ORDER to fill them:

1. **Map dependencies**: Which gaps depend on other gaps being filled first?
2. **Renumber sequentially**: Steps are 1, 2, 3... regardless of original gap numbers
3. **Find critical gaps**: Mark gaps that block multiple other gaps with ⛔
4. **Output execution order** (split by source):

```
### Gap Execution Order

**📚 Research First (before iterate_plan):**

**Gap N → Step X: [name]**
Copy to Perplexity:
```
I'm working on [brief context of what you're implementing].

Please answer:
1. [specific question needing authoritative answer]
2. [another specific question]
3. [request for concrete output: config, code example, etc.]

Use [authoritative source] as reference.
```

**🔍 Fill with iterate_plan (in dependency order):**
Follow Step order. For each Step, copy the matching Gap instruction to iterate_plan.

| Step | Gap   | Name        | Note                          |
|------|-------|-------------|-------------------------------|
| ⛔ 1 | Gap X | [name]      | CRITICAL - blocks: Gap Y, Z   |
| 2    | Gap Y | [name]      | Depends on: Gap X             |
| 3    | Gap N | [name]      | After 📚 research done        |
...
```

### Step 5: Present Results

Output the complete validation report with:
1. Overall status
2. What's already complete
3. What's missing (with table including Blocks column)
4. Instructions for each gap
5. Gap Execution Order (dependencies resolved)

Then ask:
```
Would you like me to:
1. Save these instructions to a file for later use
2. Explain any gaps in more detail
3. Proceed to fill the gaps now (will switch to research mode)
```

## Completeness Criteria Reference

### Config Files - What "Complete" Looks Like:

**Incomplete:**
```
- Create tsconfig.json with strict mode
```

**Complete:**
```
- Create `tsconfig.json`:
  ```json
  {
    "compilerOptions": {
      "strict": true,
      "target": "ES2020",
      ...full content...
    }
  }
  ```
```

### Code Files - What "Complete" Looks Like:

**Incomplete:**
```
- Convert one utility to TypeScript
```

**Complete:**
```
- Convert `src/utils/sanitization.js` to `sanitization.ts`
  - This file chosen because: pure functions, no dependencies, already has tests
  - Add types to exported functions
  - No logic changes, only type annotations
```

### Modifications - What "Complete" Looks Like:

**Incomplete:**
```
- Update main.jsx to wrap app in QueryClientProvider
```

**Complete:**
```
- Modify `src/main.jsx`:
  - Add import: `import { QueryClientProvider } from '@tanstack/react-query'`
  - Add import: `import queryClient from './lib/queryClient'`
  - Wrap `<App />` with:
    ```jsx
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
    ```
```

### Execution Order - What "Complete" Looks Like:

**Incomplete:**
```
## Steps
- Add TypeScript
- Add TanStack Query
- Add tests
- Convert files
```

**Complete:**
```
## Execution Order

1. Edit `package.json` - add all dependencies
2. Create `tsconfig.json` - TypeScript config
3. Create `vitest.config.ts` - test runner config
4. Create `src/test/setup.ts` - test setup
5. Create `src/lib/queryClient.ts` - TanStack Query client
6. Modify `src/main.jsx` - add QueryClientProvider
7. Convert `src/utils/sanitization.js` → `.ts`
8. Create `src/__tests__/sanitization.test.ts`
9. Convert `src/components/LogoMinimal.jsx` → `.tsx`
10. Create `.dependency-cruiser.js`
11. Update `eslint.config.js` - add boundary rules
12. Run verification commands
13. Commit and push
```

## Instruction Generation Guidelines

When generating instructions for another AI:

1. **Be specific about location**: "Add to the `## Execution Order` section" not "add to the plan"

2. **Include research hints**: "Check the existing eslint.config.js to understand the current format before writing the addition"

3. **Specify format**: "Use a ```json code block for the config content"

4. **Explain the why**: "This is needed because without exact content, the implementer will have to research it themselves"

5. **One instruction per gap**: Don't combine multiple gaps into one instruction

6. **Make it copy-pasteable**: The instruction should be directly usable by the next AI

7. **Reference, don't embed**: Tell iterate_plan what to READ, not what you found. "Read src/utils/" not "there are 49 files in utils"

8. **Name the agent for 🔍 gaps**: "Use codebase-locator to find..." not just "find files in..."

## Priority Levels

- **High**: Blocks implementation entirely (missing config content, no execution order)
- **Medium**: Slows down implementation (vague file choices, unclear modifications)
- **Low**: Nice-to-have clarifications (rationale, alternative approaches)

## Relationship to Other Commands

Recommended workflow:
1. `/create_plan` - Create initial implementation plan
2. `/prepare_plan` - Check if plan is ready, generate gap-fill instructions
3. `/iterate_plan` - Fill in the gaps based on instructions
4. `/implement_plan` - Execute the now-complete plan
5. `/validate_plan` - Verify implementation correctness

## Agents

| Agent | Purpose |
|-------|---------|
| `codebase-locator` | Find WHERE files and components live |
| `codebase-analyzer` | Understand HOW specific code works |
| `codebase-pattern-finder` | Find SIMILAR implementations to model after |
| `thoughts-locator` | Find related documentation or past decisions |
| `web-search-researcher` | Get external documentation or official configs |

## Important Notes

- **📚 Docs gaps are expensive** - flag them clearly; they require web research and may have version-specific gotchas
- Read the ENTIRE plan before analyzing - partial reads miss context
- Don't be pedantic - if something is obviously clear from context, it's fine
- Focus on gaps that would cause an implementer to stop and ask questions
- The goal is "executable without questions" not "perfect documentation"
- Trust that the implementer has basic technical knowledge
- Config files and exact code are the most common gaps
- Generate instructions that are specific enough for another AI to act on immediately
- When in doubt during checklist evaluation, spawn agents to verify
- Spawn multiple agents in parallel for efficiency
- Wait for ALL agent results before generating final analysis

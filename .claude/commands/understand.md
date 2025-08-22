---
description: Elite code comprehension using Rules 21-26 for mastering any codebase
argument-hint: [codebase/feature/component to understand]
---

# 🧠 ELITE CODE COMPREHENSION PROTOCOL

**Target**: "$ARGUMENTS"

Activating Rules 21-26 from `/rules.md` for MAXIMUM comprehension efficiency. This protocol makes you 3-4x faster at understanding code.

## 📍 PHASE 0: AI-MEMORY CHECK (30 seconds)
Before diving in, check what we already know:
- [ ] Check `/AI-MEMORY/PATTERNS.md` - Any patterns from this codebase?
- [ ] Check `/AI-MEMORY/DECISIONS.md` - Architecture decisions documented?
- [ ] Check `/AI-MEMORY/NOW.md` - Current work related to this?

## 🧠 PHASE 1: MENTAL MODEL FIRST (Rule 22) [30 minutes]
**WITHOUT looking at code**, build initial mental model:

### Think & Diagram (No Code Yet!)
```
📦 System Purpose: [What MUST this system do?]

┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Input?    │ --> │  Process?   │ --> │   Output?   │
└─────────────┘     └─────────────┘     └─────────────┘

Key Assumptions:
1. [What I think this does]
2. [How I think it works]
3. [What patterns I expect]
```

### Reality Check
- [ ] Run the application
- [ ] Use as end-user for 15 minutes
- [ ] Compare actual behavior to mental model
- [ ] Update model based on reality (don't defend wrong assumptions!)

## 🔍 PHASE 2: BACKWARD TRACING (Rule 21) [45 minutes]
**Start from OUTPUTS and trace backward** (60% more effective than forward reading):

### Find Concrete Outputs
1. **Visible Output**: [UI element, file, API response, log message]
2. **Exact Location**: [File:line that produces this]
3. **Trace Backward**:
   ```
   OUTPUT (what users see)
      ← Function that renders/writes it
         ← Function that prepares data
            ← Function that fetches/calculates
               ← Entry point/trigger
   ```

### Document the Flow
```
📤 Output: [What I found]
   └── Producer: [File:line]
       └── Caller: [File:line]
           └── Data Source: [File:line]
               └── Entry Point: [File:line]
```

## 🔤 PHASE 3: T-SHAPED INVESTIGATION (Rule 23) [2 hours]

### Hour 1: HORIZONTAL - Map Everything Broadly
```
📁 Project Structure:
├── Entry Points: [main files]
├── Core Modules: [key directories]
├── Data Layer: [database/storage]
├── Business Logic: [where decisions happen]
├── UI/API Layer: [user-facing parts]
└── Config/Utils: [supporting files]

🔗 Major Connections:
- [Module A] ←→ [Module B]: [What they exchange]
- [Module C] ←→ [Module D]: [What they exchange]
```

### Hour 2: VERTICAL - Deep Dive ONE Critical Path
Pick the MOST IMPORTANT feature and understand it completely:
```
🎯 Critical Feature: [Name]
- Entry: [Where it starts]
- Processing: [Step by step]
- State Changes: [What gets modified]
- Output: [What it produces]
- Edge Cases: [What could go wrong]
```

## 🏛️ PHASE 4: CODE ARCHAEOLOGY (Rule 26) [30 minutes]
**Excavate the history** to understand why code exists:

### Git History Analysis
```bash
# Find problem areas (frequently changed files)
git log --pretty=format: --name-only | sort | uniq -c | sort -rg | head -20

# Find oldest/most stable code
git log --reverse --pretty=format:"%h %ad %s" --date=short | head -20

# Check for TODOs and FIXMEs
grep -r "TODO\|FIXME\|HACK\|BUG\|XXX" --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx"
```

### Historical Insights
- **Problem Areas**: [Frequently modified files]
- **Stable Core**: [Oldest unchanged files]
- **Known Issues**: [TODOs found]
- **Key Decisions**: [Important commit messages]

## ⏱️ PHASE 5: TIME-BOXED DEEP DIVE (Rule 24) [Remaining time]

### Strict Time Limits (Don't exceed!):
```
⏰ Current Session Plan:
□ 0-15 min: Setup, README, run the app ✓
□ 15-45 min: Use as end-user ✓
□ 45-60 min: Map folder structure ✓
□ 60-120 min: T-shaped investigation ✓
□ 120-150 min: Code archaeology ✓
□ 150-240 min: Deep dive critical paths
□ 240+ min: Pattern documentation
```

## 🎯 PHASE 6: PATTERN RECOGNITION (Rule 25) [Ongoing]

### Document EVERY Pattern Found
Add to `/AI-MEMORY/PATTERNS.md`:

```markdown
### Patterns in $ARGUMENTS

#### Architectural Patterns
- **[Pattern Name]**: [Where seen, what it does, why it exists]

#### Code Patterns  
- **[Pattern Name]**: [Where seen, what it does, why it exists]

#### Domain Patterns
- **[Pattern Name]**: [Where seen, what it does, why it exists]

#### Anti-Patterns (Avoid These)
- **[Pattern Name]**: [Where seen, why it's bad]
```

### Pattern Groups to Look For:
- **Syntactic**: Coding style, naming conventions
- **Semantic**: How meaning is expressed
- **Architectural**: System design patterns
- **Domain**: Business logic patterns

## 📝 PHASE 7: SYSTEMATIC DOCUMENTATION (Rule 28)

Create comprehensive notes in `/AI-MEMORY/NOW.md`:

```markdown
## Understanding: $ARGUMENTS

### Purpose
- What: [What this code does]
- Why: [Business reason it exists]
- Who: [Original authors/maintainers]

### Architecture
- Entry Points: [Main files]
- Core Flow: [A → B → C → D]
- Dependencies: [External requirements]

### Critical Paths
1. [Feature]: [How it works]
2. [Feature]: [How it works]

### Data Flow
- Input: [What comes in]
- Transform: [What happens]
- Output: [What goes out]

### Patterns Observed
- [Pattern]: [Where/Why]

### Problem Areas
- [File/Module]: [Issue found]

### Questions/Unknown
- [ ] [Need to investigate]
- [ ] [Need to investigate]
```

## 🎭 PHASE 8: BIAS BREAKER VALIDATION (Rule 27)

Test ALL assumptions:
- [ ] Write prediction of what code does
- [ ] Run it
- [ ] Compare prediction vs reality
- [ ] Update mental model if wrong
- [ ] Test edge cases, not just happy path
- [ ] Question "obvious" things

## 🚀 COMPREHENSION METRICS

Track your understanding efficiency:
- **Backward Tracing**: Found critical flow in ___ minutes
- **Pattern Recognition**: Identified ___ patterns
- **Mental Model Accuracy**: ___% correct predictions
- **Time to First Insight**: ___ minutes
- **Comprehension Speed**: ___x faster than line-by-line

## ✅ FINAL CHECKLIST

Before considering codebase "understood":
- [ ] Can trace any feature from UI to database
- [ ] Know why architecture decisions were made
- [ ] Identified all major patterns
- [ ] Found problem areas and TODOs
- [ ] Can predict behavior without running
- [ ] Updated `/AI-MEMORY/` with all findings
- [ ] Could explain this to a new developer

## 💡 ELITE TIPS

1. **2-Point Font View**: Zoom out to see code "shape" and structure
2. **Reality > Assumptions**: Update mental model immediately when wrong
3. **Outputs First**: Always trace backward from what users see
4. **Time Box Strictly**: Don't get lost in rabbit holes
5. **Document Immediately**: Insights are lost within minutes

---

**REMEMBER**: You're now 3-4x faster at understanding code by following this protocol. Start with Phase 1 (Mental Model) NOW!
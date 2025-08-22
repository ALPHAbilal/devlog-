---
description: Deep code history analysis to understand why code exists (Rule 26+)
argument-hint: [codebase or module to excavate]
---

# 🏛️ CODE ARCHAEOLOGY DEEP DIVE

**Excavating**: "$ARGUMENTS"

Using Rule 26 and advanced techniques to understand the WHY behind the code through its history.

## 🔍 PHASE 1: IDENTIFY PROBLEM AREAS

### Most Frequently Modified Files (Usually Problems)
```bash
# Top 20 most changed files - these are your problem areas
git log --pretty=format: --name-only | sort | uniq -c | sort -rg | head -20
```

**Problem Areas Found**:
- [ ] File: ___ (changed ___ times) - Why so many changes?
- [ ] File: ___ (changed ___ times) - What's unstable here?
- [ ] File: ___ (changed ___ times) - Technical debt?

## 📅 PHASE 2: FIND THE FOUNDATIONS

### Oldest Code (Usually Most Stable/Important)
```bash
# Find the oldest files - these are your foundations
git log --reverse --pretty=format:"%h %ad %s" --date=short | head -20

# Find files that haven't changed in 6+ months (stable core)
find . -type f -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" | while read file; do
  last_modified=$(git log -1 --format="%ar" -- "$file" 2>/dev/null)
  echo "$last_modified - $file"
done | grep -E "months|year" | head -20
```

**Stable Foundations**:
- [ ] Core File: ___ (unchanged since ___) - Critical infrastructure
- [ ] Core File: ___ (unchanged since ___) - Don't break this!

## 🚨 PHASE 3: EXCAVATE KNOWN ISSUES

### TODO/FIXME/HACK Archaeology
```bash
# Find all technical debt markers
grep -r "TODO\|FIXME\|HACK\|BUG\|XXX\|DEPRECATED\|WARNING" \
  --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" \
  --include="*.py" --include="*.java" --include="*.go" | head -50
```

### Categorize Technical Debt
```markdown
🔴 CRITICAL (FIXME/BUG):
- [ ] [File:line]: [Issue description]

🟡 IMPORTANT (TODO):
- [ ] [File:line]: [Task description]

⚠️ DANGEROUS (HACK/XXX):
- [ ] [File:line]: [Why this hack exists]
```

## 📊 PHASE 4: EVOLUTION ANALYSIS

### How Did This Feature Evolve?
```bash
# Pick a critical file and see its evolution
git log --oneline --graph --decorate -- [critical_file.js]

# See how a specific function evolved
git log -L :[function_name]:[file_path]

# Find when a bug was introduced
git bisect start
git bisect bad  # Current version is bad
git bisect good [old-commit]  # Old version was good
```

### Evolution Timeline
```
📅 Feature Evolution:
[Date] - Initial implementation: [What was built]
[Date] - Major refactor: [Why changed]
[Date] - Bug fix: [What broke]
[Date] - Performance fix: [What was slow]
[Date] - Current state: [What it is now]
```

## 🔬 PHASE 5: AUTHOR ARCHAEOLOGY

### Who Knows This Code?
```bash
# Find main contributors to understand who to ask
git shortlog -sn -- [directory_or_file]

# Find who last touched each line (blame)
git blame [file] | head -50

# Find expert on specific module
git log --pretty=format:"%an" -- [module_path] | sort | uniq -c | sort -rg | head -5
```

**Code Experts**:
- **[Author]**: Expert on [module] (___ commits)
- **[Author]**: Expert on [module] (___ commits)

## 💬 PHASE 6: COMMIT MESSAGE ARCHAEOLOGY

### Understanding the WHY from History
```bash
# Find commits with important keywords
git log --grep="refactor\|fix\|bug\|performance\|security\|breaking" --oneline

# Find commits that mention specific features
git log --grep="[feature_name]" --oneline

# Find merge commits (major features)
git log --merges --oneline | head -20
```

### Key Historical Decisions
```markdown
## Important Commits Found:

### Architecture Changes
- [Hash]: [Message] - Why: [Reason extracted]

### Bug Fixes That Reveal Problems
- [Hash]: "Fixed [what]" - Reveals: [underlying issue]

### Performance Optimizations
- [Hash]: "Optimized [what]" - Problem was: [what was slow]
```

## 🗺️ PHASE 7: VISUAL ARCHAEOLOGY

### Code Shape Analysis (2-Point Font Technique)
1. Open file in editor
2. Zoom out to 2-point font (Ctrl+- multiple times)
3. Observe the "shape":
   - **Tall narrow blocks**: Likely configuration/constants
   - **Wide blocks**: Complex logic
   - **Repeated patterns**: Copy-paste code
   - **Indentation depth**: Complexity indicators

**Visual Patterns Found**:
- [ ] Pattern: [What you see] means [What it indicates]
- [ ] Pattern: [What you see] means [What it indicates]

## 🧬 PHASE 8: DEPENDENCY ARCHAEOLOGY

### How Dependencies Evolved
```bash
# See how package.json evolved
git log -p package.json | grep -E "^\+.*\".*\":" | head -30

# Find when dependencies were added
git log --all --grep="add.*dependency\|install" --oneline

# Check for dependency updates
git log --all --grep="update.*to\|upgrade.*to\|bump" --oneline | head -20
```

**Dependency Evolution**:
- Originally used: [Library v1] for [purpose]
- Migrated to: [Library v2] because [reason]
- Added: [Library] to solve [problem]
- Removed: [Library] because [reason]

## 📈 PHASE 9: PERFORMANCE ARCHAEOLOGY

### Find Performance Problems from History
```bash
# Find performance-related commits
git log --grep="slow\|performance\|optimize\|speed\|fast" --oneline

# Find timeout/memory issues
git log --grep="timeout\|memory\|leak\|crash" --oneline
```

**Historical Performance Issues**:
- **Problem**: [What was slow]
- **Solution**: [How it was fixed]
- **Current Risk**: [Could it happen again?]

## 📝 PHASE 10: DOCUMENT ARCHAEOLOGICAL FINDINGS

Add to `/AI-MEMORY/DECISIONS.md`:

```markdown
### Historical Context for $ARGUMENTS

**Age**: Codebase started [date], [age] old
**Evolution**: [# commits], [# contributors]
**Stability**: Core unchanged since [date]

**Key Historical Events**:
1. [Date]: [Major change] because [reason]
2. [Date]: [Major change] because [reason]

**Problem Areas** (Frequently changed):
- [File/Module]: Changed [#] times, indicates [issue]

**Stable Core** (Don't break these):
- [File/Module]: Unchanged since [date], critical for [purpose]

**Technical Debt**:
- [#] TODOs found
- [#] FIXMEs found
- [#] HACKs found

**Key Contributors** (Domain experts):
- [Name]: Expert on [area]
- [Name]: Expert on [area]
```

## ✅ ARCHAEOLOGICAL INSIGHTS CHECKLIST

- [ ] Identified problem areas (frequently changed files)
- [ ] Found stable core (old unchanged files)
- [ ] Discovered technical debt (TODOs/FIXMEs)
- [ ] Understood evolution timeline
- [ ] Identified domain experts
- [ ] Extracted key decisions from commits
- [ ] Visualized code structure patterns
- [ ] Traced dependency evolution
- [ ] Found historical performance issues
- [ ] Documented all findings in AI-MEMORY

## 💎 ARCHAEOLOGICAL WISDOM

> "Those who don't understand history are doomed to repeat it"

The code's history tells you:
- **WHY** it exists (original problem)
- **HOW** it evolved (iterations)
- **WHAT** went wrong (bugs/fixes)
- **WHO** understands it (experts)
- **WHERE** problems hide (frequent changes)

This knowledge prevents you from:
- Breaking stable code
- Repeating past mistakes
- Ignoring known issues
- Reinventing solutions
- Missing critical context
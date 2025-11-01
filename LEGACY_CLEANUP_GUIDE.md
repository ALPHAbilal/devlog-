# Legacy Code Cleanup System - Complete Guide

Generated: 2025-11-01

## Overview

This is a **safe, systematic approach** to removing unused and legacy code from your codebase without breaking functionality.

The system consists of **3 specialized agents** and **3 slash commands** that work together to detect, analyze, and safely remove dead code.

---

## The Three-Phase Approach

```
Phase 1: DETECT → Phase 2: ANALYZE → Phase 3: CLEANUP
     ↓                  ↓                  ↓
/detect-legacy    /map-imports      /cleanup-legacy
     ↓                  ↓                  ↓
  Report 1           Report 2          Safe Removal
```

---

## Part 1: Detection

### Command: `/detect-legacy`

**Purpose:** Find unused, legacy, and redundant code

**What it does:**
- Scans all source files
- Builds import/export map
- Identifies files never imported
- Finds unused exports
- Detects duplicate code
- Locates commented-out code
- Finds TODO/FIXME markers

**Output:** `legacy-code-report-<timestamp>.md`

**Example:**
```bash
/detect-legacy

# Or scan specific directory
/detect-legacy src/components/
```

### What You Get

A detailed report with:

```markdown
## 🔴 HIGH CONFIDENCE - Safe to Remove
- src/Test.jsx - Never imported ✅
- src/utils/old-helper.js - Never imported ✅

## 🟡 MEDIUM CONFIDENCE - Review Required
- src/components/ExpandedView.jsx - Replaced by ExpandedViewEnhanced.jsx

## 🟢 LOW CONFIDENCE - Investigate
- src/pages/auth/callback.jsx - Possible dynamic import
```

**Confidence Levels:**
- **🔴 HIGH:** Zero imports found → Safe to delete
- **🟡 MEDIUM:** Replaced/superseded → Verify before deleting
- **🟢 LOW:** Might be used dynamically → Manual review needed

---

## Part 2: Analysis

### Command: `/map-imports`

**Purpose:** Understand import dependencies

**What it does:**
- Maps all import relationships
- Identifies orphan files (no imports)
- Finds circular dependencies
- Shows dependency trees
- Calculates usage metrics
- Identifies hub files (critical dependencies)

**Output:** `dependency-map-<timestamp>.md`

**Example:**
```bash
/map-imports

# Or map specific directory
/map-imports src/utils/
```

### What You Get

A comprehensive dependency analysis:

```markdown
## Orphan Files
src/Test.jsx - Indegree: 0 ← Never imported!

## Hub Files (Critical!)
src/utils/helpers.js - Imported by 45 files ← Don't delete!

## Circular Dependencies
AuthContext.jsx → storageWrapper.js → AuthContext.jsx ❌

## Dependency Tree
App.jsx
├── Dashboard.jsx
│   ├── DocumentGrid.jsx
│   └── ProjectExplorer.jsx
```

**Key Metrics:**
- **Indegree:** How many files import this (popularity)
- **Outdegree:** How many files this imports (complexity)
- **Depth:** Distance from entry points

---

## Part 3: Cleanup

### Command: `/cleanup-legacy`

**Purpose:** Safely remove detected legacy code

**What it does:**
1. Creates git backup branch
2. Shows detailed execution plan
3. Waits for your approval
4. Deletes unused files
5. Removes unused exports
6. Cleans commented code
7. Runs build/tests
8. Commits with documentation
9. Provides rollback instructions

**Output:** Git commits + cleanup summary

**Example:**
```bash
# Preview without changes
/cleanup-legacy legacy-code-report-<timestamp>.md --dry-run

# Execute Phase 1 only (safest)
/cleanup-legacy legacy-code-report-<timestamp>.md --phase=1

# Interactive mode (prompt for each deletion)
/cleanup-legacy legacy-code-report-<timestamp>.md --interactive

# Full cleanup (all phases)
/cleanup-legacy legacy-code-report-<timestamp>.md
```

### Safety Features

✅ **Git Backup:** Creates backup branch before ANY changes
✅ **Approval Required:** Shows plan, waits for "yes" confirmation
✅ **Validation:** Runs build/tests after each change
✅ **Rollback Ready:** Provides multiple rollback options
✅ **Phased Execution:** Start with safest items first

### Cleanup Phases

**Phase 1: High Confidence** (Recommended first)
- Delete files with zero imports
- Remove unused exports
- Clean commented code
- **Risk:** ⬇️ Very Low

**Phase 2: Medium Confidence**
- Remove superseded files
- Consolidate duplicate code
- **Risk:** ⚠️ Medium (requires testing)

**Phase 3: Low Confidence**
- Investigate potential orphans
- Fix circular dependencies
- **Risk:** ⚠️ High (manual review needed)

---

## Complete Workflow

### Recommended Safe Workflow

```bash
# Step 1: Understand the codebase structure
/map-imports

# Review: dependency-map-<timestamp>.md
# - Check for orphan files
# - Identify hub files (don't delete these!)
# - Note circular dependencies

# Step 2: Detect legacy code
/detect-legacy

# Review: legacy-code-report-<timestamp>.md
# - Start with HIGH CONFIDENCE section
# - Cross-reference with dependency map
# - Mark items you want to cleanup

# Step 3: Preview the cleanup plan
/cleanup-legacy legacy-code-report-<timestamp>.md --dry-run

# Review the plan carefully
# - What will be deleted?
# - What will be modified?
# - Is it safe?

# Step 4: Execute Phase 1 (safest)
/cleanup-legacy legacy-code-report-<timestamp>.md --phase=1

# The system will:
# 1. Create backup branch
# 2. Show execution plan
# 3. Wait for your "yes"
# 4. Delete files
# 5. Run build/tests
# 6. Commit changes

# Step 5: Test your application
npm run dev
# Click around, test features

# Step 6: If all good, continue with Phase 2
/cleanup-legacy legacy-code-report-<timestamp>.md --phase=2

# Step 7: Merge to main
git checkout main
git merge cleanup/legacy-code-<timestamp>
```

---

## Safety Mechanisms

### 1. Git Backup Branch

Before ANY deletion:
```bash
# Automatic backup created
backup/before-cleanup-<timestamp>

# All current code safely stored
# Can restore anytime
```

### 2. Approval Gate

You will see:
```markdown
## ⚠️ CLEANUP PLAN PREVIEW

Files to delete: 3 (6.8 KB)
Exports to remove: 2
Lines to clean: 150

Do you want to proceed? (yes/no):
```

**Cleanup will NOT execute until you type "yes"**

### 3. Validation After Changes

```bash
# Automatic after cleanup
npm run lint   # Check syntax
npm run build  # Verify builds
npm test       # Run tests

# If any fail → Automatic rollback
```

### 4. Multiple Rollback Options

If something goes wrong:

**Option 1: Revert the commit**
```bash
git revert HEAD
```

**Option 2: Restore from backup**
```bash
git checkout backup/before-cleanup-<timestamp>
```

**Option 3: Restore specific files**
```bash
git checkout HEAD~1 -- path/to/file.js
```

---

## Real-World Example

### Scenario: Clean up after Smart Sync analysis

Based on your SYNC_SYSTEMS_ANALYSIS.md and CLAUDE.md findings:

```bash
# Step 1: Detect what's actually unused
/detect-legacy

# Expected findings:
# - src/Test.jsx
# - src/components/AuthContext.jsx (replaced by AuthContextOptimized)
# - src/utils/storage/SupabaseAdapter.js (replaced by Optimized version)
# - src/hooks/useStorage.js
# - Many mobile components (unused variants)

# Step 2: Verify with dependency map
/map-imports

# Check:
# - Is AuthContext truly replaced? (check imports)
# - Is SupabaseAdapter still used anywhere?
# - Which mobile components are actually used?

# Step 3: Start with obvious ones (Phase 1)
/cleanup-legacy legacy-code-report-<timestamp>.md --phase=1

# This removes:
# - src/Test.jsx (clearly a test file)
# - Backup/old/copy files
# - Commented code blocks

# Step 4: Test
npm run dev
# Test authentication, storage, etc.

# Step 5: If good, continue
/cleanup-legacy legacy-code-report-<timestamp>.md --phase=2

# This removes:
# - Replaced versions (AuthContext → AuthContextOptimized)
# - Unused mobile component variants
# - Duplicate code extracted to utilities
```

---

## Understanding the Agents

### 🔍 legacy-code-detector

**Role:** Detective
- Scans for unused code
- Builds evidence (import map)
- Categorizes by confidence
- Generates report

**Model:** Haiku (fast, efficient)
**Tools:** Bash, Glob, Grep, Read, LS

### 🗑️ safe-code-remover

**Role:** Executor
- Creates git backups
- Shows execution plan
- Waits for approval
- Validates changes
- Provides rollback

**Model:** Sonnet (careful, thorough)
**Tools:** Bash, Edit, Read, Write, Grep, Glob, LS

### 🗺️ import-dependency-mapper

**Role:** Analyst
- Maps import relationships
- Identifies patterns
- Visualizes dependencies
- Finds orphans/circles

**Model:** Haiku (fast, efficient)
**Tools:** Bash, Grep, Glob, Read, LS

---

## Common Patterns

### Pattern 1: Replaced Files

**Situation:** Old version and new version both exist

**Example:**
- `AuthContext.jsx` → Replaced by `AuthContextOptimized.jsx`
- `SupabaseAdapter.js` → Replaced by `SupabaseAdapterOptimized.js`

**Detection:**
```markdown
## Medium Confidence - Replaced Files
| Old | New | Old Imports | New Imports |
|-----|-----|-------------|-------------|
| AuthContext.jsx | AuthContextOptimized.jsx | 0 | 23 |
```

**Recommendation:**
1. Verify new version is used
2. Check for any remaining imports to old version
3. Delete old version if zero imports

### Pattern 2: Test/Example Files

**Situation:** Files clearly for testing/examples

**Example:**
- `Test.jsx`
- `Example.jsx`
- `Demo.jsx`

**Detection:**
```markdown
## High Confidence - Test Files
| File | Imports | Usage |
|------|---------|-------|
| Test.jsx | 0 | Never imported |
```

**Recommendation:** Safe to delete immediately

### Pattern 3: Commented Dead Code

**Situation:** Large blocks of commented-out code

**Example:**
```javascript
// Old implementation - replaced 3 months ago
// const oldFunction = () => {
//   // ... 50 lines of commented code
// };
```

**Detection:**
```markdown
## Commented Code Blocks
| File | Lines | Age |
|------|-------|-----|
| App.jsx | 45-78 | 3 months |
```

**Recommendation:** Delete (it's in git history)

### Pattern 4: Unused Exports

**Situation:** Exported but never imported

**Example:**
```javascript
// helpers.js
export const newHelper = () => { ... }  // Used
export const oldHelper = () => { ... }  // Never imported!
```

**Detection:**
```markdown
## Unused Exports
| File | Export | Imported? |
|------|--------|-----------|
| helpers.js | oldHelper | ❌ Never |
```

**Recommendation:** Remove export and function

---

## Best Practices

### DO:

✅ **Start small** - Phase 1 first, then Phase 2
✅ **Test thoroughly** - After each phase
✅ **Review reports** - Don't blindly delete
✅ **Use dry-run** - Preview before executing
✅ **Keep backups** - Don't delete backup branch immediately
✅ **Document** - Note why you deleted something

### DON'T:

❌ **Skip phases** - Don't jump to Phase 3 first
❌ **Ignore warnings** - Low confidence needs review
❌ **Delete hub files** - Check indegree first
❌ **Rush** - Take time to verify
❌ **Skip testing** - Always test after cleanup
❌ **Delete backup** - Keep for at least a week

---

## Troubleshooting

### "Build fails after cleanup"

**Symptom:** `npm run build` errors after deletion

**Solution:**
```bash
# Automatic rollback should happen
# If not, manually rollback:
git revert HEAD

# Or restore from backup:
git checkout backup/before-cleanup-<timestamp>
```

### "File was used but detector missed it"

**Symptom:** Deleted file was actually needed

**Causes:**
- Dynamic import: `import(variableName)`
- String reference in config
- Used in HTML/CSS

**Solution:**
```bash
# Restore specific file
git checkout HEAD~1 -- path/to/file.js

# Or full rollback
git revert HEAD
```

### "Too many files detected"

**Symptom:** Hundreds of files in report

**Solution:**
```bash
# Start with just HIGH confidence
/cleanup-legacy report.md --phase=1

# Or target specific directory
/detect-legacy src/components/
/cleanup-legacy legacy-code-report-<timestamp>.md
```

---

## FAQ

**Q: Will this delete my code without asking?**
A: No! The system shows a plan and waits for you to type "yes" before ANY deletion.

**Q: Can I undo if I make a mistake?**
A: Yes! Multiple rollback options: revert commit, restore from backup, or restore specific files.

**Q: How do I know what's safe to delete?**
A: Follow the confidence levels. Start with HIGH (zero imports) → very safe.

**Q: What if I want to keep a file that's marked as unused?**
A: Don't check it in the report, or skip it during interactive mode.

**Q: Will this break my build?**
A: No! The system runs `npm run build` after changes and rolls back if it fails.

**Q: Can I test the cleanup first?**
A: Yes! Use `--dry-run` to see what would happen without actually deleting.

**Q: What if I delete something important?**
A: Backup branch is created before ANY changes. You can restore from `backup/before-cleanup-<timestamp>`.

---

## Summary

This system gives you **safe, systematic legacy code cleanup** through:

1. **Detection** (`/detect-legacy`) - Find what's unused
2. **Analysis** (`/map-imports`) - Understand dependencies
3. **Cleanup** (`/cleanup-legacy`) - Safely remove with backups

**Key principles:**
- 🔐 Safety first (backups, validation, rollback)
- 📊 Evidence-based (import analysis, confidence levels)
- 🎯 Phased approach (start safe, progress carefully)
- ✅ User control (approval required, interactive mode)

**Start here:**
```bash
/detect-legacy
```

Then review the report and decide what to clean!

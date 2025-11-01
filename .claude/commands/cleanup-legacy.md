---
description: "Safely remove legacy code based on detection report. Creates git backups and provides rollback capability."
argument-hint: "report filename (e.g., legacy-code-report-20250101-120000.md) [options: --phase=1|2|3, --dry-run, --interactive]"
---

# 🗑️ Safe Legacy Code Cleanup

**Report File:** $ARGUMENTS

## ⚠️ IMPORTANT SAFETY NOTICE

This command will **DELETE FILES and REMOVE CODE** based on the report.

Before proceeding, this command will:

1. ✅ Create a git backup branch
2. ✅ Show exactly what will be deleted
3. ✅ Request your explicit approval
4. ✅ Validate after each change
5. ✅ Provide rollback instructions

---

## Cleanup Phases

### Phase 1: High Confidence (Safest)
- Delete files with zero imports
- Remove unused exports
- Clean commented code blocks

**Risk Level:** ⬇️ Very Low

### Phase 2: Medium Confidence (Review Needed)
- Remove superseded files
- Consolidate duplicate code
- Extract shared utilities

**Risk Level:** ⚠️ Medium (requires testing)

### Phase 3: Low Confidence (Manual Review)
- Investigate potential orphans
- Fix circular dependencies
- Address technical debt

**Risk Level:** ⚠️ High (requires careful review)

---

## Options

### `--phase=1` (Recommended)
Execute only Phase 1 (high confidence) items.
Safest approach for first cleanup.

Example: `/cleanup-legacy report.md --phase=1`

### `--dry-run`
Show what WOULD be deleted without actually deleting.
Perfect for preview.

Example: `/cleanup-legacy report.md --dry-run`

### `--interactive`
Prompt before each deletion.
More control over the process.

Example: `/cleanup-legacy report.md --interactive`

---

## What This Command Does

### Pre-Flight Safety Checks

```bash
# 1. Verify git is clean
git status

# 2. Create backup branch
git checkout -b backup/before-cleanup-<timestamp>
git commit -m "Backup before cleanup"

# 3. Create working branch
git checkout -b cleanup/legacy-code-<timestamp>
```

### Execution Steps

1. **Parse Report**
   - Extract files marked for deletion
   - Identify exports to remove
   - Find code blocks to clean

2. **Validate Each Item**
   - Final import check
   - Verify no dynamic imports
   - Check configuration files

3. **Execute Changes**
   - Delete unused files
   - Remove unused exports
   - Clean commented code

4. **Run Tests**
   - `npm run lint`
   - `npm run build`
   - `npm test` (if available)

5. **Commit Changes**
   - Detailed commit message
   - Include report reference
   - Show diff stats

### Error Handling

If anything fails:
- ❌ Stop immediately
- 🔄 Rollback changes
- 📋 Show error details
- 💡 Provide next steps

---

## Example Workflow

### Recommended Approach

```bash
# Step 1: Detect legacy code
/detect-legacy

# Step 2: Review the report
# (Open legacy-code-report-<timestamp>.md)

# Step 3: Start with Phase 1 (safest)
/cleanup-legacy legacy-code-report-<timestamp>.md --phase=1

# Step 4: Test your application
# Verify everything works

# Step 5: Continue with Phase 2 if confident
/cleanup-legacy legacy-code-report-<timestamp>.md --phase=2
```

### Preview First

```bash
# See what would happen without changes
/cleanup-legacy legacy-code-report-<timestamp>.md --dry-run
```

---

## Rollback Instructions

If something goes wrong after cleanup:

### Option 1: Revert the Commit
```bash
git revert HEAD
```

### Option 2: Restore from Backup
```bash
git checkout backup/before-cleanup-<timestamp>
git checkout -b main-restored
```

### Option 3: Restore Specific Files
```bash
git checkout HEAD~1 -- path/to/file.js
```

---

## Safety Confirmation

Before ANY deletion, you will see:

```markdown
# ⚠️ CLEANUP PLAN PREVIEW

## Files to be Deleted (3 items)
- src/Test.jsx (2.1 KB)
- src/utils/old-helper.js (1.5 KB)
- src/components/Demo.jsx (3.2 KB)

## Exports to be Removed (2 items)
- src/utils/helpers.js: oldCalculate() at line 45

## Code Blocks to Clean (1 item)
- src/App.jsx: Lines 45-78 (commented routing logic)

Total Impact:
- Files deleted: 3 (6.8 KB)
- Lines removed: ~150
- Build: Will run after cleanup
- Tests: Will run after cleanup

Git Backup: backup/before-cleanup-20250101-120000

───────────────────────────────────────

Do you want to proceed? (yes/no):
```

**Cleanup will NOT execute until you type "yes"**

---

## Post-Cleanup Report

After successful cleanup, you'll receive:

```markdown
# ✅ Legacy Code Cleanup Complete

## Summary
- Files Deleted: 3 (6.8 KB)
- Exports Removed: 2
- Lines Cleaned: 150
- Build Status: ✅ Passing
- Tests Status: ✅ All passed

## Git Information
Current branch: cleanup/legacy-code-20250101-120000
Backup branch: backup/before-cleanup-20250101-120000

Commit: abc123def

## Next Steps
1. Test your application thoroughly
2. When confident, merge to main
3. Delete backup branch after 1 week

## Rollback Command
git revert HEAD  # if needed
```

---

## 🔐 Safety Guarantees

This command will:

✅ NEVER delete without showing plan first
✅ NEVER skip git backup creation
✅ NEVER continue if build fails
✅ ALWAYS provide rollback instructions
✅ ALWAYS validate before and after
✅ ALWAYS log all actions

---

## Starting Cleanup Process

Using @safe-code-remover to execute cleanup based on report:

**Report:** $ARGUMENTS

The remover will:
1. Parse the detection report
2. Create git safety backups
3. Show detailed execution plan
4. Wait for your EXPLICIT approval
5. Execute phase-by-phase
6. Validate after each change
7. Commit with full documentation
8. Provide rollback instructions

**NOTE:** No files will be modified until you approve the plan.

@safe-code-remover

Please execute safe cleanup based on the detection report: $ARGUMENTS

Options to respect:
- If --dry-run: Show plan only, don't execute
- If --phase=N: Execute only specified phase
- If --interactive: Prompt before each deletion

Always:
- Create backup branch first
- Show execution plan
- Wait for user approval
- Validate after changes
- Provide rollback instructions

---
description: "Clean up directory based on a detection report file"
argument-hint: "report filename (e.g., directory-report-20251031-211530.md)"
---

# Directory Cleanup Using Report

**Report File:** $ARGUMENTS

## Validation

1. ✅ Check if report file exists
2. ✅ Read report structure
3. ✅ Extract cleanup items marked with [x] checkboxes
4. ✅ Calculate total impact (files to delete, space to recover)

## Safety Checks

Before proceeding, confirm:
- [ ] Report has been reviewed
- [ ] You understand what will be deleted
- [ ] Git branch created for rollback
- [ ] Backup of important files exists

## Cleanup Plan Preview

From report $ARGUMENTS, these actions will be performed:

1. **Delete folders** (marked in report)
2. **Move files** to correct locations
3. **Consolidate** duplicate directories
4. **Extract** duplicate code to shared utilities
5. **Commit** changes to git with message: "chore: cleanup directory structure per report"

---

## ⚠️ FINAL CONFIRMATION

Before cleanup begins, this command will show:
- Exact files/folders to be deleted
- Where files will be moved
- Total space to be recovered
- Git rollback instructions

**CLEANUP WILL NOT EXECUTE UNTIL YOU EXPLICITLY APPROVE**

---

## Starting Cleanup Process

Using @directory-cleaner to execute cleanup based on $ARGUMENTS report...

The cleaner will:
1. Parse the report file
2. Show detailed cleanup plan
3. Wait for your approval
4. Execute changes only after confirmation
5. Commit to git with full history

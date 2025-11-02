# Legacy Code Cleanup Checklist - Real Statistics Implementation

**Created**: 2025-11-02
**Principle**: Clean files only - NO legacy code survives
**Status**: Pre-Implementation Checklist

---

## Philosophy

**Zero Tolerance for Legacy Code**:
- ❌ No `.backup` files
- ❌ No `.old` files
- ❌ No commented-out code
- ❌ No "archived" directories
- ✅ Delete permanently
- ✅ Git history is the archive

**Why**: Legacy code creates confusion, maintenance burden, and technical debt. If we need old code, we use `git history`.

---

## Files to DELETE (Not Archive)

### Phase 3: Frontend Integration Cleanup

#### 1. Synthetic Activity Generator
- **File**: `src/utils/activityData.js`
- **Action**: DELETE PERMANENTLY
- **Command**: `rm src/utils/activityData.js`
- **Verification**: `test ! -f src/utils/activityData.js`

#### 2. Unused Statistics Utilities (If Present)
- **Files**:
  - `src/utils/documentStats.js` (if exists)
  - `src/utils/syntheticStats.js` (if exists)
  - `src/utils/fakeData.js` (if exists)
- **Action**: DELETE if present
- **Command**: `find src/utils -name "*Stats.js" -o -name "*fake*.js" | xargs rm -f`

#### 3. Backup Files (Created During Development)
- **Pattern**: `*.backup`, `*.old`, `*~`, `*.bak`
- **Action**: DELETE ALL
- **Command**: `find src/ -name "*.backup" -o -name "*.old" -o -name "*~" -o -name "*.bak" | xargs rm -f`

#### 4. Documentation of Old System
- **File**: `DASHBOARD_STATISTICS_SOURCE_ANALYSIS.md`
- **Action**: DELETE or mark as deprecated
- **Command**: `rm DASHBOARD_STATISTICS_SOURCE_ANALYSIS.md`
- **Alternative**: Rename to `.deprecated` and add warning

### Post-Implementation Cleanup

#### 5. Unused Imports (Automated)
```bash
# Use ESLint to find unused imports
npm run lint -- --fix

# Or use a dedicated tool
npx eslint src/ --fix
```

#### 6. Dead Code Detection
```bash
# Find unused exports
npx ts-prune

# Find unused functions
npx unimported
```

---

## Code Changes Required

### EntryCardRedesigned.jsx

**REMOVE** (Lines ~7):
```javascript
import { generateActivityData } from '../utils/activityData';
```

**REMOVE** (Lines ~72-83 - Old implementation):
```javascript
const activityData = useMemo(() => {
  const fullData = generateActivityData(entry);  // DELETE THIS
  return fullData.slice(-20);
}, [entry.id, entry.updatedAt, entry.createdAt]);
```

**REPLACE WITH** (New implementation):
```javascript
const activityData = useMemo(() => {
  if (!entry.recentActivity || entry.recentActivity.length === 0) {
    return Array(20).fill(0);
  }

  // Real activity grouping by week
  const weeks = 20;
  const weekCounts = new Array(weeks).fill(0);
  const now = new Date();

  entry.recentActivity.forEach(activity => {
    const activityDate = new Date(activity.ts);
    const weeksSince = Math.floor((now - activityDate) / (1000 * 60 * 60 * 24 * 7));
    if (weeksSince >= 0 && weeksSince < weeks) {
      weekCounts[weeks - 1 - weeksSince]++;
    }
  });

  const maxCount = Math.max(...weekCounts, 1);
  return weekCounts.map(count => {
    const percentage = (count / maxCount) * 100;
    return Math.max(5, Math.min(95, percentage));
  });
}, [entry.recentActivity]);
```

---

## Verification Commands

### Pre-Cleanup Scan
```bash
# List all files that will be deleted
echo "=== Files to DELETE ==="
test -f src/utils/activityData.js && echo "- src/utils/activityData.js"
find src/utils -name "*Stats.js" 2>/dev/null
find src/ -name "*.backup" -o -name "*.old" -o -name "*~" -o -name "*.bak"
test -f DASHBOARD_STATISTICS_SOURCE_ANALYSIS.md && echo "- DASHBOARD_STATISTICS_SOURCE_ANALYSIS.md"

# Count legacy references
echo "=== Legacy Code References ==="
echo "generateActivityData: $(grep -r "generateActivityData" src/ | wc -l) references"
echo "activityData.js: $(grep -r "activityData.js" src/ | wc -l) imports"
```

### Execute Cleanup
```bash
#!/bin/bash
# cleanup-legacy-statistics.sh

set -e  # Exit on error

echo "🧹 Starting Legacy Code Cleanup..."

# 1. Delete synthetic activity generator
if [ -f src/utils/activityData.js ]; then
  rm src/utils/activityData.js
  echo "✓ Deleted src/utils/activityData.js"
fi

# 2. Delete unused statistics utilities
find src/utils -name "*Stats.js" -o -name "*fake*.js" 2>/dev/null | while read file; do
  rm "$file"
  echo "✓ Deleted $file"
done

# 3. Delete backup files
find src/ \( -name "*.backup" -o -name "*.old" -o -name "*~" -o -name "*.bak" \) -delete
echo "✓ Deleted backup files"

# 4. Handle documentation
if [ -f DASHBOARD_STATISTICS_SOURCE_ANALYSIS.md ]; then
  rm DASHBOARD_STATISTICS_SOURCE_ANALYSIS.md
  echo "✓ Deleted DASHBOARD_STATISTICS_SOURCE_ANALYSIS.md"
fi

# 5. Run linter to remove unused imports
npm run lint -- --fix 2>/dev/null || true
echo "✓ Ran ESLint auto-fix"

echo "✅ Legacy Code Cleanup Complete!"
```

### Post-Cleanup Verification
```bash
#!/bin/bash
# verify-cleanup.sh

set -e

echo "🔍 Verifying Legacy Code Removal..."

FAILED=0

# Check files don't exist
if [ -f src/utils/activityData.js ]; then
  echo "❌ FAIL: src/utils/activityData.js still exists"
  FAILED=1
else
  echo "✓ src/utils/activityData.js deleted"
fi

# Check no backup files
BACKUPS=$(find src/ -name "*.backup" -o -name "*.old" -o -name "*~" -o -name "*.bak" | wc -l)
if [ "$BACKUPS" -gt 0 ]; then
  echo "❌ FAIL: Found $BACKUPS backup files"
  find src/ -name "*.backup" -o -name "*.old" -o -name "*~" -o -name "*.bak"
  FAILED=1
else
  echo "✓ No backup files found"
fi

# Check no legacy references
REFS=$(grep -r "generateActivityData" src/ 2>/dev/null | wc -l)
if [ "$REFS" -gt 0 ]; then
  echo "❌ FAIL: Found $REFS references to generateActivityData"
  grep -r "generateActivityData" src/
  FAILED=1
else
  echo "✓ No references to generateActivityData"
fi

IMPORTS=$(grep -r "activityData.js" src/ 2>/dev/null | wc -l)
if [ "$IMPORTS" -gt 0 ]; then
  echo "❌ FAIL: Found $IMPORTS imports of activityData.js"
  grep -r "activityData.js" src/
  FAILED=1
else
  echo "✓ No imports of activityData.js"
fi

if [ $FAILED -eq 0 ]; then
  echo "✅ All Cleanup Verifications PASSED"
  exit 0
else
  echo "❌ Cleanup Verification FAILED"
  exit 1
fi
```

---

## CI/CD Integration

### Pre-Commit Hook
```bash
#!/bin/bash
# .git/hooks/pre-commit

# Prevent commits with legacy patterns
if git diff --cached --name-only | grep -E '\.(backup|old|bak)$'; then
  echo "❌ ERROR: Attempting to commit backup files"
  echo "Remove .backup, .old, or .bak files before committing"
  exit 1
fi

if git diff --cached | grep -E "generateActivityData|activityData\.js"; then
  echo "❌ ERROR: Attempting to commit legacy statistics code"
  echo "Legacy code detected. Use real audit system instead."
  exit 1
fi

echo "✓ No legacy code detected"
```

### GitHub Actions Workflow
```yaml
name: Legacy Code Detection

on: [push, pull_request]

jobs:
  detect-legacy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Check for backup files
        run: |
          if find src/ -name "*.backup" -o -name "*.old" -o -name "*.bak" | grep .; then
            echo "ERROR: Backup files found"
            exit 1
          fi

      - name: Check for legacy statistics code
        run: |
          if grep -r "generateActivityData" src/; then
            echo "ERROR: Legacy statistics function found"
            exit 1
          fi
          if grep -r "activityData.js" src/; then
            echo "ERROR: Legacy statistics import found"
            exit 1
          fi

      - name: Success
        run: echo "✓ No legacy code detected"
```

---

## Final Checklist

Before marking Phase 3 as complete:

- [ ] ✅ `src/utils/activityData.js` deleted
- [ ] ✅ No references to `generateActivityData` in codebase
- [ ] ✅ No imports of `activityData.js` in codebase
- [ ] ✅ All `.backup`, `.old`, `~`, `.bak` files deleted
- [ ] ✅ ESLint shows no unused imports
- [ ] ✅ TypeScript compiles without errors
- [ ] ✅ All tests pass
- [ ] ✅ `verify-cleanup.sh` passes
- [ ] ✅ Pre-commit hook installed
- [ ] ✅ Git history shows deletions (not renames)
- [ ] ✅ No "TODO: remove legacy code" comments remain

---

## Rollback Considerations

**If we need to rollback the audit system**, we:
1. Run the rollback migration (drops audit schema)
2. Revert frontend changes via `git revert`
3. **DO NOT** restore legacy files from backup
4. If absolutely needed, restore from git history: `git show COMMIT:src/utils/activityData.js > src/utils/activityData.js`

**Why**: Git history is the archive. We don't keep dead code in the working directory.

---

## Documentation Updates

After cleanup, update:

1. **README.md**: Remove any references to synthetic statistics
2. **ARCHITECTURE.md**: Document audit system, remove old system
3. **CHANGELOG.md**: Add entry about replacing synthetic with real statistics
4. **This file**: Mark as COMPLETE and move to archive folder

---

## Success Definition

**Clean codebase verified by**:
```bash
# Zero legacy files
find src/ -name "*.backup" -o -name "*.old" -o -name "*.bak" | wc -l
# Expected: 0

# Zero legacy references
grep -r "generateActivityData\|activityData\.js" src/ | wc -l
# Expected: 0

# Clean git status
git status --short | grep -E '\.(backup|old|bak)$' | wc -l
# Expected: 0
```

When all three return `0`, cleanup is complete. ✅

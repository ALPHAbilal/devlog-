# Dashboard Display Timing and Logic Analysis

**Date**: 2025-10-26
**Context**: Investigation into when and why folders/documents appear in the dashboard
**Question**: Is display timing-based or condition-based?

## Executive Summary

**Answer: The dashboard display is CONDITION-BASED, with TIMING-DEPENDENT race condition handling.**

- **Primary Logic**: Items appear based on `folder_id` and `parent_id` properties (condition-based)
- **Secondary Factor**: Race condition between folder/document loading affects initial display (timing-dependent)
- **Mitigation**: Re-combine effect (lines 503-547) fixes display when folders load after documents

---

## Key Findings

### 1. Display Is Condition-Based

Items appear in the dashboard grid based on **specific field checks**, not timing:

**Root Folders Display When**:
- `parent_id === null` or `parent_id === undefined` (no parent folder)
- Has `type: 'folder'` field added during combination

**Root Documents Display When**:
- `folder_id === null` or `folder_id === undefined` (not in any folder)
- Has `type: 'document'` field added during combination

**Additional Filters Applied**:
- Project filter (selectedProjectId)
- Search filter (searchTerm)
- Tag filter (selectedTags)

### 2. Race Condition Affects Initial Display (Timing)

**The Problem**: Folders and documents load in parallel via separate async operations:

```javascript
// Operation A: useFolders hook (src/hooks/useFolders.js)
// - Loads from 'folders' table
// - Builds hierarchical tree structure
// - Uses 30-second cache

// Operation B: loadEntries() function (Dashboard.jsx:342-501)
// - Loads from storageWrapper.getEntries()
// - Returns flat document array
// - Merges with session cache
```

**Race Scenarios**:

| Scenario | Result | Display State |
|----------|--------|---------------|
| Documents load FIRST | `folders` is still `[]` | Grid shows only documents, NO folders |
| Folders load FIRST | `folders` has data | Grid shows folders + documents correctly |
| Both load together | Unpredictable | Depends on network/DB speed |

**Re-Combine Effect (Lines 503-547)** acts as safety net:
- Triggers when folders finish loading after documents
- Re-combines folders + documents into entries state
- Has guards to prevent duplicates

---

## Data Flow Architecture

### Dual-State Pattern

The Dashboard uses **two separate document states**:

```javascript
// STATE 1: All documents (for sidebar)
const [allDocuments, setAllDocuments] = useState([]);

// STATE 2: Root-level items only (for grid)
const [entries, setEntries] = useState([]);
```

**Why Two States?**

| State | Purpose | Filter | Consumer |
|-------|---------|--------|----------|
| `allDocuments` | Complete document list for sidebar navigation | None (all docs) | ProjectExplorerV2 sidebar |
| `entries` | Root-level items for main grid | `!folder_id` and `!parent_id` | DocumentGridRedesigned |

### State Update Sequence

```
MOUNT
  │
  ├─→ useFolders useEffect (line 400)
  │     ↓
  │   loadFolders() [async]
  │     ↓
  │   setFolders(rootFolders)
  │
  └─→ loadEntries useEffect (line 549)
        ↓
      loadEntries() [async]
        ↓
      storageWrapper.init()
        ↓
      storageWrapper.getEntries()
        ↓
      setAllDocuments(mergedEntries) ← ALL DOCS FOR SIDEBAR
        ↓
      Combine with folders (line 405)
        ↓
      setEntries(combined) ← ROOT ITEMS FOR DASHBOARD

RACE WINNER: (Either completes first)
  ↓
  Partial data displayed

RACE LOSER: (Completes second)
  ↓
  Re-combine effect triggers (line 503)
  ↓
  setEntries(combined) ← COMPLETE DATA
  ↓
  Display updates correctly
```

---

## Code Analysis

### Initial Combination (Lines 403-422)

```javascript
const loadEntries = useCallback(async () => {
  // ... load documents ...

  // Store ALL documents for sidebar
  setAllDocuments(mergedEntries);  // Line 401

  // Get root folders (no parent_id)
  const rootFolders = (folders || [])
    .filter(folder => !folder.parent_id)  // ← CONDITION CHECK
    .map(folder => ({
      ...folder,
      type: 'folder',
      items: folder.children || []
    }));

  // Get root documents (no folder_id)
  const rootDocuments = mergedEntries
    .filter(doc => !doc.folder_id)  // ← CONDITION CHECK
    .map(doc => ({ ...doc, type: 'document' }));

  // Combine for grid display
  const combined = [...rootFolders, ...rootDocuments]
    .sort((a, b) => (a.position || 0) - (b.position || 0));

  setEntries(combined);  // Line 422
}, []);
```

**Critical Line 405**: `const rootFolders = (folders || [])`
- References `folders` from useFolders hook
- If folders haven't loaded yet, this is `[]`
- Result: No folders in initial entries state

### Re-Combine Effect (Lines 503-547)

```javascript
useEffect(() => {
  // Guard 1: Wait for data
  if (!folders || folders.length === 0 || allDocuments.length === 0) {
    console.log(`[DEBUG-DASHBOARD] Skipping re-combine`);
    return;
  }

  // Guard 2: Prevent duplicates
  const hasFolders = entries.some(e => e.type === 'folder');
  if (hasFolders) {
    console.log(`[DEBUG-DASHBOARD] Skipping re-combine: Already have folders`);
    return;
  }

  console.log(`[DEBUG-DASHBOARD] Re-combining: ${folders.length} folders with ${allDocuments.length} documents`);

  // Same combination logic as initial load
  const rootFolders = folders
    .filter(f => !f.parent_id)
    .map(f => ({ ...f, type: 'folder', items: f.children || [] }));

  const rootDocs = allDocuments
    .filter(doc => !doc.folder_id)
    .map(doc => ({ ...doc, type: 'document' }));

  const combined = [...rootFolders, ...rootDocs]
    .sort((a, b) => (a.position || 0) - (b.position || 0));

  setEntries(combined);  // Line 546 - Triggers re-render
}, [folders, allDocuments, isLoading]);
```

**Dependencies**: `[folders, allDocuments, isLoading]`
- Triggers when folders finish loading
- Triggers when allDocuments updates
- Triggers when isLoading changes

### Filtering Logic (Lines 957-1041)

```javascript
const filteredEntries = useMemo(() => {
  const filtered = entries.filter(entry => {
    // FILTER 1: Project Filter
    const matchesProject =
      selectedProjectId === null ||
      (selectedProjectId === 'uncategorized' && !entry.project_id) ||
      entry.project_id === selectedProjectId;

    // FILTER 2: Search Filter
    const matchesSearch = searchTerm === '' || (() => {
      const displayName = entry.title || entry.name || '';
      const titleMatch = displayName.toLowerCase().includes(lowerSearchTerm);

      // Folders only match by name, not by tags/preview/content
      const previewMatch = entry.preview?.toLowerCase().includes(lowerSearchTerm);
      const tagsMatch = entry.tags?.some(tag => tag?.toLowerCase().includes(lowerSearchTerm));
      const contentMatch = entry.blocks && getFullBlockText(entry).toLowerCase().includes(lowerSearchTerm);

      return titleMatch || previewMatch || tagsMatch || contentMatch;
    })();

    // FILTER 3: Tag Filter
    const matchesTags = selectedTags.length === 0 ||
      selectedTags.every(tag => entry.tags?.includes(tag));

    return matchesProject && matchesSearch && matchesTags;
  });

  console.log('[DEBUG-DASHBOARD] Filtered results:', {
    totalEntries: entries.length,
    filtered: filtered.length,
    folders: filtered.filter(e => e.type === 'folder').length,
    documents: filtered.filter(e => e.type === 'document').length
  });

  return filtered;
}, [entries, selectedProjectId, searchTerm, selectedTags]);
```

**Important**: NO TYPE-BASED FILTERING
- Folders and documents treated equally by filters
- Both can pass through to display
- Folders only match by name, not by tags/preview/content

---

## Why Folders May Not Appear

### Reason 1: Race Condition (TIMING)

**Symptom**: Folders missing on initial load but appear after refresh

**Cause**: Documents loaded before folders finished loading
- Line 405 in loadEntries() references `folders` variable
- If folders not loaded yet, `folders` is `[]`
- Result: `rootFolders` is `[]`, no folders in entries

**Fix**: Re-combine effect triggers when folders finish loading

### Reason 2: Folder Has parent_id (CONDITION)

**Symptom**: Some folders never appear in dashboard

**Cause**: Folder is nested (has parent_id)
- Line 406: `.filter(folder => !folder.parent_id)`
- Only root folders pass this check
- Nested folders only appear in sidebar tree

**Expected Behavior**: Dashboard shows only root-level items

### Reason 3: Search Filters Out Folders (CONDITION)

**Symptom**: Folders disappear when searching

**Cause**: Folders only match by name, not by tags/preview/content
- User searches for tag → folder doesn't have tags → filtered out
- User searches for content → folder doesn't have blocks → filtered out

**Expected Behavior**: Folders only searchable by name

### Reason 4: Project Filter (CONDITION)

**Symptom**: Folders missing when project selected

**Cause**: Folders may not have project_id field
- Line 962: Checks `entry.project_id === selectedProjectId`
- If folder doesn't have project_id, it won't match

**Potential Issue**: Folders might not be associated with projects

---

## Debugging Checklist

When folders don't appear, check:

### 1. Check Browser Console

Look for these debug logs:
```
[DEBUG-DASHBOARD] Combined X folders with Y documents
[DEBUG-DASHBOARD] Sample items: { firstFolder: ..., firstDoc: ..., totalItems: Z }
[DEBUG-DASHBOARD] Filtered results: { totalEntries: A, filtered: B, folders: C, documents: D }
```

**What to look for**:
- Is `folders` count > 0 in "Combined" log?
- Is `folders` count > 0 in "Filtered results" log?
- If Combined shows folders but Filtered doesn't → filter is removing them
- If Combined shows 0 folders → race condition or no root folders exist

### 2. Check useFolders Hook

In React DevTools:
- Find Dashboard component
- Check `folders` state value
- Verify folders array is not empty
- Verify folders have `parent_id: null`

### 3. Check Database

In Supabase:
```sql
-- Check if root folders exist
SELECT id, name, parent_id, created_at
FROM folders
WHERE user_id = 'YOUR_USER_ID'
  AND parent_id IS NULL;
```

### 4. Check Timing

Add debug log to loadEntries (line 405):
```javascript
console.log('[DEBUG] Combining at line 405:', {
  foldersState: folders,
  foldersLength: folders?.length || 0,
  documentsLength: mergedEntries.length
});
```

If folders is `[]` or `undefined`, race condition is active.

### 5. Check Re-Combine Effect

Add debug log to useEffect (line 503):
```javascript
useEffect(() => {
  console.log('[DEBUG] Re-combine effect triggered:', {
    folders: folders?.length || 0,
    allDocuments: allDocuments.length,
    entries: entries.length,
    hasFolders: entries.some(e => e.type === 'folder')
  });
  // ... rest of effect
}, [folders, allDocuments, isLoading]);
```

Watch for this log firing when folders finish loading.

---

## Recommendations

### 1. Add Loading States

Current code uses single `isLoading` for both folders and documents. Consider:

```javascript
const [foldersLoading, setFoldersLoading] = useState(true);
const [documentsLoading, setDocumentsLoading] = useState(true);
```

This would allow better control over when to combine.

### 2. Simplify Combination Logic

Instead of combining in two places (initial load + re-combine effect), create single source:

```javascript
useEffect(() => {
  if (foldersLoading || documentsLoading) return;

  // Combine folders + documents
  const combined = combineEntriesHelper(folders, allDocuments);
  setEntries(combined);
}, [folders, allDocuments, foldersLoading, documentsLoading]);
```

### 3. Add Folder-Project Association

If folders should be project-specific, add `project_id` to folders table and UI.

### 4. Improve Search UX for Folders

Consider adding metadata to folders (tags, description) to make them more searchable.

---

## Conclusion

**Is display timing-based or condition-based?**

**Answer**: **BOTH**, but primarily condition-based:

1. **Condition-Based (Primary)**:
   - Items must have `!folder_id` (documents) or `!parent_id` (folders)
   - Must pass project/search/tag filters
   - These are the fundamental display rules

2. **Timing-Dependent (Secondary)**:
   - Race condition between folder/document loading affects initial display
   - If folders load after documents, brief period with no folders shown
   - Re-combine effect fixes this after short delay

**Summary**: The display logic is deterministic (condition-based), but the user experience can be affected by loading timing until the re-combine effect completes.

---

## Files Referenced

- **Dashboard.jsx** (src/pages/Dashboard.jsx)
  - Lines 54-55: State declarations
  - Lines 342-501: loadEntries function
  - Lines 503-547: Re-combine effect
  - Lines 549-558: Initial load effect
  - Lines 957-1041: Filtering logic

- **useFolders.js** (src/hooks/useFolders.js)
  - Lines 7-9: Cache configuration
  - Lines 32-36: Cache check
  - Lines 48-55: Supabase query
  - Lines 108-133: Tree building
  - Lines 400-417: Auto-load effect

- **DocumentGridRedesigned.jsx** (src/components/DocumentGridRedesigned.jsx)
  - Renders folders and documents from filteredEntries

- **ProjectExplorerV2.jsx** (src/components/ProjectExplorer/ProjectExplorerV2.jsx)
  - Uses allDocuments for sidebar display

---

## Change Log

- **2025-10-26**: Initial analysis based on current codebase state
- Identified race condition and re-combine effect
- Documented filtering logic and display conditions

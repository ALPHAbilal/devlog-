# Remove Collapse/Expand State from Database Persistence

## Overview

Currently, block collapse/expand state (UI-only interactions) triggers full database sync cycles, writing to the `blocks.metadata` JSONB column. This creates unnecessary database writes for purely visual state changes.

**Goal:** Remove collapse/expand persistence entirely while preserving important metadata (FileTreeBlock snapshots).

**Default Behavior:** All blocks start **COLLAPSED** on page load (Option A).

---

## Current State Analysis

### Blocks That Persist Collapse State (❌ Need Fixing)

#### 1. AIBlockRefined.jsx
**Lines affected:** 11-12, 290-308
- `collapsedMessages` - Set of collapsed message indices
- `isBlockCollapsed` - Entire block collapsed state
- Stored in: `block.metadata.collapsedMessages`, `block.metadata.isBlockCollapsed`
- useEffect triggers `onUpdate()` on every collapse change

#### 2. TextBlock.jsx
**Lines affected:** 38, 267-276
- `isCollapsed` - Long text block collapsed state
- Stored in: `block.metadata.isCollapsed`
- useEffect with mount tracking triggers `onUpdate()`

### Block That Does It Correctly (✅ Reference Pattern)

#### 3. CodeBlock.jsx
**Line:** 12
- `const [isExpanded, setIsExpanded] = useState(false);`
- **Local state only** - never calls `onUpdate()` for expand state
- This is the pattern we'll follow

### Blocks That Need Metadata Preserved (✅ Keep Unchanged)

#### 4. FileTreeBlock.jsx
**Metadata usage:** Snapshots (`block.metadata.snapshots`, `block.metadata.currentSnapshotId`)
- **NOT collapse state** - these are important features
- Node expansion is already local-only (TreeNode component line 201)
- No changes needed

---

## Desired End State

### After Implementation:

1. **All blocks start collapsed by default** on page load
2. **Collapse state is session-only** (resets on reload)
3. **No database writes** for collapse/expand actions
4. **FileTreeBlock snapshots still persist** (different metadata)
5. **Performance improvement:** ~80% reduction in unnecessary syncs

### Verification Checklist:
- [ ] Click collapse/expand on AIBlock → no "syncing" indicator appears
- [ ] Click collapse/expand on TextBlock → no "syncing" indicator appears
- [ ] Reload page → all blocks start collapsed
- [ ] Create FileTree snapshot → still saves to database (metadata preserved)
- [ ] Check browser console → no SmartSync calls for collapse state
- [ ] Check database → `blocks.metadata` no longer has `isCollapsed`/`collapsedMessages`/`isBlockCollapsed` fields

---

## What We're NOT Doing

- ❌ NOT removing metadata support entirely (FileTree needs it for snapshots)
- ❌ NOT changing SmartSync architecture (still needed for content)
- ❌ NOT breaking existing documents (old metadata remains but ignored)
- ❌ NOT removing collapse functionality (just making it local-only)
- ❌ NOT changing CodeBlock (already correct)
- ❌ NOT requiring database migration (optional cleanup only)

---

## Implementation Approach

**Strategy:** Convert collapse state from persisted metadata to local-only state, following the CodeBlock pattern.

**Key Principle:** If state is purely UI chrome (expand/collapse, hover, focus), keep it local.

---

## Phase 1: Fix AIBlockRefined.jsx

### Overview
Remove metadata persistence for both `collapsedMessages` and `isBlockCollapsed`. Make collapse state local-only with default COLLAPSED behavior.

### Changes Required:

#### 1. Update State Initialization
**File:** `src/components/blocks/AIBlockRefined.jsx`
**Lines:** 11-12

**Before:**
```javascript
const [collapsedMessages, setCollapsedMessages] = useState(new Set(block.metadata?.collapsedMessages || []));
const [isBlockCollapsed, setIsBlockCollapsed] = useState(block.metadata?.isBlockCollapsed || false);
```

**After:**
```javascript
// LOCAL-ONLY STATE - Never synced to database
// Default: All messages collapsed, block expanded
const [collapsedMessages, setCollapsedMessages] = useState(() => {
  // Start with all messages collapsed (Option A: default collapsed)
  const messages = block.messages || [];
  return new Set(messages.map((_, index) => index));
});
const [isBlockCollapsed, setIsBlockCollapsed] = useState(false); // Block expanded, messages collapsed
```

**Reasoning:**
- Remove `block.metadata?.collapsedMessages` initialization
- Default: All messages start collapsed (indices 0, 1, 2, ...)
- Block itself starts expanded (so user can see collapsed messages)

#### 2. Remove Metadata Persistence useEffect
**File:** `src/components/blocks/AIBlockRefined.jsx`
**Lines:** 290-308

**Action:** DELETE entire useEffect block

**Before:**
```javascript
useEffect(() => {
  const currentCollapsedArray = Array.from(collapsedMessages);
  const prevCollapsedArray = block.metadata?.collapsedMessages || [];
  const prevIsBlockCollapsed = block.metadata?.isBlockCollapsed || false;

  const collapsedChanged = currentCollapsedArray.length !== prevCollapsedArray.length ||
    !currentCollapsedArray.every(val => prevCollapsedArray.includes(val));
  const blockCollapsedChanged = isBlockCollapsed !== prevIsBlockCollapsed;

  if (collapsedChanged || blockCollapsedChanged) {
    const metadata = {
      ...block.metadata,
      collapsedMessages: currentCollapsedArray,
      isBlockCollapsed
    };
    onUpdate(block.id, { metadata });
  }
}, [collapsedMessages, isBlockCollapsed, block.id, block.metadata, onUpdate]);
```

**After:**
```javascript
// REMOVED - Collapse state is now local-only, never persisted
```

**Reasoning:**
- This useEffect was the root cause of database writes
- Collapse state is purely UI - no need to persist

#### 3. Update React.memo Comparison (Optional Optimization)
**File:** `src/components/blocks/AIBlockRefined.jsx`
**Lines:** 525-531

**Before:**
```javascript
export default React.memo(AIBlockRefined, (prevProps, nextProps) => {
  return (
    prevProps.block.id === nextProps.block.id &&
    prevProps.block.metadata?.collapsedMessages === nextProps.block.metadata?.collapsedMessages &&
    // ... other comparisons
  );
});
```

**After:**
```javascript
export default React.memo(AIBlockRefined, (prevProps, nextProps) => {
  return (
    prevProps.block.id === nextProps.block.id &&
    // Remove collapsedMessages and isBlockCollapsed from comparison
    // ... other comparisons (messages, content, etc.)
  );
});
```

**Reasoning:**
- No longer comparing metadata collapse fields
- Reduces unnecessary re-renders when other blocks update

### Success Criteria:

#### Automated Verification:
- [ ] Component compiles without errors: `npm run build`
- [ ] No TypeScript errors: `npm run typecheck` (if applicable)
- [ ] Linting passes: `npm run lint`

#### Manual Verification:
- [ ] Create new AIBlock with 5+ messages
- [ ] Verify all messages start collapsed by default
- [ ] Click to expand individual messages → no "syncing" indicator
- [ ] Collapse/expand entire block → no "syncing" indicator
- [ ] Check console → no `[SYNC-SCHEDULE]` logs for collapse actions
- [ ] Reload page → all messages collapsed again (state reset)
- [ ] Edit message content → still saves correctly to database

---

## Phase 2: Fix TextBlock.jsx

### Overview
Remove metadata persistence for `isCollapsed`. Make collapse state local-only with default COLLAPSED behavior for long text.

### Changes Required:

#### 1. Update State Initialization
**File:** `src/components/blocks/TextBlock.jsx`
**Line:** 38

**Before:**
```javascript
const [isCollapsed, setIsCollapsed] = useState(block.metadata?.isCollapsed ?? false);
```

**After:**
```javascript
// LOCAL-ONLY STATE - Never synced to database
// Default: Long text starts collapsed (Option A: default collapsed)
const [isCollapsed, setIsCollapsed] = useState(true); // Start collapsed for long content
```

**Reasoning:**
- Remove `block.metadata?.isCollapsed` initialization
- Default `true` means long text starts collapsed
- Only affects blocks with >15 lines (MAX_LINES_BEFORE_COLLAPSE)

#### 2. Remove Metadata Persistence useEffect
**File:** `src/components/blocks/TextBlock.jsx`
**Lines:** 267-276

**Action:** DELETE entire useEffect block

**Before:**
```javascript
useEffect(() => {
  const blockIsCollapsed = block.metadata?.isCollapsed ?? false;
  if (isMountedRef.current && blockIsCollapsed !== isCollapsed) {
    onUpdate(block.id, {
      metadata: { ...block.metadata, isCollapsed }
    });
  }
}, [isCollapsed, block.id, block.metadata, onUpdate]);
```

**After:**
```javascript
// REMOVED - Collapse state is now local-only, never persisted
```

**Reasoning:**
- This useEffect triggered database writes on every collapse
- Mount tracking (`isMountedRef`) no longer needed

#### 3. Remove Mount Tracking useEffect (Now Unnecessary)
**File:** `src/components/blocks/TextBlock.jsx`
**Lines:** 19-28

**Action:** DELETE entire useEffect block (optional cleanup)

**Before:**
```javascript
useEffect(() => {
  const timer = setTimeout(() => {
    isMountedRef.current = true;
  }, 0);
  return () => {
    clearTimeout(timer);
    isMountedRef.current = false;
  };
}, []);
```

**After:**
```javascript
// REMOVED - No longer needed since we don't persist collapse state
```

**Reasoning:**
- Mount tracking was only needed to prevent initial render saves
- Since we're not saving anymore, this is dead code

#### 4. Remove Mount Ref Declaration
**File:** `src/components/blocks/TextBlock.jsx**
**Line:** 41

**Before:**
```javascript
const isMountedRef = useRef(false);
```

**After:**
```javascript
// REMOVED - No longer needed
```

#### 5. Remove Collapse State from handleSave
**File:** `src/components/blocks/TextBlock.jsx`
**Lines:** 137-142

**Before:**
```javascript
onUpdate(block.id, {
  content: content,
  tags: extractedTags,
  isNew: undefined,
  metadata: { ...block.metadata, isCollapsed }
});
```

**After:**
```javascript
onUpdate(block.id, {
  content: content,
  tags: extractedTags,
  isNew: undefined
  // REMOVED: metadata with isCollapsed (not needed)
});
```

**Note:** Only if this metadata update has ONLY `isCollapsed`. If other metadata exists, keep the metadata object but remove `isCollapsed` field.

#### 6. Update React.memo Comparison (Optional Optimization)
**File:** `src/components/blocks/TextBlock.jsx`
**Lines:** 798-804

**Before:**
```javascript
export default React.memo(TextBlock, (prevProps, nextProps) => {
  return (
    prevProps.block.metadata?.isCollapsed === nextProps.block.metadata?.isCollapsed &&
    // ... other comparisons
  );
});
```

**After:**
```javascript
export default React.memo(TextBlock, (prevProps, nextProps) => {
  return (
    // Remove isCollapsed from comparison
    // ... other comparisons (content, tags, etc.)
  );
});
```

### Success Criteria:

#### Automated Verification:
- [ ] Component compiles without errors: `npm run build`
- [ ] No TypeScript errors: `npm run typecheck` (if applicable)
- [ ] Linting passes: `npm run lint`

#### Manual Verification:
- [ ] Create TextBlock with 20+ lines
- [ ] Verify text starts collapsed (shows 10 lines + "click to expand")
- [ ] Click "Show more" → expands without "syncing" indicator
- [ ] Click "Show less" → collapses without "syncing" indicator
- [ ] Check console → no `[SYNC-SCHEDULE]` logs for collapse
- [ ] Reload page → text collapsed again (state reset)
- [ ] Edit text content → still saves correctly to database
- [ ] Short text (<15 lines) → no collapse button shown

---

## Phase 3: Database Cleanup (Optional)

### Overview
Clean up existing collapse-related metadata from database. This is **OPTIONAL** - old data is harmless if left in place.

### Migration Strategy

#### Option A: Leave Old Data (Recommended)
**Pros:**
- No migration needed
- Zero risk
- Old data is harmless (just ignored)

**Cons:**
- Database has dead fields in metadata JSONB

#### Option B: Clean Up Old Data (Optional)
**Pros:**
- Cleaner database
- Smaller metadata JSONB columns

**Cons:**
- Requires migration
- Risk of accidental data loss

### If Cleaning Up (Option B):

#### Create Migration Script
**File:** `migrations/cleanup_collapse_metadata.sql`

```sql
-- Migration: Remove collapse state from blocks.metadata
-- Purpose: Clean up UI-only state that no longer persists
-- Date: 2025-11-10
-- OPTIONAL - Can skip if leaving old data is acceptable

-- Remove collapse-related fields from all blocks
UPDATE blocks
SET metadata = metadata - 'isCollapsed' - 'collapsedMessages' - 'isBlockCollapsed'
WHERE metadata ?| ARRAY['isCollapsed', 'collapsedMessages', 'isBlockCollapsed'];

-- Verify cleanup
SELECT
  COUNT(*) as total_blocks,
  COUNT(*) FILTER (WHERE metadata ? 'isCollapsed') as has_isCollapsed,
  COUNT(*) FILTER (WHERE metadata ? 'collapsedMessages') as has_collapsedMessages,
  COUNT(*) FILTER (WHERE metadata ? 'isBlockCollapsed') as has_isBlockCollapsed
FROM blocks;

-- Expected result: All counts should be 0 for collapse fields
```

**Run:**
```bash
# Apply via Supabase dashboard SQL editor
# OR via psql:
psql $DATABASE_URL -f migrations/cleanup_collapse_metadata.sql
```

### Success Criteria:

#### Automated Verification:
- [ ] Migration runs without errors
- [ ] All blocks updated successfully

#### Manual Verification:
- [ ] Check database: `SELECT metadata FROM blocks LIMIT 10;`
- [ ] Verify no `isCollapsed`, `collapsedMessages`, or `isBlockCollapsed` fields
- [ ] FileTreeBlock snapshots still exist (metadata preserved)
- [ ] Documents still load correctly after cleanup

---

## Phase 4: Documentation Updates

### Overview
Update documentation to reflect new collapse behavior and patterns.

### Changes Required:

#### 1. Update AI-MEMORY/PATTERNS.md
**File:** `AI-MEMORY/PATTERNS.md`
**Action:** Add new pattern entry

```markdown
### Collapse/Expand State - Local-Only Pattern
**Date**: 2025-11-10
**Pattern**: UI-only state should NEVER persist to database

**Correct Implementation** (CodeBlock, AIBlock, TextBlock):
- Use `useState` with default value (collapsed = true)
- NO `onUpdate()` calls for collapse state changes
- NO metadata fields for collapse state
- State resets on component remount

**Example:**
```javascript
function MyBlock({ block, onUpdate }) {
  // LOCAL-ONLY STATE - Never synced
  const [isCollapsed, setIsCollapsed] = useState(true); // Default: collapsed

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
    // NO onUpdate() call - this is UI state only
  };

  return (
    <button onClick={toggleCollapse}>
      {isCollapsed ? 'Expand' : 'Collapse'}
    </button>
  );
}
```

**Why:**
- Collapse is UI chrome, not document state
- Eliminates unnecessary database writes
- Better performance (no sync cycles)
- Simpler code (no useEffect needed)

**Exception:** FileTreeBlock metadata for snapshots (NOT collapse state)

**Time Saved**: Prevents ~80% of unnecessary sync operations
**Performance**: Eliminates database writes for every collapse/expand
```

#### 2. Update CLAUDE.md
**File:** `CLAUDE.md`
**Section:** Add to "Important Development Practices" or "Key Dependencies"

```markdown
### Block Collapse State Pattern

**Rule**: UI-only state (collapse/expand, hover, focus) should NEVER persist to database.

**Pattern to follow**: See `src/components/blocks/CodeBlock.jsx:12`

```javascript
// ✅ CORRECT - Local state only
const [isExpanded, setIsExpanded] = useState(false);

// ❌ WRONG - Don't persist UI state
const [isExpanded, setIsExpanded] = useState(block.metadata?.isExpanded || false);
useEffect(() => {
  onUpdate(block.id, { metadata: { isExpanded } }); // DON'T DO THIS
}, [isExpanded]);
```

**Default behavior**: All blocks start collapsed on page load.
```

#### 3. Add Code Comment in ExpandedViewEnhanced.jsx
**File:** `src/components/ExpandedViewEnhanced.jsx`
**Line:** Near line 735 (where metadata is passed to SmartSync)

**Add comment:**
```javascript
// Smart Sync handles everything - pass the normalized content WITH type, position, and metadata
// NOTE: Metadata should ONLY include important data (e.g., FileTree snapshots)
// UI-only state (collapse/expand) should be local-only, NOT in metadata
smartSyncManagerRef.current.handleChange(
  blockId,
  serializedBlock.content,
  'UPDATE',
  updatedBlock.type,
  updatedBlock.position,
  serializedBlock.metadata // Only important metadata (NOT collapse state)
).catch(error => {
  console.error('[SYNC-CHANGE-RECEIVED] ❌ Smart Sync error:', error);
});
```

### Success Criteria:

#### Manual Verification:
- [ ] PATTERNS.md has new collapse pattern entry
- [ ] CLAUDE.md has updated development practices
- [ ] ExpandedViewEnhanced.jsx has clarifying comment
- [ ] Documentation is clear for future developers

---

## Testing Strategy

### Unit Tests

#### Test: AIBlock Collapse State (Local-Only)
**File:** `src/components/blocks/__tests__/AIBlockRefined.test.jsx` (if exists)

```javascript
describe('AIBlockRefined Collapse State', () => {
  it('should start with all messages collapsed', () => {
    const mockBlock = {
      id: 'test-block',
      messages: [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there' },
        { role: 'user', content: 'How are you?' }
      ]
    };
    const mockOnUpdate = jest.fn();

    const { getAllByTestId } = render(
      <AIBlockRefined block={mockBlock} onUpdate={mockOnUpdate} />
    );

    // All messages should be collapsed initially
    const collapsedMessages = getAllByTestId('collapsed-message');
    expect(collapsedMessages).toHaveLength(3);
  });

  it('should toggle message collapse without calling onUpdate', () => {
    const mockBlock = {
      id: 'test-block',
      messages: [{ role: 'user', content: 'Test message' }]
    };
    const mockOnUpdate = jest.fn();

    const { getByTestId } = render(
      <AIBlockRefined block={mockBlock} onUpdate={mockOnUpdate} />
    );

    // Expand message
    fireEvent.click(getByTestId('toggle-message-0'));

    // onUpdate should NOT be called for collapse state
    expect(mockOnUpdate).not.toHaveBeenCalled();
  });

  it('should reset collapse state on remount', () => {
    const mockBlock = {
      id: 'test-block',
      messages: [{ role: 'user', content: 'Test' }]
    };

    const { getByTestId, rerender, unmount } = render(
      <AIBlockRefined block={mockBlock} onUpdate={() => {}} />
    );

    // Expand message
    fireEvent.click(getByTestId('toggle-message-0'));
    expect(getByTestId('expanded-message')).toBeInTheDocument();

    // Remount
    unmount();
    rerender(<AIBlockRefined block={mockBlock} onUpdate={() => {}} />);

    // Should be collapsed again
    expect(getByTestId('collapsed-message')).toBeInTheDocument();
  });
});
```

#### Test: TextBlock Collapse State (Local-Only)
**File:** `src/components/blocks/__tests__/TextBlock.test.jsx` (if exists)

```javascript
describe('TextBlock Collapse State', () => {
  const longContent = 'Line 1\n'.repeat(20); // 20 lines

  it('should start collapsed for long content', () => {
    const mockBlock = {
      id: 'test-block',
      content: longContent
    };
    const mockOnUpdate = jest.fn();

    const { getByText } = render(
      <TextBlock block={mockBlock} onUpdate={mockOnUpdate} />
    );

    // Should show collapse button
    expect(getByText(/click to expand/i)).toBeInTheDocument();
  });

  it('should toggle collapse without calling onUpdate', () => {
    const mockBlock = {
      id: 'test-block',
      content: longContent
    };
    const mockOnUpdate = jest.fn();

    const { getByText } = render(
      <TextBlock block={mockBlock} onUpdate={mockOnUpdate} />
    );

    // Expand
    fireEvent.click(getByText(/click to expand/i));

    // onUpdate should NOT be called for collapse toggle
    expect(mockOnUpdate).not.toHaveBeenCalled();
  });

  it('should not show collapse button for short content', () => {
    const shortContent = 'Line 1\nLine 2\nLine 3'; // Only 3 lines
    const mockBlock = {
      id: 'test-block',
      content: shortContent
    };

    const { queryByText } = render(
      <TextBlock block={mockBlock} onUpdate={() => {}} />
    );

    // Should NOT show collapse button
    expect(queryByText(/click to expand/i)).not.toBeInTheDocument();
  });
});
```

### Integration Tests

#### Test: No Sync on Collapse
**File:** `src/__tests__/integration/collapse-no-sync.test.jsx`

```javascript
describe('Collapse State Does Not Trigger Sync', () => {
  let mockSmartSync;

  beforeEach(() => {
    mockSmartSync = {
      handleChange: jest.fn()
    };
  });

  it('should not call SmartSync when collapsing AIBlock message', () => {
    const { getByTestId } = render(
      <ExpandedViewEnhanced
        entry={mockDocument}
        smartSyncManagerRef={{ current: mockSmartSync }}
      />
    );

    // Toggle collapse on AI message
    fireEvent.click(getByTestId('toggle-message-0'));

    // SmartSync.handleChange should NOT be called
    expect(mockSmartSync.handleChange).not.toHaveBeenCalled();
  });

  it('should not call SmartSync when collapsing TextBlock', () => {
    const { getByText } = render(
      <ExpandedViewEnhanced
        entry={mockDocument}
        smartSyncManagerRef={{ current: mockSmartSync }}
      />
    );

    // Toggle collapse on TextBlock
    fireEvent.click(getByText(/click to expand/i));

    // SmartSync.handleChange should NOT be called
    expect(mockSmartSync.handleChange).not.toHaveBeenCalled();
  });
});
```

### Manual Testing Steps

#### Scenario 1: AIBlock Collapse Behavior
1. Create new document
2. Add AI Conversation block with 5+ messages
3. **Verify:** All messages start collapsed by default
4. Click to expand message #2
5. **Verify:** Message expands, no "syncing" indicator appears
6. Check browser DevTools console
7. **Verify:** No `[SYNC-SCHEDULE]` or SmartSync logs
8. Reload the page
9. **Verify:** All messages collapsed again (state reset)
10. Expand all messages, close document, reopen
11. **Verify:** All messages collapsed (no persistence)

#### Scenario 2: TextBlock Collapse Behavior
1. Create TextBlock with 20+ lines of text
2. **Verify:** Block starts collapsed (shows first 10 lines + "click to expand")
3. Click "Show more"
4. **Verify:** Content expands, no "syncing" indicator
5. Click "Show less"
6. **Verify:** Content collapses, no "syncing" indicator
7. Check console → no SmartSync logs
8. Reload page
9. **Verify:** Block collapsed again (state reset)

#### Scenario 3: FileTreeBlock Snapshots Still Work
1. Create FileTreeBlock
2. Build a tree structure with folders/files
3. Click "Create Snapshot" button
4. **Verify:** "Syncing" indicator DOES appear (this is correct)
5. Check console → SmartSync logs SHOULD appear for snapshots
6. Reload page
7. **Verify:** Snapshots are preserved (metadata still works)
8. Expand/collapse tree nodes
9. **Verify:** Node expansion does NOT trigger sync

#### Scenario 4: Database Verification
1. Create AIBlock and TextBlock, collapse/expand several times
2. Open browser DevTools → Application → IndexedDB
3. **Verify:** No pending changes in SmartSync queue for collapse
4. Open Supabase dashboard → Table Editor → blocks table
5. Query: `SELECT id, metadata FROM blocks WHERE type IN ('ai', 'text') LIMIT 10;`
6. **Verify:** No `isCollapsed`, `collapsedMessages`, or `isBlockCollapsed` in metadata JSONB
7. **Verify:** FileTreeBlock metadata still has `snapshots` field

---

## Performance Considerations

### Expected Performance Improvements:

1. **Reduced Database Writes:**
   - Before: Every collapse/expand → database write
   - After: Zero database writes for collapse state
   - Impact: ~80% reduction in metadata-only updates

2. **Reduced IndexedDB Operations:**
   - Before: Every collapse → IndexedDB write (crash recovery)
   - After: No IndexedDB writes for UI state
   - Impact: Faster UI response (~50ms saved per collapse)

3. **Reduced Network Traffic:**
   - Before: Collapse state in batch_sync_changes RPC calls
   - After: Only actual content changes synced
   - Impact: Smaller payloads, faster syncs

4. **Simpler Component Logic:**
   - Before: useEffect + mount tracking + change detection
   - After: Simple useState, no effects
   - Impact: Fewer re-renders, easier to understand

### Potential Risks:

1. **User Expectation:**
   - Risk: Users might expect collapse state to persist
   - Mitigation: Default collapsed state is reasonable (Option A)
   - Severity: Low (collapse is UI convenience, not work state)

2. **FileTreeBlock Confusion:**
   - Risk: Developers might think ALL metadata was removed
   - Mitigation: Clear documentation and code comments
   - Severity: Low (different metadata, clear separation)

---

## Migration Notes

### Rollback Plan

If issues arise, rollback is straightforward:

1. **Revert Code Changes:**
   ```bash
   git revert <commit-hash>
   npm run build
   npm run deploy
   ```

2. **Database State:**
   - No database changes were made (optional cleanup only)
   - Old metadata fields are harmless if code is reverted

3. **User Impact:**
   - Rollback restores persistence behavior
   - No data loss (content never affected)

### Breaking Changes

**None.** This is a pure improvement with no breaking changes:
- Existing documents work unchanged
- Collapse functionality still works (just local-only)
- FileTreeBlock snapshots unaffected

---

## References

### Investigation Documents:
- Original investigation: `/COLLAPSE_SYNC_INVESTIGATION.md`
- AI-MEMORY patterns: `/AI-MEMORY/PATTERNS.md`

### Key Files Modified:
- `src/components/blocks/AIBlockRefined.jsx:11-12,290-308`
- `src/components/blocks/TextBlock.jsx:38,267-276`
- `AI-MEMORY/PATTERNS.md` (documentation)
- `CLAUDE.md` (development guidelines)

### Reference Implementations:
- **Correct pattern:** `src/components/blocks/CodeBlock.jsx:12`
- **Tree node expansion:** `src/components/blocks/FileTreeBlock.jsx:201`

### Database Functions (Unchanged):
- `migrations/batch_sync_changes.sql` - Still handles metadata for FileTree
- `migrations/fix_batch_sync_metadata.sql` - Metadata support preserved

---

## Timeline Estimate

- **Phase 1 (AIBlockRefined):** 30 minutes
- **Phase 2 (TextBlock):** 20 minutes
- **Phase 3 (Database cleanup):** 15 minutes (optional)
- **Phase 4 (Documentation):** 15 minutes
- **Testing:** 30 minutes
- **Total:** ~2 hours (or 1.5 hours without optional cleanup)

---

## Completion Checklist

### Phase 1: AIBlockRefined.jsx
- [ ] Update state initialization (remove metadata init)
- [ ] Remove metadata persistence useEffect
- [ ] Update React.memo comparison
- [ ] Test locally → all messages start collapsed
- [ ] Test locally → no "syncing" on collapse

### Phase 2: TextBlock.jsx
- [ ] Update state initialization (default true)
- [ ] Remove metadata persistence useEffect
- [ ] Remove mount tracking useEffect
- [ ] Remove mount ref declaration
- [ ] Update handleSave (remove isCollapsed from metadata)
- [ ] Update React.memo comparison
- [ ] Test locally → long text starts collapsed
- [ ] Test locally → no "syncing" on collapse

### Phase 3: Database Cleanup (Optional)
- [ ] Create cleanup migration SQL script
- [ ] Test migration on staging database
- [ ] Run migration on production
- [ ] Verify metadata cleaned up

### Phase 4: Documentation
- [ ] Update AI-MEMORY/PATTERNS.md
- [ ] Update CLAUDE.md
- [ ] Add comment in ExpandedViewEnhanced.jsx
- [ ] Commit documentation changes

### Final Verification:
- [ ] All automated tests pass
- [ ] Manual testing scenarios complete
- [ ] No "syncing" indicator for collapse/expand
- [ ] Page reload → all blocks collapsed (default)
- [ ] FileTreeBlock snapshots still save correctly
- [ ] Performance improvement verified (fewer sync logs)

---

**Implementation Date:** 2025-11-10
**Plan Author:** Claude Code (Sonnet 4.5)
**Status:** Ready for Implementation

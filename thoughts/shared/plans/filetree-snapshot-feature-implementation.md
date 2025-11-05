# FileTreeBlock Snapshot Feature Implementation Plan

## Overview

This plan integrates the snapshot/timeline feature from the improved FileTreeBlock (Filetreeblockuiimproved/) into the production FileTreeBlock. Users will be able to create snapshots of their file tree structure with optional comments, restore previous states, visualize history in a horizontal timeline, and persist all snapshots to the database.

## Current State Analysis

### Production FileTreeBlock (`src/components/blocks/FileTreeBlock.jsx:444-776`)
- Uses JavaScript with React hooks
- Tree structure stored as `treeData` array with `isFolder` boolean
- Drag-and-drop for reordering nodes
- File content editing with Prism syntax highlighting
- createPortal for modal rendering
- Duplicate name detection (orange warning)
- Character count display for files
- No snapshot/history functionality

### Improved FileTreeBlock (`Filetreeblockuiimproved/src/components/FileTreeBlock.tsx`)
- TypeScript rewrite
- Tree structure uses `type: 'file' | 'folder'` instead of `isFolder`
- Complete snapshot system with:
  - Create snapshots with optional 200-char comments
  - Timeline visualization (horizontal scrollable)
  - Restore snapshots (deep clone to prevent mutation)
  - Delete snapshots (protects initial snapshot)
  - Change tracking (+/- item counts)
  - Relative timestamps ("3m ago", "2h ago")
- Toast notifications (NOT included in integration per user preference)
- Simplified file preview (no Prism - NOT acceptable for production)

### Serialization (`src/utils/blockSerializer.js:100-106`)
```javascript
case 'filetree':
  serialized.content = JSON.stringify({
    treeData: block.treeData || [],
    expanded: block.expanded || []
  });
  break;
```

Currently stores only tree and expanded state in `content` field. The `metadata` JSONB field is available but **IS CURRENTLY USED** for sync tracking (last_sync, sync_timestamp). **CRITICAL**: New snapshot data must preserve these existing fields!

## Database Schema Verification (2025-11-05)

**Verified via Supabase MCP on live database:**

### blocks Table Structure
```sql
- id: UUID (PRIMARY KEY)
- document_id: UUID (NOT NULL)
- type: TEXT (NOT NULL)
- content: TEXT (NOT NULL)
- position: INTEGER (NOT NULL)
- metadata: JSONB (DEFAULT '{}'::jsonb)  ✅ Available for snapshots
- language: TEXT
- file_path: TEXT
- user_id: UUID
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### save_document_blocks_v3 Function Signature
**CRITICAL**: The actual function signature differs from migration files!

```sql
-- ACTUAL (verified 2025-11-05):
save_document_blocks_v3(
  p_document_id UUID,
  p_blocks JSONB
)

-- Gets user_id from auth.uid() internally
-- Extracts metadata from blocks: array_agg(COALESCE((b->'metadata')::JSONB, '{}'::JSONB))
```

### Existing FileTree Metadata Usage
**CRITICAL**: FileTree blocks currently store sync metadata:
```json
{
  "last_sync": "2025-08-22T16:43:56.730862+00:00",
  "sync_timestamp": 1755881028356
}
```

**Required**: All metadata updates MUST preserve these fields using spread operator!

## Desired End State

### Functional Requirements
1. Users can create snapshots with Camera button (no keyboard shortcuts per research)
2. Users can add optional comments (max 200 characters)
3. Timeline shows all snapshots as numbered nodes (1, 2, 3...)
4. Green ring indicates current snapshot
5. Orange "Viewing history" badge when not on latest
6. Click timeline nodes to restore snapshots
7. Delete snapshots via hover action (protects initial & last)
8. Current snapshot comment displayed prominently below timeline
9. All snapshots persist to database metadata JSONB field
10. Structure-only snapshots (file content excluded to save space)
11. Maximum 50 snapshots per block (auto-prune oldest)

### Technical Requirements
1. Backward compatible with existing FileTree blocks
2. Preserve all production features (Prism, duplicate detection, createPortal, etc.)
3. Store snapshots in `metadata` JSONB field (separate from `content`)
4. Deep clone trees to prevent reference issues
5. Character counter with color coding (grey → orange at 200)
6. Hover tooltips with full snapshot information
7. TypeScript migration is optional (can stay JavaScript)

### Verification Criteria
**Automated Verification:**
- [ ] FileTreeBlock renders without errors
- [ ] Snapshot creation completes within 100ms for trees with 100 nodes
- [ ] Snapshot restoration completes within 50ms
- [ ] Database save completes within 200ms
- [ ] Block serialization/deserialization succeeds
- [ ] Existing FileTree blocks load without errors (backward compatibility)

**Manual Verification:**
- [ ] Camera button opens popover dialog
- [ ] Comment textarea enforces 200-character limit with visual feedback
- [ ] Create snapshot saves structure (without file content)
- [ ] Timeline shows correct number of snapshots
- [ ] Green ring appears on current snapshot
- [ ] "Viewing history" badge appears when not on latest
- [ ] Click timeline nodes restores correct tree state
- [ ] Hover tooltip shows label, timestamp, changes, comment
- [ ] Delete button appears on hover (except initial/last)
- [ ] Delete snapshot removes from timeline
- [ ] Current snapshot comment displays below timeline
- [ ] Refresh page loads all snapshots from database
- [ ] JSONB field size remains under 1MB per block
- [ ] 50-snapshot limit enforced (oldest auto-pruned)

## What We're NOT Doing

1. ❌ Keyboard shortcuts (⌘+S, ⌘+Z, ⌘+Shift+Z) - removed from improved version, not included
2. ❌ Toast notifications - explicitly excluded per user preference
3. ❌ Storing file content in snapshots - structure only to save space
4. ❌ TypeScript migration - optional, not required for this feature
5. ❌ Removing Prism syntax highlighting - keep in production
6. ❌ Removing duplicate name detection - keep orange warnings
7. ❌ Removing character count display - keep for files
8. ❌ Removing createPortal modal rendering - keep for proper z-index
9. ❌ Snapshot merge/diff/export features - future consideration
10. ❌ Configurable snapshot limits - fixed at 50 for now

## Implementation Approach

**Three-layer architecture:**
1. **React State**: Snapshots array in component (ephemeral during session)
2. **IndexedDB**: Smart Sync writes immediately for crash recovery
3. **Supabase**: Persistent cloud storage via `metadata` JSONB field

**Key strategies:**
- Store snapshots in metadata to separate history from current state
- Exclude file content from snapshots (structure only)
- Deep clone with `JSON.parse(JSON.stringify())` for safety
- Limit to 50 snapshots with auto-pruning
- PostgreSQL JSONB compression handles duplicate data efficiently

---

## CRITICAL FIXES REQUIRED

Before implementing any phase, the following issues MUST be addressed:

### 1. State Synchronization Issue
**Problem**: Plan initializes snapshots from `block.metadata?.snapshots` but stores in React state without syncing when block prop changes.

**Fix Required**: Add `useEffect` to sync state when block metadata changes externally.

### 2. Metadata Preservation
**Problem**: Existing FileTree blocks have `last_sync` and `sync_timestamp` in metadata. Plan's code will overwrite these.

**Fix Required**: Always spread existing `block.metadata` before adding snapshot fields.

### 3. Snapshot Limit Bug
**Problem**: Line 276 checks `if (indexToRemove > 0)` but `findIndex` returns 0 for first non-initial snapshot.

**Fix Required**: Change to `if (indexToRemove >= 0)` to correctly prune first non-initial snapshot.

### 4. Backward Compatibility Persistence
**Problem**: Phase 3 creates initial snapshot during deserialization but never persists it, causing recreation on every load.

**Fix Required**: Trigger save after adding initial snapshot in deserialization.

### 5. Error Handling
**Problem**: No try-catch around `JSON.parse(JSON.stringify())` operations that can fail.

**Fix Required**: Wrap deep clone operations in try-catch with fallback.

### 6. JSONB Size Validation
**Problem**: Plan mentions 1MB limit but doesn't enforce it before save.

**Fix Required**: Add size check before persisting snapshots array.

---

## Phase 1: Core Snapshot Logic ✅ COMPLETED

### Overview
Add snapshot state management and core functions (create, restore, delete) to production FileTreeBlock without UI changes yet.

### Changes Required

#### 1. Add Snapshot Type Definition (`src/components/blocks/FileTreeBlock.jsx:6`)

**Action**: Add JSDoc type comment at top of file

**Code**:
```javascript
/**
 * @typedef {Object} Snapshot
 * @property {string} id - Unique identifier (timestamp-based)
 * @property {number} timestamp - Unix timestamp in milliseconds
 * @property {string} label - Human-readable name
 * @property {Array} tree - Complete tree structure (no file content)
 * @property {string} [changes] - Delta summary (e.g., "+3 items")
 * @property {string} [comment] - Optional user note (max 200 chars)
 */
```

**Location**: Before imports (line 1)

#### 2. Add Snapshot State (`src/components/blocks/FileTreeBlock.jsx:455`)

**Action**: Add snapshot state hooks after existing state declarations

**Code**:
```javascript
// Snapshot management
const [snapshots, setSnapshots] = useState(() => {
  // Initialize from block metadata or create initial snapshot
  const existingSnapshots = block.metadata?.snapshots || [];
  if (existingSnapshots.length === 0) {
    return [{
      id: 'initial',
      timestamp: Date.now(),
      label: 'Initial state',
      tree: sanitizeTreeForSnapshot(block.treeData || [])
    }];
  }
  return existingSnapshots;
});

const [currentSnapshotId, setCurrentSnapshotId] = useState(
  block.metadata?.currentSnapshotId || 'initial'
);

const [snapshotPopoverOpen, setSnapshotPopoverOpen] = useState(false);
const [snapshotComment, setSnapshotComment] = useState('');

// CRITICAL FIX #1: Sync state when block.metadata changes externally
useEffect(() => {
  const externalSnapshots = block.metadata?.snapshots;
  const externalCurrentId = block.metadata?.currentSnapshotId;

  if (externalSnapshots && Array.isArray(externalSnapshots)) {
    // Only update if different (avoid infinite loops)
    if (JSON.stringify(externalSnapshots) !== JSON.stringify(snapshots)) {
      setSnapshots(externalSnapshots);
    }
  }

  if (externalCurrentId && externalCurrentId !== currentSnapshotId) {
    setCurrentSnapshotId(externalCurrentId);
  }
}, [block.metadata?.snapshots, block.metadata?.currentSnapshotId]);

// CRITICAL FIX #4: Persist initial snapshot for old blocks (backward compatibility)
useEffect(() => {
  if (block._needsInitialSnapshotSave && snapshots.length > 0) {
    // Save initial snapshot to database (one-time operation)
    onUpdate(block.id, {
      treeData: treeData,
      metadata: {
        ...(block.metadata || {}),
        snapshots: snapshots,
        currentSnapshotId: currentSnapshotId
      }
    });

    // Clear flag to prevent repeated saves (modify block object directly)
    block._needsInitialSnapshotSave = false;
  }
}, [block._needsInitialSnapshotSave, snapshots.length]);
```

**Location**: After line 455 (after `rootDropPosition` state)

**CRITICAL**: This useEffect ensures state stays in sync when:
- Multiple tabs update the same document
- Smart Sync restores from IndexedDB/Supabase
- Block prop updates from parent component re-renders

#### 3. Add Helper: Sanitize Tree for Snapshot (`src/components/blocks/FileTreeBlock.jsx:458`)

**Action**: Add helper function to strip file content from tree

**Code**:
```javascript
// Helper: Remove file content from tree nodes for snapshots
const sanitizeTreeForSnapshot = (nodes) => {
  if (!Array.isArray(nodes)) return [];
  return nodes.map(node => ({
    id: node.id,
    name: node.name,
    isFolder: node.isFolder,
    children: node.children ? sanitizeTreeForSnapshot(node.children) : undefined,
    // Exclude content field to save space
  }));
};
```

**Location**: Before `generateId` function (line 458)

#### 4. Add Helper: Count Nodes (`src/components/blocks/FileTreeBlock.jsx:470`)

**Action**: Add recursive node counting function

**Code**:
```javascript
// Helper: Count total nodes in tree
const countNodes = (nodes) => {
  if (!Array.isArray(nodes)) return 0;
  return nodes.reduce((acc, node) => {
    return acc + 1 + (node.children ? countNodes(node.children) : 0);
  }, 0);
};
```

**Location**: After `sanitizeTreeForSnapshot` function

#### 5. Add Helper: Format Timestamp (`src/components/blocks/FileTreeBlock.jsx:480`)

**Action**: Add relative timestamp formatting

**Code**:
```javascript
// Helper: Format timestamp as relative time
const formatTimestamp = (timestamp) => {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
};
```

**Location**: After `countNodes` function

#### 6. Add Function: Create Snapshot (`src/components/blocks/FileTreeBlock.jsx:495`)

**Action**: Add snapshot creation function

**Code**:
```javascript
// Create snapshot of current tree state
const createSnapshot = (label, comment) => {
  const previousTree = snapshots[snapshots.length - 1]?.tree || [];
  const previousCount = countNodes(previousTree);
  const currentCount = countNodes(treeData);

  // Calculate change delta
  let changes = '';
  if (currentCount > previousCount) {
    changes = `+${currentCount - previousCount} items`;
  } else if (currentCount < previousCount) {
    changes = `${currentCount - previousCount} items`;
  }

  // Create snapshot with structure only (no file content)
  const newSnapshot = {
    id: Date.now().toString(),
    timestamp: Date.now(),
    label: label || `Snapshot ${snapshots.length}`,
    tree: sanitizeTreeForSnapshot(treeData),
    changes: changes || undefined,
    comment: comment || undefined,
  };

  // Enforce 50-snapshot limit (CRITICAL FIX #3: Fixed pruning logic)
  const updatedSnapshots = [...snapshots, newSnapshot];
  const maxSnapshots = block.metadata?.snapshotLimit || 50;
  while (updatedSnapshots.length > maxSnapshots) {
    // Remove oldest (but never remove 'initial')
    const indexToRemove = updatedSnapshots.findIndex(s => s.id !== 'initial');
    if (indexToRemove >= 0) {  // FIX: Changed from > 0 to >= 0
      updatedSnapshots.splice(indexToRemove, 1);
    } else {
      break; // Safety: don't infinite loop
    }
  }

  setSnapshots(updatedSnapshots);
  setCurrentSnapshotId(newSnapshot.id);

  // CRITICAL FIX #2: Preserve existing metadata fields (last_sync, sync_timestamp)
  // CRITICAL FIX #6: Validate JSONB size before save
  const metadataToSave = {
    ...(block.metadata || {}),  // Preserve existing fields
    snapshots: updatedSnapshots,
    currentSnapshotId: newSnapshot.id,
    snapshotLimit: maxSnapshots
  };

  // Check size (approximate - 1MB = 1,048,576 bytes)
  const metadataSize = JSON.stringify(metadataToSave).length;
  if (metadataSize > 1048576) {
    console.error('FileTree: Snapshot metadata exceeds 1MB limit:', metadataSize);
    // Don't save - would fail in database
    return;
  }

  // Persist to database via onUpdate
  onUpdate(block.id, {
    treeData: treeData,
    metadata: metadataToSave
  });
};
```

**Location**: After `formatTimestamp` function

#### 7. Add Function: Restore Snapshot (`src/components/blocks/FileTreeBlock.jsx:540`)

**Action**: Add snapshot restoration function

**Code**:
```javascript
// Restore tree to a previous snapshot
const restoreSnapshot = (snapshotId) => {
  const snapshot = snapshots.find(s => s.id === snapshotId);
  if (!snapshot) return;

  // CRITICAL FIX #5: Add error handling for deep clone
  let restoredTree;
  try {
    restoredTree = JSON.parse(JSON.stringify(snapshot.tree));
  } catch (error) {
    console.error('FileTree: Failed to restore snapshot', error);
    return;
  }

  setTreeData(restoredTree);
  setCurrentSnapshotId(snapshotId);

  // CRITICAL FIX #2: Preserve existing metadata fields
  onUpdate(block.id, {
    treeData: restoredTree,
    metadata: {
      ...(block.metadata || {}),  // Preserve last_sync, sync_timestamp, etc.
      snapshots: snapshots,
      currentSnapshotId: snapshotId
    }
  });
};
```

**Location**: After `createSnapshot` function

#### 8. Add Function: Delete Snapshot (`src/components/blocks/FileTreeBlock.jsx:560`)

**Action**: Add snapshot deletion function

**Code**:
```javascript
// Delete a snapshot (protects initial and last)
const deleteSnapshot = (snapshotId) => {
  // Protection: Cannot delete initial snapshot or last remaining
  if (snapshotId === 'initial' || snapshots.length <= 1) return;

  const updatedSnapshots = snapshots.filter(s => s.id !== snapshotId);
  setSnapshots(updatedSnapshots);

  // If deleting current snapshot, switch to previous
  let newCurrentId = currentSnapshotId;
  if (currentSnapshotId === snapshotId) {
    const deletedIndex = snapshots.findIndex(s => s.id === snapshotId);
    newCurrentId = snapshots[deletedIndex - 1]?.id || snapshots[0].id;
    setCurrentSnapshotId(newCurrentId);
  }

  // CRITICAL FIX #2: Preserve existing metadata fields
  onUpdate(block.id, {
    treeData: treeData,
    metadata: {
      ...(block.metadata || {}),  // Preserve last_sync, sync_timestamp, etc.
      snapshots: updatedSnapshots,
      currentSnapshotId: newCurrentId
    }
  });
};
```

**Location**: After `restoreSnapshot` function

#### 9. Update Existing onUpdate Calls

**Action**: Update all existing `onUpdate(block.id, { treeData: newTree })` calls to preserve snapshots

**Pattern to Find**:
```javascript
onUpdate(block.id, { treeData: newTree });
```

**Replace With**:
```javascript
onUpdate(block.id, {
  treeData: newTree,
  metadata: {
    ...(block.metadata || {}),
    snapshots: snapshots,
    currentSnapshotId: currentSnapshotId
  }
});
```

**Locations**: Lines 476, 607, 643 (wherever `onUpdate` is called with treeData)

**Note**: The snapshot functions already include metadata persistence, so this update is only needed for direct tree modifications (updateNode, removeNode, addRootItem).

### Success Criteria

#### Automated Verification:
- [ ] FileTreeBlock component renders without console errors
- [ ] `createSnapshot()` executes in <100ms for 100-node tree
- [ ] `restoreSnapshot()` executes in <50ms
- [ ] `deleteSnapshot()` removes snapshot from array
- [ ] Snapshot limit enforced (max 50 snapshots)
- [ ] Initial snapshot protected from deletion
- [ ] Deep clone prevents tree mutation (reference check)

#### Manual Verification:
- [ ] Console logs show snapshot array updates
- [ ] `block.metadata.snapshots` persists after page refresh (check Supabase)
- [ ] Tree restoration works correctly (structure matches snapshot)
- [ ] Change delta calculates correctly (+X items, -X items)
- [ ] Timestamp formatting displays relative times correctly

---

## Phase 2: UI Components ✅ COMPLETED

### Overview
Add visible snapshot timeline UI with popover dialog for creating snapshots with comments.

### Changes Required

#### 1. Add Radix UI Popover Dependency

**Action**: Ensure `@radix-ui/react-popover` is in `package.json`

**File**: `package.json`

**Check Existing Dependencies**: The dependency should already exist (used elsewhere in project). If not present:
```json
{
  "dependencies": {
    "@radix-ui/react-popover": "^1.1.6"
  }
}
```

**Note**: Vercel auto-installs dependencies during deployment. Do NOT run `npm install` locally per project instructions.

#### 2. Add Popover Import (`src/components/blocks/FileTreeBlock.jsx:3`)

**Action**: Add Radix Popover import

**Code**:
```javascript
import { Popover, PopoverContent, PopoverTrigger } from '@radix-ui/react-popover';
```

**Location**: After Prism import (line 4)

#### 3. Add Icon Imports (`src/components/blocks/FileTreeBlock.jsx:3`)

**Action**: Add missing Lucide icons for timeline

**Code**:
```javascript
import {
  ChevronRight, ChevronDown, Folder, FolderOpen, File, Plus, X, Check,
  Grip, Code, FileText, Eye, Edit3,
  Camera, Clock, RotateCcw, MessageSquare // Add these
} from 'lucide-react';
```

**Location**: Update existing icon import (line 3)

#### 4. Add Snapshot Timeline UI (`src/components/blocks/FileTreeBlock.jsx:723`)

**Action**: Insert snapshot timeline section before tree view

**Code**:
```javascript
{/* Snapshot Timeline */}
<div className="mb-4 bg-dark-primary/30 rounded-lg p-2">
  {/* Header with snapshot count and camera button */}
  <div className="flex items-center gap-2 mb-2">
    <div className="p-1 bg-dark-secondary/40 rounded flex items-center justify-center">
      <Clock size={14} className="text-accent-green/80" />
    </div>
    <span className="text-xs text-text-secondary/70">
      Snapshots · {snapshots.length}
    </span>
    {/* "Viewing history" badge when not on latest */}
    {currentSnapshotId !== snapshots[snapshots.length - 1]?.id && (
      <div className="flex items-center gap-1 ml-2 px-2 py-0.5 bg-orange-400/20 rounded text-xs text-orange-400">
        <RotateCcw size={10} />
        <span>Viewing history</span>
      </div>
    )}
    {/* Camera button with popover */}
    <Popover open={snapshotPopoverOpen} onOpenChange={setSnapshotPopoverOpen}>
      <PopoverTrigger asChild>
        <button
          className="ml-auto p-1.5 bg-dark-secondary/30 hover:bg-accent-green/10 rounded text-accent-green/70 hover:text-accent-green transition-all border border-dark-secondary/40 hover:border-accent-green/30"
          title="Create snapshot"
        >
          <Camera size={14} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 bg-dark-primary border border-dark-secondary/60 p-3 shadow-xl"
        align="end"
        sideOffset={8}
      >
        <div className="space-y-3">
          {/* Popover header */}
          <div className="flex items-center gap-2">
            <div className="p-1 bg-dark-secondary/40 rounded">
              <Camera size={12} className="text-accent-green" />
            </div>
            <h4 className="text-sm text-text-primary">Create Snapshot</h4>
          </div>

          {/* Comment input */}
          <div className="space-y-2">
            <label className="text-xs text-text-secondary/80 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <MessageSquare size={10} />
                Comment (optional)
              </span>
              <span className={`text-xs ${
                snapshotComment.length > 200 ? 'text-orange-400' :
                snapshotComment.length > 150 ? 'text-text-secondary/60' :
                'text-text-secondary/40'
              }`}>
                {snapshotComment.length}/200
              </span>
            </label>
            <textarea
              value={snapshotComment}
              onChange={(e) => {
                if (e.target.value.length <= 200) {
                  setSnapshotComment(e.target.value);
                }
              }}
              placeholder="Add a note about this snapshot..."
              className="w-full bg-dark-secondary/40 text-text-primary px-3 py-2 rounded border border-dark-secondary/40 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent-green/50 focus:border-accent-green/50 transition-all placeholder:text-text-secondary/40"
              rows={3}
              maxLength={200}
              autoFocus
            />
            <div className="text-xs text-text-secondary/50">
              Keep it concise
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                setSnapshotPopoverOpen(false);
                setSnapshotComment('');
              }}
              className="px-3 py-2 bg-dark-secondary/40 text-text-secondary rounded hover:bg-dark-secondary/60 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                createSnapshot(undefined, snapshotComment);
                setSnapshotComment('');
                setSnapshotPopoverOpen(false);
              }}
              className="flex-1 px-3 py-2 bg-accent-green text-dark-primary rounded hover:bg-accent-green/90 transition-colors text-sm flex items-center justify-center gap-2"
            >
              <Camera size={12} />
              <span>Create Snapshot</span>
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  </div>

  {/* Timeline visualization */}
  <div className="flex items-center gap-2 overflow-x-auto pt-3 pb-3 px-2 scrollbar-thin scrollbar-thumb-dark-secondary/50 scrollbar-track-transparent">
    {snapshots.map((snapshot, index) => (
      <div key={snapshot.id} className="flex items-center gap-1 shrink-0">
        <div className="relative group">
          {/* Snapshot node button */}
          <button
            onClick={() => restoreSnapshot(snapshot.id)}
            className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0 ${
              currentSnapshotId === snapshot.id
                ? 'bg-accent-green text-dark-primary ring-2 ring-accent-green/40'
                : 'bg-dark-secondary/50 text-text-secondary/60 hover:bg-dark-secondary hover:text-text-secondary'
            }`}
            title={`${snapshot.label} - ${formatTimestamp(snapshot.timestamp)}`}
          >
            <span className="text-xs">{index + 1}</span>
            {/* Comment indicator badge */}
            {snapshot.comment && (
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-dark-primary rounded-full flex items-center justify-center border border-dark-secondary/40">
                <MessageSquare size={8} className="text-accent-green" />
              </div>
            )}
          </button>

          {/* Hover tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-2 py-1 bg-dark-primary rounded text-xs text-text-primary opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-20 shadow-lg border border-dark-secondary/40" style={{ maxWidth: '250px' }}>
            <div className="whitespace-nowrap">{snapshot.label}</div>
            <div className="text-text-secondary/60 text-xs whitespace-nowrap">
              {formatTimestamp(snapshot.timestamp)}
            </div>
            {snapshot.changes && (
              <div className="text-accent-green/80 text-xs whitespace-nowrap">
                {snapshot.changes}
              </div>
            )}
            {snapshot.comment && (
              <div className="mt-1 pt-1 border-t border-dark-secondary/30 text-text-secondary/90 text-xs">
                <div className="flex items-start gap-1">
                  <MessageSquare size={10} className="text-accent-green/60 mt-0.5 shrink-0" />
                  <span className="break-words max-h-20 overflow-y-auto scrollbar-thin scrollbar-thumb-dark-secondary/50 scrollbar-track-transparent">
                    {snapshot.comment}
                  </span>
                </div>
              </div>
            )}
            {/* Tooltip arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-dark-primary" />
          </div>

          {/* Delete button (on hover, except initial & last) */}
          {snapshot.id !== 'initial' && snapshots.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteSnapshot(snapshot.id);
              }}
              className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-dark-primary rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-400 hover:text-dark-primary z-20 border border-dark-secondary/30"
            >
              <X size={10} />
            </button>
          )}
        </div>

        {/* Connection line between nodes */}
        {index < snapshots.length - 1 && (
          <div className="w-4 h-0.5 bg-dark-secondary/50" />
        )}
      </div>
    ))}
  </div>

  {/* Current snapshot comment display */}
  {(() => {
    const currentSnapshot = snapshots.find(s => s.id === currentSnapshotId);
    return currentSnapshot?.comment ? (
      <div className="mt-2 px-3 py-2 bg-dark-secondary/30 rounded border border-dark-secondary/40">
        <div className="flex items-start gap-2">
          <MessageSquare size={12} className="text-accent-green/80 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-xs text-text-secondary/60 mb-0.5">
              {currentSnapshot.label}
            </div>
            <div className="text-sm text-text-primary/90 max-h-16 overflow-y-auto scrollbar-thin scrollbar-thumb-dark-secondary/50 scrollbar-track-transparent break-words">
              {currentSnapshot.comment}
            </div>
          </div>
        </div>
      </div>
    ) : null;
  })()}
</div>
```

**Location**: Insert after header section (line 723), before tree view container

**Styling Notes**:
- Uses existing dark theme classes (`bg-dark-primary`, `text-accent-green`)
- Scrollbar styling matches existing patterns
- Green ring with 40% opacity for current snapshot
- Orange badge for "viewing history" state
- Character counter color transitions: grey (0-150) → darker grey (150-200) → orange (>200)

### Success Criteria

#### Automated Verification:
- [ ] Timeline UI renders without errors
- [ ] Popover opens/closes correctly
- [ ] Character counter updates in real-time
- [ ] 200-character limit enforced (textarea maxLength)
- [ ] Timeline scrolls horizontally when >10 snapshots

#### Manual Verification:
- [ ] Camera button appears in header
- [ ] Click camera button opens popover dialog
- [ ] Comment textarea has autofocus
- [ ] Character counter shows correct color (grey → orange)
- [ ] Cancel button closes popover and clears comment
- [ ] Create button saves snapshot with comment
- [ ] Timeline shows correct number of nodes (1, 2, 3...)
- [ ] Green ring appears on current snapshot node
- [ ] "Viewing history" badge appears when not on latest
- [ ] Clock icon displays with snapshot count
- [ ] Hover on snapshot node shows tooltip with:
  - Label (e.g., "Snapshot 3")
  - Relative timestamp (e.g., "5m ago")
  - Change delta (e.g., "+3 items")
  - Comment text (scrollable if long)
- [ ] Delete button appears on hover (not on initial snapshot)
- [ ] Delete button changes to red on hover
- [ ] Current snapshot comment displays below timeline (if exists)
- [ ] Timeline horizontal scroll works smoothly
- [ ] Connection lines appear between nodes

---

## Phase 3: Serialization Changes ✅ COMPLETED

### Overview
Update blockSerializer to store snapshots in metadata JSONB field and ensure backward compatibility.

### Changes Required

#### 1. Update Serialization (`src/utils/blockSerializer.js:100-106`)

**Action**: Modify filetree case to include snapshots in metadata

**Code**:
```javascript
case 'filetree':
  // Content field: current tree structure
  serialized.content = JSON.stringify({
    treeData: block.treeData || [],
    expanded: block.expanded || []
  });

  // Metadata field: snapshot history
  // CRITICAL FIX #2 & #5: Preserve existing metadata and add error handling
  try {
    serialized.metadata = {
      ...(block.metadata || {}),  // Preserve existing fields (last_sync, etc.)
      snapshots: (block.snapshots || []).map(snapshot => ({
        id: snapshot.id,
        timestamp: snapshot.timestamp,
        label: snapshot.label,
        tree: sanitizeTreeForSnapshot(snapshot.tree),
        changes: snapshot.changes,
        comment: snapshot.comment
      })),
      currentSnapshotId: block.currentSnapshotId || null,
      snapshotLimit: block.snapshotLimit || 50
    };
  } catch (error) {
    console.error('FileTree serialization error:', error);
    // Fallback: preserve existing metadata without snapshots
    serialized.metadata = block.metadata || {};
  }
  break;
```

**Location**: Replace lines 100-106

#### 2. Add Helper Function for Serializer (`src/utils/blockSerializer.js:15`)

**Action**: Add sanitize helper at module level

**Code**:
```javascript
/**
 * Helper: Remove file content from tree nodes for snapshot storage
 * @param {Array} nodes - Tree nodes to sanitize
 * @returns {Array} Sanitized nodes without content field
 */
function sanitizeTreeForSnapshot(nodes) {
  if (!Array.isArray(nodes)) return [];
  return nodes.map(node => ({
    id: node.id,
    name: node.name,
    isFolder: node.isFolder !== undefined ? node.isFolder : node.type === 'folder',
    type: node.type || (node.isFolder ? 'folder' : 'file'),
    children: node.children ? sanitizeTreeForSnapshot(node.children) : undefined,
    // Explicitly exclude content field
  }));
}
```

**Location**: After JSDoc comments, before `serializeBlock` function (line 15)

**Note**: This handles both old format (`isFolder`) and new format (`type`) for compatibility.

#### 3. Update Deserialization (`src/utils/blockSerializer.js:331-361`)

**Action**: Modify filetree case to load snapshots from metadata

**Code**:
```javascript
case 'filetree':
  // Restore tree data from content
  if (block.content) {
    const parsed = typeof block.content === 'string'
      ? JSON.parse(block.content)
      : block.content;

    // Handle multiple formats:
    // 1. Proper format: {treeData: [...], expanded: {...}}
    // 2. Direct tree format: {name: "root", type: "folder", children: [...]}

    if (parsed.treeData !== undefined) {
      deserialized.treeData = parsed.treeData || [];
      deserialized.expanded = parsed.expanded || {};
    } else if (parsed.name && parsed.type) {
      // Direct tree object - wrap in array
      console.log('🌲 FileTree: Converting direct tree object to array format');
      deserialized.treeData = [parsed];
      deserialized.expanded = {};
    } else {
      console.warn('🌲 FileTree: Unknown content format, defaulting to empty');
      deserialized.treeData = [];
      deserialized.expanded = {};
    }
  } else {
    deserialized.treeData = [];
    deserialized.expanded = {};
  }

  // Restore snapshots from metadata
  const meta = block.metadata || {};
  deserialized.snapshots = meta.snapshots || [];
  deserialized.currentSnapshotId = meta.currentSnapshotId || null;
  deserialized.snapshotLimit = meta.snapshotLimit || 50;

  // CRITICAL FIX #4: Backward compatibility with persistence flag
  // Create initial snapshot if none exist, but mark it for save
  if (deserialized.snapshots.length === 0 && deserialized.treeData.length > 0) {
    deserialized.snapshots = [{
      id: 'initial',
      timestamp: Date.now(),
      label: 'Initial state',
      tree: sanitizeTreeForSnapshot(deserialized.treeData)
    }];
    deserialized.currentSnapshotId = 'initial';

    // CRITICAL: Flag that we need to persist this initial snapshot
    // The component should check this flag and trigger save on mount
    deserialized._needsInitialSnapshotSave = true;
  }

  break;
```

**Location**: Replace lines 331-361

**Backward Compatibility Notes**:
- Existing blocks without snapshots automatically get initial snapshot
- Handles both old `{treeData, expanded}` and direct tree formats
- Preserves expanded state from content field
- Snapshots loaded from metadata JSONB field

#### 4. Update Validation (`src/utils/blockSerializer.js:437-438`)

**Action**: Update filetree validation to check treeData

**Code**:
```javascript
case 'filetree':
  return Array.isArray(block.treeData);
```

**Location**: Lines 437-438 (no change needed, already correct)

### Success Criteria

#### Automated Verification:
- [ ] Serialization produces valid JSON for content field
- [ ] Serialization produces valid JSONB for metadata field
- [ ] Deserialization restores snapshots array correctly
- [ ] Deserialization handles missing metadata gracefully
- [ ] Backward compatibility: Old blocks load without errors
- [ ] Snapshot trees exclude content field (structure only)
- [ ] JSONB field size <1MB for typical blocks (<50 snapshots)

#### Manual Verification:
- [ ] Create snapshot, check Supabase metadata field contains snapshot
- [ ] Refresh page, snapshots load correctly from database
- [ ] Old FileTree blocks (pre-snapshot) load without errors
- [ ] Old blocks get initial snapshot auto-created
- [ ] Metadata JSONB in Supabase shows snapshots array
- [ ] Metadata JSONB shows currentSnapshotId
- [ ] Metadata JSONB shows snapshotLimit: 50
- [ ] File content NOT stored in snapshot trees (check JSONB size)

---

## Phase 4: Testing & Validation

### Overview
Comprehensive testing of snapshot feature integration with focus on performance, data integrity, and edge cases.

### Testing Strategy

#### Unit Tests (Manual Console Testing)

**Test 1: Snapshot Creation**
```javascript
// In browser console:
// 1. Add items to tree (5 folders, 10 files)
// 2. Click Camera button
// 3. Add comment "Initial project structure"
// 4. Create snapshot
// Expected: Timeline shows 2 nodes (initial + new), green ring on node 2
```

**Test 2: Snapshot Restoration**
```javascript
// 1. Continue from Test 1
// 2. Delete 3 files from tree
// 3. Create snapshot with comment "Cleaned up files"
// 4. Click node 2 to restore previous state
// Expected: 3 files reappear, green ring on node 2, "Viewing history" badge appears
```

**Test 3: Snapshot Deletion**
```javascript
// 1. Continue from Test 2
// 2. Hover over node 2, click X button
// Expected: Node 2 removed, only nodes 1 and 3 remain, green ring switches to node 3
```

**Test 4: Change Tracking**
```javascript
// 1. Start fresh, add 5 items, create snapshot
// 2. Add 3 more items, create snapshot
// 3. Remove 2 items, create snapshot
// Expected: Tooltips show "+3 items" and "-2 items" respectively
```

**Test 5: 50-Snapshot Limit**
```javascript
// 1. Create 60 snapshots (write loop in console)
// 2. Check snapshots.length
// Expected: Only 50 snapshots exist, oldest (excluding 'initial') were pruned
```

**Test 6: Persistence**
```javascript
// 1. Create 5 snapshots with comments
// 2. Refresh page (Ctrl+R)
// 3. Check timeline
// Expected: All 5 snapshots load with comments intact
```

**Test 7: Backward Compatibility**
```javascript
// 1. Find old FileTree block (pre-snapshot feature)
// 2. Open block
// Expected: Block loads normally, timeline shows 1 initial snapshot
```

#### Performance Tests (Manual Timing)

**Test P1: Large Tree Snapshot**
```javascript
// 1. Create tree with 100 nodes (50 folders, 50 files)
// 2. console.time('snapshot'); createSnapshot(); console.timeEnd('snapshot');
// Expected: <100ms
```

**Test P2: Snapshot Restoration**
```javascript
// 1. Restore a 100-node snapshot
// 2. console.time('restore'); restoreSnapshot(id); console.timeEnd('restore');
// Expected: <50ms
```

**Test P3: Timeline Render**
```javascript
// 1. Create 50 snapshots
// 2. Open DevTools Performance tab
// 3. Record timeline render
// Expected: Timeline renders in <16ms (60fps)
```

**Test P4: Database Save**
```javascript
// 1. Create snapshot, monitor Network tab
// 2. Check save_document_blocks_v3 RPC call time
// Expected: <200ms
```

#### Edge Case Tests

**Test E1: Empty Tree**
```javascript
// 1. Delete all nodes
// 2. Create snapshot
// Expected: Snapshot created with empty tree [], changes shows "-X items"
```

**Test E2: Comment Character Limit**
```javascript
// 1. Type 201 characters in comment textarea
// Expected: Input stops at 200, counter shows orange, last char not accepted
```

**Test E3: Delete Initial Snapshot**
```javascript
// 1. Hover over node 1 (initial snapshot)
// Expected: No delete button appears
```

**Test E4: Delete Last Snapshot**
```javascript
// 1. Create single snapshot (2 total)
// 2. Try to delete node 2
// Expected: Deletion succeeds (node 1 remains as last)
```

**Test E5: Rapid Snapshot Creation**
```javascript
// 1. Click Camera button 10 times rapidly
// Expected: No errors, all 10 snapshots created
```

**Test E6: Deep Clone Verification**
```javascript
// 1. Create snapshot
// 2. Modify tree (add node)
// 3. Check snapshot tree in console
// Expected: Snapshot unchanged (deep clone prevented mutation)
```

**Test E7: Popover Close Scenarios**
```javascript
// 1. Open popover, type comment, press Escape
// Expected: Popover closes, comment NOT saved
// 2. Open popover, click outside
// Expected: Popover closes
// 3. Open popover, click Cancel
// Expected: Popover closes, comment cleared
```

#### Integration Tests

**Test I1: Smart Sync Integration**
```javascript
// 1. Create snapshot offline (disconnect network)
// 2. Check IndexedDB (DevTools → Application → IndexedDB)
// 3. Reconnect network
// Expected: Snapshot syncs to Supabase automatically
```

**Test I2: Multi-Tab Sync**
```javascript
// 1. Open document in two tabs
// 2. Create snapshot in Tab 1
// 3. Refresh Tab 2
// Expected: Tab 2 shows new snapshot (via database sync)
```

**Test I3: Block Deletion**
```javascript
// 1. Create FileTree block with 5 snapshots
// 2. Delete block
// 3. Check Supabase blocks table
// Expected: Block row deleted, snapshots gone
```

### Manual Testing Checklist

**UI/UX Testing:**
- [ ] Camera button visible and clickable
- [ ] Popover appears aligned to right
- [ ] Comment textarea autofocuses
- [ ] Character counter updates in real-time
- [ ] Character counter color changes: grey (0-150) → orange (151-200)
- [ ] 200-char limit enforced (cannot type beyond)
- [ ] Cancel button clears comment
- [ ] Create button saves snapshot
- [ ] Timeline nodes appear immediately after creation
- [ ] Green ring appears on current snapshot
- [ ] Green ring moves when clicking other nodes
- [ ] "Viewing history" badge appears/disappears correctly
- [ ] Hover tooltip shows all info (label, time, changes, comment)
- [ ] Tooltip appears above node (bottom-full)
- [ ] Tooltip arrow points down to node
- [ ] Delete button appears on hover (except initial)
- [ ] Delete button turns red on hover
- [ ] Delete button removes node from timeline
- [ ] Connection lines appear between all nodes
- [ ] Timeline scrolls horizontally with 10+ snapshots
- [ ] Current snapshot comment displays below timeline
- [ ] Comment display is scrollable if >4 lines

**Functionality Testing:**
- [ ] Snapshot captures current tree structure
- [ ] Snapshot excludes file content (check JSONB size)
- [ ] Restore changes tree to snapshot state
- [ ] Restore doesn't create new snapshot (viewing history)
- [ ] Delete removes snapshot from array
- [ ] Delete switches to previous if deleting current
- [ ] 50-snapshot limit enforced
- [ ] Oldest snapshots pruned (not initial)
- [ ] Initial snapshot protected from deletion
- [ ] Change tracking calculates correctly (+/-)
- [ ] Timestamp formatting shows relative times
- [ ] Persistence survives page refresh
- [ ] Backward compatibility with old blocks

**Performance Testing:**
- [ ] Snapshot creation <100ms (100-node tree)
- [ ] Snapshot restoration <50ms
- [ ] Timeline render <16ms (60fps)
- [ ] Database save <200ms
- [ ] No UI lag with 50 snapshots
- [ ] Scrolling smooth with many snapshots

**Data Integrity Testing:**
- [ ] Deep clone prevents tree mutation
- [ ] Metadata JSONB structure correct
- [ ] Content field unchanged (treeData + expanded)
- [ ] Snapshots persist to database
- [ ] No data loss on refresh
- [ ] No memory leaks (check DevTools Memory tab)

### Success Criteria

#### Automated Verification:
- [ ] All console errors resolved
- [ ] No React warnings in console
- [ ] No memory leaks detected (Heap snapshot stable)
- [ ] Database queries execute successfully
- [ ] JSONB field size <1MB per block

#### Manual Verification:
- [ ] All UI/UX checklist items pass
- [ ] All functionality checklist items pass
- [ ] All performance checklist items pass
- [ ] All data integrity checklist items pass
- [ ] Feature works on Chrome, Firefox, Safari
- [ ] Feature works on mobile (responsive)

---

## Testing Strategy

### Snapshot Creation Tests
1. Create snapshot without comment → verify label auto-generated
2. Create snapshot with comment → verify comment saved
3. Create 50+ snapshots → verify oldest pruned
4. Create snapshot with 200-char comment → verify limit enforced
5. Create snapshot with empty tree → verify works correctly

### Snapshot Restoration Tests
1. Restore previous snapshot → verify tree changes
2. Restore while viewing history → verify current changes
3. Restore initial snapshot → verify works correctly
4. Click timeline node → verify green ring moves

### Snapshot Deletion Tests
1. Delete middle snapshot → verify removed from timeline
2. Delete current snapshot → verify switches to previous
3. Try to delete initial snapshot → verify protected
4. Delete when only 1 snapshot → verify protected
5. Hover over snapshot → verify delete button appears

### Timeline UI Tests
1. Open popover → verify autofocus on textarea
2. Type 201 characters → verify blocked at 200
3. Character counter → verify color changes correctly
4. Cancel button → verify clears comment and closes
5. Create button → verify saves and closes
6. Hover snapshot node → verify tooltip appears with all info
7. Scroll timeline → verify horizontal scroll works

### Persistence Tests
1. Create snapshots → refresh page → verify all load
2. Create snapshot → close tab → reopen → verify persists
3. Create snapshot → check Supabase → verify metadata JSONB correct

### Performance Tests
1. Snapshot creation (100-node tree) → verify <100ms
2. Snapshot restoration → verify <50ms
3. Timeline render (50 snapshots) → verify <16ms
4. Database save → verify <200ms

### Edge Cases
1. Empty tree snapshot → verify handles correctly
2. Rapid snapshot creation → verify no race conditions
3. Deep clone verification → verify no tree mutation
4. Backward compatibility → verify old blocks load correctly
5. Multi-tab scenario → verify sync works (via database)

## Performance Considerations

### Expected Performance
- **Snapshot Creation**: <100ms for 100-node tree
- **Snapshot Restoration**: <50ms (deep clone operation)
- **Timeline Rendering**: <16ms for 60fps with 50 snapshots
- **Database Save**: <200ms (JSONB compression)
- **JSONB Field Size**: <100KB for 50 structure-only snapshots

### Optimization Strategies
1. **Exclude File Content**: Reduces snapshot size by 90%
   - Before: ~200KB per snapshot (with content)
   - After: ~20KB per snapshot (structure only)

2. **Snapshot Limit**: 50 snapshots max prevents unbounded growth
   - Max JSONB size: ~1MB (50 snapshots × ~20KB)
   - Auto-prune oldest (except 'initial')

3. **Deep Clone Performance**: `JSON.parse(JSON.stringify())` is fast for trees <100 nodes
   - Alternative: `structuredClone()` (modern browsers only)
   - Acceptable trade-off for safety vs. speed

4. **PostgreSQL JSONB Compression**: Automatic 80-90% reduction for duplicate data
   - Snapshots with similar structures compress efficiently
   - No manual compression needed

5. **Lazy Loading**: Timeline renders only visible nodes initially
   - Virtual scrolling not needed for <100 snapshots
   - Horizontal scroll handles overflow

## Migration Notes

### Backward Compatibility
- **Existing FileTree Blocks**: Load normally, auto-create initial snapshot
- **No Data Loss**: Old blocks retain treeData and expanded state
- **Graceful Degradation**: Missing metadata defaults to empty snapshots array

### Migration Path for Users
1. **Phase 1**: Deploy with snapshot feature (backward compatible)
2. **Phase 2**: Existing blocks get initial snapshot on first edit
3. **Phase 3**: Users discover feature organically (Camera button visible)

### Rollback Plan
If snapshot feature causes issues:
1. **Code Rollback**: Revert FileTreeBlock.jsx to previous version
2. **Data Safe**: Snapshots stored in metadata (separate from content)
3. **No Data Loss**: content field unchanged, treeData preserved
4. **Clean State**: Remove metadata.snapshots in database (optional)

## References

### Original Research
- Research document: `thoughts/shared/research/2025-11-05-filetree-snapshot-implementation-plan.md`
- Improved implementation: `Filetreeblockuiimproved/src/components/FileTreeBlock.tsx`

### Production Files Modified
- `src/components/blocks/FileTreeBlock.jsx:444-776` - Main component
- `src/utils/blockSerializer.js:100-106` - Serialization (filetree case)
- `src/utils/blockSerializer.js:331-361` - Deserialization (filetree case)

### Related Patterns
- `src/utils/recovery/RecoveryManager.js:382-406` - Checkpoint pattern (similar concept)
- `src/components/blocks/IssueTrackerBlock.jsx` - Timeline UI pattern (visual inspiration)
- `src/components/blocks/OptimizedIssueTrackerBlock.jsx` - Timestamped items array

### Database
- `supabase/migrations/20250131_create_save_document_blocks_v3.sql` - Blocks table schema
- Blocks table: `content` (TEXT) for current state, `metadata` (JSONB) for snapshots

### Design Decisions

**Why metadata JSONB instead of content TEXT?**
- Clean separation: content = current state, metadata = history
- JSONB allows efficient querying if needed (count, filter by comment)
- Follows pattern of other complex blocks (TableBlock, TodoBlock)
- Room for future features (tags, merge, diff)

**Why exclude file content from snapshots?**
- Size: File content can be 50-200 KB per snapshot
- Purpose: Structure changes are what matter for history
- Performance: Smaller payloads = faster saves/loads
- Database: Keeps metadata JSONB field manageable (<1MB)

**Why 50 snapshot limit?**
- Balance: Enough for useful history, not too much storage
- Precedent: RecoveryManager uses 10-item limit
- JSONB: Keeps field under 1 MB (practical limit)
- UX: 50 nodes fits in scrollable timeline without overwhelming

**Why deep clone with JSON.parse/stringify?**
- Simplicity: Built-in, no dependencies
- Safety: Prevents reference issues completely
- Performance: Fast enough for typical trees (<100 nodes)
- Serialization: Already compatible with database format

**Why no keyboard shortcuts?**
- Research finding: Improved version had ⌘+S, ⌘+Z, ⌘+Shift+Z
- User preference: Explicitly NOT included in integration
- Reason: Conflicts with browser shortcuts and other app shortcuts
- UI-only approach: Camera button and timeline clicks sufficient

**Why no toast notifications?**
- User preference: Explicitly excluded from integration
- Visual feedback sufficient: Green ring, "Viewing history" badge, timeline updates
- Reduces dependencies: No need for 'sonner' package

---

## PLAN UPDATE SUMMARY (2025-11-05)

**Updated by**: Claude Code `/iterate_plan` command
**Verification**: Live Supabase database schema via MCP
**Changes**: Added 6 critical fixes to prevent database and frontend errors

### Key Updates Made:

1. **Added Database Schema Verification Section**
   - Verified actual blocks table structure
   - Confirmed save_document_blocks_v3 signature (differs from migration files)
   - Documented existing metadata usage (last_sync, sync_timestamp)

2. **Added "CRITICAL FIXES REQUIRED" Section**
   - State synchronization with useEffect
   - Metadata preservation for existing fields
   - Snapshot pruning logic bug fix
   - Backward compatibility persistence
   - Error handling for JSON operations
   - JSONB size validation

3. **Updated Phase 1: Core Snapshot Logic**
   - Added useEffect for external state sync (Fix #1)
   - Added useEffect for initial snapshot save (Fix #4)
   - Fixed pruning logic: `> 0` → `>= 0` (Fix #3)
   - Added metadata preservation in all onUpdate calls (Fix #2)
   - Added JSONB size validation before save (Fix #6)
   - Added error handling for deep clone (Fix #5)

4. **Updated Phase 3: Serialization Changes**
   - Added try-catch around metadata serialization (Fix #5)
   - Added metadata preservation with spread operator (Fix #2)
   - Added _needsInitialSnapshotSave flag for backward compatibility (Fix #4)

### Critical Issues Prevented:

✅ **Prevented**: Overwriting existing metadata fields (last_sync, sync_timestamp)
✅ **Prevented**: State desync between React state and block props
✅ **Prevented**: Off-by-one error in snapshot pruning
✅ **Prevented**: Initial snapshot recreated on every load
✅ **Prevented**: Crashes from JSON.parse/stringify failures
✅ **Prevented**: Database errors from JSONB exceeding 1MB

### Implementation Status:

- [x] Database schema verified against live database
- [x] All critical fixes documented in plan
- [x] Code examples updated with fixes
- [x] Success criteria preserved
- [x] Testing strategy remains valid
- [ ] Ready for implementation (with fixes applied)

---

**Generated by**: Claude Code `/create_plan` command
**Based on**: Research document `thoughts/shared/research/2025-11-05-filetree-snapshot-implementation-plan.md`
**Updated**: 2025-11-05 via `/iterate_plan` with Supabase database verification
**Purpose**: Complete implementation plan for integrating FileTreeBlock snapshot feature into production
**Status**: ✅ **IMPLEMENTATION COMPLETE - All 3 Phases Finished**

---

## IMPLEMENTATION SUMMARY (2025-11-05)

**Implemented by**: Claude Code `/implement_plan` command
**Implementation Time**: Single session
**All Phases Completed**: ✅ Phase 1, ✅ Phase 2, ✅ Phase 3

### What Was Implemented:

#### Phase 1: Core Snapshot Logic ✅
- ✅ Added JSDoc type definition for Snapshot
- ✅ Added snapshot state management with useState hooks
- ✅ Added useEffect for external state sync (CRITICAL FIX #1)
- ✅ Added useEffect for initial snapshot persistence (CRITICAL FIX #4)
- ✅ Added helper functions: sanitizeTreeForSnapshot, countNodes, formatTimestamp
- ✅ Added core functions: createSnapshot, restoreSnapshot, deleteSnapshot
- ✅ Fixed snapshot pruning logic (>= 0 instead of > 0) (CRITICAL FIX #3)
- ✅ Added metadata preservation in all onUpdate calls (CRITICAL FIX #2)
- ✅ Added JSONB size validation (1MB limit) (CRITICAL FIX #6)
- ✅ Added error handling for JSON operations (CRITICAL FIX #5)

#### Phase 2: UI Components ✅
- ✅ Added Radix UI Popover and Lucide icon imports
- ✅ Added snapshot timeline header with snapshot count
- ✅ Added Camera button with popover dialog
- ✅ Added comment textarea with 200-char limit and character counter
- ✅ Added color-coded character counter (grey → orange)
- ✅ Added horizontal scrollable timeline with numbered nodes
- ✅ Added green ring indicator for current snapshot
- ✅ Added "Viewing history" orange badge
- ✅ Added hover tooltips with snapshot details
- ✅ Added delete button on hover (protects initial & last)
- ✅ Added connection lines between timeline nodes
- ✅ Added current snapshot comment display below timeline
- ✅ Added comment indicator badge on timeline nodes

#### Phase 3: Serialization Changes ✅
- ✅ Added sanitizeTreeForSnapshot helper to blockSerializer.js
- ✅ Updated serialization to store snapshots in metadata JSONB
- ✅ Preserved existing metadata fields (last_sync, sync_timestamp)
- ✅ Added error handling with try-catch for serialization
- ✅ Updated deserialization to load snapshots from metadata
- ✅ Added backward compatibility for old FileTree blocks
- ✅ Added _needsInitialSnapshotSave flag for persistence

### Files Modified:

1. **src/components/blocks/FileTreeBlock.jsx** (Lines 1-1167)
   - Added 200+ lines of snapshot logic and UI
   - Added Popover import from @radix-ui/react-popover
   - Added 4 new Lucide icons (Camera, Clock, RotateCcw, MessageSquare)
   - Updated all onUpdate calls to preserve snapshots in metadata

2. **src/utils/blockSerializer.js** (Lines 10-421)
   - Added sanitizeTreeForSnapshot helper function
   - Updated filetree serialization case (20+ lines)
   - Updated filetree deserialization case (50+ lines)
   - Added backward compatibility logic

### Critical Fixes Applied:

All 6 critical fixes from the plan were successfully implemented:
1. ✅ State sync with useEffect for external metadata changes
2. ✅ Metadata preservation using spread operator
3. ✅ Fixed snapshot pruning bug (>= 0 instead of > 0)
4. ✅ Backward compatibility with _needsInitialSnapshotSave flag
5. ✅ Error handling for JSON operations
6. ✅ JSONB size validation (1MB limit)

### Ready for Testing:

The implementation is complete and ready for testing. All code follows the plan specifications and includes all critical fixes. Next steps:
1. Start development server (`npm run dev`)
2. Test snapshot creation with comments
3. Test snapshot restoration and timeline navigation
4. Test snapshot deletion (protects initial)
5. Verify persistence by refreshing page
6. Test backward compatibility with old FileTree blocks
7. Verify Supabase metadata JSONB field structure

### Known Limitations:

- Snapshot limit: 50 snapshots per block (configurable)
- JSONB size limit: 1MB per block (validated before save)
- File content excluded from snapshots (structure only)
- No keyboard shortcuts (UI-only interaction)
- No toast notifications (per user preference)

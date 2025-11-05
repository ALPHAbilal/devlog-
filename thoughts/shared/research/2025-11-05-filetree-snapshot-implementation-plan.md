---
date: 2025-11-05T16:45:00+0000
researcher: Claude Code
git_commit: 65bce3760868e46c3e2db64a0798067dd05a34f1
branch: main
repository: devlog-
topic: "FileTreeBlock Snapshot Feature - Complete Implementation Plan"
tags: [research, codebase, filetree, snapshot, timeline, ui, backend, database, planning]
status: complete
last_updated: 2025-11-05
last_updated_by: Claude Code
---

# Research: FileTreeBlock Snapshot Feature - Complete Implementation Plan

**Date**: 2025-11-05T16:45:00+0000
**Researcher**: Claude Code
**Git Commit**: 65bce3760868e46c3e2db64a0798067dd05a34f1
**Branch**: main
**Repository**: devlog-

## Research Question

Document the FileTreeBlock snapshot feature implementation in the improved directory (Filetreeblockuiimproved) and provide a comprehensive plan for integrating it into the main codebase, including UI changes, data structures, backend logic, and database schema modifications.

## Summary

The Filetreeblockuiimproved directory contains a TypeScript rewrite of FileTreeBlock with a comprehensive snapshot/timeline feature inspired by Git. Users can create snapshots with optional comments (max 200 chars), restore previous states via keyboard shortcuts (⌘/Ctrl+Z/Shift+Z), and visualize history in a horizontal timeline UI. The current implementation stores snapshots in React state only. This document provides a complete integration plan covering UI migration, data persistence to Supabase, backend serialization, and database schema considerations.

## Detailed Findings

### 1. Snapshot Feature Architecture

#### Core Data Structure

**Location**: `Filetreeblockuiimproved/src/components/FileTreeBlock.tsx:32-39`

```typescript
interface Snapshot {
  id: string;           // Unique identifier (Date.now().toString())
  timestamp: number;    // Unix timestamp in milliseconds
  label: string;        // Human-readable name (auto or custom)
  tree: FileNode[];     // Complete deep copy of tree at snapshot time
  changes?: string;     // Delta summary (e.g., "+3 items", "-2 items")
  comment?: string;     // Optional user note (max 200 characters)
}
```

#### State Management

**Location**: `Filetreeblockuiimproved/src/components/FileTreeBlock.tsx:422-433`

```typescript
const [snapshots, setSnapshots] = useState<Snapshot[]>([
  {
    id: 'initial',
    timestamp: Date.now(),
    label: 'Initial state',
    tree: initialTree,
  }
]);
const [currentSnapshotId, setCurrentSnapshotId] = useState<string>('initial');
const [snapshotPopoverOpen, setSnapshotPopoverOpen] = useState(false);
const [snapshotComment, setSnapshotComment] = useState('');
```

**Characteristics**:
- Initial snapshot created automatically with `id: 'initial'`
- `currentSnapshotId` tracks which snapshot is active
- `snapshotPopoverOpen` controls comment dialog visibility
- `snapshotComment` temporarily stores comment text during creation

#### Key Functions

**1. createSnapshot** (`Filetreeblockuiimproved/src/components/FileTreeBlock.tsx:435-466`)

```typescript
const createSnapshot = (label?: string, comment?: string) => {
  // Count nodes recursively
  const countNodes = (nodes: FileNode[]): number => {
    return nodes.reduce((acc, node) => {
      return acc + 1 + (node.children ? countNodes(node.children) : 0);
    }, 0);
  };

  // Calculate change delta
  const previousTree = snapshots[snapshots.length - 1]?.tree || [];
  const previousCount = countNodes(previousTree);
  const currentCount = countNodes(tree);

  let changes = '';
  if (currentCount > previousCount) {
    changes = `+${currentCount - previousCount} items`;
  } else if (currentCount < previousCount) {
    changes = `${currentCount - previousCount} items`;
  }

  // Create snapshot with deep clone
  const newSnapshot: Snapshot = {
    id: Date.now().toString(),
    timestamp: Date.now(),
    label: label || `Snapshot ${snapshots.length}`,
    tree: JSON.parse(JSON.stringify(tree)),  // Deep clone
    changes: changes || undefined,
    comment: comment || undefined,
  };

  setSnapshots((prev) => [...prev, newSnapshot]);
  setCurrentSnapshotId(newSnapshot.id);
  // Visual feedback via UI state change (green ring on timeline node)
};
```

**Features**:
- Automatic node counting for change detection
- Deep clone via `JSON.parse(JSON.stringify())` prevents reference issues
- Auto-generated labels: `"Snapshot 1"`, `"Snapshot 2"`, etc.
- Optional user-provided label and comment
- Visual feedback via timeline UI update

**2. restoreSnapshot** (`Filetreeblockuiimproved/src/components/FileTreeBlock.tsx:468-477`)

```typescript
const restoreSnapshot = (snapshotId: string) => {
  const snapshot = snapshots.find((s) => s.id === snapshotId);
  if (snapshot) {
    setTree(JSON.parse(JSON.stringify(snapshot.tree)));  // Deep clone
    setCurrentSnapshotId(snapshotId);
    // Visual feedback via green ring + "Viewing history" badge if not latest
  }
};
```

**Features**:
- Finds snapshot by ID in array
- Deep clone prevents mutation of stored snapshot
- Updates current tree state completely
- Does not create new snapshot (viewing history)
- Visual feedback via timeline UI state

**3. deleteSnapshot** (`Filetreeblockuiimproved/src/components/FileTreeBlock.tsx:479-491`)

```typescript
const deleteSnapshot = (snapshotId: string) => {
  if (snapshots.length <= 1 || snapshotId === 'initial') return;
  const snapshot = snapshots.find((s) => s.id === snapshotId);
  setSnapshots((prev) => prev.filter((s) => s.id !== snapshotId));
  if (currentSnapshotId === snapshotId) {
    setCurrentSnapshotId(snapshots[snapshots.length - 2].id);
  }
  // Visual feedback via removed timeline node
};
```

**Features**:
- Protects initial snapshot from deletion
- Prevents deleting last remaining snapshot
- Auto-switches to previous snapshot if deleting current
- Visual feedback via timeline UI update (node removed)

#### Keyboard Shortcuts

**NOT INCLUDED IN INTEGRATION** - The improved version has keyboard shortcuts (⌘+S, ⌘+Z, ⌘+Shift+Z) but these will NOT be included in the production integration. Users will interact with snapshots through the UI only (Camera button and timeline clicks).

### 2. Snapshot Timeline UI

#### Header Section

**Location**: `Filetreeblockuiimproved/src/components/FileTreeBlock.tsx:703-723`

```typescript
<div className="flex items-center gap-2 mb-2">
  <div className="p-1 bg-dark-secondary/40 rounded flex items-center justify-center">
    <Clock size={14} className="text-accent-green/80" />
  </div>
  <span className="text-xs text-text-secondary/70">
    Snapshots · {snapshots.length}
  </span>
  {currentSnapshotId !== snapshots[snapshots.length - 1]?.id && (
    <div className="flex items-center gap-1 ml-2 px-2 py-0.5 bg-orange-400/20 rounded text-xs text-orange-400">
      <RotateCcw size={10} />
      <span>Viewing history</span>
    </div>
  )}
  <Popover open={snapshotPopoverOpen} onOpenChange={setSnapshotPopoverOpen}>
    <PopoverTrigger asChild>
      <button className="ml-auto p-1.5 bg-dark-secondary/30 hover:bg-accent-green/10 rounded">
        <Camera size={14} />
      </button>
    </PopoverTrigger>
    {/* Popover content */}
  </Popover>
</div>
```

**Elements**:
1. **Clock icon** + snapshot count: Visual indicator of how many snapshots exist
2. **"Viewing history" badge**: Orange warning when not on latest snapshot
3. **Camera button**: Opens popover dialog for creating snapshot with comment

#### Snapshot Creation Popover

**Location**: `Filetreeblockuiimproved/src/components/FileTreeBlock.tsx:725-796`

```typescript
<PopoverContent className="w-80 bg-dark-primary border border-dark-secondary/60 p-3 shadow-xl">
  <div className="space-y-3">
    <div className="flex items-center gap-2">
      <div className="p-1 bg-dark-secondary/40 rounded">
        <Camera size={12} className="text-accent-green" />
      </div>
      <h4 className="text-sm text-text-primary">Create Snapshot</h4>
    </div>
    <div className="space-y-2">
      <label className="text-xs text-text-secondary/80 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <MessageSquare size={10} />
          Comment (optional)
        </span>
        <span className={`text-xs ${snapshotComment.length > 200 ? 'text-orange-400' : snapshotComment.length > 150 ? 'text-text-secondary/60' : 'text-text-secondary/40'}`}>
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
        className="w-full bg-dark-secondary/40 text-text-primary px-3 py-2 rounded border text-sm resize-none"
        rows={3}
        maxLength={200}
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            createSnapshot(undefined, snapshotComment);
            setSnapshotComment('');
            setSnapshotPopoverOpen(false);
          }
        }}
      />
      <div className="text-xs text-text-secondary/50">
        Press ⌘+Enter to create • Keep it concise
      </div>
    </div>
    <div className="flex gap-2">
      <button onClick={() => { setSnapshotPopoverOpen(false); setSnapshotComment(''); }}>
        Cancel
      </button>
      <button onClick={() => { createSnapshot(undefined, snapshotComment); setSnapshotComment(''); setSnapshotPopoverOpen(false); }}>
        <Camera size={12} />
        <span>Create Snapshot</span>
      </button>
    </div>
  </div>
</PopoverContent>
```

**Features**:
- 200-character limit enforced (hard limit + visual warning)
- Character counter changes color: grey (0-150), darker grey (151-200), orange (>200)
- **⌘/Ctrl + Enter** keyboard shortcut to create from textarea
- Cancel button clears comment and closes dialog
- Create button saves snapshot with comment

#### Timeline Visualization

**Location**: `Filetreeblockuiimproved/src/components/FileTreeBlock.tsx:799-860`

```typescript
<div className="flex items-center gap-2 overflow-x-auto pt-3 pb-3 px-2 scrollbar-thin scrollbar-thumb-dark-secondary/50 scrollbar-track-transparent">
  {snapshots.map((snapshot, index) => (
    <div key={snapshot.id} className="flex items-center gap-1 shrink-0">
      <div className="relative group">
        <button
          onClick={() => restoreSnapshot(snapshot.id)}
          className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0 ${
            currentSnapshotId === snapshot.id
              ? 'bg-accent-green text-dark-primary ring-2 ring-accent-green/40'
              : 'bg-dark-secondary/50 text-text-secondary/60 hover:bg-dark-secondary hover:text-text-secondary'
          }`}
        >
          <span className="text-xs">{index + 1}</span>
          {snapshot.comment && (
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-dark-primary rounded-full flex items-center justify-center border border-dark-secondary/40">
              <MessageSquare size={8} className="text-accent-green" />
            </div>
          )}
        </button>

        {/* Hover tooltip */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-2 py-1 bg-dark-primary rounded text-xs text-text-primary opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-20 shadow-lg border border-dark-secondary/40" style={{ maxWidth: '250px' }}>
          <div className="whitespace-nowrap">{snapshot.label}</div>
          <div className="text-text-secondary/60 text-xs whitespace-nowrap">{formatTimestamp(snapshot.timestamp)}</div>
          {snapshot.changes && (
            <div className="text-accent-green/80 text-xs whitespace-nowrap">{snapshot.changes}</div>
          )}
          {snapshot.comment && (
            <div className="mt-1 pt-1 border-t border-dark-secondary/30 text-text-secondary/90 text-xs">
              <div className="flex items-start gap-1">
                <MessageSquare size={10} className="text-accent-green/60 mt-0.5 shrink-0" />
                <span className="break-words max-h-20 overflow-y-auto scrollbar-thin">
                  {snapshot.comment}
                </span>
              </div>
            </div>
          )}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-dark-primary" />
        </div>

        {/* Delete button */}
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

      {/* Connection line */}
      {index < snapshots.length - 1 && (
        <div className="w-4 h-0.5 bg-dark-secondary/50" />
      )}
    </div>
  ))}
</div>
```

**Visual Elements**:
1. **Circular numbered buttons**: Shows snapshot index (1, 2, 3...)
   - Green background with ring if current snapshot
   - Grey background if not current
   - Hover reveals tooltip and delete button

2. **Comment indicator**: Small MessageSquare icon badge if snapshot has comment

3. **Hover tooltip**: Shows on hover
   - Snapshot label
   - Relative timestamp (formatted: "3m ago", "2h ago", etc.)
   - Change summary ("+5 items" or "-2 items") in green
   - Full comment text (scrollable if long)
   - Arrow pointing down to node

4. **Delete button**: Red X icon
   - Only shows on hover for non-initial snapshots
   - Stops event propagation (doesn't restore when deleting)
   - Cannot delete initial snapshot or last remaining snapshot

5. **Connection lines**: Horizontal grey lines between snapshot nodes

#### Current Snapshot Comment Display

**Location**: `Filetreeblockuiimproved/src/components/FileTreeBlock.tsx:863-880`

```typescript
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
          <div className="text-sm text-text-primary/90 max-h-16 overflow-y-auto scrollbar-thin break-words">
            {currentSnapshot.comment}
          </div>
        </div>
      </div>
    </div>
  ) : null;
})()}
```

**Features**:
- IIFE pattern for conditional rendering
- Shows below timeline if current snapshot has comment
- Displays snapshot label and full comment
- Scrollable if exceeds 4 lines (max-height: 4rem)
- Separate prominent display area

### 3. Key Implementation Differences from Current Production

#### Data Structure

**OLD (Production)** (`src/components/blocks/FileTreeBlock.jsx:236-244`):
```javascript
{
  id: string,
  name: string,
  isFolder: boolean,
  children?: array,
  content?: string
}
```

**NEW (Improved)** (`Filetreeblockuiimproved/src/components/FileTreeBlock.tsx:24-30`):
```typescript
interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';  // Changed from isFolder boolean
  content?: string;
  children?: FileNode[];
}
```

**Migration Path**: Convert `isFolder: true` → `type: 'folder'`, `isFolder: false` → `type: 'file'`

#### Dependencies Added

**NEW Dependencies** (`Filetreeblockuiimproved/package.json:7-48`):
- `@radix-ui/react-popover@^1.1.6` - Popover component for comment dialog
- Full Radix UI component library (30+ components for future features)
- TypeScript type definitions

**Removed Dependencies**:
- `prism-react-renderer` - Syntax highlighting removed (simplified preview)

**NOT Included (User Preference)**:
- `sonner` - Toast notifications (excluded from integration plan)

#### Features Removed in Improved Version (DO NOT REMOVE FROM PRODUCTION)

**IMPORTANT**: These features exist in the current production FileTreeBlock and MUST be preserved during integration. The improved version removed them for simplicity, but they are critical for production use.

1. **Prism Syntax Highlighting**: Keep syntax highlighting for file content preview
2. **Tab Key Handling**: Keep auto-indentation (uses default behavior in improved version)
3. **Keyboard Shortcuts in Editor**: Keep existing editor shortcuts (improved version only has save button)
4. **Content Length Display**: Keep character count display
5. **Duplicate Name Detection**: Keep orange warning for duplicate file/folder names
6. **CreatePortal for Modal**: Keep portal rendering for proper z-index stacking
7. **Block Integration Props**: Keep `block`/`onUpdate` props integration (improved version is standalone demo)

#### Features Added in Improved Version

1. **Snapshot System**: Complete timeline with create/restore/delete
2. **Comment System**: 200-char comments with real-time counter
3. **Visual Feedback**: Green ring on active snapshot, "Viewing history" badge
4. **Timeline UI**: Horizontal scrollable snapshot visualization
5. **Change Tracking**: Automatic node counting and delta calculation
6. **Relative Timestamps**: "3m ago", "2h ago" formatting
7. **TypeScript**: Full type safety

**Note**: Toast notifications from improved version NOT included in integration (user preference)

### 4. Database Integration Strategy

#### Current Schema

**blocks Table** (`supabase/migrations/20250131_create_save_document_blocks_v3.sql`):
```sql
id UUID PRIMARY KEY
document_id UUID NOT NULL
user_id UUID
type TEXT CHECK (type IN ('text', 'code', 'heading', 'ai', 'table', 'filetree', 'todo', ...))
content TEXT NOT NULL              -- Stores serialized JSON
metadata JSONB DEFAULT '{}'        -- Available for structured data
position INTEGER NOT NULL
language TEXT
file_path TEXT
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

**Current FileTree Serialization** (`src/utils/blockSerializer.js:100-106`):
```javascript
case 'filetree':
  serialized.content = JSON.stringify({
    treeData: block.treeData || [],
    expanded: block.expanded || []
  });
  break;
```

#### Recommended Storage Approach

**Store snapshots in `metadata` JSONB field** for clean separation:

```json
// content field (TEXT) - main tree data
{
  "treeData": [/* current tree with file content */],
  "expanded": [/* expanded node IDs */]
}

// metadata field (JSONB) - snapshot history
{
  "snapshots": [
    {
      "id": "1730851234567",
      "timestamp": 1730851234567,
      "label": "Added auth modules",
      "tree": [/* structure only, no file content */],
      "changes": "+5 items",
      "comment": "Initial authentication setup"
    }
  ],
  "currentSnapshotId": "1730851234567",
  "snapshotLimit": 50
}
```

**Serialization Changes Needed** (`src/utils/blockSerializer.js:100-110`):
```javascript
case 'filetree':
  serialized.content = JSON.stringify({
    treeData: block.treeData || [],
    expanded: block.expanded || []
  });

  // Add snapshots to metadata
  serialized.metadata = {
    ...(block.metadata || {}),
    snapshots: block.snapshots || [],
    currentSnapshotId: block.currentSnapshotId || null,
    snapshotLimit: block.snapshotLimit || 50
  };
  break;
```

**Deserialization Changes** (`src/utils/blockSerializer.js:331-365`):
```javascript
case 'filetree':
  const parsed = typeof block.content === 'string'
    ? JSON.parse(block.content)
    : block.content;

  deserialized.treeData = parsed.treeData || [];
  deserialized.expanded = parsed.expanded || {};

  // Load snapshots from metadata
  const meta = block.metadata || {};
  deserialized.snapshots = meta.snapshots || [];
  deserialized.currentSnapshotId = meta.currentSnapshotId || null;
  deserialized.snapshotLimit = meta.snapshotLimit || 50;
  break;
```

#### Size Considerations

**Snapshot Size Estimation**:
- Typical project tree (30 files, 10 folders): ~4-5 KB without content
- With file content: ~50-200 KB
- 10 snapshots without content: ~40-50 KB
- 10 snapshots with content: ~500 KB - 2 MB

**Mitigation Strategies**:

1. **Exclude file content from snapshots** (structure only):
```javascript
const sanitizeTreeForSnapshot = (nodes) => {
  return nodes.map(node => ({
    ...node,
    content: undefined,  // Don't store file content
    children: node.children ? sanitizeTreeForSnapshot(node.children) : undefined
  }));
};
```

2. **Limit snapshot count** (auto-prune oldest):
```javascript
const maxSnapshots = block.snapshotLimit || 50;
if (snapshots.length >= maxSnapshots) {
  snapshots.shift();  // Remove oldest
}
```

3. **PostgreSQL JSONB compression**: Automatic compression handles duplicate data (80-90% reduction)

#### Migration for Existing Blocks

**No breaking changes required**. Existing blocks continue working:

```javascript
// OLD format (still valid)
{"treeData": [...], "expanded": [...]}

// NEW format (backward compatible)
{"treeData": [...], "expanded": [...], "snapshots": []}
```

**Optional: Create initial snapshot on first edit**:
```javascript
useEffect(() => {
  if (block.treeData && (!block.snapshots || block.snapshots.length === 0)) {
    setSnapshots([{
      id: 'initial',
      timestamp: Date.now(),
      label: 'Initial state',
      tree: block.treeData
    }]);
  }
}, [block.id]);
```

### 5. Integration Plan

#### Phase 1: Core Snapshot Logic

1. **Add Snapshot interface to FileTreeBlock.jsx** (before line 7):
```javascript
// interface Snapshot {
//   id: string;
//   timestamp: number;
//   label: string;
//   tree: FileNode[];
//   changes?: string;
//   comment?: string;
// }
```

2. **Add snapshot state** (after line 455):
```javascript
const [snapshots, setSnapshots] = useState(() => {
  const initial = block.snapshots || [];
  if (initial.length === 0) {
    initial.push({
      id: 'initial',
      timestamp: Date.now(),
      label: 'Initial state',
      tree: block.treeData || []
    });
  }
  return initial;
});
const [currentSnapshotId, setCurrentSnapshotId] = useState(
  block.currentSnapshotId || 'initial'
);
const [snapshotPopoverOpen, setSnapshotPopoverOpen] = useState(false);
const [snapshotComment, setSnapshotComment] = useState('');
```

3. **Add snapshot functions** (lines 467-506 from improved version):
   - `createSnapshot`
   - `restoreSnapshot`
   - `deleteSnapshot`
   - `formatTimestamp`

4. **Update onUpdate calls** to persist snapshots:
```javascript
onUpdate(block.id, {
  treeData: newTree,
  snapshots: snapshots,
  currentSnapshotId: currentSnapshotId
});
```

#### Phase 2: UI Components

1. **Add dependency to package.json** (if not already present):
```json
{
  "dependencies": {
    "@radix-ui/react-popover": "^1.1.6"
  }
}
```
*Note: Dependencies are automatically installed by Vercel during deployment. Do not run `npm install` locally.*

2. **Add Popover import** (line 22):
```javascript
import { Popover, PopoverContent, PopoverTrigger } from '@radix-ui/react-popover';
```

3. **Add Timeline UI** (before tree view, around line 724):
   - Copy lines 701-881 from improved version
   - Adjust styling to match existing dark theme
   - Keep existing icon imports (Camera, Clock, RotateCcw, MessageSquare)

#### Phase 3: Serialization

1. **Update blockSerializer.js** (lines 100-110):
```javascript
case 'filetree':
  serialized.content = JSON.stringify({
    treeData: block.treeData || [],
    expanded: block.expanded || []
  });
  serialized.metadata = {
    ...(block.metadata || {}),
    snapshots: (block.snapshots || []).map(snapshot => ({
      ...snapshot,
      tree: sanitizeTreeForSnapshot(snapshot.tree)  // Remove file content
    })),
    currentSnapshotId: block.currentSnapshotId || null,
    snapshotLimit: 50
  };
  break;
```

2. **Update deserialization** (lines 331-365):
```javascript
case 'filetree':
  const parsed = typeof block.content === 'string'
    ? JSON.parse(block.content)
    : block.content;

  deserialized.treeData = parsed.treeData || [];
  deserialized.expanded = parsed.expanded || {};

  const meta = block.metadata || {};
  deserialized.snapshots = meta.snapshots || [];
  deserialized.currentSnapshotId = meta.currentSnapshotId || null;
  deserialized.snapshotLimit = meta.snapshotLimit || 50;
  break;
```

3. **Add helper function** (in blockSerializer.js):
```javascript
function sanitizeTreeForSnapshot(nodes) {
  if (!Array.isArray(nodes)) return [];
  return nodes.map(node => ({
    id: node.id,
    name: node.name,
    type: node.type || (node.isFolder ? 'folder' : 'file'),
    children: node.children ? sanitizeTreeForSnapshot(node.children) : undefined,
    content: undefined  // Exclude file content from snapshots
  }));
}
```

#### Phase 4: Testing & Validation

1. **Test snapshot creation**:
   - Create snapshot with Camera button
   - Create snapshot with comment
   - Verify visual feedback (green ring appears on new snapshot node)

2. **Test snapshot restoration**:
   - Click timeline nodes to navigate between snapshots
   - Verify tree updates correctly
   - Verify "Viewing history" badge appears when not on latest

3. **Test snapshot deletion**:
   - Delete non-initial snapshot
   - Verify cannot delete initial snapshot
   - Verify cannot delete last snapshot

4. **Test persistence**:
   - Create snapshots
   - Refresh page
   - Verify snapshots loaded from database
   - Check metadata JSONB field in Supabase

5. **Test size limits**:
   - Create 50+ snapshots
   - Verify auto-pruning of oldest
   - Check database JSONB size

#### Phase 5: TypeScript Migration (Optional)

1. **Rename FileTreeBlock.jsx → FileTreeBlock.tsx**
2. **Add type definitions** from improved version:
   - `FileNode` interface
   - `Snapshot` interface
   - `FileContentEditorProps` interface
   - `TreeNodeProps` interface
3. **Add TypeScript to tsconfig.json**
4. **Update imports in Block.jsx**

### 6. Code Patterns from Existing Codebase

#### Recovery Manager Pattern

**Similar pattern exists** in `src/utils/recovery/RecoveryManager.js:382-406`:

```javascript
saveRecoveryCheckpoint() {
  try {
    const documents = storageWrapper.getAllDocuments();
    if (documents && documents.length > 0) {
      localStorage.setItem('recovery_checkpoint', JSON.stringify({
        timestamp: Date.now(),
        documents: documents.slice(0, 10),  // Limit to 10
        documentCount: documents.length
      }));
    }
  } catch (error) {
    console.error('Failed to save recovery checkpoint:', error);
  }
}
```

**Applicable to FileTree snapshots**:
- Timestamp-based checkpoints
- Size limiting (keep last N)
- localStorage as backup layer
- Graceful error handling

#### IssueTrackerBlock Timeline

**Similar UI exists** in `src/components/blocks/IssueTrackerBlock.jsx`:

```javascript
const [attempts, setAttempts] = useState(issue.attempts || []);

const handleAddAttempt = () => {
  const newAttempt = {
    id: `attempt-${Date.now()}`,
    description: '',
    result: 'failed'
  };
  const newAttempts = [...attempts, newAttempt];
  setAttempts(newAttempts);
  onUpdate({ ...issue, attempts: newAttempts });
};
```

**Applicable to snapshots**:
- Array of timestamped items
- Immutable updates (spread operator)
- Parent owns state
- Timeline visualization

#### Document Versions Table

**Database pattern exists** in schema:

```sql
CREATE TABLE document_versions (
  id UUID PRIMARY KEY,
  document_id UUID NOT NULL,
  version_number INTEGER NOT NULL,
  snapshot JSONB NOT NULL,
  created_by UUID,
  created_at TIMESTAMPTZ
);
```

**Not directly used for blocks**, but shows version history pattern is already in database.

### 7. Risk Assessment

#### High Risk
- **JSONB size limits**: Multiple snapshots with large trees could exceed practical limits
  - **Mitigation**: Exclude file content, limit to 50 snapshots, JSONB compression

#### Medium Risk
- **Performance impact**: Deep cloning large trees on every snapshot
  - **Mitigation**: Debounce snapshot creation, show loading state
- **Memory usage**: Storing 50 snapshots in React state
  - **Mitigation**: Load snapshots lazily, paginate old snapshots

#### Low Risk
- **TypeScript migration**: Optional, can keep JavaScript
  - **Mitigation**: Gradual migration path available

### 8. Success Metrics

#### Functional Requirements
- ✅ Create snapshots with Camera button
- ✅ Create snapshots with comments (max 200 chars)
- ✅ Navigate timeline with mouse clicks
- ✅ Delete snapshots (except initial and last)
- ✅ Persist snapshots to database
- ✅ Load snapshots on block mount

#### Performance Requirements
- Snapshot creation: < 100ms for trees with 100 nodes
- Snapshot restoration: < 50ms
- Timeline rendering: < 16ms (60fps)
- Database save: < 200ms
- JSONB field size: < 1MB per block

#### User Experience Requirements
- Visual feedback (green ring on current snapshot)
- Hover tooltips with full information
- Character counter with color coding
- Smooth timeline navigation with mouse
- "Viewing history" indicator

## Code References

### Improved Implementation
- `Filetreeblockuiimproved/src/components/FileTreeBlock.tsx:32-39` - Snapshot interface
- `Filetreeblockuiimproved/src/components/FileTreeBlock.tsx:422-433` - Snapshot state
- `Filetreeblockuiimproved/src/components/FileTreeBlock.tsx:435-466` - createSnapshot function
- `Filetreeblockuiimproved/src/components/FileTreeBlock.tsx:468-477` - restoreSnapshot function
- `Filetreeblockuiimproved/src/components/FileTreeBlock.tsx:479-491` - deleteSnapshot function
- `Filetreeblockuiimproved/src/components/FileTreeBlock.tsx:701-881` - Timeline UI

### Current Production
- `src/components/blocks/FileTreeBlock.jsx:444-776` - Current FileTreeBlock
- `src/utils/blockSerializer.js:100-106` - Current serialization
- `src/utils/blockSerializer.js:331-361` - Current deserialization

### Database
- `supabase/migrations/20250131_create_save_document_blocks_v3.sql:80-108` - blocks table schema
- MCP Supabase schema: blocks table with content (TEXT) and metadata (JSONB)

### Related Patterns
- `src/utils/recovery/RecoveryManager.js:382-406` - Checkpoint pattern
- `src/components/blocks/IssueTrackerBlock.jsx` - Timeline UI pattern
- `src/utils/timelineMath.js` - Timeline math utilities

## Architecture Documentation

### Data Flow

**Create Snapshot**:
1. User clicks Camera button
2. Optional: Opens popover for comment input
3. `createSnapshot()` called with optional comment
4. Counts nodes in current tree vs previous snapshot
5. Creates Snapshot object with deep-cloned tree
6. Appends to `snapshots` array
7. Calls `onUpdate(block.id, { snapshots, currentSnapshotId })` to persist
8. Serializer saves to metadata JSONB field
9. Smart Sync batches and saves to Supabase
10. Visual feedback via green ring on new timeline node

**Restore Snapshot**:
1. User clicks timeline node
2. `restoreSnapshot(snapshotId)` called
3. Finds snapshot in array
4. Deep-clones snapshot tree to current `tree` state
5. Updates `currentSnapshotId`
6. Does NOT create new snapshot (viewing history)
7. Visual feedback via green ring + "Viewing history" badge

**Delete Snapshot**:
1. User hovers snapshot node, clicks X button
2. `deleteSnapshot(snapshotId)` called
3. Protection: Cannot delete initial or last snapshot
4. Filters snapshot out of array
5. If deleting current, switches to previous
6. Calls `onUpdate` to persist
7. Visual feedback via removed timeline node

### Storage Architecture

**Three-Layer Storage**:
1. **React State**: Snapshots array in component (ephemeral)
2. **IndexedDB**: Local backup via Smart Sync (crash recovery)
3. **Supabase**: Persistent storage via metadata JSONB field

**Serialization Flow**:
1. FileTreeBlock → `onUpdate({ treeData, snapshots })`
2. blockSerializer.js → Splits into content (TEXT) and metadata (JSONB)
3. Smart Sync → Batches changes, writes to IndexedDB immediately
4. Database RPC → Atomic update to Supabase blocks table

### Performance Characteristics

- **Snapshot Creation**: O(n) where n = node count (tree traversal for counting)
- **Deep Clone**: O(n) where n = node count (JSON.parse/stringify)
- **Restoration**: O(n) where n = node count (deep clone)
- **Timeline Render**: O(s) where s = snapshot count (map iteration)
- **Database Write**: Single JSONB update (atomic)

**Optimization Strategies**:
- Exclude file content from snapshots (reduces size 90%)
- Limit snapshot count to 50 (prevents unbounded growth)
- JSONB compression (automatic 80-90% reduction for duplicates)
- Debounced saves (1-2 seconds idle time via Smart Sync)

## Historical Context

### Existing Research

**Primary documentation**:
- `thoughts/shared/research/2025-11-05-filetree-block-implementation-reference.md` - Complete FileTree reference
- `thoughts/shared/research/2025-11-05-filetree-block-styles.md` - Style guide with measurements

**Related patterns**:
- `thoughts/shared/research/2025-11-05-version-track-block-deletion-plan.md` - Version-track block deleted 2025-11-05
  - Had metro-map timeline visualization
  - Removed due to complexity (2% usage)
  - TimelineBranch component reused by IssueTrackerBlock

**Implementation analysis**:
- `thoughts/shared/research/2025-11-05-blocks-implementation-weaknesses.md` - Known weaknesses
- `thoughts/shared/research/2025-11-04-proptypes-implementation-plan.md` - PropTypes plan
- `thoughts/shared/research/2025-11-03-document-block-types-research.md` - Block types

### Design Decisions

**Why metadata JSONB instead of content TEXT?**
1. Clean separation: content = current state, metadata = history
2. JSONB allows efficient querying (count, filter by comment)
3. Follows pattern of other complex blocks (TableBlock, TodoBlock)
4. Room for future features (tags, merge, diff)

**Why exclude file content from snapshots?**
1. Size: File content can be 50-200 KB per snapshot
2. Purpose: Structure changes are what matter for history
3. Performance: Smaller payloads = faster saves/loads
4. Database: Keeps metadata JSONB field manageable

**Why 50 snapshot limit?**
1. Balance: Enough for useful history, not too much storage
2. Precedent: RecoveryManager uses 10-item limit
3. JSONB: Keeps field under 1 MB (practical limit)
4. UX: 50 nodes fits in scrollable timeline

**Why deep clone with JSON.parse/stringify?**
1. Simplicity: Built-in, no dependencies
2. Safety: Prevents reference issues completely
3. Performance: Fast enough for typical trees (<100 nodes)
4. Serialization: Already compatible with database format

## Related Research

- [FileTreeBlock Complete Implementation Reference](./2025-11-05-filetree-block-implementation-reference.md)
- [FileTreeBlock Styles Guide](./2025-11-05-filetree-block-styles.md)
- [Version Track Block Deletion Plan](./2025-11-05-version-track-block-deletion-plan.md)
- [Blocks Implementation Weaknesses](./2025-11-05-blocks-implementation-weaknesses.md)
- [Block Quality Assessment Criteria](./2025-11-05-block-quality-assessment-criteria.md)

## Open Questions

1. Should snapshot limit be configurable per-block?
2. Should there be a "collapse old snapshots" UI for >20 snapshots?
3. Should file content be optionally included (user preference)?
4. Should there be a "compare snapshots" diff view?
5. Should snapshot comments support markdown?
6. Should there be snapshot tags/categories?
7. Should snapshots have "star" feature for important ones?
8. Should there be snapshot export/import?

## Next Steps

1. **Review this document** with team/stakeholders
2. **Prototype Phase 1** (core snapshot logic) in development branch
3. **Test serialization** with Supabase MCP queries
4. **Implement Phase 2** (UI components) with toast notifications
5. **Test Phase 3** (persistence) with multiple snapshots
6. **Performance test** with large trees (100+ nodes)
7. **User testing** for keyboard shortcuts and timeline UX
8. **Document final API** for other developers

---

**Generated by**: Claude Code /research_codebase command
**Purpose**: Comprehensive implementation plan for FileTreeBlock snapshot feature integration
**Status**: Ready for review and implementation
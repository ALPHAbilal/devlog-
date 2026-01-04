# Phase 5: Component Decomposition

> **Goal**: Break ExpandedViewEnhanced.jsx (2,588 lines) into focused components (<400 lines each).

**Status**: EXECUTABLE PLAN - Ready for implementation

---

## Best Practices for This Phase

### Extraction Order Rules
1. **Hooks before components** - Extract logic first, then UI
2. **Leaf before root** - Extract dependencies before dependents
3. **One extraction per commit** - Atomic, reversible changes
4. **Test after each extraction** - Never batch extractions without testing
5. **No behavior changes during extraction** - Pure relocation only

### Hook Extraction Rules
1. **Single responsibility** - Each hook does ONE thing
2. **Return object, not array** - `{ title, setTitle }` not `[title, setTitle]`
3. **Prefix with use** - `useDocumentState` not `documentState`
4. **No UI in hooks** - Hooks return data, components render
5. **Dependency injection** - Pass dependencies as params, don't import

### Component Extraction Rules
1. **Props interface first** - Define types before extracting
2. **Minimal props** - Only pass what's needed
3. **No prop drilling** - Use composition or context if >2 levels
4. **Children over config** - Prefer `<Slot>` patterns over prop objects
5. **Default exports for components** - Named exports for hooks

### Size Guidelines
1. **<400 lines per file** - Hard limit
2. **<200 lines ideal** - Soft target
3. **<10 props per component** - Refactor if exceeding
4. **<5 hooks per component** - Extract to custom hook if exceeding
5. **<3 levels of nesting** - Flatten with early returns

### Testing During Extraction
1. **Snapshot before extraction** - Know what you're preserving
2. **Manual test after each extraction** - Don't rely only on type checking
3. **Verify no behavior change** - Same inputs → same outputs
4. **Test edge cases explicitly** - They're easy to lose during extraction
5. **Integration test at end** - Full flow after all extractions

### Dependency Management
1. **No circular imports** - Use dependency injection
2. **Imports flow down** - Orchestrator imports hooks, not reverse
3. **Check import graph** - Run `depcruise` after each extraction
4. **Shared code goes to shared/** - Not duplicated in features/

---

## Objectives

1. Extract custom hooks from ExpandedViewEnhanced
2. Extract sub-components
3. Create feature slices for block operations
4. Ensure each file is <400 lines
5. Maintain all existing functionality

---

## Current File Analysis

**Source**: `src/components/ExpandedViewEnhanced.jsx` (2,588 lines)

| Section | Lines | Size | Description |
|---------|-------|------|-------------|
| Imports | 1-26 | 26 | React, Lucide, Virtuoso, components |
| Props + stableEntry | 28-66 | 38 | Props destructuring, entry stabilization |
| Analytics hooks | 68-82 | 14 | useAnalytics, useDocumentAnalytics |
| Block loader selection | 84-171 | 87 | usePaginatedBlockLoader, useOptimizedBlockLoader |
| Blocks memoization | 173-213 | 40 | blocks = useMemo(() => loadedBlocks) |
| Local state declarations | 214-255 | 41 | ~40 useState calls |
| Debug effects | 256-299 | 43 | Render tracking, ref syncs |
| BlockRenderer (inline) | 301-436 | 135 | Memoized block renderer component |
| Entry sync effects | 439-519 | 80 | Title/tags sync, SmartSync init |
| **updateBlock** | 546-871 | **325** | Core block update logic |
| **deleteBlock** | 873-954 | **82** | Block deletion logic |
| duplicateBlock | 956-1004 | 48 | Block duplication |
| **moveBlock** | 1006-1118 | **112** | Block move up/down |
| renderBlockItem | 1124-1166 | 42 | Virtuoso item renderer |
| **Drag/drop handlers** | 1168-1321 | **153** | Auto-scroll, drag handlers |
| **convertBlock** | 1323-1378 | **55** | Block type conversion |
| **addBlock** | 1380-1596 | **216** | New block creation |
| handleAddBelowBlock | 1598-1709 | 111 | Add block below |
| handleAddAtEnd | 1711-1717 | 6 | Add at end |
| handleInlineBlockAdd | 1719-1812 | 93 | Inline block addition |
| saveWithStatus | 1814-1829 | 15 | Save helper |
| handleTitleSave | 1831-1841 | 10 | Title save |
| **Tag management** | 1844-1876 | **32** | addTag, updateTag, deleteTag |
| handleBackgroundClick | 1879-1895 | 16 | Focus clearing |
| handleLinesScroll | 1897-1909 | 12 | Lines view scroll |
| Scroll effects | 1911-1931 | 20 | Scroll to top, infinite scroll |
| **JSX Return** | 1933-2564 | **631** | All UI rendering |
| Memo wrapper | 2567-2588 | 21 | Component memo |

**Largest sections to extract**:
- JSX Return: 631 lines → Split into 5-6 components
- updateBlock: 325 lines → Part of useBlockOperations
- addBlock: 216 lines → Part of useBlockOperations
- Drag/drop: 153 lines → useDragDrop hook

---

## Gap 1: Hook File Specifications

### Hook 1: useDocumentState

**File**: `src/features/document/hooks/use-document-state.ts`

**Lines to extract**: 28-66 (stableEntry), 225-232 (title/tags state), 439-446 (sync effect), 539-543 (backlinks)

**TypeScript Interface**:
```typescript
// src/features/document/hooks/use-document-state.ts

interface DocumentEntry {
  id: string | null;
  title: string;
  tags: string[];
  blocks: BlockData[];
  blockCount: number;
  created_at: string | null;
  updated_at: string | null;
  user_id: string | null;
  folder_id: string | null;
}

interface UseDocumentStateOptions {
  entry: DocumentEntry | null;
  allEntries: DocumentEntry[];
}

interface UseDocumentStateReturn {
  // Stabilized entry (prevents re-renders from parent reference changes)
  stableEntry: DocumentEntry;

  // Title state
  title: string;
  setTitle: (title: string) => void;
  isEditingTitle: boolean;
  setIsEditingTitle: (editing: boolean) => void;

  // Tags state
  tags: string[];
  setTags: (tags: string[]) => void;

  // Backlinks (computed)
  backlinks: BacklinkEntry[];
}

export function useDocumentState(options: UseDocumentStateOptions): UseDocumentStateReturn;
```

**Dependencies to inject**:
- `entry` - Document entry from props
- `allEntries` - All documents for backlink calculation

**Skeleton**:
```typescript
export function useDocumentState({ entry, allEntries }: UseDocumentStateOptions): UseDocumentStateReturn {
  // Stabilize entry to prevent re-renders
  const stableEntry = useMemo(() => {
    if (!entry || !entry.id) {
      return { id: null, title: '', tags: [], blocks: [], blockCount: 0, ... };
    }
    return { ...entry };
  }, [entry?.id, entry?.title, ...]);

  // Title state
  const [title, setTitle] = useState(entry?.title || '');
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  // Tags state
  const [tags, setTags] = useState(entry?.tags || []);

  // Sync title/tags when entry changes
  useEffect(() => {
    if (!entry) return;
    setTitle(entry.title || '');
    setTags(entry.tags || []);
  }, [entry?.id, entry?.title, entry?.tags]);

  // Calculate backlinks
  const [backlinks, setBacklinks] = useState<BacklinkEntry[]>([]);
  useEffect(() => {
    const links = getBacklinks(entry?.title || '', allEntries);
    setBacklinks(links);
  }, [entry?.title, allEntries]);

  return { stableEntry, title, setTitle, isEditingTitle, setIsEditingTitle, tags, setTags, backlinks };
}
```

**Expected size**: ~80 lines

---

### Hook 2: useBlockOperations

**File**: `src/features/document/hooks/use-block-operations.ts`

**Lines to extract**: 546-871 (updateBlock), 873-954 (deleteBlock), 956-1004 (duplicateBlock), 1323-1378 (convertBlock), 1380-1596 (addBlock)

**TypeScript Interface**:
```typescript
// src/features/document/hooks/use-block-operations.ts

interface UseBlockOperationsOptions {
  documentId: string | null;
  blocks: BlockData[];
  blocksRef: React.MutableRefObject<BlockData[]>;
  loadedBlocksRef: React.MutableRefObject<BlockData[]>;
  updateSingleBlock: (id: string, updates: Partial<BlockData>) => void;
  updateLoadedBlocks: (blocks: BlockData[]) => void;
  setBlocksDirectly: (blocks: BlockData[]) => void;
  removeBlock: (id: string) => void;
  smartSyncManagerRef: React.MutableRefObject<SmartSyncManager | null>;
  isInitialLoadRef: React.MutableRefObject<boolean>;
  trackEvent: (name: string, data: Record<string, unknown>) => void;
}

interface UseBlockOperationsReturn {
  // CRUD operations
  updateBlock: (blockId: string, updates: Partial<BlockData>) => void;
  deleteBlock: (blockId: string) => void;
  duplicateBlock: (blockId: string) => void;
  convertBlock: (blockId: string, newType: BlockType, meta?: Record<string, unknown>) => void;
  addBlock: (type: BlockType, afterBlockId?: string | null) => void;

  // Inline operations
  handleAddBelowBlock: (blockIdOrData: string | BlockData) => void;
  handleAddAtEnd: () => void;
  handleInlineBlockAdd: (blockIndex: number, data: string | BlockData) => void;

  // Selector state (for AddBlockRow)
  showBlockSelector: boolean;
  setShowBlockSelector: (show: boolean) => void;
  selectorPosition: string | null;
  setSelectorPosition: (position: string | null) => void;

  // Refs for BlockRenderer
  showBlockSelectorRef: React.MutableRefObject<boolean>;
  selectorPositionRef: React.MutableRefObject<string | null>;
  addBlockRef: React.MutableRefObject<((type: BlockType, afterBlockId?: string | null) => void) | null>;
}

export function useBlockOperations(options: UseBlockOperationsOptions): UseBlockOperationsReturn;
```

**Dependencies to inject**:
- `documentId` - Current document ID
- `blocks` - Current blocks array
- `blocksRef`, `loadedBlocksRef` - Refs for avoiding stale closures
- `updateSingleBlock`, `updateLoadedBlocks`, `setBlocksDirectly`, `removeBlock` - From loader
- `smartSyncManagerRef` - SmartSync for persistence
- `isInitialLoadRef` - To skip saves during initial load
- `trackEvent` - Analytics

**Expected size**: ~350 lines (largest hook, but contains all block CRUD - could split further if needed)

---

### Hook 3: useDragDrop

**File**: `src/features/document/hooks/use-drag-drop.ts`

**Lines to extract**: 234-236 (state), 1168-1321 (handlers)

**TypeScript Interface**:
```typescript
// src/features/document/hooks/use-drag-drop.ts

interface UseDragDropOptions {
  blocks: BlockData[];
  blocksRef: React.MutableRefObject<BlockData[]>;
  updateLoadedBlocks: (blocks: BlockData[]) => void;
  smartSyncManagerRef: React.MutableRefObject<SmartSyncManager | null>;
  scrollContainerRef: React.RefObject<HTMLElement | null>;
}

interface UseDragDropReturn {
  // Drag state
  draggedBlockId: string | null;
  setDraggedBlockId: (id: string | null) => void;
  dropTargetId: string | null;
  setDropTargetId: (id: string | null) => void;
  dropPosition: 'before' | 'after';
  setDropPosition: (position: 'before' | 'after') => void;

  // Handlers (to pass to Block components)
  handleDragStart: (blockId: string) => void;
  handleDragEnd: () => void;
  handleDragOver: (e: React.DragEvent, blockId: string) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (draggedId: string, targetId: string) => void;
}

export function useDragDrop(options: UseDragDropOptions): UseDragDropReturn;
```

**Dependencies to inject**:
- `blocks` - For finding block indices
- `blocksRef` - To avoid stale closures
- `updateLoadedBlocks` - To update block order
- `smartSyncManagerRef` - For REORDER persistence
- `scrollContainerRef` - For auto-scroll during drag

**Expected size**: ~150 lines

---

### Hook 4: useBlockSync

**File**: `src/features/document/hooks/use-block-sync.ts`

**Lines to extract**: 451-485 (SmartSync init), scattered sync calls throughout

**TypeScript Interface**:
```typescript
// src/features/document/hooks/use-block-sync.ts

interface UseBlockSyncOptions {
  documentId: string | null;
  entry: DocumentEntry | null;
}

interface UseBlockSyncReturn {
  // SmartSync manager ref
  smartSyncManagerRef: React.MutableRefObject<SmartSyncManager | null>;

  // Initial load tracking
  isInitialLoadRef: React.MutableRefObject<boolean>;

  // Sync operations
  syncBlock: (blockId: string, content: string, action: SyncAction, type: BlockType, position: number, metadata?: BlockMetadata) => Promise<void>;
  forceSync: () => Promise<void>;
}

export function useBlockSync(options: UseBlockSyncOptions): UseBlockSyncReturn;
```

**Dependencies to inject**:
- `documentId` - Current document ID
- `entry` - Entry metadata for initial load detection

**Expected size**: ~80 lines

---

### Hook 5: useBlockMove

**File**: `src/features/document/hooks/use-block-move.ts`

**Lines to extract**: 1006-1118 (moveBlock), 1121-1122 (handleMoveUp/Down)

**TypeScript Interface**:
```typescript
// src/features/document/hooks/use-block-move.ts

interface UseBlockMoveOptions {
  blocksRef: React.MutableRefObject<BlockData[]>;
  updateLoadedBlocks: (blocks: BlockData[]) => void;
  smartSyncManagerRef: React.MutableRefObject<SmartSyncManager | null>;
}

interface UseBlockMoveReturn {
  moveBlock: (blockId: string, direction: 'up' | 'down') => void;
  handleMoveUp: (blockId: string) => void;
  handleMoveDown: (blockId: string) => void;
}

export function useBlockMove(options: UseBlockMoveOptions): UseBlockMoveReturn;
```

**Dependencies to inject**:
- `blocksRef` - To avoid stale closures
- `updateLoadedBlocks` - To update block order
- `smartSyncManagerRef` - For REORDER persistence

**Expected size**: ~100 lines

---

### Hook 6: useTagOperations

**File**: `src/features/document/hooks/use-tag-operations.ts`

**Lines to extract**: 1844-1876 (addTag, updateTag, deleteTag), 230-233 (tag editing state)

**TypeScript Interface**:
```typescript
// src/features/document/hooks/use-tag-operations.ts

interface UseTagOperationsOptions {
  tags: string[];
  setTags: (tags: string[]) => void;
  onUpdate: ((id: string, updates: Partial<DocumentEntry>) => Promise<void>) | undefined;
  entryId: string | null;
}

interface UseTagOperationsReturn {
  // Tag editing state
  isAddingTag: boolean;
  setIsAddingTag: (adding: boolean) => void;
  newTag: string;
  setNewTag: (tag: string) => void;
  editingTagIndex: number | null;
  setEditingTagIndex: (index: number | null) => void;
  editingTagValue: string;
  setEditingTagValue: (value: string) => void;

  // Tag operations
  addTag: () => Promise<void>;
  updateTag: (index: number, value: string) => Promise<void>;
  deleteTag: (index: number) => Promise<void>;
}

export function useTagOperations(options: UseTagOperationsOptions): UseTagOperationsReturn;
```

**Expected size**: ~60 lines

---

## Gap 2: Component File Specifications

### Component 1: TitleEditor

**File**: `src/components/DocumentEditor/TitleEditor.tsx`

**Lines to extract**: 2042-2063

**Props Interface**:
```typescript
interface TitleEditorProps {
  title: string;
  isEditing: boolean;
  onTitleChange: (title: string) => void;
  onStartEditing: () => void;
  onSave: () => void;
}
```

**JSX Template**:
```tsx
export function TitleEditor({ title, isEditing, onTitleChange, onStartEditing, onSave }: TitleEditorProps) {
  if (isEditing) {
    return (
      <input
        type="text"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        onBlur={onSave}
        onKeyDown={(e) => e.key === 'Enter' && onSave()}
        className="text-text-primary text-2xl font-medium bg-transparent border-b..."
        autoFocus
      />
    );
  }

  return (
    <h1 onClick={onStartEditing} className="text-text-primary text-2xl font-medium cursor-text...">
      {title}
    </h1>
  );
}
```

**Expected size**: ~35 lines

---

### Component 2: TagManager

**File**: `src/components/DocumentEditor/TagManager.tsx`

**Lines to extract**: 2239-2334

**Props Interface**:
```typescript
interface TagManagerProps {
  tags: string[];
  isMobileView: boolean;
  // Tag editing state
  isAddingTag: boolean;
  newTag: string;
  editingTagIndex: number | null;
  editingTagValue: string;
  // Callbacks
  onAddTag: () => void;
  onUpdateTag: (index: number, value: string) => void;
  onDeleteTag: (index: number) => void;
  onSetIsAddingTag: (adding: boolean) => void;
  onSetNewTag: (tag: string) => void;
  onSetEditingTagIndex: (index: number | null) => void;
  onSetEditingTagValue: (value: string) => void;
}
```

**Expected size**: ~95 lines

---

### Component 3: BacklinksSection

**File**: `src/components/DocumentEditor/BacklinksSection.tsx`

**Lines to extract**: 2336-2368

**Props Interface**:
```typescript
interface BacklinkEntry {
  id: string;
  title: string;
  preview: string;
}

interface BacklinksSectionProps {
  backlinks: BacklinkEntry[];
  isMobileView: boolean;
  onNavigateToDocument: (title: string) => void;
}
```

**Expected size**: ~35 lines

---

### Component 4: DeleteConfirmation

**File**: `src/components/DocumentEditor/DeleteConfirmation.tsx`

**Lines to extract**: 2371-2541 (both mobile and desktop versions)

**Props Interface**:
```typescript
interface DeleteConfirmationProps {
  isOpen: boolean;
  isMobileView: boolean;
  title: string;
  isDeleting: boolean;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}
```

**Expected size**: ~170 lines (includes both mobile bottom sheet and desktop modal)

---

### Component 5: ViewModeToggle

**File**: `src/components/DocumentEditor/ViewModeToggle.tsx`

**Lines to extract**: 2004-2039

**Props Interface**:
```typescript
type ViewMode = 'blocks' | 'lines';

interface ViewModeToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}
```

**Expected size**: ~40 lines

---

### Component 6: HeaderControls

**File**: `src/components/DocumentEditor/HeaderControls.tsx`

**Lines to extract**: 1956-2066 (entire header section)

**Props Interface**:
```typescript
interface HeaderControlsProps {
  // Document metadata
  title: string;
  isEditingTitle: boolean;

  // View mode
  viewMode: 'blocks' | 'lines';
  onViewModeChange: (mode: 'blocks' | 'lines') => void;

  // Progress (for large documents)
  shouldUsePagination: boolean;
  progress: { loaded: number; total: number; percentage: number } | null;

  // Callbacks
  onTitleChange: (title: string) => void;
  onStartEditingTitle: () => void;
  onSaveTitle: () => void;
  onShare: () => void;
  onDelete: () => void;

  // Sync status (passed to SyncStatusIndicator)
  documentId: string | null;
  syncManagerRef: React.MutableRefObject<SmartSyncManager | null>;
}
```

**Expected size**: ~110 lines

---

### Component 7: BlockListView

**File**: `src/components/DocumentEditor/BlockListView.tsx`

**Lines to extract**: 2121-2236 (Virtuoso block list)

**Props Interface**:
```typescript
interface BlockListViewProps {
  blocks: BlockData[];
  isLoadingBlocks: boolean;
  isMobileView: boolean;

  // Virtuoso config
  scrollContainerRef: React.RefObject<HTMLElement | null>;
  computeItemKey: (index: number, block: BlockData) => string;
  renderBlockItem: (index: number, block: BlockData) => React.ReactNode;

  // Pagination (for large documents)
  shouldUsePagination: boolean;
  hasMore: boolean;
  isLoadingMore: boolean;
  loadMore: () => void;
  progress: { loaded: number; total: number; percentage: number } | null;

  // Add block at end
  showBlockSelector: boolean;
  selectorPosition: string | null;
  onAddAtEnd: () => void;
  onAddBlock: (type: BlockType) => void;
  onCloseSelector: () => void;
}
```

**Expected size**: ~115 lines

---

### Component 8: LinesView

**File**: `src/components/DocumentEditor/LinesView.tsx`

**Lines to extract**: 2069-2120

**Props Interface**:
```typescript
interface LinesViewProps {
  blocks: BlockData[];
  isMobileView: boolean;
  selectedLineBlockId: string | null;
  onSelectLine: (blockId: string) => void;
  onSwitchToBlocksView: (blockId: string) => void;
}
```

**Expected size**: ~55 lines

---

### Component 9: BlockRenderer (extract from inline)

**File**: `src/components/DocumentEditor/BlockRenderer.tsx`

**Lines to extract**: 301-436 (currently inline memo component)

**Props Interface**:
```typescript
interface BlockRendererProps {
  block: BlockData;
  index: number;
  isMobileView: boolean;
  isBlockFocused: boolean | null;
  isShowingSelector: boolean;
  draggedBlockId: string | null;
  dropTargetId: string | null;
  dropPosition: 'before' | 'after';

  // Callbacks (from useBlockOperations)
  onUpdate: (blockId: string, updates: Partial<BlockData>) => void;
  onDelete: (blockId: string) => void;
  onDuplicate: (blockId: string) => void;
  onMoveUp: (blockId: string) => void;
  onMoveDown: (blockId: string) => void;
  onConvert: (blockId: string, newType: BlockType, meta?: Record<string, unknown>) => void;
  onInlineAdd: (index: number, data: string | BlockData) => void;
  onAddBlock: (type: BlockType, afterBlockId: string) => void;
  onCloseSelector: () => void;
  onFocus: (blockId: string | null) => void;

  // Drag handlers
  onDragStart: (blockId: string) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent, blockId: string) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (draggedId: string, targetId: string) => void;

  // Refs
  blocksRef: React.MutableRefObject<BlockData[]>;
}
```

**Expected size**: ~135 lines

---

## Gap 6: Numbered Execution Order

### Phase 5A: Hook Extractions (Steps 1-7) ✅ COMPLETE

| Step | Extract | File Created | Lines Remaining | Verify |
|------|---------|--------------|-----------------|--------|
| **1** ✅ | useDocumentState | `src/features/document/hooks/use-document-state.ts` | ~2,510 | `npm run typecheck` |
| **2** ✅ | useTagOperations | `src/features/document/hooks/use-tag-operations.ts` | ~2,450 | `npm run typecheck` |
| **3** ✅ | useBlockSync | `src/features/document/hooks/use-block-sync.ts` | ~2,370 | `npm run typecheck` |
| **4** ✅ | useBlockMove | `src/features/document/hooks/use-block-move.ts` | ~2,270 | `npm run typecheck` |
| **5** ✅ | useDragDrop | `src/features/document/hooks/use-drag-drop.ts` | ~2,120 | `npm run typecheck` |
| **6** ✅ | useBlockOperations | `src/features/document/hooks/use-block-operations.ts` | ~1,770 | `npm run typecheck` |
| **7** ✅ | Update barrel file | `src/features/document/index.ts` | 1,770 | `npm run lint` |

> **Completed 2025-01-04**: All hooks extracted and TypeScript compiles. Build succeeds.

### Phase 5B: Component Extractions (Steps 8-16) ✅ COMPLETE

| Step | Extract | File Created | Lines Remaining | Verify |
|------|---------|--------------|-----------------|--------|
| **8** ✅ | TitleEditor | `src/components/DocumentEditor/TitleEditor.tsx` | ~1,735 | `npm run typecheck` |
| **9** ✅ | ViewModeToggle | `src/components/DocumentEditor/ViewModeToggle.tsx` | ~1,695 | `npm run typecheck` |
| **10** ✅ | TagManager | `src/components/DocumentEditor/TagManager.tsx` | ~1,600 | `npm run typecheck` |
| **11** ✅ | BacklinksSection | `src/components/DocumentEditor/BacklinksSection.tsx` | ~1,565 | `npm run typecheck` |
| **12** ✅ | DeleteConfirmation | `src/components/DocumentEditor/DeleteConfirmation.tsx` | ~1,395 | `npm run typecheck` |
| **13** ✅ | LinesView | `src/components/DocumentEditor/LinesView.tsx` | ~1,340 | `npm run typecheck` |
| **14** ✅ | BlockRenderer | `src/components/DocumentEditor/BlockRenderer.tsx` | ~1,205 | `npm run typecheck` |
| **15** ✅ | BlockListView | `src/components/DocumentEditor/BlockListView.tsx` | ~1,090 | `npm run typecheck` |
| **16** ✅ | HeaderControls | `src/components/DocumentEditor/HeaderControls.tsx` | ~980 | `npm run typecheck` |

> **Completed 2025-01-04**: All 9 components extracted. TypeScript compiles. Build succeeds.

### Phase 5C: Orchestrator Creation (Steps 17-20)

| Step | Action | File | Lines Remaining | Verify |
|------|--------|------|-----------------|--------|
| **17** ✅ | Create DocumentEditor orchestrator | `src/components/DocumentEditor/DocumentEditor.tsx` | ~200 | `npm run typecheck` |
| **18** ✅ | Create barrel file | `src/components/DocumentEditor/index.ts` | N/A | `npm run lint` |
| **19** ✅ | Update imports in consumers | Dashboard.jsx, DocumentPage.jsx, MobileDocumentViewer.jsx | N/A | `npm run build` |
| **20** | Delete old ExpandedViewEnhanced.jsx | (or rename to .bak) | 0 | `npm run build && npm run test` |

> **Completed 2025-01-04**: Steps 17-19 complete. DocumentEditor orchestrator created (295 lines). All consumers updated. Build succeeds. Step 20 (delete old file) deferred pending integration testing.

---

## Gap 3: ExpandedViewEnhanced.jsx Modification Steps

### Step 1: Extract useDocumentState
```
Remove: Lines 28-66, 225-232, 439-446, 539-543
Add import: import { useDocumentState } from '@/features/document';
Replace with: const { stableEntry, title, setTitle, isEditingTitle, setIsEditingTitle, tags, setTags, backlinks } = useDocumentState({ entry, allEntries });

Git commit: "refactor(document): extract useDocumentState hook"
```

### Step 2: Extract useTagOperations
```
Remove: Lines 230-233, 1844-1876
Add import: import { useTagOperations } from '@/features/document';
Replace with: const { isAddingTag, setIsAddingTag, newTag, setNewTag, editingTagIndex, setEditingTagIndex, editingTagValue, setEditingTagValue, addTag, updateTag, deleteTag } = useTagOperations({ tags, setTags, onUpdate, entryId: entry?.id });

Git commit: "refactor(document): extract useTagOperations hook"
```

### Step 3: Extract useBlockSync
```
Remove: Lines 251-254, 451-485
Add import: import { useBlockSync } from '@/features/document';
Replace with: const { smartSyncManagerRef, isInitialLoadRef, syncBlock, forceSync } = useBlockSync({ documentId: entry?.id, entry });

Git commit: "refactor(document): extract useBlockSync hook"
```

### Step 4: Extract useBlockMove
```
Remove: Lines 1006-1122
Add import: import { useBlockMove } from '@/features/document';
Replace with: const { moveBlock, handleMoveUp, handleMoveDown } = useBlockMove({ blocksRef, updateLoadedBlocks, smartSyncManagerRef });

Git commit: "refactor(document): extract useBlockMove hook"
```

### Step 5: Extract useDragDrop
```
Remove: Lines 234-236, 1168-1321
Add import: import { useDragDrop } from '@/features/document';
Replace with: const { draggedBlockId, setDraggedBlockId, dropTargetId, setDropTargetId, dropPosition, setDropPosition, handleDragStart, handleDragEnd, handleDragOver, handleDragLeave, handleDrop } = useDragDrop({ blocks, blocksRef, updateLoadedBlocks, smartSyncManagerRef, scrollContainerRef });

Git commit: "refactor(document): extract useDragDrop hook"
```

### Step 6: Extract useBlockOperations
```
Remove: Lines 214-224, 546-871, 873-954, 956-1004, 1323-1596, 1598-1812
Add import: import { useBlockOperations } from '@/features/document';
Replace with: const { updateBlock, deleteBlock, duplicateBlock, convertBlock, addBlock, handleAddBelowBlock, handleAddAtEnd, handleInlineBlockAdd, showBlockSelector, setShowBlockSelector, selectorPosition, setSelectorPosition, showBlockSelectorRef, selectorPositionRef, addBlockRef } = useBlockOperations({ ... });

Git commit: "refactor(document): extract useBlockOperations hook"
```

### Steps 8-16: Extract Components (Similar Pattern)
```
Each component extraction follows:
1. Create new file in src/components/DocumentEditor/
2. Define Props interface
3. Copy JSX from ExpandedViewEnhanced.jsx
4. Add import to ExpandedViewEnhanced.jsx
5. Replace JSX with component usage
6. Run npm run typecheck
7. Git commit with format: "refactor(document): extract {ComponentName} component"
```

---

## Gap 4: Barrel File and Import Updates

### New Barrel File: `src/features/document/index.ts`

Add these exports:
```typescript
// ============== Hooks ==============
export { default as useDocumentOrganization } from './hooks/use-organization';
export { useFolders } from './hooks/use-folders';
export { usePaginatedDashboard } from './hooks/use-paginated-dashboard';

// NEW: Document editor hooks
export { useDocumentState } from './hooks/use-document-state';
export { useTagOperations } from './hooks/use-tag-operations';
export { useBlockSync } from './hooks/use-block-sync';
export { useBlockMove } from './hooks/use-block-move';
export { useDragDrop } from './hooks/use-drag-drop';
export { useBlockOperations } from './hooks/use-block-operations';
```

### New Barrel File: `src/components/DocumentEditor/index.ts`

```typescript
// DocumentEditor component exports
export { default as DocumentEditor } from './DocumentEditor';
export { TitleEditor } from './TitleEditor';
export { ViewModeToggle } from './ViewModeToggle';
export { TagManager } from './TagManager';
export { BacklinksSection } from './BacklinksSection';
export { DeleteConfirmation } from './DeleteConfirmation';
export { LinesView } from './LinesView';
export { BlockRenderer } from './BlockRenderer';
export { BlockListView } from './BlockListView';
export { HeaderControls } from './HeaderControls';
```

### Files That Need Import Updates

| File | Current Import | New Import |
|------|----------------|------------|
| `src/pages/Dashboard.jsx` | `import ExpandedView from '../components/ExpandedViewEnhanced'` | `import { DocumentEditor as ExpandedView } from '../components/DocumentEditor'` |
| `src/pages/DocumentPage.jsx` | `import ExpandedViewEnhanced from '../components/ExpandedViewEnhanced'` | `import { DocumentEditor as ExpandedViewEnhanced } from '../components/DocumentEditor'` |
| `src/components/MobileDocumentViewer.jsx` | `import ExpandedViewEnhanced from './ExpandedViewEnhanced'` | `import { DocumentEditor as ExpandedViewEnhanced } from './DocumentEditor'` |

---

## Gap 5: Orchestrator (DocumentEditor.tsx) Specification

**File**: `src/components/DocumentEditor/DocumentEditor.tsx`

**Target size**: ~200 lines

```typescript
// src/components/DocumentEditor/DocumentEditor.tsx

import React, { useRef, useMemo, useCallback, memo } from 'react';
import { Virtuoso } from 'react-virtuoso';

// Hooks from features/document
import {
  useDocumentState,
  useTagOperations,
  useBlockSync,
  useBlockMove,
  useDragDrop,
  useBlockOperations,
} from '@/features/document';

// Hooks from features/block
import {
  useOptimizedBlockLoader,
  usePaginatedBlockLoader,
} from '@/features/block';

// Hooks from features/analytics
import { useAnalytics, useDocumentAnalytics } from '@/features/analytics';

// Local components
import { HeaderControls } from './HeaderControls';
import { BlockListView } from './BlockListView';
import { LinesView } from './LinesView';
import { TagManager } from './TagManager';
import { BacklinksSection } from './BacklinksSection';
import { DeleteConfirmation } from './DeleteConfirmation';
import { BlockRenderer } from './BlockRenderer';

// External components
import { ShareDialogSimple } from '../ShareDialogSimple';
import FloatingControlsTrigger from '../FloatingControlsTrigger';
import ScrollToTop from '../ScrollToTop';

interface DocumentEditorProps {
  entry: DocumentEntry;
  onClose?: () => void;
  onUpdate?: (id: string, updates: Partial<DocumentEntry> | null) => void;
  allEntries?: DocumentEntry[];
  isMobileView?: boolean;
  scrollContainerRef?: React.RefObject<HTMLElement | null>;
  onShowBlockSelector?: () => void;
}

function DocumentEditor({
  entry,
  onClose,
  onUpdate,
  allEntries = [],
  isMobileView = false,
  scrollContainerRef: externalScrollRef,
  onShowBlockSelector,
}: DocumentEditorProps) {
  // Refs
  const internalScrollRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = externalScrollRef || internalScrollRef;
  const blocksRef = useRef<BlockData[]>([]);
  const loadedBlocksRef = useRef<BlockData[]>([]);

  // Analytics
  const { trackEvent } = useAnalytics();
  const { trackDocumentEvent } = useDocumentAnalytics();

  // Document state (title, tags, backlinks, stableEntry)
  const {
    stableEntry,
    title, setTitle, isEditingTitle, setIsEditingTitle,
    tags, setTags,
    backlinks,
  } = useDocumentState({ entry, allEntries });

  // Block loader selection
  const shouldUsePagination = !stableEntry.blocks || stableEntry.blockCount > 50;

  const paginatedLoader = usePaginatedBlockLoader(entry?.id || null, entry, {
    pageSize: 50,
    enableInfiniteScroll: true,
    skip: !shouldUsePagination || !entry?.id,
  });

  const optimizedLoader = useOptimizedBlockLoader(entry?.id || null, entry, {
    skip: shouldUsePagination || !entry?.id,
  });

  const loader = shouldUsePagination ? paginatedLoader : optimizedLoader;
  const { blocks, isLoading, updateSingleBlock, updateLoadedBlocks, setBlocksDirectly, removeBlock, ... } = loader;

  // Sync blocks to refs
  blocksRef.current = blocks;
  loadedBlocksRef.current = blocks;

  // Block sync (SmartSync)
  const { smartSyncManagerRef, isInitialLoadRef } = useBlockSync({
    documentId: entry?.id,
    entry,
  });

  // Tag operations
  const tagOps = useTagOperations({ tags, setTags, onUpdate, entryId: entry?.id });

  // Block move operations
  const { handleMoveUp, handleMoveDown } = useBlockMove({
    blocksRef,
    updateLoadedBlocks,
    smartSyncManagerRef,
  });

  // Drag and drop
  const dragDrop = useDragDrop({
    blocks,
    blocksRef,
    updateLoadedBlocks,
    smartSyncManagerRef,
    scrollContainerRef,
  });

  // Block CRUD operations
  const blockOps = useBlockOperations({
    documentId: entry?.id,
    blocks,
    blocksRef,
    loadedBlocksRef,
    updateSingleBlock,
    updateLoadedBlocks,
    setBlocksDirectly,
    removeBlock,
    smartSyncManagerRef,
    isInitialLoadRef,
    trackEvent,
  });

  // View state
  const [viewMode, setViewMode] = useState<'blocks' | 'lines'>('blocks');
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Memoized Virtuoso callbacks
  const computeItemKey = useCallback((index: number, block: BlockData) => block.id, []);

  const renderBlockItem = useCallback((index: number, block: BlockData) => (
    <BlockRenderer
      block={block}
      index={index}
      isMobileView={isMobileView}
      isBlockFocused={focusedBlockId === block.id}
      isShowingSelector={blockOps.showBlockSelector && blockOps.selectorPosition === block.id}
      draggedBlockId={dragDrop.draggedBlockId}
      dropTargetId={dragDrop.dropTargetId}
      dropPosition={dragDrop.dropPosition}
      onUpdate={blockOps.updateBlock}
      onDelete={blockOps.deleteBlock}
      onDuplicate={blockOps.duplicateBlock}
      onMoveUp={handleMoveUp}
      onMoveDown={handleMoveDown}
      onConvert={blockOps.convertBlock}
      onInlineAdd={blockOps.handleInlineBlockAdd}
      onAddBlock={blockOps.addBlock}
      onCloseSelector={() => blockOps.setShowBlockSelector(false)}
      onFocus={setFocusedBlockId}
      onDragStart={dragDrop.handleDragStart}
      onDragEnd={dragDrop.handleDragEnd}
      onDragOver={dragDrop.handleDragOver}
      onDragLeave={dragDrop.handleDragLeave}
      onDrop={dragDrop.handleDrop}
      blocksRef={blocksRef}
    />
  ), [isMobileView, focusedBlockId, blockOps, dragDrop, handleMoveUp, handleMoveDown]);

  // Delete handler
  const handleDelete = async () => { /* ... */ };

  return (
    <>
      {!isMobileView && (
        <FloatingControlsTrigger
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onShare={() => setShowShareDialog(true)}
          onDelete={() => setShowDeleteConfirm(true)}
          scrollThreshold={100}
          scrollContainerRef={scrollContainerRef}
        />
      )}

      <div ref={scrollContainerRef} className="h-full overflow-y-auto overflow-x-hidden">
        <div className={`mx-auto fade-in ${isMobileView ? 'px-4 py-3' : 'max-w-4xl px-8 py-8'}`}>

          {!isMobileView && (
            <HeaderControls
              title={title}
              isEditingTitle={isEditingTitle}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              shouldUsePagination={shouldUsePagination}
              progress={loader.progress}
              onTitleChange={setTitle}
              onStartEditingTitle={() => setIsEditingTitle(true)}
              onSaveTitle={handleTitleSave}
              onShare={() => setShowShareDialog(true)}
              onDelete={() => setShowDeleteConfirm(true)}
              documentId={entry?.id}
              syncManagerRef={smartSyncManagerRef}
            />
          )}

          {viewMode === 'lines' ? (
            <LinesView
              blocks={blocks}
              isMobileView={isMobileView}
              selectedLineBlockId={selectedLineBlockId}
              onSelectLine={setSelectedLineBlockId}
              onSwitchToBlocksView={(id) => { setViewMode('blocks'); setFocusedBlockId(id); }}
            />
          ) : (
            <BlockListView
              blocks={blocks}
              isLoadingBlocks={isLoading}
              isMobileView={isMobileView}
              scrollContainerRef={scrollContainerRef}
              computeItemKey={computeItemKey}
              renderBlockItem={renderBlockItem}
              shouldUsePagination={shouldUsePagination}
              hasMore={loader.hasMore}
              isLoadingMore={loader.isLoadingMore}
              loadMore={loader.loadMore}
              progress={loader.progress}
              showBlockSelector={blockOps.showBlockSelector}
              selectorPosition={blockOps.selectorPosition}
              onAddAtEnd={blockOps.handleAddAtEnd}
              onAddBlock={blockOps.addBlock}
              onCloseSelector={() => blockOps.setShowBlockSelector(false)}
            />
          )}

          <TagManager tags={tags} isMobileView={isMobileView} {...tagOps} />

          <BacklinksSection
            backlinks={backlinks}
            isMobileView={isMobileView}
            onNavigateToDocument={(title) => window.handleDocumentLink?.(title)}
          />
        </div>

        <DeleteConfirmation
          isOpen={showDeleteConfirm}
          isMobileView={isMobileView}
          title={title}
          isDeleting={isDeleting}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />

        {showShareDialog && (
          <ShareDialogSimple
            document={{ id: entry?.id, title, blocks, tags, ... }}
            isOpen={showShareDialog}
            onClose={() => setShowShareDialog(false)}
          />
        )}
      </div>

      <ScrollToTop scrollContainerRef={scrollContainerRef} />
    </>
  );
}

export default memo(DocumentEditor, (prevProps, nextProps) => {
  if (!prevProps.entry || !nextProps.entry) return false;
  if (prevProps.entry.id !== nextProps.entry.id) return false;
  if (prevProps.isMobileView !== nextProps.isMobileView) return false;
  if (prevProps.allEntries.length !== nextProps.allEntries.length) return false;
  return true;
});
```

---

## Gap 7: Verification Commands

### Automated Verification

```bash
# 1. No file >400 lines
find src/features/document/hooks src/components/DocumentEditor -name "*.ts" -o -name "*.tsx" | xargs wc -l | awk '$1 > 400 { print "FAIL: " $2 " has " $1 " lines"; exit 1 }'

# 2. TypeScript compiles
npm run typecheck

# 3. Build succeeds
npm run build

# 4. Linting passes
npm run lint

# 5. Dependency Cruiser passes (no circular imports)
npx depcruise --config .dependency-cruiser.js src/features/document src/components/DocumentEditor --output-type err

# 6. Tests pass (if any exist)
npm run test --if-present
```

### Manual Verification Checklist

```markdown
## Document Editor Functionality Test

### Block Operations
- [ ] Create new text block
- [ ] Create new code block (verify language selector works)
- [ ] Create new heading block (verify levels work)
- [ ] Edit existing block content
- [ ] Delete block (verify confirmation if needed)
- [ ] Duplicate block
- [ ] Move block up
- [ ] Move block down
- [ ] Convert text to heading
- [ ] Convert heading to text

### Drag and Drop
- [ ] Drag block to new position
- [ ] Auto-scroll when dragging near edges
- [ ] Drop indicator shows correctly
- [ ] Position saves after drop

### Title and Tags
- [ ] Edit document title
- [ ] Add new tag
- [ ] Edit existing tag
- [ ] Delete tag

### View Modes
- [ ] Toggle to lines view
- [ ] Click line to switch to blocks view at that block
- [ ] Scroll shadows appear correctly in lines view

### Sync and Save
- [ ] Auto-save triggers after editing
- [ ] Sync status indicator shows correctly
- [ ] Changes persist after page refresh

### Delete Document
- [ ] Delete confirmation modal appears
- [ ] Cancel works
- [ ] Confirm deletes document
- [ ] Mobile bottom sheet works on mobile

### Share
- [ ] Share dialog opens
- [ ] Share link can be copied

### Backlinks
- [ ] Backlinks display correctly
- [ ] Clicking backlink navigates to document

### Performance
- [ ] No visible flickering during block operations
- [ ] Virtualization works for 50+ blocks
- [ ] Responsive on mobile

### Error Handling
- [ ] Network error shows graceful fallback
- [ ] Block error boundary catches errors
```

---

## Target File Sizes

| Component/Hook | Target Lines | Actual Lines (estimate) |
|----------------|--------------|-------------------------|
| **Hooks** | | |
| useDocumentState | <100 | ~80 |
| useTagOperations | <80 | ~60 |
| useBlockSync | <100 | ~80 |
| useBlockMove | <120 | ~100 |
| useDragDrop | <180 | ~150 |
| useBlockOperations | <400 | ~350 |
| **Components** | | |
| TitleEditor | <50 | ~35 |
| ViewModeToggle | <50 | ~40 |
| TagManager | <120 | ~95 |
| BacklinksSection | <50 | ~35 |
| DeleteConfirmation | <200 | ~170 |
| LinesView | <70 | ~55 |
| BlockRenderer | <150 | ~135 |
| BlockListView | <150 | ~115 |
| HeaderControls | <150 | ~110 |
| **Orchestrator** | | |
| DocumentEditor | <250 | ~200 |

**Total new files**: 16 (6 hooks + 9 components + 1 barrel)
**Lines removed from ExpandedViewEnhanced**: ~2,388
**Lines remaining (should be 0)**: File deleted

---

## Depends On

- Phase 4 complete (Repository pattern for data access)

---

## Estimated Duration

~2-3 weeks (20 atomic commits, ~1-2 per day)

---

*Phase 5 of Document Page Architecture Refactor*
*Last updated: 2025-01-04 - Now executable with complete specifications*

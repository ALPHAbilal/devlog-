# Sidebar Drag and Drop Fix Implementation Plan

## Overview

The sidebar drag and drop functionality broke during the recent caching and data transformation redesign. The old `ProjectExplorer.jsx` had full DnD Kit integration but was replaced with `SidebarEnhanced.jsx` → `ExplorerView.jsx` → `SidebarTreeItemEnhanced.jsx` which lacks any drag and drop functionality.

## Current State Analysis

### What Happened
1. **Dashboard switched sidebar components**: `ProjectExplorer` → `SidebarEnhanced`
   - `Dashboard.jsx:16` now imports `SidebarEnhanced` instead of `ProjectExplorer`
2. **New sidebar architecture lacks DnD**:
   - `SidebarEnhanced.jsx` - No DnD Kit imports or context
   - `ExplorerView.jsx` - No DnD Kit imports or context
   - `SidebarTreeItemEnhanced.jsx` - No `useDraggable`/`useDroppable` hooks

### Old Working Implementation (Reference)
- `ProjectExplorer.jsx:33-49` - DnD Kit imports
- `ProjectExplorer.jsx:52-72` - `DroppableFolder` component
- `ProjectExplorer.jsx:74-103` - `DraggableItem` component
- `ProjectExplorer.jsx:479-578` - Drag handlers (start, over, end)
- `ProjectExplorer.jsx:816-822` - `DndContext` wrapper
- `ProjectExplorer.jsx:916-933` - `DragOverlay` for visual feedback

### Data Layer (Working)
The RxDB hooks for moving items are already implemented and working:
- `use-folders.ts:233-262` - `moveFolder(id, targetParentId)`
- `use-folders.ts:265-287` - `moveDocumentToFolder(documentId, folderId)`

## Desired End State

After this plan is complete:
1. Users can drag documents and folders in the sidebar
2. Dropping a document on a folder moves it into that folder
3. Dropping a folder on another folder makes it a subfolder
4. Dropping on "root" area moves items to the root level
5. Visual feedback shows valid drop targets with green ring/highlight
6. Folders auto-expand after 700ms hover during drag
7. All changes persist to RxDB and sync to Supabase

### Verification
- Manual: Drag a document to a folder, verify it moves
- Manual: Drag a folder into another folder, verify hierarchy updates
- Manual: Drag an item to root, verify it unfiles
- Console: No errors during drag operations
- RxDB: Changes visible in local database

## What We're NOT Doing

- NOT reverting to old `ProjectExplorer` (new sidebar design is better)
- NOT implementing sorting/reordering (position-based, different feature)
- NOT adding keyboard-based drag (can be added later)
- NOT implementing cross-view drag (e.g., from Recent to Explorer)

## Implementation Approach

Add DnD Kit to the new sidebar architecture by:
1. Wrapping `ExplorerView` content with `DndContext`
2. Making `SidebarTreeItemEnhanced` both draggable and droppable (for folders)
3. Adding drag handlers that use existing RxDB hooks
4. Adding visual feedback and drag overlay

## Phase 1: Add DnD Kit to ExplorerView

### Overview
Add the DndContext wrapper and drag state management to ExplorerView.

### Changes Required:

#### 1. ExplorerView.jsx
**File**: `src/components/sidebar/views/ExplorerView.jsx`
**Changes**: Add DnD Kit context, sensors, handlers, and drag overlay

```jsx
// Add imports at top (after existing imports)
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
} from '@dnd-kit/core';
import { snapCenterToCursor } from '@dnd-kit/modifiers';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Folder as FolderIcon, FileText } from 'lucide-react';
```

```jsx
// Add after existing imports, before component
// Droppable root area component
function DroppableRoot({ children }) {
  const { isOver, setNodeRef, active } = useDroppable({
    id: 'root',
    data: { type: 'root' }
  });

  const canDrop = active !== null;

  return (
    <div
      ref={setNodeRef}
      className={`min-h-full transition-all duration-200 ${
        isOver && canDrop ? 'bg-emerald-500/5 ring-1 ring-emerald-500/20 ring-inset rounded-lg' : ''
      }`}
    >
      {children}
    </div>
  );
}
```

```jsx
// Inside ExplorerView component, add state and handlers:

// Add after viewMode state
const [draggedItem, setDraggedItem] = useState(null);
const [dragOverFolderId, setDragOverFolderId] = useState(null);
const hoverTimerRef = useRef(null);

// Add sensors
const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8, // 8px minimum before drag starts
    },
  }),
  useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  })
);

// Add drag handlers
const handleDragStart = useCallback((event) => {
  const { active } = event;
  const item = findItemById(treeData, active.id);
  setDraggedItem(item);
}, [treeData]);

const handleDragOver = useCallback((event) => {
  const { over, active } = event;

  if (!over || !active) {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setDragOverFolderId(null);
    return;
  }

  if (over.id !== dragOverFolderId) {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }

    setDragOverFolderId(over.id);

    // Auto-expand collapsed folders after 700ms hover
    const targetItem = findItemById(treeData, over.id);
    if (targetItem && targetItem.type === 'folder' && !expandedFolders.has(over.id)) {
      hoverTimerRef.current = setTimeout(() => {
        setExpandedFolders(prev => new Set([...prev, over.id]));
        hoverTimerRef.current = null;
      }, 700);
    }
  }
}, [dragOverFolderId, treeData, expandedFolders]);

const handleDragEnd = useCallback(async (event) => {
  // Clear hover state
  if (hoverTimerRef.current) {
    clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = null;
  }
  setDragOverFolderId(null);

  const { active, over } = event;

  if (!over || active.id === over.id) {
    setDraggedItem(null);
    return;
  }

  const draggedItem = findItemById(treeData, active.id);
  if (!draggedItem) {
    setDraggedItem(null);
    return;
  }

  // Handle drop on root
  if (over.id === 'root') {
    if (draggedItem.type === 'document') {
      await onMoveDocument?.(draggedItem.id, null);
    } else if (draggedItem.type === 'folder') {
      await onMoveFolder?.(draggedItem.id, null);
    }
  } else {
    const targetItem = findItemById(treeData, over.id);
    if (!targetItem) {
      setDraggedItem(null);
      return;
    }

    // Document to folder
    if (draggedItem.type === 'document' && targetItem.type === 'folder') {
      await onMoveDocument?.(draggedItem.id, targetItem.id);
    }
    // Folder to folder (prevent dropping folder on itself or its descendants)
    else if (draggedItem.type === 'folder' && targetItem.type === 'folder') {
      if (!isDescendant(draggedItem, targetItem.id)) {
        await onMoveFolder?.(draggedItem.id, targetItem.id);
      }
    }
  }

  setDraggedItem(null);
}, [treeData, onMoveDocument, onMoveFolder]);

// Helper to find item by ID in tree
const findItemById = useCallback((items, id) => {
  for (const item of items) {
    if (item.id === id) return item;
    if (item.children) {
      const found = findItemById(item.children, id);
      if (found) return found;
    }
  }
  return null;
}, []);

// Helper to check if targetId is a descendant of folder
const isDescendant = useCallback((folder, targetId) => {
  if (folder.id === targetId) return true;
  if (folder.children) {
    return folder.children.some(child => isDescendant(child, targetId));
  }
  return false;
}, []);
```

```jsx
// Wrap content with DndContext in the render:
// Replace the ScrollArea content section with:

<DndContext
  sensors={sensors}
  collisionDetection={closestCenter}
  onDragStart={handleDragStart}
  onDragOver={handleDragOver}
  onDragEnd={handleDragEnd}
>
  <ScrollArea className="flex-1" viewportClassName="overflow-x-hidden">
    <DroppableRoot>
      <div className={`w-full min-w-0 overflow-hidden ${viewMode === VIEW_MODES.COMPACT ? 'py-1' : 'py-2'}`}>
        {/* existing content */}
      </div>
    </DroppableRoot>
  </ScrollArea>

  {/* Drag overlay */}
  <DragOverlay
    modifiers={[snapCenterToCursor]}
    dropAnimation={{
      duration: 200,
      easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
    }}
  >
    {draggedItem ? (
      <div className="bg-[#0d0d0d] text-white px-3 py-2 rounded-lg shadow-2xl flex items-center gap-2 border border-emerald-500/30">
        {draggedItem.type === 'folder' ? (
          <FolderIcon className="w-4 h-4 text-emerald-400" />
        ) : (
          <FileText className="w-4 h-4 text-white/60" />
        )}
        <span className="text-sm">{draggedItem.name || draggedItem.title || 'Moving...'}</span>
      </div>
    ) : null}
  </DragOverlay>
</DndContext>
```

### Success Criteria:

#### Automated Verification:
- [x] Build passes: `npm run build`
- [x] No TypeScript/ESLint errors: `npm run lint`

#### Manual Verification:
- [x] DndContext wraps the tree content
- [x] No console errors when component renders
- [x] Drag overlay appears when dragging (will complete in Phase 2)

---

## Phase 2: Make SidebarTreeItemEnhanced Draggable/Droppable

### Overview
Add useDraggable and useDroppable hooks to tree items.

### Changes Required:

#### 1. SidebarTreeItemEnhanced.jsx
**File**: `src/components/sidebar/SidebarTreeItemEnhanced.jsx`
**Changes**: Add DnD Kit hooks and visual feedback

```jsx
// Add imports at top
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
```

```jsx
// Add new props to component signature:
export default function SidebarTreeItemEnhanced({
  item,
  isExpanded,
  onToggle,
  expandedFolders,
  depth = 0,
  isFavorite = false,
  isLast = false,
  onItemClick,
  onContextMenu,
  onToggleFavorite,
  isSelected = false,
  activeDocumentId,
  recentlyCreatedFolderId,
  viewMode = 'tree',
  isDragDisabled = false, // NEW
}) {
```

```jsx
// Add DnD hooks after existing state hooks:

// Draggable hook - all items can be dragged
const {
  attributes: dragAttributes,
  listeners: dragListeners,
  setNodeRef: setDragRef,
  transform,
  isDragging,
} = useDraggable({
  id: item.id,
  data: { type: item.type, item },
  disabled: isDragDisabled,
});

// Droppable hook - only folders are drop targets
const {
  isOver,
  setNodeRef: setDropRef,
  active,
} = useDroppable({
  id: item.id,
  data: { type: item.type, item },
  disabled: isFile, // Files can't be drop targets
});

// Combine refs
const setNodeRef = useCallback((node) => {
  setDragRef(node);
  if (!isFile) setDropRef(node);
}, [setDragRef, setDropRef, isFile]);

// Drag styles
const dragStyle = {
  transform: CSS.Translate.toString(transform),
  opacity: isDragging ? 0.5 : 1,
};

// Determine if this is a valid drop target
const canDrop = active && active.id !== item.id && !isFile;
const isValidDropTarget = isOver && canDrop;
```

```jsx
// Update the main wrapper div to include drag/drop props:
// In tree/compact view section, replace the outer div with:

<div
  ref={setNodeRef}
  style={dragStyle}
  {...dragAttributes}
  {...dragListeners}
  className={`w-full min-w-0 overflow-hidden group ${
    isValidDropTarget ? 'ring-2 ring-emerald-500/50 bg-emerald-500/10 rounded-lg' : ''
  }`}
>
```

### Success Criteria:

#### Automated Verification:
- [x] Build passes: `npm run build`
- [x] No lint errors: `npm run lint`

#### Manual Verification:
- [x] Items become draggable (can pick up with mouse)
- [x] Folders highlight green when hovered during drag
- [x] Documents don't highlight (not drop targets)
- [x] Dragged item has 50% opacity

---

## Phase 3: Wire Up Data Layer Callbacks

### Overview
Pass the move callbacks from Dashboard through SidebarEnhanced to ExplorerView.

### Changes Required:

#### 1. Dashboard.jsx
**File**: `src/pages/Dashboard.jsx`
**Changes**: Add move callbacks to SidebarEnhanced props

```jsx
// Find where SidebarEnhanced is rendered and add these props:
<SidebarEnhanced
  // ...existing props
  onMoveDocument={handleMoveDocument}
  onMoveFolder={handleMoveFolder}
/>
```

```jsx
// Add handlers (if not already present):
const { moveDocumentToFolder, moveFolder } = useFolders();

const handleMoveDocument = useCallback(async (documentId, targetFolderId) => {
  await moveDocumentToFolder(documentId, targetFolderId);
}, [moveDocumentToFolder]);

const handleMoveFolder = useCallback(async (folderId, targetParentId) => {
  await moveFolder(folderId, targetParentId);
}, [moveFolder]);
```

#### 2. SidebarEnhanced.jsx
**File**: `src/components/sidebar/SidebarEnhanced.jsx`
**Changes**: Pass move callbacks through to ExplorerView

```jsx
// Add to component props:
export function SidebarEnhanced({
  // ...existing props
  onMoveDocument,
  onMoveFolder,
}) {
```

```jsx
// Pass to ViewContent:
<ViewContent
  // ...existing props
  onMoveDocument={onMoveDocument}
  onMoveFolder={onMoveFolder}
/>
```

```jsx
// Update ViewContent to accept and pass props:
function ViewContent({
  // ...existing props
  onMoveDocument,
  onMoveFolder,
}) {
  // ...
  case ACTIVITY_VIEWS.EXPLORER:
    return (
      <ExplorerView
        // ...existing props
        onMoveDocument={onMoveDocument}
        onMoveFolder={onMoveFolder}
      />
    );
```

#### 3. ExplorerView.jsx
**File**: `src/components/sidebar/views/ExplorerView.jsx`
**Changes**: Accept move callbacks in props

```jsx
// Add to component props:
export function ExplorerView({
  // ...existing props
  onMoveDocument,
  onMoveFolder,
}) {
```

### Success Criteria:

#### Automated Verification:
- [x] Build passes: `npm run build`
- [x] No lint errors: `npm run lint`

#### Manual Verification:
- [ ] Drag document to folder → document moves to folder
- [ ] Drag folder to folder → folder becomes subfolder
- [ ] Drag item to root area → item unfiles (moves to root)
- [ ] Changes persist after page refresh
- [ ] RxDB devtools show updated `folder_id` or `parent_id`

---

## Phase 4: Polish and Edge Cases

### Overview
Handle edge cases and add final polish.

### Changes Required:

#### 1. Prevent Invalid Moves
Already handled in Phase 1 with `isDescendant` check - folder can't drop into itself or its children.

#### 2. Add useRef Import to ExplorerView
**File**: `src/components/sidebar/views/ExplorerView.jsx`

```jsx
// Update import at top:
import { useState, useMemo, useCallback, useRef } from 'react';
```

#### 3. Cleanup on Unmount
**File**: `src/components/sidebar/views/ExplorerView.jsx`

```jsx
// Add cleanup effect:
useEffect(() => {
  return () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
    }
  };
}, []);
```

#### 4. Disable Drag During Rename (Future)
If rename functionality is added to SidebarTreeItemEnhanced, pass `isDragDisabled={isRenaming}`.

### Success Criteria:

#### Automated Verification:
- [x] Build passes: `npm run build`
- [x] No lint errors: `npm run lint`

#### Manual Verification:
- [ ] Cannot drop folder into itself (no change happens)
- [ ] Cannot drop folder into its own subfolder (no change happens)
- [ ] Folders auto-expand after 700ms hover during drag
- [ ] No memory leaks (timers cleared on unmount)
- [ ] Drag overlay shows correct icon and name

---

## Testing Strategy

### Manual Testing Steps:
1. **Document to Folder**: Drag a document from root to a folder → document should appear in folder
2. **Document to Root**: Drag a document from folder to empty space → document should appear at root
3. **Folder to Folder**: Drag a folder onto another folder → folder should become subfolder
4. **Folder to Root**: Drag a subfolder to root → folder should become root folder
5. **Invalid Drop**: Drag folder onto itself or its child → nothing should happen
6. **Auto-expand**: Hover over collapsed folder for 700ms during drag → folder expands
7. **Persistence**: Refresh page after move → changes should persist

### Edge Cases:
- Drag cancelled (ESC key or drop outside) → no change
- Rapid drag operations → no race conditions
- Mobile touch drag (if supported) → works same as mouse

## Performance Considerations

- DnD Kit is already installed and tree-shaken
- Drag sensors use activation constraint (8px) to prevent accidental drags
- Hover timer uses 700ms delay to prevent over-expanding
- Transform uses CSS.Translate for GPU-accelerated movement

## References

- Original working implementation: `src/components/ProjectExplorer/ProjectExplorer.jsx`
- RxDB move functions: `src/shared/db/hooks/use-folders.ts:233-287`
- DnD Kit docs: https://docs.dndkit.com/

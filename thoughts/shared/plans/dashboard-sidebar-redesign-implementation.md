# Dashboard Sidebar Redesign Implementation Plan

## Overview

Implement the new sidebar design from the Figma mockup while preserving all existing functionality including drag-and-drop, folder management, and document organization. The redesign focuses on a cleaner, more modern aesthetic with improved visual hierarchy and better use of space.

## Current State Analysis

The existing `ProjectExplorer` component (`src/components/ProjectExplorer/ProjectExplorer.jsx`) is a 963-line React component that provides:
- Hierarchical folder/document tree structure
- Drag-and-drop organization
- Context menus for actions
- Collapsible sidebar state
- Real-time folder expansion for selected documents
- Search functionality
- Rename in-place capability
- Auto-expanding folders on hover during drag

### Key Discoveries:
- Uses `@dnd-kit/core` for drag-and-drop (lines 34-49)
- Integrates with `useFolders` hook for database operations (lines 139-147)
- Uses `useProjectStructure` for prefetching (lines 150-153)
- Complex state management for UI interactions (lines 125-136)
- Renders hierarchical structure recursively (lines 603-794)

## Desired End State

A modern, clean sidebar matching the Figma design with:
- **Two distinct sections**: "Favorites" and "ALL FOLDERS"
- **Cleaner visual design**: Solid backgrounds instead of gradients
- **Improved typography**: Better font sizes and weights
- **Subtle interactions**: Refined hover states and transitions
- **Document counts**: Inline badges showing folder contents
- **Preserved functionality**: All existing features must continue working

### Visual Specifications from Figma:
- Background: Solid dark (`#0a1628` or similar)
- Text colors:
  - Section headers: Muted gray (`#6b7280`)
  - Active item: Green accent (`#10b981`)
  - Default items: Light gray (`#94a3b8`)
- Spacing: 8px padding, 4px between items
- Icons: 14px size, consistent styling
- Typography: 12px section headers, 14px item text

## What We're NOT Doing

- Removing any existing functionality (drag-drop, context menus, etc.)
- Changing the underlying data structure or storage
- Modifying the Dashboard.jsx integration points
- Altering the mobile sidebar behavior
- Removing keyboard shortcuts or accessibility features

## Implementation Approach

We'll create a new `ProjectExplorerV2` component alongside the existing one, allowing for A/B testing and gradual rollout. The new component will:
1. Maintain the same props interface for drop-in replacement
2. Reuse existing hooks (`useFolders`, `useProjectStructure`)
3. Keep the drag-and-drop implementation
4. Apply new visual design and layout structure

## Phase 1: Component Structure Setup

### Overview
Create the new component structure with sections for Favorites and All Folders.

### Changes Required:

#### 1. Create New Component File
**File**: `src/components/ProjectExplorer/ProjectExplorerV2.jsx`
**Changes**: Create new component with modern structure

```jsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Folder,
  FolderOpen,
  FileText,
  Star,
  ChevronRight,
  ChevronDown,
  Plus,
  MoreVertical
} from 'lucide-react';
import { useFolders } from '../../hooks/useFolders';
import { useProjectStructure } from '../../hooks/useBatchLoader';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';

export default function ProjectExplorerV2({
  onDocumentSelect,
  selectedDocumentId,
  documents = [],
  onDocumentMove,
  onDocumentDelete,
  isCollapsed = false,
  onToggleCollapse,
  // ... other props
}) {
  // Component implementation
}
```

#### 2. Create Styles File
**File**: `src/styles/project-explorer-v2.css`
**Changes**: New CSS for the redesigned sidebar

```css
/* Project Explorer V2 Styles */
.sidebar-v2 {
  --sidebar-bg: #0a1628;
  --sidebar-border: rgba(255, 255, 255, 0.05);
  --section-header: #6b7280;
  --item-text: #94a3b8;
  --item-hover: rgba(255, 255, 255, 0.05);
  --item-active: #10b981;
  --item-active-bg: rgba(16, 185, 129, 0.1);
}

.sidebar-v2-container {
  background: var(--sidebar-bg);
  border-right: 1px solid var(--sidebar-border);
}

.sidebar-v2-section {
  padding: 0.5rem;
}

.sidebar-v2-section-header {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--section-header);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.5rem 0.75rem;
  user-select: none;
}

.sidebar-v2-item {
  display: flex;
  align-items: center;
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 150ms ease;
  color: var(--item-text);
}

.sidebar-v2-item:hover {
  background: var(--item-hover);
  color: #e0e7ff;
}

.sidebar-v2-item.active {
  background: var(--item-active-bg);
  color: var(--item-active);
  font-weight: 500;
}

.sidebar-v2-item-icon {
  width: 14px;
  height: 14px;
  margin-right: 0.5rem;
  flex-shrink: 0;
}

.sidebar-v2-item-text {
  flex: 1;
  font-size: 0.875rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sidebar-v2-item-count {
  font-size: 0.75rem;
  padding: 0.125rem 0.375rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.25rem;
  color: var(--section-header);
}
```

### Success Criteria:

#### Automated Verification:
- [ ] Component compiles without errors: `npm run build`
- [ ] No TypeScript errors: `npm run typecheck`
- [ ] ESLint passes: `npm run lint`
- [ ] Component renders without crashes: `npm test`

#### Manual Verification:
- [ ] New component structure matches Figma layout
- [ ] Sections display correctly (Favorites, All Folders)
- [ ] Styling matches design specifications
- [ ] Component is responsive to width changes

---

## Phase 2: Favorites Section Implementation

### Overview
Implement the Favorites section with starred documents and folders.

### Changes Required:

#### 1. Add Favorites State Management
**File**: `src/components/ProjectExplorer/ProjectExplorerV2.jsx`
**Changes**: Add favorites tracking and rendering

```jsx
// Add to component state
const [favoriteIds, setFavoriteIds] = useState(new Set());

// Load favorites from localStorage
useEffect(() => {
  const saved = localStorage.getItem('devlog_favorites');
  if (saved) {
    try {
      setFavoriteIds(new Set(JSON.parse(saved)));
    } catch (e) {
      console.error('Failed to load favorites:', e);
    }
  }
}, []);

// Toggle favorite function
const toggleFavorite = useCallback((itemId, itemType) => {
  setFavoriteIds(prev => {
    const newFavorites = new Set(prev);
    if (newFavorites.has(itemId)) {
      newFavorites.delete(itemId);
    } else {
      newFavorites.add(itemId);
    }
    // Persist to localStorage
    localStorage.setItem('devlog_favorites', JSON.stringify([...newFavorites]));
    return newFavorites;
  });
}, []);

// Render favorites section
const renderFavoritesSection = () => {
  const favoriteItems = [
    ...folders.filter(f => favoriteIds.has(f.id)),
    ...documents.filter(d => favoriteIds.has(d.id))
  ];

  return (
    <div className="sidebar-v2-section">
      <div className="sidebar-v2-section-header">
        <span>Favorites</span>
      </div>
      <div className="sidebar-v2-items">
        {favoriteItems.length === 0 ? (
          <div className="sidebar-v2-empty">
            <span>No favorites yet</span>
            <span>Right-click items to add</span>
          </div>
        ) : (
          favoriteItems.map(item => renderFavoriteItem(item))
        )}
      </div>
    </div>
  );
};
```

#### 2. Update Context Menu
**File**: `src/components/ProjectExplorer/ProjectExplorerV2.jsx`
**Changes**: Add favorite toggle to context menu

```jsx
const handleContextMenu = useCallback((e, item, parentId = null) => {
  e.preventDefault();
  e.stopPropagation();

  const isFavorite = favoriteIds.has(item.id);
  const menuItems = [];

  // Add favorite toggle
  menuItems.push({
    label: isFavorite ? 'Remove from Favorites' : 'Add to Favorites',
    icon: Star,
    onClick: () => toggleFavorite(item.id, item.type)
  });

  menuItems.push({ divider: true });

  // ... existing menu items
}, [favoriteIds, toggleFavorite]);
```

### Success Criteria:

#### Automated Verification:
- [ ] Favorites persist in localStorage: Check DevTools
- [ ] Component builds successfully: `npm run build`

#### Manual Verification:
- [ ] Can add/remove items from favorites via context menu
- [ ] Favorites section displays correctly
- [ ] Favorites persist across page refreshes
- [ ] Favorite items show star icon indicator

---

## Phase 3: Visual Polish and Interactions

### Overview
Apply final visual polish including hover states, transitions, and micro-animations.

### Changes Required:

#### 1. Enhanced Hover States
**File**: `src/styles/project-explorer-v2.css`
**Changes**: Add refined hover and transition effects

```css
.sidebar-v2-item {
  position: relative;
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar-v2-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 2px;
  height: 0;
  background: var(--item-active);
  transition: height 200ms ease;
}

.sidebar-v2-item.active::before {
  height: 60%;
}

/* Chevron rotation animation */
.sidebar-v2-chevron {
  transition: transform 200ms ease;
}

.sidebar-v2-chevron.expanded {
  transform: rotate(90deg);
}

/* Smooth expand/collapse animation */
.sidebar-v2-children {
  overflow: hidden;
  transition: max-height 200ms ease-out;
}

.sidebar-v2-children.collapsed {
  max-height: 0;
}

.sidebar-v2-children.expanded {
  max-height: none;
}
```

#### 2. Loading States
**File**: `src/components/ProjectExplorer/ProjectExplorerV2.jsx`
**Changes**: Add skeleton loading for folders

```jsx
const FolderSkeleton = () => (
  <div className="sidebar-v2-skeleton">
    <div className="sidebar-v2-skeleton-item">
      <div className="skeleton-icon" />
      <div className="skeleton-text" />
    </div>
  </div>
);

// Show loading state
{foldersLoading ? (
  <>
    <FolderSkeleton />
    <FolderSkeleton />
    <FolderSkeleton />
  </>
) : (
  renderFolderTree()
)}
```

### Success Criteria:

#### Automated Verification:
- [ ] CSS validates without errors
- [ ] No console warnings in development mode

#### Manual Verification:
- [ ] Smooth hover transitions (200ms)
- [ ] Chevron rotation animation works
- [ ] Active item indicator animates correctly
- [ ] Loading skeletons display during data fetch

---

## Phase 4: Integration with Dashboard

### Overview
Integrate the new sidebar component with the Dashboard while maintaining backward compatibility.

### Changes Required:

#### 1. Update Dashboard Component
**File**: `src/pages/Dashboard.jsx`
**Changes**: Add feature flag for new sidebar

```jsx
import ProjectExplorer from '../components/ProjectExplorer/ProjectExplorer';
import ProjectExplorerV2 from '../components/ProjectExplorer/ProjectExplorerV2';

// Add feature flag
const USE_NEW_SIDEBAR = localStorage.getItem('devlog_new_sidebar') === 'true';

// In render method
{USE_NEW_SIDEBAR ? (
  <ProjectExplorerV2
    documents={entries}
    selectedDocumentId={expandedEntry?.id}
    onDocumentSelect={handleDocumentSelect}
    onDocumentMove={handleDocumentMove}
    onDocumentDelete={handleDocumentDelete}
    isCollapsed={isSidebarCollapsed}
    onToggleCollapse={toggleSidebar}
  />
) : (
  <ProjectExplorer
    // ... existing props
  />
)}
```

#### 2. Add Toggle in Settings
**File**: `src/pages/SettingsClaude.jsx`
**Changes**: Add UI toggle for new sidebar

```jsx
<div className="settings-item">
  <label className="flex items-center space-x-2">
    <input
      type="checkbox"
      checked={useNewSidebar}
      onChange={(e) => {
        const enabled = e.target.checked;
        localStorage.setItem('devlog_new_sidebar', enabled ? 'true' : 'false');
        setUseNewSidebar(enabled);
        // Reload to apply changes
        window.location.reload();
      }}
    />
    <span>Enable new sidebar design (Beta)</span>
  </label>
  <p className="text-sm text-gray-500">
    Try the redesigned sidebar with improved visuals and favorites section
  </p>
</div>
```

### Success Criteria:

#### Automated Verification:
- [ ] Dashboard builds with both components: `npm run build`
- [ ] No prop type mismatches
- [ ] Feature flag correctly toggles components

#### Manual Verification:
- [ ] Can switch between old and new sidebar via settings
- [ ] Both sidebars work correctly with Dashboard
- [ ] No functionality lost in new sidebar
- [ ] State persists correctly between switches

---

## Phase 5: Mobile Optimization

### Overview
Ensure the new sidebar works perfectly on mobile devices.

### Changes Required:

#### 1. Mobile-Specific Styles
**File**: `src/styles/project-explorer-v2.css`
**Changes**: Add responsive styles

```css
@media (max-width: 768px) {
  .sidebar-v2-container {
    width: 100%;
    max-width: none;
    height: 100%;
  }

  .sidebar-v2-item {
    padding: 0.5rem 1rem;
    /* Larger touch targets */
    min-height: 44px;
  }

  .sidebar-v2-section-header {
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
  }

  /* Disable hover effects on mobile */
  @media (hover: none) {
    .sidebar-v2-item:hover {
      background: transparent;
    }

    .sidebar-v2-item:active {
      background: var(--item-hover);
    }
  }
}
```

#### 2. Touch Gestures
**File**: `src/components/ProjectExplorer/ProjectExplorerV2.jsx`
**Changes**: Add touch support

```jsx
// Long press for context menu on mobile
const handleTouchStart = useCallback((e, item) => {
  const touch = e.touches[0];
  touchTimerRef.current = setTimeout(() => {
    handleContextMenu({
      preventDefault: () => {},
      stopPropagation: () => {},
      clientX: touch.clientX,
      clientY: touch.clientY
    }, item);
  }, 500); // 500ms long press
}, [handleContextMenu]);

const handleTouchEnd = useCallback(() => {
  if (touchTimerRef.current) {
    clearTimeout(touchTimerRef.current);
    touchTimerRef.current = null;
  }
}, []);
```

### Success Criteria:

#### Automated Verification:
- [ ] Mobile styles compile correctly
- [ ] No console errors on mobile viewport sizes

#### Manual Verification:
- [ ] Sidebar displays full-width on mobile
- [ ] Touch targets are at least 44px
- [ ] Long-press opens context menu
- [ ] Smooth scrolling on touch devices
- [ ] No hover states stuck on mobile

---

## Testing Strategy

### Unit Tests:
- Test favorite toggle functionality
- Test folder expansion/collapse logic
- Test drag-and-drop handlers
- Test search filtering

### Integration Tests:
- Test sidebar with Dashboard integration
- Test data persistence across refreshes
- Test feature flag switching
- Test mobile/desktop responsive behavior

### Manual Testing Steps:
1. Enable new sidebar via settings
2. Add several items to favorites
3. Create nested folder structure
4. Drag documents between folders
5. Test on mobile device/emulator
6. Switch between old/new sidebar
7. Verify all data persists correctly

## Performance Considerations

- Use `React.memo` for folder/document items to prevent unnecessary re-renders
- Implement virtual scrolling if > 100 items visible
- Debounce search input by 300ms
- Lazy-load folder contents on expansion
- Use CSS transforms for animations (GPU acceleration)

## Migration Notes

1. **Feature Flag Rollout**:
   - Start with internal testing (dev team)
   - Roll out to 10% of users
   - Monitor performance metrics
   - Gradually increase to 100%

2. **Data Migration**:
   - Favorites stored in localStorage (no migration needed)
   - Existing folder structure unchanged
   - All props remain compatible

3. **Rollback Plan**:
   - Feature flag can instantly revert to old sidebar
   - No data structure changes to roll back
   - localStorage favorites persist but won't show in old sidebar

## References

- Original Figma design: https://www.figma.com/design/Ejd2x9Di1vgjnPRybk5Af2/Untitled?node-id=46-1594
- Current implementation: `src/components/ProjectExplorer/ProjectExplorer.jsx`
- Research document: `thoughts/shared/research/2025-10-25_dashboard-ui-redesign-comprehensive.md`
- Similar redesign: `thoughts/shared/plans/auth-page-redesign-implementation.md`
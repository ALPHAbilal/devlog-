# Sidebar + Tabs Implementation Plan

> Detailed implementation plan for the Sidebar + Browser-Style Tabs redesign
> Reference: `AI-MEMORY/VISION-sidebar-only-redesign.md`
> Created: 2025-11-26
> Updated: 2025-11-26 - Finalized UI layout

## Overview

Transform Devlog from a dashboard card grid + sidebar model to a **Sidebar + Browser-Style Tabs** model. This removes the dashboard cards entirely and introduces a tab bar for multi-document workflows with session persistence.

---

## FINAL UI LAYOUT

```
┌─────────────────────────────────────────────────────────────────┐
│ [Green accent line - 2px]                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  TAB BAR (h-11, 44px) - Clean, minimal                         │
│  [Doc 1 ✕] [Doc 2 ✕] [Untitled ✕]  [+]                         │
│                                                                 │
├─────────────┬───────────────────────────────────────────────────┤
│             │                                                   │
│  SIDEBAR    │                                                   │
│  (w-72)     │                                                   │
│             │                                                   │
│  ┌────────┐ │                                                   │
│  │🔍Search│ │        DOCUMENT CONTENT                           │
│  └────────┘ │        (ExpandedViewEnhanced)                     │
│             │                                                   │
│  ⭐ Favorites│        - Instant tab switching                   │
│    └─ Doc A │        - No loading states                        │
│             │        - Pre-cached documents                     │
│  📥 Inbox(3)│                                                   │
│    ├─ Note  │                                                   │
│    └─ New   │                                                   │
│             │                                                   │
│  📁 Folders │                                                   │
│    ├─ Proj A│                                                   │
│    └─ Proj B│                                                   │
│             │                                                   │
│  ───────────│                                                   │
│  [⚙️] [👤]  │  ← Settings + Profile at bottom                   │
│             │                                                   │
└─────────────┴───────────────────────────────────────────────────┘
```

### UI Decisions (FINAL)

| Element | Location | Notes |
|---------|----------|-------|
| **Tab Bar** | Top, full width | Clean minimal design. Only tabs + [+] button |
| **Search** | Sidebar top | Uses existing backend. Results shown in sidebar |
| **Favorites** | Sidebar section | Starred docs/folders |
| **Inbox** | Sidebar section | Unsorted documents with count badge |
| **Folders** | Sidebar section | Folder tree structure |
| **Settings** | Sidebar bottom | Gear icon → navigates to /settings |
| **Profile** | Sidebar bottom | Avatar + dropdown menu |
| **DashboardHeader** | **REMOVED** | No longer needed |
| **Card Grid** | **REMOVED** | Replaced by tabs |

### Performance Requirements

| Action | Target | Implementation |
|--------|--------|----------------|
| Tab switch | **< 50ms** | Documents pre-cached in memory |
| New tab creation | **< 100ms** | Optimistic UI update |
| Search results | **< 200ms** | Existing backend, sidebar display |
| Session restore | **< 500ms** | localStorage read on mount |

### Layout Behavior (CRITICAL)

```
┌─────────────────────────────────────────────────────────────────┐
│ VIEWPORT (h-screen, overflow-hidden)                            │
├─────────────────────────────────────────────────────────────────┤
│  TAB BAR (h-11)                                    ← FIXED      │
├───────────┬─────────────────────────────────────────────────────┤
│           │                                                     │
│  SIDEBAR  │   DOCUMENT CONTENT AREA                             │
│  (FIXED)  │   ┌─────────────────────────────────────────────┐  │
│           │   │                                             │  │
│  w-72     │   │  overflow-y-auto                            │  │
│  or       │   │  (scrolls internally)                       │  │
│  w-20     │   │                                             │  │
│  when     │   │  Block 1                        ↕           │  │
│  collapsed│   │  Block 2                        ↕ SCROLL    │  │
│           │   │  Block 3                        ↕           │  │
│  ↔        │   │  ...                            ↕           │  │
│  toggle   │   │                                             │  │
│           │   └─────────────────────────────────────────────┘  │
│  ─────────│                                                     │
│  [⚙️] [👤] │                                                     │
└───────────┴─────────────────────────────────────────────────────┘
```

**Key Layout Rules:**
1. **Outer container**: `h-screen overflow-hidden` (fills viewport, no page scroll)
2. **Tab bar**: Fixed height `h-11` (44px), stays at top
3. **Sidebar**: Fixed width, collapsible (80px ↔ 280px), full height minus tab bar
4. **Document area**: `flex-1 overflow-y-auto` (takes remaining space, scrolls internally)
5. **No page-level scrolling**: Everything contained within viewport

---

## Current State Analysis

### Current Architecture
```
Layout.jsx
  └── Dashboard.jsx
        ├── ProjectExplorerRedesigned (Sidebar)
        │     ├── Favorites section
        │     └── Folder tree
        ├── DashboardHeader ← REMOVE
        ├── DocumentGridRedesigned (CARDS) ← REMOVE
        │     └── EntryCardRedesigned ← REMOVE
        └── ExpandedViewEnhanced (when doc selected)
```

### Key Files to Modify
| File | Change Type | Purpose |
|------|-------------|---------|
| `src/pages/Dashboard.jsx` | **MAJOR** | Remove cards, remove header, add tabs |
| `src/components/Layout.jsx` | **MINOR** | Adjust structure for tab bar |
| `src/components/ProjectExplorer/ProjectExplorerRedesigned.jsx` | **MAJOR** | Add search, Inbox, profile/settings |

### New Files to Create
| File | Purpose |
|------|---------|
| `src/components/TabBar.jsx` | Clean tab bar component |
| `src/contexts/TabContext.jsx` | Tab state + persistence |
| `src/components/EmptyState.jsx` | When no tabs open |
| `src/components/SidebarFooter.jsx` | Settings + Profile section |

### Files to Remove
| File | Reason |
|------|--------|
| `src/components/Dashboard/DashboardHeader.jsx` | Replaced by tab bar |
| `src/components/DocumentGridRedesigned.jsx` | Replaced by tabs |
| `src/components/EntryCardRedesigned.jsx` | No longer needed |
| `src/components/EntryCard.jsx` | No longer needed |
| `src/components/FolderCard.jsx` | Folders only in sidebar |
| `src/components/DocumentCardSkeleton.jsx` | No card loading states |
| `src/components/FolderCardSkeleton.jsx` | No card loading states |

---

## Desired End State

### Verification Criteria
1. App opens with previously open tabs restored
2. [+] creates new doc in Inbox and opens in new tab
3. Clicking sidebar doc opens in tab (or switches if already open)
4. **Tab switching is instant** (< 50ms, no spinners)
5. Keyboard shortcuts work (Cmd+T, Cmd+W, Cmd+Tab, Cmd+1-9)
6. No dashboard cards visible anywhere
7. No DashboardHeader visible anywhere
8. Search in sidebar filters and persists when clicking results
9. Profile menu accessible from sidebar bottom
10. Settings accessible from sidebar bottom

---

## What We're NOT Doing

- Tab groups (future feature)
- Split view / side-by-side editing (future feature)
- Tab drag-and-drop reordering (Phase 5, optional)
- Cross-device tab sync (tabs are local only)
- Pinned tabs (future feature)

---

## Implementation Phases

---

## Phase 1: Tab Context & State Management

### Overview
Create the foundational tab state management system with persistence.

### Changes Required:

#### 1. Create TabContext (`src/contexts/TabContext.jsx`)

**File**: `src/contexts/TabContext.jsx` (NEW)

```jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const TabContext = createContext();

const STORAGE_KEY = 'devlog_tabs';

export const useTabContext = () => {
  const context = useContext(TabContext);
  if (!context) {
    throw new Error('useTabContext must be used within a TabProvider');
  }
  return context;
};

export const TabProvider = ({ children }) => {
  // Tab state: array of { id, title, isUnsaved }
  const [tabs, setTabs] = useState([]);
  const [activeTabId, setActiveTabId] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load tabs from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const { tabs: savedTabs, activeTabId: savedActiveId } = JSON.parse(stored);
        if (savedTabs && savedTabs.length > 0) {
          setTabs(savedTabs);
          setActiveTabId(savedActiveId || savedTabs[0].id);
        }
      }
    } catch (e) {
      console.error('Failed to load tabs from storage:', e);
    }
    setIsInitialized(true);
  }, []);

  // Persist tabs to localStorage whenever they change
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        tabs,
        activeTabId
      }));
    } catch (e) {
      console.error('Failed to save tabs to storage:', e);
    }
  }, [tabs, activeTabId, isInitialized]);

  // Open a new tab (or switch to existing)
  const openTab = useCallback((document) => {
    const existingTab = tabs.find(t => t.id === document.id);
    if (existingTab) {
      setActiveTabId(document.id);
      return;
    }

    const newTab = {
      id: document.id,
      title: document.title || 'Untitled',
      isUnsaved: false
    };

    setTabs(prev => [...prev, newTab]);
    setActiveTabId(document.id);
  }, [tabs]);

  // Close a tab
  const closeTab = useCallback((tabId) => {
    setTabs(prev => {
      const newTabs = prev.filter(t => t.id !== tabId);

      // If closing active tab, switch to adjacent tab
      if (activeTabId === tabId && newTabs.length > 0) {
        const closedIndex = prev.findIndex(t => t.id === tabId);
        const newActiveIndex = Math.min(closedIndex, newTabs.length - 1);
        setActiveTabId(newTabs[newActiveIndex].id);
      } else if (newTabs.length === 0) {
        setActiveTabId(null);
      }

      return newTabs;
    });
  }, [activeTabId]);

  // Close all tabs except one
  const closeOtherTabs = useCallback((keepTabId) => {
    setTabs(prev => prev.filter(t => t.id === keepTabId));
    setActiveTabId(keepTabId);
  }, []);

  // Close tabs to the right
  const closeTabsToRight = useCallback((tabId) => {
    setTabs(prev => {
      const index = prev.findIndex(t => t.id === tabId);
      return prev.slice(0, index + 1);
    });
  }, []);

  // Update tab title (when document title changes)
  const updateTabTitle = useCallback((tabId, newTitle) => {
    setTabs(prev => prev.map(t =>
      t.id === tabId ? { ...t, title: newTitle || 'Untitled' } : t
    ));
  }, []);

  // Switch to next/previous tab
  const switchToNextTab = useCallback(() => {
    if (tabs.length <= 1) return;
    const currentIndex = tabs.findIndex(t => t.id === activeTabId);
    const nextIndex = (currentIndex + 1) % tabs.length;
    setActiveTabId(tabs[nextIndex].id);
  }, [tabs, activeTabId]);

  const switchToPrevTab = useCallback(() => {
    if (tabs.length <= 1) return;
    const currentIndex = tabs.findIndex(t => t.id === activeTabId);
    const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    setActiveTabId(tabs[prevIndex].id);
  }, [tabs, activeTabId]);

  // Switch to tab by index (1-9)
  const switchToTabByIndex = useCallback((index) => {
    if (index >= 0 && index < tabs.length) {
      setActiveTabId(tabs[index].id);
    }
  }, [tabs]);

  const value = {
    tabs,
    activeTabId,
    isInitialized,
    openTab,
    closeTab,
    closeOtherTabs,
    closeTabsToRight,
    updateTabTitle,
    setActiveTabId,
    switchToNextTab,
    switchToPrevTab,
    switchToTabByIndex,
  };

  return (
    <TabContext.Provider value={value}>
      {children}
    </TabContext.Provider>
  );
};
```

#### 2. Add TabProvider to App.jsx

**File**: `src/App.jsx`
**Location**: Line ~237-253 (wrap AppContent)

```jsx
// Add import at top
import { TabProvider } from './contexts/TabContext';

// Wrap in App function (inside existing providers)
function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <SettingsProvider>
            <SidebarProvider>
              <TabProvider>  {/* ADD THIS */}
                <ToastProvider>
                  <AutoSaveProvider />
                  <AppContent />
                  <CookieConsentBanner />
                </ToastProvider>
              </TabProvider>  {/* ADD THIS */}
            </SidebarProvider>
          </SettingsProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
```

### Success Criteria:

#### Automated Verification:
- [ ] No TypeScript/ESLint errors: `npm run lint`
- [ ] App builds successfully: `npm run build`
- [ ] TabContext exports correctly

#### Manual Verification:
- [ ] Console shows tab state loading/saving
- [ ] localStorage contains `devlog_tabs` key after opening a document
- [ ] Refreshing page restores tab state

---

## Phase 2: TabBar Component

### Overview
Create the visual tab bar component that displays open tabs.

### Changes Required:

#### 1. Create TabBar Component (`src/components/TabBar.jsx`)

**File**: `src/components/TabBar.jsx` (NEW)

**Design Goals:**
- Clean, minimal appearance
- Smooth hover/active states
- Instant visual feedback
- Matches existing dark theme

```jsx
import { useTabContext } from '../contexts/TabContext';
import { X, Plus, FileText } from 'lucide-react';
import { useRef } from 'react';

export default function TabBar({ onNewTab }) {
  const { tabs, activeTabId, closeTab, setActiveTabId } = useTabContext();
  const tabsRef = useRef(null);

  const handleCloseTab = (e, tabId) => {
    e.stopPropagation();
    closeTab(tabId);
  };

  // Middle-click to close (browser convention)
  const handleMouseDown = (e, tabId) => {
    if (e.button === 1) {
      e.preventDefault();
      closeTab(tabId);
    }
  };

  return (
    <div className="h-11 flex items-center bg-db-dark-base border-b border-white/5">
      {/* Tabs scroll container */}
      <div
        ref={tabsRef}
        className="flex-1 flex items-center gap-0.5 px-2 overflow-x-auto scrollbar-hide"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              onMouseDown={(e) => handleMouseDown(e, tab.id)}
              className={`
                group relative flex items-center gap-2 h-8 px-3 rounded-md
                text-[13px] font-medium whitespace-nowrap
                transition-all duration-150 ease-out
                min-w-[120px] max-w-[180px]
                ${isActive
                  ? 'bg-white/10 text-white/95'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                }
              `}
            >
              {/* Document icon */}
              <FileText size={14} className={`flex-shrink-0 ${isActive ? 'text-emerald-400' : 'text-white/30'}`} />

              {/* Title */}
              <span className="truncate flex-1 text-left">
                {tab.title || 'Untitled'}
              </span>

              {/* Close button */}
              <span
                onClick={(e) => handleCloseTab(e, tab.id)}
                className={`
                  flex-shrink-0 p-0.5 rounded-sm
                  transition-all duration-150
                  hover:bg-white/20 hover:text-white
                  ${isActive
                    ? 'text-white/40 hover:text-white'
                    : 'opacity-0 group-hover:opacity-100 text-white/40'
                  }
                `}
              >
                <X size={12} />
              </span>

              {/* Active indicator line */}
              {isActive && (
                <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-emerald-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* New tab button */}
      <div className="flex-shrink-0 px-2 border-l border-white/5">
        <button
          onClick={onNewTab}
          className="flex items-center justify-center w-8 h-8 rounded-md
                     text-white/50 hover:text-white hover:bg-white/10
                     transition-all duration-150"
          title="New document (⌘T)"
        >
          <Plus size={18} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
```

#### 2. Add scrollbar-hide utility to CSS

**File**: `src/styles/index.css`
**Location**: Add at end of file

```css
/* Hide scrollbar for tab bar */
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
```

### Success Criteria:

#### Automated Verification:
- [ ] Component renders without errors
- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds

#### Manual Verification:
- [ ] Tabs display horizontally
- [ ] Active tab is visually distinct (brighter, border)
- [ ] Hover shows close button
- [ ] Click switches tabs
- [ ] Middle-click closes tab
- [ ] [+] button visible on right

---

## Phase 3: Integrate TabBar into Dashboard

### Overview
Replace the card grid with tab-based document viewing.

### Changes Required:

#### 1. Major Dashboard.jsx Refactor

**File**: `src/pages/Dashboard.jsx`

**Key Changes:**
1. Remove card grid rendering
2. Add TabBar import and usage
3. Use TabContext for document management
4. Always show ExpandedViewEnhanced for active tab

**Imports to Add** (top of file):
```jsx
import TabBar from '../components/TabBar';
import { useTabContext } from '../contexts/TabContext';
```

**Replace the main return structure** (around line 1378-1527):

The new structure should be:

```jsx
// Inside Dashboard component, replace the main return
return (
  // Outer container: fills viewport, no page scroll
  <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-br from-db-dark-base via-db-dark-primary to-db-dark-secondary">

    {/* Tab Bar - fixed height, stays at top */}
    <TabBar onNewTab={handleCreateNewTab} />

    {/* Main area - fills remaining height */}
    <div className="flex-1 min-h-0 flex overflow-hidden">

      {/* Sidebar - fixed width, collapsible, full height */}
      <div
        className="flex-shrink-0 h-full transition-all duration-300 ease-in-out"
        style={{ width: isSidebarCollapsed ? '80px' : '280px' }}
      >
        <ProjectExplorerV2
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapse}
          className="h-full"
          onDocumentSelect={handleDocumentSelect}
          selectedDocumentId={activeTabId}
          documents={allDocuments}
          onDocumentMove={async (docId, folderId) => {
            await updateEntry(docId, { folder_id: folderId });
          }}
          onDocumentDelete={handleDocumentDelete}
        />
      </div>

      {/* Document area - takes remaining width, scrolls internally */}
      <div className="flex-1 min-w-0 h-full overflow-hidden">
        {activeTabId && activeDocument ? (
          // ExpandedViewEnhanced handles its own internal scrolling
          <ExpandedViewEnhanced
            key={activeTabId}
            entry={activeDocument}
            onClose={() => closeTab(activeTabId)}
            onUpdate={updateEntry}
            allEntries={allDocuments}
            onNavigateToDocument={(doc) => openTab(doc)}
          />
        ) : (
          <EmptyState onCreateNew={handleCreateNewTab} />
        )}
      </div>

    </div>
  </div>
);
```

**CSS Layout Breakdown:**
```
h-screen flex flex-col overflow-hidden   ← Viewport container, no page scroll
│
├─ TabBar (h-11)                         ← Fixed 44px height
│
└─ flex-1 min-h-0 flex overflow-hidden   ← Takes remaining height
    │
    ├─ Sidebar (w-72 or w-20)            ← Fixed width, collapsible
    │   └─ h-full                        ← Full height of parent
    │
    └─ flex-1 min-w-0 overflow-hidden    ← Takes remaining width
        └─ ExpandedViewEnhanced          ← Handles internal scroll
```

**Add new handler functions** (in Dashboard component):

```jsx
// Get tab context
const {
  tabs,
  activeTabId,
  openTab,
  closeTab,
  updateTabTitle
} = useTabContext();

// Find the active document
const activeDocument = useMemo(() => {
  if (!activeTabId) return null;
  return allDocuments.find(doc => doc.id === activeTabId);
}, [activeTabId, allDocuments]);

// Handle new tab creation
const handleCreateNewTab = useCallback(async () => {
  const newDoc = await createNewEntry(); // Creates in Inbox
  if (newDoc) {
    openTab(newDoc);
  }
}, [createNewEntry, openTab]);

// Handle document selection from sidebar
const handleDocumentSelect = useCallback((data) => {
  if (data?.action === 'create') {
    handleCreateNewTab();
  } else if (data?.id) {
    const doc = allDocuments.find(e => e.id === data.id);
    if (doc) {
      openTab(doc);
    }
  } else if (data) {
    openTab(data);
  }
}, [allDocuments, openTab, handleCreateNewTab]);

// Handle tab click (sync URL)
const handleTabClick = useCallback((tabId) => {
  navigate(`/document/${tabId}`, { replace: true });
}, [navigate]);
```

#### 2. Create EmptyState Component

**File**: `src/components/EmptyState.jsx` (NEW)

```jsx
import { Plus, FileText } from 'lucide-react';

export default function EmptyState({ onCreateNew }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-8">
      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6">
        <FileText className="w-8 h-8 text-white/30" />
      </div>

      <h2 className="text-xl font-semibold text-white/90 mb-2">
        No document open
      </h2>

      <p className="text-white/50 mb-6 max-w-md">
        Select a document from the sidebar or create a new one to get started.
      </p>

      <button
        onClick={onCreateNew}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl
                   bg-emerald-500/20 text-emerald-400
                   hover:bg-emerald-500/30 transition-all duration-200
                   border border-emerald-500/30"
      >
        <Plus size={18} />
        <span>New Document</span>
      </button>

      <p className="text-white/30 text-sm mt-4">
        or press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/60">Cmd+T</kbd>
      </p>
    </div>
  );
}
```

#### 3. Remove Card Grid Code from Dashboard

**File**: `src/pages/Dashboard.jsx`

**Remove these imports:**
```jsx
// REMOVE these imports
import DocumentGridRedesigned from '../components/DocumentGridRedesigned';
import EntryCardRedesigned from '../components/EntryCardRedesigned';
// ... any other card-related imports
```

**Remove all code related to:**
- `filteredEntries` for card display
- `DocumentGridRedesigned` component usage
- Card selection state (`selectedDocuments`)
- Card hover/preload logic

### Success Criteria:

#### Automated Verification:
- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds
- [ ] No console errors on load

#### Manual Verification:
- [ ] Tab bar appears at top
- [ ] Clicking [+] creates new doc in new tab
- [ ] Clicking sidebar doc opens in tab
- [ ] Document content displays correctly
- [ ] Empty state shows when no tabs
- [ ] Closing all tabs shows empty state

---

## Phase 4: Keyboard Shortcuts

### Overview
Add browser-style keyboard shortcuts for tab management.

### Changes Required:

#### 1. Add Keyboard Shortcuts to TabContext

**File**: `src/contexts/TabContext.jsx`
**Location**: Inside TabProvider, add useEffect

```jsx
// Add keyboard shortcuts
useEffect(() => {
  const handleKeyDown = (e) => {
    // Cmd/Ctrl + T = New tab
    if ((e.metaKey || e.ctrlKey) && e.key === 't') {
      e.preventDefault();
      // Dispatch custom event for new tab
      window.dispatchEvent(new CustomEvent('devlog:newTab'));
    }

    // Cmd/Ctrl + W = Close tab
    if ((e.metaKey || e.ctrlKey) && e.key === 'w') {
      e.preventDefault();
      if (activeTabId) {
        closeTab(activeTabId);
      }
    }

    // Cmd/Ctrl + Tab = Next tab
    if ((e.metaKey || e.ctrlKey) && e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      switchToNextTab();
    }

    // Cmd/Ctrl + Shift + Tab = Previous tab
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'Tab') {
      e.preventDefault();
      switchToPrevTab();
    }

    // Cmd/Ctrl + 1-9 = Switch to tab by index
    if ((e.metaKey || e.ctrlKey) && e.key >= '1' && e.key <= '9') {
      e.preventDefault();
      const index = parseInt(e.key) - 1;
      switchToTabByIndex(index);
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [activeTabId, closeTab, switchToNextTab, switchToPrevTab, switchToTabByIndex]);
```

#### 2. Listen for newTab event in Dashboard

**File**: `src/pages/Dashboard.jsx`
**Location**: Add in Dashboard component

```jsx
// Listen for keyboard shortcut to create new tab
useEffect(() => {
  const handleNewTab = () => {
    handleCreateNewTab();
  };

  window.addEventListener('devlog:newTab', handleNewTab);
  return () => window.removeEventListener('devlog:newTab', handleNewTab);
}, [handleCreateNewTab]);
```

### Success Criteria:

#### Automated Verification:
- [ ] No lint errors
- [ ] Build succeeds

#### Manual Verification:
- [ ] Cmd+T creates new tab
- [ ] Cmd+W closes current tab
- [ ] Cmd+Tab cycles to next tab
- [ ] Cmd+Shift+Tab cycles to previous tab
- [ ] Cmd+1 through Cmd+9 switches to specific tabs

---

## Phase 5: Sidebar Enhancements

### Overview
Update sidebar with Inbox section, search, selection highlighting, and profile/settings footer.

### Changes Required:

#### 1. Create SidebarFooter Component

**File**: `src/components/SidebarFooter.jsx` (NEW)

```jsx
import { Settings, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContextOptimized';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function SidebarFooter() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return;

    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) &&
          buttonRef.current && !buttonRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };

    setTimeout(() => document.addEventListener('click', handleClick), 0);
    return () => document.removeEventListener('click', handleClick);
  }, [showMenu]);

  const menuPosition = buttonRef.current?.getBoundingClientRect();

  return (
    <div className="flex-shrink-0 p-3 border-t border-white/5">
      <div className="flex items-center gap-2">
        {/* Settings Button */}
        <button
          onClick={() => navigate('/settings')}
          className="flex items-center justify-center w-9 h-9 rounded-lg
                     text-white/50 hover:text-white/90 hover:bg-white/10
                     transition-all duration-150"
          title="Settings"
        >
          <Settings size={18} />
        </button>

        {/* Profile Button */}
        <button
          ref={buttonRef}
          onClick={() => setShowMenu(!showMenu)}
          className="flex-1 flex items-center gap-3 px-2 py-1.5 rounded-lg
                     hover:bg-white/5 transition-all duration-150"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600
                          flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-medium">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="text-sm text-white/90 truncate">
              {user?.user_metadata?.full_name || 'User'}
            </div>
            <div className="text-xs text-white/40 truncate">
              {user?.email}
            </div>
          </div>
        </button>
      </div>

      {/* Profile Menu Dropdown */}
      {showMenu && menuPosition && createPortal(
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            bottom: window.innerHeight - menuPosition.top + 8,
            left: menuPosition.left,
            width: menuPosition.width + 40,
            zIndex: 9999
          }}
          className="bg-[#0f1d32] border border-white/10 rounded-xl shadow-2xl
                     overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150"
        >
          <div className="p-1">
            <button
              onClick={() => {
                setShowMenu(false);
                navigate('/settings');
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg
                         text-white/70 hover:text-white hover:bg-white/10
                         transition-colors text-sm"
            >
              <Settings size={16} />
              Settings
            </button>

            <div className="h-px bg-white/10 my-1" />

            <button
              onClick={() => {
                setShowMenu(false);
                signOut();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg
                         text-red-400 hover:text-red-300 hover:bg-red-500/10
                         transition-colors text-sm"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
```

#### 2. Add Inbox Section to Sidebar

**File**: `src/components/ProjectExplorer/ProjectExplorerRedesigned.jsx`

**Add Inbox section** (after Favorites, before Folders):

```jsx
// Add imports
import { Inbox } from 'lucide-react';
import SidebarFooter from '../SidebarFooter';

// Add Inbox state
const [inboxExpanded, setInboxExpanded] = useState(true);

// Add Inbox documents computation
const inboxDocuments = useMemo(() => {
  return documents.filter(doc => !doc.folder_id);
}, [documents]);

// In the render, add Inbox section:
{/* Inbox Section */}
<div className="flex-shrink-0 px-3 py-2">
  <SidebarSectionHeader
    icon={<Inbox size={16} className="text-amber-400" />}
    title="Inbox"
    count={inboxDocuments.length}
    isExpanded={inboxExpanded}
    onToggle={() => setInboxExpanded(!inboxExpanded)}
    showCount={true}
  />

  {inboxExpanded && inboxDocuments.length > 0 && (
    <div className="mt-1 space-y-0.5">
      {inboxDocuments.map(doc => (
        <SidebarTreeItem
          key={doc.id}
          item={{ ...doc, type: 'document', name: doc.title }}
          depth={0}
          isExpanded={false}
          onItemClick={handleItemClick}
          isSelected={doc.id === selectedDocumentId}
        />
      ))}
    </div>
  )}

  {inboxExpanded && inboxDocuments.length === 0 && (
    <div className="px-3 py-4 text-center text-white/30 text-xs">
      No unsorted documents
    </div>
  )}
</div>
```

#### 2. Add Selection Highlighting to SidebarTreeItem

**File**: `src/components/ProjectExplorer/SidebarTreeItem.jsx`

**Add `isSelected` prop** and apply styling:

```jsx
export default function SidebarTreeItem({
  item,
  depth = 0,
  isExpanded,
  onToggle,
  expandedFolders,
  isFavorite,
  isLast,
  onItemClick,
  onContextMenu,
  isSelected = false,  // ADD THIS PROP
}) {
  // ... existing code ...

  // Update the main button className to include selection state:
  className={`
    w-full flex items-center gap-2 py-1.5 pr-2 group relative
    transition-all duration-200 rounded-lg
    ${isSelected
      ? 'bg-emerald-500/20 text-white border-l-2 border-emerald-400'
      : isFile
        ? 'hover:bg-white/[0.03] text-white/60 hover:text-white/90'
        : 'hover:bg-gradient-to-r hover:from-white/5 hover:to-transparent text-white/70 hover:text-white/95'
    }
  `}
```

#### 3. Add Search with Persistence

**File**: `src/components/ProjectExplorer/ProjectExplorerRedesigned.jsx`

**Add search state and filtering:**

```jsx
const [searchQuery, setSearchQuery] = useState('');
const [isSearchMode, setIsSearchMode] = useState(false);

// Filter documents based on search
const searchResults = useMemo(() => {
  if (!searchQuery.trim()) return [];
  const query = searchQuery.toLowerCase();
  return documents.filter(doc =>
    doc.title?.toLowerCase().includes(query)
  );
}, [documents, searchQuery]);

// In render, add search input at top:
<div className="px-3 py-2 flex-shrink-0">
  <div className="relative">
    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
    <input
      type="text"
      value={searchQuery}
      onChange={(e) => {
        setSearchQuery(e.target.value);
        setIsSearchMode(!!e.target.value);
      }}
      placeholder="Search documents..."
      className="w-full pl-9 pr-8 py-2 rounded-lg
                 bg-white/5 border border-white/10
                 text-white/90 placeholder-white/40
                 text-sm focus:outline-none focus:border-emerald-500/50
                 transition-colors duration-200"
    />
    {searchQuery && (
      <button
        onClick={() => {
          setSearchQuery('');
          setIsSearchMode(false);
        }}
        className="absolute right-2 top-1/2 -translate-y-1/2
                   p-1 rounded hover:bg-white/10 text-white/40 hover:text-white/70"
      >
        <X size={14} />
      </button>
    )}
  </div>
</div>

{/* Conditional render: search results or normal tree */}
{isSearchMode ? (
  <div className="px-3 py-2">
    <div className="text-xs text-white/40 mb-2">
      {searchResults.length} results
    </div>
    {searchResults.map(doc => (
      <SidebarTreeItem
        key={doc.id}
        item={{ ...doc, type: 'document', name: doc.title }}
        depth={0}
        onItemClick={handleItemClick}
        isSelected={doc.id === selectedDocumentId}
      />
    ))}
  </div>
) : (
  // ... existing Favorites, Inbox, Folders sections ...
)}
```

### Success Criteria:

#### Automated Verification:
- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds

#### Manual Verification:
- [ ] Inbox section shows documents without folders
- [ ] Inbox count badge accurate
- [ ] Selected document highlighted in sidebar
- [ ] Search filters documents
- [ ] Search mode persists when clicking result
- [ ] Clear button exits search mode

---

## Phase 6: Mobile Adaptation

### Overview
Adapt tab UI for mobile devices.

### Changes Required:

#### 1. Mobile Tab Dropdown

**File**: `src/components/TabBar.jsx`

**Add mobile detection and dropdown mode:**

```jsx
import { useState, useRef, useEffect } from 'react';
import { X, Plus, ChevronDown } from 'lucide-react';

export default function TabBar({ onNewTab, onTabClick }) {
  const { tabs, activeTabId, closeTab, setActiveTabId } = useTabContext();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const activeTab = tabs.find(t => t.id === activeTabId);

  if (isMobile) {
    return (
      <div className="flex items-center h-12 bg-[#0a1628]/80 backdrop-blur-sm border-b border-white/5 px-3">
        {/* Current tab dropdown trigger */}
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg
                     bg-white/5 text-white/90 text-sm"
        >
          <span className="truncate">{activeTab?.title || 'No document'}</span>
          <ChevronDown size={16} className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
        </button>

        {/* New tab button */}
        <button
          onClick={onNewTab}
          className="p-2 ml-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10"
        >
          <Plus size={20} />
        </button>

        {/* Dropdown */}
        {showDropdown && (
          <div className="absolute top-12 left-3 right-3 z-50
                          bg-[#0a1628] border border-white/10 rounded-xl shadow-xl
                          max-h-[60vh] overflow-y-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTabId(tab.id);
                  onTabClick?.(tab.id);
                  setShowDropdown(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-3
                           border-b border-white/5 last:border-0
                           ${tab.id === activeTabId ? 'bg-emerald-500/10 text-emerald-400' : 'text-white/70'}`}
              >
                <span className="truncate">{tab.title}</span>
                <X
                  size={16}
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                  className="text-white/40 hover:text-white/80"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Desktop tab bar (existing code)
  return (
    // ... existing desktop implementation ...
  );
}
```

#### 2. Mobile Sidebar as Drawer

The existing mobile sidebar already works as a drawer. Ensure it integrates with the new tab system.

### Success Criteria:

#### Automated Verification:
- [ ] Build succeeds
- [ ] No mobile-specific errors

#### Manual Verification:
- [ ] Mobile shows dropdown instead of tabs
- [ ] Dropdown lists all open tabs
- [ ] Can switch tabs from dropdown
- [ ] Can close tabs from dropdown
- [ ] [+] button works on mobile

---

## Phase 7: Cleanup & Polish

### Overview
Remove deprecated files and polish the implementation.

### Files to Delete:
```
src/components/DocumentGridRedesigned.jsx
src/components/EntryCardRedesigned.jsx
src/components/EntryCard.jsx
src/components/FolderCard.jsx
src/components/DocumentCardSkeleton.jsx
src/components/FolderCardSkeleton.jsx
```

### Code to Remove from Dashboard.jsx:
- All card-related state
- Card filtering logic
- Card hover/preload handlers
- DocumentGrid rendering

### Polish Items:
- [ ] Add tab context menu (right-click)
- [ ] Add tab overflow dropdown for many tabs
- [ ] Smooth tab transitions
- [ ] Tab favicon/icon based on content type

---

## Technical Considerations

### Performance
- Only render active tab's document content
- Preserve scroll position for inactive tabs (future)
- Lazy load document content when tab becomes active

### State Management
- Tab state is LOCAL only (localStorage)
- Document content syncs via existing SmartSync
- Tab titles update when document title changes

### Edge Cases
- Deleted document: auto-close tab
- Network offline: tabs still work (local)
- Very long document titles: truncate with ellipsis
- Many tabs: overflow dropdown

---

## Testing Checklist

### Unit Tests (Future)
- [ ] TabContext state management
- [ ] Tab persistence to localStorage
- [ ] Keyboard shortcut handling

### Manual Testing
- [ ] Fresh install (no localStorage)
- [ ] Session restoration
- [ ] Multiple tabs workflow
- [ ] Tab close behavior
- [ ] Sidebar integration
- [ ] Mobile experience
- [ ] Keyboard shortcuts
- [ ] Search persistence

---

## Rollback Plan

If issues arise:
1. TabContext can be disabled by removing from App.jsx providers
2. Dashboard can be reverted to show card grid (git revert)
3. Card components remain in codebase until Phase 7 cleanup

---

## References

- Vision document: `AI-MEMORY/VISION-sidebar-only-redesign.md`
- Current Dashboard: `src/pages/Dashboard.jsx`
- Current Sidebar: `src/components/ProjectExplorer/ProjectExplorerRedesigned.jsx`
- Styling patterns: `tailwind.config.js`, `src/styles/`

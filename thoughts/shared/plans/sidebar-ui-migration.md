# Sidebar UI Migration Plan

## Overview

Migrate the new sidebar UI design from `Revampuiforbetterexperiencecopy` to the devlog platform. The new design features an **Activity Bar pattern** (like VS Code/Claude) with multiple switchable views (Explorer, Search, Recent, Favorites, Inbox) vs the current single-panel design.

## Current State Analysis

### Current Devlog Sidebar (`ProjectExplorerRedesigned.jsx`)
- **Single panel** with inline sections (Inbox, Favorites, All Folders)
- Built-in search bar at top
- Collapse to 80px showing icons
- Uses custom hooks (`useFolders`)
- Connected to Supabase backend
- React Router navigation
- Framer Motion animations

### New UI Design (`Revampuiforbetterexperiencecopy`)
- **Activity Bar + Content Panel** architecture
- 5 switchable views with dedicated components
- Collapse to 48px (Activity Bar only)
- TypeScript with shadcn/ui components
- Uses `motion` (Framer Motion alias)
- Mock data (no backend)

## What We're NOT Doing

- **NOT migrating TypeScript** - keeping JSX
- **NOT replacing data layer** - keeping Supabase/hooks integration
- **NOT copying shadcn/ui wholesale** - only needed primitives
- **NOT changing routing** - keeping React Router
- **NOT adding new backend features** - UI-only migration

## Desired End State

A sidebar with:
1. Activity Bar (48px) always visible with view icons
2. Content panel (232px) that shows different views
3. Smooth collapse animation to Activity Bar only
4. 5 views: Search, Explorer, Recent, Favorites, Inbox
5. Profile/Settings dropdown at bottom
6. Preserved existing functionality (folders, favorites, document selection)

### Verification:
- Sidebar expands/collapses smoothly
- All 5 views switch correctly
- Document selection works
- Folder tree displays correctly
- Search filters documents
- Recent shows time-grouped documents
- Favorites shows starred items
- Settings navigation works

---

## Dependencies to Add

> **Note**: Since we deploy to Vercel, add dependencies directly to `package.json` (Vercel runs install automatically).

**File**: `package.json` - Add to `"dependencies"` section:
```json
"@radix-ui/react-scroll-area": "^1.2.0",
"@radix-ui/react-tooltip": "^1.1.4",
"@radix-ui/react-dropdown-menu": "^2.1.2",
"@radix-ui/react-avatar": "^1.1.1",
```

**Already installed (no changes needed):**
- `@radix-ui/react-popover` ✅
- `framer-motion` ✅
- `lucide-react` ✅
- `clsx` ✅
- `tailwind-merge` ✅

---

## Phase 1: Add Dependencies & Create UI Primitives

### Overview
Add required Radix UI packages to `package.json` and create the basic UI primitive components needed.

### Changes Required:

#### 1. Add Dependencies to package.json
> **Vercel Deployment**: Add directly to `package.json` - Vercel handles install automatically.

**File**: `package.json` - Add these lines to `"dependencies"` section (around line 18, after existing Radix package):
```json
"@radix-ui/react-avatar": "^1.1.1",
"@radix-ui/react-dropdown-menu": "^2.1.2",
"@radix-ui/react-scroll-area": "^1.2.0",
"@radix-ui/react-tooltip": "^1.1.4",
```

#### 2. Create UI Primitives Directory
**Directory**: `src/components/ui/`

Create these files (adapted from shadcn/ui):

**File**: `src/components/ui/scroll-area.jsx`
```jsx
import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"
import { cn } from "../../utils/cn"

const ScrollArea = React.forwardRef(({ className, children, ...props }, ref) => (
  <ScrollAreaPrimitive.Root
    ref={ref}
    className={cn("relative overflow-hidden", className)}
    {...props}
  >
    <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollBar />
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
))
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName

const ScrollBar = React.forwardRef(({ className, orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      "flex touch-none select-none transition-colors",
      orientation === "vertical" && "h-full w-2 border-l border-l-transparent p-[1px]",
      orientation === "horizontal" && "h-2 flex-col border-t border-t-transparent p-[1px]",
      className
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-white/10 hover:bg-emerald-400/30 transition-colors" />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
))
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName

export { ScrollArea, ScrollBar }
```

**File**: `src/components/ui/tooltip.jsx`
```jsx
import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { cn } from "../../utils/cn"

const TooltipProvider = TooltipPrimitive.Provider
const Tooltip = TooltipPrimitive.Root
const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = React.forwardRef(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "z-50 overflow-hidden rounded-md bg-gray-900/95 backdrop-blur-xl border border-white/10 px-3 py-1.5 text-sm shadow-xl animate-in fade-in-0 zoom-in-95",
      className
    )}
    {...props}
  />
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
```

**File**: `src/components/ui/dropdown-menu.jsx`
```jsx
import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { cn } from "../../utils/cn"

const DropdownMenu = DropdownMenuPrimitive.Root
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger

const DropdownMenuContent = React.forwardRef(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-[8rem] overflow-hidden rounded-md bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 p-1 text-white/90 shadow-xl animate-in fade-in-0 zoom-in-95",
        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
))
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName

const DropdownMenuItem = React.forwardRef(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-white/10 focus:bg-white/10",
      className
    )}
    {...props}
  />
))
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName

const DropdownMenuSeparator = React.forwardRef(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-white/10", className)}
    {...props}
  />
))
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName

const DropdownMenuLabel = React.forwardRef(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn("px-2 py-1.5 text-sm font-semibold", className)}
    {...props}
  />
))
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
}
```

**File**: `src/components/ui/avatar.jsx`
```jsx
import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import { cn } from "../../utils/cn"

const Avatar = React.forwardRef(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarFallback = React.forwardRef(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn("flex h-full w-full items-center justify-center rounded-full bg-emerald-500", className)}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarFallback }
```

**File**: `src/utils/cn.js` - ✅ ALREADY EXISTS (verified)
> This file already exists at `src/utils/cn.js:1-11` with the correct implementation. No changes needed.

### Success Criteria:

#### Automated Verification:
- [ ] `npm run build` passes with new dependencies
- [ ] `npm run lint` passes

#### Manual Verification:
- [ ] Dependencies added to `package.json`
- [ ] UI primitive files exist in `src/components/ui/`

---

## Phase 2: Create Activity Bar Component

### Overview
Create the Activity Bar - the vertical icon strip that's always visible.

### Changes Required:

**File**: `src/components/sidebar/ActivityBar.jsx`
```jsx
import { Search, FolderTree, Clock, Star, Inbox, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

export const ACTIVITY_VIEWS = {
  SEARCH: 'search',
  EXPLORER: 'explorer',
  RECENT: 'recent',
  FAVORITES: 'favorites',
  INBOX: 'inbox',
};

const activities = [
  { id: ACTIVITY_VIEWS.SEARCH, icon: Search, label: 'Search', color: 'text-purple-400' },
  { id: ACTIVITY_VIEWS.EXPLORER, icon: FolderTree, label: 'Explorer', color: 'text-blue-400' },
  { id: ACTIVITY_VIEWS.RECENT, icon: Clock, label: 'Recent', color: 'text-emerald-400' },
  { id: ACTIVITY_VIEWS.FAVORITES, icon: Star, label: 'Favorites', color: 'text-amber-400' },
  { id: ACTIVITY_VIEWS.INBOX, icon: Inbox, label: 'Inbox', color: 'text-cyan-400' },
];

export function ActivityBar({ activeView, onViewChange, onSettingsClick }) {
  return (
    <div className="w-12 h-full bg-[#0a0a0a] flex flex-col items-center">
      {/* Activity Icons */}
      <div className="flex-1 pt-12 pb-2 space-y-1">
        <TooltipProvider>
          {activities.map((activity, index) => {
            const Icon = activity.icon;
            const isActive = activeView === activity.id;

            return (
              <Tooltip key={activity.id} delayDuration={300}>
                <TooltipTrigger asChild>
                  <motion.button
                    onClick={() => onViewChange(activity.id)}
                    className={`
                      w-full h-10 flex items-center justify-center relative
                      transition-colors duration-200
                      ${isActive ? '' : 'hover:bg-white/5'}
                    `}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.2 }}
                  >
                    <Icon className={`
                      w-5 h-5 transition-all duration-200
                      ${isActive ? 'text-white/70' : 'text-white/40 hover:text-white/60'}
                    `} />
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p className="text-white/90 text-sm font-medium">{activity.label}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </div>

      {/* Settings at bottom */}
      <div className="py-2">
        <TooltipProvider>
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <button
                onClick={onSettingsClick}
                className="w-full h-10 flex items-center justify-center hover:bg-white/5 transition-colors duration-200"
              >
                <Settings className="w-5 h-5 text-white/40 hover:text-white/70 transition-colors duration-200" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="text-white/90 text-sm font-medium">Settings</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
```

### Success Criteria:

#### Automated Verification:
- [ ] `npm run build` passes
- [ ] `npm run lint` passes

#### Manual Verification:
- [ ] ActivityBar file exists at `src/components/sidebar/ActivityBar.jsx`

---

## Phase 3: Create Enhanced SidebarTreeItem with View Modes

### Overview
Create a new enhanced SidebarTreeItem component that supports 3 view modes: tree, table, and compact. The current `SidebarTreeItem.jsx` does NOT support view modes, so we need to create an enhanced version.

### Changes Required:

**File**: `src/components/sidebar/SidebarTreeItemEnhanced.jsx`
```jsx
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight, Folder, FolderOpen, FileText, MoreHorizontal, FolderPlus, FilePlus, Trash2 } from 'lucide-react';

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
  isSelected = false,
  viewMode = 'tree' // NEW: 'tree' | 'table' | 'compact'
}) {
  const hasChildren = item.children && item.children.length > 0;
  const isFile = item.type === 'file' || item.type === 'document';
  const itemCount = item.count || (item.children ? item.children.length : 0);

  // State for dropdown menu
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  // Click-outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  // View mode specific styles
  const getViewModeStyles = () => {
    switch (viewMode) {
      case 'compact':
        return {
          padding: 'py-0.5',
          iconSize: 'w-3 h-3',
          fontSize: 'text-xs',
          spacing: 'gap-1.5',
        };
      case 'table':
        return {
          padding: 'py-2',
          iconSize: 'w-4 h-4',
          fontSize: 'text-sm',
          spacing: 'gap-2',
        };
      case 'tree':
      default:
        return {
          padding: 'py-1.5',
          iconSize: 'w-3.5 h-3.5',
          fontSize: 'text-[13px]',
          spacing: 'gap-2',
        };
    }
  };

  const styles = getViewModeStyles();

  const handleClick = () => {
    if (isFile) {
      onItemClick?.(item);
    } else {
      onToggle?.(item.id);
    }
  };

  // Table view renders as a flat row with columns
  if (viewMode === 'table') {
    return (
      <div className="relative">
        <div
          className={`
            flex items-center ${styles.spacing} ${styles.padding} ${styles.fontSize} transition-all duration-200 group relative
            ${isSelected
              ? 'bg-emerald-500/15 text-emerald-300'
              : isFile
                ? 'text-white/60 hover:text-white/90 cursor-pointer hover:bg-white/[0.03]'
                : 'text-white/70 hover:text-white/95 cursor-pointer hover:bg-white/[0.03]'
            }
            rounded-lg px-2
          `}
          onClick={handleClick}
        >
          {/* Icon + Name Column */}
          <div className="flex-1 flex items-center gap-2 min-w-0">
            {isFile ? (
              <FileText className={`${styles.iconSize} text-white/30 group-hover:text-emerald-400/90 transition-all duration-200 flex-shrink-0`} />
            ) : (
              <Folder className={`
                ${styles.iconSize} flex-shrink-0 transition-all duration-200
                ${isFavorite
                  ? 'text-amber-400/90 group-hover:text-amber-300'
                  : 'text-blue-400/80 group-hover:text-blue-300'
                }
              `} />
            )}
            <span className="flex-1 truncate transition-all duration-200">
              {item.name || item.title}
            </span>
          </div>

          {/* Modified Column */}
          <div className="w-20 text-[11px] text-white/40 flex-shrink-0">
            {item.lastModified || '-'}
          </div>

          {/* Type Column */}
          <div className="w-14 text-[11px] text-white/40 capitalize flex-shrink-0">
            {item.type === 'document' ? 'file' : item.type}
          </div>

          {/* Context Menu Button */}
          <button
            ref={buttonRef}
            onClick={(e) => {
              e.stopPropagation();
              if (!showMenu && buttonRef.current) {
                const rect = buttonRef.current.getBoundingClientRect();
                setMenuPosition({ top: rect.bottom + 4, left: rect.left });
              }
              setShowMenu(!showMenu);
            }}
            className="opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded p-0.5 transition-all duration-200 flex-shrink-0"
          >
            <MoreHorizontal className={`${styles.iconSize} text-white/40 hover:text-white/80`} />
          </button>

          {/* Hover indicator line */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-0 bg-gradient-to-b from-emerald-400 to-emerald-500 rounded-full group-hover:h-4 transition-all duration-200 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
        </div>

        {/* Context Menu Portal */}
        {showMenu && createPortal(
          <div
            ref={menuRef}
            style={{ position: 'fixed', top: `${menuPosition.top}px`, left: `${menuPosition.left}px`, zIndex: 9999 }}
            className="bg-[#1a2942]/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-xl w-48 py-1 animate-in fade-in slide-in-from-top-1 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {!isFile && (
              <>
                <button className="flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/10 w-full text-left transition-colors"
                  onClick={(e) => { e.stopPropagation(); setShowMenu(false); onContextMenu?.({}, { ...item, action: 'newFolder' }); }}>
                  <FolderPlus className="w-4 h-4 text-blue-400" /><span>New Folder</span>
                </button>
                <button className="flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/10 w-full text-left transition-colors"
                  onClick={(e) => { e.stopPropagation(); setShowMenu(false); onContextMenu?.({}, { ...item, action: 'newFile' }); }}>
                  <FilePlus className="w-4 h-4 text-emerald-400" /><span>New Document</span>
                </button>
                <div className="h-px bg-white/10 my-1" />
              </>
            )}
            <button className="flex items-center gap-2 px-3 py-2 text-sm text-red-400/80 hover:text-red-300 hover:bg-red-500/10 w-full text-left transition-colors"
              onClick={(e) => { e.stopPropagation(); setShowMenu(false); onContextMenu?.({}, { ...item, action: 'delete' }); }}>
              <Trash2 className="w-4 h-4" /><span>Delete</span>
            </button>
          </div>,
          document.body
        )}
      </div>
    );
  }

  // Tree and Compact view (hierarchical with children)
  return (
    <div className="relative">
      {/* Tree guide lines - only in tree/compact mode */}
      {viewMode !== 'table' && depth > 0 && (
        <div
          className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-white/10 via-white/5 to-transparent"
          style={{ left: `${(depth - 1) * 16 + 20}px` }}
        />
      )}

      <div
        className={`
          flex items-center ${styles.spacing} ${styles.padding} ${styles.fontSize} transition-all duration-200 group relative rounded-lg
          ${isSelected
            ? 'bg-emerald-500/15 text-emerald-300 border-l-2 border-emerald-400'
            : isFile
              ? 'text-white/60 hover:text-white/90 cursor-pointer hover:bg-white/[0.03]'
              : 'text-white/70 hover:text-white/95 cursor-pointer hover:bg-gradient-to-r hover:from-white/5 hover:to-transparent'
          }
        `}
        style={{ paddingLeft: `${depth * 16 + 12}px` }}
        onClick={handleClick}
        title={item.name || item.title}
      >
        {/* Chevron for folders with children - not in table view */}
        {!isFile && hasChildren && (
          <ChevronRight
            className={`
              ${styles.iconSize} text-white/40 transition-all duration-300 flex-shrink-0
              ${isExpanded ? 'rotate-90 text-emerald-400/80' : 'group-hover:text-white/60'}
            `}
          />
        )}

        {/* Spacer for folders without children */}
        {!isFile && !hasChildren && (
          <div className={`${styles.iconSize} flex-shrink-0`} />
        )}

        {/* Icon */}
        {isFile ? (
          <FileText className={`${styles.iconSize} transition-all duration-200 flex-shrink-0 ${isSelected ? 'text-emerald-400' : 'text-white/30 group-hover:text-emerald-400/90'}`} />
        ) : isExpanded ? (
          <FolderOpen className={`${viewMode === 'compact' ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-emerald-400 group-hover:text-emerald-300 transition-all duration-200 flex-shrink-0 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]`} />
        ) : (
          <Folder className={`
            ${viewMode === 'compact' ? 'w-3.5 h-3.5' : 'w-4 h-4'} flex-shrink-0 transition-all duration-200
            ${isFavorite
              ? 'text-amber-400/90 group-hover:text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.2)]'
              : 'text-blue-400/80 group-hover:text-blue-300 group-hover:drop-shadow-[0_0_8px_rgba(96,165,250,0.2)]'
            }
          `} />
        )}

        {/* Name */}
        <span className={`flex-1 truncate transition-all duration-200 ${isFile ? 'group-hover:translate-x-0.5' : ''}`}>
          {item.name || item.title}
        </span>

        {/* Count badge - NOT in compact mode */}
        {itemCount > 0 && viewMode !== 'compact' && (
          <span className="text-[11px] text-white/30 bg-white/5 px-1.5 py-0.5 rounded-md group-hover:bg-emerald-500/10 group-hover:text-emerald-400/90 transition-all duration-200 flex-shrink-0 border border-white/5">
            {itemCount}
          </span>
        )}

        {/* Compact count - just number */}
        {itemCount > 0 && viewMode === 'compact' && (
          <span className="text-[10px] text-white/30 flex-shrink-0">
            {itemCount}
          </span>
        )}

        {/* Context Menu Button */}
        <button
          ref={buttonRef}
          onClick={(e) => {
            e.stopPropagation();
            if (!showMenu && buttonRef.current) {
              const rect = buttonRef.current.getBoundingClientRect();
              setMenuPosition({ top: rect.bottom + 4, left: rect.left });
            }
            setShowMenu(!showMenu);
          }}
          className="opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded p-1 transition-all duration-200 flex-shrink-0"
        >
          <MoreHorizontal className={`${styles.iconSize} text-white/40 hover:text-white/80`} />
        </button>

        {/* Context Menu Portal */}
        {showMenu && createPortal(
          <div
            ref={menuRef}
            style={{ position: 'fixed', top: `${menuPosition.top}px`, left: `${menuPosition.left}px`, zIndex: 9999 }}
            className="bg-[#1a2942]/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-xl w-48 py-1 animate-in fade-in slide-in-from-top-1 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {!isFile && (
              <>
                <button className="flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/10 w-full text-left transition-colors"
                  onClick={(e) => { e.stopPropagation(); setShowMenu(false); onContextMenu?.({}, { ...item, action: 'newFolder' }); }}>
                  <FolderPlus className="w-4 h-4 text-blue-400" /><span>New Folder</span>
                </button>
                <button className="flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/10 w-full text-left transition-colors"
                  onClick={(e) => { e.stopPropagation(); setShowMenu(false); onContextMenu?.({}, { ...item, action: 'newFile' }); }}>
                  <FilePlus className="w-4 h-4 text-emerald-400" /><span>New Document</span>
                </button>
                <div className="h-px bg-white/10 my-1" />
              </>
            )}
            <button className="flex items-center gap-2 px-3 py-2 text-sm text-red-400/80 hover:text-red-300 hover:bg-red-500/10 w-full text-left transition-colors"
              onClick={(e) => { e.stopPropagation(); setShowMenu(false); onContextMenu?.({}, { ...item, action: 'delete' }); }}>
              <Trash2 className="w-4 h-4" /><span>Delete</span>
            </button>
          </div>,
          document.body
        )}

        {/* Hover indicator line */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-0 bg-gradient-to-b from-emerald-400 to-emerald-500 rounded-full group-hover:h-4 transition-all duration-200 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
      </div>

      {/* Render children recursively - not in table view */}
      {!isFile && isExpanded && hasChildren && viewMode !== 'table' && (
        <div className="overflow-hidden animate-in slide-in-from-top-1 duration-200">
          <div className={viewMode === 'compact' ? 'space-y-0' : 'space-y-0.5 py-0.5'}>
            {item.children.map((child, index) => (
              <SidebarTreeItemEnhanced
                key={child.id}
                item={child}
                isExpanded={expandedFolders?.has(child.id)}
                onToggle={onToggle}
                expandedFolders={expandedFolders}
                depth={depth + 1}
                isFavorite={child.favorite || child.isFavorite}
                isLast={index === item.children.length - 1}
                onItemClick={onItemClick}
                onContextMenu={onContextMenu}
                isSelected={isSelected}
                viewMode={viewMode}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

### Success Criteria:

#### Automated Verification:
- [ ] `npm run build` passes
- [ ] `npm run lint` passes

#### Manual Verification:
- [ ] SidebarTreeItemEnhanced.jsx exists at `src/components/sidebar/SidebarTreeItemEnhanced.jsx`
- [ ] Tree view shows hierarchical folders with indentation
- [ ] Table view shows flat rows with columns (Name, Modified, Type)
- [ ] Compact view shows minimal spacing with smaller icons/text

---

## Phase 4: Create View Components

### Overview
Create the 5 view components that display in the sidebar content area.

### Changes Required:

#### 1. SearchView Component
**File**: `src/components/sidebar/views/SearchView.jsx`
```jsx
import { useState, useMemo } from 'react';
import { Search, FileText, Folder, Star, ArrowRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from '../../ui/scroll-area';

export function SearchView({ documents = [], onDocumentClick }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeFilter, setActiveFilter] = useState('all');

  const filteredResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return documents
      .filter(doc => {
        const matchesQuery = doc.title?.toLowerCase().includes(q) ||
                            doc.name?.toLowerCase().includes(q);
        const matchesFilter = activeFilter === 'all' ||
          (activeFilter === 'documents' && doc.type !== 'folder') ||
          (activeFilter === 'folders' && doc.type === 'folder');
        return matchesQuery && matchesFilter && !doc.deleted_at;
      })
      .slice(0, 15);
  }, [documents, query, activeFilter]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (filteredResults.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + (filteredResults.length || 1)) % (filteredResults.length || 1));
    } else if (e.key === 'Enter' && filteredResults[selectedIndex]) {
      e.preventDefault();
      onDocumentClick?.(filteredResults[selectedIndex]);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 pt-4 pb-3">
        <h2 className="text-xs text-white/50 uppercase tracking-wide mb-3">Search</h2>

        {/* Search Input */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search files and folders..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-8 py-2 text-sm text-white/90 placeholder:text-white/40 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 focus:outline-none transition-all"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {['all', 'documents', 'folders'].map((filter) => (
            <button
              key={filter}
              onClick={() => { setActiveFilter(filter); setSelectedIndex(0); }}
              className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${
                activeFilter === filter
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'text-white/50 hover:bg-white/5 hover:text-white/70'
              }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>

        {query && (
          <p className="text-xs text-white/40 mt-2">
            {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="px-2 pb-4">
          <AnimatePresence mode="popLayout">
            {filteredResults.length > 0 ? (
              filteredResults.map((result, index) => {
                const isSelected = index === selectedIndex;
                const Icon = result.type === 'folder' ? Folder : FileText;

                return (
                  <motion.button
                    key={result.id}
                    onClick={() => onDocumentClick?.(result)}
                    className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-md transition-all duration-150 group mb-0.5 ${
                      isSelected ? 'bg-purple-500/10' : 'hover:bg-white/5'
                    }`}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.02 }}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                      isSelected ? 'text-purple-400' : 'text-white/50'
                    }`} />
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className={`text-sm truncate ${isSelected ? 'text-white/90' : 'text-white/70'}`}>
                          {result.title || result.name}
                        </span>
                        {result.is_favorite && (
                          <Star className="w-3 h-3 text-amber-400 fill-current shrink-0" />
                        )}
                      </div>
                    </div>
                    {isSelected && <ArrowRight className="w-4 h-4 text-purple-400 shrink-0" />}
                  </motion.button>
                );
              })
            ) : query ? (
              <motion.div className="p-8 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Search className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <p className="text-sm text-white/50">No results found</p>
              </motion.div>
            ) : (
              <motion.div className="p-8 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Search className="w-12 h-12 text-purple-400/30 mx-auto mb-3" />
                <p className="text-sm text-white/60 mb-1">Search Your Files</p>
                <p className="text-xs text-white/40">Type to find documents and folders</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
}
```

#### 2. ExplorerView Component (with 3 View Modes)
**File**: `src/components/sidebar/views/ExplorerView.jsx`
```jsx
import { useState, useMemo } from 'react';
import { FolderTree, FolderPlus, List, Rows3 } from 'lucide-react';
import { ScrollArea } from '../../ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import SidebarTreeItemEnhanced from '../SidebarTreeItemEnhanced'; // NEW: Enhanced version with view modes

export function ExplorerView({
  documents = [],
  folders = [],
  onDocumentClick,
  onCreateFolder,
  onContextMenu,
  selectedDocumentId,
  expandedFolders,
  onToggleFolder
}) {
  const [viewMode, setViewMode] = useState('tree');

  // Build folder tree with documents
  const folderTree = useMemo(() => {
    const addDocumentsToFolder = (folder) => {
      const folderDocs = documents
        .filter(doc => doc.type !== 'folder' && doc.folder_id === folder.id)
        .map(doc => ({ ...doc, type: 'document', name: doc.title }));

      const updatedChildren = (folder.children || []).map(addDocumentsToFolder);

      return {
        ...folder,
        type: 'folder',
        children: [...updatedChildren, ...folderDocs],
        count: updatedChildren.length + folderDocs.length
      };
    };

    const rootFoldersWithDocs = folders.map(addDocumentsToFolder);
    const rootDocuments = documents
      .filter(doc => doc.type !== 'folder' && !doc.folder_id && !doc.deleted_at)
      .map(doc => ({ ...doc, type: 'document', name: doc.title }));

    return [...rootFoldersWithDocs, ...rootDocuments];
  }, [folders, documents]);

  const viewModes = [
    { id: 'tree', icon: FolderTree, label: 'Tree View' },
    { id: 'table', icon: List, label: 'List View' },
    { id: 'compact', icon: Rows3, label: 'Compact View' },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs text-white/50 uppercase tracking-wide">Explorer</h2>
          <button
            onClick={onCreateFolder}
            className="p-1 rounded-md hover:bg-white/10 transition-all duration-200 group"
            title="New Folder"
          >
            <FolderPlus className="w-4 h-4 text-white/40 group-hover:text-emerald-400 transition-colors" />
          </button>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 p-0.5 bg-white/5 rounded-lg">
          {viewModes.map((mode) => {
            const Icon = mode.icon;
            const isActive = viewMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id)}
                className={`flex-1 relative px-2 py-1.5 rounded-md transition-all duration-200 ${
                  isActive ? 'text-white/90' : 'text-white/40 hover:text-white/60'
                }`}
                title={mode.label}
              >
                {isActive && (
                  <motion.div
                    layoutId="explorerViewModeIndicator"
                    className="absolute inset-0 bg-white/10 rounded-md"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <Icon className="w-3.5 h-3.5 mx-auto relative z-10" />
              </button>
            );
          })}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={viewMode}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="px-2 pb-4"
          >
            <div className={viewMode === 'compact' ? 'space-y-0' : 'space-y-0.5'}>
              {folderTree.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                >
                  <SidebarTreeItemEnhanced
                    item={item}
                    isExpanded={expandedFolders?.has(item.id)}
                    onToggle={onToggleFolder}
                    expandedFolders={expandedFolders}
                    depth={0}
                    isFavorite={false}
                    isLast={index === folderTree.length - 1}
                    onItemClick={onDocumentClick}
                    onContextMenu={onContextMenu}
                    isSelected={selectedDocumentId === item.id}
                    viewMode={viewMode}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </ScrollArea>
    </div>
  );
}
```

#### 3. RecentView Component
**File**: `src/components/sidebar/views/RecentView.jsx`
```jsx
import { useMemo } from 'react';
import { FileText, Folder } from 'lucide-react';
import { ScrollArea } from '../../ui/scroll-area';
import { motion } from 'framer-motion';

export function RecentView({ documents = [], onDocumentClick }) {
  // Group documents by time periods
  const groupedDocs = useMemo(() => {
    const now = Date.now();
    const groups = {
      'Today': [],
      'Yesterday': [],
      'This Week': [],
      'Last Week': [],
      'Older': [],
    };

    const sortedDocs = [...documents]
      .filter(doc => doc.type !== 'folder' && !doc.deleted_at && doc.updated_at)
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      .slice(0, 30);

    sortedDocs.forEach(doc => {
      const timestamp = new Date(doc.updated_at).getTime();
      const diffMs = now - timestamp;
      const diffHours = diffMs / (1000 * 60 * 60);
      const diffDays = diffHours / 24;

      if (diffHours < 24) {
        groups['Today'].push(doc);
      } else if (diffDays < 2) {
        groups['Yesterday'].push(doc);
      } else if (diffDays < 7) {
        groups['This Week'].push(doc);
      } else if (diffDays < 14) {
        groups['Last Week'].push(doc);
      } else {
        groups['Older'].push(doc);
      }
    });

    return Object.entries(groups).filter(([_, docs]) => docs.length > 0);
  }, [documents]);

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 pt-4 pb-3">
        <h2 className="text-xs text-white/50 uppercase tracking-wide">Recent</h2>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-2 pb-4">
          {groupedDocs.map(([period, docs], groupIndex) => (
            <div key={period} className="mb-4">
              <div className="px-2 mb-2">
                <h3 className="text-[11px] text-white/40 uppercase tracking-wider">{period}</h3>
              </div>

              <div className="space-y-0.5">
                {docs.map((doc, index) => {
                  const Icon = doc.type === 'folder' ? Folder : FileText;

                  return (
                    <motion.div
                      key={doc.id}
                      onClick={() => onDocumentClick?.({ ...doc, type: 'document', name: doc.title })}
                      className="group flex items-center gap-3 px-2.5 py-2 rounded-md cursor-pointer hover:bg-white/5 transition-all duration-200"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: (groupIndex * 0.1) + (index * 0.03) }}
                    >
                      <Icon className="w-4 h-4 text-white/50 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-white/70 truncate group-hover:text-white/90 transition-colors">
                          {doc.title}
                        </div>
                        <div className="text-xs text-white/40">
                          {formatTime(doc.updated_at)}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}

          {groupedDocs.length === 0 && (
            <div className="p-8 text-center">
              <FileText className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <p className="text-sm text-white/50">No recent documents</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
```

#### 4. FavoritesView Component
**File**: `src/components/sidebar/views/FavoritesView.jsx`
```jsx
import { useMemo } from 'react';
import { Star, FileText, Folder } from 'lucide-react';
import { ScrollArea } from '../../ui/scroll-area';
import { motion } from 'framer-motion';

export function FavoritesView({ documents = [], folders = [], onDocumentClick }) {
  const favorites = useMemo(() => {
    const favDocs = documents
      .filter(doc => doc.is_favorite && !doc.deleted_at)
      .map(doc => ({ ...doc, type: 'document', name: doc.title }));

    const favFolders = folders
      .filter(f => f.isFavorite || f.favorite)
      .map(f => ({ ...f, type: 'folder' }));

    return { documents: favDocs, folders: favFolders };
  }, [documents, folders]);

  const hasItems = favorites.documents.length > 0 || favorites.folders.length > 0;

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 pt-4 pb-3">
        <h2 className="text-xs text-white/50 uppercase tracking-wide">Favorites</h2>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-2 pb-4">
          {hasItems ? (
            <>
              {/* Favorite Folders */}
              {favorites.folders.length > 0 && (
                <div className="mb-4">
                  <div className="px-2 mb-2">
                    <h3 className="text-[11px] text-white/40 uppercase tracking-wider">Folders</h3>
                  </div>
                  <div className="space-y-0.5">
                    {favorites.folders.map((folder, index) => (
                      <motion.div
                        key={folder.id}
                        onClick={() => onDocumentClick?.(folder)}
                        className="group flex items-center gap-3 px-2.5 py-2 rounded-md cursor-pointer hover:bg-white/5 transition-all"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        <Folder className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="flex-1 text-sm text-white/70 truncate group-hover:text-white/90">
                          {folder.name}
                        </span>
                        <Star className="w-3 h-3 text-amber-400 fill-current shrink-0" />
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Favorite Documents */}
              {favorites.documents.length > 0 && (
                <div>
                  <div className="px-2 mb-2">
                    <h3 className="text-[11px] text-white/40 uppercase tracking-wider">Documents</h3>
                  </div>
                  <div className="space-y-0.5">
                    {favorites.documents.map((doc, index) => (
                      <motion.div
                        key={doc.id}
                        onClick={() => onDocumentClick?.(doc)}
                        className="group flex items-center gap-3 px-2.5 py-2 rounded-md cursor-pointer hover:bg-white/5 transition-all"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        <FileText className="w-4 h-4 text-white/50 shrink-0" />
                        <span className="flex-1 text-sm text-white/70 truncate group-hover:text-white/90">
                          {doc.title || doc.name}
                        </span>
                        <Star className="w-3 h-3 text-amber-400 fill-current shrink-0" />
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-8 text-center">
              <Star className="w-12 h-12 text-amber-400/20 mx-auto mb-3" />
              <p className="text-sm text-white/50">No favorites yet</p>
              <p className="text-xs text-white/30 mt-1">Star documents to see them here</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
```

#### 5. InboxView Component
**File**: `src/components/sidebar/views/InboxView.jsx`
```jsx
import { useMemo } from 'react';
import { Inbox, FileText, FilePlus, Archive, Trash2 } from 'lucide-react';
import { ScrollArea } from '../../ui/scroll-area';
import { motion } from 'framer-motion';

export function InboxView({ documents = [], onDocumentClick, onCreateDocument, onDocumentDelete }) {
  const inboxDocuments = useMemo(() => {
    return documents
      .filter(doc => doc.type !== 'folder' && !doc.folder_id && !doc.deleted_at)
      .map(doc => ({ ...doc, type: 'document', name: doc.title }));
  }, [documents]);

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs text-white/50 uppercase tracking-wide">Inbox</h2>
          <button
            onClick={onCreateDocument}
            className="p-1 rounded-md hover:bg-white/10 transition-all duration-200 group"
            title="New Document"
          >
            <FilePlus className="w-4 h-4 text-white/40 group-hover:text-cyan-400 transition-colors" />
          </button>
        </div>
        <p className="text-xs text-white/30 mt-1">
          {inboxDocuments.length} uncategorized document{inboxDocuments.length !== 1 ? 's' : ''}
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-2 pb-4">
          {inboxDocuments.length > 0 ? (
            <div className="space-y-0.5">
              {inboxDocuments.map((doc, index) => (
                <motion.div
                  key={doc.id}
                  className="group flex items-center gap-3 px-2.5 py-2 rounded-md hover:bg-white/5 transition-all cursor-pointer"
                  onClick={() => onDocumentClick?.(doc)}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <FileText className="w-4 h-4 text-cyan-400/60 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white/70 truncate group-hover:text-white/90">
                      {doc.title || 'Untitled'}
                    </div>
                  </div>

                  {/* Quick actions on hover */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); onDocumentDelete?.(doc); }}
                      className="p-1 rounded hover:bg-red-500/20 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Inbox className="w-12 h-12 text-cyan-400/20 mx-auto mb-3" />
              <p className="text-sm text-white/50">Inbox is empty</p>
              <p className="text-xs text-white/30 mt-1">New documents appear here</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
```

### Success Criteria:

#### Automated Verification:
- [ ] `npm run build` passes
- [ ] `npm run lint` passes

#### Manual Verification:
- [ ] All 5 view files exist in `src/components/sidebar/views/`

---

## Phase 5: Create Main Sidebar Component

### Overview
Create the main Sidebar component that combines Activity Bar with the view content.

### ⚠️ IMPORTANT: State Management Strategy
The new Sidebar component will **manage folder state internally** (same as current `ProjectExplorerRedesigned.jsx`) to minimize Dashboard changes. This means:
- `useFolders()` hook is called INSIDE Sidebar, not passed from Dashboard
- `expandedFolders` state is managed INSIDE Sidebar
- `toggleFolder` handler is defined INSIDE Sidebar

This approach matches the current architecture and reduces integration complexity.

### Changes Required:

**File**: `src/components/sidebar/Sidebar.jsx`
```jsx
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PanelLeftClose, PanelLeft, LogOut, Settings as SettingsIcon } from 'lucide-react';
import { ActivityBar, ACTIVITY_VIEWS } from './ActivityBar';
import { SearchView } from './views/SearchView';
import { ExplorerView } from './views/ExplorerView';
import { RecentView } from './views/RecentView';
import { FavoritesView } from './views/FavoritesView';
import { InboxView } from './views/InboxView';
import { Avatar, AvatarFallback } from '../ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { useFolders } from '../../hooks/useFolders'; // Internal folder management
import InputModal from '../InputModal';
import ConfirmDialog from '../ConfirmDialog';

/**
 * New Sidebar Component with Activity Bar pattern
 *
 * Props from Dashboard (minimal changes required):
 * - isCollapsed: boolean (inverted to isOpen internally)
 * - onToggleCollapse: function
 * - documents: array (all documents)
 * - selectedDocumentId: string
 * - onDocumentSelect: function (handles both selection AND creation via action: 'create')
 * - onDocumentDelete: function
 * - onCreateDocument: function
 * - user: object
 * - onSignOut: function
 */
export function Sidebar({
  isCollapsed = false,        // Matches current Dashboard prop
  onToggleCollapse,           // Matches current Dashboard prop
  documents = [],
  selectedDocumentId,
  onDocumentSelect,           // Handles BOTH selection and {action: 'create', folderId}
  onDocumentDelete,
  onCreateDocument,
  user,
  onSignOut,
}) {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState(ACTIVITY_VIEWS.EXPLORER);

  // ========== INTERNAL STATE MANAGEMENT (same as ProjectExplorerRedesigned) ==========
  const { folders, createFolder, deleteFolder } = useFolders();
  const [expandedFolders, setExpandedFolders] = useState(new Set(['1']));

  // Modal state
  const [showInputModal, setShowInputModal] = useState(false);
  const [inputModalConfig, setInputModalConfig] = useState({ title: '', onConfirm: null, parentId: null });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmDialogConfig, setConfirmDialogConfig] = useState({ title: '', message: '', onConfirm: null });

  // Toggle folder expansion
  const toggleFolder = (id) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Handle document click - delegates to Dashboard's onDocumentSelect
  const handleDocumentClick = (item) => {
    if (item.type === 'document' || item.type === 'file') {
      onDocumentSelect?.(item);
    }
  };

  // Handle create folder at root
  const handleCreateFolder = () => {
    setInputModalConfig({
      title: 'Create New Folder',
      onConfirm: async (folderName) => {
        await createFolder(folderName, null);
        setShowInputModal(false);
      },
      parentId: null
    });
    setShowInputModal(true);
  };

  // Handle context menu actions (from tree items)
  const handleContextMenu = (e, item) => {
    if (item.action === 'newFolder') {
      setInputModalConfig({
        title: 'Create New Subfolder',
        onConfirm: async (folderName) => {
          await createFolder(folderName, item.id);
          setShowInputModal(false);
        },
        parentId: item.id
      });
      setShowInputModal(true);
    } else if (item.action === 'newFile') {
      // Use Dashboard's action pattern for document creation in folder
      onDocumentSelect?.({ action: 'create', folderId: item.id });
    } else if (item.action === 'delete') {
      handleDeleteItem(item);
    }
  };

  // Delete folder or document
  const handleDeleteItem = (item) => {
    const itemName = item.name || item.title || 'this item';
    const isFolder = item.type === 'folder';

    setConfirmDialogConfig({
      title: isFolder ? 'Delete Folder' : 'Delete Document',
      message: isFolder
        ? `Are you sure you want to delete "${itemName}" and all its contents?`
        : `Are you sure you want to delete "${itemName}"?`,
      onConfirm: async () => {
        if (item.type === 'folder') {
          await deleteFolder(item.id);
        } else {
          onDocumentDelete?.(item);
        }
        setShowConfirmDialog(false);
      }
    });
    setShowConfirmDialog(true);
  };

  // Derive isOpen from isCollapsed (inverted)
  const isOpen = !isCollapsed;

  const renderView = () => {
    // Common props for all views - using internal handlers
    const viewProps = { documents, folders, onDocumentClick: handleDocumentClick };

    switch (activeView) {
      case ACTIVITY_VIEWS.SEARCH:
        return <SearchView {...viewProps} />;
      case ACTIVITY_VIEWS.EXPLORER:
        return (
          <ExplorerView
            {...viewProps}
            onCreateFolder={handleCreateFolder}      // Internal handler
            onContextMenu={handleContextMenu}        // Internal handler
            selectedDocumentId={selectedDocumentId}
            expandedFolders={expandedFolders}        // Internal state
            onToggleFolder={toggleFolder}            // Internal handler
          />
        );
      case ACTIVITY_VIEWS.RECENT:
        return <RecentView {...viewProps} />;
      case ACTIVITY_VIEWS.FAVORITES:
        return <FavoritesView {...viewProps} />;
      case ACTIVITY_VIEWS.INBOX:
        return (
          <InboxView
            {...viewProps}
            onCreateDocument={onCreateDocument}
            onDocumentDelete={onDocumentDelete}
          />
        );
      default:
        return <ExplorerView {...viewProps} />;
    }
  };

  const userInitials = user?.email?.substring(0, 2).toUpperCase() || 'DV';
  const userEmail = user?.email || 'developer@devlog.app';

  return (
    <motion.div
      className="h-full bg-[#0f0f0f] rounded-2xl overflow-hidden flex relative"
      initial={false}
      animate={{ width: isOpen ? 280 : 48 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Activity Bar - Always visible */}
      <ActivityBar
        activeView={activeView}
        onViewChange={setActiveView}
        onSettingsClick={() => navigate('/settings')}
      />

      {/* Content Area - Only visible when open */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="flex-1 flex flex-col min-w-0"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* View Content */}
            <div className="flex-1 min-h-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeView}
                  className="h-full"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  {renderView()}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Profile Section at Bottom */}
            <div className="px-3 py-3 flex-shrink-0 mt-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/5 transition-all duration-200 group">
                    <Avatar className="h-7 w-7 flex-shrink-0">
                      <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white text-xs">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="text-xs text-white/90 truncate font-medium">
                        {userEmail.split('@')[0]}
                      </div>
                      <div className="text-[10px] text-white/40 truncate">{userEmail}</div>
                    </div>
                    <SettingsIcon className="w-3.5 h-3.5 text-white/40 group-hover:text-white/70 transition-colors flex-shrink-0" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" side="top" className="w-56">
                  <DropdownMenuLabel className="text-white/70">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm leading-none text-white/90">{userEmail.split('@')[0]}</p>
                      <p className="text-xs leading-none text-white/50">{userEmail}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => navigate('/settings')}
                    className="cursor-pointer"
                  >
                    <SettingsIcon className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={onSignOut}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 focus:bg-red-500/10 cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button - Top Right Corner (when open) */}
      <AnimatePresence>
        {isOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={onToggleCollapse}
            className="absolute top-3 right-3 p-1.5 rounded-md hover:bg-white/10 transition-all duration-200 group z-10"
            title="Collapse sidebar"
          >
            <PanelLeftClose className="w-4 h-4 text-white/40 group-hover:text-white/70 transition-colors" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Expand Button - When Collapsed */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onToggleCollapse}
            className="absolute top-3 left-1/2 -translate-x-1/2 p-1.5 rounded-md hover:bg-white/10 transition-all duration-200 group z-10"
            title="Expand sidebar"
          >
            <PanelLeft className="w-4 h-4 text-white/40 group-hover:text-white/70 transition-colors" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Modals - Same as current ProjectExplorerRedesigned */}
      <InputModal
        isOpen={showInputModal}
        onClose={() => setShowInputModal(false)}
        onConfirm={inputModalConfig.onConfirm}
        title={inputModalConfig.title}
        placeholder="Enter folder name..."
        confirmText="Create"
      />

      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={confirmDialogConfig.onConfirm}
        title={confirmDialogConfig.title}
        message={confirmDialogConfig.message}
        confirmText="Delete"
        variant="danger"
      />
    </motion.div>
  );
}

export default Sidebar;
```

### Success Criteria:

#### Automated Verification:
- [ ] `npm run build` passes
- [ ] `npm run lint` passes

#### Manual Verification:
- [ ] Main Sidebar.jsx exists at `src/components/sidebar/Sidebar.jsx`

---

## Phase 6: Integrate Into Dashboard

### Overview
Replace the current `ProjectExplorerRedesigned` with the new `Sidebar` component in Dashboard.

### ⚠️ VERIFIED: Minimal Changes Required
Since the new Sidebar manages folder state internally (same as current implementation), Dashboard changes are minimal. The key differences:
- **Width change**: 80px → 48px when collapsed
- **Import change**: New file location
- **Props**: Same props, just different component

### Changes Required:

**File**: `src/pages/Dashboard.jsx`

#### 1. Update imports (around line 15)
```jsx
// REMOVE this line:
import ProjectExplorerV2 from '../components/ProjectExplorer/ProjectExplorerRedesigned';

// ADD this line:
import { Sidebar } from '../components/sidebar/Sidebar';
```

#### 2. NO state changes needed
> ✅ The new Sidebar manages `expandedFolders`, `folders`, and folder operations internally.
> Dashboard does NOT need to add any new state or handlers.

#### 3. Update sidebar width (line 1495)
Find:
```jsx
style={{ width: isMobile ? '280px' : (isSidebarCollapsed ? '80px' : '280px') }}
```

Replace with:
```jsx
style={{ width: isMobile ? '280px' : (isSidebarCollapsed ? '48px' : '280px') }}
```

#### 4. Replace the component (around line 1497-1548)
Find the `<ProjectExplorerV2 ... />` block and replace with:

```jsx
<Sidebar
  isCollapsed={isSidebarCollapsed}
  onToggleCollapse={toggleSidebarCollapse}
  documents={allDocuments}
  selectedDocumentId={activeTabId}
  onDocumentSelect={(data) => {
    // Same logic as before - handles BOTH selection AND creation
    console.log('[DEBUG-CREATE-3] Dashboard onDocumentSelect received:', data);
    if (data?.action === 'create') {
      createNewEntry(data.folderId);
    } else if (data?.id) {
      const doc = allDocuments.find(e => e.id === data.id);
      if (doc) {
        handleDocumentExpand(doc);
      }
    } else if (data) {
      handleDocumentExpand(data);
    }
    if (isMobile) closeMobileSidebar();
  }}
  onDocumentDelete={(document) => {
    const docId = document.id || document;
    setConfirmDialogConfig({
      title: 'Delete Document',
      message: `Are you sure you want to delete "${document.title || 'this document'}"?`,
      onConfirm: async () => {
        await deleteEntry(docId);
        if (tabs.find(t => t.id === docId)) {
          closeTab(docId);
        }
        await loadEntries();
        toast.success('Document deleted successfully');
        setShowConfirmDialog(false);
      }
    });
    setShowConfirmDialog(true);
  }}
  onCreateDocument={handleCreateNewTab}
  user={user}
  onSignOut={signOut}
/>
```

#### 5. Update Mobile Bottom Sheet (around line 1661)
Also update the mobile bottom sheet `ProjectExplorerV2` to `Sidebar` with the same props.

#### 6. SidebarContext - NO changes needed
> ✅ Verified: `SidebarContext.jsx` has NO hardcoded width values.
> Width is controlled entirely in Dashboard's inline styles.

### Success Criteria:

#### Automated Verification:
- [ ] `npm run build` passes
- [ ] `npm run lint` passes
- [ ] App starts without console errors

#### Manual Verification:
- [ ] Sidebar displays with Activity Bar
- [ ] All 5 views are accessible via Activity Bar
- [ ] Documents display correctly in Explorer view
- [ ] Search filters documents
- [ ] Recent shows time-grouped documents
- [ ] Favorites shows starred items
- [ ] Inbox shows uncategorized documents
- [ ] Collapse/expand works smoothly (48px collapsed)
- [ ] Profile dropdown works
- [ ] Settings navigation works
- [ ] Sign out works

---

## Phase 7: Mobile Handling & Polish

### Overview
Ensure mobile behavior works and add final polish.

### Changes Required:

#### 1. Mobile sidebar overlay
The mobile sidebar should work as before - fixed overlay that slides in. The new Sidebar component should integrate with the existing mobile handling in Dashboard.

No changes needed if Dashboard already handles mobile sidebar visibility.

#### 2. Update scrollbar styles
**File**: `src/styles/index.css` (or main CSS file)

Add sidebar-specific scrollbar styles:
```css
/* Sidebar custom scrollbar */
.sidebar-scroll [data-radix-scroll-area-scrollbar] {
  width: 6px;
}
.sidebar-scroll [data-radix-scroll-area-thumb] {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}
.sidebar-scroll [data-radix-scroll-area-thumb]:hover {
  background: rgba(16, 185, 129, 0.3);
}
```

### Success Criteria:

#### Automated Verification:
- [ ] `npm run build` passes

#### Manual Verification:
- [ ] Mobile sidebar opens/closes correctly
- [ ] Scrollbars look good in sidebar
- [ ] Keyboard shortcut (Cmd/Ctrl+B) still works
- [ ] No visual glitches during animations

---

## Testing Strategy

### Unit Tests:
- View components render without errors
- Search filtering works correctly
- Time grouping in Recent view works

### Integration Tests:
- Document selection propagates correctly
- Folder expansion/collapse state persists
- Navigation to settings works

### Manual Testing Steps:
1. Start app and verify sidebar loads
2. Click each Activity Bar icon - verify view switches
3. Search for a document - verify results filter
4. Click Recent - verify time groupings
5. Click Favorites - verify starred items show
6. Click Inbox - verify uncategorized docs show
7. Collapse sidebar - verify Activity Bar only visible
8. Expand sidebar - verify content returns
9. Click profile - verify dropdown appears
10. Navigate to settings - verify routing works
11. Sign out - verify auth flow

---

## Migration Path Summary

```
Phase 1: Dependencies & UI Primitives
   ↓
Phase 2: Activity Bar Component
   ↓
Phase 3: Enhanced SidebarTreeItem (with 3 view modes: tree, table, compact)
   ↓
Phase 4: View Components (5 files)
   ↓
Phase 5: Main Sidebar Component
   ↓
Phase 6: Dashboard Integration
   ↓
Phase 7: Mobile & Polish
```

**Estimated Complexity**: Medium-High
- New components: ~11 files
- Modified components: 2-3 files
- New dependencies: 4 Radix packages

## Key Technical Notes

### View Modes in ExplorerView
The ExplorerView has 3 view modes that MUST be implemented:

1. **Tree View** (default)
   - Hierarchical folder display with indentation
   - `py-1.5`, `text-[13px]`, `w-3.5 h-3.5` icons
   - Count badges visible
   - Chevron rotation on expand

2. **Table View**
   - Flat rows with columns: Name, Modified, Type
   - `py-2`, `text-sm`, `w-4 h-4` icons
   - No hierarchy, no children rendering

3. **Compact View**
   - Minimal spacing and smaller text
   - `py-0.5`, `text-xs`, `w-3 h-3` icons
   - Count shows as plain number (no badge)

### Backend Integration Preserved
The new Sidebar component maintains all backend connections:
- `useFolders()` hook from Dashboard provides `folders` prop
- Document data from existing Supabase queries
- All CRUD callbacks (`onCreateFolder`, `onDocumentDelete`, etc.) pass through

---

## References

- New UI source: `Revampuiforbetterexperiencecopy/src/components/`
- Current sidebar: `src/components/ProjectExplorer/ProjectExplorerRedesigned.jsx`
- Dashboard integration: `src/pages/Dashboard.jsx`
- Sidebar context: `src/contexts/SidebarContext.jsx`

---

## Verification Notes (Added 2025-12-15)

This section documents verified facts about the codebase to prevent false assumptions during implementation.

### ✅ Verified Facts

| Claim | Verification | File:Line |
|-------|--------------|-----------|
| `cn.js` utility exists | Already implemented | `src/utils/cn.js:1-11` |
| Reference UI has 3 view modes | `type ViewMode = 'tree' \| 'table' \| 'compact'` | `Revampuiforbetterexperiencecopy/src/components/SidebarTreeItem.tsx:24` |
| `useFolders` hook exists and works | Returns `{ folders, createFolder, deleteFolder }` | Used in `ProjectExplorerRedesigned.jsx:38` |
| `@radix-ui/react-popover` exists | Already in dependencies | `package.json:18` |
| Current collapsed width is 80px | Inline style in Dashboard | `Dashboard.jsx:1495` |
| SidebarContext has NO width values | Only stores `isCollapsed` boolean | `SidebarContext.jsx` (entire file) |
| Folder state managed internally | `expandedFolders` state in sidebar | `ProjectExplorerRedesigned.jsx:25` |
| `onDocumentSelect` handles creation | Uses `action: 'create'` pattern | `Dashboard.jsx:1509-1513` |

### Prop Mapping: Old → New

| Current Prop (ProjectExplorerV2) | New Prop (Sidebar) | Notes |
|----------------------------------|-------------------|-------|
| `isCollapsed` | `isCollapsed` | Same |
| `onToggleCollapse` | `onToggleCollapse` | Same |
| `documents` | `documents` | Same |
| `selectedDocumentId` | `selectedDocumentId` | Same |
| `onDocumentSelect` | `onDocumentSelect` | Same - handles both selection AND `{action: 'create'}` |
| `onDocumentDelete` | `onDocumentDelete` | Same |
| `onCreateDocument` | `onCreateDocument` | Same |
| `className` | (not needed) | Sidebar has its own styling |
| `onDocumentMove` | (handled internally) | Folder operations managed in Sidebar |
| (not passed) | `user` | **NEW** - needed for profile display |
| (not passed) | `onSignOut` | **NEW** - needed for sign out |

### Dependencies to Add (Vercel Deployment)

> Add directly to `package.json` - Vercel handles install automatically.

**Add to `package.json` dependencies:**
```json
"@radix-ui/react-avatar": "^1.1.1",
"@radix-ui/react-dropdown-menu": "^2.1.2",
"@radix-ui/react-scroll-area": "^1.2.0",
"@radix-ui/react-tooltip": "^1.1.4",
```

**Already installed (no action needed):**
- `@radix-ui/react-popover` - ✅ exists
- `framer-motion` - ✅ exists
- `lucide-react` - ✅ exists
- `clsx` - ✅ exists
- `tailwind-merge` - ✅ exists

### Files to Create (11 total)

```
src/components/ui/
├── scroll-area.jsx          # Phase 1
├── tooltip.jsx              # Phase 1
├── dropdown-menu.jsx        # Phase 1
└── avatar.jsx               # Phase 1

src/components/sidebar/
├── ActivityBar.jsx          # Phase 2
├── SidebarTreeItemEnhanced.jsx  # Phase 3
├── Sidebar.jsx              # Phase 5
└── views/
    ├── SearchView.jsx       # Phase 4
    ├── ExplorerView.jsx     # Phase 4
    ├── RecentView.jsx       # Phase 4
    ├── FavoritesView.jsx    # Phase 4
    └── InboxView.jsx        # Phase 4
```

### Files to Modify (2 files)

```
package.json
└── Add 4 Radix UI dependencies to "dependencies" section

src/pages/Dashboard.jsx
├── Line 15: Change import
├── Line 1495: Change '80px' to '48px'
├── Lines 1497-1548: Replace component
└── Lines ~1661: Update mobile bottom sheet
```

### Critical Implementation Notes

1. **View Modes**: The `SidebarTreeItemEnhanced.jsx` MUST support all 3 view modes (tree, table, compact) as shown in the reference UI at `SidebarTreeItem.tsx:78-103`

2. **Action Pattern**: The `onDocumentSelect` prop MUST handle the `{action: 'create', folderId}` pattern used by Dashboard for creating documents in folders

3. **Internal State**: Sidebar manages `expandedFolders`, `folders`, and folder CRUD operations internally - Dashboard does NOT need these

4. **Width Values**:
   - Collapsed: 48px (Activity Bar only)
   - Expanded: 280px (Activity Bar + Content Panel)
   - Mobile: Always 280px when visible

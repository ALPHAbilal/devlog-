# Document-to-Folder Workflow Excellence - Research Prompt

## Current Problem
Users need to organize documents into folders/projects, but the current experience is clunky:
- No clear way to assign a document to a folder during creation
- Can't move documents between folders easily
- No drag-and-drop functionality
- No bulk operations for organizing multiple documents
- Have to leave document view to change folder assignment

## Core Research Questions

### 1. Document Creation Flow
**Question**: How should users assign documents to folders when creating new documents?

Research the best patterns for:
- **Default folder selection** - Should new documents go to last used folder or uncategorized?
- **Inline folder picker** - How to select folder without interrupting writing flow?
- **Quick assignment** - Single keystroke or click to assign to recent folders
- **Visual confirmation** - How to show which folder a document belongs to while editing?

Examples to study:
- How does Notion handle page creation within databases?
- How does Obsidian handle note creation in folders?
- How does Google Docs handle folder assignment?

### 2. Moving Documents Between Folders
**Question**: What's the smoothest way to move documents between folders?

Explore these approaches:
- **Drag and drop** - From document grid to folder sidebar
- **Multi-select drag** - Moving multiple documents at once
- **Context menu** - Right-click → "Move to..." with folder picker
- **Keyboard shortcuts** - Cmd+M to open move dialog
- **From document view** - Change folder without closing the document

Key interactions:
- Visual feedback during drag (ghost image, drop zones)
- Hover states on valid drop targets
- Animation of document moving to new folder
- Undo/redo support for all moves

### 3. Bulk Organization
**Question**: How can users organize many documents quickly?

Research patterns for:
- **Multi-select methods**:
  - Shift+click for range selection
  - Cmd+click for individual selection
  - Rectangular selection with mouse drag
  - Select all in current view
  
- **Bulk actions toolbar**:
  - Appears when multiple items selected
  - Shows count of selected items
  - Quick actions: Move to folder, Add tags, Delete
  
- **Smart selection**:
  - "Select all untitled documents"
  - "Select all from today"
  - "Select all in current folder"

### 4. Quick Assignment Patterns
**Question**: What are the fastest ways to assign folders without breaking flow?

Consider:
- **Slash commands** while typing: "/folder Frontend" to assign
- **Quick switcher**: Cmd+K to open folder switcher
- **Favorites bar**: Pin 3-5 folders for one-click assignment
- **Smart suggestions**: Suggest folder based on document content/title
- **Breadcrumb editing**: Click breadcrumb to change folder

### 5. Visual Feedback & Confirmation
**Question**: How should the system confirm folder operations?

Design patterns for:
- **During operation**:
  - Dragging: Semi-transparent document, highlighted drop zones
  - Moving: Progress animation, folder opens on hover
  - Selecting: Clear selection outline, count badge
  
- **After operation**:
  - Success toast with undo button
  - Brief animation showing document in new location
  - Update counts in real-time
  - Maintain selection after move for further actions

### 6. Mobile Folder Operations
**Question**: How to make folder operations work on touch devices?

Research:
- **Long press** to enter selection mode
- **Swipe actions** to reveal folder options
- **Drag handles** for reordering within folders
- **Bottom sheet** for folder picker
- **Gesture shortcuts** for common folders

## Implementation Priorities

### Must Have (Week 1)
1. **Basic drag-and-drop** from document grid to folder sidebar
2. **Folder picker** in document creation modal
3. **Move to folder** option in document menu
4. **Multi-select** with Shift+click
5. **Visual feedback** during all operations

### Should Have (Week 2)
1. **Bulk operations toolbar**
2. **Keyboard shortcuts** for move operations
3. **Undo/redo** for all folder operations
4. **Context menu** with folder options
5. **Folder assignment** from document view

### Nice to Have (Week 3)
1. **Smart folder suggestions**
2. **Advanced selection patterns**
3. **Folder templates**
4. **Nested folder support**
5. **Custom folder views**

## Success Criteria
- Moving a document takes **1 click/drag** (currently 3-4 clicks)
- Bulk organize 20 documents in **under 30 seconds**
- **Zero accidental moves** with clear undo options
- Works smoothly with **100+ folders**
- **Mobile-friendly** without compromising desktop experience

## Technical Constraints
- Must work with existing Supabase schema
- Use @dnd-kit/sortable for drag-and-drop
- Maintain real-time sync across devices
- Keep performance under 100ms for all operations
- Support offline operations with sync queue

## Deliverables Needed
1. **Step-by-step workflows** for each operation with exact interactions
2. **Component designs** with all states (idle, hover, active, dragging)
3. **Animation specifications** with timing and easing
4. **Code architecture** for drag-and-drop implementation
5. **State management** approach for selection and operations
6. **Error handling** for edge cases (permissions, conflicts)
7. **Accessibility** patterns for keyboard-only users

Please provide specific, implementable solutions focused on making document organization feel effortless and delightful.
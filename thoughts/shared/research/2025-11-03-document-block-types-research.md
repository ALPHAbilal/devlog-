---
date: 2025-11-03T12:23:52+01:00
researcher: Claude (via Claude Code)
git_commit: b4c0abb1bebf23e3e7d7db5e5e1e2f6dfa79a737
branch: main
repository: devlog-
topic: "Document Block Types - Complete UI Component Research"
tags: [research, codebase, blocks, ui-components, react, document-editor]
status: complete
last_updated: 2025-11-03
last_updated_by: Claude
---

# Research: Document Block Types - Complete UI Component Research

**Date**: 2025-11-03T12:23:52+01:00
**Researcher**: Claude (via Claude Code)
**Git Commit**: b4c0abb1bebf23e3e7d7db5e5e1e2f6dfa79a737
**Branch**: main
**Repository**: devlog-

## Research Question

Research all block types that exist inside documents in the Devlog codebase to enable rebuilding the same UI blocks in a single HTML page.

## Summary

The Devlog application uses a flexible block-based document system with **11 active block types** coordinated through a central `Block.jsx` renderer. Each block type is a self-contained React component with specific visual styling, interaction patterns, and data structures. All blocks follow consistent design patterns using Tailwind CSS with a dark theme color palette and fluid typography.

### Active Block Types

1. **TextBlock** - Markdown text with inline editing, slash commands, tags, and formatting toolbar
2. **CodeBlock** - Syntax-highlighted code with language selection, file paths, and fullscreen editing
3. **HeadingBlock** - Three levels of headings (H1/H2/H3) with fluid typography
4. **AIBlockRefined** (AIBlock) - Conversational UI with user/AI message bubbles and markdown rendering
5. **TableBlock** - Dynamic tables with inline editing, column/row management, and CSV export
6. **TodoBlock** - Task management with status, priority, due dates, and drag-and-drop reordering
7. **FileTreeBlock** - Hierarchical file system with inline editing and content modal
8. **ImageBlock** - Multi-image gallery with upload, reordering, and lightbox viewer
9. **InlineImageBlock** - Compact inline images for embedding within text
10. **OptimizedVersionTrackBlock** - Version control visualization with metro map UI and code editor
11. **OptimizedIssueTrackerBlock** - Issue tracking with timeline visualization and attempt logging

## Detailed Findings

### Block Coordination System

**File**: `src/components/Block.jsx`

The main Block component acts as a central coordinator that:
- Maps block types to components via `blockComponents` object (lines 20-32)
- Handles drag-and-drop reordering (lines 156-189)
- Provides inline action bar with controls (lines 288-343)
- Implements lazy loading for heavy blocks (lines 116-122)
- Manages focus states and hover interactions (lines 249-270)
- Renders mobile-optimized controls on small screens (lines 192-224)

**Block Type Mapping**:
```javascript
const blockComponents = {
  text: TextBlock,
  code: CodeBlock,
  ai: AIBlock,
  heading: HeadingBlock,
  filetree: FileTreeBlock,
  table: TableBlock,
  todo: TodoBlock,
  image: ImageBlock,
  'inline-image': InlineImageBlock,
  'version-track': OptimizedVersionTrackBlock,
  'issue-tracker': OptimizedIssueTrackerBlock,
};
```

---

## Block Type 1: TextBlock

**File**: `src/components/blocks/TextBlock.jsx`

### Purpose
Editable text block with markdown support, tag extraction, slash commands, and inline formatting toolbar.

### Key Features
- **Markdown Rendering**: Bold, italic, inline code, strikethrough, links, images, tags
- **Slash Commands**: `/h1`, `/h2`, `/h3`, `/bullet`, `/number`, `/code`, `/table`, `/ai`, etc.
- **Tag System**: Extract tags with `#tagname[text]` pattern, displayed as green badges
- **Floating Toolbar**: Selection-based formatting (bold, italic, link, tag, image)
- **Collapse Feature**: Auto-collapse content >15 lines, shows first 10 lines
- **Image Paste**: Direct clipboard paste with Supabase upload and compression

### HTML Structure
```html
<!-- Edit Mode -->
<textarea className="w-full bg-dark-secondary/50 text-text-primary p-4 rounded-lg" />
<FloatingToolbar /> <!-- Appears on text selection -->

<!-- Display Mode -->
<div className="text-text-primary p-4 rounded-lg hover:bg-dark-secondary/30">
  <div className="space-y-2">
    {/* Parsed markdown lines */}
  </div>
  <div className="flex gap-1">
    <span className="text-xs bg-accent-green/20 text-accent-green px-2 py-1 rounded">
      {tag}
    </span>
  </div>
</div>
```

### Styling Patterns
- **Background**: `bg-dark-secondary/50` (edit), `hover:bg-dark-secondary/30` (display)
- **Text Color**: `text-text-primary`
- **Focus**: `focus:ring-2 focus:ring-accent-green`
- **Tags**: `bg-accent-green/20 text-accent-green`
- **Collapse Border**: `border-l-4 border-accent-green/30`

### Props
- `block` - Contains `id`, `content`, `isNew`, `tags`, `metadata.isCollapsed`
- `onUpdate` - Save callback
- `onConvert` - Block type conversion
- `isFocused` - Focus state
- `onFocus` - Focus handler
- `onAddBelow` - Create block below
- `allBlocks` - All document blocks

---

## Block Type 2: CodeBlock

**File**: `src/components/blocks/CodeBlock.jsx`

### Purpose
Syntax-highlighted code block with language selection, file path tracking, and fullscreen editing.

### Key Features
- **Syntax Highlighting**: Prism React Renderer with nightOwl theme
- **21 Languages**: JavaScript, TypeScript, Python, Java, C#, C++, Go, Rust, SQL, Bash, etc.
- **File Path**: Optional file path with autocomplete suggestions
- **Line Numbers**: Auto-generated line numbers column
- **Collapse/Expand**: For code >15 lines
- **Compact View**: Minimized view for very large files (>100 lines)
- **Fullscreen Mode**: Edit mode with Esc/Cmd+Enter shortcuts
- **Copy Button**: One-click copy with confirmation

### HTML Structure
```html
<div className="group relative">
  <!-- File path badge (absolute -top-3) -->
  <div className="absolute top-2 right-2">
    <button>Language</button>
    <button>Copy</button>
  </div>

  <div className="bg-dark-primary rounded-lg overflow-hidden">
    <div className="flex">
      <div className="line-numbers">{/* 1, 2, 3... */}</div>
      <pre><code>{/* Syntax highlighted */}</code></pre>
    </div>
  </div>
</div>
```

### Styling Patterns
- **Background**: `bg-dark-primary`
- **Line Numbers**: `text-text-secondary border-r border-dark-secondary/50`
- **Language Badge**: `bg-dark-primary/80 text-text-secondary hover:bg-dark-secondary/80`
- **Copy Button**: `opacity-0 group-hover:opacity-100`
- **Fullscreen**: `fixed inset-0 z-50 bg-dark-primary p-8`

### Props
- `block` - Contains `id`, `content`, `language`, `filePath`, `isNew`
- `onUpdate` - Save callback
- `allBlocks` - For file path suggestions
- `onNavigateToBlock` - Block navigation (unused)

---

## Block Type 3: HeadingBlock

**File**: `src/components/blocks/HeadingBlock.jsx`

### Purpose
Document headings with three levels (H1, H2, H3) and fluid typography.

### Key Features
- **3 Levels**: H1, H2, H3 with different sizes
- **Fluid Typography**: CSS custom properties for responsive sizing
- **Inline Editing**: Click to edit, Enter/Escape to save/cancel
- **Level Selector**: Dropdown to change heading level

### HTML Structure
```html
<!-- Edit Mode -->
<div className="flex items-center gap-2">
  <select className="w-20 bg-dark-secondary">
    <option value="1">H1</option>
    <option value="2">H2</option>
    <option value="3">H3</option>
  </select>
  <input type="text" className="flex-1 bg-transparent" />
</div>

<!-- Display Mode -->
<h1|h2|h3 style={{ fontSize: 'var(--step-X)', lineHeight: 'var(--line-height-tight)' }}>
  {content}
</h1|h2|h3>
```

### Typography Scale
- **H1**: `var(--step-4)` = 37.9px-53.3px (clamp)
- **H2**: `var(--step-3)` = 28.4px-40px (clamp)
- **H3**: `var(--step-2)` = 21.3px-30px (clamp)
- **Line Height**: `1.2` (tight)

### Styling Patterns
- **H1**: `text-3xl font-bold`
- **H2**: `text-2xl font-semibold`
- **H3**: `text-xl font-medium`
- **Hover**: `hover:bg-dark-secondary/30`
- **Focus**: `focus:ring-1 focus:ring-accent-green/50`

### Props
- `block` - Contains `id`, `content`, `level`, `isNew`
- `onUpdate` - Save callback
- `isFocused` - Focus state
- `onFocus` - Focus handler

---

## Block Type 4: AIBlockRefined (AIBlock)

**File**: `src/components/blocks/AIBlockRefined.jsx`

### Purpose
Conversational UI for AI chat interactions with user/AI message differentiation.

### Key Features
- **Message Bubbles**: User (blue theme) and AI (green theme) messages
- **Markdown Support**: Bold, italic, code, links, images in messages
- **Avatars**: User icon (blue) and Sparkles icon (green)
- **Collapse Messages**: Auto-collapse long messages (>15 lines or >800 chars)
- **Block Collapse**: Collapse entire conversation, show preview of first 3 messages
- **Conversation Import**: Paste multi-line text with auto-detection and parsing
- **Inline Editing**: Edit individual messages
- **Floating Toolbar**: Format selected text in messages

### HTML Structure
```html
<div className="ai-block-container space-y-6">
  <!-- Header -->
  <div className="flex items-center gap-2">
    <Bot icon />
    <span>AI Conversation (N messages)</span>
    <button>Collapse/Expand</button>
  </div>

  <!-- Messages -->
  <div className="ai-messages-wrapper space-y-4">
    <div className="flex gap-3 [flex-row-reverse if user]">
      <!-- Avatar -->
      <div className="w-10 h-10 rounded-full bg-blue-500/20 border-blue-500/30">
        <User icon />
      </div>

      <!-- Message Bubble -->
      <div className="flex-1">
        <div className="rounded-lg px-4 py-3 bg-dark-secondary/40 border-l-4 border-l-blue-500">
          {/* Message content with markdown */}
        </div>
      </div>
    </div>
  </div>

  <!-- Add Message Interface -->
  <div className="space-y-4 bg-dark-secondary/10 rounded-lg p-4">
    <!-- Role toggle + textarea + buttons -->
  </div>
</div>
```

### Styling Patterns
- **User Messages**: `flex-row-reverse`, blue theme (`bg-blue-500/20`, `text-blue-400`, `border-l-blue-500`)
- **AI Messages**: Normal flex, green theme (`bg-accent-green/20`, `text-accent-green`, `border-l-accent-green`)
- **Message Bubble**: `rounded-lg px-4 py-3 border-l-4`
- **Action Buttons**: `opacity-0 hover:opacity-100`

### Props
- `block` - Contains `id`, `messages`, `metadata.collapsedMessages`, `metadata.isBlockCollapsed`
- `onUpdate` - Save callback
- `isFocused` - Focus state

---

## Block Type 5: TableBlock

**File**: `src/components/blocks/TableBlock.jsx`

### Purpose
Dynamic tables with inline editing, column/row management, and export capabilities.

### Key Features
- **Inline Editing**: Click any cell to edit
- **Column Management**: Add/remove columns, set alignment (left/center/right)
- **Row Management**: Add/remove rows, drag-and-drop reordering
- **Header Toggle**: Show/hide header row
- **Keyboard Navigation**: Tab, Enter, Escape for cell navigation
- **Export**: Copy as Markdown, Export as CSV
- **Auto-Save**: 2-second debounce
- **Inline Markdown**: Render backtick code in cells

### HTML Structure
```html
<div className="group relative">
  <!-- Controls -->
  <div className="absolute -top-8 right-0">
    <button>Header Toggle</button>
    <button>Copy Markdown</button>
    <button>Export CSV</button>
  </div>

  <!-- Table -->
  <div className="bg-dark-primary/50 backdrop-blur-sm rounded-lg overflow-hidden">
    <table className="w-full border-collapse">
      <thead>
        <!-- Alignment controls (hover-visible) -->
        <!-- Header row (conditional) -->
      </thead>
      <tbody>
        <!-- Data rows -->
        <!-- Add row button -->
      </tbody>
    </table>
  </div>
</div>
```

### Data Structure
```javascript
{
  headers: ['Column 1', 'Column 2'],
  rows: [['cell1', 'cell2'], ['cell3', 'cell4']],
  columnAlignments: ['left', 'center'],
  hasHeaderRow: true
}
```

### Styling Patterns
- **Table Background**: `bg-dark-primary/50 backdrop-blur-sm`
- **Header Row**: `bg-gradient-to-r from-dark-secondary/20 to-dark-secondary/10`
- **Cell Input**: `bg-dark-primary/60 text-text-primary focus:ring-1 focus:ring-accent-green/40`
- **Alignment Controls**: `opacity-0 hover:opacity-100`
- **Row Hover**: `hover:bg-dark-secondary/10`

### Props
- `block` - Contains `id`, `data` (headers, rows, columnAlignments, hasHeaderRow)
- `onUpdate` - Save callback
- `isFocused` - Focus state
- `onFocus` - Focus handler

---

## Block Type 6: TodoBlock

**File**: `src/components/blocks/TodoBlock.jsx`

### Purpose
Task management block with status tracking, priorities, and due dates.

### Key Features
- **Task Properties**: Task name, status, priority, due date
- **Status Options**: Todo, In Progress, Done, Blocked
- **Priority Levels**: High, Medium, Low (with emoji indicators)
- **Inline Editing**: Click any field to edit
- **Drag-and-Drop**: Reorder tasks via grip handle
- **Progress Bar**: Visual completion indicator
- **Filters**: Filter by status and priority
- **Keyboard Shortcuts**: Cmd+Enter to add task

### HTML Structure
```html
<div className="w-full">
  <!-- Header with stats and progress -->
  <div className="flex items-center justify-between">
    <div>
      <h3>Tasks</h3>
      <div>X total • Y done</div>
      <div className="progress-bar">{/* Progress fill */}</div>
    </div>
    <button>Add Task</button>
  </div>

  <!-- Table -->
  <table className="w-full">
    <thead>
      <tr>
        <th>Drag</th>
        <th>Task</th>
        <th>Status</th>
        <th>Priority</th>
        <th>Due Date</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      <tr className="hover:bg-dark-secondary/10">
        <td><GripVertical icon /></td>
        <td><button>{task}</button></td>
        <td><span className="badge">{status}</span></td>
        <td><span className="badge">{priority}</span></td>
        <td><input type="date" /></td>
        <td><button>Delete</button></td>
      </tr>
    </tbody>
  </table>
</div>
```

### Status Colors
- **Todo**: `text-gray-400 bg-gray-400/10`
- **In Progress**: `text-blue-400 bg-blue-400/10`
- **Done**: `text-green-400 bg-green-400/10`
- **Blocked**: `text-red-400 bg-red-400/10`

### Priority Indicators
- **High**: 🔴 `text-red-400`
- **Medium**: 🟡 `text-yellow-400`
- **Low**: 🔵 `text-blue-400`

### Styling Patterns
- **Row Hover**: `hover:bg-dark-secondary/10`
- **Badge**: `px-2 py-1 rounded text-xs font-medium`
- **Progress Bar**: `bg-accent-green transition-all duration-300`
- **Drag Handle**: `text-text-secondary/50 cursor-move`

### Props
- `block` - Contains `id`, `todos` (array of todo objects)
- `onUpdate` - Save callback
- `isFocused` - Focus state

---

## Block Type 7: FileTreeBlock

**File**: `src/components/blocks/FileTreeBlock.jsx`

### Purpose
Visual file system tree with hierarchical folders/files and content editing.

### Key Features
- **Hierarchical Tree**: Nested folders and files with visual indentation
- **Expand/Collapse**: Folders can be expanded/collapsed
- **Inline Editing**: Rename files/folders inline
- **File Icons**: Different icons based on file extension
- **Content Editor**: Modal for editing file content with syntax highlighting
- **Drag-and-Drop**: Reorder and move items
- **Context Menu**: Right-click for actions (New File, New Folder, Rename, Delete)

### HTML Structure
```html
<div className="bg-dark-secondary/20 rounded-lg p-4">
  <!-- Header -->
  <div className="flex items-center justify-between">
    <div>
      <Folder icon />
      <span>File Tree</span>
    </div>
    <div>
      <button>Add Folder</button>
      <button>Add File</button>
    </div>
  </div>

  <!-- Tree View (Recursive) -->
  <div>
    <TreeNode level={0} node={rootNode}>
      <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 20}px` }}>
        <GripVertical icon /> <!-- Drag handle -->
        <ChevronRight icon /> <!-- Expand/collapse -->
        <Folder|File icon />
        <span>{name}</span>
        <div className="action-buttons opacity-0 group-hover:opacity-100">
          <button>Edit</button>
          <button>Add Folder</button>
          <button>Add File</button>
          <button>Delete</button>
        </div>
      </div>
      <!-- Children nodes (recursive) -->
    </TreeNode>
  </div>

  <!-- File Content Editor Modal -->
  <Portal>
    <div className="fixed inset-0 bg-black/80">
      <div className="modal">
        <!-- Syntax highlighted editor -->
      </div>
    </div>
  </Portal>
</div>
```

### File Tree Data Structure
```javascript
{
  id: 'uuid',
  name: 'folder-name',
  isFolder: true,
  children: [
    { id: 'uuid', name: 'file.js', isFolder: false, content: 'code...' },
    // ...
  ]
}
```

### Styling Patterns
- **Node Container**: `flex items-center gap-2 hover:bg-dark-secondary/30`
- **Indentation**: Dynamic `paddingLeft: ${level * 20}px`
- **Icons**: `text-accent-green/60` (open folder), `text-text-secondary/60` (closed)
- **Action Buttons**: `opacity-0 group-hover:opacity-100`
- **Drop Indicator**: `h-0.5 bg-accent-green`

### Props
- `block` - Contains `id`, `treeData` (root node)
- `onUpdate` - Save callback
- `isFocused` - Focus state

---

## Block Type 8: ImageBlock

**File**: `src/components/blocks/ImageBlock.jsx`

### Purpose
Multi-image gallery with upload, management, and lightbox viewing.

### Key Features
- **Multiple Images**: Array-based storage, grid layout
- **Upload**: Click, drag-and-drop, or paste to upload
- **Compression**: Auto-compress images >1MB (max 1920px, 85% quality)
- **Grid Layout**: 1/2/3 column responsive grid
- **Reordering**: Drag-and-drop between images
- **Alt Text**: Inline alt text editing per image
- **Controls**: Download, Edit, Delete per image
- **Lightbox**: Full-screen viewer with navigation
- **Progress**: Upload progress indicator

### HTML Structure
```html
<!-- Empty State -->
<div className="border rounded-lg">
  <input type="file" multiple hidden />
  <button className="w-full py-8">
    <Upload icon />
    Click to upload images
  </button>
</div>

<!-- Gallery State -->
<div className="p-4">
  <!-- Header -->
  <div className="flex items-center justify-between">
    <div>
      <Grid3x3 icon />
      <span>X images</span>
    </div>
    <button>Add more</button>
  </div>

  <!-- Grid -->
  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
    <div className="group relative rounded-lg overflow-hidden" draggable>
      <div className="relative w-full h-48">
        <img src={url} className="w-full h-full object-cover" loading="lazy" />
      </div>

      <!-- Hover Overlay -->
      <div className="absolute inset-0 bg-gradient-to-t from-dark-primary/80 opacity-0 group-hover:opacity-100" />

      <!-- Controls (top-right) -->
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100">
        <button>Download</button>
        <button>Edit</button>
        <button>Delete</button>
      </div>

      <!-- Alt Text (bottom) -->
      <div className="absolute bottom-0 left-0 right-0">
        <input placeholder="Alt text" /> <!-- or -->
        <p>{altText}</p>
      </div>

      <!-- Dimensions (top-left) -->
      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100">
        {width} × {height}
      </div>
    </div>
  </div>
</div>

<!-- Lightbox -->
<ImageViewer />
```

### Image Data Structure
```javascript
{
  images: [
    {
      id: 'uuid',
      url: 'https://...',
      storagePath: 'path/in/supabase',
      alt: 'Description',
      size: 123456,
      dimensions: { width: 1920, height: 1080 }
    }
  ]
}
```

### Styling Patterns
- **Grid**: `grid gap-4 grid-cols-2 lg:grid-cols-3`
- **Image Container**: `h-48 object-cover`
- **Hover Overlay**: `opacity-0 group-hover:opacity-100 bg-gradient-to-t`
- **Controls**: `opacity-0 group-hover:opacity-100`
- **Upload Button**: `py-8 bg-dark-secondary/50 hover:bg-dark-secondary`

### Props
- `block` - Contains `id`, `images` (array), `metadata.layout`
- `onUpdate` - Save callback
- `onDelete` - Delete block callback
- `isFocused` - Focus state

---

## Block Type 9: InlineImageBlock

**File**: `src/components/blocks/InlineImageBlock.jsx`

### Purpose
Compact inline images for embedding within text content.

### Key Features
- **Inline Display**: Uses `inline-block` to flow with text
- **Small Thumbnail**: 20px height via InlineImage component
- **Upload**: Click or paste to upload
- **Compression**: Auto-compress >100KB
- **Alt Text**: Inline alt text editor (floating modal)
- **Zoom**: Click to expand fullscreen
- **Focus Ring**: Visual focus indicator

### HTML Structure
```html
<!-- Upload State -->
<div className="inline-flex items-center gap-2 px-3 py-1.5
                bg-dark-secondary/30 rounded-lg border border-dashed
                align-middle my-1">
  <input type="file" hidden />
  <ImageIcon size={16} />
  <span>Click or paste image</span>
</div>

<!-- Display State -->
<span className="inline-block align-middle my-1 group relative">
  <InlineImage src={url} alt={altText} className="inline-block" />

  <!-- Edit Controls (top-right) -->
  <span className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100">
    <button>Edit Alt</button>
    <button>Delete</button>
  </span>

  <!-- Alt Text Editor Modal -->
  <div className="absolute top-full left-0 mt-2 bg-dark-secondary rounded-lg">
    <input placeholder="Alt text" />
    <button>Save</button>
  </div>
</span>
```

### InlineImage Component
Renders as:
- **Thumbnail**: `h-5 w-auto max-w-[60px]` (20px height)
- **Border**: `border border-dark-secondary/50 hover:border-accent-green/50`
- **Cursor**: `cursor-zoom-in`
- **Expand Icon**: Maximize2 icon (10px) on hover

### Styling Patterns
- **Container**: `inline-flex align-middle my-1`
- **Upload**: `border-dashed hover:border-accent-green/50`
- **Focus Ring**: `ring-2 ring-accent-green/30 rounded`
- **Controls**: `opacity-0 group-hover:opacity-100`

### Props
- `block` - Contains `id`, `url`, `alt`
- `onUpdate` - Save callback
- `onDelete` - Delete block callback
- `isFocused` - Focus state

---

## Block Type 10: OptimizedVersionTrackBlock

**File**: `src/components/blocks/OptimizedVersionTrackBlock.jsx`

### Purpose
Version control system with visual commit history and code editor.

### Key Features
- **Metro Map Visualization**: Canvas-based commit graph with branches
- **Branch Management**: Multiple branches, create/switch branches
- **File Tree**: Hierarchical file system sidebar
- **Code Editor**: Syntax-highlighted editor with line numbers
- **Commit System**: Create commits with messages
- **Drag-and-Drop**: Pan canvas, reorder files
- **Zoom Controls**: Zoom in/out/reset on canvas
- **Context Menu**: Right-click actions on files/folders
- **Lazy Loading**: Placeholder until viewport visible

### HTML Structure
```html
<div className="bg-dark-primary rounded-lg border-2 border-dark-secondary flex h-[600px]">
  <!-- File Tree Sidebar (w-64) -->
  <div className="w-64 bg-dark-secondary border-r-2">
    <div className="header">
      <span>FILES</span>
      <button>Add</button>
      <button>Toggle</button>
    </div>
    <div className="file-tree">
      <!-- Recursive tree nodes -->
    </div>
  </div>

  <!-- Main Content -->
  <div className="flex-1 flex flex-col">
    <!-- Header -->
    <div className="px-4 py-3 border-b bg-dark-secondary">
      <!-- Breadcrumbs -->
      <!-- Branch selector -->
      <!-- Edit/Save buttons -->
    </div>

    <!-- Metro Map Canvas -->
    <div className="relative bg-dark-primary h-48">
      <canvas ref={canvasRef} />
      <div className="zoom-controls absolute top-3 right-3">
        <button>Zoom In</button>
        <button>Zoom Out</button>
        <button>Reset</button>
      </div>
    </div>

    <!-- Code Editor -->
    <div className="flex-1 flex">
      <div className="line-numbers w-12">{/* 1, 2, 3... */}</div>
      <textarea or <Highlight> component />
    </div>
  </div>
</div>
```

### Version Data Structure
```javascript
{
  branches: ['main', 'feature', 'develop'],
  currentBranch: 'main',
  fileTree: { /* recursive tree */ },
  versions: [
    {
      id: 'uuid',
      branch: 'main',
      message: 'Commit message',
      author: 'User',
      timestamp: '2025-11-03...',
      parent: 'parent-uuid',
      files: { /* snapshot of all files */ }
    }
  ]
}
```

### Styling Patterns
- **Container**: `h-[600px] flex`
- **Sidebar**: `w-64 bg-dark-secondary border-r-2`
- **Canvas**: `h-48 bg-dark-primary`
- **Branch Colors**: Defined in `BRANCH_COLORS` constant
- **Node Circles**: Canvas-drawn with gradient fills

### Props
- `block` - Contains `id`, `data` (branches, versions, fileTree)
- `onUpdate` - Save callback
- `isFocused` - Focus state

---

## Block Type 11: OptimizedIssueTrackerBlock

**File**: `src/components/blocks/OptimizedIssueTrackerBlock.jsx`

### Purpose
Issue tracking system with timeline visualization and debugging attempt logging.

### Key Features
- **Issue Timeline**: Vertical timeline with status dots
- **Issue Properties**: Title, description, code, status
- **Status Options**: Active, In Progress, Solved
- **Attempts Logging**: Track debugging attempts per issue
- **Attempt Results**: Success/Failed with code snippets
- **GitGraph Overlay**: Branch visualization for issue relationships
- **Auto-Solve**: Marks issue as solved when attempt succeeds
- **Collapse/Expand**: Individual issues and attempts
- **Lazy Loading**: Placeholder with stats until expanded

### HTML Structure
```html
<div className="bg-dark-secondary/30 rounded-xl p-6 max-h-[600px] flex flex-col">
  <!-- Milestone Header -->
  <div className="flex items-center gap-2">
    <Target icon />
    <h2>{milestone}</h2>
  </div>

  <!-- Issues Timeline -->
  <div className="flex-1 overflow-y-auto">
    <div className="issue-timeline-container">
      <!-- Timeline Line -->
      <div className="issue-timeline-line" />

      <!-- GitGraph Branching Overlay -->
      <GitGraphBranching issues={issues} />

      <!-- Issue Items -->
      <div className="issue-wrapper">
        <!-- Timeline Marker -->
        <div className="timeline-marker">
          <div className="timeline-dot status-active" />
        </div>

        <!-- Issue Content -->
        <div className="issue-content">
          <div className="timeline-content">
            <!-- Issue header with collapse button -->
            <div className="timeline-header">
              <ChevronDown icon />
              <h3>{title}</h3>
              <AlertCircle icon /> <!-- Status icon -->
            </div>

            <!-- Issue description -->
            <p>{description}</p>

            <!-- Code snippet -->
            <div className="code-snippet">
              <code>{code}</code>
            </div>

            <!-- Attempts List -->
            <div className="attempts-container">
              <div className="attempt-branch">
                <div className="attempt-dot status-success" />
                <div className="attempt-content">
                  <span>{description}</span>
                  <Check icon /> <!-- Result icon -->
                  <div className="code-snippet">
                    <code>{code}</code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Add Issue Button -->
  <button className="add-issue-button">
    <Plus icon />
    Add Issue
  </button>
</div>
```

### Issue Data Structure
```javascript
{
  milestone: 'Project v1.0',
  issues: [
    {
      id: 'uuid',
      title: 'Fix authentication bug',
      description: 'User login fails on mobile',
      code: 'function login() { ... }',
      status: 'active|in-progress|solved',
      attempts: [
        {
          id: 'uuid',
          description: 'Tried updating JWT validation',
          code: 'const token = verify(...)',
          result: 'failed|success',
          solution: false
        }
      ]
    }
  ]
}
```

### Styling Patterns
- **Timeline Line**: `2px wide, #2a3648 color`
- **Status Dots**: 12px circles with status-specific colors
- **Issue Status Colors**: Red (active), blue (in-progress), green (solved)
- **Attempt Dots**: 8px circles, green (success), amber (failed)
- **Grid Layout**: `24px + 1fr` for issue, `40px + 1fr` for attempts

### Props
- `block` - Contains `id`, `title`, `issues` (array)
- `onUpdate` - Save callback
- `isFocused` - Focus state

---

## Code References

### Block Coordination
- `src/components/Block.jsx:20-32` - Block type mapping
- `src/components/Block.jsx:67-93` - Props interface
- `src/components/Block.jsx:287-343` - InlineActionBar integration
- `src/components/Block.jsx:353-366` - Block component rendering

### Individual Block Components
- `src/components/blocks/TextBlock.jsx:9` - Component entry point
- `src/components/blocks/CodeBlock.jsx:5` - Component entry point
- `src/components/blocks/HeadingBlock.jsx:6` - Component entry point
- `src/components/blocks/AIBlockRefined.jsx:6` - Component entry point
- `src/components/blocks/TableBlock.jsx:23` - Component entry point
- `src/components/blocks/TodoBlock.jsx:51` - Component entry point
- `src/components/blocks/FileTreeBlock.jsx:444` - Component entry point
- `src/components/blocks/ImageBlock.jsx:8` - Component entry point
- `src/components/blocks/InlineImageBlock.jsx:7` - Component entry point
- `src/components/blocks/OptimizedVersionTrackBlock.jsx:82` - Wrapper component
- `src/components/blocks/VersionTrackBlock.jsx:234` - Full implementation
- `src/components/blocks/OptimizedIssueTrackerBlock.jsx:96` - Wrapper component
- `src/components/blocks/IssueTrackerBlock.jsx:234` - Full implementation

### Styling Resources
- `src/styles/typography.css:26-28` - Fluid typography scale
- `src/styles/unified-gradients.css:67-68` - Text color tokens
- `src/styles/unified-gradients.css:15` - Background color tokens
- `tailwind.config.js:139-147` - Custom color palette

---

## Architecture Documentation

### Common Design Patterns

#### 1. Edit/Display Mode Toggle
All editable blocks follow the same pattern:
```javascript
const [isEditing, setIsEditing] = useState(false);
const [content, setContent] = useState(block.content);

// Display: Click to edit
onClick={() => setIsEditing(true)}

// Edit: Save on blur/Enter, cancel on Escape
```

#### 2. Group Hover for Controls
```javascript
<div className="group">
  <div className="opacity-0 group-hover:opacity-100">
    <button>Action</button>
  </div>
</div>
```

#### 3. Lazy Loading (Heavy Blocks)
```javascript
const LazyBlock = React.lazy(() => import('./HeavyBlock'));

<Suspense fallback={<Skeleton />}>
  {isVisible && <LazyBlock />}
</Suspense>
```

#### 4. Memoization
All blocks are wrapped in `React.memo` with custom comparison:
```javascript
export default memo(BlockComponent, (prevProps, nextProps) => {
  return (
    prevProps.block.id === nextProps.block.id &&
    prevProps.block.content === nextProps.block.content &&
    prevProps.isFocused === nextProps.isFocused
  );
});
```

#### 5. Auto-Save with Debounce
```javascript
useEffect(() => {
  const timer = setTimeout(() => {
    if (hasContentChanged) {
      onUpdate(block.id, { content });
    }
  }, 2000);
  return () => clearTimeout(timer);
}, [content]);
```

### Color Palette (Design Tokens)

**From** `tailwind.config.js:139-147`:
```javascript
colors: {
  'dark-primary': '#0a1628',      // Main background
  'dark-secondary': '#1e3a5f',    // Elevated surfaces
  'accent-green': '#10b981',      // Primary accent
  'text-primary': '#e0e7ff',      // Primary text (90% white)
  'text-secondary': '#94a3b8',    // Secondary text (60% white)
}
```

**Opacity Variations**:
- `/10` = 10% opacity
- `/20` = 20% opacity
- `/30` = 30% opacity
- `/40` = 40% opacity
- `/50` = 50% opacity
- `/60` = 60% opacity
- `/80` = 80% opacity

### Typography System

**Fluid Scale** (`typography.css:26-28`):
```css
--step-0: clamp(1rem, 0.95rem + 0.25vw, 1.125rem);
--step-1: clamp(1.125rem, 1.05rem + 0.375vw, 1.5rem);
--step-2: clamp(1.333rem, 1.2rem + 0.666vw, 1.875rem);
--step-3: clamp(1.777rem, 1.5rem + 1.385vw, 2.5rem);
--step-4: clamp(2.369rem, 1.8rem + 2.845vw, 3.333rem);

--line-height-tight: 1.2;
--line-height-normal: 1.58;
--line-height-loose: 1.8;
```

### Animation Standards

**Transition Durations**:
- `duration-150` = 150ms (fast interactions)
- `duration-200` = 200ms (standard)
- `duration-300` = 300ms (slower emphasis)

**Easing**: Tailwind default (cubic-bezier)

---

## HTML Reconstruction Guide

To rebuild these blocks in a single HTML file, you would need:

### 1. Base HTML Structure
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Devlog Blocks Demo</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    /* Custom CSS from typography.css and unified-gradients.css */
  </style>
</head>
<body class="bg-dark-primary text-text-primary">
  <!-- Block containers -->
</body>
</html>
```

### 2. Tailwind Configuration
```javascript
tailwind.config = {
  theme: {
    extend: {
      colors: {
        'dark-primary': '#0a1628',
        'dark-secondary': '#1e3a5f',
        'accent-green': '#10b981',
        'text-primary': '#e0e7ff',
        'text-secondary': '#94a3b8',
      }
    }
  }
}
```

### 3. Required External Libraries
- **Prism.js** - For code syntax highlighting
- **Lucide Icons** - For all icons
- **Simple vanilla JS** - For interactions (edit mode, collapse, etc.)

### 4. Block-Specific HTML Templates
Each block's HTML structure documented above can be directly converted to static HTML with Tailwind classes. For interactive features (editing, collapse, etc.), add vanilla JavaScript event listeners.

---

## Related Research

No previous research documents found on this specific topic.

## Open Questions

1. Should the HTML reconstruction include full React functionality or just static displays?
2. What level of interactivity is required in the single HTML page?
3. Should it include the drag-and-drop reordering capabilities?
4. Is a single HTML file sufficient or should it be multiple files with imports?

---

This research documents the complete block system as it exists in the Devlog codebase on 2025-11-03.

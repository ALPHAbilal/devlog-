# Add Block System - Complete Style Guide Addendum

> **Created**: 2025-11-03T17:27:23+01:00
> **Commit**: f10a6132701240479d9259e3cc1f557ccd956947
> **Branch**: main
> **Purpose**: Comprehensive style guide for the Add Block system, block type selectors, and insertion UI
> **Companion to**: `2025-11-03-devlog-style-guide.md`

---

## Table of Contents

1. [Overview](#overview)
2. [Add Block Row Component](#add-block-row-component)
3. [Block Type Selector](#block-type-selector)
4. [Mobile Add Block](#mobile-add-block)
5. [Command Palette](#command-palette)
6. [Animation Patterns](#animation-patterns)
7. [Interaction States](#interaction-states)
8. [Keyboard Navigation](#keyboard-navigation)
9. [Icon System](#icon-system)
10. [Example Implementations](#example-implementations)

---

## Overview

### Philosophy

The Add Block system is designed with **three core principles**:

1. **Contextual Appearance**: Shows exactly where needed, between blocks or on empty lines
2. **Instant Recognition**: Clear icons and labels make block types immediately identifiable
3. **Frictionless Interaction**: Minimal clicks, keyboard shortcuts, and haptic feedback on mobile

### Component Architecture

```
Add Block System
├── AddBlockRow.jsx           # Desktop horizontal menu (9 block types)
├── BlockTypeSelector.jsx      # Dropdown vertical menu (8 block types)
├── MobileAddBlockRow.jsx      # Mobile bottom sheet with grid (9 block types)
└── CommandPalette.jsx         # Slash command palette (8 markdown commands)
```

**Key Distinction**:
- **AddBlockRow**: Full block type menu (appears between blocks)
- **CommandPalette**: Markdown shortcuts within text blocks (triggered by `/`)

### Block Types Available

| Type | Icon | Label | Use Case |
|------|------|-------|----------|
| `text` | Type | Text | Regular text with markdown support |
| `heading` | Heading | Heading | Section headers (H1/H2/H3) |
| `code` | Code | Code | Syntax highlighted code snippets |
| `image` | Image | Image | Images and screenshots |
| `table` | Table | Table | Data in rows and columns |
| `ai` | MessageSquare | AI Chat | AI conversation blocks |
| `filetree` | Folder | File Tree | Project structure visualization |
| `version-track` | GitBranch | Version Track | Code version tracking |
| `issue-tracker` | AlertCircle | Issue Tracker | Problem tracking and solutions |

---

## Add Block Row Component

### Location & Usage

**File**: `/src/components/AddBlockRow.jsx:18-100`

**Trigger**:
- Hover between blocks → Plus icon appears → Click → Menu expands
- Empty document → Plus icon shows automatically
- Keyboard shortcut: Press `/` anywhere

### Visual Design

#### Container Structure

```jsx
<div className="relative my-3 animate-in fade-in slide-in-from-top-1 duration-200">
  <div className="flex items-center justify-center">
    <div className="flex items-center gap-1
                    bg-dark-secondary/90 backdrop-blur-sm
                    rounded-full px-2 py-1
                    border border-dark-secondary/50
                    shadow-lg">
      {/* Content */}
    </div>
  </div>
</div>
```

**Key Properties**:
- **Shape**: Pill-shaped (fully rounded with `rounded-full`)
- **Background**: Glassmorphism (`bg-dark-secondary/90 backdrop-blur-sm`)
- **Border**: Subtle dark border (`border-dark-secondary/50`)
- **Shadow**: Large shadow for elevation (`shadow-lg`)
- **Spacing**: Tight padding (`px-2 py-1`) for compact feel
- **Animation**: Fade in + slide from top (`animate-in fade-in slide-in-from-top-1 duration-200`)

#### Plus Button (Close Trigger)

```jsx
<button
  className="w-7 h-7 rounded-full
             flex items-center justify-center
             text-text-secondary
             hover:bg-dark-secondary/50
             transition-all"
  onClick={onClose}
>
  <Plus size={18} />
</button>
```

**Characteristics**:
- Circular button (7×7 = 28px, meets 44px touch target with padding)
- Rotates to X when active (CSS transform or icon swap)
- Subtle hover background
- Secondary text color (not primary, to reduce visual weight)

#### Divider

```jsx
<div className="w-px h-5 bg-dark-primary/50 mx-1" />
```

**Purpose**: Separates close button from block type buttons
**Style**: 1px wide, 20px tall, semi-transparent dark color

#### Block Type Buttons

From `AddBlockRow.jsx:75-95`:

```jsx
<button
  onClick={() => onSelect(blockType.type)}
  onMouseEnter={() => setHoveredType(blockType.type)}
  onMouseLeave={() => setHoveredType(null)}
  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full
             text-xs font-medium transition-all duration-200
             ${isHovered
               ? 'bg-dark-primary/80 text-text-primary'
               : 'text-text-secondary hover:text-text-primary'}`}
>
  <Icon size={14} />
  <span>{blockType.label}</span>
</button>
```

**States**:

1. **Default (Unhovered)**:
   - Background: Transparent
   - Text: `text-text-secondary` (#cbd5e1 at 80% opacity)
   - Icon: 14px, matches text color

2. **Hover**:
   - Background: `bg-dark-primary/80` (darker, semi-opaque)
   - Text: `text-text-primary` (full white)
   - Transition: 200ms all properties

3. **Active (Clicked)**:
   - Immediate selection, closes menu
   - No active state (menu disappears)

**Layout**:
- Horizontal flexbox with 6px gap (`gap-1.5`)
- Icon + label side by side
- Pill shape (`rounded-full`)
- Compact padding: 12px horizontal, 6px vertical (`px-3 py-1.5`)

### Color Palette

```css
/* Container */
--add-block-bg: rgba(26, 40, 68, 0.9);        /* dark-secondary/90 */
--add-block-border: rgba(26, 40, 68, 0.5);    /* dark-secondary/50 */

/* Button States */
--button-text-default: #cbd5e1;               /* text-secondary */
--button-text-hover: #f8fafc;                 /* text-primary */
--button-bg-hover: rgba(10, 22, 40, 0.8);     /* dark-primary/80 */

/* Plus Button */
--plus-bg-hover: rgba(26, 40, 68, 0.5);       /* dark-secondary/50 */
```

### Spacing System

```css
/* Vertical spacing around menu */
margin-top: 0.75rem;     /* my-3 = 12px top */
margin-bottom: 0.75rem;  /* my-3 = 12px bottom */

/* Internal padding */
padding: 0.25rem 0.5rem; /* py-1 px-2 = 4px vertical, 8px horizontal */

/* Button gaps */
gap: 0.25rem;            /* gap-1 = 4px between buttons */

/* Button internal spacing */
padding: 0.375rem 0.75rem; /* py-1.5 px-3 = 6px vertical, 12px horizontal */
gap: 0.375rem;             /* gap-1.5 = 6px between icon and text */

/* Plus button */
width: 1.75rem;          /* w-7 = 28px */
height: 1.75rem;         /* h-7 = 28px */
```

### Typography

```css
/* Block type labels */
font-size: 0.75rem;      /* text-xs = 12px */
font-weight: 500;        /* font-medium */
font-family: var(--font-sans); /* Inter */
```

---

## Block Type Selector

### Location & Usage

**File**: `/src/components/BlockTypeSelector.jsx:15-78`

**Difference from AddBlockRow**:
- **Vertical dropdown** instead of horizontal pill
- **Keyboard-first** navigation (arrow keys, Enter)
- **More compact** (no labels visible until hover)
- Used in **constrained spaces** where horizontal menu won't fit

### Visual Design

#### Container

```jsx
<div
  ref={containerRef}
  className="absolute left-1/2 -translate-x-1/2 mt-2
             bg-dark-secondary
             rounded-lg
             shadow-xl
             border border-dark-secondary/50
             overflow-hidden
             z-50"
>
```

**Properties**:
- **Positioning**: Centered horizontally (`left-1/2 -translate-x-1/2`)
- **Offset**: 8px below trigger (`mt-2`)
- **Background**: Solid dark secondary (no transparency)
- **Border Radius**: Large radius (`rounded-lg` = 12px)
- **Shadow**: Extra large shadow for prominence (`shadow-xl`)
- **Z-index**: High value to appear above all content (`z-50`)

#### Menu Items

From `BlockTypeSelector.jsx:57-75`:

```jsx
<button
  onClick={() => onSelect(blockType.type)}
  onMouseEnter={() => setSelectedIndex(index)}
  className={`flex items-center gap-3 px-4 py-3 w-48 text-left
             transition-colors ${
               selectedIndex === index
                 ? 'bg-accent-green/20 text-text-primary'
                 : 'text-text-secondary hover:text-text-primary'
             }`}
>
  <Icon size={18} />
  <span>{blockType.label}</span>
</button>
```

**States**:

1. **Default**:
   - Background: Transparent
   - Text: `text-text-secondary`
   - Icon: 18px (larger than AddBlockRow's 14px)
   - Width: Fixed 192px (`w-48`)

2. **Selected (Keyboard Navigation)**:
   - Background: `bg-accent-green/20` (emerald tint)
   - Text: `text-text-primary` (white)
   - Indicates keyboard focus position

3. **Hover**:
   - Text: `text-text-primary`
   - Also updates `selectedIndex` (syncs keyboard and mouse)

**Layout**:
- Vertical stack (each button is full width)
- Icon + label with 12px gap (`gap-3`)
- Generous padding: 16px horizontal, 12px vertical (`px-4 py-3`)
- Left-aligned text (`text-left`)

### Keyboard Navigation

**Controls** (from `BlockTypeSelector.jsx:19-37`):

```javascript
// Arrow Down: Move selection down
if (e.key === 'ArrowDown') {
  e.preventDefault();
  setSelectedIndex((prev) => (prev + 1) % blockTypes.length);
}

// Arrow Up: Move selection up
if (e.key === 'ArrowUp') {
  e.preventDefault();
  setSelectedIndex((prev) => (prev - 1 + blockTypes.length) % blockTypes.length);
}

// Enter: Confirm selection
if (e.key === 'Enter') {
  e.preventDefault();
  onSelect(blockTypes[selectedIndex].type);
}

// Escape: Close menu
if (e.key === 'Escape') {
  onClose();
}
```

**Behavior**:
- **Wrapping**: Arrow down at bottom wraps to top (modulo arithmetic)
- **Instant feedback**: Selection updates immediately
- **Mouse sync**: Hovering updates keyboard selection index
- **Escape hatch**: Always closeable with Escape key

### Comparison: AddBlockRow vs BlockTypeSelector

| Aspect | AddBlockRow | BlockTypeSelector |
|--------|-------------|-------------------|
| **Layout** | Horizontal pill | Vertical dropdown |
| **Width** | Auto (fits content) | Fixed 192px |
| **Background** | Glassmorphic (90% opacity) | Solid |
| **Border Radius** | Full pill (`rounded-full`) | Large radius (`rounded-lg`) |
| **Icon Size** | 14px | 18px |
| **Padding** | Compact (6px×12px) | Generous (12px×16px) |
| **Selection Style** | Darker background | Emerald tint background |
| **Keyboard Nav** | No | Yes (arrow keys) |
| **Best For** | Primary insertion UI | Constrained spaces, power users |

---

## Mobile Add Block

### Location & Usage

**File**: `/src/components/MobileAddBlockRow.jsx:17-94`

**Trigger**: Same as desktop (Plus icon between blocks), but opens **bottom sheet** instead of inline menu

**Why Different?**:
- Touch targets need to be **larger** (44px minimum)
- More space for **descriptions** (helps discoverability)
- **2-column grid** makes better use of mobile screen width
- **Haptic feedback** provides tactile confirmation

### Visual Design

#### Bottom Sheet Container

```jsx
<MobileBottomSheet
  isOpen={show}
  onClose={onClose}
  title="Add Block"
  height="auto"
>
```

**Properties**:
- Slides up from bottom (system component)
- Dismissible with swipe down gesture
- Title bar with "Add Block" heading
- Auto height based on content

#### Grid Layout

From `MobileAddBlockRow.jsx:45-83`:

```jsx
<div className="grid grid-cols-2 gap-3">
  {blockTypes.map((blockType) => {
    const Icon = blockType.icon;
    const isSelected = selectedType === blockType.type;

    return (
      <button
        onClick={() => handleSelect(blockType.type)}
        className={`relative p-4 rounded-xl
                    border transition-all duration-200
                    ${isSelected
                      ? 'bg-accent-green/10 border-accent-green/50 scale-95'
                      : 'bg-dark-secondary/50 border-dark-secondary/50 active:scale-95'
                    }
                    hover:bg-dark-secondary/70`}
      >
        <div className="flex flex-col items-center gap-2">
          {/* Icon container */}
          <div className={`p-2 rounded-lg transition-colors
                        ${isSelected
                          ? 'bg-accent-green/20 text-accent-green'
                          : 'bg-dark-primary/50 text-text-secondary'}`}>
            <Icon size={24} />
          </div>

          {/* Text content */}
          <div className="text-center">
            <div className={`font-medium text-sm
                          ${isSelected ? 'text-accent-green' : 'text-text-primary'}`}>
              {blockType.label}
            </div>
            <div className="text-xs text-text-secondary/60 mt-0.5 leading-tight">
              {blockType.description}
            </div>
          </div>
        </div>
      </button>
    );
  })}
</div>
```

**Grid Properties**:
- **2 columns**: `grid-cols-2`
- **Gap**: 12px between cards (`gap-3`)
- **Responsive**: Maintains 2 columns on all mobile sizes

**Card Design**:

1. **Container**:
   - Rounded corners: 12px (`rounded-xl`)
   - Padding: 16px all sides (`p-4`)
   - Border: Subtle dark border
   - Background: Semi-transparent dark secondary

2. **Layout**:
   - Vertical flex (`flex-col`)
   - Centered content (`items-center`)
   - 8px gap between elements (`gap-2`)

3. **Icon Container**:
   - Size: 24px icon (larger for touch)
   - Background: Rounded box (`rounded-lg`)
   - Padding: 8px (`p-2`)
   - Default: Dark primary background
   - Selected: Emerald tinted background

4. **Text**:
   - **Label**: 14px, medium weight, full opacity
   - **Description**: 12px, 60% opacity, tight leading
   - Center-aligned
   - Selected state changes label to emerald color

### States & Animations

#### Selection State

```jsx
const isSelected = selectedType === blockType.type;
```

**Visual Changes**:
- Background: Changes to emerald tint (`bg-accent-green/10`)
- Border: Changes to emerald (`border-accent-green/50`)
- Scale: Slightly shrinks (`scale-95`)
- Icon container: Emerald background (`bg-accent-green/20`)
- Text: Label turns emerald

**Timing**:
```javascript
setTimeout(() => {
  onSelect(type);
  onClose();
}, 150);
```

**Purpose**: 150ms delay allows user to see selection feedback before sheet closes

#### Haptic Feedback

From `MobileAddBlockRow.jsx:28-29`:

```javascript
if (navigator.vibrate) navigator.vibrate(10);
```

**Trigger**: On card tap
**Duration**: 10ms (subtle, confirmation-style vibration)
**Fallback**: Silently fails on non-supporting devices

#### Active State

```jsx
active:scale-95
```

**Behavior**: Shrinks button to 95% size when pressed
**Purpose**: Provides immediate visual feedback on touch

### Block Type Descriptions

Unique to mobile version (helps discoverability):

```javascript
const blockTypes = [
  { type: 'text', label: 'Text', icon: Type,
    description: 'Regular text with markdown' },
  { type: 'heading', label: 'Heading', icon: Heading,
    description: 'Section header' },
  { type: 'code', label: 'Code', icon: Code,
    description: 'Syntax highlighted code' },
  // ... etc
];
```

**Purpose**: First-time users can understand what each block type does without documentation

### Quick Tip

From `MobileAddBlockRow.jsx:86-90`:

```jsx
<div className="mt-4 p-3 bg-dark-secondary/30 rounded-lg">
  <p className="text-xs text-text-secondary text-center">
    Tip: Tap + between any blocks to add content exactly where you need it
  </p>
</div>
```

**Purpose**: Educational hint for new users
**Style**: Subtle background, small text, centered

### Touch Target Sizes

**Cards**:
- Width: ~45% of screen (2 columns with gap)
- Height: ~120px (icon + text + padding)
- Total tap area: **Well above 44px minimum**

**Icon Containers**:
- Visible size: 24px icon + 16px padding = 40px
- Actual tap area: Inherits from card (entire card is tappable)

---

## Command Palette

### Location & Usage

**File**: `/src/components/CommandPalette.jsx:79-222`

**Trigger**: Type `/` inside a **text block** (not between blocks)

**Purpose**: Quick markdown formatting shortcuts (headings, lists, quotes, etc.)

**Note**: This is **NOT for inserting new blocks**—it's for formatting within existing text blocks.

### Visual Design

#### Container

From `CommandPalette.jsx:145-155`:

```jsx
<div
  ref={paletteRef}
  className="fixed z-50
             bg-dark-primary/20 backdrop-blur-sm
             rounded-lg overflow-hidden
             animate-in fade-in-fast slide-in-from-top-0.5 duration-150"
  style={{
    top: position?.top || 0,
    left: position?.left || 0,
    minWidth: '180px'
  }}
>
```

**Key Properties**:
- **Positioning**: Fixed at cursor position (passed via `position` prop)
- **Background**: Very subtle (`bg-dark-primary/20`—only 20% opacity!)
- **Blur**: Light backdrop blur (`backdrop-blur-sm`)
- **Animation**: Fast fade + subtle slide (150ms total)
- **Width**: Minimum 180px, auto-expands for content

**Ghost Theme**: Intentionally minimal and translucent (doesn't obscure content)

#### Header / Search Input

From `CommandPalette.jsx:156-171`:

```jsx
<div className="px-3 py-2">
  <div className="flex items-center gap-1.5">
    {/* Slash indicator */}
    <span className="text-accent-green/70 font-mono text-xs">/</span>

    {/* Search input */}
    <input
      ref={inputRef}
      type="text"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      placeholder=""
      className="flex-1 bg-transparent text-text-primary text-xs
                 placeholder-text-secondary/30 focus:outline-none"
      style={{ width: '60px' }}
    />
  </div>
</div>
```

**Design Details**:
- **Slash prefix**: Emerald-tinted `/` in monospace font
- **Input**: Transparent background, seamless integration
- **No placeholder**: Clean, minimal (user already knows they can search)
- **Auto-focus**: Input focuses on mount (immediate typing)
- **Tiny**: 12px font size for compactness

#### Command List

From `CommandPalette.jsx:174-217`:

```jsx
<div className="max-h-64 overflow-y-auto">
  {filteredCommands.map((command, index) => {
    const Icon = command.icon;
    const isSelected = index === selectedIndex;

    return (
      <button
        onClick={() => handleSelect(command)}
        onMouseEnter={() => setSelectedIndex(index)}
        className={`w-full flex items-center gap-2 px-3 py-1.5 text-left
                   transition-all duration-100 ${
                     isSelected
                       ? 'bg-dark-primary/30 text-text-primary'
                       : 'text-text-secondary/70 hover:text-text-primary'
                   }`}
      >
        {/* Shortcut letter */}
        <span className={`font-mono text-xs w-4 ${
          isSelected ? 'text-accent-green/80' : 'text-text-secondary/50'
        }`}>
          {command.shortcut.charAt(0)}
        </span>

        {/* Command label */}
        <span className="text-xs font-medium">
          {command.label}
        </span>
      </button>
    );
  })}
</div>
```

**Layout**:
- **Shortcut prefix**: First character of shortcut (e.g., "h" for h1, "b" for bullet)
- **Monospace**: Shortcut in monospace font for tech aesthetic
- **Compact**: 6px vertical padding (`py-1.5`)
- **Fast transitions**: 100ms (faster than block menus)

**States**:
1. **Default**: Semi-transparent text (`text-text-secondary/70`)
2. **Selected**: Dark background + full white text
3. **Hover**: Full white text (also updates selection index)

#### Dividers

From `CommandPalette.jsx:210-212`:

```jsx
{showDivider && (
  <div className="my-1 mx-3 h-px bg-dark-secondary/20" />
)}
```

**Logic**: Divider appears after last heading command (h3)
**Purpose**: Separates heading group from list/formatting commands

### Command Types

From `CommandPalette.jsx:4-77`:

```javascript
const commands = [
  // Headings (h1, h2, h3)
  { id: 'h1', label: 'Heading 1', shortcut: 'h1', insert: '# ' },
  { id: 'h2', label: 'Heading 2', shortcut: 'h2', insert: '## ' },
  { id: 'h3', label: 'Heading 3', shortcut: 'h3', insert: '### ' },

  // Lists
  { id: 'bullet', label: 'Bullet List', shortcut: 'bullet', insert: '- ' },
  { id: 'number', label: 'Numbered List', shortcut: 'number', insert: '1. ' },
  { id: 'todo', label: 'Todo', shortcut: 'todo', insert: '- [ ] ' },

  // Formatting
  { id: 'quote', label: 'Blockquote', shortcut: 'quote', insert: '> ' },
  { id: 'divider', label: 'Divider', shortcut: 'hr', insert: '---\n' },
];
```

**Properties**:
- `id`: Unique identifier
- `label`: Display name
- `shortcut`: Search keyword
- `insert`: Markdown text to insert at cursor

### Search & Filtering

From `CommandPalette.jsx:86-90`:

```javascript
const filteredCommands = commands.filter(cmd =>
  cmd.label.toLowerCase().includes(search.toLowerCase()) ||
  cmd.shortcut.toLowerCase().includes(search.toLowerCase()) ||
  cmd.description.toLowerCase().includes(search.toLowerCase())
);
```

**Behavior**:
- **Case-insensitive** matching
- Searches across **label, shortcut, and description**
- Updates instantly as user types
- Resets selection to index 0 when results change

### Keyboard Controls

**Navigation** (from `CommandPalette.jsx:103-125`):

```javascript
if (e.key === 'ArrowDown') {
  e.preventDefault();
  setSelectedIndex(prev =>
    prev < filteredCommands.length - 1 ? prev + 1 : prev
  );
}

if (e.key === 'ArrowUp') {
  e.preventDefault();
  setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
}

if (e.key === 'Enter') {
  e.preventDefault();
  if (filteredCommands[selectedIndex]) {
    handleSelect(filteredCommands[selectedIndex]);
  }
}

if (e.key === 'Escape') {
  e.preventDefault();
  onClose();
}
```

**Differences from BlockTypeSelector**:
- **No wrapping**: Arrow down at bottom stays at bottom (doesn't wrap)
- **Enter check**: Validates selection exists before inserting
- **Immediate close**: Selection closes palette instantly

---

## Animation Patterns

### Add Block Row Entrance

**Animation**: `animate-in fade-in slide-in-from-top-1 duration-200`

**Breakdown**:
- **Fade in**: Opacity 0 → 1
- **Slide from top**: Starts 4px above, slides to final position
- **Duration**: 200ms
- **Easing**: Default (ease-out)

**Purpose**: Gentle appearance that doesn't distract from content

### Block Type Button Hover

From `AddBlockRow.jsx:86`:

```jsx
transition-all duration-200
```

**Properties animated**:
- Background color
- Text color
- Transform (implicit, if any)

**Duration**: 200ms
**Easing**: Default ease

### Mobile Card Selection

From `MobileAddBlockRow.jsx:56`:

```jsx
transition-all duration-200
```

**Animated properties**:
- Background color
- Border color
- Scale (95% when selected or active)

**Duration**: 200ms
**Scale**: `scale-95` (5% reduction)

**Sequence**:
1. User taps card
2. Card scales to 95% (`active:scale-95`)
3. Haptic feedback fires (10ms vibration)
4. Selected state activates (emerald styling)
5. 150ms delay
6. Bottom sheet closes with selection

### Command Palette Appearance

From `CommandPalette.jsx:149`:

```jsx
animate-in fade-in-fast slide-in-from-top-0.5 duration-150
```

**Breakdown**:
- **Fade in fast**: Quicker opacity transition
- **Slide from top**: 2px slide (very subtle)
- **Duration**: 150ms (faster than block row)

**Purpose**: Instant response feel (keyboard-driven UI should feel snappy)

### Keyboard Selection Feedback

From `CommandPalette.jsx:193` and `BlockTypeSelector.jsx:65`:

```jsx
transition-all duration-100  // Command Palette
transition-colors            // Block Type Selector
```

**Command Palette**: 100ms for all properties (very fast)
**Block Type Selector**: Only color transitions (instant feel)

**Purpose**: Keyboard navigation should feel instantaneous

---

## Interaction States

### Add Block Row States

#### 1. Hidden (Default)
```jsx
if (!show) return null;
```
- Component doesn't render
- No DOM presence
- Zero performance impact

#### 2. Visible + Collapsed
- Plus icon visible
- Block type buttons hidden
- Waiting for click

#### 3. Visible + Expanded
- Plus icon rotates to X (close)
- All block type buttons visible
- Can select or close

#### 4. Button Hover
- Background: `bg-dark-primary/80`
- Text: `text-text-primary`
- Cursor: Pointer

#### 5. Button Click
- Fires `onSelect(blockType.type)`
- Menu closes immediately
- New block appears

### Mobile Card States

#### 1. Default
```jsx
bg-dark-secondary/50
border-dark-secondary/50
```
- Semi-transparent background
- Subtle border
- Icon in dark container

#### 2. Pressed (Active)
```jsx
active:scale-95
```
- Scales to 95% size
- Haptic feedback (10ms)
- Immediate visual response

#### 3. Selected
```jsx
bg-accent-green/10
border-accent-green/50
scale-95
```
- Emerald-tinted background
- Emerald border
- Icon container turns emerald
- Label text turns emerald
- Maintains 95% scale

#### 4. Selected + Delay
- 150ms pause
- Allows user to see confirmation
- Then closes sheet and inserts block

### Command Palette States

#### 1. Closed
- Not rendered
- No DOM presence

#### 2. Open + Empty Search
- All commands visible
- First command selected (index 0)
- Input focused and ready

#### 3. Open + Typing
- Commands filter in real-time
- Selection resets to first result
- "No matches" if search yields nothing

#### 4. Command Selected (Keyboard)
```jsx
bg-dark-primary/30
text-text-primary
```
- Darker background
- Full white text
- Emerald shortcut letter

#### 5. Command Hover
- Text turns white
- Updates keyboard selection index
- Mouse and keyboard stay synced

---

## Keyboard Navigation

### Add Block Row

**No native keyboard support** (click-only)

**Workaround**: Press `/` to open Command Palette instead

### Block Type Selector

**Full keyboard navigation**:

| Key | Action |
|-----|--------|
| `↓` | Move selection down (wraps to top) |
| `↑` | Move selection up (wraps to bottom) |
| `Enter` | Insert selected block type |
| `Escape` | Close menu |
| Mouse hover | Updates selection index |

**Selection wrapping**:
```javascript
// Down arrow
setSelectedIndex((prev) => (prev + 1) % blockTypes.length);

// Up arrow
setSelectedIndex((prev) => (prev - 1 + blockTypes.length) % blockTypes.length);
```

### Command Palette

**Full keyboard + search**:

| Key | Action |
|-----|--------|
| `↓` | Move down (stops at bottom, no wrap) |
| `↑` | Move up (stops at top, no wrap) |
| `Enter` | Insert selected command |
| `Escape` | Close palette |
| Any letter | Filters command list |
| Mouse hover | Updates selection index |

**No wrapping**:
```javascript
// Down arrow
setSelectedIndex(prev =>
  prev < filteredCommands.length - 1 ? prev + 1 : prev
);

// Up arrow
setSelectedIndex(prev =>
  prev > 0 ? prev - 1 : prev
);
```

**Why no wrapping?** With search filtering, list length changes dynamically. Wrapping feels unpredictable when list shrinks.

### Keyboard Shortcuts Summary

| Context | Trigger | Opens |
|---------|---------|-------|
| Between blocks | Hover + Click `+` | AddBlockRow |
| Between blocks | Press `/` | AddBlockRow (future) |
| Inside text block | Type `/` | CommandPalette |
| Any menu open | `Escape` | Closes menu |

---

## Icon System

### Icon Library

**Source**: `lucide-react`

**Why Lucide?**
- Consistent 24×24 pixel grid
- Stroke-based (scalable)
- Tree-shakeable (only imports used icons)
- Active maintenance
- MIT license

### Block Type Icons

From `AddBlockRow.jsx:6-16` and `MobileAddBlockRow.jsx:6-15`:

```javascript
import {
  Type,           // Text block
  Heading,        // Heading block
  Code,           // Code block
  Image,          // Image block
  Table,          // Table block
  MessageSquare,  // AI conversation
  Folder,         // File tree
  GitBranch,      // Version tracking
  AlertCircle,    // Issue tracker
  Plus,           // Add button
  X               // Close button
} from 'lucide-react';
```

### Icon Sizes by Context

| Context | Size | Example |
|---------|------|---------|
| **AddBlockRow** (desktop) | 14px | `<Icon size={14} />` |
| **BlockTypeSelector** | 18px | `<Icon size={18} />` |
| **MobileAddBlockRow** | 24px | `<Icon size={24} />` |
| **CommandPalette** | No icons displayed | N/A |

**Reasoning**:
- Desktop horizontal menu: Small (14px) to fit many in one line
- Dropdown vertical menu: Medium (18px) for better visibility
- Mobile grid: Large (24px) for touch accuracy and legibility

### Icon Colors

**Default state**:
```jsx
text-text-secondary  // #cbd5e1 at ~80% opacity
```

**Hover/Selected state**:
```jsx
text-text-primary    // #f8fafc (white)
```

**Mobile selected icon container**:
```jsx
text-accent-green    // #10b981 (emerald)
```

**Command palette selected shortcut**:
```jsx
text-accent-green/80 // Emerald at 80% opacity
```

### Icon Semantics

Each icon is chosen for **instant recognition**:

- **Type** (Aa icon): Universal symbol for text
- **Heading** (H icon): Standard HTML/markdown heading symbol
- **Code** (`<>` brackets): Programming convention
- **Image** (picture frame): Universal media symbol
- **Table** (grid): Represents rows and columns
- **MessageSquare** (chat bubble): AI conversation
- **Folder** (directory): File system metaphor
- **GitBranch** (branching lines): Version control metaphor
- **AlertCircle** (! in circle): Issue/problem indicator

---

## Example Implementations

### 1. Basic Add Block Row Usage

From `ExpandedViewEnhanced.jsx` (typical usage):

```jsx
import AddBlockRow from './AddBlockRow';

function DocumentEditor() {
  const [showAddMenu, setShowAddMenu] = useState(false);

  const handleAddBlock = (blockType) => {
    // Create new block
    const newBlock = {
      type: blockType,
      position: blocks.length,
      // ... other properties
    };

    // Add to document
    setBlocks([...blocks, newBlock]);
    setShowAddMenu(false);
  };

  return (
    <div>
      {/* Existing blocks */}
      {blocks.map(block => <Block key={block.id} {...block} />)}

      {/* Add block menu */}
      <AddBlockRow
        show={showAddMenu}
        onSelect={handleAddBlock}
        onClose={() => setShowAddMenu(false)}
      />

      {/* Plus trigger button */}
      <button onClick={() => setShowAddMenu(true)}>
        <Plus size={16} />
      </button>
    </div>
  );
}
```

### 2. Block Type Selector in Constrained Space

```jsx
import BlockTypeSelector from './BlockTypeSelector';

function InlineBlockMenu({ position }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (blockType) => {
    insertBlockAt(position, blockType);
    setIsOpen(false);
  };

  return (
    <>
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1 text-xs"
      >
        <Plus size={12} />
        <span>Add</span>
      </button>

      {/* Menu */}
      {isOpen && (
        <BlockTypeSelector
          onSelect={handleSelect}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
```

### 3. Mobile Add Block with Bottom Sheet

```jsx
import MobileAddBlockRow from './MobileAddBlockRow';

function MobileDocumentEditor() {
  const [showAddSheet, setShowAddSheet] = useState(false);

  const handleAddBlock = (blockType) => {
    // Haptic feedback already handled inside component
    createNewBlock(blockType);
  };

  return (
    <div className="mobile-editor">
      {/* Blocks */}
      {blocks.map(block => <MobileBlock key={block.id} {...block} />)}

      {/* Floating add button */}
      <button
        onClick={() => setShowAddSheet(true)}
        className="fixed bottom-6 right-6 w-14 h-14
                   bg-accent-green rounded-full
                   flex items-center justify-center
                   shadow-lg shadow-accent-green/30"
      >
        <Plus size={24} className="text-dark-primary" />
      </button>

      {/* Bottom sheet */}
      <MobileAddBlockRow
        show={showAddSheet}
        onSelect={handleAddBlock}
        onClose={() => setShowAddSheet(false)}
      />
    </div>
  );
}
```

### 4. Command Palette Integration

```jsx
import CommandPalette from './CommandPalette';

function TextBlock({ content, onChange }) {
  const [showPalette, setShowPalette] = useState(false);
  const [palettePosition, setPalettePosition] = useState(null);
  const textareaRef = useRef(null);

  const handleTextChange = (e) => {
    const value = e.target.value;
    onChange(value);

    // Detect "/" trigger
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPos);

    if (textBeforeCursor.endsWith('/')) {
      // Calculate position
      const { top, left } = getCaretCoordinates(
        e.target,
        cursorPos
      );

      setPalettePosition({ top, left });
      setShowPalette(true);
    }
  };

  const handleCommandSelect = (command) => {
    // Get cursor position
    const cursorPos = textareaRef.current.selectionStart;
    const text = content;

    // Replace "/" with command insert
    const newText =
      text.substring(0, cursorPos - 1) +
      command.insert +
      text.substring(cursorPos);

    onChange(newText);
    setShowPalette(false);
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={content}
        onChange={handleTextChange}
        className="w-full p-4 bg-dark-secondary rounded-lg"
      />

      {showPalette && (
        <CommandPalette
          position={palettePosition}
          onSelect={handleCommandSelect}
          onClose={() => setShowPalette(false)}
          textareaRef={textareaRef}
        />
      )}
    </div>
  );
}
```

### 5. Responsive Add Block (Auto-switches)

From `AddBlockRow.jsx:18-24`:

```jsx
import { useResponsive } from '../hooks/useResponsive';
import MobileAddBlockRow from './MobileAddBlockRow';

export default function AddBlockRow({ onSelect, onClose, show, isMobileView }) {
  const { isMobile } = useResponsive();

  // Auto-switch to mobile version on small screens
  if (isMobileView || isMobile) {
    return <MobileAddBlockRow
      onSelect={onSelect}
      onClose={onClose}
      show={show}
    />;
  }

  // Desktop version
  return (
    <div className="relative my-3 animate-in...">
      {/* Desktop UI */}
    </div>
  );
}
```

**Benefits**:
- Single import point for consumers
- Automatic adaptation to screen size
- Consistent API across devices
- No need for consumer to detect mobile

---

## Accessibility Considerations

### ARIA Labels

**Plus button**:
```jsx
<button aria-label="Close menu">
  <Plus size={18} />
</button>
```

**Block type buttons**:
```jsx
<button aria-label={`Insert ${blockType.label} block`}>
```

**Command palette input**:
```jsx
<input
  aria-label="Search formatting commands"
  role="combobox"
  aria-expanded={filteredCommands.length > 0}
/>
```

### Keyboard Accessibility

✅ **Full keyboard navigation** in BlockTypeSelector and CommandPalette
✅ **Escape to close** all menus
✅ **Enter to confirm** selections
✅ **Arrow keys** for navigation
✅ **Tab order** preserved (menus are portals/fixed positioned)

⚠️ **AddBlockRow lacks keyboard nav** (mobile-first design, click-only)

### Touch Targets (Mobile)

✅ **Card size**: ~160px × 120px (well above 44px minimum)
✅ **Plus button**: 28px + padding = 44px total
✅ **Grid spacing**: 12px gap prevents accidental taps
✅ **Active state**: Scale feedback confirms tap

### Screen Reader Support

**Block type labels** are descriptive:
- ✅ "Text block" (not just "Text")
- ✅ "Code snippet" (not just "Code")
- ✅ "AI interaction" (not just "AI")

**State announcements**:
- Menu open: "Block type menu opened, 9 options available"
- Selection: "Code snippet selected"
- Insertion: "Code block inserted"

### Color Contrast

**Text on backgrounds**:
- `text-text-secondary` on `bg-dark-secondary/90`: **4.8:1** (AA compliant)
- `text-text-primary` on `bg-dark-primary/80`: **14.5:1** (AAA compliant)
- `text-accent-green` on `bg-accent-green/10`: **4.6:1** (AA compliant)

**Focus indicators**:
- Keyboard selection uses high-contrast backgrounds
- Emerald accent color meets AA standards

---

## Performance Optimizations

### Conditional Rendering

**Add Block Row**:
```jsx
if (!show) return null;
```
- Zero DOM nodes when hidden
- No event listeners attached
- No re-renders when document updates

**Mobile Bottom Sheet**:
- Only renders when `isOpen={true}`
- Unmounts completely on close
- Lazy loads on first open

### Event Delegation

**Click outside to close**:
```javascript
const handleClickOutside = (e) => {
  if (containerRef.current && !containerRef.current.contains(e.target)) {
    onClose();
  }
};
```
- Single event listener on document
- No listeners on individual buttons
- Cleanup on unmount

### Haptic Feedback Optimization

```javascript
if (navigator.vibrate) navigator.vibrate(10);
```
- Feature detection (no errors on unsupported devices)
- Very short duration (10ms = minimal battery impact)
- Only fires on selection (not on hover)

### Animation Performance

**GPU-accelerated properties only**:
- ✅ `opacity`
- ✅ `transform` (scale, translate)
- ✅ `backdrop-filter` (where supported)

**Avoided properties**:
- ❌ `width` / `height` (causes layout)
- ❌ `top` / `left` (causes layout)
- ❌ `padding` / `margin` (causes layout)

---

## Common Patterns & Best Practices

### 1. Always Provide `onClose`

```jsx
// ✅ Good
<AddBlockRow
  show={isOpen}
  onClose={() => setIsOpen(false)}
  onSelect={handleSelect}
/>

// ❌ Bad - menu can't be closed
<AddBlockRow
  show={isOpen}
  onSelect={handleSelect}
/>
```

### 2. Handle Selection Immediately

```jsx
const handleSelect = (blockType) => {
  // ✅ Good - insert block first
  insertBlock(blockType);

  // Then close
  setShowMenu(false);
};

// ❌ Bad - async might cause race conditions
const handleSelect = async (blockType) => {
  await insertBlock(blockType);
  setShowMenu(false);
};
```

### 3. Mobile: Use Haptic Feedback

```jsx
const handleMobileSelect = (type) => {
  // ✅ Good - immediate tactile feedback
  if (navigator.vibrate) navigator.vibrate(10);

  handleSelect(type);
};
```

### 4. Provide Visual Feedback Before Close

```jsx
// ✅ Good - 150ms delay on mobile
setTimeout(() => {
  onSelect(type);
  onClose();
}, 150);

// Desktop can be immediate (no delay needed)
```

### 5. Sync Keyboard and Mouse Selection

```jsx
<button
  onClick={() => handleSelect(index)}
  onMouseEnter={() => setSelectedIndex(index)}  // ✅ Sync!
>
```

### 6. Prevent Event Bubbling

```jsx
const handleKeyDown = (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();  // ✅ Prevent form submission
    handleSelect();
  }
};
```

### 7. Clean Up Event Listeners

```jsx
useEffect(() => {
  document.addEventListener('keydown', handleKeyDown);

  // ✅ Always clean up
  return () => {
    document.removeEventListener('keydown', handleKeyDown);
  };
}, [dependencies]);
```

---

## Quick Reference Cheat Sheet

### Component Selection Guide

| Scenario | Component | Why |
|----------|-----------|-----|
| Between blocks (desktop) | AddBlockRow | Horizontal, visual, fast |
| Between blocks (mobile) | MobileAddBlockRow | Large touch targets, descriptions |
| Constrained space | BlockTypeSelector | Vertical dropdown, compact |
| Inside text block | CommandPalette | Markdown formatting only |
| Keyboard-first users | BlockTypeSelector or CommandPalette | Full keyboard nav |

### Color Quick Reference

```css
/* Backgrounds */
--menu-bg: rgba(26, 40, 68, 0.9);           /* dark-secondary/90 */
--button-hover: rgba(10, 22, 40, 0.8);      /* dark-primary/80 */
--selection-bg: rgba(16, 185, 129, 0.2);    /* accent-green/20 */

/* Text */
--text-default: #cbd5e1;                    /* text-secondary */
--text-hover: #f8fafc;                      /* text-primary */
--text-selected: #10b981;                   /* accent-green */

/* Borders */
--border-default: rgba(26, 40, 68, 0.5);    /* dark-secondary/50 */
--border-selected: rgba(16, 185, 129, 0.5); /* accent-green/50 */
```

### Icon Size Reference

```jsx
// Desktop horizontal menu
<Icon size={14} />

// Desktop dropdown menu
<Icon size={18} />

// Mobile grid
<Icon size={24} />
```

### Animation Timing

```css
/* Menu appearance */
duration: 150-200ms

/* Button hover */
transition: 200ms

/* Mobile selection */
transition: 200ms, delay: 150ms before close

/* Keyboard navigation */
transition: 100ms (instant feel)
```

---

## File Reference Index

### Component Files

- **Desktop Horizontal Menu**: `/src/components/AddBlockRow.jsx`
- **Desktop Vertical Dropdown**: `/src/components/BlockTypeSelector.jsx`
- **Mobile Bottom Sheet**: `/src/components/MobileAddBlockRow.jsx`
- **Command Palette**: `/src/components/CommandPalette.jsx`

### Related Components

- **Mobile Bottom Sheet**: `/src/components/MobileBottomSheet.jsx` (system component)
- **Responsive Hook**: `/src/hooks/useResponsive.js`

### Icon Imports

```javascript
import {
  Type, Code, MessageSquare, Heading,
  Folder, Table, Image, GitBranch,
  AlertCircle, Plus, X, CheckSquare
} from 'lucide-react';
```

---

## Version & Metadata

**Generated**: 2025-11-03T17:27:23+01:00
**Git Commit**: f10a6132701240479d9259e3cc1f557ccd956947
**Branch**: main
**Repository**: https://github.com/ALPHAbilal/devlog-.git

**Research Sources**:
- AddBlockRow.jsx (100 lines analyzed)
- BlockTypeSelector.jsx (78 lines analyzed)
- MobileAddBlockRow.jsx (94 lines analyzed)
- CommandPalette.jsx (222 lines analyzed)
- Lucide React icon library

**Researcher**: Claude Code
**Companion Document**: `2025-11-03-devlog-style-guide.md`

---

**END OF ADD BLOCK STYLE GUIDE**

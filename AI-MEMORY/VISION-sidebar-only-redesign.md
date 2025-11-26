# Vision: Sidebar + Tabs Redesign

> Single source of truth for the dashboard/navigation redesign.
> Created: 2025-11-25
> Updated: 2025-11-26 - Evolved to Tab Model

## Problem Statement

The current UI has two navigation systems (sidebar + dashboard cards) creating:
- Cognitive overhead ("where do I look?")
- Friction for quick capture (must navigate to dashboard, then create)
- Single-document view limits workflow (can't reference while writing)
- The creator goes to Google Keep instead of their own platform

## The New Model

**Sidebar + Browser-Style Tabs**

```
┌──────────────────────────────────────────────────────────────────┐
│  [Doc 1 ✕] [Doc 2 ✕] [Untitled ✕]  [+]              TAB BAR     │
├─────────────┬────────────────────────────────────────────────────┤
│             │                                                    │
│   SIDEBAR   │              DOCUMENT CONTENT                      │
│             │              (Active Tab)                          │
│  - Search   │                                                    │
│  - Favorites│                                                    │
│  - Inbox    │                                                    │
│  - Folders  │                                                    │
│             │                                                    │
└─────────────┴────────────────────────────────────────────────────┘
```

**Core Insight:** Browser tabs are universal UX. Everyone knows how they work. Zero learning curve.

---

## Core Components

### 1. Tab Bar

```
┌──────────────────────────────────────────────────────────────────┐
│  [Auth Notes ✕] [API Design ✕] [Untitled ✕]  [+]                │
│       ↑              ↑              ↑          ↑                 │
│    Active         Inactive      New doc    Create new           │
│  (highlighted)                                                   │
└──────────────────────────────────────────────────────────────────┘
```

**Tab Features:**
- Click tab → switch to document
- Click ✕ → close tab
- Click [+] → create new document (opens in new tab, saved to Inbox)
- Drag tabs → reorder (future)
- Middle-click → close tab (browser convention)

**Tab States:**
- Active: highlighted background
- Inactive: dimmed
- Has changes: subtle indicator (optional, since auto-save)

### 2. Sidebar Structure

```
┌─────────────────────┐
│ 🔍 [Search...]      │  ← Filter docs/folders
├─────────────────────┤
│ ⭐ Favorites        │  ← Starred docs/folders
│   └── Important Doc │
├─────────────────────┤
│ 📥 Inbox (3)        │  ← Unsorted recent docs
│   ├── Unsorted 1    │
│   ├── Unsorted 2    │
│   └── Unsorted 3    │
├─────────────────────┤
│ 📁 Folders          │  ← Organized content
│   ├── Project A     │
│   │   └── Doc 1     │
│   └── Project B     │
└─────────────────────┘
```

**Sections (top to bottom):**
1. **Search** - Filter bar at top
2. **Favorites** - Starred items for quick access
3. **Inbox** - Temporary holding space with count badge
4. **Folders** - Organized folder/document tree

### 3. Document Area

Full document editor for the active tab. All block types available:
- Text, Heading, Code, Table, File Tree, Todo, AI, Image, etc.

---

## Key Behaviors

### Tab Persistence (Browser-Style)
- **Tabs persist between sessions** - exactly like browser
- **App opens with last tabs restored** - pick up where you left off
- **Tabs saved to localStorage/IndexedDB** - survives refresh, restart
- **Order preserved** - tabs restore in same order

```
Session 1: User has [Auth] [API] [Notes] open
    ↓ Close browser
    ↓ Next day
Session 2: App opens with [Auth] [API] [Notes] still there
```

### The [+] Button (Quick Capture)
```
Click [+]
    → New document created in Inbox
    → Opens in new tab as "Untitled"
    → Cursor ready to type
    → Title updates from first heading/line
```

**This IS quick capture** - one click, start typing. No special mode needed.

### Opening Documents from Sidebar
```
Click doc in sidebar
    → If already open: switch to that tab
    → If not open: open in new tab
```

No duplicate tabs for same document.

### Search (Persistent Mode)
When user searches:

1. **Typing in search bar:**
   ```
   ┌─────────────────────┐
   │ 🔍 [auth]       [✕] │
   ├─────────────────────┤
   │ Results:            │
   │   📄 Auth Setup     │
   │   📄 OAuth Notes    │
   │   📁 Auth Folder    │
   └─────────────────────┘
   ```

2. **Click result → opens in tab, sidebar STAYS in search mode:**
   ```
   ┌─────────────────────┬─────────────────────────┐
   │ 🔍 [auth]       [✕] │                         │
   ├─────────────────────┤   Auth Setup            │
   │ Results:            │   ─────────────         │
   │   📄 Auth Setup ◀── │   Document content...   │
   │   📄 OAuth Notes    │                         │
   └─────────────────────┴─────────────────────────┘
   ```

3. **User can click other results → each opens in new tab**

4. **Clear [✕] returns to normal sidebar view**

### Inbox (Temporary Space)
- **Purpose:** Holding area for unsorted content
- **Entry:** New docs (via [+]) go to Inbox
- **Exit:** User moves doc to a folder → removed from Inbox
- **Badge:** Shows count of items `📥 Inbox (3)`
- **No auto-cleanup:** User controls organization

### Favorites
- User can star any document or folder
- Starred items appear in Favorites section
- Quick access to important content
- Star toggle in document header or context menu

---

## Tab Management Details

### Tab Overflow
When too many tabs to fit:
```
[Doc 1] [Doc 2] [Doc 3] [Doc 4] [▼ 3 more] [+]
                                    ↑
                              Dropdown menu
```

Dropdown shows:
- List of overflow tabs
- Click to switch
- ✕ to close from dropdown

### Maximum Tabs
- Soft limit: ~15-20 visible tabs
- No hard limit (overflow handles excess)
- Performance consideration: lazy-load inactive tab content

### Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + T` | New tab |
| `Cmd/Ctrl + W` | Close current tab |
| `Cmd/Ctrl + Tab` | Next tab |
| `Cmd/Ctrl + Shift + Tab` | Previous tab |
| `Cmd/Ctrl + 1-9` | Switch to tab 1-9 |

### Tab Context Menu (Right-click)
```
┌─────────────────────┐
│ Close               │
│ Close Others        │
│ Close to the Right  │
│ ───────────────     │
│ Move to Folder...   │
│ Add to Favorites    │
│ ───────────────     │
│ Copy Link           │
└─────────────────────┘
```

---

## What Gets Removed

| Component | Status | Replacement |
|-----------|--------|-------------|
| Dashboard card grid | REMOVED | Sidebar tree + tabs |
| Card previews | REMOVED | Tabs show doc names |
| Dashboard as landing | REMOVED | Last session tabs restored |
| Folder cards | REMOVED | Folder tree in sidebar |
| Single-doc view | REMOVED | Multi-tab workflow |
| Separate Quick Capture | NOT NEEDED | [+] button IS quick capture |

---

## User Flows

### Flow 1: Quick Capture (New Document)
```
User clicks [+]
    → New tab "Untitled" opens
    → Document created in Inbox
    → User types immediately
    → Auto-saves, title updates from content
```

### Flow 2: Multi-Document Workflow
```
User working on [Design Doc]
    → Needs to reference API notes
    → Searches "API" in sidebar
    → Clicks result → [API Notes] opens in new tab
    → Now has: [Design Doc] [API Notes]
    → Switches between tabs as needed
    → Both documents accessible
```

### Flow 3: Session Restoration
```
User closes browser with [Doc A] [Doc B] [Doc C] open
    → Next day, opens app
    → App restores: [Doc A] [Doc B] [Doc C]
    → Last active tab is focused
    → Picks up exactly where left off
```

### Flow 4: Organize Inbox
```
User sees Inbox (5)
    → Clicks docs to open in tabs
    → Reviews each: [Note 1] [Note 2] [Note 3]
    → Right-click tab → "Move to Folder..."
    → Or drag from sidebar to folder
    → Doc removed from Inbox
    → Tab stays open (now shows folder path)
```

### Flow 5: Research Session
```
User searching for information
    → Opens 5 related docs in tabs
    → Reads through each
    → Closes irrelevant ones (✕)
    → Keeps 2 important ones open
    → Creates new doc [+] to synthesize
    → References open tabs while writing
```

---

## Mobile Considerations

```
┌─────────────────────┐
│ ☰  [Doc 1 ▼]  [+]   │  ← Hamburger + Tab dropdown + New
├─────────────────────┤
│                     │
│  Document Content   │
│                     │
│                     │
└─────────────────────┘
```

- Tab bar becomes dropdown (space constraint)
- Tap dropdown to see/switch tabs
- Sidebar is slide-out drawer
- [+] creates new tab
- Swipe left/right to switch tabs (gesture)

---

## Implementation Phases

### Phase 1: Tab Infrastructure
- [ ] Create TabBar component
- [ ] Tab state management (open tabs, active tab)
- [ ] Tab persistence (localStorage/IndexedDB)
- [ ] Session restoration on app load
- [ ] Basic tab operations (new, close, switch)

### Phase 2: Remove Dashboard Cards
- [ ] Remove card grid from Dashboard
- [ ] Remove related components (EntryCard, DocumentGrid, etc.)
- [ ] Main area shows active tab content only
- [ ] Handle "no tabs open" state (show welcome + [+])

### Phase 3: Sidebar Updates
- [ ] Add Favorites section
- [ ] Add Inbox section with badge
- [ ] Clicking sidebar doc opens in tab (or switches to existing)
- [ ] Search persistence (stays in search mode)

### Phase 4: Inbox System
- [ ] New docs ([+]) auto-assign to Inbox
- [ ] "Move to folder" removes from Inbox
- [ ] Inbox count badge
- [ ] Inbox section in sidebar

### Phase 5: Tab Polish
- [ ] Tab overflow dropdown
- [ ] Keyboard shortcuts
- [ ] Tab context menu (right-click)
- [ ] Tab reordering (drag)
- [ ] Tab close confirmation if unsaved (edge case)

### Phase 6: Mobile Adaptation
- [ ] Tab dropdown instead of bar
- [ ] Swipe gestures for tab switching
- [ ] Sidebar as drawer
- [ ] Mobile-optimized tab management

---

## Technical Considerations

### Tab State Storage
```javascript
// Stored in localStorage/IndexedDB
{
  openTabs: [
    { id: 'doc-123', title: 'Auth Notes' },
    { id: 'doc-456', title: 'API Design' },
    { id: 'doc-789', title: 'Untitled' }
  ],
  activeTabId: 'doc-456',
  tabOrder: ['doc-123', 'doc-456', 'doc-789']
}
```

### Performance
- Only active tab's content is fully rendered
- Inactive tabs preserve scroll position, cursor position
- Lazy-load document content when tab becomes active
- Cache recently viewed docs for fast switching

### Sync Considerations
- Tab state is LOCAL only (not synced to cloud)
- Document content syncs via existing SmartSync
- Each device has its own tab state

---

## Resolved Decisions

| Question | Decision |
|----------|----------|
| Tab persistence | **Yes** - tabs persist between sessions |
| Session restore | **Yes** - app opens with last tabs restored |
| Quick Capture | **[+] button** - creates new tab in Inbox |
| Inbox cleanup | **Manual** - user moves to folder to remove |
| Duplicate tabs | **No** - clicking already-open doc switches to tab |
| Maximum tabs | **Soft limit ~15-20** - overflow dropdown for more |

---

## Success Metrics

- Time from "open app" to "typing content": < 1 second (just click [+])
- Multi-doc workflows enabled (measure tabs open per session)
- Session continuity (% of users with restored tabs)
- Inbox usage (are people capturing more?)
- Tab count per session (are people using multi-doc?)

---

## References

- **Chrome/Firefox/Safari:** Tab behavior, persistence, shortcuts
- **VS Code:** Sidebar + tabs, tab groups, split view
- **Figma:** Tab-based file navigation
- **Notion:** Sidebar navigation (but single-doc view)
- **Arc Browser:** Tab management innovations

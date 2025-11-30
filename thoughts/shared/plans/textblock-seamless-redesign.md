# TextBlock Seamless Writing Experience - TipTap Implementation

## Overview

Redesign TextBlock using TipTap editor to create a seamless, WYSIWYG writing experience with live markdown preview. The goal is to make writing feel natural and inspiring, like Notion or Typora.

## Current State Analysis

### Current Implementation (`src/components/blocks/TextBlock.jsx`)
- **Mode switching**: Click to edit → textarea → click out to save
- **Visual container**: `bg-dark-secondary/50` background, visible box
- **Typography**: 16-18px font, 1.58 line height
- **No live preview**: Raw markdown shown (`**bold**` not **bold**)

### Why TipTap?
- Built on ProseMirror (battle-tested, used by Notion, NYTimes)
- Excellent React integration
- Headless - full styling control
- Extensions for markdown, keyboard shortcuts, etc.
- Active community, great documentation

## Desired End State

After implementation:
- True WYSIWYG editing with live markdown formatting
- No visible container - text flows naturally
- 18px+ font, 1.75 line height
- Seamless - always editable, no mode switching
- All existing features preserved (slash commands, tags, links)

## What We're NOT Doing

- Not changing other block types (CodeBlock, HeadingBlock, etc.)
- Not modifying the save mechanism logic (still uses onUpdate/onBlur)
- Not changing mobile-specific behavior (Phase 4)
- Not adding new markdown features beyond current support

---

## Phase 1: Install TipTap & Create Base Editor

### Overview
Install TipTap packages and create a minimal working editor component.

### Changes Required:

#### 1. Install TipTap Packages
**Command**:
```bash
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-placeholder @tiptap/extension-link @tiptap/extension-underline @tiptap/extension-typography
```

**Packages**:
| Package | Purpose |
|---------|---------|
| `@tiptap/react` | React bindings |
| `@tiptap/pm` | ProseMirror core |
| `@tiptap/starter-kit` | Bold, italic, strike, code, headings, lists, etc. |
| `@tiptap/extension-placeholder` | Empty state placeholder |
| `@tiptap/extension-link` | Clickable links |
| `@tiptap/extension-underline` | Underline support |
| `@tiptap/extension-typography` | Smart quotes, dashes |

#### 2. Create TipTap Editor Component
**File**: `src/components/blocks/TipTapEditor.jsx` (new file)

```jsx
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Typography from '@tiptap/extension-typography';
import { useEffect, useCallback } from 'react';

export default function TipTapEditor({
  content,
  onUpdate,
  onBlur,
  placeholder = '',
  editable = true,
  className = '',
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable heading - we have HeadingBlock for that
        heading: false,
        // Configure other extensions
        bold: true,
        italic: true,
        strike: true,
        code: true,
        codeBlock: false, // We have CodeBlock for that
        bulletList: true,
        orderedList: true,
        blockquote: true,
        horizontalRule: true,
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
      Link.configure({
        openOnClick: true,
        HTMLAttributes: {
          class: 'text-accent-green hover:text-accent-green/80 underline',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      Underline,
      Typography,
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onUpdate?.(html);
    },
    onBlur: ({ editor }) => {
      onBlur?.(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: className,
      },
    },
  });

  // Update content when prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || '');
    }
  }, [content, editor]);

  // Cleanup
  useEffect(() => {
    return () => {
      editor?.destroy();
    };
  }, [editor]);

  return <EditorContent editor={editor} />;
}
```

#### 3. Create TipTap Styles
**File**: `src/styles/tiptap.css` (new file)

```css
/* TipTap Editor Styles */

.tiptap-editor {
  /* Typography */
  font-size: var(--step-writing, 1.125rem);
  line-height: var(--line-height-writing, 1.75);
  color: var(--text-primary);

  /* Remove container feel */
  background: transparent;
  padding: 0.5rem 0;

  /* Focus state */
  outline: none;
}

/* Placeholder */
.tiptap-editor p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  color: var(--text-secondary);
  opacity: 0.3;
  font-style: italic;
  pointer-events: none;
  float: left;
  height: 0;
}

/* Inline code */
.tiptap-editor code {
  background: rgba(var(--dark-secondary-rgb), 0.5);
  color: var(--accent-green);
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-family: var(--font-mono);
  font-size: 0.875em;
}

/* Bold */
.tiptap-editor strong {
  font-weight: 600;
  color: var(--text-primary);
}

/* Italic */
.tiptap-editor em {
  font-style: italic;
}

/* Strikethrough */
.tiptap-editor s {
  text-decoration: line-through;
  opacity: 0.6;
}

/* Links */
.tiptap-editor a {
  color: var(--accent-green);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.tiptap-editor a:hover {
  opacity: 0.8;
}

/* Lists */
.tiptap-editor ul,
.tiptap-editor ol {
  padding-left: 1.5rem;
  margin: 0.5rem 0;
}

.tiptap-editor ul {
  list-style-type: disc;
}

.tiptap-editor ol {
  list-style-type: decimal;
}

.tiptap-editor li {
  margin: 0.25rem 0;
}

/* Blockquote */
.tiptap-editor blockquote {
  border-left: 3px solid var(--accent-green);
  padding-left: 1rem;
  margin: 0.5rem 0;
  opacity: 0.9;
  font-style: italic;
}

/* Horizontal rule */
.tiptap-editor hr {
  border: none;
  border-top: 1px solid var(--dark-secondary);
  margin: 1rem 0;
}

/* Paragraph spacing */
.tiptap-editor p {
  margin: 0;
}

.tiptap-editor p + p {
  margin-top: 0.75rem;
}
```

#### 4. Import Styles
**File**: `src/styles/index.css`
**Add at end**:
```css
@import './tiptap.css';
```

### Success Criteria:

#### Automated Verification:
- [ ] Dependencies install: `npm install` completes without errors
- [ ] Build passes: `npm run build`
- [ ] Lint passes: `npm run lint`

#### Manual Verification:
- [ ] TipTapEditor component renders without errors
- [ ] Can type text in the editor
- [ ] Placeholder shows when empty
- [ ] Basic formatting works (bold, italic)

---

## Phase 2: Integrate TipTap into TextBlock

### Overview
Replace the textarea in TextBlock with TipTapEditor while preserving all existing functionality.

### Changes Required:

#### 1. Update TextBlock Component
**File**: `src/components/blocks/TextBlock.jsx`
**Changes**: Replace textarea with TipTapEditor, convert markdown ↔ HTML

```jsx
// Add imports at top
import TipTapEditor from './TipTapEditor';
import { markdownToHtml, htmlToMarkdown } from '../../utils/markdownConverter';

// Replace the textarea in edit mode (around line 672-727) with:
<TipTapEditor
  content={markdownToHtml(content)}
  onUpdate={(html) => {
    const markdown = htmlToMarkdown(html);
    setContent(markdown);
    setHasContentChanged(true);
  }}
  onBlur={(html) => {
    const markdown = htmlToMarkdown(html);
    setContent(markdown);
    handleSave();
  }}
  placeholder="Start writing..."
  className="tiptap-editor"
/>
```

#### 2. Create Markdown ↔ HTML Converter
**File**: `src/utils/markdownConverter.js` (new file)

```javascript
/**
 * Convert Markdown to HTML for TipTap
 * Only handles the subset we support
 */
export function markdownToHtml(markdown) {
  if (!markdown) return '';

  let html = markdown;

  // Bold: **text** or __text__
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');

  // Italic: *text* or _text_ (not inside bold)
  html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
  html = html.replace(/(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g, '<em>$1</em>');

  // Strikethrough: ~~text~~
  html = html.replace(/~~(.+?)~~/g, '<s>$1</s>');

  // Inline code: `code`
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Links: [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Unordered lists: - item or * item
  html = html.replace(/^[-*]\s+(.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

  // Ordered lists: 1. item
  html = html.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');

  // Blockquote: > text
  html = html.replace(/^>\s+(.+)$/gm, '<blockquote><p>$1</p></blockquote>');

  // Horizontal rule: ---
  html = html.replace(/^---$/gm, '<hr>');

  // Paragraphs: wrap remaining lines
  const lines = html.split('\n');
  html = lines.map(line => {
    if (line.trim() === '') return '';
    if (line.startsWith('<')) return line; // Already HTML
    return `<p>${line}</p>`;
  }).join('');

  return html;
}

/**
 * Convert HTML back to Markdown for storage
 */
export function htmlToMarkdown(html) {
  if (!html) return '';

  let markdown = html;

  // Remove wrapper divs/paragraphs but preserve content
  markdown = markdown.replace(/<p>/g, '');
  markdown = markdown.replace(/<\/p>/g, '\n');

  // Bold
  markdown = markdown.replace(/<strong>(.+?)<\/strong>/g, '**$1**');
  markdown = markdown.replace(/<b>(.+?)<\/b>/g, '**$1**');

  // Italic
  markdown = markdown.replace(/<em>(.+?)<\/em>/g, '*$1*');
  markdown = markdown.replace(/<i>(.+?)<\/i>/g, '*$1*');

  // Strikethrough
  markdown = markdown.replace(/<s>(.+?)<\/s>/g, '~~$1~~');
  markdown = markdown.replace(/<strike>(.+?)<\/strike>/g, '~~$1~~');
  markdown = markdown.replace(/<del>(.+?)<\/del>/g, '~~$1~~');

  // Code
  markdown = markdown.replace(/<code>(.+?)<\/code>/g, '`$1`');

  // Links
  markdown = markdown.replace(/<a[^>]+href="([^"]+)"[^>]*>(.+?)<\/a>/g, '[$2]($1)');

  // Lists
  markdown = markdown.replace(/<ul>/g, '');
  markdown = markdown.replace(/<\/ul>/g, '');
  markdown = markdown.replace(/<ol>/g, '');
  markdown = markdown.replace(/<\/ol>/g, '');
  markdown = markdown.replace(/<li>(.+?)<\/li>/g, '- $1\n');

  // Blockquote
  markdown = markdown.replace(/<blockquote><p>(.+?)<\/p><\/blockquote>/g, '> $1\n');
  markdown = markdown.replace(/<blockquote>(.+?)<\/blockquote>/g, '> $1\n');

  // Horizontal rule
  markdown = markdown.replace(/<hr\s*\/?>/g, '---\n');

  // Clean up
  markdown = markdown.replace(/<br\s*\/?>/g, '\n');
  markdown = markdown.replace(/\n{3,}/g, '\n\n'); // Max 2 newlines
  markdown = markdown.trim();

  return markdown;
}
```

#### 3. Remove Old Edit Mode UI
**File**: `src/components/blocks/TextBlock.jsx`
**Changes**:
- Remove the `isEditing` state toggle (always show TipTap)
- Remove the separate view mode rendering
- Keep the collapse functionality for long content

### Success Criteria:

#### Automated Verification:
- [ ] Build passes: `npm run build`
- [ ] No console errors
- [ ] Lint passes: `npm run lint`

#### Manual Verification:
- [ ] TextBlock renders with TipTap editor
- [ ] Typing shows live formatted text
- [ ] `**bold**` becomes **bold** as you type
- [ ] Existing content loads correctly
- [ ] Changes save on blur
- [ ] Slash commands still work (`/code`, `/table`, etc.)

---

## Phase 3: Keyboard Shortcuts & Polish

### Overview
Add keyboard shortcuts and refine the editing experience.

### Changes Required:

#### 1. Add Keyboard Shortcuts to TipTapEditor
**File**: `src/components/blocks/TipTapEditor.jsx`
**Add to extensions array**:

```jsx
import { Extension } from '@tiptap/core';

// Custom extension for keyboard shortcuts
const KeyboardShortcuts = Extension.create({
  name: 'keyboardShortcuts',

  addKeyboardShortcuts() {
    return {
      'Mod-b': () => this.editor.chain().focus().toggleBold().run(),
      'Mod-i': () => this.editor.chain().focus().toggleItalic().run(),
      'Mod-u': () => this.editor.chain().focus().toggleUnderline().run(),
      'Mod-Shift-s': () => this.editor.chain().focus().toggleStrike().run(),
      'Mod-`': () => this.editor.chain().focus().toggleCode().run(),
      'Mod-k': () => {
        const url = window.prompt('Enter URL:');
        if (url) {
          this.editor.chain().focus().setLink({ href: url }).run();
        }
        return true;
      },
    };
  },
});
```

#### 2. Add Focus Indicator
**File**: `src/styles/tiptap.css`
**Add**:

```css
/* Subtle focus indicator */
.tiptap-editor:focus-within {
  /* Subtle left border when focused */
  border-left: 2px solid var(--accent-green);
  padding-left: 0.75rem;
  margin-left: -0.75rem;
  transition: all 0.15s ease;
}
```

#### 3. Smooth Transitions
**File**: `src/styles/tiptap.css`
**Add**:

```css
.tiptap-editor {
  transition: border-color 0.15s ease, padding 0.15s ease;
}

/* Smooth formatting transitions */
.tiptap-editor strong,
.tiptap-editor em,
.tiptap-editor code {
  transition: all 0.1s ease;
}
```

### Success Criteria:

#### Automated Verification:
- [ ] Build passes
- [ ] No accessibility warnings

#### Manual Verification:
- [ ] Cmd/Ctrl+B toggles bold
- [ ] Cmd/Ctrl+I toggles italic
- [ ] Cmd/Ctrl+K inserts link
- [ ] Focus indicator appears when editing
- [ ] Transitions feel smooth

---

## Phase 4: Preserve Existing Features

### Overview
Ensure all existing TextBlock features work with TipTap.

### Features to Preserve:

#### 1. Slash Commands
- `/code` → convert to CodeBlock
- `/table` → convert to TableBlock
- `/ai` → convert to AIBlock
- etc.

**Implementation**: Add TipTap extension that listens for `/` and shows command menu.

#### 2. Document Links `[[Document Name]]`
- Parse and render as clickable links
- Integrate with existing `window.handleDocumentLink`

#### 3. Tags `#tagname[text]`
- Extract tags from content
- Display tag chips below content

#### 4. Image Paste
- Intercept paste with image
- Upload to Supabase
- Insert as ImageBlock

#### 5. Collapse Long Content
- Keep expand/collapse for 15+ line content

### Success Criteria:

#### Manual Verification:
- [ ] All slash commands work
- [ ] Document links are clickable
- [ ] Tags display correctly
- [ ] Image paste creates ImageBlock
- [ ] Long content can be collapsed

---

## Phase 5: Typography & Visual Polish

### Overview
Final visual refinements for the writing experience.

### Changes Required:

#### 1. Update Typography Variables
**File**: `src/styles/typography.css`

```css
/* Add after line 39 */
--line-height-writing: 1.75;
--step-writing: clamp(1.125rem, 1rem + 0.5vw, 1.25rem);
```

#### 2. Fine-tune TipTap Styles
- Adjust spacing
- Perfect the placeholder
- Refine list indentation
- Polish blockquote styling

### Success Criteria:

#### Manual Verification:
- [ ] Font feels comfortable to read/write
- [ ] Line spacing aids readability
- [ ] Overall feel is "clean and inspiring"
- [ ] Matches the design intent

---

## Testing Strategy

### Unit Tests:
- `markdownToHtml` converts correctly
- `htmlToMarkdown` converts correctly
- Round-trip conversion preserves content

### Integration Tests:
- TextBlock saves content correctly
- Content persists after refresh
- Multi-block documents work

### Manual Testing Steps:
1. Create new document, add text block
2. Type `**bold**` → verify shows bold
3. Type a list with `-` → verify bullet points
4. Press Cmd+B → verify bold toggles
5. Type `/code` → verify converts to CodeBlock
6. Paste an image → verify ImageBlock created
7. Add 20 lines → verify collapse button appears
8. Refresh page → verify content persisted
9. Test on mobile device

---

## Performance Considerations

- TipTap is built on ProseMirror - very performant
- Debounce `onUpdate` to prevent excessive saves
- Memoize markdown ↔ HTML conversions
- Lazy load TipTap for initial bundle size

---

## Rollback Plan

If issues arise:
1. Keep old TextBlock as `TextBlockLegacy.jsx`
2. Feature flag to switch between old/new
3. Can revert by changing import in `Block.jsx`

---

## Dependencies to Install

```bash
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-placeholder @tiptap/extension-link @tiptap/extension-underline @tiptap/extension-typography
```

**Bundle size impact**: ~50-80KB gzipped (ProseMirror + TipTap)

---

## Timeline Estimate

| Phase | Description | Complexity |
|-------|-------------|------------|
| 1 | Install TipTap, create base editor | Low |
| 2 | Integrate into TextBlock | Medium |
| 3 | Keyboard shortcuts & polish | Low |
| 4 | Preserve existing features | Medium-High |
| 5 | Typography & visual polish | Low |

---

## References

- TipTap Documentation: https://tiptap.dev/docs
- ProseMirror Guide: https://prosemirror.net/docs/guide/
- Current TextBlock: `src/components/blocks/TextBlock.jsx`
- Markdown Parser: `src/utils/parseMarkdown.jsx`
- Typography: `src/styles/typography.css`

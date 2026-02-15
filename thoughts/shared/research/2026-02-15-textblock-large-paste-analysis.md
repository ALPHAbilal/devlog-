---
date: 2026-02-15T12:00:00+05:00
researcher: Claude
git_commit: 7c7349a
branch: main
repository: devlog-
topic: "Why large text pastes fail in TextBlock"
tags: [research, codebase, textblock, paste, tiptap, performance]
status: complete
last_updated: 2026-02-15
last_updated_by: Claude
---

# Research: Why Large Text Pastes Fail in TextBlock

**Date**: 2026-02-15
**Researcher**: Claude
**Git Commit**: 7c7349a
**Branch**: main
**Repository**: devlog-

## Research Question
Why doesn't pasting very large text (mix of code and text) into TextBlock work successfully? Are there constraints or limits?

## Summary

**There are NO explicit text length limits** in the TextBlock component or anywhere in the content pipeline. The paste failure for large text is caused by **performance bottlenecks**, not constraints:

1. **Synchronous regex processing**: 35+ sequential regex passes in markdown converter
2. **No debounce on TipTap updates**: Every keystroke/paste triggers full conversion
3. **Main thread blocking**: Large content blocks the UI during conversion
4. **No error handling**: Paste/conversion failures are silent

## Detailed Findings

### 1. No Explicit Size Limits

| Resource | Limit | Notes |
|----------|-------|-------|
| Block content | **None** | No maxLength in TextBlock or TipTap |
| Document title | 1000 chars | Only title, not content |
| Search query | 100 chars | Only search, not content |
| Database (PostgreSQL text) | 1GB theoretical | Effectively unlimited |
| RxDB content field | No max | `type: ['string', 'object']` |

**Code evidence** (`src/components/blocks/TextBlock.jsx`):
- No `maxLength` prop on any input
- No content size validation
- Only `MAX_LINES_BEFORE_COLLAPSE = 15` for UI display (not a limit)

**Code evidence** (`src/components/blocks/TipTapEditor.jsx`):
- No `limit` extension installed
- No character/word count restrictions
- No content size checks

### 2. The Real Problem: Synchronous Converter Performance

**Location**: `src/shared/lib/markdown/converter.ts`

#### htmlToMarkdown() - 22+ regex passes
```typescript
// Lines 144-203 - Every paste triggers ALL of these:
markdown.replace(/<p>/g, '')           // 1
markdown.replace(/<\/p>/g, '\n\n')     // 2
markdown.replace(/<strong>(.+?)<\/strong>/g, '**$1**')  // 3
markdown.replace(/<b>(.+?)<\/b>/g, '**$1**')            // 4
// ... 18 more regex replacements
```

#### markdownToHtml() - 13+ regex passes + line iteration
```typescript
// Lines 19-22 - Entity escaping
html.replace(/&/g, '&amp;')
html.replace(/</g, '&lt;')
html.replace(/>/g, '&gt;')

// Lines 35-53 - Formatting with lookbehind (expensive)
html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')

// Lines 57-124 - Line-by-line iteration
const lines = html.split('\n');  // Creates array of ALL lines
for (const line of lines) { ... }
html = processedLines.join('');  // Rebuilds entire string
```

**Performance impact**:
- 35+ string allocations per conversion
- O(n * r) complexity where n = content length, r = regex count
- **100KB paste = ~3.5MB temporary allocations**
- All synchronous - blocks main thread

### 3. No Debounce on TipTap Updates

**Location**: `src/components/blocks/TipTapEditor.jsx:72-75`

```javascript
onUpdate: ({ editor }) => {
  const html = editor.getHTML();
  onUpdate?.(html);  // Fires IMMEDIATELY, no debounce
},
```

**Data flow on paste**:
```
1. User pastes large text
   ↓
2. TipTap processes (browser may already struggle)
   ↓
3. onUpdate fires IMMEDIATELY
   ↓
4. handleEditorUpdate in TextBlock.jsx:115-155
   ↓
5. htmlToMarkdown(html) - 22+ regex passes, SYNCHRONOUS
   ↓
6. setContent(markdown) - React state update
7. setHtmlContent(html) - React state update
8. setHasContentChanged(true) - React state update
   ↓
9. Main thread blocked during all of above
```

### 4. No Error Handling Around Paste/Conversion

**TipTap paste handler** (`TipTapEditor.jsx:88-92`):
```javascript
handlePaste: (view, event) => {
  // NO try-catch
  return false;  // Let default handling work
}
```

**Markdown converter** (`converter.ts`):
```javascript
export function htmlToMarkdown(markdown) {
  // NO try-catch around 22+ regex operations
  // Malformed input or regex errors would crash silently
}
```

**TextBlock handleEditorUpdate** (`TextBlock.jsx:115-155`):
```javascript
const handleEditorUpdate = useCallback((html) => {
  // NO try-catch
  const markdown = htmlToMarkdown(html);  // Could fail
  setContent(markdown);
  // ...
}, []);
```

### 5. Paste Handler Only Intercepts Images

**Location**: `src/components/blocks/TextBlock.jsx:180-231`

```javascript
const handlePaste = useCallback(async (e) => {
  const items = e.clipboardData?.items;
  if (!items) return;

  for (const item of items) {
    if (item.type.startsWith('image/')) {
      e.preventDefault();
      // ... handle image upload
    }
  }
  // TEXT PASTES FALL THROUGH - no custom handling
}, [user, onAddBelow]);
```

**Text pastes use default browser + TipTap behavior** - no custom processing, validation, or chunking.

### 6. What Likely Happens With Large Pastes

1. **Browser clipboard processing** - Browser parses large clipboard content
2. **TipTap DOM insertion** - TipTap inserts HTML into ProseMirror document
3. **onUpdate fires** - Full HTML content passed to parent
4. **htmlToMarkdown runs** - 22+ regex passes on entire content
5. **Main thread blocks** - UI freezes for 500ms-5s depending on size
6. **Browser timeout possible** - Script execution timeout could abort
7. **No error shown** - User sees incomplete paste or nothing

## Code References

- `src/components/blocks/TextBlock.jsx:115-155` - handleEditorUpdate (no debounce)
- `src/components/blocks/TextBlock.jsx:180-231` - handlePaste (images only)
- `src/components/blocks/TipTapEditor.jsx:72-75` - onUpdate (no debounce)
- `src/components/blocks/TipTapEditor.jsx:88-92` - handlePaste (passthrough)
- `src/shared/lib/markdown/converter.ts:13-131` - markdownToHtml (13+ regex)
- `src/shared/lib/markdown/converter.ts:138-209` - htmlToMarkdown (22+ regex)
- `src/utils/sanitization.ts` - No content length limits

## Architecture Documentation

### Current Paste Flow
```
Clipboard
    ↓
Browser native paste event
    ↓
TextBlock.handlePaste (only intercepts images)
    ↓
TipTap default paste handling (inserts HTML)
    ↓
TipTap.onUpdate (immediate, no debounce)
    ↓
TextBlock.handleEditorUpdate
    ↓
htmlToMarkdown() - 22 regex passes, SYNCHRONOUS
    ↓
3x React state updates
    ↓
Save on blur (100ms debounce)
```

### Debounce Points (Where They Exist)
| Layer | Debounce | Value |
|-------|----------|-------|
| TipTap onUpdate | **None** | Immediate |
| handleEditorUpdate | **None** | Immediate |
| Save on blur | Yes | 100ms |
| SmartSync idle | Yes | 2s |
| SmartSync default | Yes | 5s |

## Historical Context (from thoughts/)

No previous research documents about paste performance were found.

## Related Research

None found in thoughts/shared/research/

## Open Questions

1. **What is the exact size threshold?** - Need profiling to determine at what content size the conversion becomes problematic
2. **Is TipTap itself bottlenecking?** - Need to isolate TipTap vs converter performance
3. **Are there browser-specific issues?** - Different browsers may handle large pastes differently
4. **Would Web Workers help?** - Moving converter to worker thread could unblock UI

## Potential Solutions (For Reference)

1. **Add debounce to onUpdate** - Prevent rapid-fire conversions
2. **Move converter to Web Worker** - Unblock main thread
3. **Chunk large pastes** - Process in smaller pieces
4. **Add try-catch** - Graceful error handling
5. **Add loading indicator** - Show user something is happening
6. **Optimize regex** - Combine patterns, avoid lookbehind

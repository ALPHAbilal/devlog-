---
date: 2025-12-24
component: SidebarTreeItemEnhanced
issue_type: visual
status: resolved
root_cause: Radix ScrollArea internal div with display:table expanding beyond viewport
fix_file: src/index.css
---

# Debug: Sidebar - Text Overflow & Three-Dots Hidden

## Issue Reported
Sidebar folder/document text doesn't truncate at sidebar border. Text goes beyond the sidebar edge, causing three-dots menu and count badges to be hidden/clipped.

## Browser Data Collected

### Width Chain Trace (the breakthrough):
```
229px - text (truncate class)
329px - tree item wrapper (w-full min-w-0 overflow-hidden)
353px - content container
353px - DIV ← NO CLASS! Radix internal
278px - ScrollArea Viewport ← correct
278px - ScrollArea Root ← correct
279px - Sidebar panel (280px) ← correct
```

**Key finding**: Element with NO CLASS (Radix internal div) was 353px while parent was 278px.

## Code Analysis
- `scroll-area.jsx` - Radix ScrollArea Viewport wraps content in internal div
- Radix uses `display: table` and `min-width: 100%` on internal div
- This causes content to expand to fit rather than constrain
- All our `overflow-hidden`, `min-w-0`, `truncate` classes were on the WRONG layer

## Root Cause
Radix ScrollArea creates a hidden internal `<div>` inside the Viewport with `display: table` styling. This div expands to fit its content instead of respecting the parent's width constraint. Since it has no CSS class, we couldn't target it with Tailwind classes.

## Fix Applied

### Primary fix (src/index.css):
```css
/* Fix Radix ScrollArea internal div that expands beyond viewport */
[data-radix-scroll-area-viewport] > div {
  display: block !important;
  max-width: 100% !important;
}
```

### Secondary fixes (alignment):
- `ExplorerView.jsx`: Changed `pr-4` to `pr-1` on content containers
- `SidebarTreeItemEnhanced.jsx`: Changed `paddingRight: '8px'` to `'2px'`
- `SidebarTreeItemEnhanced.jsx`: Removed `ml-1` from three-dots button

## Verification
- Text now truncates properly within sidebar bounds
- Three-dots button visible on hover
- Count badges visible
- Alignment closer to sidebar edge

## Lesson Learned
**The Invisible Layer Principle**: When fixes don't work after 2 attempts, STOP adding CSS classes. The problem is likely in a hidden library element with no class. Trace the actual DOM widths to find the invisible culprit.

## Debug Script Used
```javascript
let el = document.querySelector('.truncate');
let chain = [];
while (el && el !== document.body) {
  const w = el.getBoundingClientRect().width;
  chain.push(w.toFixed(0) + 'px - ' + (el.className?.slice(0,40) || el.tagName));
  el = el.parentElement;
}
chain.forEach(c => console.log(c));
```

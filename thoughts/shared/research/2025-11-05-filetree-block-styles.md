---
date: 2025-11-05T10:32:30+01:00
researcher: Claude Code
git_commit: f83567524863027224e86db3b7f3f661eaf8b0c8
branch: main
repository: devlog-
topic: "FileTreeBlock Component: Exact Styles and Measurements"
tags: [research, codebase, filetree, styles, measurements, tailwind]
status: complete
last_updated: 2025-11-05
last_updated_by: Claude Code
---

# Research: FileTreeBlock Component Exact Styles and Measurements

**Date**: 2025-11-05T10:32:30+01:00
**Researcher**: Claude Code
**Git Commit**: f83567524863027224e86db3b7f3f661eaf8b0c8
**Branch**: main
**Repository**: devlog-

## Research Question

Document the exact styles and measurements of the FileTreeBlock component, including all spacing values, colors, font sizes, icon dimensions, and layout properties.

## Summary

The FileTreeBlock component (`src/components/blocks/FileTreeBlock.jsx`) uses **100% Tailwind CSS** utility classes with no dedicated CSS file. All styling is inline via className attributes, with some dynamic inline styles for tree depth indentation. The component consists of three main parts: FileContentEditor modal, TreeNode recursive component, and the main FileTreeBlock wrapper.

## Color System

From `tailwind.config.js`:

```
dark-primary:     #0a1628
dark-secondary:   #1e3a5f
accent-green:     #10b981
text-primary:     #e0e7ff
text-secondary:   #94a3b8
```

### Color Usage Patterns

- Backgrounds: `dark-primary/50`, `dark-secondary/20`, `dark-secondary/30`, `dark-secondary/50`
- Text: `text-primary`, `text-secondary/50`, `text-secondary/60`
- Accents: `accent-green`, `accent-green/50`, `accent-green/60`, `accent-green/90`
- Alerts: `text-red-400` (#f87171), `text-orange-400` (#fb923c)

## Spacing Measurements

### Hierarchical Tree Indentation

Dynamic calculation based on tree depth:
```
Formula: level * 20 + 8 (pixels)
- Level 0: 8px
- Level 1: 28px
- Level 2: 48px
- Level 3: 68px
```

### Gap Spacing

```
gap-1  = 4px   (0.25rem) - Action button groups
gap-2  = 8px   (0.5rem)  - Most flex containers, node elements
gap-3  = 12px  (0.75rem) - Modal header sections
```

### Padding Values

```
p-1    = 4px   (0.25rem) - Small action buttons
p-1.5  = 6px   (0.375rem) - Header action buttons
p-2    = 8px   (0.5rem)  - Node containers, modal buttons
p-4    = 16px  (1rem)    - Modal sections, main container
p-8    = 32px  (2rem)    - Modal backdrop
px-2   = 8px horizontal
py-1   = 4px vertical
py-1.5 = 6px vertical
py-12  = 48px vertical (empty state)
```

### Margin Values

```
mb-1  = 4px   (0.25rem)
mb-2  = 8px   (0.5rem)
mb-4  = 16px  (1rem)
ml-2  = 8px   (0.5rem)
mt-1  = 4px   (0.25rem)
```

## Icon Dimensions

```
14px - Action buttons (Edit, Add, Delete), Confirm button
16px - Folder/file icons, Chevrons, Header buttons
18px - Header folder icon (main block header)
20px - Modal header icons, Close button
32px - Empty state icon
```

## Typography

### Font Sizes

```
text-xs  = 0.75rem (12px), line-height: 1rem
text-sm  = 0.875rem (14px), line-height: 1.25rem
(base)   = 1rem (16px) - default
```

### Font Families

```
font-mono = JetBrains Mono, SF Mono, Monaco, Cascadia Code, Roboto Mono, monospace
font-medium = font-weight: 500
```

## Component Styles

### FileTreeBlock Main Container

```css
className: "bg-dark-secondary/20 rounded-lg p-4"
- background: rgba(30, 58, 95, 0.2)
- border-radius: 8px
- padding: 16px
```

### Header Section

```css
className: "flex items-center justify-between mb-4"
- display: flex
- align-items: center
- justify-content: space-between
- margin-bottom: 16px
```

### TreeNode Container

```css
Base: "flex items-center gap-2 py-1.5 px-2 rounded-lg group transition-all duration-200 relative"
- display: flex
- align-items: center
- gap: 8px
- padding: 6px 8px (vertical horizontal)
- border-radius: 8px
- transition: all 200ms
- position: relative

Hover: "hover:bg-dark-secondary/30"
- hover background: rgba(30, 58, 95, 0.3)

Dragging: "opacity-50"
- opacity: 0.5

Drag Over (inside): "bg-accent-green/20 ring-2 ring-accent-green/40"
- background: rgba(16, 185, 129, 0.2)
- box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.4)
```

Dynamic padding based on tree level:
```javascript
style={{ paddingLeft: `${level * 20 + 8}px` }}
```

### Drop Indicators

```css
className: "absolute left-0 right-0 top-0 h-0.5 bg-accent-green z-10"
or: "absolute left-0 right-0 bottom-0 h-0.5 bg-accent-green z-10"
- position: absolute
- left: 0, right: 0
- top: 0 (before) or bottom: 0 (after)
- height: 2px
- background: #10b981
- z-index: 10
```

Dynamic margin for nested levels:
```javascript
style={{ marginLeft: `${level * 20 + 8}px` }}
```

### Drag Handle

```css
className: "text-text-secondary/30 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
- color: rgba(148, 163, 184, 0.3)
- cursor: grab (active: grabbing)
- opacity: 0 (shows on group hover)
- transition: opacity
```

### Expand/Collapse Button

```css
className: "text-text-secondary/60 hover:text-text-secondary transition-colors"
- color: rgba(148, 163, 184, 0.6)
- hover: #94a3b8
- transition: color properties
```

### Action Buttons

```css
Edit/Add: "p-1 hover:bg-dark-primary/50 rounded text-text-secondary/60 hover:text-accent-green transition-colors"
- padding: 4px
- hover background: rgba(10, 22, 40, 0.5)
- border-radius: 4px
- color: rgba(148, 163, 184, 0.6)
- hover color: #10b981
- transition: colors

Delete: "p-1 hover:bg-dark-primary/50 rounded text-text-secondary/60 hover:text-red-400 transition-colors"
- Same as above
- hover color: #f87171 (red)
```

### Input Field (Edit Mode)

```css
className: "flex-1 bg-dark-primary/50 text-text-primary px-2 py-1 rounded border border-accent-green/30 focus:border-accent-green focus:outline-none"
- flex: 1 1 0%
- background: rgba(10, 22, 40, 0.5)
- color: #e0e7ff
- padding: 4px 8px
- border-radius: 4px
- border: 1px solid rgba(16, 185, 129, 0.3)
- focus border: #10b981
- outline: none on focus
```

## FileContentEditor Modal

### Modal Backdrop

```css
Inline style: { position: 'fixed', zIndex: 9999, top: 0, left: 0, right: 0, bottom: 0 }
className: "fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-8"
- position: fixed
- inset: 0
- background: rgba(0, 0, 0, 0.8)
- backdrop-filter: blur(4px)
- display: flex
- align-items: center
- justify-content: center
- padding: 32px
- z-index: 9999
```

### Modal Container

```css
Inline style: { position: 'relative', zIndex: 10000, maxHeight: '90vh' }
className: "bg-dark-secondary rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
- background: #1e3a5f
- border-radius: 12px
- box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25)
- width: 100%
- max-width: 896px
- max-height: 90vh
- display: flex
- flex-direction: column
- position: relative
- z-index: 10000
```

### Modal Header

```css
className: "flex items-center justify-between p-4 border-b border-dark-primary/50"
- display: flex
- align-items: center
- justify-content: space-between
- padding: 16px
- border-bottom: 1px solid rgba(10, 22, 40, 0.5)
```

### Language Badge

```css
className: "text-xs bg-dark-primary/50 text-text-secondary px-2 py-1 rounded"
- font-size: 12px, line-height: 16px
- background: rgba(10, 22, 40, 0.5)
- color: #94a3b8
- padding: 4px 8px
- border-radius: 4px
```

### Save Button

```css
className: "px-4 py-2 bg-accent-green text-dark-primary font-medium rounded-lg hover:bg-accent-green/90 transition-colors flex items-center gap-2"
- padding: 8px 16px
- background: #10b981
- color: #0a1628
- font-weight: 500
- border-radius: 8px
- hover background: rgba(16, 185, 129, 0.9)
- transition: colors
- display: flex
- align-items: center
- gap: 8px
```

### Textarea Editor

```css
Inline style: { minHeight: '300px' }
className: "w-full bg-dark-primary/50 text-text-primary p-4 rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent-green/50 min-h-[300px]"
- width: 100%
- background: rgba(10, 22, 40, 0.5)
- color: #e0e7ff
- padding: 16px
- border-radius: 8px
- font-family: monospace
- font-size: 14px
- resize: none
- outline: none on focus
- focus ring: 2px rgba(16, 185, 129, 0.5)
- min-height: 300px
```

### Preview Code Block

```css
className: "text-sm font-mono overflow-x-auto"
- font-size: 14px
- font-family: monospace
- overflow-x: auto
```

### Line Numbers (Preview)

```css
className: "inline-block w-12 text-text-secondary/50 text-right pr-4 select-none"
- display: inline-block
- width: 48px
- color: rgba(148, 163, 184, 0.5)
- text-align: right
- padding-right: 16px
- user-select: none
```

## Empty State

```css
Container: "text-center py-12 text-text-secondary/50"
- text-align: center
- padding: 48px vertical
- color: rgba(148, 163, 184, 0.5)

Icon: size={32} className="mx-auto mb-2 opacity-30"
- width/height: 32px
- margin: 0 auto
- margin-bottom: 8px
- opacity: 0.3

Text: className="text-sm"
- font-size: 14px
```

## Border Radius Values

```
rounded     = 4px   (0.25rem) - Small elements, inputs
rounded-lg  = 8px   (0.5rem)  - Containers, buttons
rounded-xl  = 12px  (0.75rem) - Modal container
```

## Transition Properties

```
transition-colors   - Transitions: color, background-color, border-color, text-decoration-color, fill, stroke
transition-opacity  - Transitions: opacity only
transition-all      - Transitions: all properties
duration-200        - 200ms duration
```

## Z-Index Layering

```
10     - Drop indicators
9999   - Modal backdrop
10000  - Modal container
```

## Code References

- `src/components/blocks/FileTreeBlock.jsx:7-186` - FileContentEditor modal
- `src/components/blocks/FileTreeBlock.jsx:189-442` - TreeNode recursive component
- `src/components/blocks/FileTreeBlock.jsx:444-776` - FileTreeBlock main component
- `tailwind.config.js:142-146` - Color definitions

## Architecture Notes

### Styling Approach
- **100% Tailwind CSS** - No dedicated CSS file
- **Inline styles** for dynamic values (tree depth indentation)
- **Utility-first** design pattern throughout
- **No CSS modules or styled-components**

### Responsive Considerations
- Modal: `max-w-4xl` (896px max width)
- Modal height: `max-h-[90vh]` (90% viewport height)
- Overflow handling: `overflow-auto` on content areas
- Flexible containers: `flex-1` for filling available space

### Accessibility Features
- Cursor feedback: `cursor-grab`, `cursor-text`, `cursor-pointer`
- Focus states: `focus:outline-none`, `focus:ring-2`
- Visual hierarchy through color opacity and size
- Hidden elements revealed on hover: `opacity-0 group-hover:opacity-100`

## Summary

The FileTreeBlock component uses a pure Tailwind CSS approach with exact measurements defined through utility classes. Key measurements include:
- Tree indentation: `level * 20 + 8` pixels
- Standard gaps: 4px, 8px, 12px
- Standard padding: 4px, 6px, 8px, 16px, 32px
- Icon sizes: 14px, 16px, 18px, 20px, 32px
- Border radius: 4px, 8px, 12px
- Modal max width: 896px
- Textarea min height: 300px

All colors use the design system from `tailwind.config.js` with alpha transparency variations for depth and hierarchy.

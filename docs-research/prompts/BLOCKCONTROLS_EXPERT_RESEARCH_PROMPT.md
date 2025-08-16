# Critical Production Issue: BlockControls Not Appearing on Hover in React/Tailwind Application

## Executive Summary
We have a critical production issue where hover controls (BlockControls) are not appearing when hovering over blocks in our React application. This works in some environments but fails in production. We've tried multiple solutions without success and need expert guidance to identify the root cause.

## Technical Context

### Application Stack
- **Frontend**: React 18+ with Vite
- **Styling**: Tailwind CSS + custom CSS
- **Deployment**: GitHub → Vercel pipeline
- **Icons**: Originally Lucide React (now Unicode as fallback)

### Component Structure
```
Block (parent) - has classes: "group block-wrapper relative"
  └── BlockControls (child) - positioned absolutely at "-left-2 top-1"
       └── Buttons (drag handle, more options menu)
```

### Expected Behavior
When hovering over a Block element, the BlockControls should appear on the left side showing:
- Drag handle (vertical dots)
- More options menu (horizontal dots)

### Actual Behavior
- BlockControls remain invisible on hover in production
- Debug mode shows they ARE rendered in DOM but not visible normally
- In debug mode, controls appear VERY CLOSE to the block edge (not -left-2 as designed)

## What We've Discovered

### 1. DOM Inspection Results
Using browser DevTools AI assistant, we found:
- BlockControls ARE in the DOM with class `block-controls absolute -left-2 top-1 flex items-start gap-1`
- Parent has correct classes: `group block-wrapper relative`
- Computed styles show: `opacity: 0`, `pointer-events: none`
- The CSS hover rule should make them visible but doesn't trigger

### 2. Debug Mode Findings
When using `?debug=blockcontrols`:
- Controls become visible with forced styles
- They appear as narrow vertical bars initially
- With expanded debug CSS, we can see the button structure
- **CRITICAL**: Controls appear RIGHT NEXT to block content, not offset left as designed

### 3. CSS Analysis
```css
/* Our CSS rules */
.block-wrapper .block-controls {
  opacity: 0 !important;
  pointer-events: none !important;
}

.group:hover .block-controls,
.block-wrapper:hover .block-controls {
  opacity: 1 !important;
  pointer-events: auto !important;
}
```

### 4. What We've Tried (All Failed)
1. ✗ Removed debug component interfering with opacity
2. ✗ Added !important to all CSS rules
3. ✗ Added both .group:hover and .block-wrapper:hover selectors
4. ✗ Replaced Lucide icons with Unicode (icons now show in debug but hover still broken)
5. ✗ Added min-width to prevent collapse
6. ✗ Forced display: flex on all elements

## Suspicious Findings

### 1. Position Issue
- BlockControls use `absolute -left-2 top-1` (Tailwind classes)
- In debug mode, they appear flush against block, not offset
- This suggests the negative left position isn't working

### 2. Hover Detection Issue  
- Parent has `group` class for Tailwind group-hover
- CSS has hover rules but they don't trigger
- Could be a stacking context or z-index issue

### 3. Production vs Development
- Issue only occurs in production (Vercel deployment)
- Suggests possible:
  - CSS purging/optimization removing critical styles
  - Build process transforming classes incorrectly
  - PostCSS or other processor changing behavior

## Critical Questions for Research

### 1. CSS/Tailwind Issues
- Why would `.group:hover .block-controls` not trigger when hovering the parent?
- Could Tailwind's JIT compiler be purging the negative positioning classes?
- Is there a known issue with `absolute -left-2` in production builds?
- Could the parent's `relative` positioning be failing, making absolute positioning relative to wrong element?

### 2. Stacking Context & Z-Index
- Could a stacking context issue prevent hover detection?
- Is the BlockControls behind another invisible element blocking hover?
- Why do controls appear in different position in debug mode?

### 3. Build/Deployment Issues
- What Vite/Vercel optimizations could break hover selectors?
- Could PostCSS be transforming negative classes incorrectly?
- Is tree-shaking removing necessary CSS?

### 4. Browser Behavior
- Are there known issues with group hover and absolute positioned children?
- Could pointer-events on parent affect hover detection?
- Is there a CSS cascade issue we're missing?

## What We Need

### 1. Root Cause Identification
We need to understand WHY:
- Hover events aren't triggering the CSS rules
- The position appears different in debug mode  
- Production build behaves differently than development

### 2. Solution Approaches
We need strategies for:
- Reliable hover detection in production
- Proper absolute positioning with negative values
- Build configuration to preserve critical CSS

### 3. Debugging Techniques
Advanced methods to:
- Trace hover event propagation
- Verify CSS rule application in production
- Test stacking context issues
- Validate build output

## Code Samples for Testing

### Current HTML Structure (simplified)
```html
<div class="group block-wrapper relative">
  <div class="block-controls absolute -left-2 top-1 flex items-start gap-1">
    <button>⋮⋮</button>
    <button>⋯</button>
  </div>
  <div class="block-content">
    <!-- Actual block content -->
  </div>
</div>
```

### Build Configuration (if relevant)
- Vite config with Tailwind
- PostCSS configuration
- Any CSS optimization settings

## Urgency
This is blocking our production release and affecting all users. We need either:
1. A fix for the current approach
2. A completely different approach that works reliably
3. Understanding of the root cause to prevent similar issues

Please provide:
- Explanation of what's likely causing this
- Specific solutions to try
- Alternative approaches if current architecture is flawed
- Build/deployment configurations to check

Thank you for your expertise in solving this critical issue!
# Critical Production Issue: BlockControls Not Appearing on Hover

## Problem Summary
We have a React component called BlockControls that should appear when hovering over content blocks. It works in development but NOT in production. This is a critical "matter of life" issue.

## Current Situation
1. **HTML Inspection shows**: The block-wrapper divs exist but BlockControls components are NOT in the DOM at all
2. **Multiple failed attempts**:
   - CSS hover pseudo-selectors don't work in production
   - Tailwind classes like `-left-2` get purged in production
   - Vite CSS optimization breaks hover rules
   - JavaScript hover state implementation partially complete but still not working

## Technical Stack
- React 19.1.0
- Vite 6.3.5 (with cssCodeSplit: false, cssMinify: 'lightningcss')
- Tailwind CSS 3.4.17
- Deployment: GitHub/Vercel pipeline
- No local builds (all testing in production)

## Current Implementation

### Block.jsx (Parent Component)
```javascript
const [isHovered, setIsHovered] = useState(false);
const [showMenu, setShowMenu] = useState(false);

<div 
  className="group block-wrapper relative transition-all duration-200"
  onMouseEnter={() => setIsHovered(true)}
  onMouseLeave={() => {
    if (!showMenu) {
      setIsHovered(false);
    }
  }}
>
  <BlockControls
    isVisible={isHovered && !isDragging}
    onMenuToggle={setShowMenu}
    // ... other props
  />
  {/* Block content */}
</div>
```

### BlockControls.jsx (Child Component)
```javascript
// Problem: This returns null when not visible, so nothing renders in DOM
if (!isVisible && !isMobile && !isDebugMode) {
  return null;
}

return (
  <div 
    className="block-controls absolute -left-2 top-1 flex items-start gap-1"
    style={{ 
      opacity: isVisible || isMobile || isDebugMode ? 1 : 0,
      pointerEvents: isVisible || isMobile || isDebugMode ? 'auto' : 'none',
      // ... other styles
    }}
  >
    {/* Drag handle and menu buttons */}
  </div>
);
```

## Key Issues Discovered
1. **BlockControls not in DOM**: The component returns null, so there's nothing to hover over
2. **CSS hover doesn't work**: Production build breaks CSS :hover pseudo-selectors
3. **Tailwind purging**: Negative positioning classes like `-left-2` get removed
4. **Event propagation**: Mouse events might not be firing correctly on the parent div

## Research Questions
1. **What's the most reliable way to implement hover interactions in React for production builds?**
2. **Should we always render BlockControls in the DOM and control visibility with CSS/JS instead of conditional rendering?**
3. **Are there known issues with Vite/Vercel builds breaking hover states or event handlers?**
4. **What's the best practice for hover interactions that need to work across parent/child components?**
5. **Should we use a different approach like:**
   - Intersection Observer API?
   - Mouse position tracking?
   - Always visible on mobile + click to show on desktop?
   - Portal rendering for the controls?

## Constraints
- Must work in production (Vercel deployment)
- Must be mobile-friendly
- Cannot rely on CSS :hover pseudo-selectors (proven unreliable)
- Must support drag-and-drop functionality
- Performance is important (many blocks on page)

## Desired Solution
Please provide:
1. **Root cause analysis** of why hover isn't working in production
2. **Best practice implementation** for reliable hover interactions
3. **Code examples** that will work in production builds
4. **Alternative approaches** if hover is fundamentally unreliable
5. **Mobile-first solution** that works across all devices

## Additional Context
- Users can have many blocks on a page
- BlockControls contains: drag handle, move up/down, duplicate, delete actions
- Controls should appear on hover but stay visible when interacting with them
- Original implementation worked but broke at some point in production

Please provide the most robust, production-ready solution for this critical feature.
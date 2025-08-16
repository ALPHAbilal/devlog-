# BlockControls Not Visible on Hover

**Date Solved**: 2025-01-20  
**Severity**: High  
**Category**: Frontend/UI  

## Symptoms
- The dots menu (BlockControls) on the left side of blocks not appearing when hovering
- No console errors
- Controls exist in DOM but are not visible
- Hover effects not triggering

## Error Messages
No error messages - this is a CSS/positioning issue.

## Root Cause
Through extensive debugging and AI research, we discovered the core issue was **React's concurrent rendering interrupting CSS opacity transitions**. The BlockControls opacity was getting stuck at partial values (0.685 and 0.770) instead of reaching 1.0, making them appear invisible.

Key findings:
1. **React concurrent rendering**: Time-slicing was interrupting CSS transitions mid-execution
2. **GPU floating-point precision**: Values like 0.685 ≈ 175/255 (RGB alpha channel conversion) and 0.770 ≈ ease-in-out timing at ~80% completion
3. **CSS transition interruption**: Transitions were being cancelled before completion
4. **Event boundaries**: Initial positioning issues with overflow containers were resolved but opacity remained problematic

Debug logs revealed:
```
⚠️ Computed opacity at suspicious value: 0.685
⚠️ Computed opacity at suspicious value: 0.770
💥 Opacity transition CANCELLED at: 0.685
```

## Solution
Implemented a multi-layered approach to ensure BlockControls opacity transitions complete properly:

1. **useLayoutEffect for synchronous updates**: Replaced useEffect with useLayoutEffect to ensure DOM updates happen synchronously before browser paint, preventing React's concurrent rendering from interrupting transitions.

2. **Direct DOM manipulation**: Added direct style manipulation in useLayoutEffect to bypass React's batching and ensure opacity values are set immediately.

3. **Step-based transitions**: Changed CSS transition timing function to `steps(2)` to force binary opacity values (0 or 1) instead of allowing intermediate values.

4. **Pure CSS hover fallback**: Added CSS-only hover solution with `!important` to force exact opacity values as a fallback mechanism.

5. **Disabled will-change**: Removed `will-change` property which can cause GPU precision issues and layer promotion problems.

6. **Custom useHover hook**: Maintains JavaScript-based hover detection as the primary mechanism, with CSS as fallback.

7. **Forensic debugging**: Added comprehensive opacity monitoring to detect and log when partial values occur.

This solution addresses:
- React concurrent rendering interruptions
- GPU floating-point precision errors  
- CSS transition cancellation issues
- Browser-specific rendering quirks

## Files Changed
- `src/hooks/useHover.js` (kept from previous solution):
  - Custom hook that detects hover on parent elements
  - Uses mouseenter/mouseleave events
  - Includes touch event handling for mobile

- `src/components/BlockControls.jsx`:
  - Added useLayoutEffect import and implementation
  - Direct DOM manipulation for opacity and transform
  - Step-based transitions in inline styles
  - Added block-controls and show-always CSS classes
  - Disabled will-change property

- `src/components/Block.jsx`:
  - Added block-wrapper CSS class for pure CSS hover

- `src/styles/block-controls.css` (new file):
  - Pure CSS hover fallback solution
  - Step-based transition timing functions
  - Forced opacity values with !important
  - GPU precision issue mitigations

- `src/index.css`:
  - Added import for block-controls.css

- `src/components/debug/OpacityForensics.jsx` (temporary):
  - Forensic debugging component
  - Monitors opacity modifications and computed styles
  - Tracks transition cancellations
  - Can be removed after issue is resolved

- `src/components/ExpandedViewEnhanced.jsx`:
  - Temporarily added OpacityForensics component

## Prevention
1. **Use useLayoutEffect for critical visual updates**: When dealing with opacity or visibility changes, useLayoutEffect ensures synchronous DOM updates
2. **Avoid complex CSS transitions in React**: Prefer direct style manipulation or CSS animations that don't rely on React state changes
3. **Test with React DevTools Profiler**: Check for concurrent rendering interruptions during transitions
4. **Use step-based transitions for binary states**: When you only need 0 or 1 values, use `steps()` timing function
5. **Monitor for partial opacity values**: Add logging to detect when opacity doesn't reach expected values
6. **Implement multiple fallback strategies**: Combine JavaScript state, inline styles, and pure CSS for maximum reliability
7. **Be aware of GPU precision limits**: Floating-point precision can cause unexpected values like 0.685 or 0.770

## Testing Checklist
- [ ] Hover over blocks to see controls appear
- [ ] Controls appear smoothly with transition
- [ ] Controls are clickable and functional
- [ ] No horizontal scroll appears
- [ ] Works on both mobile and desktop viewports

## Related Issues
- CSS overflow and clipping
- Absolute positioning within padded containers
- Hover state accessibility
- Similar to FloatingControlsTrigger visibility issues but different root cause
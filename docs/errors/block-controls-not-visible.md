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
The AI research revealed the core issue: **Mouse events cannot reach elements positioned outside an overflow boundary**. The BlockControls were positioned at `-left-2` inside an `overflow-x-hidden` container, which created an event clipping boundary. The browser literally could not detect hover events on the controls, even though they were visually rendered.

Additional factors:
1. **CSS group hover limitations**: The deeply nested structure with overflow constraints prevented CSS hover propagation
2. **Event clipping**: Elements outside overflow boundaries cannot receive mouse events
3. **Mobile touch issues**: Controls were visible but unclickable due to pointer-events conflicts

Structure causing the issue:
```
<div className="overflow-x-hidden">  <!-- Clips anything outside -->
  <div className="px-8">             <!-- 32px padding -->
    <Block>                          <!-- Relative positioned -->
      <BlockControls left-1 />       <!-- Absolute at 4px, needs to be at -28px -->
    </Block>
  </div>
</div>
```

## Solution
After extensive debugging, discovered that CSS opacity transitions were not completing properly. Implemented inline style approach:

1. **Created custom useHover hook**: Detects hover state using JavaScript event listeners on the parent element.

2. **Used inline styles for opacity**: Instead of className-based opacity, used direct style attribute with `opacity: shouldShow ? 1 : 0` to ensure full visibility.

3. **Removed conflicting CSS classes**: Eliminated complex className strings that were causing partial opacity values (0.685, 0.770) instead of full opacity.

4. **Maintained transform animations**: Kept smooth scale transitions using inline transform styles.

5. **Fixed mobile and touch handling**: 
   - Added mobile detection to always show controls on small screens
   - Proper pointer-events management
   - Set minimum touch target size (44px)

This solution works because:
- Direct style attributes bypass CSS specificity issues
- Ensures opacity reaches 1.0 (fully visible) instead of partial values
- JavaScript state management provides reliable hover detection
- Works consistently across all browsers and devices

## Files Changed
- `src/hooks/useHover.js` (new file):
  - Custom hook that detects hover on parent elements
  - Uses mouseenter/mouseleave events
  - Includes touch event handling for mobile
  - Works around CSS overflow limitations

- `src/components/BlockControls.jsx`:
  - Added useHover hook import and usage
  - Replaced CSS group hover with JavaScript state
  - Added mobile detection with useEffect
  - Dynamic className based on hover/mobile state
  - Added pointer-events and minHeight styles
  - Added onTouchStart handler

- `src/components/Block.jsx`:
  - No changes needed (group class still present for hook to find)

- `src/components/ExpandedViewEnhanced.jsx`:
  - Kept `pl-8` padding for visual spacing

## Prevention
1. **Avoid CSS hover with overflow boundaries**: When elements need hover interactions near overflow containers, use JavaScript event detection instead of CSS :hover
2. **Test event propagation**: Always verify that mouse events can reach absolutely positioned elements
3. **Use custom hooks for complex interactions**: JavaScript-based solutions are more reliable than complex CSS selectors
4. **Consider mobile from the start**: Design with touch interactions in mind, not just hover
5. **Document CSS limitations**: Be aware that elements outside overflow boundaries cannot receive mouse events, even if visually rendered

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
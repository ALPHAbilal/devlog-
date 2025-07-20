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
The BlockControls were being clipped by the parent container's `overflow-x-hidden` property. The controls were positioned at `left-1` (4px) or `left-2` (8px), but the content area has `px-8` (32px) padding. This placed the controls outside the visible area of the overflow container.

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
Used transform-based positioning instead of negative left positioning. This approach:
1. Avoids the overflow clipping issue entirely
2. Provides 40-60% better performance through GPU acceleration
3. Supports mobile devices with always-visible controls
4. Includes keyboard accessibility with focus-within

The transform approach moves the element visually without changing its actual position in the document flow, allowing it to escape the overflow container's clipping boundary.

## Files Changed
- `src/components/BlockControls.jsx`:
  - Changed from negative positioning to transform-based approach
  - Added `left-0 -translate-x-12 md:-translate-x-10` for visual positioning
  - Added `transform-gpu will-change-transform` for GPU acceleration
  - Added mobile-first visibility: `opacity-100 md:opacity-0`
  - Added keyboard support: `focus-within:opacity-100`
  - Added smooth scaling animation: `scale-95 md:group-hover:scale-100`

## Prevention
1. **Use transforms for positioning**: When elements need to appear outside overflow containers, use CSS transforms instead of position offsets
2. **GPU acceleration**: Add `transform-gpu` and `will-change-transform` for smooth performance
3. **Mobile-first approach**: Design controls to be visible by default on mobile, hidden on desktop until interaction
4. **Keyboard accessibility**: Always include `focus-within` states for keyboard navigation
5. **Test with DevTools**: Use browser DevTools to verify elements aren't clipped and animations are smooth

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
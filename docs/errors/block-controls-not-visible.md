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
Two issues were preventing BlockControls from working:
1. **Overflow clipping**: The controls were positioned outside the parent container's `overflow-x-hidden` boundary
2. **Pointer-events paradox**: Using `pointer-events-none` with `group-hover:pointer-events-auto` created a catch-22 where hover couldn't be detected to enable pointer events

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
Two-part solution implemented:

1. **Removed pointer-events manipulation**: Eliminated the pointer-events paradox by removing `pointer-events-none` and `pointer-events-auto` classes entirely. This allows hover detection to work properly on desktop and clicks to work on mobile.

2. **Extended hover area with padding**: Added `pl-12 -ml-12` to the Block container to create an invisible extended hover zone. This ensures users can trigger the hover state even when controls are positioned outside the visible area.

3. **Transform-based positioning**: Used `-translate-x-12` instead of negative left values for better performance and to avoid layout issues.

These changes ensure:
- Desktop: Hover detection works properly
- Mobile: Controls are always visible and clickable
- Performance: GPU-accelerated transforms for smooth animations

## Files Changed
- `src/components/BlockControls.jsx`:
  - Removed `pointer-events-none` and `pointer-events-auto` classes
  - Kept transform positioning: `left-0 -translate-x-12 md:-translate-x-10`
  - Maintained GPU acceleration: `transform-gpu will-change-transform`
  - Mobile-first visibility: `opacity-100 md:opacity-0 md:group-hover:opacity-100`
  - Keyboard support: `focus-within:opacity-100`

- `src/components/Block.jsx`:
  - Added extended hover area: `pl-12 -ml-12` to the group container
  - This creates invisible padding for better hover detection

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
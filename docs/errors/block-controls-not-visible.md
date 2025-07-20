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
Three-part solution implemented:

1. **Repositioned controls inside content bounds**: Changed from `-translate-x-12` to `-left-2` positioning to keep controls within the overflow container's visible area.

2. **Simplified CSS classes**: Converted multi-line template literal to single line to ensure Tailwind properly detects all classes during build.

3. **Added content padding**: Added `pl-8` to block containers in ExpandedViewEnhanced to create space for the controls.

4. **Fixed mobile visibility**: Ensured controls are `opacity-100` by default (mobile) and only hidden on desktop with `md:opacity-0`.

These changes ensure:
- Controls are no longer clipped by overflow-x-hidden
- Hover detection works properly on desktop
- Controls are always visible and clickable on mobile
- Clean single-line classes for reliable Tailwind compilation

## Files Changed
- `src/components/BlockControls.jsx`:
  - Changed positioning from `-translate-x-12` to `-left-2` (inside content bounds)
  - Simplified className to single line for proper Tailwind detection
  - Fixed mobile visibility: `opacity-100 md:opacity-0 md:group-hover:opacity-100`
  - Removed transform positioning in favor of simple left positioning
  - Set fixed z-index: 20

- `src/components/Block.jsx`:
  - Removed `pl-12 -ml-12` padding/margin trick
  - Kept clean group class without modifications

- `src/components/ExpandedViewEnhanced.jsx`:
  - Added `pl-8` to block container divs
  - Creates space for controls to be visible

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
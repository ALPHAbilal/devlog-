# FloatingControlsTrigger Not Appearing

**Date Solved**: 2025-01-20  
**Severity**: High  
**Category**: Frontend/UI  

## Symptoms
- Floating controls button not visible when scrolling
- Controls never appear even in long documents
- No errors in console
- Component renders but remains invisible

## Error Messages
No explicit error messages, but the component would not become visible due to logic issues.

## Root Cause
Multiple issues combined to prevent the component from appearing:

1. **useEffect dependency issue**: The `isVisible` state was included in the dependency array, causing:
   - Effect to re-run every time visibility changed
   - Event listeners being constantly removed and re-added
   - Potential race conditions and missed scroll events

2. **Short document edge case**: Documents without scrollable content would never trigger the scroll threshold

3. **State update in effect**: Direct state updates inside effects can cause stale closures

## Solution
1. **Fixed useEffect dependencies**:
   - Removed `isVisible` from dependency array
   - Only depend on stable props: `scrollThreshold`, `scrollContainerRef`, `debug`

2. **Used functional state updates**:
   ```javascript
   setIsVisible((prevVisible) => {
     if (shouldShow && !prevVisible) {
       setJustAppeared(true);
       setTimeout(() => setJustAppeared(false), 1000);
     }
     return shouldShow;
   });
   ```

3. **Added short document handling**:
   - Check if container has scrollable content
   - Auto-show controls for non-scrollable documents
   - Added 500ms delay to ensure DOM is ready

4. **Added debug mode**:
   - Optional `debug` prop for troubleshooting
   - Logs scroll values and decisions

## Files Changed
- `src/components/FloatingControlsTrigger.jsx`:
  - Added `debug` prop
  - Fixed useEffect dependencies
  - Added functional state updates
  - Added short document detection
  - Added debug logging

## Prevention
1. **useEffect best practices**:
   - Only include stable dependencies
   - Avoid including state that the effect updates
   - Use functional updates when reading previous state

2. **Handle edge cases**:
   - Consider documents with no scroll
   - Test with various content lengths
   - Add fallback behaviors

3. **Debug capabilities**:
   - Build in debug modes for complex UI components
   - Log key decision points
   - Make debugging toggleable

4. **State management**:
   - Use functional updates to avoid stale closures
   - Be careful with state dependencies in effects

## Testing Checklist
- [ ] Long documents (scroll past threshold)
- [ ] Short documents (no scroll needed)
- [ ] Medium documents (just at threshold)
- [ ] Fast scrolling
- [ ] Slow scrolling
- [ ] Page resize scenarios

## Related Issues
- React useEffect pitfalls
- Event listener management
- Scroll-based UI components
- State closure issues
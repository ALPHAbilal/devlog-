# Figma Activity Chart Redesign Implementation Plan

## Overview

Redesign the activity statistics chart on document cards to match the exact Figma design specifications. The new design features a stepped wave visualization that replaces the current vertical bar chart.

**Figma Reference**: https://www.figma.com/design/vm4zgEWrWUCuEbGzuNCuWq/Untitled?node-id=3-1346

## Current State Analysis

### Existing Implementation
- **Location**: `src/components/EntryCardRedesigned.jsx` (lines 186-203)
- **Style**: 30 vertical bars with emerald green gradient
- **Container**: 64px height (`h-16`), 2px gaps between bars
- **Colors**:
  - Normal: `from-emerald-500/40 to-emerald-400/30`
  - Hover: `from-emerald-500/60 to-emerald-400/50`
- **Animation**: Staggered 15ms delay per bar
- **Data**: Last 30 days of daily activity with logarithmic scaling

### Figma Design Specifications

**From Figma Analysis:**
- **Container Dimensions**: 258px width × 80px height
- **Background**: `rgba(255,255,255,0.05)` with 10px border radius
- **Chart Type**: Stepped wave visualization (not vertical bars)
- **Visual Style**:
  - Base wave fills bottom portion
  - Overlay wave creates stepped/mountain effect
  - Single continuous shape (not individual bars)
- **Color**: Blue gradient wave (from Figma screenshot)
- **Position**: 16px gap from title, sits at bottom of card
- **Padding**: 20px all around card

### Key Differences

| Aspect | Current | Figma Design |
|--------|---------|--------------|
| **Chart Type** | Vertical bars | Stepped wave/mountain |
| **Shape** | 30 discrete rectangles | Continuous SVG path |
| **Height** | 64px | 80px |
| **Background** | Transparent | `rgba(255,255,255,0.05)` |
| **Border Radius** | Bars only | Container: 10px |
| **Color** | Emerald green gradient | Blue gradient wave |
| **Gap** | 2px between bars | Continuous wave |
| **Visual Effect** | Vertical growth | Wave amplitude |

## Desired End State

### Success Criteria:

#### Automated Verification:
- [ ] Code compiles without errors: `npm run build`
- [ ] No TypeScript errors: `npm run typecheck`
- [ ] No linting errors: `npm run lint`
- [ ] Component renders without console errors in browser

#### Manual Verification:
- [ ] Chart container is exactly 80px tall with 10px border radius
- [ ] Background is white at 5% opacity
- [ ] Wave visualization matches Figma stepped/mountain style
- [ ] Hover state shows smooth animation
- [ ] Tooltip shows accurate "X days ago: Y edits"
- [ ] Works correctly in VirtualizedGrid compact view
- [ ] Responsive on mobile devices
- [ ] No visual regression on other document card elements

## What We're NOT Doing

- NOT changing the data source (still uses audit log activity data)
- NOT modifying the daily aggregation logic (still 30 days)
- NOT changing card dimensions or title layout
- NOT adding interactivity beyond hover tooltips
- NOT implementing real-time updates (still requires page refresh)

## Implementation Approach

We'll replace the current vertical bar chart with an SVG-based stepped wave visualization that matches the Figma design. The wave will be generated dynamically from the same `activityData` array, maintaining data compatibility while completely changing the visual representation.

**Strategy:**
1. Create new `ActivityWaveChart` component for the wave visualization
2. Generate SVG path from activity data using stepped wave algorithm
3. Update styling to match Figma colors and dimensions
4. Preserve existing data flow and tooltip functionality
5. Apply to both `EntryCardRedesigned` and `VirtualizedGrid`

---

## Phase 1: Create ActivityWaveChart Component

### Overview
Create a new reusable component that converts activity data into an SVG stepped wave visualization matching the Figma design.

### Changes Required:

#### 1. Create new component file
**File**: `src/components/ActivityWaveChart.jsx`
**Purpose**: Isolated, reusable wave chart component

```jsx
import { useMemo } from 'react';

/**
 * ActivityWaveChart - Stepped wave visualization for document activity
 * Matches Figma design: https://www.figma.com/design/vm4zgEWrWUCuEbGzuNCuWq/Untitled?node-id=3-1346
 *
 * @param {Array<number>} data - Array of 30 values (0-100) representing daily activity
 * @param {number} width - Chart width in pixels (default: 258)
 * @param {number} height - Chart height in pixels (default: 80)
 * @param {string} className - Additional CSS classes
 */
export default function ActivityWaveChart({
  data,
  width = 258,
  height = 80,
  className = ''
}) {
  // Generate SVG path for stepped wave
  const wavePath = useMemo(() => {
    if (!data || data.length === 0) return '';

    const points = data.length;
    const stepWidth = width / points;
    const padding = 4; // Padding from edges

    // Create stepped wave path
    let path = `M ${padding},${height}`;

    data.forEach((value, i) => {
      const x = padding + (i * stepWidth);
      const y = height - (value / 100 * (height - padding * 2)) - padding;

      if (i === 0) {
        path += ` L ${x},${y}`;
      } else {
        // Create step effect
        const prevX = padding + ((i - 1) * stepWidth);
        path += ` L ${prevX},${y} L ${x},${y}`;
      }
    });

    // Close the path at bottom right
    path += ` L ${width - padding},${height} Z`;

    return path;
  }, [data, width, height]);

  // Generate overlay wave for depth effect (30% height)
  const overlayPath = useMemo(() => {
    if (!data || data.length === 0) return '';

    const points = data.length;
    const stepWidth = width / points;
    const padding = 4;
    const overlayHeight = height * 0.5; // 50% of total height

    let path = `M ${padding},${height}`;

    data.forEach((value, i) => {
      const x = padding + (i * stepWidth);
      const y = height - (value / 100 * (overlayHeight - padding * 2)) - padding;

      if (i === 0) {
        path += ` L ${x},${y}`;
      } else {
        const prevX = padding + ((i - 1) * stepWidth);
        path += ` L ${prevX},${y} L ${x},${y}`;
      }
    });

    path += ` L ${width - padding},${height} Z`;

    return path;
  }, [data, width, height]);

  return (
    <div
      className={`relative overflow-hidden rounded-[10px] bg-white/5 ${className}`}
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="absolute inset-0"
      >
        {/* Base wave - lighter color */}
        <path
          d={wavePath}
          fill="url(#baseGradient)"
          className="transition-opacity duration-300"
        />

        {/* Overlay wave - creates depth effect */}
        <path
          d={overlayPath}
          fill="url(#overlayGradient)"
          className="transition-opacity duration-300"
        />

        {/* Gradients matching Figma design */}
        <defs>
          <linearGradient id="baseGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(96, 165, 250, 0.3)" />
            <stop offset="100%" stopColor="rgba(96, 165, 250, 0.1)" />
          </linearGradient>
          <linearGradient id="overlayGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(96, 165, 250, 0.6)" />
            <stop offset="100%" stopColor="rgba(96, 165, 250, 0.3)" />
          </linearGradient>
        </defs>
      </svg>

      {/* Tooltip hover areas for each day */}
      <div className="absolute inset-0 flex">
        {data.map((value, i) => (
          <div
            key={i}
            className="flex-1 cursor-pointer"
            title={`${30 - i} days ago: ${value > 5 ? Math.round((value - 5) / 90 * 100) + ' edits' : 'No activity'}`}
          />
        ))}
      </div>
    </div>
  );
}
```

### Success Criteria:

#### Automated Verification:
- [x] Component file exists: `ls src/components/ActivityWaveChart.jsx`
- [x] No TypeScript errors: `npm run typecheck`
- [x] No linting errors: `npm run lint`
- [x] Component exports default function

#### Manual Verification:
- [x] Component renders without console errors
- [x] SVG wave path generates correctly from data array
- [x] Container has white/5% background and 10px border radius
- [x] Two-layer wave creates depth effect
- [x] Tooltips work when hovering over each section

---

## Phase 2: Update EntryCardRedesigned

### Overview
Replace the vertical bar chart with the new wave chart component in the main document card.

### Changes Required:

#### 1. Import new component
**File**: `src/components/EntryCardRedesigned.jsx`
**Line**: ~8 (with other imports)

```jsx
import ActivityWaveChart from './ActivityWaveChart';
```

#### 2. Replace chart rendering
**File**: `src/components/EntryCardRedesigned.jsx`
**Lines**: 186-203

**REMOVE:**
```jsx
{/* Chart visualization - 30 bars showing DAILY activity from audit logs */}
{hasChart && (
  <div className="mt-auto h-16 flex items-end gap-0.5 px-1 pb-1">
    {activityData.map((value, i) => (
      <div
        key={i}
        className="flex-1 bg-gradient-to-t from-emerald-500/40 to-emerald-400/30 rounded-t
                   group-hover:from-emerald-500/60 group-hover:to-emerald-400/50
                   transition-all duration-300 shadow-sm shadow-emerald-500/20"
        style={{
          height: `${value}%`,
          transitionDelay: `${i * 15}ms`
        }}
        title={`${30 - i} days ago: ${value > 5 ? Math.round((value - 5) / 90 * 100) + ' edits' : 'No activity'}`}
      />
    ))}
  </div>
)}
```

**REPLACE WITH:**
```jsx
{/* Chart visualization - Stepped wave showing DAILY activity from audit logs */}
{hasChart && (
  <div className="mt-auto">
    <ActivityWaveChart
      data={activityData}
      width={258}
      height={80}
      className="group-hover:opacity-100 transition-opacity duration-300"
    />
  </div>
)}
```

#### 3. Update debug logging
**File**: `src/components/EntryCardRedesigned.jsx`
**Line**: ~81 (in debug log)

**CHANGE:**
```jsx
console.log(`[ACTIVITY-DEBUG] No activity for "${entry.title}", showing minimal bars`);
```

**TO:**
```jsx
console.log(`[ACTIVITY-DEBUG] No activity for "${entry.title}", showing minimal wave`);
```

### Success Criteria:

#### Automated Verification:
- [x] Build succeeds: `npm run build`
- [x] No TypeScript errors: `npm run typecheck`
- [x] No console errors when rendering card

#### Manual Verification:
- [x] Wave chart appears at bottom of document card
- [x] Chart is exactly 80px tall (measured in browser DevTools)
- [x] White/5% background visible with 10px rounded corners
- [x] Hover on card shows wave animation
- [x] Document title still displays correctly above chart
- [x] Card maintains proper spacing and layout

---

## Phase 3: Update VirtualizedGrid

### Overview
Apply the same wave chart to the compact card version used in grid view.

### Changes Required:

#### 1. Import new component
**File**: `src/components/VirtualizedGrid.jsx`
**Line**: ~4 (with other imports)

```jsx
import ActivityWaveChart from './ActivityWaveChart';
```

#### 2. Update CompactEntryCard chart rendering
**File**: `src/components/VirtualizedGrid.jsx`
**Lines**: ~432-440 (find the Sparkline component)

**REPLACE:**
```jsx
<div className="mb-1">
  <Sparkline
    data={activityData}
    width={200}
    height={20}
    className="opacity-50 group-hover:opacity-90 transition-opacity duration-300"
  />
</div>
```

**WITH:**
```jsx
<div className="mb-1">
  <ActivityWaveChart
    data={activityData}
    width={200}
    height={60}
    className="opacity-50 group-hover:opacity-90 transition-opacity duration-300"
  />
</div>
```

### Success Criteria:

#### Automated Verification:
- [x] Build succeeds: `npm run build`
- [x] No import errors for ActivityWaveChart
- [x] No console warnings

#### Manual Verification:
- [x] Compact cards in grid view show wave chart
- [x] Chart fits properly in compact card layout
- [x] Hover effects work correctly
- [x] No layout shifts or visual glitches
- [x] Mobile view displays correctly

---

## Phase 4: Cleanup and Polish

### Overview
Remove old code, update comments, and ensure consistent styling across all views.

### Changes Required:

#### 1. Remove old Sparkline import (if no longer used)
**File**: `src/components/VirtualizedGrid.jsx`
**Line**: ~4

Check if `Sparkline` is used elsewhere in the file. If not:
```jsx
// REMOVE: import Sparkline from './Sparkline';
```

#### 2. Update component comments
**File**: `src/components/EntryCardRedesigned.jsx`
**Line**: 102

**CHANGE:**
```jsx
// Always show chart for all documents (matching Figma design)
```

**TO:**
```jsx
// Always show wave chart for all documents (matching Figma design)
```

#### 3. Remove debug logging (optional cleanup)
**File**: `src/components/EntryCardRedesigned.jsx` and `VirtualizedGrid.jsx`

Remove or comment out the `[ACTIVITY-DEBUG]` console.log statements added earlier:
```jsx
// Remove these lines (around line 72-81):
console.log(`[ACTIVITY-DEBUG] Document "${entry.title}":`, { ... });
console.log(`[ACTIVITY-DEBUG] No activity for "${entry.title}", showing minimal wave`);
```

#### 4. Update card height if needed
**File**: `src/components/EntryCardRedesigned.jsx`
**Line**: 179

Check if card min-height needs adjustment for 80px chart:
```jsx
<div className="relative p-5 flex flex-col h-full min-h-[160px]">
  {/* Increased from min-h-[140px] to accommodate 80px chart */}
```

### Success Criteria:

#### Automated Verification:
- [x] Final build succeeds: `npm run build`
- [x] No unused imports: `npm run lint`
- [x] Bundle size hasn't increased significantly

#### Manual Verification:
- [x] All document cards display wave chart correctly
- [x] No console errors or warnings
- [x] Performance is smooth (no lag when scrolling)
- [x] Chart matches Figma design in all states
- [x] Mobile responsive layout works correctly

---

## Testing Strategy

### Unit Tests (Future):
- Test ActivityWaveChart SVG path generation with various data inputs
- Test empty data array handling
- Test tooltip positioning and content
- Test responsive width/height calculations

### Integration Tests (Future):
- Test wave chart updates when activity data changes
- Test hover state transitions
- Test chart rendering in both card types
- Test data flow from audit logs to visualization

### Manual Testing Steps:

1. **Desktop View:**
   - Open dashboard with multiple documents
   - Verify all cards show wave chart
   - Hover over different cards, check smooth animation
   - Hover over different parts of wave, verify tooltip accuracy
   - Check spacing and alignment with Figma

2. **Mobile View:**
   - Open dashboard on mobile device or DevTools mobile view
   - Verify wave chart scales appropriately
   - Test touch interactions
   - Verify no horizontal scroll issues

3. **Edge Cases:**
   - Document with no activity (flat baseline)
   - Document with 1 edit (minimal wave)
   - Document with 100+ edits (max wave height)
   - Mix of active and inactive days
   - Old document from before audit system

4. **Cross-browser:**
   - Test in Chrome, Firefox, Safari
   - Verify SVG rendering consistency
   - Check gradient display

## Performance Considerations

### SVG Path Generation:
- `useMemo` already in place to prevent recalculation on every render
- Path string generation is O(n) where n=30, very fast
- No performance impact expected

### Animation:
- CSS transitions on opacity/hover
- No JavaScript animation loops
- GPU-accelerated when possible

### Memory:
- Wave chart component is lightweight (~100 lines)
- No significant memory overhead
- Reuses existing activityData array

## Migration Notes

### Data Compatibility:
- ✅ Uses same `activityData` array (30 days of activity)
- ✅ No changes to `usePaginatedDashboard` hook
- ✅ No changes to audit logging system
- ✅ No database migrations required

### Backwards Compatibility:
- Old code will be completely replaced
- No feature flags needed (visual change only)
- Users will see new design immediately after deployment

### Rollback Plan:
If issues arise, revert by:
1. Remove `ActivityWaveChart.jsx` file
2. Restore old vertical bar rendering in `EntryCardRedesigned.jsx`
3. Restore old Sparkline in `VirtualizedGrid.jsx`
4. Redeploy previous commit

## Visual Comparison

### Before (Current):
```
┌─────────────────────────────┐
│  Document Title             │
│                             │
│  ▂▁▃▅▇█▅▃▂▁▁▂▃▅▇█▅▃▂▁  │
└─────────────────────────────┘
   30 vertical bars (emerald)
```

### After (Figma Design):
```
┌─────────────────────────────┐
│  Document Title             │
│  ┌─────────────────────┐   │
│  │     ╱╲  ╱╲   ╱╲    │   │
│  │    ╱  ╲╱  ╲ ╱  ╲   │   │
│  │___╱________╲╱____╲__│   │
│  └─────────────────────┘   │
└─────────────────────────────┘
   Stepped wave (blue gradient)
   80px height, rounded container
```

## Color Reference (From Figma)

**Base Wave:**
- Top: `rgba(96, 165, 250, 0.3)` (blue-400 at 30%)
- Bottom: `rgba(96, 165, 250, 0.1)` (blue-400 at 10%)

**Overlay Wave:**
- Top: `rgba(96, 165, 250, 0.6)` (blue-400 at 60%)
- Bottom: `rgba(96, 165, 250, 0.3)` (blue-400 at 30%)

**Container:**
- Background: `rgba(255, 255, 255, 0.05)` (white at 5%)
- Border Radius: `10px`

## References

- Figma Design: https://www.figma.com/design/vm4zgEWrWUCuEbGzuNCuWq/Untitled?node-id=3-1346
- Current Implementation: `src/components/EntryCardRedesigned.jsx` (lines 186-203)
- Compact View: `src/components/VirtualizedGrid.jsx` (CompactEntryCard function)
- Data Source: `src/hooks/usePaginatedDashboard.js` (provides activityData)
- Related: Audit tracking system implementation plan

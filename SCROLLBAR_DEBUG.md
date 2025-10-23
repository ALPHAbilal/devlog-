# Scrollbar Issue - Problem Statement

## The Problem
The scrollbar on the settings page does not reach the top of the viewport.

## Visual Structure
```
[Viewport Top]
     |
     | ← Scrollbar should start here but doesn't
     |
  [Gap/Padding]
     |
  [Settings Content]
     |
  [Scrollbar starts here instead]
```

## Current Behavior
- Scrollbar appears but starts BELOW some gap/padding
- The gap exists between the viewport top and where the scrollbar track begins
- We want to KEEP this gap/padding visually
- But we want the scrollbar track to extend all the way to the viewport top

## CSS Hierarchy
```
.settings-page (position: fixed; overflow: auto)
  └─ .settings-layout (display: flex; height: 100%)
      ├─ .settings-sidebar
      └─ .settings-content (overflow-y: auto)
          └─ .content-section (padding: var(--space-8))
              └─ [Content here]
```

## Questions to Answer
1. Which element has the scrollbar? (.settings-page or .settings-content?)
2. Where is the gap coming from? (padding? margin? fixed header?)
3. Should the gap be VISUAL PADDING only, or actual space?
4. On mobile, is there a fixed header taking space?

## Expected Outcome
- Scrollbar track should extend from viewport top to viewport bottom
- Visual padding/gap should remain (content doesn't touch the edge)
- No layout shift should occur

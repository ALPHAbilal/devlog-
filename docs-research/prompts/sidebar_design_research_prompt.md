# Sidebar Design Enhancement Research Request

## Context
We have a document management application (Devlog) with a collapsible sidebar that needs visual refinement to better match our overall design philosophy. The sidebar currently uses colors and styling that feel disconnected from the main application's aesthetic.

## Current Design System

### Color Palette
```css
/* Main application colors */
- dark: #050d1a
- dark-lighter: #0f1f33
- dark-primary: #0a1628
- dark-secondary: #1e3a5f
- accent-green: #10b981
- text-primary: #e0e7ff
- text-secondary: #94a3b8

/* Surface elevation system */
- surface-0: #0d1117 (Base)
- surface-1: #161b22 (Slightly elevated)
- surface-2: #1f2428 (More elevated)
- surface-3: #2d333b (Highest elevation)
```

### Main App Visual Language
- Cards use: `bg-gradient-to-br from-dark-secondary/90 to-dark-secondary/70`
- Rounded corners: `rounded-lg`
- Borders: `border border-gray-800/50 hover:border-accent-green/30`
- Hover effects include subtle gradient overlays and accent glows
- Smooth transitions (300ms) with shadow elevation on hover

## Current Sidebar Issues

### Color Problems
1. **Background**: Currently using `bg-[#1e1e1e]` which doesn't match our blue-tinted dark theme
2. **Border**: Using `border-dark-secondary/30` which creates a harsh edge
3. **No gradient or depth**: Flat color vs. the gradient approach used in cards

### Collapsed State Issues
1. **Shape**: Simple rectangular box with no visual interest
2. **Icons**: Basic icon layout without proper visual hierarchy
3. **No transition effects**: Lacks the smooth, polished feel of the main app
4. **Width**: Currently 64px (w-16) which might feel too narrow

### Current Sidebar Code Structure
```jsx
// Collapsed view
<div className={`bg-[#1e1e1e] ${height} flex flex-col ${className} border-r border-dark-secondary/30 overflow-hidden`}>
  <div className="p-4">
    <button className="w-full p-2 hover:bg-gray-800/50 rounded transition-colors">
      <ChevronRight size={20} className="text-text-secondary mx-auto" />
    </button>
  </div>
  <div className="flex flex-col items-center py-2 gap-4">
    <Folder size={20} className="text-text-secondary hover:text-accent-green cursor-pointer" />
    <FileText size={20} className="text-text-secondary hover:text-accent-green cursor-pointer" />
    <Search size={20} className="text-text-secondary hover:text-accent-green cursor-pointer" />
  </div>
</div>

// Expanded view
<div className={`bg-[#1e1e1e] ${height} flex flex-col ${className} border-r border-dark-secondary/30 overflow-hidden relative`}>
  {/* Header, search, file tree... */}
</div>
```

## Research Questions

1. **Color Harmony**: What background color/gradient would better integrate the sidebar with our blue-tinted dark theme while maintaining sufficient contrast for usability?

2. **Edge Treatment**: How can we soften or enhance the sidebar edges to feel more integrated? Consider:
   - Gradient borders
   - Inner shadows/glows
   - Blur effects
   - Alternative to hard borders

3. **Collapsed State Design**: What are modern approaches for collapsed sidebars that maintain visual interest? Consider:
   - Pill-shaped or rounded designs
   - Floating appearance
   - Icon treatments (backgrounds, hover states)
   - Optimal width for collapsed state
   - Animation/transition enhancements

4. **Visual Hierarchy**: How can we better distinguish the sidebar as a navigation element while keeping it harmonious with content areas?

5. **Elevation System**: Should the sidebar use our surface elevation system (surface-0 through surface-3) or have its own treatment?

6. **Modern Examples**: What are current best practices from apps like:
   - Linear
   - Notion
   - Figma
   - Arc Browser
   - Modern VSCode themes

## Desired Outcome
We need specific recommendations for:
1. Background colors/gradients that match our theme
2. Border/edge treatments (or alternatives)
3. Collapsed state design that feels modern and integrated
4. Hover states and micro-interactions
5. Any additional visual enhancements that maintain consistency

Please provide specific CSS classes/values using our existing color palette and Tailwind CSS conventions.
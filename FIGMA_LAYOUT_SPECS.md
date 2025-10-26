# Figma Dashboard Layout - Exact Specifications

## Overview
This document specifies the EXACT layout from the Figma design in the Dashboardredesining folder.

## Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│ Outer Container: p-6 (24px padding)                         │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Flex Container: gap-6, max-w-[1800px], mx-auto          │ │
│ │ ┌─────────┐ gap-6 ┌──────────────────────────────────┐ │ │
│ │ │         │        │ Main Content: flex-col gap-6     │ │ │
│ │ │ Sidebar │        │ ┌──────────────────────────────┐ │ │ │
│ │ │  w-72   │        │ │ Header Bento Box             │ │ │ │
│ │ │   or    │        │ │ - Status + Actions (mb-6)    │ │ │ │
│ │ │  w-20   │        │ │ - Search Bar (full width)    │ │ │ │
│ │ │         │        │ └──────────────────────────────┘ │ │ │
│ │ │         │        │              gap-6                 │ │ │
│ │ │         │        │ ┌──────────────────────────────┐ │ │ │
│ │ │         │        │ │ Grid Bento Box               │ │ │ │
│ │ │         │        │ │ - Scrollable area            │ │ │ │
│ │ │         │        │ │ - p-6 inner padding          │ │ │ │
│ │ │         │        │ │ - Grid: gap-3                │ │ │ │
│ │ └─────────┘        │ └──────────────────────────────┘ │ │ │
│ │                    └──────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Exact CSS Classes

### 1. Root Container
```jsx
<div className="min-h-screen bg-gradient-to-br from-[#050b14] via-[#0a1628] to-[#0f1d32] p-6">
```

### 2. Flex Container
```jsx
<div className="flex gap-6 h-[calc(100vh-3rem)] max-w-[1800px] mx-auto">
```

### 3. Sidebar
```jsx
// Expanded
<div className="w-72 bg-[#0a1628]/40 backdrop-blur-xl rounded-2xl border border-white/5 shadow-2xl shadow-black/20">

// Collapsed
<div className="w-20 bg-[#0a1628]/40 backdrop-blur-xl rounded-2xl border border-white/5 shadow-2xl shadow-black/20">
```

### 4. Main Content Column
```jsx
<div className="flex-1 flex flex-col gap-6 min-w-0">
```

### 5. Header Bento Box
```jsx
<div className="bg-[#0a1628]/40 backdrop-blur-xl rounded-2xl border border-white/5 shadow-2xl shadow-black/20 p-6">
  {/* Top Row */}
  <div className="flex items-center justify-between mb-6">
    {/* Status + Count */}
    {/* Actions (New + Profile) */}
  </div>

  {/* Search Bar - Full Width */}
  <div className="relative">
    <input className="w-full ..." />
  </div>
</div>
```

### 6. Grid Bento Box
```jsx
<div className="flex-1 bg-[#0a1628]/40 backdrop-blur-xl rounded-2xl border border-white/5 shadow-2xl shadow-black/20 overflow-hidden">
  <div className="h-full overflow-y-auto">
    <div className="p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-3">
        {/* Cards */}
      </div>
    </div>
  </div>
</div>
```

## Key Measurements
- Outer padding: **24px** (`p-6`)
- Section gap: **24px** (`gap-6`)
- Max width: **1800px**
- Header inner padding: **24px** (`p-6`)
- Header row spacing: **24px** (`mb-6`)
- Grid inner padding: **24px** (`p-6`)
- Card gap: **12px** (`gap-3`)

## Colors (Exact Values)
- Background: `from-[#050b14] via-[#0a1628] to-[#0f1d32]`
- Bento boxes: `bg-[#0a1628]/40` (40% opacity)
- Border: `border-white/5` (5% white)
- Shadow: `shadow-2xl shadow-black/20`
- Status dot: `bg-emerald-400`
- Text primary: `text-white/90` (90% white)
- Text secondary: `text-white/40` (40% white)

## Responsive Breakpoints
- Grid columns:
  - `sm` (640px+): 2 columns
  - `lg` (1024px+): 3 columns
  - `xl` (1280px+): 4 columns
  - `2xl` (1536px+): 6 columns

## Important Notes
- **NO** `lg:ml-[288px]` offset needed - flex layout handles spacing
- **Header is separate bento box** - not part of global header
- **Search bar is INSIDE header bento box**
- **All bento boxes have same styling** for consistency
- **Sidebar is its own bento box** alongside main content

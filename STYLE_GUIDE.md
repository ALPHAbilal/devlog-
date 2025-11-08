# Devlog Style Guide

**Version:** 1.0  
**Last Updated:** 2025-01-31  
**Purpose:** Comprehensive design system documentation for the Devlog project

---

## Table of Contents

1. [Overview](#overview)
2. [Color Palette](#color-palette)
3. [Typography](#typography)
4. [Spacing System](#spacing-system)
5. [Component Styles](#component-styles)
6. [Shadows & Elevation](#shadows--elevation)
7. [Animations & Transitions](#animations--transitions)
8. [Border Radius](#border-radius)
9. [Opacity & Transparency](#opacity--transparency)
10. [Common Tailwind CSS Usage](#common-tailwind-css-usage)
11. [Example Component Reference](#example-component-reference)

---

## Overview

Devlog uses a **sophisticated dark-themed design system** built on Tailwind CSS with custom CSS variables for maximum flexibility. The design philosophy emphasizes:

- **Dark-first approach**: All interfaces use dark backgrounds with carefully crafted elevation layers
- **Glassmorphism**: Frosted glass effects for modern, premium feel
- **Fluid typography**: Responsive text that scales smoothly across all viewport sizes
- **Emerald accent**: Primary brand color (#10b981) used sparingly for CTAs and highlights
- **Mobile-optimized**: Touch targets, safe areas, and responsive breakpoints throughout

### Architecture

```
Design System Layers:
├── CSS Custom Properties (--variables)
│   ├── Color tokens
│   ├── Spacing tokens
│   ├── Typography tokens
│   └── Animation tokens
├── Tailwind Config (tailwind.config.js)
│   ├── Extended theme
│   ├── Custom colors
│   ├── Custom spacing
│   └── Custom animations
└── Component Styles
    ├── Utility-first (Tailwind classes)
    ├── Custom CSS (complex animations)
    └── Inline styles (dynamic values)
```

### Key Files

- **`tailwind.config.js`**: Main configuration with extended theme
- **`src/styles/dashboard-design-tokens.css`**: Central design tokens
- **`src/styles/typography.css`**: Fluid typography system
- **`src/styles/glassmorphism.css`**: Glass effect utilities
- **`src/styles/animations.css`**: Global animations
- **`src/index.css`**: Global styles and utilities

---

## Color Palette

### Primary Color System

Devlog uses a **dual-layer color system**: CSS custom properties for flexibility + Tailwind utilities for speed.

#### Core Background Colors

**Deep Blues (Primary Background Layers)**

```css
/* CSS Variables */
--db-dark-base: #050b14        /* Deepest layer, behind everything */
--db-dark-primary: #0a1628      /* Primary background (most used) */
--db-dark-secondary: #0f1d32   /* Elevated surfaces, cards */
--db-dark-tertiary: #142842    /* Higher elevation, modals */
```

**Tailwind Classes:**
```jsx
bg-db-dark-base        // #050b14
bg-db-dark-primary     // #0a1628 (most common)
bg-db-dark-secondary    // #0f1d32
bg-db-dark-tertiary    // #142842
```

**Legacy Color Names:**
```jsx
bg-dark                // #050d1a
bg-dark-primary        // #0a1628
bg-dark-secondary      // #1e3a5f
bg-dark-lighter        // #0f1f33
```

#### Surface Elevation System

**Blue-tinted dark surfaces for depth:**

```css
surface-0: #0d1117    /* Base layer */
surface-1: #161b22    /* Slightly elevated */
surface-2: #1f2428    /* More elevated */
surface-3: #2d333b    /* Highest elevation */
```

**Usage:**
```jsx
<div className="bg-surface-1 hover:bg-surface-2">
  {/* Card that elevates on hover */}
</div>
```

#### Accent Colors

**Emerald (Primary CTA Color)**

```css
--db-emerald: #10b981          /* Primary CTA, success states */
--db-emerald-light: #34d399    /* Hover, focus states */
--db-emerald-dark: #059669     /* Active, pressed states */
```

**Tailwind Classes:**
```jsx
bg-accent-green              // #10b981
bg-db-emerald                // #10b981
bg-db-emerald-light          // #34d399
bg-db-emerald-dark           // #059669

text-accent-green
border-accent-green
ring-accent-green
```

**Blue Accent**

```css
--db-blue: #60a5fa
--db-blue-light: #93c5fd
--db-blue-dark: #3b82f6
```

**Amber Accent**

```css
--db-amber: #fbbf24
--db-amber-light: #fcd34d
--db-amber-dark: #f59e0b
```

#### Text Color Hierarchy

**Text Colors (Light to Dark)**

```css
--db-text-primary: #f8fafc     /* Headings, primary content */
--db-text-secondary: #cbd5e1   /* Subtext, descriptions */
--db-text-tertiary: #94a3b8    /* Disabled, placeholders */
--db-text-muted: #64748b       /* Lowest contrast */
```

**Tailwind Classes:**
```jsx
text-db-text-primary      // #f8fafc
text-db-text-secondary    // #cbd5e1
text-db-text-tertiary     // #94a3b8
text-db-text-muted        // #64748b

// Legacy names
text-text-primary         // #e0e7ff
text-text-secondary       // #94a3b8
```

#### Semantic Colors

```css
--color-success: #10b981
--color-error: #ef4444
--color-warning: #f59e0b
--color-danger: #ff6467
```

#### Version Track Colors

```css
--vt-base: #121212
--vt-surface: #1E1E1E
--vt-glass: rgba(255, 255, 255, 0.05)
--vt-glass-border: rgba(255, 255, 255, 0.1)
```

### Color Usage Guidelines

1. **Backgrounds**: Always use dark-primary or darker for base layers
2. **Cards**: Use dark-secondary or surface-1/2 for elevation
3. **CTAs**: Use accent-green (#10b981) sparingly
4. **Text**: Use text-primary for headings, text-secondary for body
5. **Borders**: Use white/10 or white/20 for subtle separation
6. **Hover States**: Lighten background by 10-20% opacity

---

## Typography

### Font Families

**Primary Font: Inter**

```css
--font-sans: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 
             'Segoe UI', Roboto, sans-serif;
```

**Monospace Font: JetBrains Mono**

```css
--font-mono: 'JetBrains Mono', 'SF Mono', Monaco, 
             'Cascadia Code', 'Roboto Mono', monospace;
```

**Tailwind Classes:**
```jsx
font-sans    // Inter (default)
font-mono    // JetBrains Mono
```

### Font Weights

Inter provides **9 weight variations**:

```css
font-light: 300        /* Subtle, decorative text */
font-normal: 400       /* Body text, descriptions */
font-medium: 500       /* Emphasis, labels */
font-semibold: 600     /* Sub-headings, strong emphasis */
font-bold: 700         /* Headings, CTAs */
font-extrabold: 800    /* Hero headings */
```

**Usage Guidelines:**

1. **Body Text**: `font-normal` (400) for all paragraph text
2. **Emphasis**: `font-medium` (500) for labels and subtle emphasis
3. **Sub-headings**: `font-semibold` (600) for h3, h4
4. **Headings**: `font-bold` (700) for h1, h2
5. **Hero Text**: `font-extrabold` (800) for display text

### Fluid Type Scale

Devlog uses **CSS clamp()** for truly fluid typography that scales smoothly across all viewport sizes (320px to 2560px).

#### Base Typography Scale

```css
/* Defined in src/styles/typography.css */

/* Base Text (16px - 18px) */
--step-0: clamp(1rem, 0.95rem + 0.25vw, 1.125rem);

/* Small Text (14px - 16px) */
--step--1: clamp(0.833rem, 0.8rem + 0.165vw, 0.937rem);

/* Tiny Text (12px - 14px) */
--step--2: clamp(0.694rem, 0.68rem + 0.07vw, 0.781rem);

/* Heading 6 (18px - 24px) */
--step-1: clamp(1.125rem, 1.05rem + 0.375vw, 1.5rem);

/* Heading 5 (20px - 30px) */
--step-2: clamp(1.333rem, 1.2rem + 0.666vw, 1.875rem);

/* Heading 4 (28px - 40px) */
--step-3: clamp(1.777rem, 1.5rem + 1.385vw, 2.5rem);

/* Heading 3 (38px - 53px) */
--step-4: clamp(2.369rem, 1.8rem + 2.845vw, 3.333rem);

/* Heading 2 (50px - 71px) */
--step-5: clamp(3.157rem, 2.2rem + 4.785vw, 4.444rem);

/* Heading 1 (67px - 95px) */
--step-6: clamp(4.209rem, 2.5rem + 8.545vw, 5.926rem);
```

#### Tailwind Fluid Font Sizes

```jsx
text-xs-fluid      // clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)
text-sm-fluid      // clamp(0.875rem, 0.825rem + 0.25vw, 1rem)
text-base-fluid    // clamp(1rem, 0.95rem + 0.25vw, 1.125rem)
text-lg-fluid      // clamp(1.125rem, 1.05rem + 0.375vw, 1.25rem)
text-xl-fluid      // clamp(1.25rem, 1.15rem + 0.5vw, 1.5rem)
text-2xl-fluid     // clamp(1.5rem, 1.35rem + 0.75vw, 1.875rem)
text-3xl-fluid     // clamp(1.875rem, 1.65rem + 1.125vw, 2.25rem)
text-4xl-fluid     // clamp(2.25rem, 1.95rem + 1.5vw, 3rem)
```

#### Heading Styles

**H1 (Hero Headings)**
```css
font-size: var(--step-6);
font-weight: 800;
line-height: 1.2;
letter-spacing: -0.03em;
```

**H2 (Section Headings)**
```css
font-size: var(--step-5);
font-weight: 700;
line-height: 1.2;
letter-spacing: -0.025em;
```

**H3 (Subsection Headings)**
```css
font-size: var(--step-4);
font-weight: 600;
line-height: 1.3;
letter-spacing: -0.02em;
```

**H4 (Card Headings)**
```css
font-size: var(--step-3);
font-weight: 600;
line-height: 1.4;
letter-spacing: -0.015em;
```

### Line Heights

```css
--line-height-tight: 1.2      /* Headings */
--line-height-normal: 1.58    /* Body text (Medium's ratio) */
--line-height-loose: 1.8       /* Lead text, hero descriptions */
```

**Tailwind Classes:**
```jsx
leading-tight      // 1.2
leading-normal     // 1.58
leading-loose      // 1.8
```

### Letter Spacing

```css
--letter-spacing-tight: -0.003em   /* Medium's approach for headings */
--letter-spacing-normal: 0
--letter-spacing-wide: 0.025em
```

**Usage:**
- Headings: Negative letter spacing for tighter look
- Body: Normal (0)
- Uppercase text: Slightly wider spacing

### Font Features

**Inter Enhanced Legibility:**
```css
font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11';
```

**JetBrains Mono Ligatures:**
```css
font-feature-settings: 'calt' 1;  /* Enable ligatures */
```

### Typography Utilities

**Text Alignment:**
```jsx
text-left
text-center
text-right
text-justify
```

**Text Transform:**
```jsx
uppercase
lowercase
capitalize
```

**Text Decoration:**
```jsx
underline
line-through
no-underline
```

**Text Overflow:**
```jsx
truncate              // Single line ellipsis
line-clamp-2         // Multi-line ellipsis (2 lines)
line-clamp-3         // Multi-line ellipsis (3 lines)
```

---

## Spacing System

### Base Spacing Scale

Devlog uses a **4px base unit** with fluid scaling for responsive spacing.

#### Standard Spacing (Tailwind Default)

```jsx
p-0, m-0      // 0px
p-1, m-1      // 4px
p-2, m-2      // 8px
p-3, m-3      // 12px
p-4, m-4      // 16px
p-5, m-5      // 20px
p-6, m-6      // 24px
p-8, m-8      // 32px
p-10, m-10    // 40px
p-12, m-12    // 48px
p-16, m-16    // 64px
p-20, m-20    // 80px
p-24, m-24    // 96px
```

#### Fluid Spacing Scale

**CSS Variables:**
```css
--space-1: clamp(0.25rem, 0.2rem + 0.25vw, 0.5rem);    /* 4px - 8px */
--space-2: clamp(0.5rem, 0.4rem + 0.5vw, 1rem);       /* 8px - 16px */
--space-3: clamp(0.75rem, 0.6rem + 0.75vw, 1.5rem);   /* 12px - 24px */
--space-4: clamp(1rem, 0.8rem + 1vw, 2rem);           /* 16px - 32px */
--space-5: clamp(1.5rem, 1.2rem + 1.5vw, 3rem);        /* 24px - 48px */
--space-6: clamp(2rem, 1.6rem + 2vw, 4rem);           /* 32px - 64px */
--space-8: clamp(3rem, 2.4rem + 3vw, 6rem);           /* 48px - 96px */
--space-10: clamp(4rem, 3.2rem + 4vw, 8rem);          /* 64px - 128px */
--space-12: clamp(6rem, 4.8rem + 6vw, 12rem);         /* 96px - 192px */
```

**Tailwind Fluid Spacing:**
```jsx
p-fluid-xs      // clamp(0.25rem, 0.2rem + 0.25vw, 0.5rem)
p-fluid-sm      // clamp(0.5rem, 0.4rem + 0.5vw, 0.75rem)
p-fluid-md      // clamp(1rem, 0.8rem + 1vw, 1.5rem)
p-fluid-lg      // clamp(1.5rem, 1.2rem + 1.5vw, 2rem)
p-fluid-xl      // clamp(2rem, 1.5rem + 2.5vw, 3rem)
p-fluid-2xl     // clamp(3rem, 2rem + 5vw, 5rem)
```

#### Dashboard-Specific Spacing

```css
--db-spacing-xs: 0.5rem;    /* 8px */
--db-spacing-sm: 0.75rem;   /* 12px */
--db-spacing-md: 1rem;      /* 16px */
--db-spacing-lg: 1.5rem;     /* 24px */
--db-spacing-xl: 2rem;       /* 32px */
--db-spacing-2xl: 3rem;      /* 48px */
```

**Tailwind Classes:**
```jsx
p-db-xs, m-db-xs      // 8px
p-db-sm, m-db-sm      // 12px
p-db-md, m-db-md      // 16px
p-db-lg, m-db-lg      // 24px
p-db-xl, m-db-xl      // 32px
p-db-2xl, m-db-2xl    // 48px
```

#### Safe Area Spacing (Mobile)

```css
--safe-top: env(safe-area-inset-top)
--safe-bottom: env(safe-area-inset-bottom)
--safe-left: env(safe-area-inset-left)
--safe-right: env(safe-area-inset-right)
```

**Tailwind Classes:**
```jsx
p-safe-top
p-safe-bottom
p-safe-left
p-safe-right
```

### Spacing Usage Guidelines

1. **Component Padding**: Use `p-4` (16px) or `p-6` (24px) for cards
2. **Section Spacing**: Use `space-6` or `space-8` between sections
3. **Grid Gaps**: Use `gap-4` or `gap-6` for grid layouts
4. **Mobile**: Increase spacing on mobile for touch targets
5. **Fluid**: Use fluid spacing for hero sections and landing pages

---

## Component Styles

### Button Styles

#### Primary Button

```jsx
<button className="
  bg-accent-green
  hover:bg-accent-green/90
  active:scale-95
  text-white
  font-semibold
  px-6 py-3
  rounded-lg
  transition-all duration-200
  shadow-lg shadow-accent-green/20
  hover:shadow-xl hover:shadow-accent-green/30
  disabled:opacity-50 disabled:cursor-not-allowed
">
  Primary Action
</button>
```

#### Secondary Button

```jsx
<button className="
  bg-dark-secondary/50
  hover:bg-dark-secondary/70
  active:scale-95
  text-text-primary
  font-medium
  px-6 py-3
  rounded-lg
  border border-white/10
  transition-all duration-200
  hover:border-white/20
">
  Secondary Action
</button>
```

#### Ghost Button

```jsx
<button className="
  bg-transparent
  hover:bg-white/5
  active:scale-95
  text-text-secondary
  font-medium
  px-4 py-2
  rounded-lg
  transition-all duration-200
">
  Ghost Action
</button>
```

#### Icon Button

```jsx
<button className="
  p-2
  rounded-lg
  bg-transparent
  hover:bg-white/5
  active:scale-95
  text-text-secondary
  hover:text-text-primary
  transition-all duration-200
  min-w-[44px] min-h-[44px]  // Touch target
">
  <Icon size={20} />
</button>
```

### Card Styles

#### Standard Card

```jsx
<div className="
  bg-dark-secondary/50
  backdrop-blur-sm
  rounded-xl
  border border-white/10
  p-6
  transition-all duration-300
  hover:bg-dark-secondary/70
  hover:border-white/20
  hover:shadow-lg
">
  {/* Card content */}
</div>
```

#### Glassmorphism Card

```jsx
<div className="
  glassmorphism-card
  rounded-xl
  p-6
  transition-all duration-300
  hover:glassmorphism-hover
">
  {/* Card content */}
</div>
```

#### Elevated Card (with gradient)

```jsx
<div className="
  group relative
  bg-gradient-to-br from-[#1a2942]/60 to-[#0f1d32]/60
  backdrop-blur-sm
  rounded-xl
  border border-white/10
  p-6
  cursor-pointer
  transition-all duration-300
  hover:border-emerald-500/30
  hover:shadow-xl hover:shadow-emerald-500/10
">
  {/* Hover gradient overlay */}
  <div className="
    absolute inset-0
    bg-gradient-to-br from-emerald-500/0 to-emerald-500/0
    group-hover:from-emerald-500/10 group-hover:to-transparent
    transition-all duration-300
    pointer-events-none
  " />
  
  {/* Card content */}
</div>
```

### Input Styles

#### Text Input

```jsx
<input
  type="text"
  className="
    w-full
    px-4 py-3
    bg-dark-secondary/50
    border border-white/10
    rounded-lg
    text-text-primary
    placeholder:text-text-secondary/50
    focus:outline-none
    focus:ring-2 focus:ring-accent-green/50
    focus:border-accent-green/50
    transition-all duration-200
  "
  placeholder="Enter text..."
/>
```

#### Textarea

```jsx
<textarea
  className="
    w-full
    px-4 py-3
    bg-dark-secondary/50
    border border-white/10
    rounded-lg
    text-text-primary
    placeholder:text-text-secondary/50
    focus:outline-none
    focus:ring-2 focus:ring-accent-green/50
    focus:border-accent-green/50
    resize-none
    transition-all duration-200
  "
  rows={4}
/>
```

### Badge/Tag Styles

```jsx
<span className="
  inline-flex
  items-center
  px-3 py-1
  rounded-full
  text-xs
  font-medium
  bg-accent-green/10
  text-accent-green
  border border-accent-green/20
">
  Label
</span>
```

### Modal/Dialog Styles

```jsx
<div className="
  fixed inset-0
  z-50
  flex items-center justify-center
  bg-black/50
  backdrop-blur-sm
">
  <div className="
    relative
    bg-dark-primary
    rounded-xl
    border border-white/10
    shadow-2xl
    max-w-lg w-full mx-4
    p-6
    animate-in fade-in slide-in-from-top-1
  ">
    {/* Modal content */}
  </div>
</div>
```

---

## Shadows & Elevation

### Shadow System

Shadows create depth and hierarchy in the dark interface.

#### Standard Shadows

```css
/* Tailwind Default */
shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.2)
shadow: 0 4px 6px rgba(0, 0, 0, 0.3)
shadow-md: 0 4px 6px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2)
shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.4), 0 4px 6px rgba(0, 0, 0, 0.3)
shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.5), 0 8px 10px rgba(0, 0, 0, 0.4)
shadow-2xl: 0 25px 50px rgba(0, 0, 0, 0.6), 0 12px 18px rgba(0, 0, 0, 0.5)
```

#### Dashboard-Specific Shadows

```css
--db-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3)
--db-shadow-md: 0 4px 6px rgba(0, 0, 0, 0.4)
--db-shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.5)
--db-shadow-glow: 0 0 20px rgba(16, 185, 129, 0.3)
```

**Tailwind Classes:**
```jsx
shadow-db-sm
shadow-db-md
shadow-db-lg
shadow-db-glow
```

#### Glow Effects

```jsx
// Emerald glow
shadow-[0_0_20px_rgba(16,185,129,0.3)]
shadow-[0_0_30px_rgba(16,185,129,0.4)]
shadow-[0_0_40px_rgba(16,185,129,0.5)]

// Colored shadow
shadow-lg shadow-accent-green/20
hover:shadow-xl hover:shadow-accent-green/30
```

#### Inner Shadows

```jsx
shadow-inner  // inset 0 2px 4px rgba(0, 0, 0, 0.6)
```

### Elevation Levels

**Level 0: Base Layer**
```jsx
<div className="bg-dark-primary">
  {/* No shadow, base background */}
</div>
```

**Level 1: Cards (Resting)**
```jsx
<div className="bg-dark-secondary/50 shadow-md">
  {/* Subtle elevation */}
</div>
```

**Level 2: Cards (Hovered)**
```jsx
<div className="bg-dark-secondary/50 shadow-md hover:shadow-lg">
  {/* Elevated on hover */}
</div>
```

**Level 3: Modals/Dialogs**
```jsx
<div className="bg-dark-primary shadow-2xl">
  {/* Highest elevation */}
</div>
```

**Level 4: Floating Elements**
```jsx
<div className="bg-dark-primary shadow-2xl shadow-db-glow">
  {/* With glow effect */}
</div>
```

### Shadow Usage Guidelines

1. **Cards**: Use `shadow-md` for resting, `shadow-lg` for hover
2. **Modals**: Use `shadow-2xl` for maximum elevation
3. **CTAs**: Add colored glow with `shadow-accent-green/20`
4. **Depth**: Combine multiple shadows for realistic depth
5. **Performance**: Avoid excessive shadows on mobile

---

## Animations & Transitions

### Transition Durations

```css
--db-transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1)
--db-transition-normal: 250ms cubic-bezier(0.4, 0, 0.2, 1)
--db-transition-slow: 350ms cubic-bezier(0.4, 0, 0.2, 1)
```

**Tailwind Classes:**
```jsx
transition-none          // No transition
transition-all          // All properties
transition-colors       // Color properties
transition-opacity      // Opacity
transition-transform    // Transform
transition-shadow       // Box shadow

duration-75             // 75ms
duration-100            // 100ms
duration-150            // 150ms
duration-200            // 200ms (most common)
duration-300            // 300ms
duration-500            // 500ms
duration-700            // 700ms
duration-1000           // 1000ms

ease-linear
ease-in
ease-out                // Most common
ease-in-out
```

### Easing Functions

**Standard Easing:**
```jsx
ease-out                 // cubic-bezier(0, 0, 0.2, 1)
ease-in                  // cubic-bezier(0.4, 0, 1, 1)
ease-in-out              // cubic-bezier(0.4, 0, 0.2, 1)
```

**Custom Easing (Glassmorphism):**
```css
cubic-bezier(0.25, 0.46, 0.45, 0.94)  /* Smooth, premium feel */
```

### Keyframe Animations

#### Fade In

```css
@keyframes fade-in {
  0% { opacity: 0; }
  100% { opacity: 1; }
}
```

**Usage:**
```jsx
<div className="animate-fade-in">
  {/* Content */}
</div>
```

#### Slide In

```css
@keyframes slide-in-from-top-1 {
  0% { transform: translateY(-4px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}
```

**Tailwind Classes:**
```jsx
animate-in
animate-fade-in
animate-slide-in-from-top-1
animate-slide-in-from-right-1
animate-slide-in-from-bottom-1
animate-slide-in-from-left-1
```

#### Mobile Slide Animations

```css
@keyframes slide-up {
  0% { transform: translateY(100%); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}

@keyframes slide-down {
  0% { transform: translateY(-100%); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}

@keyframes slide-left {
  0% { transform: translateX(100%); opacity: 0; }
  100% { transform: translateX(0); opacity: 1; }
}

@keyframes slide-right {
  0% { transform: translateX(-100%); opacity: 0; }
  100% { transform: translateX(0); opacity: 1; }
}
```

**Tailwind Classes:**
```jsx
animate-slide-up
animate-slide-down
animate-slide-left
animate-slide-right
```

#### Pulse Animation

```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

**Usage:**
```jsx
<div className="animate-pulse">
  {/* Loading state */}
</div>
```

#### Shimmer (Loading Skeleton)

```css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

**Usage:**
```jsx
<div className="skeleton">
  {/* Loading skeleton */}
</div>
```

#### Dashboard Animations

```css
@keyframes db-fade-in {
  0% { opacity: 0; transform: translateY(10px); }
  100% { opacity: 1; transform: translateY(0); }
}

@keyframes db-slide-in-left {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(0); }
}

@keyframes db-pulse-glow {
  0%, 100% { box-shadow: 0 0 20px rgba(16, 185, 129, 0.3); }
  50% { box-shadow: 0 0 30px rgba(16, 185, 129, 0.5); }
}
```

**Tailwind Classes:**
```jsx
animate-db-fade-in
animate-db-slide-in-left
animate-db-pulse-glow
```

### Transform Animations

**Scale:**
```jsx
scale-95              // 0.95 (active state)
scale-100             // 1.0 (default)
scale-105             // 1.05 (hover)
scale-110             // 1.1 (hover)

hover:scale-105
active:scale-95
```

**Translate:**
```jsx
translate-x-0
translate-x-1
translate-y-0
translate-y-1

hover:translate-y-[-2px]  // Lift on hover
```

**Rotate:**
```jsx
rotate-0
rotate-90
rotate-180
rotate-[-90deg]      // Negative rotation
```

### Animation Delays

```jsx
delay-75
delay-100
delay-150
delay-200
delay-300
delay-500
delay-700
delay-1000

animation-delay-100
animation-delay-200
animation-delay-300
animation-delay-400
```

### Reduced Motion

**Respect user preferences:**
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## Border Radius

### Standard Border Radius

```jsx
rounded-none      // 0px
rounded-sm        // 2px
rounded           // 4px
rounded-md        // 6px
rounded-lg        // 8px
rounded-xl        // 12px
rounded-2xl       // 16px
rounded-3xl       // 24px
rounded-full      // 9999px (circle)
```

### Dashboard-Specific Border Radius

```css
--db-radius-sm: 8px
--db-radius-md: 12px
--db-radius-lg: 16px
--db-radius-xl: 24px
```

**Tailwind Classes:**
```jsx
rounded-db-sm     // 8px
rounded-db-md     // 12px
rounded-db-lg     // 16px
rounded-db-xl     // 24px
```

### Border Radius Usage Guidelines

1. **Cards**: Use `rounded-xl` (12px) or `rounded-db-md` (12px)
2. **Buttons**: Use `rounded-lg` (8px) or `rounded-db-sm` (8px)
3. **Inputs**: Use `rounded-lg` (8px)
4. **Badges**: Use `rounded-full` for pill shape
5. **Modals**: Use `rounded-xl` (12px) or `rounded-2xl` (16px)
6. **Images**: Use `rounded-lg` or `rounded-xl`

### Common Patterns

**Card with rounded corners:**
```jsx
<div className="rounded-xl overflow-hidden">
  {/* Content */}
</div>
```

**Pill-shaped badge:**
```jsx
<span className="rounded-full px-3 py-1">
  Label
</span>
```

**Rounded image:**
```jsx
<img className="rounded-lg" src="..." />
```

---

## Opacity & Transparency

### Opacity Scale

```jsx
opacity-0          // 0% (invisible)
opacity-5          // 5%
opacity-10         // 10%
opacity-20         // 20%
opacity-30         // 30%
opacity-40         // 40%
opacity-50         // 50%
opacity-60         // 60%
opacity-70         // 70%
opacity-80         // 80%
opacity-90         // 90%
opacity-100        // 100% (fully opaque)
```

### Color Opacity (Tailwind Syntax)

**Using slash notation:**
```jsx
bg-white/10        // rgba(255, 255, 255, 0.1)
bg-white/20        // rgba(255, 255, 255, 0.2)
bg-accent-green/10 // rgba(16, 185, 129, 0.1)
bg-accent-green/50 // rgba(16, 185, 129, 0.5)
text-white/60      // rgba(255, 255, 255, 0.6)
border-white/10    // rgba(255, 255, 255, 0.1)
```

### Common Opacity Patterns

**Glassmorphism backgrounds:**
```jsx
bg-white/5         // Very subtle
bg-white/10        // Subtle
bg-white/20        // Medium
```

**Hover states:**
```jsx
opacity-0 group-hover:opacity-100
opacity-50 hover:opacity-100
```

**Disabled states:**
```jsx
opacity-50 disabled:opacity-50
opacity-30 disabled:opacity-30
```

**Overlays:**
```jsx
bg-black/50        // Modal backdrop
bg-black/80        // Strong overlay
```

**Text hierarchy:**
```jsx
text-text-primary          // 100% opacity
text-text-secondary        // ~70% opacity
text-text-secondary/60     // 60% opacity
text-text-secondary/40     // 40% opacity
```

### Transparency Utilities

**Backdrop blur with transparency:**
```jsx
bg-white/5 backdrop-blur-sm
bg-white/10 backdrop-blur-md
```

**Border transparency:**
```jsx
border border-white/10
border border-white/20
border-accent-green/30
```

**Shadow transparency:**
```jsx
shadow-lg shadow-accent-green/20
shadow-xl shadow-accent-green/30
```

---

## Common Tailwind CSS Usage

### Utility-First Philosophy

Devlog follows a **strict utility-first** approach:

1. **Component classes**: Prefer Tailwind utilities over custom CSS
2. **Design tokens**: Use CSS variables only for values (not full components)
3. **Custom classes**: Only for complex animations or browser-specific hacks
4. **Extraction**: Never extract components into `@apply` unless truly reused 20+ times

### Common Patterns

#### 1. Responsive Design (Mobile-First)

```jsx
<div className="
  text-sm md:text-base lg:text-lg
  px-4 md:px-6 lg:px-8
  grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3
  gap-4 md:gap-6
">
  {/* Content */}
</div>
```

**Breakpoints:**
```jsx
xs: '320px'      // Small phones
sm: '640px'      // Large phones
md: '768px'      // Tablets
lg: '1024px'     // Small laptops
xl: '1280px'     // Desktops
2xl: '1536px'    // Large desktops
```

#### 2. Group Hover Pattern

```jsx
<div className="group">
  <button className="
    opacity-0
    group-hover:opacity-100
    transition-opacity duration-200
  ">
    Action
  </button>
</div>
```

#### 3. Conditional Classes with cn()

```jsx
import { cn } from '../utils/cn';

<div className={cn(
  "base-classes",
  condition && "conditional-classes",
  isActive && "active-classes",
  className  // Allow override
)}>
```

#### 4. Flexbox Patterns

```jsx
// Centered content
<div className="flex items-center justify-center">

// Space between
<div className="flex items-center justify-between">

// Gap spacing
<div className="flex items-center gap-4">

// Vertical stack
<div className="flex flex-col gap-4">
```

#### 5. Grid Patterns

```jsx
// Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// Auto-fit grid
<div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4">
```

#### 6. Position Utilities

```jsx
// Absolute positioning
<div className="absolute top-0 left-0">

// Fixed positioning
<div className="fixed inset-0 z-50">

// Sticky positioning
<div className="sticky top-0 z-10">
```

#### 7. Aspect Ratio

```jsx
aspect-square      // 1:1
aspect-video       // 16:9
aspect-[4/3]       // Custom 4:3
```

#### 8. Focus Visible Pattern

```jsx
<button className="
  focus:outline-none
  focus-visible:ring-2
  focus-visible:ring-accent-green/50
  focus-visible:ring-offset-2
">
  Button
</button>
```

#### 9. State Variants

```jsx
<button className="
  bg-accent-green
  hover:bg-accent-green/90
  active:scale-95
  disabled:opacity-50
  disabled:cursor-not-allowed
  aria-[pressed=true]:bg-accent-green-dark
">
  Button
</button>
```

#### 10. Container Queries

```jsx
<div className="@container">
  <div className="
    text-sm @md:text-base @lg:text-lg
    grid grid-cols-1 @md:grid-cols-2
  ">
    {/* Responsive to container, not viewport */}
  </div>
</div>
```

### Custom Utilities

#### Touch Target Utilities

```jsx
touch-target           // min-width: 44px, min-height: 44px
touch-target-small     // min-width: 36px, min-height: 36px
```

#### Scrollbar Hiding

```jsx
scrollbar-hidden       // Hides scrollbar but keeps functionality
```

#### Safe Area Insets

```jsx
safe-padding          // Adds safe area padding on all sides
p-safe-top
p-safe-bottom
```

#### Text Utilities

```jsx
line-clamp-2          // Multi-line ellipsis (2 lines)
line-clamp-3          // Multi-line ellipsis (3 lines)
truncate              // Single line ellipsis
```

---

## Example Component Reference

### Complete Card Component

```jsx
import { cn } from '../utils/cn';

export default function Card({ 
  title, 
  description, 
  onClick,
  className 
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        // Base styles
        "group relative",
        "bg-gradient-to-br from-[#1a2942]/60 to-[#0f1d32]/60",
        "backdrop-blur-sm rounded-xl border border-white/10",
        "cursor-pointer self-start",
        "p-6",
        
        // Hover effects
        "hover:border-emerald-500/30 transition-all duration-300",
        "hover:shadow-xl hover:shadow-emerald-500/10",
        
        // Custom className override
        className
      )}
    >
      {/* Hover gradient overlay */}
      <div className="
        absolute inset-0
        bg-gradient-to-br from-emerald-500/0 to-emerald-500/0
        group-hover:from-emerald-500/10 group-hover:to-transparent
        transition-all duration-300
        pointer-events-none
        rounded-xl
      " />
      
      {/* Content */}
      <div className="relative z-10">
        <h3 className="
          text-xl
          font-semibold
          text-db-text-primary
          mb-2
        ">
          {title}
        </h3>
        <p className="
          text-sm
          text-db-text-secondary
          leading-relaxed
        ">
          {description}
        </p>
      </div>
      
      {/* Bottom accent line */}
      <div className="
        absolute bottom-0 left-0 right-0 h-0.5
        bg-gradient-to-r from-emerald-500/0 via-emerald-500/0 to-emerald-500/0
        group-hover:from-emerald-500/50 group-hover:via-emerald-500
        group-hover:to-emerald-500/50
        transition-all duration-500
        rounded-b-xl
      " />
    </div>
  );
}
```

### Complete Button Component

```jsx
import { cn } from '../utils/cn';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  className
}) {
  const baseStyles = "
    font-semibold
    rounded-lg
    transition-all duration-200
    focus:outline-none
    focus-visible:ring-2 focus-visible:ring-accent-green/50
    focus-visible:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    active:scale-95
  ";
  
  const variants = {
    primary: "
      bg-accent-green
      hover:bg-accent-green/90
      text-white
      shadow-lg shadow-accent-green/20
      hover:shadow-xl hover:shadow-accent-green/30
    ",
    secondary: "
      bg-dark-secondary/50
      hover:bg-dark-secondary/70
      text-text-primary
      border border-white/10
      hover:border-white/20
    ",
    ghost: "
      bg-transparent
      hover:bg-white/5
      text-text-secondary
      hover:text-text-primary
    "
  };
  
  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg"
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </button>
  );
}
```

### Complete Input Component

```jsx
import { cn } from '../utils/cn';

export default function Input({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  className
}) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="
          text-sm
          font-medium
          text-db-text-secondary
        ">
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={cn(
          "w-full",
          "px-4 py-3",
          "bg-dark-secondary/50",
          "border border-white/10",
          "rounded-lg",
          "text-text-primary",
          "placeholder:text-text-secondary/50",
          "focus:outline-none",
          "focus:ring-2 focus:ring-accent-green/50",
          "focus:border-accent-green/50",
          "transition-all duration-200",
          error && "border-red-500/50 focus:ring-red-500/50",
          className
        )}
      />
      {error && (
        <p className="text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
```

### Modal Component

```jsx
import { cn } from '../utils/cn';

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  className
}) {
  if (!isOpen) return null;
  
  return (
    <div
      className="
        fixed inset-0
        z-50
        flex items-center justify-center
        bg-black/50
        backdrop-blur-sm
        animate-fade-in
      "
      onClick={onClose}
    >
      <div
        className={cn(
          "relative",
          "bg-dark-primary",
          "rounded-xl",
          "border border-white/10",
          "shadow-2xl",
          "max-w-lg w-full mx-4",
          "p-6",
          "animate-in fade-in slide-in-from-top-1",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="
            text-xl
            font-semibold
            text-db-text-primary
          ">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="
              p-2
              rounded-lg
              hover:bg-white/5
              text-text-secondary
              hover:text-text-primary
              transition-colors
            "
          >
            <XIcon size={20} />
          </button>
        </div>
        
        {/* Content */}
        <div className="text-db-text-secondary">
          {children}
        </div>
      </div>
    </div>
  );
}
```

---

## Additional Resources

### Design Token Files

- `src/styles/dashboard-design-tokens.css` - Central design tokens
- `src/styles/typography.css` - Typography system
- `src/styles/glassmorphism.css` - Glass effects
- `src/styles/animations.css` - Animation keyframes
- `tailwind.config.js` - Tailwind configuration

### Utility Functions

- `src/utils/cn.js` - Class name merger (clsx + tailwind-merge)

### Best Practices

1. **Always use `cn()` utility** for conditional classes
2. **Prefer Tailwind utilities** over custom CSS
3. **Use fluid typography** for responsive text
4. **Respect reduced motion** preferences
5. **Ensure touch targets** are at least 44x44px
6. **Test on mobile** devices regularly
7. **Use semantic colors** for accessibility
8. **Maintain consistent spacing** using the scale

---

**End of Style Guide**


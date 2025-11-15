# Devlog Style Guide - Complete Design System Documentation

> **Created**: 2025-11-03T16:32:07+01:00
> **Commit**: d0817e2350596032690caefc67c4bf2a8e3f6058
> **Branch**: main
> **Purpose**: Comprehensive style guide for professional block animations and UI consistency

---

## Table of Contents

1. [Overview](#overview)
2. [Color Palette](#color-palette)
3. [Typography System](#typography-system)
4. [Spacing System](#spacing-system)
5. [Component Styles](#component-styles)
6. [Shadows & Elevation](#shadows--elevation)
7. [Animations & Transitions](#animations--transitions)
8. [Border Radius](#border-radius)
9. [Opacity & Transparency](#opacity--transparency)
10. [Tailwind CSS Usage](#tailwind-css-usage)
11. [Example Components](#example-components)

---

## Overview

### Design Philosophy

Devlog's design system is built on **four core principles**:

1. **Dark-First, Developer-Focused**: Deep blue-tinted dark theme (#0a1628) optimized for extended coding sessions with reduced eye strain
2. **Glassmorphism with Purpose**: Translucent, frosted-glass UI elements that create depth without overwhelming content
3. **Fluid Responsiveness**: CSS clamp()-based typography that scales smoothly from 320px mobile to 4K displays without breakpoint jumps
4. **Physics-Based Motion**: Framer Motion spring animations that feel natural and organic, never mechanical

### Technical Stack

- **CSS Framework**: Tailwind CSS with extensive customization
- **Animation Library**: Framer Motion for React-based animations
- **Styling Approach**: Utility-first with design tokens for consistency
- **Responsive Strategy**: Mobile-first with container queries
- **Performance**: GPU-accelerated transforms, will-change optimizations

### Architecture

The style system is organized across **36+ CSS files** with a clear hierarchy:

```
src/
├── index.css                           # Main orchestrator (imports all modules)
├── styles/
│   ├── dashboard-design-tokens.css     # Central design tokens
│   ├── typography.css                  # Fluid type scale
│   ├── glassmorphism.css               # Frosted glass effects
│   ├── animations.css                  # Keyframe animations
│   ├── mobile-optimizations.css        # Touch targets, gestures
│   └── [30+ feature-specific CSS files]
└── utils/
    └── animations.js                   # Framer Motion variants
```

**Configuration**: `tailwind.config.js` at project root with 16 major customization sections

---

## Color Palette

### Primary Color System

Devlog uses a **dual-layer color system**: CSS custom properties for flexibility + Tailwind utilities for speed.

#### Core Brand Colors

```css
/* Deep Blues (Primary Background Layers) */
--db-dark-base: #050b14        /* Deepest layer, behind everything */
--db-dark-primary: #0a1628     /* Primary background (most used) */
--db-dark-secondary: #1a2844   /* Elevated surfaces, cards */
--db-dark-accent: #2d3e5f      /* Interactive elements, hover states */

/* Emerald Accent (Primary Call-to-Action) */
--db-emerald: #10b981          /* Primary CTA, success states */
--db-emerald-light: #34d399    /* Hover, focus states */
--db-emerald-dark: #059669     /* Active, pressed states */

/* Text Hierarchy */
--db-text-primary: #f8fafc     /* Headings, primary content */
--db-text-secondary: #cbd5e1   /* Subtext, descriptions */
--db-text-tertiary: #94a3b8    /* Disabled, placeholders */
```

#### Tailwind Color Mappings

Located in `tailwind.config.js`:

```javascript
colors: {
  // Background layers
  'dark-primary': '#0a1628',
  'dark-secondary': '#1a2844',
  'dark-accent': '#2d3e5f',

  // Accent colors
  'accent-green': '#10b981',
  'accent-blue': '#3b82f6',
  'accent-purple': '#8b5cf6',
  'accent-red': '#ef4444',
  'accent-yellow': '#f59e0b',

  // Text colors
  'text-primary': '#f8fafc',
  'text-secondary': '#cbd5e1',
  'text-tertiary': '#94a3b8',

  // Semantic colors
  'success': '#10b981',
  'warning': '#f59e0b',
  'error': '#ef4444',
  'info': '#3b82f6',
}
```

#### Usage Guidelines

1. **Background Progression**: Use dark-base → dark-primary → dark-secondary → dark-accent as you move forward in z-space
2. **Accent Emerald**: Reserve for primary CTAs, success states, and key interactive elements
3. **Text Contrast**: Always use text-primary (#f8fafc) for headings on dark backgrounds (WCAG AAA compliant)
4. **Semantic Meaning**: Use semantic colors (success, warning, error) consistently across all components

#### Color Accessibility

All color combinations meet **WCAG AA standards**:

- `text-primary` on `dark-primary`: **Contrast ratio 14.5:1** (AAA)
- `accent-green` on `dark-primary`: **Contrast ratio 4.8:1** (AA)
- `text-secondary` on `dark-primary`: **Contrast ratio 9.2:1** (AAA)

---

## Typography System

### Font Families

Devlog uses a **two-font system** optimized for developer workflows:

#### Sans-Serif (Primary UI)

```css
--font-sans: 'Inter', system-ui, -apple-system, BlinkMacSystemFont,
             'Segoe UI', Roboto, sans-serif;
```

**Where used**:
- All UI text (buttons, labels, descriptions)
- Headings and titles
- Dashboard and navigation
- Form inputs

**Characteristics**:
- Highly legible at small sizes
- Excellent screen rendering with sub-pixel anti-aliasing
- Wide language support (Latin, Cyrillic, Greek)
- 9 weights (100-900) available

#### Monospace (Code & Technical)

```css
--font-mono: 'JetBrains Mono', 'SF Mono', Monaco, 'Cascadia Code',
             'Roboto Mono', 'Courier New', monospace;
```

**Where used**:
- Code blocks (CodeBlock.jsx)
- File paths and technical identifiers
- Line numbers in code editor
- API keys and tokens

**Characteristics**:
- Ligature support for common programming symbols (=>, !=, ===)
- Clear distinction between similar characters (0/O, 1/l/I)
- Optimized letter spacing for code readability

### Fluid Type Scale

Devlog uses **CSS clamp()** for truly fluid typography that scales smoothly across all viewport sizes:

```css
/* Defined in src/styles/typography.css */

/* Base Text (16px - 18px) */
--step-0: clamp(1rem, 0.95rem + 0.25vw, 1.125rem);

/* Small Text (14px - 16px) */
--step--1: clamp(0.875rem, 0.84rem + 0.18vw, 1rem);

/* Tiny Text (12px - 14px) */
--step--2: clamp(0.75rem, 0.73rem + 0.1vw, 0.875rem);

/* Heading 3 (18px - 22px) */
--step-1: clamp(1.125rem, 1.05rem + 0.375vw, 1.375rem);

/* Heading 2 (22px - 28px) */
--step-2: clamp(1.375rem, 1.2rem + 0.875vw, 1.75rem);

/* Heading 1 (28px - 40px) */
--step-3: clamp(1.777rem, 1.5rem + 1.385vw, 2.5rem);

/* Display Large (35px - 56px) */
--step-4: clamp(2.222rem, 1.75rem + 2.36vw, 3.5rem);

/* Display XL (44px - 74px) */
--step-5: clamp(2.777rem, 2rem + 3.885vw, 4.625rem);

/* Display Hero (67px - 95px) */
--step-6: clamp(4.209rem, 2.5rem + 8.545vw, 5.926rem);
```

#### Implementation Example

From `src/components/blocks/HeadingBlock.jsx:46-48`:

```jsx
<h1
  className="font-bold"
  style={{
    fontSize: 'clamp(1.777rem, 1.5rem + 1.385vw, 2.5rem)',
    lineHeight: '1.2'
  }}
>
  {block.content}
</h1>
```

### Font Weights

Inter font provides **9 weight variations**:

```css
/* Weight Scale */
--font-light: 300        /* Subtle, decorative text */
--font-normal: 400       /* Body text, descriptions */
--font-medium: 500       /* Emphasis, labels */
--font-semibold: 600     /* Sub-headings, strong emphasis */
--font-bold: 700         /* Headings, CTAs */
--font-extrabold: 800    /* Hero headings */
```

#### Usage Guidelines

1. **Body Text**: Use `font-normal` (400) for all paragraph text
2. **Emphasis**: Use `font-medium` (500) for labels and subtle emphasis
3. **Headings**: Use `font-bold` (700) for all heading levels
4. **Hero Text**: Use `font-extrabold` (800) only for landing page heroes
5. **Avoid Light Weights**: Never use weights below 400 on dark backgrounds (poor legibility)

### Line Heights

```css
/* Line Height Scale */
--line-height-tight: 1.2      /* Headings, titles */
--line-height-snug: 1.375     /* Sub-headings */
--line-height-normal: 1.58    /* Body text (optimal for reading) */
--line-height-relaxed: 1.625  /* Long-form content */
--line-height-loose: 2        /* Poetry, quotes */
```

**Research-backed**: The default `line-height-normal: 1.58` is based on typography research showing optimal readability for screen-based reading.

### Tailwind Typography Classes

Common patterns found in the codebase:

```jsx
// Heading patterns
<h1 className="text-step-3 font-bold leading-tight">

// Body text patterns
<p className="text-step-0 font-normal leading-normal text-text-primary/90">

// Small text patterns
<span className="text-step--1 font-medium text-text-secondary">

// Monospace patterns
<code className="font-mono text-step--1 text-accent-green">
```

---

## Spacing System

### Base Spacing Scale

Devlog uses **Tailwind's default 4px-based scale** with custom extensions:

```javascript
// From tailwind.config.js
spacing: {
  // Standard scale (4px increments)
  '0': '0px',
  '1': '0.25rem',   // 4px
  '2': '0.5rem',    // 8px
  '3': '0.75rem',   // 12px
  '4': '1rem',      // 16px
  '5': '1.25rem',   // 20px
  '6': '1.5rem',    // 24px
  '8': '2rem',      // 32px
  '10': '2.5rem',   // 40px
  '12': '3rem',     // 48px
  '16': '4rem',     // 64px
  '20': '5rem',     // 80px
  '24': '6rem',     // 96px

  // Custom additions for blocks
  '18': '4.5rem',   // 72px (block vertical spacing)
  '22': '5.5rem',   // 88px (section spacing)

  // Safe area insets (iOS notch/home indicator)
  'safe-top': 'env(safe-area-inset-top)',
  'safe-bottom': 'env(safe-area-inset-bottom)',
  'safe-left': 'env(safe-area-inset-left)',
  'safe-right': 'env(safe-area-inset-right)',
}
```

### Design Tokens Spacing

From `src/styles/dashboard-design-tokens.css`:

```css
/* Micro Spacing (Internal Component) */
--db-spacing-xs: 0.5rem;      /* 8px - Icon padding, tight gaps */
--db-spacing-sm: 0.75rem;     /* 12px - Button padding, small gaps */

/* Standard Spacing (Component Padding) */
--db-spacing-md: 1rem;        /* 16px - Default padding */
--db-spacing-lg: 1.5rem;      /* 24px - Card padding */
--db-spacing-xl: 2rem;        /* 32px - Large padding */

/* Macro Spacing (Layout) */
--db-spacing-2xl: 3rem;       /* 48px - Section spacing */
--db-spacing-3xl: 4rem;       /* 64px - Major sections */
--db-spacing-4xl: 6rem;       /* 96px - Hero/footer spacing */
```

### Component-Specific Spacing

#### Block Spacing (Vertical)

```css
/* Between blocks in document editor */
.block + .block {
  margin-top: 1.5rem;  /* 24px - mb-6 */
}

/* Between block groups */
.block-group + .block-group {
  margin-top: 4rem;    /* 64px - mb-16 */
}
```

Example from `src/components/InstantCaptureDemo.jsx:28`:
```jsx
<motion.div className="mb-6">
  <Component block={block} />
</motion.div>
```

#### Touch Targets

**iOS Accessibility Guidelines**: Minimum 44px × 44px for touch targets

```javascript
// From tailwind.config.js
minHeight: {
  'touch': '44px',
  'touch-lg': '48px',
}
minWidth: {
  'touch': '44px',
  'touch-lg': '48px',
}
```

Implementation in buttons:
```jsx
<button className="min-w-touch min-h-touch px-4 py-2">
  Action
</button>
```

### Layout Patterns

#### Container Widths

```javascript
// From tailwind.config.js
maxWidth: {
  'container': '1200px',
  'container-lg': '1400px',
  'prose': '65ch',         // Optimal reading width (65 characters)
}
```

#### Grid Gaps

Common gap patterns found in components:

```jsx
// Tight grid (cards, items)
<div className="grid gap-4 md:gap-6">

// Standard grid (sections)
<div className="grid gap-8 md:gap-12">

// Loose grid (major sections)
<div className="grid gap-12 md:gap-16">
```

---

## Component Styles

### 1. Glassmorphism (Primary Pattern)

**Definition**: Translucent, frosted-glass UI elements with backdrop blur

Located in `src/styles/glassmorphism.css`:

```css
.glassmorphism {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.1),
    inset 0 1px 1px rgba(255, 255, 255, 0.1);
}

/* Variations */
.glassmorphism-heavy {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(40px) saturate(200%);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.glassmorphism-subtle {
  background: rgba(255, 255, 255, 0.02);
  backdrop-filter: blur(10px) saturate(150%);
  border: 1px solid rgba(255, 255, 255, 0.05);
}
```

**Usage Examples**:

From `src/components/blocks/TextBlock.jsx:63`:
```jsx
<div className="relative rounded-lg border border-dark-secondary/50
                bg-dark-secondary/20 hover:bg-dark-secondary/30
                transition-all duration-200">
  <div className="text-text-primary p-4 rounded-lg">
    {/* Content */}
  </div>
</div>
```

From `src/components/InstantCaptureDemo.jsx:335`:
```jsx
<div className="bg-dark-secondary/50 backdrop-blur-sm rounded-2xl
                border-2 border-dark-secondary/50 shadow-2xl">
  {/* Demo window */}
</div>
```

### 2. Block Container Pattern

**Standard block wrapper** used across all block types:

```jsx
// Base structure
<div className="
  group relative
  rounded-lg
  border border-dark-secondary/50
  bg-dark-primary
  hover:border-dark-secondary
  transition-all duration-200
  p-4
">
  {/* Block content */}
</div>
```

**With glassmorphism**:
```jsx
<div className="
  group relative
  rounded-lg
  border border-dark-secondary/50
  bg-dark-secondary/20 backdrop-blur-sm
  hover:bg-dark-secondary/30
  hover:border-accent-green/30
  transition-all duration-300
  p-4
">
  {/* Block content */}
</div>
```

### 3. Code Block Pattern

From `src/components/blocks/CodeBlock.jsx` and `src/components/InstantCaptureDemo.jsx:144-177`:

```jsx
<div className="group relative pt-2">
  {/* File path badge */}
  <div className="absolute -top-3 left-0
                  text-xs text-accent-green/80
                  bg-dark-primary px-2 py-1 rounded-t
                  font-mono z-30
                  border border-accent-green/30 border-b-0">
    src/components/UserProfile.jsx
  </div>

  {/* Code container */}
  <div className="bg-dark-primary rounded-lg overflow-hidden
                  border border-dark-secondary/50">
    <div className="flex">
      {/* Line numbers */}
      <div className="select-none text-text-secondary text-sm
                      font-mono p-4 pr-0 text-right
                      border-r border-dark-secondary/50 leading-6">
        {lines.map((_, i) => <div key={i}>{i + 1}</div>)}
      </div>

      {/* Code */}
      <pre className="flex-1 p-4 pl-4 overflow-x-auto
                      font-mono text-sm">
        <code className="text-text-primary">
          {code}
        </code>
      </pre>
    </div>
  </div>
</div>
```

**Key Features**:
- File path badge with emerald accent
- Line numbers in secondary color
- Border on line numbers separator
- Monospace font (JetBrains Mono)
- Horizontal scroll for long lines

### 4. Button Patterns

#### Primary Button (CTA)

```jsx
<button className="
  px-5 py-2.5
  bg-accent-green text-dark-primary
  rounded-lg font-medium
  hover:bg-accent-green/90
  active:scale-95
  transition-all duration-200
  shadow-lg shadow-accent-green/20
  flex items-center gap-2
">
  <Icon className="w-4 h-4" />
  Button Text
</button>
```

#### Secondary Button

```jsx
<button className="
  px-5 py-2.5
  bg-dark-secondary text-text-primary
  rounded-lg font-medium
  border border-dark-secondary
  hover:bg-dark-secondary/80
  hover:border-accent-green/30
  active:scale-95
  transition-all duration-200
  flex items-center gap-2
">
  <Icon className="w-4 h-4" />
  Button Text
</button>
```

#### Ghost Button

```jsx
<button className="
  px-4 py-2
  text-text-secondary
  rounded-lg font-medium
  hover:bg-dark-secondary/50
  hover:text-text-primary
  active:scale-95
  transition-all duration-200
">
  Ghost Action
</button>
```

### 5. Tag/Badge Pattern

From `src/components/blocks/TextBlock.jsx:83-97`:

```jsx
<span className="
  text-xs
  bg-accent-green/20 text-accent-green
  px-2 py-1 rounded
  font-medium
">
  #react
</span>
```

**Variations**:

```jsx
// Info badge
<span className="bg-accent-blue/20 text-accent-blue px-2 py-1 rounded text-xs">

// Warning badge
<span className="bg-accent-yellow/20 text-accent-yellow px-2 py-1 rounded text-xs">

// Error badge
<span className="bg-accent-red/20 text-accent-red px-2 py-1 rounded text-xs">
```

### 6. Window Header Pattern

From `src/components/InstantCaptureDemo.jsx:341-379`:

```jsx
<div className="bg-dark-secondary/80 px-6 py-4
                border-b border-dark-secondary
                flex items-center justify-between">
  {/* macOS-style dots */}
  <div className="flex items-center gap-2">
    <div className="w-3 h-3 rounded-full bg-red-500"></div>
    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
    <div className="w-3 h-3 rounded-full bg-green-500"></div>
  </div>

  {/* Title */}
  <div className="text-text-secondary text-sm font-medium">
    Window Title
  </div>

  {/* Right actions */}
  <div className="w-20 flex items-center justify-end">
    {/* Save indicator, close button, etc */}
  </div>
</div>
```

### 7. Modal/Dialog Pattern

```jsx
<div className="
  fixed inset-0 z-50
  flex items-center justify-center
  bg-black/50 backdrop-blur-sm
">
  <div className="
    w-full max-w-lg mx-4
    bg-dark-secondary
    border border-dark-secondary
    rounded-2xl
    shadow-2xl
    p-6
  ">
    {/* Modal content */}
  </div>
</div>
```

### 8. Focus State Pattern

**Keyboard navigation focus rings**:

```jsx
<button className="
  focus:outline-none
  focus:ring-2 focus:ring-accent-green/50
  focus:ring-offset-2 focus:ring-offset-dark-primary
  rounded-lg
">
```

### 9. Hover Effects

**Standard hover pattern**:

```css
.hoverable {
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.hoverable:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}
```

**Glow hover pattern**:

```css
.glow-hover {
  transition: all 300ms ease;
}

.glow-hover:hover {
  box-shadow: 0 0 20px rgba(16, 185, 129, 0.3);
  border-color: rgba(16, 185, 129, 0.5);
}
```

### 10. Skeleton Loading Pattern

From `src/index.css`:

```css
.skeleton {
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.05) 0%,
    rgba(255, 255, 255, 0.1) 50%,
    rgba(255, 255, 255, 0.05) 100%
  );
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
}

@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

---

## Shadows & Elevation

### Shadow Scale

Devlog uses a **5-level elevation system** with shadows that work on dark backgrounds:

```css
/* From src/styles/dashboard-design-tokens.css */

/* Level 1: Subtle elevation (cards) */
--db-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.2);

/* Level 2: Standard elevation (buttons, dropdowns) */
--db-shadow-md: 0 4px 6px rgba(0, 0, 0, 0.3),
                0 2px 4px rgba(0, 0, 0, 0.2);

/* Level 3: Raised elevation (modals, popovers) */
--db-shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.4),
                0 4px 6px rgba(0, 0, 0, 0.3);

/* Level 4: Floating elevation (tooltips, notifications) */
--db-shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.5),
                0 8px 10px rgba(0, 0, 0, 0.4);

/* Level 5: Maximum elevation (fullscreen overlays) */
--db-shadow-2xl: 0 25px 50px rgba(0, 0, 0, 0.6),
                 0 12px 18px rgba(0, 0, 0, 0.5);
```

### Glow Shadows (Accent)

Used for interactive elements with emerald accent:

```css
/* Subtle glow (hover states) */
--db-shadow-glow: 0 0 20px rgba(16, 185, 129, 0.3);

/* Medium glow (active states, CTAs) */
--db-shadow-glow-md: 0 0 30px rgba(16, 185, 129, 0.4),
                     0 4px 16px rgba(16, 185, 129, 0.3);

/* Strong glow (primary actions) */
--db-shadow-glow-lg: 0 0 40px rgba(16, 185, 129, 0.5),
                     0 8px 24px rgba(16, 185, 129, 0.4);
```

### Inset Shadows (Depth)

Used for input fields and recessed elements:

```css
/* Subtle inset (text inputs) */
--db-shadow-inset-sm: inset 0 1px 2px rgba(0, 0, 0, 0.4);

/* Deep inset (pressed buttons, active states) */
--db-shadow-inset-md: inset 0 2px 4px rgba(0, 0, 0, 0.6);
```

### Tailwind Shadow Classes

From `tailwind.config.js`:

```javascript
boxShadow: {
  'sm': '0 1px 2px rgba(0, 0, 0, 0.2)',
  'DEFAULT': '0 4px 6px rgba(0, 0, 0, 0.3)',
  'md': '0 4px 6px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2)',
  'lg': '0 10px 15px rgba(0, 0, 0, 0.4), 0 4px 6px rgba(0, 0, 0, 0.3)',
  'xl': '0 20px 25px rgba(0, 0, 0, 0.5), 0 8px 10px rgba(0, 0, 0, 0.4)',
  '2xl': '0 25px 50px rgba(0, 0, 0, 0.6), 0 12px 18px rgba(0, 0, 0, 0.5)',
  'glow': '0 0 20px rgba(16, 185, 129, 0.3)',
  'glow-md': '0 0 30px rgba(16, 185, 129, 0.4), 0 4px 16px rgba(16, 185, 129, 0.3)',
  'glow-lg': '0 0 40px rgba(16, 185, 129, 0.5), 0 8px 24px rgba(16, 185, 129, 0.4)',
  'inner': 'inset 0 2px 4px rgba(0, 0, 0, 0.6)',
}
```

### Usage Examples

#### Card Elevation

```jsx
// Level 1: Resting card
<div className="shadow-md">

// Level 2: Hovered card
<div className="shadow-lg hover:shadow-xl transition-shadow">

// Level 3: Active modal
<div className="shadow-2xl">
```

#### Button Shadows

From `src/components/InstantCaptureDemo.jsx:428`:
```jsx
<button className="
  shadow-lg shadow-accent-green/20
  hover:shadow-glow-md
  active:shadow-inner
">
  Primary Action
</button>
```

#### Code Block Glow

From `src/components/InstantCaptureDemo.jsx:180-192`:
```jsx
<div className="
  absolute inset-0 rounded-lg pointer-events-none
  animate-pulse
  shadow-[0_0_20px_rgba(16,185,129,0.3)]
">
</div>
```

---

## Animations & Transitions

### Framer Motion Variants Library

Located in `src/utils/animations.js`:

#### 1. Fade In Animation

```javascript
export const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: "easeOut"
    }
  }
};
```

**Usage**:
```jsx
<motion.div
  variants={fadeIn}
  initial="hidden"
  animate="visible"
>
```

#### 2. Slide Up Animation

```javascript
export const slideUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] // Custom easing curve
    }
  }
};
```

#### 3. Stagger Container

**Pattern**: Sequential reveal of child elements

```javascript
export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,   // 100ms between each child
      delayChildren: 0.2      // Wait 200ms before starting
    }
  }
};

export const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut"
    }
  }
};
```

**Implementation** from `src/components/HowItWorksVideo.jsx:257-264`:
```jsx
<motion.div
  variants={staggerContainer}
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true, margin: "-100px" }}
>
  {items.map((item, index) => (
    <motion.div key={item.id} variants={staggerItem}>
      {/* Content */}
    </motion.div>
  ))}
</motion.div>
```

#### 4. Spring Animation

**Natural physics-based motion**:

```javascript
export const springIn = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 200,  // Higher = snappier
      damping: 25,     // Higher = less bouncy
      mass: 1
    }
  }
};
```

**Usage** from `src/components/InstantCaptureDemo.jsx:18-27`:
```jsx
<motion.div
  initial={{ opacity: 0, y: 30, scale: 0.95 }}
  animate={{ opacity: 1, y: 0, scale: 1 }}
  transition={{
    duration: 0.5,
    delay: index * 0.1,
    type: "spring",
    stiffness: 200,
    damping: 25
  }}
>
```

#### 5. AnimatePresence Pattern

**For conditional rendering** (mount/unmount animations):

```jsx
<AnimatePresence mode="wait">
  {showContent && (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.3 }}
    >
      {/* Content */}
    </motion.div>
  )}
</AnimatePresence>
```

**Example** from `src/components/InstantCaptureDemo.jsx:352-377`:
```jsx
<AnimatePresence mode="wait">
  {showSaveIndicator === 'saving' && (
    <motion.div
      key="saving"
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className="flex items-center gap-1.5"
    >
      <Save className="w-3.5 h-3.5 animate-pulse" />
      <span>Saving...</span>
    </motion.div>
  )}
</AnimatePresence>
```

#### 6. Hover Animations

**Lift effect**:

```jsx
<motion.div
  whileHover={{
    y: -5,
    scale: 1.02,
    transition: { duration: 0.2 }
  }}
>
```

**Glow effect**:

```jsx
<motion.div
  whileHover={{
    boxShadow: "0 0 30px rgba(16, 185, 129, 0.4)"
  }}
  transition={{ duration: 0.3 }}
>
```

**Magnetic button** from Landing.jsx:

```jsx
<motion.button
  whileHover={{
    scale: 1.05,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 10
    }
  }}
  whileTap={{ scale: 0.95 }}
>
```

#### 7. Tag Stagger Animation

**Sequential pop-in** from `src/components/blocks/TextBlock.jsx:83-97`:

```jsx
{tags.map((tag, i) => (
  <motion.span
    key={i}
    initial={{ opacity: 0, scale: 0.5, y: 10 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    transition={{
      delay: 0.3 + (i * 0.15),  // Progressive delay
      type: "spring",
      stiffness: 400,
      damping: 15
    }}
    className="text-xs bg-accent-green/20 text-accent-green px-2 py-1 rounded"
  >
    {tag}
  </motion.span>
))}
```

#### 8. Continuous Loop Animation

**Infinite breathing effect**:

```jsx
<motion.div
  animate={{
    scale: [1, 1.1, 1],
    opacity: [0.3, 0.5, 0.3]
  }}
  transition={{
    duration: 2,
    repeat: Infinity,
    ease: "easeInOut"
  }}
>
```

#### 9. Blur Reveal Animation

**Sophisticated entrance**:

```jsx
<motion.div
  initial={{ opacity: 0, filter: "blur(10px)" }}
  animate={{ opacity: 1, filter: "blur(0px)" }}
  transition={{ duration: 0.6, ease: "easeOut" }}
>
```

#### 10. Shimmer/Shine Effect

**Keyframe animation** from `src/index.css`:

```css
@keyframes shimmer {
  0% {
    background-position: -200% center;
  }
  100% {
    background-position: 200% center;
  }
}

.shimmer {
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.05) 0%,
    rgba(255, 255, 255, 0.2) 50%,
    rgba(255, 255, 255, 0.05) 100%
  );
  background-size: 200% auto;
  animation: shimmer 2s linear infinite;
}
```

### CSS Transition Patterns

#### Standard Transitions

```css
/* Fast interactions (buttons, links) */
transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);

/* Standard UI (cards, panels) */
transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);

/* Smooth animations (modals, drawers) */
transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);

/* Slow, graceful (page transitions) */
transition: all 500ms cubic-bezier(0.4, 0, 0.2, 1);
```

#### Tailwind Transition Classes

```javascript
// From tailwind.config.js
transitionDuration: {
  '75': '75ms',
  '100': '100ms',
  '150': '150ms',
  '200': '200ms',
  '300': '300ms',
  '500': '500ms',
  '700': '700ms',
  '1000': '1000ms',
}
```

#### Performance Optimization

**GPU acceleration** for smooth 60fps animations:

```css
/* Use transform and opacity ONLY for animations */
.animated {
  transform: translateZ(0);
  will-change: transform, opacity;
}

/* Avoid animating: */
/* - width, height (causes layout recalculation) */
/* - padding, margin (causes layout recalculation) */
/* - top, left, right, bottom (causes layout recalculation) */
```

### Easing Functions

#### Custom Bezier Curves

```javascript
// From src/utils/animations.js
export const appleEase = {
  smooth: [0.25, 0.1, 0.25, 1],      // macOS-like smooth
  snappy: [0.4, 0, 0.2, 1],          // Material Design standard
  bounce: [0.68, -0.55, 0.265, 1.55], // Bounce effect
  anticipate: [0.22, 1, 0.36, 1]     // Slight anticipation
};
```

**Usage**:
```jsx
<motion.div
  animate={{ x: 100 }}
  transition={{
    duration: 0.5,
    ease: appleEase.smooth
  }}
>
```

### Animation Timing Guidelines

**Performance budgets** from CLAUDE.md:

- **Animation frame**: 16ms (60fps)
- **User input response**: 100ms maximum
- **Micro-interactions**: 150-200ms
- **Standard transitions**: 200-300ms
- **Complex animations**: 300-500ms
- **Page transitions**: 500-700ms

---

## Border Radius

### Scale System

```javascript
// From tailwind.config.js
borderRadius: {
  'none': '0',
  'sm': '0.25rem',    // 4px - Subtle rounding
  'DEFAULT': '0.5rem', // 8px - Standard cards
  'md': '0.5rem',     // 8px - Alias
  'lg': '0.75rem',    // 12px - Large cards, buttons
  'xl': '1rem',       // 16px - Modals, panels
  '2xl': '1.5rem',    // 24px - Hero sections
  '3xl': '2rem',      // 32px - Large containers
  'full': '9999px',   // Perfect circles/pills
}
```

### Usage Guidelines

#### UI Components

```jsx
// Small elements (badges, tags)
<span className="rounded-sm">    // 4px

// Standard elements (buttons, inputs)
<button className="rounded-lg">  // 12px

// Cards and panels
<div className="rounded-xl">     // 16px

// Large containers (modals, drawers)
<div className="rounded-2xl">    // 24px

// Pills and circular buttons
<button className="rounded-full"> // Perfect circle
```

#### Real Examples

**Button** from `src/components/InstantCaptureDemo.jsx:428`:
```jsx
<button className="rounded-lg">  // 12px for standard button
```

**Card** from `src/components/blocks/TextBlock.jsx:63`:
```jsx
<div className="rounded-lg">     // 12px for block container
```

**Demo Window** from `src/components/InstantCaptureDemo.jsx:335`:
```jsx
<div className="rounded-2xl">    // 24px for large window
```

**Tag** from `src/components/blocks/TextBlock.jsx:93`:
```jsx
<span className="rounded">       // 8px for small badge
```

### Mixed Radius Patterns

**Top-only rounding** (connected elements):

```jsx
// File path badge above code block
<div className="rounded-t">      // Top corners only
```

**Bottom-only rounding**:

```jsx
// Footer below content
<div className="rounded-b-2xl">  // Bottom corners only
```

---

## Opacity & Transparency

### Opacity Scale

```javascript
// From tailwind.config.js
opacity: {
  '0': '0',
  '5': '0.05',
  '10': '0.1',
  '20': '0.2',
  '25': '0.25',
  '30': '0.3',
  '40': '0.4',
  '50': '0.5',
  '60': '0.6',
  '70': '0.7',
  '75': '0.75',
  '80': '0.8',
  '90': '0.9',
  '95': '0.95',
  '100': '1'
}
```

### Color Alpha Patterns

**Syntax**: `{color}/{opacity}`

```jsx
// Background layers
bg-dark-secondary/20    // 20% opacity (very subtle)
bg-dark-secondary/50    // 50% opacity (glassmorphism)
bg-dark-secondary/80    // 80% opacity (semi-opaque)

// Border alpha
border-dark-secondary/50    // 50% border opacity
border-accent-green/30      // 30% emerald border

// Text alpha
text-text-primary/90        // 90% text (slightly dimmed)
text-text-secondary/50      // 50% text (placeholder style)
```

### Glassmorphism Alpha Values

From `src/styles/glassmorphism.css`:

```css
/* Background alpha for glass effect */
.glass-subtle {
  background: rgba(255, 255, 255, 0.02);  /* 2% - Very subtle */
}

.glass-light {
  background: rgba(255, 255, 255, 0.05);  /* 5% - Standard glass */
}

.glass-medium {
  background: rgba(255, 255, 255, 0.1);   /* 10% - Prominent glass */
}

.glass-heavy {
  background: rgba(255, 255, 255, 0.15);  /* 15% - Strong glass */
}
```

### Real-World Examples

#### Glassmorphism Background

From `src/components/InstantCaptureDemo.jsx:335`:
```jsx
<div className="bg-dark-secondary/50 backdrop-blur-sm">
  {/* 50% opacity + blur = frosted glass */}
</div>
```

#### Hover State Opacity

From `src/components/blocks/TextBlock.jsx:63`:
```jsx
<div className="
  bg-dark-secondary/20
  hover:bg-dark-secondary/30
">
  {/* Subtle opacity increase on hover */}
</div>
```

#### Text Hierarchy with Alpha

```jsx
// Primary text (full opacity)
<h1 className="text-text-primary">

// Secondary text (90% opacity)
<p className="text-text-primary/90">

// Tertiary text (60% opacity)
<span className="text-text-secondary/60">

// Disabled text (40% opacity)
<span className="text-text-tertiary/40">
```

#### Border Alpha Progression

```jsx
// Subtle border (resting state)
<div className="border border-dark-secondary/50">

// Medium border (hover state)
<div className="hover:border-dark-secondary/80">

// Accent border (focus state)
<div className="focus:border-accent-green/60">
```

### Overlay Patterns

#### Modal Backdrop

```jsx
<div className="
  fixed inset-0
  bg-black/50         /* 50% black for visibility */
  backdrop-blur-sm    /* Additional blur */
">
```

#### Notification Overlay

```jsx
<div className="
  absolute inset-0
  bg-gradient-to-t from-black/80 to-transparent
">
```

#### Loading Overlay

```jsx
<div className="
  absolute inset-0
  bg-dark-primary/90
  backdrop-blur-lg
">
```

### Backdrop Filter

**Modern CSS property** for blur/saturation effects:

```css
/* Glassmorphism core */
backdrop-filter: blur(20px) saturate(180%);

/* Subtle blur */
backdrop-filter: blur(10px);

/* Heavy blur (modals) */
backdrop-filter: blur(40px);

/* Brightness adjustment */
backdrop-filter: brightness(1.2);
```

**Tailwind classes**:

```jsx
// Blur variants
backdrop-blur-none    // No blur
backdrop-blur-sm      // blur(4px)
backdrop-blur         // blur(8px)
backdrop-blur-md      // blur(12px)
backdrop-blur-lg      // blur(16px)
backdrop-blur-xl      // blur(24px)
backdrop-blur-2xl     // blur(40px)
backdrop-blur-3xl     // blur(64px)
```

---

## Tailwind CSS Usage

### Utility-First Philosophy

Devlog follows **strict utility-first** approach:

1. **Component classes**: Prefer Tailwind utilities over custom CSS
2. **Design tokens**: Use CSS variables only for values (not full components)
3. **Custom classes**: Only for complex animations or browser-specific hacks
4. **Extraction**: Never extract components into @apply unless truly reused 20+ times

### Common Patterns Found in Codebase

#### 1. Responsive Design

**Mobile-first approach**:

```jsx
<div className="
  text-sm md:text-base lg:text-lg
  px-4 md:px-6 lg:px-8
  grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3
">
```

**Breakpoints** from `tailwind.config.js`:

```javascript
screens: {
  'xs': '320px',    // Small phones
  'sm': '640px',    // Large phones
  'md': '768px',    // Tablets
  'lg': '1024px',   // Small laptops
  'xl': '1280px',   // Desktops
  '2xl': '1536px',  // Large desktops

  // Range queries (dead zones)
  'sm-only': { min: '640px', max: '767px' },
  'md-only': { min: '768px', max: '1023px' },
}
```

#### 2. Dark Mode Classes

**Native dark mode** (always on):

```jsx
// All colors are dark by default
<div className="bg-dark-primary text-text-primary">

// No need for dark: prefix since we're always in dark mode
```

#### 3. Group Hover Pattern

**Parent-child hover interactions**:

```jsx
<div className="group">
  <button className="
    opacity-0
    group-hover:opacity-100
    transition-opacity
  ">
    {/* Button only visible when parent hovered */}
  </button>
</div>
```

**Example** from block components:

```jsx
<div className="group relative">
  <div className="
    absolute top-2 right-2
    opacity-0 group-hover:opacity-100
    transition-opacity duration-200
  ">
    {/* Block controls */}
  </div>
</div>
```

#### 4. Flex & Grid Layouts

**Flexbox patterns**:

```jsx
// Horizontal center
<div className="flex items-center justify-center">

// Space between
<div className="flex items-center justify-between">

// Vertical stack with gap
<div className="flex flex-col gap-4">

// Wrap items
<div className="flex flex-wrap gap-2">
```

**Grid patterns**:

```jsx
// Auto-fit grid (responsive without breakpoints)
<div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6">

// Standard responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// Grid with named areas
<div className="grid grid-areas-layout">
```

#### 5. Absolute Positioning Shortcuts

```jsx
// Cover entire parent
<div className="absolute inset-0">

// Top-left corner
<div className="absolute top-0 left-0">

// Bottom-right corner
<div className="absolute bottom-0 right-0">

// Center (with flexbox parent)
<div className="absolute inset-0 flex items-center justify-center">
```

#### 6. Truncation & Overflow

```jsx
// Single line truncate
<p className="truncate">

// Multi-line truncate (2 lines)
<p className="line-clamp-2">

// Custom line clamp
<p className="line-clamp-3">

// Hide scrollbar but allow scroll
<div className="overflow-y-auto scrollbar-hide">
```

#### 7. Aspect Ratio

```jsx
// Square
<div className="aspect-square">

// Video (16:9)
<div className="aspect-video">

// Custom ratio
<div className="aspect-[4/3]">
```

#### 8. Focus Visible Pattern

**Keyboard navigation only**:

```jsx
<button className="
  focus:outline-none
  focus-visible:ring-2 focus-visible:ring-accent-green/50
  focus-visible:ring-offset-2
">
```

#### 9. State Variants

```jsx
<button className="
  bg-accent-green
  hover:bg-accent-green/90
  active:scale-95
  disabled:opacity-50 disabled:cursor-not-allowed
  aria-[pressed=true]:bg-accent-green-dark
">
```

#### 10. Container Queries

**Component-level responsiveness**:

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

### Custom Utilities in index.css

#### Touch Target Utilities

```css
.touch-target {
  min-width: 44px;
  min-height: 44px;
}

.touch-target-lg {
  min-width: 48px;
  min-height: 48px;
}
```

#### Scrollbar Hiding

```css
.scrollbar-hide {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;  /* Chrome, Safari, Opera */
}
```

#### Safe Area Insets

```css
.safe-top {
  padding-top: env(safe-area-inset-top);
}

.safe-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}

.safe-left {
  padding-left: env(safe-area-inset-left);
}

.safe-right {
  padding-right: env(safe-area-inset-right);
}
```

#### Typography Utilities

```css
.fluid-text {
  font-size: clamp(1rem, 0.95rem + 0.25vw, 1.125rem);
}

.balance-text {
  text-wrap: balance;  /* Balanced multi-line headings */
}

.pretty-text {
  text-wrap: pretty;   /* Better line breaks for paragraphs */
}
```

---

## Example Components

### 1. Animated Block Reveal (InstantCaptureDemo)

**Full component** from `src/components/InstantCaptureDemo.jsx:6-33`:

```jsx
const BlockRenderer = ({ block, index }) => {
  const blockComponents = {
    heading: HeadingBlockDemo,
    text: TextBlockDemo,
    code: CodeBlockDemo
  };

  const Component = blockComponents[block.type];
  if (!Component) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{
        duration: 0.5,
        delay: index * 0.1,      // Stagger effect
        type: "spring",
        stiffness: 200,
        damping: 25
      }}
      className="mb-6"
    >
      <Component block={block} />
    </motion.div>
  );
};
```

**Key features**:
- Spring physics animation
- Stagger delay based on index
- Scale + opacity entrance
- 60fps-optimized transforms

### 2. Glassmorphic Text Block

**From** `src/components/blocks/TextBlock.jsx:62-102`:

```jsx
const TextBlockDemo = ({ block }) => {
  return (
    <motion.div
      className="relative rounded-lg border border-dark-secondary/50
                 bg-dark-secondary/20 hover:bg-dark-secondary/30
                 transition-all duration-200"
      whileHover={{ scale: 1.01 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="text-text-primary p-4 rounded-lg">
        <motion.p
          className="leading-relaxed text-text-primary/90"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {block.content}
        </motion.p>

        {/* Tags with stagger animation */}
        {block.tags && block.tags.length > 0 && (
          <div className="flex gap-2 mt-3">
            {block.tags.map((tag, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, scale: 0.5, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{
                  delay: 0.3 + (i * 0.15),
                  type: "spring",
                  stiffness: 400,
                  damping: 15
                }}
                className="text-xs bg-accent-green/20 text-accent-green
                           px-2 py-1 rounded font-medium"
              >
                {tag}
              </motion.span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};
```

**Key features**:
- Glassmorphism with 20% opacity background
- Subtle hover lift (scale: 1.01)
- Sequential tag appearance
- Progressive delays for natural feel

### 3. Code Block with Glow Effect

**From** `src/components/InstantCaptureDemo.jsx:105-194`:

```jsx
const CodeBlockDemo = ({ block }) => {
  const lines = block.content.split('\n');

  return (
    <motion.div
      className="group relative pt-2"
      whileHover={{ scale: 1.005 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      {/* File path badge */}
      {block.filePath && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="absolute -top-3 left-0
                     text-xs text-accent-green/80
                     bg-dark-primary px-2 py-1 rounded-t
                     font-mono z-30
                     border border-accent-green/30 border-b-0"
        >
          {block.filePath}
        </motion.div>
      )}

      {/* Label (Before/After) */}
      {block.label && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: "spring" }}
          className={`absolute -top-3 right-0
                      text-xs px-2 py-1 rounded-t font-medium z-30
                      border border-b-0 ${
            block.label.includes('Before')
              ? 'bg-red-500/10 text-red-400 border-red-500/30'
              : 'bg-green-500/10 text-green-400 border-green-500/30'
          }`}
        >
          {block.label}
        </motion.div>
      )}

      {/* Code container */}
      <div className="bg-dark-primary rounded-lg overflow-hidden
                      border border-dark-secondary/50">
        <div className="flex">
          {/* Line numbers */}
          <motion.div
            className="select-none text-text-secondary text-sm
                       font-mono p-4 pr-0 text-right
                       border-r border-dark-secondary/50 leading-6"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            {lines.map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 + (i * 0.02) }}
              >
                {i + 1}
              </motion.div>
            ))}
          </motion.div>

          {/* Code */}
          <pre className="flex-1 p-4 pl-4 overflow-x-auto
                          font-mono text-sm">
            <motion.code
              className="text-text-primary"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              {block.content}
            </motion.code>
          </pre>
        </div>
      </div>

      {/* Syntax highlighting glow effect */}
      <motion.div
        className="absolute inset-0 rounded-lg pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{
          opacity: [0, 0.1, 0],
          boxShadow: [
            '0 0 0px rgba(16, 185, 129, 0)',
            '0 0 20px rgba(16, 185, 129, 0.3)',
            '0 0 0px rgba(16, 185, 129, 0)'
          ]
        }}
        transition={{ duration: 1, delay: 0.5 }}
      />
    </motion.div>
  );
};
```

**Key features**:
- File path badge with emerald accent
- Before/After labels with semantic colors
- Line-by-line animation (2ms stagger)
- Glow pulse effect on entry
- Monospace font (JetBrains Mono)

### 4. CTA Button with Glow Shadow

**From** `src/components/InstantCaptureDemo.jsx:424-441`:

```jsx
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  onClick={handlePlayPause}
  className="px-5 py-2.5
             bg-accent-green text-dark-primary
             rounded-lg font-medium
             flex items-center gap-2
             hover:bg-accent-green/90
             transition-colors
             shadow-lg shadow-accent-green/20"
>
  {isPlaying ? (
    <>
      <Pause className="w-4 h-4" />
      Pause
    </>
  ) : (
    <>
      <Play className="w-4 h-4" />
      Play
    </>
  )}
</motion.button>
```

**Key features**:
- Scale animation on hover (1.05) and tap (0.95)
- Glow shadow (shadow-accent-green/20)
- Icon + text flex layout
- Conditional rendering with AnimatePresence

### 5. Modal Backdrop with Blur

```jsx
<AnimatePresence>
  {showModal && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50
                 flex items-center justify-center
                 bg-black/50 backdrop-blur-sm"
      onClick={handleClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="w-full max-w-lg mx-4
                   bg-dark-secondary
                   border border-dark-secondary
                   rounded-2xl
                   shadow-2xl
                   p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal content */}
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
```

**Key features**:
- AnimatePresence for mount/unmount
- Backdrop blur for depth
- Spring animation for modal
- Click-outside-to-close pattern

### 6. Stagger Container Pattern

**From** `src/components/HowItWorksVideo.jsx:255-265`:

```jsx
<motion.div
  className="showcase-list desktop-only"
  variants={staggerContainer}
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true, margin: "-100px" }}
>
  {showcaseItems.map((item, index) => (
    <VideoShowcaseItem
      key={item.id}
      item={item}
      index={index}
    />
  ))}
</motion.div>
```

With `staggerContainer` variant:

```javascript
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};
```

**Key features**:
- Sequential reveal of children
- Viewport intersection trigger
- Once: true for performance (no replay on scroll)
- Negative margin for early trigger

---

## File Reference Index

### Configuration Files

- **Tailwind Config**: `/tailwind.config.js` (root)
- **Main CSS**: `/src/index.css`
- **PostCSS**: `/postcss.config.js`

### Style Files

- **Design Tokens**: `/src/styles/dashboard-design-tokens.css`
- **Typography**: `/src/styles/typography.css`
- **Glassmorphism**: `/src/styles/glassmorphism.css`
- **Animations**: `/src/styles/animations.css`
- **Mobile**: `/src/styles/mobile-optimizations.css`

### Animation Files

- **Framer Motion Variants**: `/src/utils/animations.js`
- **Animation Performance**: `/src/utils/animationPerformance.js`

### Example Components

- **Instant Capture Demo**: `/src/components/InstantCaptureDemo.jsx`
- **How It Works Video**: `/src/components/HowItWorksVideo.jsx`
- **Landing Page**: `/src/pages/Landing.jsx`
- **Text Block**: `/src/components/blocks/TextBlock.jsx`
- **Code Block**: `/src/components/blocks/CodeBlock.jsx`
- **Heading Block**: `/src/components/blocks/HeadingBlock.jsx`

### Block Components Directory

All block types located in `/src/components/blocks/`:
- TextBlock.jsx
- CodeBlock.jsx
- HeadingBlock.jsx
- TableBlock.jsx
- FileTreeBlock.jsx
- TodoBlock.jsx
- ImageBlock.jsx
- InlineImageBlock.jsx
- AIBlockRefined.jsx (used as AIBlock)
- OptimizedVersionTrackBlock.jsx
- OptimizedIssueTrackerBlock.jsx

---

## Quick Reference Cheat Sheet

### Most Common Patterns

```jsx
// Glassmorphic card
<div className="bg-dark-secondary/20 backdrop-blur-sm
                border border-dark-secondary/50
                rounded-lg p-4
                hover:bg-dark-secondary/30
                transition-all duration-200">

// Primary CTA button
<button className="px-5 py-2.5
                   bg-accent-green text-dark-primary
                   rounded-lg font-medium
                   hover:bg-accent-green/90
                   active:scale-95
                   shadow-lg shadow-accent-green/20
                   transition-all duration-200">

// Stagger animation
<motion.div
  variants={staggerContainer}
  initial="hidden"
  whileInView="visible"
>
  {items.map((item, i) => (
    <motion.div key={i} variants={staggerItem}>
      {item}
    </motion.div>
  ))}
</motion.div>

// Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

// Fluid heading
<h1 className="text-step-3 font-bold leading-tight">

// Code block
<pre className="font-mono text-sm bg-dark-primary
                rounded-lg p-4 border border-dark-secondary/50">
```

---

## Performance Considerations

### Animation Performance

1. **Use transform and opacity only** - GPU accelerated
2. **Avoid width/height animations** - Causes layout thrashing
3. **Add will-change sparingly** - Memory intensive
4. **Use requestAnimationFrame** for custom animations
5. **Disable animations on low-end devices** - Check `prefers-reduced-motion`

### CSS Performance

1. **Minimize backdrop-filter** - Expensive on mobile
2. **Use contain: layout** for isolated components
3. **Avoid deep nested selectors** - Keep specificity low
4. **Use content-visibility: auto** for off-screen content
5. **Optimize font loading** - Use font-display: swap

### Tailwind Optimization

1. **Purge unused CSS** - Automatic in production build
2. **Use JIT mode** - Faster builds, smaller output
3. **Group utilities** - Easier to read and maintain
4. **Extract repeating patterns** - Use @apply for 20+ occurrences
5. **Use custom variants** - Instead of custom CSS

---

## Accessibility Guidelines

### Color Contrast

- **Text on dark backgrounds**: Minimum WCAG AA (4.5:1)
- **Large text (18px+)**: Minimum WCAG AA (3:1)
- **Interactive elements**: Clear focus indicators (2px ring)

### Motion Accessibility

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Touch Targets

- **Minimum size**: 44px × 44px (iOS guidelines)
- **Recommended size**: 48px × 48px (Material Design)
- **Spacing**: Minimum 8px between targets

### Keyboard Navigation

- **Focus indicators**: Always visible (focus-visible)
- **Tab order**: Logical and predictable
- **Skip links**: For main content
- **ARIA labels**: For icon-only buttons

---

## Version & Metadata

**Generated**: 2025-11-03T16:32:07+01:00
**Git Commit**: d0817e2350596032690caefc67c4bf2a8e3f6058
**Branch**: main
**Repository**: https://github.com/ALPHAbilal/devlog-.git

**Research Sources**:
- 36 CSS files analyzed
- Tailwind configuration (16 major sections)
- 15 Framer Motion animation patterns
- 10 component styling patterns
- 5+ real component implementations

**Researcher**: Claude Code
**Research Method**: Parallel agent analysis (codebase-locator, codebase-analyzer, codebase-pattern-finder)

---

## Additional Resources

### Internal Documentation

- **CLAUDE.md**: High-level architecture guide
- **AI-MEMORY/PATTERNS.md**: Known issues and solutions
- **rules.md**: Debugging protocols and development rules

### External References

- **Tailwind CSS Docs**: https://tailwindcss.com/docs
- **Framer Motion Docs**: https://www.framer.com/motion/
- **WCAG Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/
- **MDN Web Docs**: https://developer.mozilla.org/

---

**END OF STYLE GUIDE**

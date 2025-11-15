---
date: 2025-10-26T09:56:57+0000
researcher: Claude
git_commit: 03a91025303672c4694a41a588d138382d859f2e
branch: main
repository: devlog-
topic: "Design System Structure for Figma Integration via MCP"
tags: [research, design-system, figma, mcp, tokens, responsive, styling]
status: complete
last_updated: 2025-10-26
last_updated_by: Claude
---

# Research: Design System Structure for Figma Integration via MCP

**Date**: 2025-10-26T09:56:57+0000
**Researcher**: Claude
**Git Commit**: 03a91025303672c4694a41a588d138382d859f2e
**Branch**: main
**Repository**: devlog-

## Research Question

Analyze this codebase thoroughly and provide a comprehensive rules document for Figma design integration using the Model Context Protocol (MCP). Specifically examine: token definitions, component library structure, frameworks & libraries, asset management, icon system, styling approach, and project structure.

## Summary

Devlog implements a sophisticated design system built on **React 19 + Tailwind CSS 3.4 + Framer Motion**, featuring a dual-token architecture (Tailwind config + CSS custom properties), glassmorphism aesthetics, hybrid responsive strategy (separate mobile components + Tailwind breakpoints), and cloud-first asset management via Supabase. The system uses **no CSS modules** - all styling is global scope with a `cn()` utility for intelligent class merging. Icons come from `lucide-react` without wrapper abstractions. The architecture prioritizes performance with lazy loading, compression, and fluid typography using CSS `clamp()`.

## Detailed Findings

### 1. Token Definitions

#### Primary Location: Tailwind Configuration
**File**: `tailwind.config.js:66-291`

**Color System**:
```javascript
colors: {
  // Base dark palette
  'dark': '#050d1a',
  'dark-lighter': '#0f1f33',
  'dark-primary': '#0a1628',
  'dark-secondary': '#1e3a5f',

  // Accent colors
  'accent-green': '#10b981',
  'text-primary': '#e0e7ff',
  'text-secondary': '#94a3b8',

  // Surface elevation system
  'surface-0': '#0d1117', // Base
  'surface-1': '#161b22', // Slightly elevated
  'surface-2': '#1f2428', // More elevated
  'surface-3': '#2d333b', // Highest elevation

  // Dashboard-specific palette
  'db-dark': {
    base: '#050b14',
    primary: '#0a1628',
    secondary: '#0f1d32',
    tertiary: '#142842',
  },
  'db-emerald': {
    DEFAULT: '#10b981',
    light: '#34d399',
    dark: '#059669',
  },
  'db-text': {
    primary: '#f8fafc',
    secondary: '#cbd5e1',
    tertiary: '#94a3b8',
    muted: '#64748b',
  },
}
```

**Typography System**:
```javascript
// Font families (tailwind.config.js:68-71)
fontFamily: {
  'sans': ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
  'mono': ['JetBrains Mono', 'SF Mono', 'Monaco', 'Cascadia Code', 'Roboto Mono', 'monospace'],
}

// Fluid typography scale using clamp() (tailwind.config.js:73-82)
fontSize: {
  'xs-fluid': 'clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)',
  'sm-fluid': 'clamp(0.875rem, 0.825rem + 0.25vw, 1rem)',
  'base-fluid': 'clamp(1rem, 0.95rem + 0.25vw, 1.125rem)',
  'lg-fluid': 'clamp(1.125rem, 1.05rem + 0.375vw, 1.25rem)',
  'xl-fluid': 'clamp(1.25rem, 1.15rem + 0.5vw, 1.5rem)',
  '2xl-fluid': 'clamp(1.5rem, 1.35rem + 0.75vw, 1.875rem)',
  '3xl-fluid': 'clamp(1.875rem, 1.65rem + 1.125vw, 2.25rem)',
  '4xl-fluid': 'clamp(2.25rem, 1.95rem + 1.5vw, 3rem)',
}
```

**Spacing System**:
```javascript
// Fluid spacing (tailwind.config.js:84-106)
spacing: {
  'fluid-xs': 'clamp(0.25rem, 0.2rem + 0.25vw, 0.5rem)',
  'fluid-sm': 'clamp(0.5rem, 0.4rem + 0.5vw, 0.75rem)',
  'fluid-md': 'clamp(1rem, 0.8rem + 1vw, 1.5rem)',
  'fluid-lg': 'clamp(1.5rem, 1.2rem + 1.5vw, 2rem)',
  'fluid-xl': 'clamp(2rem, 1.5rem + 2.5vw, 3rem)',
  'fluid-2xl': 'clamp(3rem, 2rem + 5vw, 5rem)',

  // Safe areas for mobile notches
  'safe-top': 'env(safe-area-inset-top)',
  'safe-bottom': 'env(safe-area-inset-bottom)',
  'safe-left': 'env(safe-area-inset-left)',
  'safe-right': 'env(safe-area-inset-right)',

  // Dashboard-specific fixed spacing
  'db-xs': '0.5rem',    // 8px
  'db-sm': '0.75rem',   // 12px
  'db-md': '1rem',      // 16px
  'db-lg': '1.5rem',    // 24px
  'db-xl': '2rem',      // 32px
  'db-2xl': '3rem',     // 48px

  // Layout dimensions
  'db-sidebar-expanded': '280px',
  'db-sidebar-collapsed': '80px',
  'db-header': '72px',
}
```

#### Secondary Location: CSS Custom Properties
**File**: `src/styles/dashboard-design-tokens.css:1-112`

```css
:root {
  /* Color System */
  --db-dark-base: #050b14;
  --db-dark-primary: #0a1628;
  --db-emerald: #10b981;
  --db-text-primary: #f8fafc;

  /* Glassmorphism */
  --db-glass-bg: rgba(10, 22, 40, 0.4);
  --db-glass-border: rgba(255, 255, 255, 0.1);
  --db-glass-blur: 24px;

  /* Spacing (same as Tailwind) */
  --db-spacing-xs: 0.5rem;
  --db-spacing-md: 1rem;
  --db-spacing-xl: 2rem;

  /* Border Radius */
  --db-radius-sm: 8px;
  --db-radius-md: 12px;
  --db-radius-lg: 16px;
  --db-radius-xl: 24px;

  /* Shadows */
  --db-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --db-shadow-md: 0 4px 6px rgba(0, 0, 0, 0.4);
  --db-shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.5);
  --db-shadow-glow: 0 0 20px rgba(16, 185, 129, 0.3);

  /* Transitions */
  --db-transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --db-transition-normal: 250ms cubic-bezier(0.4, 0, 0.2, 1);
  --db-transition-slow: 350ms cubic-bezier(0.4, 0, 0.2, 1);

  /* Z-Index Scale */
  --db-z-base: 1;
  --db-z-elevated: 10;
  --db-z-header: 100;
  --db-z-sidebar: 90;
  --db-z-modal: 1000;
  --db-z-toast: 2000;
}
```

**Token Transformation**: No automated transformation system. Tokens are manually mirrored between Tailwind and CSS custom properties when needed.

**Responsive Breakpoints**:
```javascript
// tailwind.config.js:107-138
screens: {
  'xs': '320px',
  'sm': '640px',
  'md': '768px',   // Mobile/tablet boundary
  'lg': '1024px',  // Tablet/desktop boundary
  'xl': '1280px',
  '2xl': '1536px',

  // Range-based targeting for "dead zones"
  'tablet-range': {'min': '768px', 'max': '1023px'},
  'laptop-range': {'min': '1280px', 'max': '1439px'},
  'tablet-landscape-range': {'min': '1024px', 'max': '1194px'},

  // Container query sizes
  '@container': true,
  '@xs': '20rem',
  '@sm': '24rem',
  '@md': '28rem',
  '@lg': '32rem',
}
```

---

### 2. Component Library

#### Structure
- **Location**: `src/components/`
- **Architecture**: Functional React components with hooks
- **No Storybook** or component documentation system

#### Core Component Categories

**Block System** (`src/components/blocks/`):
- `TextBlock.jsx` - Markdown text with tags
- `CodeBlock.jsx` - Syntax highlighted code
- `HeadingBlock.jsx` - Document headings (3 levels)
- `TableBlock.jsx` - Dynamic tables
- `FileTreeBlock.jsx` - Visual file structure
- `AIBlockRefined.jsx` - AI conversation blocks
- `ImageBlock.jsx` - Multi-image galleries
- `InlineImageBlock.jsx` - Inline images
- `OptimizedVersionTrackBlock.jsx` - Version tracking
- `OptimizedIssueTrackerBlock.jsx` - Issue tracking

**Layout Components**:
- `Layout.jsx` - App layout wrapper
- `VirtualizedGrid.jsx` - Virtualized document grid
- `ExpandedViewEnhanced.jsx` - Document editor (main)
- `ResponsiveLayout.jsx` - Responsive wrapper

**Mobile-Specific** (`src/components/Mobile*.jsx`):
- `MobileDocumentViewer.jsx` - Full-screen document view
- `MobileBlockControls.jsx` - Touch-optimized controls
- `MobileAddBlockRow.jsx` - Bottom sheet block picker
- `MobileBottomSheet.jsx` - Modal drawer
- `MobileNavigation.jsx` - Bottom tab bar

**Landing Page**:
- `HeroSectionV3.jsx` - Hero with animations
- `ProblemSection.jsx` - Problem cards
- `HowItWorksVideo.jsx` - Video showcase
- `FloatingElements.jsx` - Decorative animations
- `LogoMinimal.jsx` - Branding

**Common Component Pattern**:
```javascript
// src/components/blocks/TextBlock.jsx (example)
import React, { useState, useRef, useEffect, memo } from 'react';
import { useAuth } from '../../contexts/AuthContextOptimized';

function TextBlock({ block, onUpdate, isFocused, onFocus }) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(block.content || '');
  const textareaRef = useRef(null);
  const isMountedRef = useRef(false);

  // Track mount status
  useEffect(() => {
    const timer = setTimeout(() => {
      isMountedRef.current = true;
    }, 0);
    return () => {
      clearTimeout(timer);
      isMountedRef.current = false;
    };
  }, []);

  // Auto-resize logic
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [isEditing, content]);

  return (
    <div className="relative">
      {/* Component JSX */}
    </div>
  );
}

export default memo(TextBlock);
```

**Key Patterns**:
- Always use `memo()` for performance
- `useRef` for DOM access and mount tracking
- Context hooks: `useAuth`, `useResponsive`
- Cleanup functions in all `useEffect` hooks
- Strategic console.logs for debugging re-renders

---

### 3. Frameworks & Libraries

#### Core Stack
**File**: `package.json:12-39`

**UI Framework**:
- `react@19.1.0` - Latest React with Strict Mode
- `react-dom@19.1.0`
- `react-router-dom@6.28.2` - Client-side routing

**Build System**:
- `vite@6.3.5` - Build tool and dev server
- `@vitejs/plugin-react@4.4.1` - React plugin
- **No Webpack, no Create React App**

**Styling**:
- `tailwindcss@3.4.17` - Utility-first CSS framework
- `postcss@8.5.4` - CSS processing
- `autoprefixer@10.4.21` - Vendor prefixes
- `tailwind-merge@2.5.5` - Used in `cn()` utility
- `clsx@2.1.1` - Conditional class names
- **No CSS-in-JS libraries** (no styled-components, no emotion)

**Animation**:
- `framer-motion@12.23.6` - Declarative animations
- `gsap@3.12.5` - Timeline-based animations (used in hero)

**Backend/Data**:
- `@supabase/supabase-js@2.46.2` - Cloud database and storage
- `@supabase/auth-ui-react@0.4.7` - Auth UI components
- `dexie@4.0.10` - IndexedDB wrapper (local storage)

**Utilities**:
- `lz-string@1.5.0` - Compression (50-80% savings)
- `lodash-es@4.17.21` - Utilities (ES module version)
- `isomorphic-dompurify@2.9.0` - XSS sanitization
- `zustand@4.5.0` - Minimal global state

**Performance**:
- `react-window@1.8.11` - Virtualized lists
- `react-window-infinite-loader@1.0.10` - Infinite scroll

**Drag & Drop**:
- `@dnd-kit/core@6.1.0` - Drag and drop
- `@dnd-kit/sortable@8.0.0` - Sortable lists

**Code Display**:
- `prism-react-renderer@2.4.1` - Syntax highlighting
- `katex@0.16.9` - Math rendering
- `react-katex@3.0.1` - React wrapper for KaTeX

**Icons**:
- `lucide-react@0.513.0` - Icon library (500+ icons)

**Error Tracking**:
- `@sentry/react@9.40.0` - Production error monitoring
- `@sentry/vite-plugin@3.5.0` - Source map upload

#### Build Configuration
**File**: `vite.config.js:1-38`

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { sentryVitePlugin } from '@sentry/vite-plugin'

export default defineConfig({
  plugins: [
    react(),
    sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      sourcemaps: {
        assets: ['./dist/**'],
        filesToDeleteAfterUpload: ['./dist/**/*.map'],
      },
    }),
  ],
  build: {
    sourcemap: true,
    cssMinify: 'esbuild',
    target: 'es2022', // Prevent ES2023 compatibility issues
  },
  server: {
    host: '0.0.0.0',
    port: 5173
  }
})
```

---

### 4. Asset Management

#### Font Loading
**File**: `index.html:62-66` (assuming standard structure)

Fonts loaded from Google Fonts CDN:
- **Inter**: weights 100-900 (variable font)
- **JetBrains Mono**: weights 400, 500, 600
- Uses `preconnect` for performance
- `display=swap` strategy for optimal rendering

#### Image Management Strategy

**Upload Flow**:
1. **Client-side compression** (`src/utils/imageUploader.js:69-107`)
   - Max width: 1920px
   - JPEG quality: 85%
   - Threshold: 1MB for `ImageBlock`, 100KB for `InlineImageBlock`

2. **Supabase Storage upload** (`src/utils/imageUploader.js:9-43`)
   - Bucket: `images`
   - Path pattern: `${userId}/${timestamp}-${randomId}.${ext}`
   - Cache-Control: 3600 seconds

3. **Metadata storage** in block data:
   ```javascript
   {
     url: 'https://{project}.supabase.co/storage/v1/object/public/images/{path}',
     storagePath: '{userId}/{filename}',
     alt: 'User-provided alt text',
     size: 1234567, // bytes
     dimensions: { width: 1920, height: 1080 }
   }
   ```

**OptimizedImage Component** (`src/components/OptimizedImage.jsx:29-57`):
- Native `loading="lazy"` attribute for modern browsers
- IntersectionObserver fallback for older browsers
- 50px root margin for preloading
- Progressive opacity transitions
- Error handling with fallback UI
- Supports `srcSet` for responsive images

**Lazy Loading Configuration**:
- **Images**: 50px root margin (OptimizedImage.jsx:48)
- **Blocks**: 200px root margin (useBlockLazyLoading.js:26)
- 50ms delay to prevent flashing during fast scroll

**Asset Directories**:
```
public/
├── videos/          # MP4/WebM files
├── gifs/            # GIF fallbacks
├── images/          # Static images
├── icon-*.png       # PWA icons (72-512px)
├── favicon-*.png    # Multi-size favicons
└── devlog-favicon.svg
```

**Public Asset References**:
```javascript
// Direct path from public directory
videoUrl: '/videos/capture-demo.mp4'
posterUrl: '/images/capture-poster.jpg'
```

**User-Uploaded Asset Flow**:
```javascript
// Upload
const { url, path } = await uploadImageToSupabase(file, user.id)

// Display with lazy loading
<img src={url} alt="..." loading="lazy" />
```

**No CDN configuration** beyond Supabase's built-in CDN for the `images` bucket.

---

### 5. Icon System

#### Source: lucide-react
**Package**: `lucide-react@0.513.0`
**No icon wrapper components** - icons used directly

#### Import Pattern
```javascript
// Named imports (tree-shaking friendly)
import { Plus, Type, Code, MessageSquare, Heading, Folder, Table } from 'lucide-react';
```

#### Usage Patterns

**Pattern 1: Direct JSX**:
```javascript
<Plus size={18} />
<Shield className="w-5 h-5 text-accent-green" />
```

**Pattern 2: Stored as Component References**:
```javascript
const blockTypes = [
  { type: 'text', icon: Type, label: 'Text' },
  { type: 'code', icon: Code, label: 'Code' },
];

// Render dynamically
{blockTypes.map((block) => {
  const Icon = block.icon;
  return <Icon size={16} className="text-text-secondary" />;
})}
```

**Pattern 3: Pre-rendered JSX in Config**:
```javascript
const problems = [
  { icon: <BookOpen size={24} />, title: '...' },
  { icon: <Brain size={24} />, title: '...' },
];

// Render directly
{problems.map(p => <div>{p.icon}</div>)}
```

**Pattern 4: Conditional Icon Selection**:
```javascript
const getAlertIcon = (type) => {
  switch (type) {
    case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    case 'error': return <AlertTriangle className="w-4 h-4 text-red-500" />;
    default: return <Activity className="w-4 h-4 text-blue-500" />;
  }
};
```

#### Sizing Conventions

**Approach 1: `size` prop** (numeric):
```javascript
<Plus size={14} />      // Small
<Icon size={16} />      // Medium
<Type size={18} />      // Medium-large
<Brain size={24} />     // Large
```

**Approach 2: Tailwind classes**:
```javascript
<Shield className="w-4 h-4" />  // 16px
<Lock className="w-5 h-5" />    // 20px
<RefreshCw className="w-6 h-6" /> // 24px
```

**Both approaches mixed throughout codebase.**

#### Coloring Pattern
**Exclusively Tailwind classes**:
```javascript
// Theme colors
<Shield className="text-accent-green" />
<ChevronRight className="text-text-secondary" />

// Standard colors
<Lock className="text-blue-500" />
<AlertTriangle className="text-yellow-500" />

// With hover
<Plus className="text-text-secondary hover:text-text-primary" />

// With opacity
<Icon className="text-white/70" />
```

#### Common Icon Categories
- **Navigation**: `ChevronLeft`, `ChevronRight`, `ChevronDown`, `Home`
- **Actions**: `Plus`, `X`, `Trash2`, `Copy`, `Check`, `Edit3`
- **Block Types**: `Type`, `Code`, `MessageSquare`, `Heading`, `Table`
- **Status**: `CheckCircle`, `AlertCircle`, `AlertTriangle`, `Loader2`
- **System**: `Shield`, `Lock`, `Database`, `RefreshCw`, `Activity`

#### Naming Conventions
- **Imports**: PascalCase (matching lucide-react exports)
- **Variables**: PascalCase when storing references (`const Icon = blockType.icon`)
- **Props**: camelCase (`size={18}`, `className="..."`)

**No icon wrapper components found** - direct lucide-react usage throughout.

---

### 6. Styling Approach

#### Primary Methodology: Tailwind CSS + cn() Utility

**The cn() Utility** (`src/utils/cn.js:1-12`):
```javascript
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
```

**Purpose**: Intelligently merges Tailwind classes, resolving conflicts (e.g., `text-red-500` overrides `text-blue-500`).

**Usage Example** (`src/components/ProjectExplorer/TreeNode.jsx:137-149`):
```javascript
<div
  className={cn(
    "group relative flex items-center gap-2 px-2 py-1.5",
    "transition-all duration-200 cursor-pointer rounded-db-sm",
    isSelected
      ? "bg-db-emerald/20 border-l-2 border-db-emerald"
      : isHovered
        ? "bg-db-emerald/5 text-db-text-primary"
        : "hover:bg-db-emerald/5 text-db-text-secondary",
    isOver && isFolder && "ring-2 ring-db-emerald/50",
    isDragging && "opacity-50",
    isCompact && "py-1"
  )}
  style={{ paddingLeft: `${indentWidth + 8}px` }}
>
```

#### Secondary Approaches

**Template Literals** (simpler conditions):
```javascript
<button
  className={`
    p-0.5 -ml-1 hover:bg-surface-3/50 rounded transition-all
    ${isExpanded ? 'rotate-0' : '-rotate-90'}
  `}
>
```

**Inline Styles** (dynamic/precise values):
```javascript
<motion.h1
  className="mb-6 md:mb-8"
  style={{
    fontSize: '72px',
    lineHeight: '82.8px',
    letterSpacing: '-1.44px',
    fontWeight: 400
  }}
>
```

**Custom CSS Files** (component-specific):
```css
/* src/styles/auth-redesign.css */
:root {
  --auth-bg: #020618;
  --auth-surface: #0f172b;
}

.auth-page-redesign {
  background: var(--auth-bg);
  min-height: 100vh;
}
```

**Plain CSS** (performance/browser-specific):
```css
/* src/components/VirtualizedGrid.css */
.scrollbar-thin::-webkit-scrollbar {
  width: 6px;
}

.virtualized-grid-item {
  transform: translateZ(0);
  will-change: left, top;
  contain: layout style paint;
}
```

#### Glassmorphism Pattern
**Common throughout UI**:
```javascript
className="bg-[#1a2942]/60 backdrop-blur-sm border border-white/10"
```

- Semi-transparent backgrounds: `/60`, `/40` opacity
- `backdrop-blur-sm/md/lg` for glass effect
- Subtle borders: `border-white/10`, `border-white/20`

#### Global Styles
**No CSS modules** (`.module.css`) - all CSS is global scope.

**Import pattern**:
```javascript
// Main entry point imports global styles
import './styles/dashboard-design-tokens.css';
import './styles/glassmorphism.css';
import './styles/animations.css';

// Components import their specific CSS
import '../styles/auth-redesign.css';
```

#### Responsive Design Implementation

**Tailwind Breakpoints**:
```javascript
// Mobile-first approach
<div className="px-4 md:px-6 lg:px-8">     // Padding scales up
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"> // Grid columns
<h1 className="text-2xl-fluid md:text-3xl-fluid"> // Fluid typography
```

**useResponsive Hook** (`src/hooks/useResponsive.js:16-29`):
```javascript
const { isMobile, isTablet, isDesktop, isTouchDevice } = useResponsive();

// Conditional rendering
if (isMobile) return <MobileDocumentViewer />;
return <ExpandedViewEnhanced />;
```

**Container Queries**:
```css
/* CSS-based */
@container (min-width: 400px) {
  .container-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

```javascript
// JavaScript-based via ResizeObserver
const { containerSize, isCompact } = useComponentResponsive(containerRef);
```

**Fluid Typography/Spacing** (no breakpoint jumps):
```javascript
// Tailwind config
fontSize: {
  'base-fluid': 'clamp(1rem, 0.95rem + 0.25vw, 1.125rem)',
}
```

**Modern Viewport Units**:
```javascript
// Dynamic viewport height (adjusts for mobile browser chrome)
height: {
  'screen-dvh': '100dvh',
  'screen-svh': '100svh', // Small (address bar visible)
  'screen-lvh': '100lvh', // Large (address bar hidden)
}
```

---

### 7. Project Structure

#### Top-Level Organization
```
devlog-/
├── src/
│   ├── main.jsx              # Entry point
│   ├── App.jsx               # Routing
│   ├── components/           # React components
│   ├── pages/                # Route pages
│   ├── contexts/             # React contexts
│   ├── hooks/                # Custom hooks
│   ├── utils/                # Utilities
│   ├── services/             # Business logic
│   └── styles/               # CSS files
├── public/                   # Static assets
├── thoughts/                 # Documentation (AI-MEMORY system)
├── migrations/               # Database migrations
├── docs/                     # Additional documentation
├── .claude/                  # Claude Code configuration
├── tailwind.config.js        # Tailwind configuration
├── vite.config.js            # Vite configuration
├── package.json              # Dependencies
└── CLAUDE.md                 # Project instructions
```

#### Component Organization

**By Type**:
- `src/components/blocks/` - Document block types
- `src/components/Mobile*.jsx` - Mobile-specific components
- `src/components/ProjectExplorer/` - Feature subdirectory
- `src/components/HeroBackgroundAnimation/` - Animation group
- `src/components/debug/` - Debug utilities

**Landing Page Components** (flat in `src/components/`):
- `HeroSectionV3.jsx`
- `ProblemSection.jsx`
- `HowItWorksVideo.jsx`
- `LogoMinimal.jsx`
- `NoiseOverlay.jsx`

**No strict feature-based organization** - mix of type-based and feature-based grouping.

#### Page Organization

```
src/pages/
├── Dashboard.jsx             # Main app
├── Landing.jsx               # Landing page
├── SharedDocument.jsx        # Public sharing
├── SettingsClaude.jsx        # Settings
├── Privacy.jsx, Terms.jsx    # Legal pages
├── Upgrade.jsx               # Pricing
├── auth/callback.jsx         # Auth flow
├── settings/api.jsx          # API settings (lazy)
├── features/                 # Feature pages (lazy)
└── guides/                   # Guide pages (lazy)
```

**Lazy Loading Pattern**:
```javascript
// src/components/LazyComponents.jsx
const AIConversationSaver = lazy(() => import('../pages/features/AIConversationSaver'));
const NotionAlternative = lazy(() => import('../pages/compare/NotionAlternative'));
```

#### Utilities Organization

```
src/utils/
├── storage/                  # Storage adapters
│   ├── storageWrapper.js     # Main interface (USED)
│   ├── MultiLayerStorage.js  # Orchestrator
│   ├── SupabaseAdapterOptimized.js
│   └── IndexedDBAdapter.js
├── integrity/                # Data validation
├── locking/                  # Multi-tab locking
├── network/                  # Network utilities
├── recovery/                 # Crash recovery
├── transactions/             # Transaction manager
├── cn.js                     # Class merge utility
├── performance.js            # Throttle/debounce
├── imageUploader.js          # Image upload
└── [other utilities]
```

#### Contexts Pattern

**Main contexts** (`src/contexts/`):
- `AuthContextOptimized.jsx` - Authentication (USED)
- `SettingsContext.jsx` - User settings
- `SidebarContext.jsx` - Sidebar state
- `DemoModeContext.jsx` - Demo mode

**Usage pattern**:
```javascript
import { useAuth } from '../../contexts/AuthContextOptimized';

function Component() {
  const { user, signOut } = useAuth();
  // ...
}
```

#### Hooks Organization

**No categorical subdirectories** - flat structure in `src/hooks/`:
- Performance: `usePerformance.js`, `useMemoryManagement.js`
- UI: `useResponsive.js`, `useToast.jsx`, `useScrollAnimation.js`
- Data: `useAutoSave.js`, `useMultiLayerStorage.js`
- Blocks: `useOptimizedBlockLoader.js`, `useBlockLazyLoading.js`

#### AI-MEMORY System

**Documentation hierarchy** (`thoughts/`):
```
thoughts/
├── shared/
│   ├── research/             # Research documents
│   ├── plans/                # Implementation plans
│   └── prs/                  # PR documentation
└── searchable/               # Hard links for search
```

**Key files**:
- `/AI-MEMORY/NOW.md` - Current work
- `/AI-MEMORY/PATTERNS.md` - Known solutions
- `/AI-MEMORY/DECISIONS.md` - Architecture decisions
- `/AI-MEMORY/rules.md` - Debugging protocols

---

## Code References

### Token Definitions
- `tailwind.config.js:66-291` - All Tailwind tokens (colors, typography, spacing, breakpoints)
- `src/styles/dashboard-design-tokens.css:1-112` - CSS custom properties (dashboard subset)

### Component Patterns
- `src/components/blocks/TextBlock.jsx:1-525` - Standard block component pattern
- `src/components/EntryCardRedesigned.jsx:1-350` - Glassmorphism card pattern
- `src/components/HeroSectionV3.jsx:1-200` - Framer Motion animation pattern
- `src/utils/cn.js:1-12` - Class merging utility

### Responsive Design
- `src/hooks/useResponsive.js:1-191` - Comprehensive responsive hook
- `src/components/MobileDocumentViewer.jsx:1-250` - Mobile component pattern
- `src/components/ResponsiveLayout.jsx:1-250` - Layout switching pattern
- `tailwind.config.js:107-138` - Breakpoint configuration
- `src/styles/fluid-grids.css:1-161` - Fluid grid system

### Asset Management
- `src/utils/imageUploader.js:9-149` - Upload and compression
- `src/components/OptimizedImage.jsx:1-209` - Lazy loading component
- `src/components/blocks/ImageBlock.jsx:1-530` - Image block with gallery

### Icon System
- `src/components/AddBlockRow.jsx:2,18-100` - Icon import and usage patterns
- `src/components/ProjectExplorer/TreeNode.jsx:1-5,137-212` - Dynamic icon rendering
- `src/components/ProblemSection.jsx:7-32` - Icon configuration pattern

### Styling
- `src/components/ProjectExplorer/TreeNode.jsx:137-149` - cn() utility usage
- `src/components/HeroSectionV3.jsx:70-98` - Inline styles for Figma specs
- `src/styles/auth-redesign.css:1-80` - Custom CSS with design tokens
- `src/components/VirtualizedGrid.css:1-50` - Performance-optimized CSS

---

## Architecture Insights

### Design System Philosophy

1. **Dual-Token Architecture**: Tailwind config for utilities + CSS custom properties for complex components
2. **Glassmorphism-First**: Semi-transparent backgrounds with blur effects throughout
3. **Fluid Responsiveness**: CSS `clamp()` for smooth scaling without breakpoint jumps
4. **Cloud-First Assets**: Supabase Storage for all user-uploaded media
5. **Performance-Driven**: Lazy loading, virtualization, compression, memoization
6. **No Abstraction Overhead**: Direct library usage (lucide-react, Framer Motion) without wrapper components

### Figma Integration Recommendations

**For MCP-Based Figma Integration**:

1. **Token Mapping**:
   - Map Figma color variables → Tailwind color tokens
   - Map Figma text styles → Tailwind `fontSize` / `fontFamily`
   - Map Figma spacing → Tailwind `spacing` tokens
   - Use `cn()` utility for conditional classes from Figma variants

2. **Component Generation**:
   - Generate functional React components with hooks
   - Use `memo()` for all generated components
   - Include `useResponsive()` for responsive variants
   - Apply glassmorphism pattern: `bg-{color}/{opacity} backdrop-blur-{size} border border-white/10`

3. **Responsive Strategy**:
   - Mobile < 768px: Consider separate mobile component
   - Tablet 768-1024px: Use Tailwind responsive classes
   - Desktop ≥ 1024px: Full desktop experience
   - Use fluid typography (`text-{size}-fluid`) for smooth scaling

4. **Asset Handling**:
   - Generate `OptimizedImage` components for Figma images
   - Include `loading="lazy"` attribute
   - Use Supabase Storage URLs for user-uploaded assets
   - Map Figma icons to lucide-react equivalents

5. **Animation Translation**:
   - Map Figma auto-animate → Framer Motion variants
   - Store animation configs in `src/utils/animations.js`
   - Use `whileHover`, `whileTap` for micro-interactions
   - Respect `prefersReducedMotion` for accessibility

6. **Styling Priority**:
   - Primary: Tailwind utility classes via `cn()`
   - Secondary: Inline styles for exact Figma pixel values
   - Tertiary: Custom CSS file if component has complex styles
   - Never: CSS modules (not used in this codebase)

---

## Related Research

- See `thoughts/shared/plans/dashboard-redesign-figma-implementation.md` for dashboard redesign approach
- See `thoughts/shared/plans/auth-page-redesign-implementation.md` for auth page Figma implementation
- See `docs/database/SMART_SYNC_ARCHITECTURE.md` for data synchronization patterns

---

## Figma MCP Integration Rules

**Based on this codebase analysis, here are the specific rules for Figma → Code translation:**

### Rule 1: Token Translation
```
Figma Color Variable → Tailwind Token
---------------------------
Primary/Blue → accent-green (#10b981)
Background/Dark → dark-primary (#0a1628)
Text/Primary → text-primary (#e0e7ff)
Text/Secondary → text-secondary (#94a3b8)

Figma Text Style → Tailwind Class
---------------------------
Heading 1 → text-4xl-fluid font-sans
Heading 2 → text-2xl-fluid font-sans
Body → text-base-fluid font-sans
Code → text-sm font-mono

Figma Spacing → Tailwind Token
---------------------------
8px → space-2 or db-xs
16px → space-4 or db-md
24px → space-6 or db-lg
32px → space-8 or db-xl
```

### Rule 2: Component Structure
```javascript
// Generated component template
import React, { memo } from 'react';
import { cn } from '../../utils/cn';

function FigmaComponent({ variant = 'default', className, ...props }) {
  return (
    <div
      className={cn(
        // Base styles
        "bg-dark-primary/60 backdrop-blur-sm border border-white/10",
        "rounded-lg p-4 transition-all duration-200",

        // Variant styles
        variant === 'primary' && "bg-accent-green text-dark",
        variant === 'secondary' && "bg-dark-secondary/80",

        // Custom className override
        className
      )}
      {...props}
    >
      {/* Content */}
    </div>
  );
}

export default memo(FigmaComponent);
```

### Rule 3: Responsive Variants
```javascript
// If Figma has mobile + desktop variants
import { useResponsive } from '../../hooks/useResponsive';

function ResponsiveComponent() {
  const { isMobile } = useResponsive();

  if (isMobile) {
    return <MobileVariant />;
  }

  return (
    <div className="px-4 md:px-6 lg:px-8">
      {/* Desktop variant */}
    </div>
  );
}
```

### Rule 4: Glassmorphism Translation
```
Figma Glass Effect → Code
---------------------------
Fill: #1a2942 at 60% opacity → bg-[#1a2942]/60
Background Blur: 24px → backdrop-blur-md
Border: White 10% → border border-white/10
Shadow: Soft → shadow-lg shadow-emerald-500/10

Full pattern:
className="bg-[#1a2942]/60 backdrop-blur-md border border-white/10 shadow-lg"
```

### Rule 5: Animation Mapping
```javascript
// Figma auto-animate → Framer Motion
import { motion } from 'framer-motion';

// Hover scale
whileHover={{ scale: 1.02 }}
transition={{ type: "spring", stiffness: 300 }}

// Entrance animation
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.3 }}

// Stagger children
variants={staggerContainer}  // Import from src/utils/animations.js
```

### Rule 6: Icon Mapping
```
Figma Icon → lucide-react
---------------------------
Plus icon → import { Plus } from 'lucide-react'; <Plus size={16} />
Chevron right → import { ChevronRight } from 'lucide-react'; <ChevronRight size={18} />
Settings → import { Settings } from 'lucide-react'; <Settings className="w-5 h-5" />
```

### Rule 7: Layout Grid
```javascript
// Figma auto-layout → Flexbox/Grid
// Auto-layout (horizontal, gap 16px)
className="flex gap-4 items-center"

// Auto-layout (vertical, gap 12px, padding 24px)
className="flex flex-col gap-3 p-6"

// Grid layout (3 columns, gap 24px)
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
```

### Rule 8: Typography Precision
```javascript
// For exact Figma specs, use inline styles
<h1
  className="text-white"
  style={{
    fontSize: '72px',
    lineHeight: '82.8px',
    letterSpacing: '-1.44px',
    fontWeight: 400
  }}
>
```

### Rule 9: State Variants
```javascript
// Figma variants (Default, Hover, Active) → Conditional styling
<button
  className={cn(
    "px-4 py-2 rounded-lg transition-all",

    // Default state
    "bg-accent-green text-dark",

    // Hover state
    "hover:bg-accent-green/90 hover:shadow-lg",

    // Active state
    "active:scale-98",

    // Disabled state
    isDisabled && "opacity-50 cursor-not-allowed"
  )}
>
```

### Rule 10: Asset Export
```javascript
// Figma images → OptimizedImage component
import OptimizedImage from '../../components/OptimizedImage';

<OptimizedImage
  src="/images/figma-export.jpg"
  alt="Description"
  loading="lazy"
  className="rounded-lg"
/>

// User-uploaded images → Supabase Storage
const { url } = await uploadImageToSupabase(file, user.id);
<img src={url} alt="..." loading="lazy" />
```

---

## Open Questions

1. **Token Sync**: Should we implement automated Figma → Tailwind token sync, or keep manual mapping?
2. **Component Library**: Would Storybook or similar documentation help maintain consistency?
3. **Design System Updates**: How to handle Figma design system changes (e.g., new color added)?
4. **Mobile Patterns**: When to create separate mobile component vs. just use responsive classes?
5. **Animation Library**: Should we consolidate on Framer Motion and remove GSAP?

---

**Note**: This research document serves dual purpose as both codebase analysis and Figma integration guide for MCP-based design-to-code workflows.

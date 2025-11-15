---
date: 2025-10-25T15:30:00+02:00
author: bilal
git_commit: 1a10ce01f53ce1e526ff9595565cde6d67f8cbd7
branch: main
repository: devlog-
topic: "Dashboard Redesign Implementation Plan - Figma Design"
tags: [plan, dashboard, redesign, figma, ui, implementation]
status: ready_for_implementation
estimated_duration: 6 weeks
last_updated: 2025-10-25
last_updated_by: bilal
---

# Dashboard Redesign Implementation Plan

**Date**: 2025-10-25T15:30:00+02:00
**Author**: bilal
**Git Commit**: 1a10ce01f53ce1e526ff9595565cde6d67f8cbd7
**Branch**: main
**Repository**: devlog-
**Based on Research**: `/thoughts/shared/research/2025-10-25_15-00-00_dashboard-redesign-figma-analysis.md`
**Figma Design**: https://www.figma.com/make/JHqTnHIf2hvbGx7MlNt7KL/Revamp-UI-for-Better-Experience?node-id=0-1

## Executive Summary

This plan transforms the Devlog dashboard from the current grid-based layout to a Bento Box design with glassmorphism, following the provided Figma specifications. **Critical constraint**: Frontend/UI changes only - all backend functionality, data flow, state management, and storage systems remain unchanged.

**Total Duration**: 6 weeks
**Phases**: 7 sequential phases
**Risk Level**: Medium (UI-only, no data layer changes)
**Performance Impact**: Neutral to positive (virtualization preserved)

## Core Principles

1. **Backend Preservation**: Zero changes to storage, sync, or data layers
2. **State Continuity**: All existing React state and hooks preserved
3. **Performance First**: Maintain virtualization and optimization strategies
4. **Progressive Enhancement**: Each phase is independently testable
5. **Mobile Compatibility**: Responsive design maintained throughout

## Phase 1: Foundation Setup (Week 1)

### Overview
Install dependencies, create design tokens, configure build tools, and establish the base styling system without touching existing components.

### Goals
- ✅ Add shadcn/ui component library
- ✅ Create CSS custom properties for design tokens
- ✅ Update Tailwind configuration
- ✅ Prepare gradient background system
- ✅ Zero visual changes to existing UI

### File Changes

#### 1.1 Install Dependencies / must: not install this librarys because we are using the vercel for deployment

```bash
# shadcn/ui and dependencies
npm install @radix-ui/react-slot @radix-ui/react-dropdown-menu
npm install @radix-ui/react-dialog @radix-ui/react-tooltip
npm install class-variance-authority clsx tailwind-merge

# Utility for conditional classes
npm install lucide-react  # For consistent icons
```

**Verification**:
```bash
# Automated
npm list @radix-ui/react-slot @radix-ui/react-dropdown-menu
node -e "console.log(require('class-variance-authority'))"

# Manual
- Check package.json has new dependencies
- Run `npm run dev` - no errors
```

#### 1.2 Create Design Tokens File

**File**: `/src/styles/dashboard-design-tokens.css`

```css
/* Dashboard Redesign Design Tokens */
:root {
  /* === Color System === */

  /* Base Colors */
  --db-dark-base: #050b14;
  --db-dark-primary: #0a1628;
  --db-dark-secondary: #0f1d32;
  --db-dark-tertiary: #142842;

  /* Accent Colors */
  --db-emerald: #10b981;
  --db-emerald-light: #34d399;
  --db-emerald-dark: #059669;

  --db-blue: #60a5fa;
  --db-blue-light: #93c5fd;
  --db-blue-dark: #3b82f6;

  --db-amber: #fbbf24;
  --db-amber-light: #fcd34d;
  --db-amber-dark: #f59e0b;

  /* Text Colors */
  --db-text-primary: #f8fafc;
  --db-text-secondary: #cbd5e1;
  --db-text-tertiary: #94a3b8;
  --db-text-muted: #64748b;

  /* === Glassmorphism === */
  --db-glass-bg: rgba(10, 22, 40, 0.4);
  --db-glass-border: rgba(255, 255, 255, 0.1);
  --db-glass-blur: 24px;

  /* === Spacing === */
  --db-spacing-xs: 0.5rem;    /* 8px */
  --db-spacing-sm: 0.75rem;   /* 12px */
  --db-spacing-md: 1rem;      /* 16px */
  --db-spacing-lg: 1.5rem;    /* 24px */
  --db-spacing-xl: 2rem;      /* 32px */
  --db-spacing-2xl: 3rem;     /* 48px */

  /* === Border Radius === */
  --db-radius-sm: 8px;
  --db-radius-md: 12px;
  --db-radius-lg: 16px;
  --db-radius-xl: 24px;

  /* === Shadows === */
  --db-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --db-shadow-md: 0 4px 6px rgba(0, 0, 0, 0.4);
  --db-shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.5);
  --db-shadow-glow: 0 0 20px rgba(16, 185, 129, 0.3);

  /* === Transitions === */
  --db-transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --db-transition-normal: 250ms cubic-bezier(0.4, 0, 0.2, 1);
  --db-transition-slow: 350ms cubic-bezier(0.4, 0, 0.2, 1);

  /* === Layout === */
  --db-sidebar-width-expanded: 280px;
  --db-sidebar-width-collapsed: 80px;
  --db-header-height: 72px;
  --db-container-max-width: 1920px;

  /* === Z-Index Scale === */
  --db-z-base: 1;
  --db-z-elevated: 10;
  --db-z-header: 100;
  --db-z-sidebar: 90;
  --db-z-modal: 1000;
  --db-z-toast: 2000;
}

/* Gradient Backgrounds */
.db-gradient-base {
  background: linear-gradient(
    135deg,
    var(--db-dark-base) 0%,
    var(--db-dark-primary) 50%,
    var(--db-dark-secondary) 100%
  );
}

.db-gradient-card {
  background: linear-gradient(
    135deg,
    rgba(16, 185, 129, 0.1) 0%,
    rgba(96, 165, 250, 0.1) 100%
  );
}

/* Glassmorphism Utility */
.db-glass {
  background: var(--db-glass-bg);
  border: 1px solid var(--db-glass-border);
  backdrop-filter: blur(var(--db-glass-blur));
  -webkit-backdrop-filter: blur(var(--db-glass-blur));
}

/* Bento Box Container */
.db-bento-container {
  border-radius: var(--db-radius-xl);
  padding: var(--db-spacing-lg);
  transition: all var(--db-transition-normal);
}

.db-bento-container:hover {
  transform: translateY(-2px);
  box-shadow: var(--db-shadow-lg);
}
```

**Import in**: `/src/index.css` (add at top)

```css
/* Dashboard Design Tokens */
@import './styles/dashboard-design-tokens.css';
```

**Verification**:
```bash
# Automated
grep -q "dashboard-design-tokens.css" src/index.css
grep -q "db-dark-primary" src/styles/dashboard-design-tokens.css

# Manual
- Open DevTools → Inspect → Computed → Filter "--db-"
- Should see all custom properties defined
```

#### 1.3 Update Tailwind Configuration

**File**: `/tailwind.config.js` (extend existing config)

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  // ... existing config
  theme: {
    extend: {
      // ... existing extensions

      // Add dashboard-specific colors
      colors: {
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
        'db-blue': {
          DEFAULT: '#60a5fa',
          light: '#93c5fd',
          dark: '#3b82f6',
        },
        'db-amber': {
          DEFAULT: '#fbbf24',
          light: '#fcd34d',
          dark: '#f59e0b',
        },
        'db-text': {
          primary: '#f8fafc',
          secondary: '#cbd5e1',
          tertiary: '#94a3b8',
          muted: '#64748b',
        },
      },

      // Add dashboard-specific spacing
      spacing: {
        'db-xs': '0.5rem',
        'db-sm': '0.75rem',
        'db-md': '1rem',
        'db-lg': '1.5rem',
        'db-xl': '2rem',
        'db-2xl': '3rem',
        'db-sidebar-expanded': '280px',
        'db-sidebar-collapsed': '80px',
        'db-header': '72px',
      },

      // Add dashboard-specific border radius
      borderRadius: {
        'db-sm': '8px',
        'db-md': '12px',
        'db-lg': '16px',
        'db-xl': '24px',
      },

      // Add dashboard-specific box shadows
      boxShadow: {
        'db-sm': '0 1px 2px rgba(0, 0, 0, 0.3)',
        'db-md': '0 4px 6px rgba(0, 0, 0, 0.4)',
        'db-lg': '0 10px 15px rgba(0, 0, 0, 0.5)',
        'db-glow': '0 0 20px rgba(16, 185, 129, 0.3)',
      },

      // Add dashboard-specific backdrop blur
      backdropBlur: {
        'db': '24px',
      },

      // Add dashboard-specific animations
      keyframes: {
        'db-fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'db-slide-in-left': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'db-pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(16, 185, 129, 0.5)' },
        },
      },
      animation: {
        'db-fade-in': 'db-fade-in 0.3s ease-out',
        'db-slide-in-left': 'db-slide-in-left 0.3s ease-out',
        'db-pulse-glow': 'db-pulse-glow 2s ease-in-out infinite',
      },
    },
  },
  // ... rest of config
}
```

**Verification**:
```bash
# Automated
npm run build 2>&1 | grep -i "tailwind" | grep -i "error" && echo "FAIL" || echo "PASS"

# Manual
- Check Tailwind IntelliSense suggests "bg-db-dark-primary"
- Check Tailwind IntelliSense suggests "rounded-db-xl"
- Run `npm run dev` - no warnings
```

#### 1.4 Create Utility Functions

**File**: `/src/utils/cn.js` (Tailwind merge utility)

```javascript
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes with proper precedence
 * @param {...any} inputs - Class names to merge
 * @returns {string} Merged class string
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
```

**Verification**:
```bash
# Automated
node -e "const {cn} = require('./src/utils/cn.js'); console.log(cn('p-4', 'p-2') === 'p-2' ? 'PASS' : 'FAIL')"

# Manual
- Import in any component and verify IntelliSense works
```

### Success Criteria

#### Automated Verification
```bash
# Run all checks
npm list @radix-ui/react-slot
npm list class-variance-authority
test -f src/styles/dashboard-design-tokens.css && echo "Tokens file exists" || echo "MISSING"
grep -q "dashboard-design-tokens" src/index.css && echo "Tokens imported" || echo "NOT IMPORTED"
grep -q "db-dark-primary" tailwind.config.js && echo "Tailwind updated" || echo "NOT UPDATED"
npm run build && echo "Build successful" || echo "BUILD FAILED"
```

#### Manual Verification Checklist
- [ ] `npm run dev` starts without errors
- [ ] Browser DevTools shows CSS custom properties (filter: `--db-`)
- [ ] Tailwind IntelliSense suggests `bg-db-dark-primary`
- [ ] Tailwind IntelliSense suggests `rounded-db-xl`
- [ ] No visual changes to existing dashboard
- [ ] Console has zero errors or warnings

### Rollback Strategy
```bash
# If issues arise, rollback:
git checkout HEAD -- tailwind.config.js src/index.css
rm src/styles/dashboard-design-tokens.css src/utils/cn.js
npm install  # Restore package.json
```

---

## Phase 2: Sidebar Enhancement (Week 1-2)

### Overview
Update ProjectExplorerV2 styling to match Figma design. **Key discovery**: Collapse functionality already implemented - only styling updates needed.

### Goals
- ✅ Apply Bento Box glassmorphism to sidebar
- ✅ Update collapsed state (80px) styling
- ✅ Update expanded state (280px) styling
- ✅ Add smooth transitions
- ✅ Preserve all existing functionality

### File Changes

#### 2.1 Update ProjectExplorerV2.jsx Styling

**File**: `/src/components/ProjectExplorer/ProjectExplorerV2.jsx`

**Current state analysis**:
- Lines 307-317: Props interface (already has `isCollapsed` prop ✅)
- Lines 594-639: Collapsed state UI (needs styling update)
- Lines 642-756: Expanded state UI (needs styling update)

**Changes**:

1. **Import utility** (add at top):
```javascript
import { cn } from '../../utils/cn';
```

2. **Update collapsed state container** (around line 594):

**Old**:
```javascript
<div className="w-20 h-full bg-gray-900 border-r border-gray-800">
  {/* ... content ... */}
</div>
```

**New**:
```javascript
<div
  className={cn(
    "db-glass db-bento-container",
    "w-db-sidebar-collapsed h-full",
    "border-db-glass-border",
    "transition-all duration-300 ease-in-out",
    "m-4 rounded-db-xl"
  )}
  style={{
    background: 'var(--db-glass-bg)',
    backdropFilter: 'blur(var(--db-glass-blur))',
  }}
>
  {/* ... existing content preserved ... */}
</div>
```

3. **Update expanded state container** (around line 642):

**Old**:
```javascript
<div className="w-72 h-full bg-gray-900 border-r border-gray-800 flex flex-col">
  {/* ... content ... */}
</div>
```

**New**:
```javascript
<div
  className={cn(
    "db-glass db-bento-container",
    "w-db-sidebar-expanded h-full",
    "border-db-glass-border",
    "transition-all duration-300 ease-in-out",
    "m-4 rounded-db-xl flex flex-col"
  )}
  style={{
    background: 'var(--db-glass-bg)',
    backdropFilter: 'blur(var(--db-glass-blur))',
  }}
>
  {/* ... existing content preserved ... */}
</div>
```

4. **Update toggle button styling** (find existing toggle button):

**Add to toggle button**:
```javascript
className={cn(
  "p-2 rounded-db-md",
  "hover:bg-db-emerald/10",
  "transition-all duration-200",
  "text-db-text-secondary hover:text-db-emerald"
)}
```

5. **Update tree node styling** (TreeNode.jsx):

**File**: `/src/components/ProjectExplorer/TreeNode.jsx`

**Find hover states and update**:
```javascript
// Old
className="hover:bg-gray-800"

// New
className={cn(
  "hover:bg-db-emerald/5",
  "transition-colors duration-200",
  "rounded-db-sm"
)}
```

**Update selected state**:
```javascript
// Old
className="bg-blue-600/20"

// New
className={cn(
  "bg-db-emerald/20",
  "border-l-2 border-db-emerald"
)}
```

#### 2.2 Update SearchBar Styling

**File**: `/src/components/ProjectExplorer/SearchBar.jsx`

**Update input styling**:
```javascript
<input
  className={cn(
    "w-full px-4 py-2",
    "bg-db-dark-tertiary/50",
    "border border-db-glass-border",
    "rounded-db-md",
    "text-db-text-primary",
    "placeholder:text-db-text-muted",
    "focus:outline-none focus:ring-2 focus:ring-db-emerald/50",
    "transition-all duration-200"
  )}
  placeholder="Search documents..."
  // ... other props
/>
```

**Verification**:
```bash
# Automated
grep -q "db-glass" src/components/ProjectExplorer/ProjectExplorerV2.jsx && echo "PASS" || echo "FAIL"
grep -q "db-emerald" src/components/ProjectExplorer/TreeNode.jsx && echo "PASS" || echo "FAIL"

# Manual
- Toggle sidebar - should collapse to 80px, expand to 280px
- Check glassmorphism effect visible (semi-transparent with blur)
- Check smooth transition (300ms)
- Hover over tree nodes - should see emerald tint
- Click tree node - should see emerald highlight
```

### Success Criteria

#### Automated Verification
```bash
# Check imports
grep -q "import { cn }" src/components/ProjectExplorer/ProjectExplorerV2.jsx
grep -q "db-glass" src/components/ProjectExplorer/ProjectExplorerV2.jsx
grep -q "db-sidebar-collapsed" src/components/ProjectExplorer/ProjectExplorerV2.jsx
grep -q "db-sidebar-expanded" src/components/ProjectExplorer/ProjectExplorerV2.jsx

# Build check
npm run build
```

#### Manual Verification Checklist
- [ ] Sidebar has glassmorphism (blurred transparent background)
- [ ] Sidebar has rounded corners (24px border radius)
- [ ] Sidebar has 4px margin from edges
- [ ] Toggle works: 280px ↔ 80px transition smooth (300ms)
- [ ] Collapsed state shows only icons (properly centered)
- [ ] Expanded state shows full tree with text
- [ ] Hover on tree items shows emerald tint
- [ ] Selected tree item has emerald left border
- [ ] Search bar has updated styling with emerald focus ring
- [ ] All existing functionality works (expand/collapse folders, navigate, etc.)
- [ ] Mobile responsive behavior unchanged

### Rollback Strategy
```bash
git checkout HEAD -- src/components/ProjectExplorer/ProjectExplorerV2.jsx
git checkout HEAD -- src/components/ProjectExplorer/TreeNode.jsx
git checkout HEAD -- src/components/ProjectExplorer/SearchBar.jsx
```

---

## Phase 3: Header Component Extraction (Week 2)

### Overview
Extract the header section from Dashboard.jsx into a standalone component matching Figma's unified header design. This reduces Dashboard.jsx complexity and enables better styling control.

### Goals
- ✅ Extract header to `/src/components/DashboardHeader.jsx`
- ✅ Apply Bento Box glassmorphism styling
- ✅ Maintain all existing functionality (stats, profile menu, trial banner)
- ✅ Reduce Dashboard.jsx size by ~90 lines

### File Changes

#### 3.1 Create DashboardHeader Component

**File**: `/src/components/DashboardHeader.jsx` (NEW FILE)

```javascript
import React from 'react';
import { cn } from '../utils/cn';
import LogoMinimal from './LogoMinimal';
import TrialBanner from './TrialBanner';

/**
 * Dashboard Header Component
 * Unified header with logo, stats, and profile menu
 *
 * @param {Object} props
 * @param {Object} props.user - User object from auth
 * @param {number} props.documentCount - Total document count
 * @param {boolean} props.showProfileMenu - Profile menu visibility
 * @param {Function} props.setShowProfileMenu - Toggle profile menu
 * @param {Function} props.handleLogout - Logout handler
 * @param {Function} props.navigate - Navigation function
 */
const DashboardHeader = ({
  user,
  documentCount = 0,
  showProfileMenu = false,
  setShowProfileMenu,
  handleLogout,
  navigate,
}) => {
  return (
    <header
      className={cn(
        "db-glass db-bento-container",
        "mx-4 mt-4 mb-0",
        "border border-db-glass-border",
        "sticky top-4 z-db-header",
        "animate-db-fade-in"
      )}
      style={{
        background: 'var(--db-glass-bg)',
        backdropFilter: 'blur(var(--db-glass-blur))',
        height: 'var(--db-header-height)',
      }}
    >
      {/* Trial Banner (if applicable) */}
      <TrialBanner user={user} />

      <div className="flex items-center justify-between h-full px-6">
        {/* Left: Logo + Brand */}
        <div className="flex items-center gap-3">
          <LogoMinimal className="w-8 h-8" />
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold text-db-text-primary">
              Devlog
            </h1>
            <p className="text-xs text-db-text-tertiary">
              Developer Knowledge Base
            </p>
          </div>
        </div>

        {/* Center: Stats */}
        <div className="hidden md:flex items-center gap-8">
          <StatItem
            label="Documents"
            value={documentCount}
            icon="📄"
          />
          <StatItem
            label="Projects"
            value={user?.projects?.length || 0}
            icon="📁"
          />
          <StatItem
            label="Tags"
            value={user?.tags?.length || 0}
            icon="🏷️"
          />
        </div>

        {/* Right: Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className={cn(
              "flex items-center gap-2 px-4 py-2",
              "rounded-db-md",
              "bg-db-dark-tertiary/50",
              "border border-db-glass-border",
              "hover:bg-db-emerald/10",
              "hover:border-db-emerald/50",
              "transition-all duration-200"
            )}
          >
            <div className="w-8 h-8 rounded-full bg-db-emerald/20 flex items-center justify-center">
              <span className="text-db-emerald font-semibold">
                {user?.email?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            <span className="hidden sm:inline text-db-text-secondary">
              {user?.email?.split('@')[0] || 'User'}
            </span>
          </button>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div
              className={cn(
                "absolute right-0 mt-2 w-56",
                "db-glass db-bento-container",
                "border border-db-glass-border",
                "animate-db-fade-in",
                "z-db-elevated"
              )}
              style={{
                background: 'var(--db-glass-bg)',
                backdropFilter: 'blur(var(--db-glass-blur))',
              }}
            >
              <div className="py-2">
                <MenuItem
                  onClick={() => navigate('/settings')}
                  icon="⚙️"
                  label="Settings"
                />
                <MenuItem
                  onClick={() => navigate('/upgrade')}
                  icon="⭐"
                  label="Upgrade"
                />
                <div className="h-px bg-db-glass-border my-2" />
                <MenuItem
                  onClick={handleLogout}
                  icon="🚪"
                  label="Logout"
                  variant="danger"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

/**
 * Stat Item Component
 */
const StatItem = ({ label, value, icon }) => (
  <div className="flex items-center gap-2">
    <span className="text-xl">{icon}</span>
    <div className="flex flex-col">
      <span className="text-xs text-db-text-tertiary">{label}</span>
      <span className="text-sm font-semibold text-db-text-primary">
        {value.toLocaleString()}
      </span>
    </div>
  </div>
);

/**
 * Menu Item Component
 */
const MenuItem = ({ onClick, icon, label, variant = 'default' }) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-4 py-2",
      "text-left transition-colors duration-200",
      variant === 'danger'
        ? "hover:bg-red-500/10 text-red-400"
        : "hover:bg-db-emerald/10 text-db-text-secondary hover:text-db-text-primary"
    )}
  >
    <span>{icon}</span>
    <span className="text-sm">{label}</span>
  </button>
);

export default DashboardHeader;
```

**Verification**:
```bash
# Automated
test -f src/components/DashboardHeader.jsx && echo "PASS" || echo "FAIL"
grep -q "DashboardHeader" src/components/DashboardHeader.jsx && echo "PASS" || echo "FAIL"

# Manual
- File created successfully
- No syntax errors
```

#### 3.2 Update Dashboard.jsx to Use New Header

**File**: `/src/pages/Dashboard.jsx`

**Step 1: Add import** (around line 1-30):
```javascript
import DashboardHeader from '../components/DashboardHeader';
```

**Step 2: Remove old header section** (lines 1249-1336):

**Find this block**:
```javascript
{/* Header */}
<div className="sticky top-0 z-50 bg-dark-primary border-b border-dark-secondary/50">
  {/* ... 80+ lines of header code ... */}
</div>
```

**Replace with**:
```javascript
{/* Header */}
<DashboardHeader
  user={user}
  documentCount={entries.length}
  showProfileMenu={showProfileMenu}
  setShowProfileMenu={setShowProfileMenu}
  handleLogout={handleLogout}
  navigate={navigate}
/>
```

**Verification**:
```bash
# Automated
grep -q "import DashboardHeader" src/pages/Dashboard.jsx && echo "PASS" || echo "FAIL"
grep -q "<DashboardHeader" src/pages/Dashboard.jsx && echo "PASS" || echo "FAIL"

# Count lines removed (should be ~80-90 fewer)
wc -l src/pages/Dashboard.jsx  # Should be around 1670 lines (was 1757)

# Manual
- Dashboard renders without errors
- Header appears at top with glassmorphism
- Profile menu works (click to toggle)
- Stats display correct counts
- Logout button works
```

### Success Criteria

#### Automated Verification
```bash
# File exists
test -f src/components/DashboardHeader.jsx

# Import present
grep -q "import DashboardHeader" src/pages/Dashboard.jsx

# Component used
grep -q "<DashboardHeader" src/pages/Dashboard.jsx

# Build successful
npm run build
```

#### Manual Verification Checklist
- [ ] Header has glassmorphism background
- [ ] Header has rounded corners (24px)
- [ ] Header is sticky (stays at top when scrolling)
- [ ] Logo displays correctly
- [ ] Stats show correct counts (documents, projects, tags)
- [ ] Profile button shows user's first letter
- [ ] Profile menu toggles on click
- [ ] Settings navigation works
- [ ] Logout works
- [ ] Trial banner appears if applicable
- [ ] Mobile responsive (stats hidden on small screens)
- [ ] Dashboard.jsx reduced by ~80-90 lines

### Rollback Strategy
```bash
git checkout HEAD -- src/pages/Dashboard.jsx
rm src/components/DashboardHeader.jsx
```

---

## Phase 4: Card Component Redesign (Week 3)

### Overview
Redesign EntryCard.jsx to match Figma's DocumentCard design with gradient backgrounds, chart visualization option, favorite star indicator, and enhanced hover effects.

### Goals
- ✅ Apply Bento Box glassmorphism
- ✅ Add gradient background variants
- ✅ Add chart visualization support
- ✅ Add favorite star indicator
- ✅ Enhance hover effects
- ✅ Maintain all existing functionality (click, drag, etc.)

### File Changes

#### 4.1 Update EntryCard.jsx

**File**: `/src/components/EntryCard.jsx`

**Current styling** (lines 88-94):
```javascript
<div className="bg-dark-secondary border border-dark-secondary/50 rounded-xl p-6">
  {/* ... content ... */}
</div>
```

**New styling approach**:

```javascript
import React, { useState } from 'react';
import { cn } from '../utils/cn';
import { Star, TrendingUp, Calendar, Tag } from 'lucide-react';
import Sparkline from './Sparkline'; // Existing sparkline component

/**
 * Entry Card Component - Redesigned
 *
 * @param {Object} props
 * @param {Object} props.entry - Document entry data
 * @param {boolean} props.showChart - Show activity chart
 * @param {string} props.variant - Color variant (emerald, blue, amber)
 * @param {Function} props.onClick - Click handler
 * @param {Function} props.onToggleFavorite - Favorite toggle handler
 */
const EntryCard = ({
  entry,
  showChart = false,
  variant = 'emerald',
  onClick,
  onToggleFavorite,
  ...otherProps // Preserve existing props (drag, multi-select, etc.)
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Gradient variants
  const gradientVariants = {
    emerald: 'from-db-emerald/10 to-transparent',
    blue: 'from-db-blue/10 to-transparent',
    amber: 'from-db-amber/10 to-transparent',
  };

  // Border variants
  const borderVariants = {
    emerald: isHovered ? 'border-db-emerald/50' : 'border-db-glass-border',
    blue: isHovered ? 'border-db-blue/50' : 'border-db-glass-border',
    amber: isHovered ? 'border-db-amber/50' : 'border-db-glass-border',
  };

  return (
    <div
      className={cn(
        "db-glass db-bento-container",
        "relative overflow-hidden",
        "border transition-all duration-300",
        borderVariants[variant],
        "cursor-pointer group",
        isHovered && "shadow-db-lg transform -translate-y-1"
      )}
      style={{
        background: 'var(--db-glass-bg)',
        backdropFilter: 'blur(var(--db-glass-blur))',
      }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...otherProps} // Spread existing props (drag handlers, etc.)
    >
      {/* Gradient overlay */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-50",
          gradientVariants[variant],
          "pointer-events-none"
        )}
      />

      {/* Favorite star */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite?.(entry.id);
        }}
        className={cn(
          "absolute top-4 right-4 z-10",
          "p-1.5 rounded-db-sm",
          "transition-all duration-200",
          entry.isFavorite
            ? "text-db-amber opacity-100"
            : "text-db-text-muted opacity-0 group-hover:opacity-100",
          "hover:bg-db-amber/10"
        )}
        aria-label={entry.isFavorite ? "Remove from favorites" : "Add to favorites"}
      >
        <Star
          className="w-4 h-4"
          fill={entry.isFavorite ? "currentColor" : "none"}
        />
      </button>

      {/* Card content */}
      <div className="relative z-10">
        {/* Title */}
        <h3 className="text-lg font-semibold text-db-text-primary mb-2 line-clamp-2">
          {entry.title || 'Untitled'}
        </h3>

        {/* Metadata row */}
        <div className="flex items-center gap-4 text-xs text-db-text-tertiary mb-3">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(entry.created_at)}</span>
          </div>
          {entry.tags && entry.tags.length > 0 && (
            <div className="flex items-center gap-1">
              <Tag className="w-3 h-3" />
              <span>{entry.tags.length} tags</span>
            </div>
          )}
        </div>

        {/* Preview text */}
        {entry.preview && (
          <p className="text-sm text-db-text-secondary line-clamp-3 mb-3">
            {entry.preview}
          </p>
        )}

        {/* Chart (if enabled) */}
        {showChart && entry.activity && (
          <div className="mt-4 pt-4 border-t border-db-glass-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-db-text-tertiary flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Activity
              </span>
              <span className="text-xs font-semibold text-db-emerald">
                {entry.activity.total || 0} edits
              </span>
            </div>
            <Sparkline
              data={entry.activity.data || []}
              color={variant === 'emerald' ? '#10b981' : variant === 'blue' ? '#60a5fa' : '#fbbf24'}
              height={32}
            />
          </div>
        )}

        {/* Tags */}
        {entry.tags && entry.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {entry.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className={cn(
                  "px-2 py-1 text-xs rounded-db-sm",
                  "bg-db-dark-tertiary/50",
                  "border border-db-glass-border",
                  "text-db-text-tertiary"
                )}
              >
                {tag}
              </span>
            ))}
            {entry.tags.length > 3 && (
              <span className="px-2 py-1 text-xs text-db-text-muted">
                +{entry.tags.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Hover glow effect */}
      {isHovered && (
        <div
          className={cn(
            "absolute inset-0 pointer-events-none",
            "bg-gradient-to-br opacity-10",
            gradientVariants[variant]
          )}
        />
      )}
    </div>
  );
};

// Helper function
const formatDate = (dateString) => {
  if (!dateString) return 'Unknown';
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString();
};

export default EntryCard;
```

**Verification**:
```bash
# Automated
grep -q "db-glass" src/components/EntryCard.jsx && echo "PASS" || echo "FAIL"
grep -q "lucide-react" src/components/EntryCard.jsx && echo "PASS" || echo "FAIL"
grep -q "Sparkline" src/components/EntryCard.jsx && echo "PASS" || echo "FAIL"

# Manual
- Card renders with glassmorphism
- Favorite star appears on hover
- Chart displays when showChart=true
- Hover effect works (lift + shadow)
- Click handler still works
```

#### 4.2 Update VirtualizedGrid to Pass Card Props

**File**: `/src/components/VirtualizedGrid.jsx`

**Find card rendering** (around line 303-319):
```javascript
<EntryCard
  key={entry.id}
  entry={entry}
  onClick={() => handleCardClick(entry)}
  // ... other props
/>
```

**Add new props**:
```javascript
<EntryCard
  key={entry.id}
  entry={entry}
  onClick={() => handleCardClick(entry)}
  showChart={entry.activity && entry.activity.data?.length > 0} // Show chart if data exists
  variant={getCardVariant(entry)} // Determine variant based on tags or project
  onToggleFavorite={handleToggleFavorite}
  // ... other existing props preserved
/>
```

**Add helper function** (top of VirtualizedGrid component):
```javascript
// Determine card color variant based on entry metadata
const getCardVariant = (entry) => {
  if (entry.tags?.includes('urgent') || entry.tags?.includes('important')) return 'amber';
  if (entry.tags?.includes('idea') || entry.tags?.includes('draft')) return 'blue';
  return 'emerald'; // Default
};

// Favorite toggle handler
const handleToggleFavorite = async (entryId) => {
  try {
    const entry = entries.find(e => e.id === entryId);
    const updatedEntry = { ...entry, isFavorite: !entry.isFavorite };

    // Update storage
    await storageWrapper.updateEntry(entryId, { isFavorite: updatedEntry.isFavorite });

    // Update local state
    setEntries(prev => prev.map(e => e.id === entryId ? updatedEntry : e));

    // Emit event
    eventBus.emit('entryUpdated', updatedEntry);
  } catch (error) {
    console.error('Failed to toggle favorite:', error);
  }
};
```

**Verification**:
```bash
# Automated
grep -q "getCardVariant" src/components/VirtualizedGrid.jsx && echo "PASS" || echo "FAIL"
grep -q "handleToggleFavorite" src/components/VirtualizedGrid.jsx && echo "PASS" || echo "FAIL"

# Manual
- Cards render with different color variants
- Favorite star works (click to toggle, persists)
- Charts appear on cards with activity data
- Grid virtualization still works (scroll performance good)
```

### Success Criteria

#### Automated Verification
```bash
# Imports updated
grep -q "lucide-react" src/components/EntryCard.jsx
grep -q "Sparkline" src/components/EntryCard.jsx

# Functions added
grep -q "getCardVariant" src/components/VirtualizedGrid.jsx
grep -q "handleToggleFavorite" src/components/VirtualizedGrid.jsx

# Build successful
npm run build
```

#### Manual Verification Checklist
- [ ] Cards have glassmorphism background
- [ ] Cards have gradient overlay (subtle, colored)
- [ ] Cards have rounded corners (16px)
- [ ] Hover effect: card lifts 4px, shadow appears
- [ ] Hover effect: border color changes to variant color
- [ ] Favorite star appears on hover (hidden by default)
- [ ] Favorite star toggles on click (fills with amber)
- [ ] Favorite state persists (refresh page, still favorited)
- [ ] Charts display on cards with activity data
- [ ] Chart color matches card variant
- [ ] Tags display (max 3 + count)
- [ ] Date shows relative time (Today, Yesterday, X days ago)
- [ ] Click on card opens document (existing behavior)
- [ ] Drag and drop still works
- [ ] Multi-select still works
- [ ] Grid virtualization maintains 60fps scroll

### Rollback Strategy
```bash
git checkout HEAD -- src/components/EntryCard.jsx
git checkout HEAD -- src/components/VirtualizedGrid.jsx
```

---

## Phase 5: Grid Container Wrapper (Week 4)

### Overview
Wrap the VirtualizedGrid in a Bento Box container to match Figma's main content area design. This creates the visual separation between sidebar and main content.

### Goals
- ✅ Create main content Bento Box wrapper
- ✅ Preserve grid virtualization performance
- ✅ Add breadcrumb and search bar to container header
- ✅ Maintain responsive behavior

### File Changes

#### 5.1 Create MainContentContainer Component

**File**: `/src/components/MainContentContainer.jsx` (NEW FILE)

```javascript
import React from 'react';
import { cn } from '../utils/cn';
import { Home, ChevronRight } from 'lucide-react';

/**
 * Main Content Container - Bento Box wrapper for dashboard content
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Grid content
 * @param {Array} props.breadcrumbs - Breadcrumb trail
 * @param {string} props.searchTerm - Search term
 * @param {Function} props.onSearchChange - Search handler
 * @param {React.ReactNode} props.actions - Action buttons
 */
const MainContentContainer = ({
  children,
  breadcrumbs = [],
  searchTerm = '',
  onSearchChange,
  actions,
}) => {
  return (
    <div
      className={cn(
        "db-glass db-bento-container",
        "m-4 flex flex-col",
        "border border-db-glass-border",
        "overflow-hidden", // Prevent scroll on container
        "animate-db-fade-in"
      )}
      style={{
        background: 'var(--db-glass-bg)',
        backdropFilter: 'blur(var(--db-glass-blur))',
        height: 'calc(100vh - var(--db-header-height) - 2rem)', // Full height minus header + margins
      }}
    >
      {/* Container Header */}
      <div className="flex-shrink-0 border-b border-db-glass-border p-4">
        <div className="flex items-center justify-between mb-4">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm">
            <Home className="w-4 h-4 text-db-text-tertiary" />
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={index}>
                <ChevronRight className="w-3 h-3 text-db-text-muted" />
                <button
                  onClick={crumb.onClick}
                  className={cn(
                    "hover:text-db-emerald transition-colors",
                    index === breadcrumbs.length - 1
                      ? "text-db-text-primary font-medium"
                      : "text-db-text-tertiary"
                  )}
                >
                  {crumb.label}
                </button>
              </React.Fragment>
            ))}
          </nav>

          {/* Actions */}
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Search documents..."
            className={cn(
              "w-full px-4 py-3 pl-10",
              "bg-db-dark-tertiary/50",
              "border border-db-glass-border",
              "rounded-db-md",
              "text-db-text-primary",
              "placeholder:text-db-text-muted",
              "focus:outline-none focus:ring-2 focus:ring-db-emerald/50",
              "focus:border-db-emerald/50",
              "transition-all duration-200"
            )}
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-db-text-muted"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
};

export default MainContentContainer;
```

**Verification**:
```bash
# Automated
test -f src/components/MainContentContainer.jsx && echo "PASS" || echo "FAIL"
grep -q "MainContentContainer" src/components/MainContentContainer.jsx && echo "PASS" || echo "FAIL"
```

#### 5.2 Update Dashboard.jsx to Use Container

**File**: `/src/pages/Dashboard.jsx`

**Step 1: Import** (add to imports):
```javascript
import MainContentContainer from '../components/MainContentContainer';
```

**Step 2: Replace main content section** (find VirtualizedGrid rendering, around line 1456-1492):

**Old structure**:
```javascript
<div className="flex-1 overflow-y-auto">
  {/* Breadcrumb */}
  <div className="...">...</div>

  {/* Search */}
  <div className="...">...</div>

  {/* Grid */}
  <VirtualizedGrid ... />
</div>
```

**New structure**:
```javascript
<MainContentContainer
  breadcrumbs={currentBreadcrumbs}
  searchTerm={searchTerm}
  onSearchChange={setSearchTerm}
  actions={
    <>
      <button
        onClick={handleNewDocument}
        className={cn(
          "px-4 py-2 rounded-db-md",
          "bg-db-emerald/20 border border-db-emerald/50",
          "text-db-emerald font-medium",
          "hover:bg-db-emerald/30",
          "transition-all duration-200"
        )}
      >
        + New Document
      </button>
      {/* ... other action buttons ... */}
    </>
  }
>
  <VirtualizedGrid
    entries={filteredEntries}
    onCardClick={handleCardClick}
    // ... all existing props preserved
  />
</MainContentContainer>
```

**Step 3: Create breadcrumbs data** (add to Dashboard state logic):
```javascript
// Generate breadcrumbs based on current location
const currentBreadcrumbs = React.useMemo(() => {
  const crumbs = [
    { label: 'All Documents', onClick: () => setSelectedProjectId(null) }
  ];

  if (selectedProjectId) {
    const project = projects.find(p => p.id === selectedProjectId);
    if (project) {
      crumbs.push({
        label: project.name,
        onClick: () => {} // Already on this project
      });
    }
  }

  return crumbs;
}, [selectedProjectId, projects]);
```

**Verification**:
```bash
# Automated
grep -q "import MainContentContainer" src/pages/Dashboard.jsx && echo "PASS" || echo "FAIL"
grep -q "<MainContentContainer" src/pages/Dashboard.jsx && echo "PASS" || echo "FAIL"
grep -q "currentBreadcrumbs" src/pages/Dashboard.jsx && echo "PASS" || echo "FAIL"

# Manual
- Main content area has glassmorphism background
- Breadcrumbs display at top
- Search bar in container header
- Grid scrolls within container (not entire page)
- "New Document" button appears in header
```

### Success Criteria

#### Automated Verification
```bash
# File created
test -f src/components/MainContentContainer.jsx

# Import and usage
grep -q "import MainContentContainer" src/pages/Dashboard.jsx
grep -q "<MainContentContainer" src/pages/Dashboard.jsx

# Build
npm run build
```

#### Manual Verification Checklist
- [ ] Main content has glassmorphism container
- [ ] Container has rounded corners (24px)
- [ ] Container has 4px margin from edges
- [ ] Breadcrumbs display in header
- [ ] Breadcrumbs clickable (navigate back)
- [ ] Search bar in container header
- [ ] Search bar has emerald focus ring
- [ ] "New Document" button styled with emerald theme
- [ ] Grid scrolls within container (not entire page)
- [ ] Grid virtualization still works (60fps scroll)
- [ ] Container height = viewport - header - margins
- [ ] Responsive on mobile (single column)
- [ ] All existing grid functionality works

### Rollback Strategy
```bash
git checkout HEAD -- src/pages/Dashboard.jsx
rm src/components/MainContentContainer.jsx
```

---

## Phase 6: Layout Integration (Week 5)

### Overview
Update the overall Dashboard layout to integrate all Bento Box components with proper spacing, gradient background, and responsive behavior.

### Goals
- ✅ Apply gradient background to dashboard
- ✅ Integrate all Bento components with consistent spacing
- ✅ Update grid layout for sidebar + main content
- ✅ Ensure mobile responsive behavior
- ✅ Add smooth transitions between states

### File Changes

#### 6.1 Update Dashboard.jsx Layout

**File**: `/src/pages/Dashboard.jsx`

**Find main container div** (usually the outermost div in return statement):

**Old**:
```javascript
<div className="min-h-screen bg-dark-primary">
  {/* ... content ... */}
</div>
```

**New**:
```javascript
<div
  className="min-h-screen db-gradient-base overflow-hidden"
  style={{
    background: 'linear-gradient(135deg, var(--db-dark-base) 0%, var(--db-dark-primary) 50%, var(--db-dark-secondary) 100%)',
  }}
>
  {/* Grid layout for sidebar + main */}
  <div className="flex flex-col h-screen">
    {/* Header */}
    <DashboardHeader ... />

    {/* Main content area with sidebar */}
    <div className="flex-1 flex overflow-hidden">
      {/* Sidebar - conditionally rendered based on collapse state */}
      <div
        className={cn(
          "flex-shrink-0 transition-all duration-300 ease-in-out",
          isSidebarCollapsed ? "w-db-sidebar-collapsed" : "w-db-sidebar-expanded"
        )}
      >
        <ProjectExplorerV2
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          // ... other props
        />
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <MainContentContainer ... >
          <VirtualizedGrid ... />
        </MainContentContainer>
      </div>
    </div>
  </div>
</div>
```

**Add sidebar collapse state** (in Dashboard state section, around line 51-118):
```javascript
// Sidebar collapse state (persisted in localStorage)
const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
  const saved = localStorage.getItem('sidebarCollapsed');
  return saved ? JSON.parse(saved) : false;
});

// Persist sidebar state
React.useEffect(() => {
  localStorage.setItem('sidebarCollapsed', JSON.stringify(isSidebarCollapsed));
}, [isSidebarCollapsed]);
```

**Verification**:
```bash
# Automated
grep -q "db-gradient-base" src/pages/Dashboard.jsx && echo "PASS" || echo "FAIL"
grep -q "isSidebarCollapsed" src/pages/Dashboard.jsx && echo "PASS" || echo "FAIL"
grep -q "localStorage.getItem('sidebarCollapsed')" src/pages/Dashboard.jsx && echo "PASS" || echo "FAIL"

# Manual
- Dashboard has gradient background
- Sidebar collapses/expands smoothly
- Sidebar state persists on refresh
- Main content expands when sidebar collapses
- Layout is responsive
```

#### 6.2 Update Mobile Layout

**File**: `/src/pages/Dashboard.jsx`

**Add mobile breakpoint detection** (using existing useResponsive hook):
```javascript
const isMobile = useResponsive('md'); // Returns true if < 768px
```

**Update layout for mobile** (wrap sidebar in conditional):
```javascript
<div className="flex-1 flex overflow-hidden">
  {/* Sidebar - desktop: inline, mobile: overlay */}
  {!isMobile && (
    <div className={cn(/* ... sidebar container ... */)}>
      <ProjectExplorerV2 ... />
    </div>
  )}

  {/* Mobile sidebar overlay */}
  {isMobile && showMobileSidebar && (
    <div className="fixed inset-0 z-db-modal bg-black/50 backdrop-blur-sm">
      <div className="absolute left-0 top-0 h-full w-80">
        <ProjectExplorerV2
          isCollapsed={false}
          onToggleCollapse={() => setShowMobileSidebar(false)}
          // ... other props
        />
      </div>
    </div>
  )}

  {/* Main content */}
  <div className="flex-1 min-w-0">
    <MainContentContainer ... />
  </div>
</div>
```

**Add mobile sidebar state**:
```javascript
const [showMobileSidebar, setShowMobileSidebar] = useState(false);
```

**Add mobile menu button to header** (in DashboardHeader actions):
```javascript
{isMobile && (
  <button
    onClick={() => setShowMobileSidebar(true)}
    className={cn(
      "p-2 rounded-db-md",
      "bg-db-dark-tertiary/50 border border-db-glass-border",
      "text-db-text-secondary hover:text-db-emerald",
      "transition-all duration-200"
    )}
    aria-label="Open navigation"
  >
    <Menu className="w-5 h-5" />
  </button>
)}
```

**Verification**:
```bash
# Automated
grep -q "isMobile" src/pages/Dashboard.jsx && echo "PASS" || echo "FAIL"
grep -q "showMobileSidebar" src/pages/Dashboard.jsx && echo "PASS" || echo "FAIL"

# Manual (resize browser to < 768px)
- Sidebar hidden on mobile
- Menu button appears in header
- Click menu → sidebar slides in from left
- Click outside sidebar → closes
- Main content full width on mobile
```

### Success Criteria

#### Automated Verification
```bash
# State management
grep -q "isSidebarCollapsed" src/pages/Dashboard.jsx
grep -q "localStorage.getItem('sidebarCollapsed')" src/pages/Dashboard.jsx

# Mobile support
grep -q "isMobile" src/pages/Dashboard.jsx
grep -q "showMobileSidebar" src/pages/Dashboard.jsx

# Gradient background
grep -q "db-gradient-base" src/pages/Dashboard.jsx

# Build
npm run build
```

#### Manual Verification Checklist
- [ ] Gradient background visible across entire dashboard
- [ ] Sidebar and main content have proper Bento Box containers
- [ ] All containers have consistent 4px margins
- [ ] Sidebar collapse/expand smooth (300ms transition)
- [ ] Sidebar state persists (refresh → state maintained)
- [ ] Main content expands to fill space when sidebar collapses
- [ ] Mobile: sidebar hidden by default
- [ ] Mobile: menu button in header opens sidebar
- [ ] Mobile: sidebar slides in from left (overlay)
- [ ] Mobile: click outside sidebar → closes
- [ ] Mobile: main content full width
- [ ] Desktop: sidebar inline, resizes main content
- [ ] All animations 60fps
- [ ] No layout shift or jank

### Rollback Strategy
```bash
git checkout HEAD -- src/pages/Dashboard.jsx
```

---

## Phase 7: Polish & Performance (Week 6)

### Overview
Final polish: add subtle animations, optimize performance, fix edge cases, add loading states, and ensure accessibility.

### Goals
- ✅ Add loading skeletons
- ✅ Add empty states
- ✅ Optimize animations for 60fps
- ✅ Add keyboard shortcuts
- ✅ Improve accessibility (ARIA labels)
- ✅ Performance testing and optimization

### File Changes

#### 7.1 Create Loading Skeleton Component

**File**: `/src/components/LoadingSkeleton.jsx` (NEW FILE)

```javascript
import React from 'react';
import { cn } from '../utils/cn';

/**
 * Loading Skeleton Component
 * Glassmorphic skeleton for loading states
 */
const LoadingSkeleton = ({ className, variant = 'card' }) => {
  if (variant === 'card') {
    return (
      <div
        className={cn(
          "db-glass db-bento-container",
          "border border-db-glass-border",
          "animate-pulse",
          className
        )}
        style={{
          background: 'var(--db-glass-bg)',
          backdropFilter: 'blur(var(--db-glass-blur))',
        }}
      >
        {/* Title skeleton */}
        <div className="h-6 bg-db-text-muted/20 rounded-db-sm mb-3 w-3/4" />

        {/* Metadata skeleton */}
        <div className="flex gap-4 mb-3">
          <div className="h-4 bg-db-text-muted/20 rounded-db-sm w-20" />
          <div className="h-4 bg-db-text-muted/20 rounded-db-sm w-16" />
        </div>

        {/* Content skeleton */}
        <div className="space-y-2">
          <div className="h-3 bg-db-text-muted/20 rounded-db-sm w-full" />
          <div className="h-3 bg-db-text-muted/20 rounded-db-sm w-5/6" />
          <div className="h-3 bg-db-text-muted/20 rounded-db-sm w-4/6" />
        </div>
      </div>
    );
  }

  // Default line skeleton
  return (
    <div className={cn("h-4 bg-db-text-muted/20 rounded-db-sm animate-pulse", className)} />
  );
};

export default LoadingSkeleton;
```

**Usage in VirtualizedGrid**:
```javascript
// Show skeletons while loading
{isLoading && (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
    {Array.from({ length: 6 }).map((_, i) => (
      <LoadingSkeleton key={i} variant="card" />
    ))}
  </div>
)}
```

**Verification**:
```bash
# Automated
test -f src/components/LoadingSkeleton.jsx && echo "PASS" || echo "FAIL"
grep -q "LoadingSkeleton" src/components/VirtualizedGrid.jsx && echo "PASS" || echo "FAIL"

# Manual
- Set isLoading=true → see animated skeletons
- Skeletons match card dimensions
- Pulse animation smooth
```

#### 7.2 Create Empty State Component

**File**: `/src/components/EmptyState.jsx` (NEW FILE)

```javascript
import React from 'react';
import { cn } from '../utils/cn';
import { FileText, Search, Folder } from 'lucide-react';

/**
 * Empty State Component
 */
const EmptyState = ({ type = 'documents', searchTerm = '', onAction }) => {
  const configs = {
    documents: {
      icon: FileText,
      title: 'No documents yet',
      description: 'Create your first document to get started',
      actionLabel: 'Create Document',
    },
    search: {
      icon: Search,
      title: `No results for "${searchTerm}"`,
      description: 'Try adjusting your search or filters',
      actionLabel: 'Clear Search',
    },
    project: {
      icon: Folder,
      title: 'Empty project',
      description: 'Add documents to this project to organize your work',
      actionLabel: 'Add Document',
    },
  };

  const config = configs[type] || configs.documents;
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "db-glass db-bento-container",
        "m-4 p-12 text-center",
        "border border-db-glass-border"
      )}
      style={{
        background: 'var(--db-glass-bg)',
        backdropFilter: 'blur(var(--db-glass-blur))',
      }}
    >
      <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-db-emerald/10">
        <Icon className="w-8 h-8 text-db-emerald" />
      </div>

      <h3 className="text-xl font-semibold text-db-text-primary mb-2">
        {config.title}
      </h3>

      <p className="text-db-text-tertiary mb-6 max-w-md mx-auto">
        {config.description}
      </p>

      <button
        onClick={onAction}
        className={cn(
          "px-6 py-3 rounded-db-md",
          "bg-db-emerald/20 border border-db-emerald/50",
          "text-db-emerald font-medium",
          "hover:bg-db-emerald/30",
          "transition-all duration-200"
        )}
      >
        {config.actionLabel}
      </button>
    </div>
  );
};

export default EmptyState;
```

**Usage in Dashboard**:
```javascript
{filteredEntries.length === 0 && !isLoading && (
  <EmptyState
    type={searchTerm ? 'search' : selectedProjectId ? 'project' : 'documents'}
    searchTerm={searchTerm}
    onAction={searchTerm ? () => setSearchTerm('') : handleNewDocument}
  />
)}
```

**Verification**:
```bash
# Automated
test -f src/components/EmptyState.jsx && echo "PASS" || echo "FAIL"
grep -q "EmptyState" src/pages/Dashboard.jsx && echo "PASS" || echo "FAIL"

# Manual
- Delete all documents → see empty state
- Search for nonsense → see "No results" state
- Open empty project → see project empty state
```

#### 7.3 Add Keyboard Shortcuts

**File**: `/src/pages/Dashboard.jsx`

**Add keyboard handler**:
```javascript
// Keyboard shortcuts
React.useEffect(() => {
  const handleKeyboard = (e) => {
    // Cmd/Ctrl + K: Open command palette
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setShowCommandPalette(true);
    }

    // Cmd/Ctrl + N: New document
    if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
      e.preventDefault();
      handleNewDocument();
    }

    // Cmd/Ctrl + B: Toggle sidebar
    if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
      e.preventDefault();
      setIsSidebarCollapsed(!isSidebarCollapsed);
    }

    // Escape: Close modals
    if (e.key === 'Escape') {
      setShowCommandPalette(false);
      setShowProfileMenu(false);
      setShowMobileSidebar(false);
    }
  };

  window.addEventListener('keydown', handleKeyboard);
  return () => window.removeEventListener('keydown', handleKeyboard);
}, [isSidebarCollapsed]);
```

**Add keyboard hints tooltip** (in header or footer):
```javascript
<div className="text-xs text-db-text-muted hidden lg:block">
  <kbd className="px-2 py-1 rounded bg-db-dark-tertiary/50 border border-db-glass-border">⌘K</kbd> Command palette
  {' • '}
  <kbd className="px-2 py-1 rounded bg-db-dark-tertiary/50 border border-db-glass-border">⌘N</kbd> New document
  {' • '}
  <kbd className="px-2 py-1 rounded bg-db-dark-tertiary/50 border border-db-glass-border">⌘B</kbd> Toggle sidebar
</div>
```

**Verification**:
```bash
# Automated
grep -q "handleKeyboard" src/pages/Dashboard.jsx && echo "PASS" || echo "FAIL"

# Manual
- Cmd+K → opens command palette
- Cmd+N → creates new document
- Cmd+B → toggles sidebar
- Esc → closes modals
```

#### 7.4 Accessibility Improvements

**Add ARIA labels** to interactive elements:

**Header buttons**:
```javascript
<button
  aria-label="Toggle sidebar"
  aria-expanded={!isSidebarCollapsed}
  // ...
/>

<button
  aria-label="Open profile menu"
  aria-haspopup="true"
  aria-expanded={showProfileMenu}
  // ...
/>
```

**Search input**:
```javascript
<input
  aria-label="Search documents"
  role="searchbox"
  // ...
/>
```

**Card components**:
```javascript
<div
  role="button"
  tabIndex={0}
  aria-label={`Open document: ${entry.title}`}
  onKeyDown={(e) => e.key === 'Enter' && onClick()}
  // ...
/>
```

**Verification**:
```bash
# Automated
grep -q "aria-label" src/components/DashboardHeader.jsx && echo "PASS" || echo "FAIL"
grep -q "aria-label" src/components/MainContentContainer.jsx && echo "PASS" || echo "FAIL"

# Manual
- Run axe DevTools → 0 critical issues
- Navigate with Tab → logical focus order
- Press Enter on focused card → opens document
- Screen reader announces elements correctly
```

#### 7.5 Performance Optimization

**Add performance monitoring**:
```javascript
// Measure component render time
React.useEffect(() => {
  performance.mark('dashboard-render-start');

  return () => {
    performance.mark('dashboard-render-end');
    performance.measure(
      'dashboard-render',
      'dashboard-render-start',
      'dashboard-render-end'
    );

    const measure = performance.getEntriesByName('dashboard-render')[0];
    if (measure.duration > 100) {
      console.warn(`Dashboard render took ${measure.duration.toFixed(2)}ms`);
    }
  };
}, [entries, selectedProjectId, searchTerm]);
```

**Optimize re-renders with React.memo**:
```javascript
// EntryCard.jsx
export default React.memo(EntryCard, (prevProps, nextProps) => {
  return (
    prevProps.entry.id === nextProps.entry.id &&
    prevProps.entry.updated_at === nextProps.entry.updated_at &&
    prevProps.showChart === nextProps.showChart
  );
});
```

**Verification**:
```bash
# Performance benchmarks
# 1. Initial load time
performance.measure('dashboard-load', 'navigationStart');
# Should be < 3 seconds

# 2. Scroll performance
# Open DevTools → Performance → Record while scrolling
# Should maintain 60fps (16ms/frame)

# 3. Interaction latency
# Click card → document opens
# Should be < 100ms
```

### Success Criteria

#### Automated Verification
```bash
# Files created
test -f src/components/LoadingSkeleton.jsx
test -f src/components/EmptyState.jsx

# Features added
grep -q "handleKeyboard" src/pages/Dashboard.jsx
grep -q "aria-label" src/components/DashboardHeader.jsx
grep -q "React.memo" src/components/EntryCard.jsx

# Build
npm run build

# Bundle size check
ls -lh dist/assets/*.js | awk '{print $5, $9}' | sort -hr
# Main bundle should be < 500KB
```

#### Manual Verification Checklist
- [ ] Loading skeletons appear during initial load
- [ ] Empty state shown when no documents
- [ ] Empty state shown for "no results" searches
- [ ] Cmd+K opens command palette
- [ ] Cmd+N creates new document
- [ ] Cmd+B toggles sidebar
- [ ] Esc closes modals
- [ ] Tab navigation works logically
- [ ] Enter key activates focused buttons
- [ ] ARIA labels present on interactive elements
- [ ] axe DevTools: 0 critical issues
- [ ] Lighthouse Accessibility score > 95
- [ ] Initial load < 3 seconds
- [ ] Scroll maintains 60fps
- [ ] Card click → open < 100ms
- [ ] Animations smooth on low-end devices
- [ ] No console errors or warnings

### Performance Targets

```bash
# Run Lighthouse audit
npm run build
npx serve -s dist
# Open Chrome DevTools → Lighthouse → Run audit

# Target scores:
# Performance: > 90
# Accessibility: > 95
# Best Practices: > 95
# SEO: > 90
```

### Rollback Strategy
```bash
# Rollback all Phase 7 changes
git checkout HEAD -- src/pages/Dashboard.jsx
git checkout HEAD -- src/components/EntryCard.jsx
rm src/components/LoadingSkeleton.jsx
rm src/components/EmptyState.jsx
```

---

## Testing Strategy

### Unit Tests

**Create test file**: `/src/components/__tests__/DashboardHeader.test.jsx`

```javascript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DashboardHeader from '../DashboardHeader';

describe('DashboardHeader', () => {
  it('renders logo and stats', () => {
    const { getByText } = render(
      <DashboardHeader
        user={{ email: 'test@example.com' }}
        documentCount={42}
      />
    );

    expect(getByText('42')).toBeInTheDocument();
    expect(getByText('Devlog')).toBeInTheDocument();
  });

  it('toggles profile menu on click', () => {
    const setShowProfileMenu = vi.fn();
    const { getByLabelText } = render(
      <DashboardHeader
        user={{ email: 'test@example.com' }}
        showProfileMenu={false}
        setShowProfileMenu={setShowProfileMenu}
      />
    );

    fireEvent.click(getByLabelText('Open profile menu'));
    expect(setShowProfileMenu).toHaveBeenCalledWith(true);
  });
});
```

**Run tests**:
```bash
npm run test
```

### Integration Tests

**Test full user flows**:
1. Open dashboard → see all components rendered
2. Toggle sidebar → verify layout adjusts
3. Search documents → verify filtering works
4. Click card → verify document opens
5. Favorite document → verify state persists
6. Create new document → verify added to grid

### Visual Regression Testing

**Take screenshots for comparison**:
```javascript
// Using Playwright or Cypress
await page.goto('http://localhost:5173/dashboard');
await page.screenshot({ path: 'screenshots/dashboard-full.png' });
await page.click('[aria-label="Toggle sidebar"]');
await page.screenshot({ path: 'screenshots/dashboard-collapsed.png' });
```

**Compare with baseline**:
```bash
# Use tool like Percy, Chromatic, or simple diff
diff screenshots/baseline/dashboard-full.png screenshots/dashboard-full.png
```

---

## Migration Checklist

### Pre-Migration
- [ ] Create feature branch: `git checkout -b feature/dashboard-redesign-figma`
- [ ] Backup database (Supabase snapshot)
- [ ] Document current performance metrics (Lighthouse scores)
- [ ] Take screenshots of current UI for comparison

### Phase-by-Phase Checklist

**Phase 1: Foundation**
- [ ] Dependencies installed
- [ ] Design tokens file created
- [ ] Tailwind config updated
- [ ] Build successful
- [ ] No visual changes to existing UI

**Phase 2: Sidebar**
- [ ] ProjectExplorerV2 styled with glassmorphism
- [ ] Collapse/expand works smoothly
- [ ] Tree nodes styled with emerald theme
- [ ] Search bar styled

**Phase 3: Header**
- [ ] DashboardHeader component created
- [ ] Header extracted from Dashboard.jsx
- [ ] Profile menu works
- [ ] Stats display correctly

**Phase 4: Cards**
- [ ] EntryCard redesigned with glassmorphism
- [ ] Gradient overlays applied
- [ ] Favorite star works
- [ ] Charts display
- [ ] Hover effects smooth

**Phase 5: Grid Container**
- [ ] MainContentContainer created
- [ ] Breadcrumbs work
- [ ] Search in container header
- [ ] Grid scrolls within container
- [ ] Virtualization preserved

**Phase 6: Layout**
- [ ] Gradient background applied
- [ ] All Bento boxes integrated
- [ ] Sidebar collapse state persists
- [ ] Mobile layout works

**Phase 7: Polish**
- [ ] Loading skeletons added
- [ ] Empty states added
- [ ] Keyboard shortcuts work
- [ ] Accessibility improved
- [ ] Performance optimized

### Post-Migration
- [ ] Run full test suite: `npm run test`
- [ ] Run Lighthouse audit (targets met)
- [ ] Test on multiple browsers (Chrome, Firefox, Safari, Edge)
- [ ] Test on mobile devices (iOS Safari, Chrome Mobile)
- [ ] Verify all existing features work
- [ ] Check for console errors
- [ ] Verify data persistence (refresh → state maintained)
- [ ] Get user feedback (internal testing)
- [ ] Merge to main: `git merge feature/dashboard-redesign-figma`

---

## Risk Mitigation

### Identified Risks

1. **Performance Degradation**
   - **Risk**: Glassmorphism and animations slow down rendering
   - **Mitigation**:
     - Use `will-change` CSS property sparingly
     - Measure performance at each phase
     - Disable blur on low-end devices
     - Maintain virtualization

2. **Breaking Existing Functionality**
   - **Risk**: State management or event handlers break during refactor
   - **Mitigation**:
     - Preserve all existing props and callbacks
     - Test each feature after each phase
     - Use TypeScript or PropTypes for type safety
     - Comprehensive testing

3. **Mobile Experience Issues**
   - **Risk**: Glassmorphism doesn't render well on mobile
   - **Mitigation**:
     - Test on real devices early
     - Use conditional blur (reduce on mobile)
     - Ensure touch targets are 44px minimum
     - Test with slow network (3G)

4. **Accessibility Regression**
   - **Risk**: New UI breaks screen reader compatibility
   - **Mitigation**:
     - Add ARIA labels throughout
     - Test with screen readers (NVDA, JAWS, VoiceOver)
     - Maintain keyboard navigation
     - Run axe DevTools after each phase

5. **Bundle Size Increase**
   - **Risk**: New dependencies increase load time
   - **Mitigation**:
     - Tree-shake unused shadcn/ui components
     - Code-split heavy components
     - Monitor bundle size: `npm run build`
     - Use dynamic imports for modals

---

## Success Metrics

### Performance Metrics

**Before Migration** (baseline):
```bash
# Run Lighthouse audit on current dashboard
npm run build && npx serve -s dist
# Record scores
```

**After Migration** (targets):
- **Lighthouse Performance**: > 90 (maintain or improve)
- **Lighthouse Accessibility**: > 95 (improve from baseline)
- **First Contentful Paint (FCP)**: < 1.5s
- **Time to Interactive (TTI)**: < 3s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **Largest Contentful Paint (LCP)**: < 2.5s

### User Experience Metrics

- **Task Completion Rate**: > 95% (same as before)
- **Error Rate**: < 1% (same as before)
- **User Satisfaction**: > 4.5/5 (improve from baseline)
- **Mobile Usage**: +20% (encourage mobile use)

### Technical Metrics

- **Bundle Size**: < 500KB (main JS bundle)
- **Code Coverage**: > 80% (maintain or improve)
- **Console Errors**: 0 (zero tolerance)
- **Accessibility Violations**: 0 (zero tolerance)

---

## Rollback Plan

If critical issues arise at any phase:

### Immediate Rollback
```bash
# Rollback all changes
git checkout main
git branch -D feature/dashboard-redesign-figma

# Restore database (if needed)
# Use Supabase snapshot from pre-migration
```

### Partial Rollback
```bash
# Rollback specific phase (e.g., Phase 4)
git checkout HEAD~1 -- src/components/EntryCard.jsx
git checkout HEAD~1 -- src/components/VirtualizedGrid.jsx
```

### Gradual Rollout (Recommended)

**Use feature flags**:
```javascript
// src/utils/featureFlags.js
export const FEATURE_FLAGS = {
  DASHBOARD_REDESIGN: import.meta.env.VITE_FEATURE_DASHBOARD_REDESIGN === 'true',
};

// Dashboard.jsx
import { FEATURE_FLAGS } from '../utils/featureFlags';

const Dashboard = () => {
  if (FEATURE_FLAGS.DASHBOARD_REDESIGN) {
    return <NewDashboard />;
  }
  return <OldDashboard />;
};
```

**Rollout schedule**:
1. Week 1: 10% of users (A/B test)
2. Week 2: 50% of users (if metrics good)
3. Week 3: 100% of users (full rollout)

---

## Timeline

### Week 1
- **Mon-Tue**: Phase 1 (Foundation Setup)
- **Wed-Fri**: Phase 2 (Sidebar Enhancement)

### Week 2
- **Mon-Wed**: Phase 2 completion + testing
- **Thu-Fri**: Phase 3 (Header Extraction)

### Week 3
- **Mon-Fri**: Phase 4 (Card Redesign)

### Week 4
- **Mon-Wed**: Phase 5 (Grid Container)
- **Thu-Fri**: Phase 5 testing

### Week 5
- **Mon-Fri**: Phase 6 (Layout Integration)

### Week 6
- **Mon-Wed**: Phase 7 (Polish & Performance)
- **Thu-Fri**: Final testing, bug fixes, documentation

### Week 7 (Buffer)
- User feedback
- Bug fixes
- Performance tuning
- Final approval

---

## Support & Documentation

### Developer Documentation

**Create documentation file**: `/docs/dashboard-redesign.md`

```markdown
# Dashboard Redesign Documentation

## Quick Start
1. Run `npm install` to get dependencies
2. Run `npm run dev` to start dev server
3. Navigate to `/dashboard` to see redesigned UI

## Components

### DashboardHeader
Location: `/src/components/DashboardHeader.jsx`
Props: user, documentCount, showProfileMenu, setShowProfileMenu, handleLogout, navigate

### MainContentContainer
Location: `/src/components/MainContentContainer.jsx`
Props: children, breadcrumbs, searchTerm, onSearchChange, actions

### EntryCard
Location: `/src/components/EntryCard.jsx`
Props: entry, showChart, variant, onClick, onToggleFavorite

## Design Tokens
All design tokens are in `/src/styles/dashboard-design-tokens.css`
Use CSS variables: `var(--db-dark-primary)`, `var(--db-emerald)`, etc.

## Keyboard Shortcuts
- Cmd+K: Command palette
- Cmd+N: New document
- Cmd+B: Toggle sidebar
- Esc: Close modals
```

### User Guide

**Update help documentation**:
- New glassmorphic design
- Collapsible sidebar feature
- Favorite documents feature
- Keyboard shortcuts

---

## Conclusion

This implementation plan provides a comprehensive roadmap for redesigning the Devlog dashboard to match the Figma specifications. The plan is structured in 7 sequential phases over 6 weeks, with clear success criteria, verification steps, and rollback strategies at each phase.

**Key Principles**:
1. **Backend Preservation**: Zero changes to data layer, storage, or sync systems
2. **Incremental Progress**: Each phase is independently testable and can be rolled back
3. **Performance First**: Maintain virtualization and 60fps animations throughout
4. **User-Centric**: Preserve all existing functionality while enhancing UX

**Next Steps**:
1. Review and approve this plan
2. Create feature branch: `feature/dashboard-redesign-figma`
3. Begin Phase 1: Foundation Setup
4. Follow phase-by-phase implementation
5. Test thoroughly at each milestone
6. Deploy with feature flags for gradual rollout

**Questions or Concerns**: Contact bilal or open an issue in the repository.

---

## Appendix: Command Reference

### Development Commands
```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Run tests
npm run test

# Run linting
npm run lint

# Preview build
npm run preview

# Check bundle size
npm run build && ls -lh dist/assets/*.js

# Run Lighthouse audit
npm run build && npx serve -s dist
# Then open Chrome DevTools → Lighthouse
```

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/dashboard-redesign-figma

# Commit after each phase
git add .
git commit -m "Phase 1: Foundation Setup complete"

# Push to remote
git push origin feature/dashboard-redesign-figma

# Merge to main (after approval)
git checkout main
git merge feature/dashboard-redesign-figma
git push origin main
```

### Verification Scripts
```bash
# Check all design tokens imported
grep -q "dashboard-design-tokens" src/index.css && echo "✅ Tokens imported"

# Check Tailwind config updated
grep -q "db-dark-primary" tailwind.config.js && echo "✅ Tailwind updated"

# Check components created
test -f src/components/DashboardHeader.jsx && echo "✅ Header exists"
test -f src/components/MainContentContainer.jsx && echo "✅ Container exists"

# Check performance
npm run build && du -h dist/assets/*.js | sort -hr | head -5
```

---

**Plan Status**: Ready for Implementation
**Last Updated**: 2025-10-25
**Approved By**: _[Pending approval]_

---
date: 2025-10-24
researcher: Claude
topic: "Settings Page Figma Design Implementation"
tags: [research, frontend, figma, settings, api-keys]
status: complete
---

# Research: Settings Page Figma Design Implementation

**Date**: October 24, 2025
**Researcher**: Claude
**Figma Design**: https://www.figma.com/design/Ejd2x9Di1vgjnPRybk5Af2/Untitled?node-id=22-387

## Research Question
What exactly should be changed in the frontend to implement the settings page design from the provided Figma file?

## Summary
The Figma design presents a refined dark theme for the API Keys settings page with specific layout changes, new color schemes, and reorganized navigation structure. Key changes include a darker color palette, teal brand colors replacing green, wider sidebar, rounded corners on main content, and restructured navigation sections.

## Required Frontend Changes

### 1. Color System Updates
**File**: `src/styles/settings-claude.css`

#### Background Colors
```css
/* Current Values */
--bg-primary: #0a1628;      /* Main background */
--bg-secondary: #1e3a5f;    /* Sidebar */

/* Change to Figma Values */
--bg-primary: #0f172b;      /* Main content background */
--bg-secondary: #020618;    /* Sidebar background */
--bg-elevated: rgba(15, 23, 43, 0.5);  /* Card backgrounds */
```

#### Brand Colors
```css
/* Current Values */
--brand-primary: #10b981;   /* Emerald green */
--brand-primary-hover: #059669;

/* Change to Figma Values */
--brand-primary: #00bc7d;   /* Teal start gradient */
--brand-primary-end: #00bba7;  /* Teal end gradient */
--brand-primary-hover: #00a06a;
--api-key-text: #00d492;    /* Bright teal for API keys */
```

#### Border Colors
```css
/* Add new border colors */
--border-subtle: rgba(49, 65, 88, 0.5);  /* For cards */
--border-section: rgba(29, 41, 61, 0.5); /* For section dividers */
```

### 2. Layout Structure Changes
**File**: `src/styles/settings-claude.css`

#### Sidebar Width Update
```css
.settings-sidebar {
  width: 256px;  /* Changed from 240px */
  background: var(--bg-secondary);  /* Now #020618 */
  border-right: 1px solid var(--border-color);
}
```

#### Main Content Area with Rounded Corner
```css
.settings-content {
  flex: 1;
  background: var(--bg-primary);  /* Now #0f172b */
  border-top-left-radius: 14px;   /* New: rounded corner */
  margin-top: 24px;                /* New: spacing from top */
  box-shadow: 0px 25px 50px -12px rgba(0, 0, 0, 0.25);  /* New: shadow */
  overflow: clip;                  /* New: enforce rounded corners */
}

/* Centered content wrapper */
.content-section {
  max-width: 832px;  /* Changed from 800px to match Figma */
  padding: 48px 270px;  /* Specific Figma padding */
  margin: 0 auto;
}
```

### 3. Navigation Structure Updates
**File**: `src/pages/SettingsClaude.jsx`

#### Update Navigation Sections
```javascript
// Current (line 173-177)
const sections = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'api', label: 'API Keys', icon: Key },
  { id: 'data', label: 'Data & Privacy', icon: Shield }
];

// Change to Figma structure
const sections = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'storage', label: 'Storage', icon: Database },
  { id: 'api', label: 'API Keys', icon: Key }
];
```

#### Add Back Button to Sidebar
```javascript
// Add after line 402 in sidebar
<div className="back-button-container">
  <button
    className="back-button-settings"
    onClick={() => navigate('/dashboard')}
  >
    <ArrowLeft size={16} />
    <span>Back</span>
  </button>
</div>
```

### 4. Active State Styling
**File**: `src/styles/settings-claude.css`

#### Navigation Active State
```css
.nav-item.active {
  /* Current: Green gradient */
  background: linear-gradient(to right,
    rgba(16, 185, 129, 0.12),
    rgba(16, 185, 129, 0.12));

  /* Change to Figma teal gradient */
  background: linear-gradient(to bottom,
    rgba(0, 188, 125, 0.1),
    rgba(0, 187, 167, 0.1));
  border: 1px solid rgba(0, 188, 125, 0.2);
  border-radius: 10px;
  height: 42px;  /* Specific height from Figma */
}

.nav-item.active .nav-label {
  color: #00d492;  /* Teal text for active */
  font-weight: normal;  /* Not bold in Figma */
}
```

### 5. Button Styling Updates
**File**: `src/styles/settings-claude.css`

#### Create API Key Button
```css
.btn-primary {
  /* Current: Solid green */
  background: var(--brand-primary);

  /* Change to Figma gradient */
  background: linear-gradient(to bottom, #00bc7d, #00bba7);
  border-radius: 8px;
  height: 36px;
  padding: 0 12px;
  font-size: 14px;
  font-weight: normal;
}

.btn-primary:hover {
  background: linear-gradient(to bottom, #00a06a, #009f8f);
}
```

### 6. API Key Card Updates
**File**: `src/styles/settings-claude.css`

#### Card Container
```css
.api-key-card {
  /* Keep existing structure but update colors */
  background: rgba(15, 23, 43, 0.5);
  border: 1px solid rgba(49, 65, 88, 0.5);
  border-radius: 10px;
  padding: 21px;
  height: 132px;  /* Exact Figma height */
}
```

#### API Key Preview
```css
.api-key-preview code {
  font-family: 'Cousine', Consolas, Monaco, monospace;  /* Add Cousine font */
  font-size: 12px;
  color: #00d492;  /* Teal color for API keys */
}
```

### 7. Section Headers
**File**: `src/styles/settings-claude.css`

#### Typography Updates
```css
.section-title {
  font-size: 30px;  /* Exact Figma size */
  line-height: 36px;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.section-description {
  font-size: 16px;
  line-height: 24px;
  color: #90a1b9;  /* Specific gray from Figma */
}

.setting-group-title {
  font-size: 20px;  /* Changed from 18px */
  line-height: 28px;
  color: var(--text-primary);
  margin-bottom: 16px;
}
```

### 8. Add Section Dividers
**File**: `src/pages/SettingsClaude.jsx`

Add horizontal dividers between sections:
```javascript
// After Create API Key section (around line 590)
<div className="section-divider" />

// After Active Keys section (around line 615)
<div className="section-divider" />
```

**File**: `src/styles/settings-claude.css`
```css
.section-divider {
  height: 1px;
  background: rgba(29, 41, 61, 0.5);
  margin: 32px 0;
  width: 100%;
}
```

### 9. Quick Setup Guide Cards
**File**: `src/styles/settings-claude.css`

```css
.setup-accordion {
  background: rgba(15, 23, 43, 0.5);  /* Translucent background */
  border: 1px solid rgba(49, 65, 88, 0.5);
  border-radius: 10px;
  height: 54px;  /* Fixed height from Figma */
  margin-bottom: 12px;
}

.setup-accordion-header {
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
```

### 10. Icon Updates
The Figma design uses specific icons that need to be matched:
- Account icon: User outline style
- Security icon: Shield outline
- Storage icon: Database/server stack
- API Keys icon: Key with dots pattern

### 11. Back Button Styling
**File**: `src/styles/settings-claude.css`

```css
.back-button-container {
  padding: 24px;
  border-bottom: 1px solid var(--border-color);
}

.back-button-settings {
  display: flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  border: none;
  color: #90a1b9;
  font-size: 14px;
  cursor: pointer;
  transition: color 0.2s;
}

.back-button-settings:hover {
  color: var(--text-primary);
}
```

### 12. Mobile Adjustments
Keep existing mobile responsiveness but update colors to match new theme:
```css
@media (max-width: 768px) {
  .mobile-header {
    background: rgba(2, 6, 24, 0.95);  /* Darker to match new theme */
  }
}
```

## Implementation Priority

### Phase 1: Core Visual Updates (High Priority)
1. Update color variables in CSS
2. Adjust sidebar width
3. Add rounded corner to main content
4. Update button gradients

### Phase 2: Navigation Changes (Medium Priority)
5. Restructure navigation sections
6. Add back button
7. Update active states
8. Add section dividers

### Phase 3: Polish & Details (Low Priority)
9. Update typography sizes
10. Fine-tune spacing
11. Update icons to match Figma exactly
12. Add shadows and subtle effects

## Testing Checklist
- [ ] Colors match Figma exactly
- [ ] Sidebar width is 256px
- [ ] Main content has 14px rounded top-left corner
- [ ] Navigation has 4 sections in correct order
- [ ] Active state uses teal gradient
- [ ] Back button is present and functional
- [ ] API key text displays in #00d492 color
- [ ] Create button uses gradient
- [ ] Section dividers are visible
- [ ] Mobile view maintains functionality

## Related Files
- `src/pages/SettingsClaude.jsx` - Main settings component
- `src/styles/settings-claude.css` - Settings-specific styles
- `tailwind.config.js` - May need color updates here too
- `src/App.jsx` - Routing configuration

## Notes
- The Figma design focuses specifically on the API Keys section, but the changes should be applied consistently across all settings sections
- Font family "Cousine" is used for code/monospace text in Figma
- The design uses more translucent backgrounds with backdrop effects
- Navigation structure change requires updating the section rendering logic
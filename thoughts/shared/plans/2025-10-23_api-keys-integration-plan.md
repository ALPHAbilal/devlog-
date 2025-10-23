# API Keys Integration Plan - `/settings/api` → `/settings`

**Created**: 2025-10-23
**Status**: Ready for Implementation
**Priority**: HIGH
**Estimated Effort**: 4-6 hours

---

## Executive Summary

This plan consolidates the standalone `/settings/api` page into the main `/settings` page's API section using the Figma design (node-id: 11-268). Users will no longer need to navigate away from settings to manage API keys.

**Outcome**: Single integrated API Keys management experience in `/settings`

---

## Phase 1: Setup & Dependencies (30 minutes)

### 1.1 Add Required Imports
**File**: `src/pages/SettingsClaude.jsx`
**Action**: Add new imports at the top

```javascript
// Add these imports after existing imports
import { useToast } from '../hooks/useToast'
import { useAnalytics } from '../hooks/useAnalytics'
// Also need icons for API key cards (if not already imported)
import { Key, Copy, Trash2, CheckCircle, Shield } from 'lucide-react'
```

**Status**: - [ ] Imports added

### 1.2 Add State Variables for API Keys
**File**: `src/pages/SettingsClaude.jsx`
**Location**: After line 62, in the SettingsClaude function

```javascript
// API Keys management state - add after existing useState declarations
const [apiKeys, setApiKeys] = useState([])
const [apiKeysLoading, setApiKeysLoading] = useState(true)
const [newApiKey, setNewApiKey] = useState(null)
const [showCreateSheet, setShowCreateSheet] = useState(false)
const [creating, setCreating] = useState(false)
const [newKeyName, setNewKeyName] = useState('')
const [copiedKey, setCopiedKey] = useState(false)
```

**Status**: - [ ] State variables added

---

## Phase 2: Business Logic Functions (1-1.5 hours)

### 2.1 Copy Function
**File**: `src/pages/SettingsClaude.jsx`
**Location**: Add before the JSX return statement

Copy the `copyToClipboard` function from research document (lines 451-459)

**Key Points**:
- Handles clipboard write
- Shows toast notification
- Tracks analytics event

**Status**: - [ ] copyToClipboard function added

### 2.2 Load API Keys Function
**File**: `src/pages/SettingsClaude.jsx`
**Location**: Add before the JSX return statement

Copy the `loadApiKeys` function from research document (lines 390-411)

**Key Points**:
- Queries Supabase api_keys table
- Filters is_active = true
- Sets state with loaded keys
- Tracks analytics

**Status**: - [ ] loadApiKeys function added

### 2.3 Create API Key Function
**File**: `src/pages/SettingsClaude.jsx`
**Location**: Add before the JSX return statement

Copy the `createApiKey` function from research document (lines 332-384)

**Key Points**:
- Generates 32-byte secure key
- Hashes with SHA-256
- Stores in Supabase
- Shows key once
- Handles mobile & desktop

**Status**: - [ ] createApiKey function added

### 2.4 Delete API Key Function
**File**: `src/pages/SettingsClaude.jsx`
**Location**: Add before the JSX return statement

Copy the `deleteApiKey` function from research document (lines 417-445)

**Key Points**:
- Soft deletes via is_active flag
- Tracks key age/usage
- Shows confirmation dialog
- Updates local state

**Status**: - [ ] deleteApiKey function added

### 2.5 Load Keys on Section Change
**File**: `src/pages/SettingsClaude.jsx`
**Location**: After other useEffect hooks (after line 142)

```javascript
// Load API keys when API section becomes active
useEffect(() => {
  if (activeSection === 'api' && apiKeysLoading) {
    loadApiKeys()
  }
}, [activeSection])
```

**Status**: - [ ] useEffect for loading added

---

## Phase 3: Update JSX - API Section (1.5-2 hours)

### 3.1 Extract Current API Section
**File**: `src/pages/SettingsClaude.jsx`
**Location**: Lines 277-321

**Action**: Delete this entire section (will be replaced)

**Status**: - [ ] Old API section identified

### 3.2 Replace with New Inline Implementation
**File**: `src/pages/SettingsClaude.jsx`
**Location**: Lines 277-321 (same location)

Replace with the new JSX structure from research document (lines 469-652)

**Sections to Include**:
1. Section title & description
2. API Key success notification
3. Create Key section (desktop & mobile)
4. Active Keys list with cards
5. Setup guides with accordions
6. Mobile bottom sheet

**Status**: - [ ] New API section JSX added

---

## Phase 4: Add Components (1 hour)

### 4.1 Add ApiKeyCard Component
**File**: `src/pages/SettingsClaude.jsx`
**Location**: Add before the main SettingsClaude function

Copy from `src/pages/settings/api.jsx` lines 30-87

**Component Props**:
- `apiKey` - API key object
- `onDelete` - Delete handler
- `onCopy` - Copy handler

**Status**: - [ ] ApiKeyCard component added

### 4.2 Add CodeBlock Component
**File**: `src/pages/SettingsClaude.jsx`
**Location**: Add before SettingsClaude function

Copy from `src/pages/settings/api.jsx` lines 89-100

**Component Props**:
- `code` - Code string
- `onCopy` - Copy handler
- `context` - Optional context string

**Status**: - [ ] CodeBlock component added

### 4.3 Add SetupAccordion Component
**File**: `src/pages/SettingsClaude.jsx`
**Location**: Add before SettingsClaude function

Copy from `src/pages/settings/api.jsx` lines 102-131

**Component Props**:
- `title` - Accordion title
- `description` - Description text
- `isRecommended` - Show badge
- `defaultOpen` - Initial state
- `children` - Content

**Status**: - [ ] SetupAccordion component added

---

## Phase 5: Add Styling (1-1.5 hours)

### 5.1 Add CSS Classes
**File**: `src/styles/settings-claude.css`
**Location**: End of file

Add all CSS classes from research document (lines 662-742)

**Classes to Add**:
- `.api-key-card` & hover states
- `.api-key-header`, `.api-key-info`, `.api-key-meta`
- `.api-key-actions`, `.delete-button`
- `.api-key-success`, `.api-key-display`
- `.create-key-section`, `.create-key-inline`
- `.key-name-input`
- `.setup-accordion` & `.setup-accordion-header`
- `.setup-guide`, `.setup-intro`, `.setup-step`
- `.code-block`, `.code-block pre`
- `.empty-state`, `.loading-state`
- `.api-keys-list`

**Status**: - [ ] CSS classes added

### 5.2 Add Mobile Responsive Styles
**File**: `src/styles/settings-claude.css`
**Location**: In mobile media query section

Add mobile-specific overrides from research document (lines 732-742)

**Key Changes**:
- `.api-key-display` - flex-direction column
- `.api-key-card` - responsive sizing

**Status**: - [ ] Mobile styles added

---

## Phase 6: Add Setup Guide Accordions (30 minutes)

### 6.1 Add All Setup Guide Sections
**File**: `src/pages/SettingsClaude.jsx`
**Location**: After Claude Code accordion (after line ~601)

Add the remaining `SetupAccordion` components:
1. Claude Desktop
2. VS Code & Cursor

Copy the complete content from `src/pages/settings/api.jsx` lines 450-517

**Status**: - [ ] All setup guides added

---

## Phase 7: Cleanup & Configuration (30 minutes)

### 7.1 Remove Route from App.jsx
**File**: `src/App.jsx`
**Action**: Find and remove the lazy-loaded `/settings/api` route

Look for something like:
```javascript
const ApiSettingsPage = lazy(() => import('./pages/settings/api'))
// and
<Route path="/settings/api" element={<ApiSettingsPage />} />
```

**Status**: - [ ] Route removed from App.jsx

### 7.2 Archive api.jsx (Optional)
**File**: `src/pages/settings/api.jsx`
**Action**: Rename to `api.jsx.backup` or move to archive

This preserves the reference implementation while removing it from the build.

**Status**: - [ ] api.jsx archived

---

## Phase 8: Testing (1 hour)

### 8.1 Desktop Testing
**Actions**:
- [ ] Navigate to `/settings` and click API Keys tab
- [ ] Verify section loads without navigation
- [ ] Test create key flow
- [ ] Verify key displays once then shows preview
- [ ] Test copy button functionality
- [ ] Test delete key with confirmation
- [ ] Verify accordions expand/collapse
- [ ] Test code block copy buttons

**Status**: - [ ] Desktop testing complete

### 8.2 Mobile Testing
**Actions**:
- [ ] Access `/settings` on mobile
- [ ] Verify bottom sheet opens for key creation
- [ ] Test key creation on mobile
- [ ] Verify all sections display correctly
- [ ] Test touch interactions
- [ ] Verify responsive layout

**Status**: - [ ] Mobile testing complete

### 8.3 Cross-Browser Testing
**Actions**:
- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Safari
- [ ] Verify clipboard functionality

**Status**: - [ ] Cross-browser testing complete

### 8.4 Functionality Testing
**Actions**:
- [ ] Verify keys load from database
- [ ] Verify analytics events fire
- [ ] Verify toast notifications appear
- [ ] Verify error handling
- [ ] Check console for errors

**Status**: - [ ] Functionality testing complete

---

## Phase 9: Verification (30 minutes)

### 9.1 Code Quality
**Actions**:
- [ ] Run linter (npm run lint)
- [ ] Check for console errors
- [ ] Verify no unused imports
- [ ] Check TypeScript/prop types

**Status**: - [ ] Code quality verified

### 9.2 Figma Design Compliance
**Actions**:
- [ ] Compare with Figma design node-id 11-268
- [ ] Verify colors match
- [ ] Verify spacing/typography
- [ ] Verify component layout
- [ ] Verify mobile responsiveness

**Status**: - [ ] Figma design compliance verified

### 9.3 Performance
**Actions**:
- [ ] Check initial load time
- [ ] Verify no excessive re-renders
- [ ] Check memory usage
- [ ] Verify smooth animations

**Status**: - [ ] Performance verified

---

## Success Criteria Checklist

- [ ] All API key functionality available from `/settings` API section
- [ ] No navigation to separate page required
- [ ] Matches Figma design (node-id: 11-268)
- [ ] Mobile and desktop responsive
- [ ] All CRUD operations working
- [ ] Copy-to-clipboard functionality working
- [ ] Setup guides visible and usable
- [ ] Proper error handling and toast notifications
- [ ] Analytics events tracked
- [ ] `/settings/api` route removed from App.jsx
- [ ] Code quality verified (lint passing)
- [ ] No breaking changes to API key schema
- [ ] No breaking changes to backend endpoints
- [ ] All tests passing

---

## Files Modified Summary

| File | Type | Changes |
|------|------|---------|
| `src/pages/SettingsClaude.jsx` | PRIMARY | Add imports, state, functions, components, JSX |
| `src/styles/settings-claude.css` | PRIMARY | Add CSS classes for API keys UI |
| `src/App.jsx` | SECONDARY | Remove `/settings/api` route |
| `src/pages/settings/api.jsx` | REFERENCE | Archive (keep as backup) |

---

## Rollback Plan

If issues arise:
1. Revert SettingsClaude.jsx changes
2. Restore `/settings/api` route in App.jsx
3. Restore api.jsx from archive
4. All database changes are reversible (soft deletes only)

---

## Notes

- No backend changes needed
- All Supabase RLS policies already in place
- Component extraction to separate files is optional
- Can implement in smaller commits if desired
- Estimated total time: 4-6 hours
- No breaking changes to existing APIs

---

## Implementation Order Recommendation

1. **First**: Phase 1 (Setup imports & state)
2. **Second**: Phase 2 (Add business logic functions)
3. **Third**: Phase 5 (Add styling - avoids visual glitches)
4. **Fourth**: Phase 3 (Update JSX - replaces old section)
5. **Fifth**: Phase 4 (Add components - needed by JSX)
6. **Sixth**: Phase 6 (Add remaining accordions)
7. **Seventh**: Phase 7 (Clean up routing)
8. **Eighth**: Phase 8-9 (Testing & verification)

This order prevents errors and ensures proper functioning at each step.

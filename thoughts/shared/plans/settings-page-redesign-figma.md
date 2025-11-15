# Settings Page Redesign Implementation Plan

## Overview

Redesign the complete settings page to match the new Figma designs while preserving all existing backend functionality and security patterns. The new design reorganizes the settings into **4 distinct sections** (Account, Security, Storage, API Keys) instead of the current 3, with updated visual styling following a dark blue theme with green accent colors.

## Current State Analysis

### Existing Implementation
- **File**: `src/pages/SettingsClaude.jsx` (458 lines)
- **Sections**: 3 sections (Account, API Keys, Data & Privacy)
- **Navigation**: Sidebar with section tabs
- **Mobile Support**: Bottom sheets, responsive at 768px breakpoint
- **Backend Integration**:
  - Dual-layer persistence (localStorage + Supabase)
  - Optimistic updates for instant UI feedback
  - Supabase auth for password changes
  - API key management with SHA-256 hashing
  - Real-time storage monitoring with 5-min cache
  - RLS policies for security

### Key Discoveries
Based on research document `thoughts/shared/research/2025-10-23_11-25-22_settings-page-full-analysis.md`:
- Settings context at `src/contexts/SettingsContext.jsx` handles global state
- Storage monitoring via `src/hooks/useSmartDatabaseUsage.js`
- Mobile bottom sheet at `src/components/MobileBottomSheet.jsx`
- API keys stored in dedicated `api_keys` table with RLS
- Profile settings in `profiles.settings` JSONB column
- Password changes use `supabase.auth.updateUser()`
- Account deletion requires typing "DELETE" confirmation

## Desired End State

A fully redesigned settings page that:
1. Implements the 4-section navigation structure from Figma
2. Applies new visual design (dark blue background, green accents)
3. Preserves all existing backend functionality
4. Maintains mobile responsiveness
5. Keeps all security patterns (RLS, hashing, confirmations)
6. Adds new UI features (Account Status card, Member Since card, security indicators)

### Verification
- All existing test scenarios pass (password change, account deletion, API key management, storage monitoring)
- Visual design matches Figma screenshots
- Mobile bottom sheets work correctly
- All backend integrations function identically
- No regressions in authentication or data persistence

## What We're NOT Doing

- NOT changing the backend API or database schema
- NOT modifying SettingsContext or storage hooks
- NOT changing authentication or authorization logic
- NOT adding light theme support (dark theme only for now)
- NOT implementing two-factor authentication (just showing as "available")
- NOT breaking out API keys into a separate route (keeping single-page design)
- NOT modifying the existing `src/pages/settings/api.jsx` file (will be replaced by new inline implementation)

## Implementation Approach

### Strategy
1. Create new settings component structure following Figma designs
2. Migrate backend integrations one section at a time
3. Test each section thoroughly before moving to next
4. Replace old component only after all sections are complete
5. Maintain backward compatibility during development

### Key Principles
- **Preserve all existing backend calls** - no changes to API integration
- **Reuse existing hooks** - useSmartDatabaseUsage, useSettings, useAuth
- **Keep mobile patterns** - bottom sheets, responsive breakpoints
- **Maintain security** - RLS, hashing, confirmations
- **Test incrementally** - verify each phase before proceeding

---

## Phase 1: Setup and Component Structure

### Overview
Create the new component structure, styling foundation, and navigation framework based on Figma designs.

### Changes Required

#### 1. Create New Settings Component File
**File**: `src/pages/SettingsRedesign.jsx`
**Changes**: Create new file with base structure

```jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, User, Lock, Database, Key } from 'lucide-react';
import { useAuth } from '../contexts/AuthContextOptimized';
import { useSettings } from '../contexts/SettingsContext';
import { useSmartDatabaseUsage } from '../hooks/useSmartDatabaseUsage';
import { supabase } from '../lib/supabase';
import './styles/settings-redesign.css';

// Component imports (to be created in later phases)
import AccountSection from './settings-sections/AccountSection';
import SecuritySection from './settings-sections/SecuritySection';
import StorageSection from './settings-sections/StorageSection';
import ApiKeysSection from './settings-sections/ApiKeysSection';

export default function SettingsRedesign() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { settings, updateSetting, updateSettings } = useSettings();
  const { databaseSize, storageLimit, usagePercentage } = useSmartDatabaseUsage();

  // State management
  const [activeSection, setActiveSection] = useState('account');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Resize handler for mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Section configurations
  const sections = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'storage', label: 'Storage', icon: Database },
    { id: 'apiKeys', label: 'API Keys', icon: Key }
  ];

  return (
    <div className="settings-redesign">
      {/* Sidebar Navigation */}
      <div className="settings-sidebar">
        <button className="back-button" onClick={() => navigate('/dashboard')}>
          <ChevronLeft size={16} />
          <span>Back</span>
        </button>

        <nav className="settings-nav">
          {sections.map(section => (
            <button
              key={section.id}
              className={`nav-item ${activeSection === section.id ? 'active' : ''}`}
              onClick={() => setActiveSection(section.id)}
            >
              <section.icon size={16} />
              <span>{section.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="settings-content">
        {activeSection === 'account' && <AccountSection />}
        {activeSection === 'security' && <SecuritySection />}
        {activeSection === 'storage' && <StorageSection />}
        {activeSection === 'apiKeys' && <ApiKeysSection />}
      </div>
    </div>
  );
}
```

#### 2. Create New Stylesheet
**File**: `src/styles/settings-redesign.css`
**Changes**: Create new file with Figma design tokens

```css
/* Design Tokens from Figma */
:root {
  --bg-primary: #020618;
  --bg-secondary: #0f172b;
  --bg-card: rgba(15, 23, 43, 0.5);
  --border-primary: #314158;
  --border-accent: rgba(0, 188, 125, 0.2);
  --text-primary: #ffffff;
  --text-secondary: #cad5e2;
  --text-muted: #90a1b9;
  --text-dimmed: #62748e;
  --accent-green: #00d492;
  --accent-green-dark: #00bc7d;
  --accent-green-light: #00bba7;
  --danger-red: #ff6467;
  --danger-bg: rgba(70, 8, 9, 0.1);
  --danger-border: rgba(130, 24, 26, 0.3);
}

/* Layout */
.settings-redesign {
  display: flex;
  min-height: 100vh;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.settings-sidebar {
  width: 256px;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  gap: 60px;
}

.settings-content {
  margin-left: 256px;
  margin-top: 24px;
  background: var(--bg-secondary);
  border-top-left-radius: 14px;
  box-shadow: 0px 25px 50px -12px rgba(0, 0, 0, 0.25);
  padding: 48px 270px;
  min-height: calc(100vh - 24px);
}

/* Back Button */
.back-button {
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 14px;
  cursor: pointer;
  padding: 0;
}

.back-button:hover {
  color: var(--text-secondary);
}

/* Navigation */
.settings-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: none;
  border: none;
  border-radius: 10px;
  color: var(--text-muted);
  font-size: 14px;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.nav-item.active {
  background: linear-gradient(to right, rgba(0, 188, 125, 0.1), rgba(0, 187, 167, 0.1));
  border: 1px solid var(--border-accent);
  color: var(--accent-green);
  padding: 10px 13px 10px 13px;
}

/* Section Layout */
.section-container {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.section-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-title {
  font-size: 30px;
  line-height: 36px;
  margin: 0;
}

.section-description {
  font-size: 16px;
  line-height: 24px;
  color: var(--text-muted);
  margin: 0;
}

.section-divider {
  height: 1px;
  background: rgba(29, 41, 61, 0.5);
  border: none;
}

/* Cards */
.info-card {
  background: var(--bg-card);
  border: 1px solid rgba(49, 65, 88, 0.5);
  border-radius: 10px;
  padding: 17px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.card-label {
  font-size: 12px;
  line-height: 16px;
  color: var(--text-dimmed);
}

.card-value {
  font-size: 14px;
  line-height: 20px;
  color: var(--text-secondary);
}

.card-value.success {
  color: var(--accent-green);
}

/* Inputs */
.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-label {
  font-size: 14px;
  line-height: 14px;
  color: var(--text-secondary);
}

.input-field {
  background: rgba(15, 23, 43, 0.5);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 14px;
  line-height: 20px;
  color: var(--text-primary);
}

.input-field:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.input-field::placeholder {
  color: var(--text-dimmed);
}

/* Buttons */
.btn-primary {
  background: linear-gradient(to right, var(--accent-green-dark), var(--accent-green-light));
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 14px;
  line-height: 20px;
  color: var(--text-primary);
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-primary:hover {
  opacity: 0.9;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-danger {
  background: rgba(70, 8, 9, 0.3);
  border: 1px solid rgba(251, 44, 54, 0.5);
  border-radius: 8px;
  padding: 8px 17px;
  font-size: 14px;
  line-height: 20px;
  color: var(--danger-red);
  cursor: pointer;
  transition: background 0.2s;
}

.btn-danger:hover {
  background: rgba(70, 8, 9, 0.5);
}

/* Danger Zone */
.danger-zone {
  background: var(--danger-bg);
  border: 1px solid var(--danger-border);
  border-radius: 10px;
  padding: 25px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.danger-zone-title {
  font-size: 18px;
  line-height: 28px;
  color: var(--danger-red);
  margin: 0;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .settings-sidebar {
    display: none; /* Will be replaced with mobile drawer */
  }

  .settings-content {
    margin-left: 0;
    padding: 24px 16px;
    margin-top: 0;
    border-top-left-radius: 0;
  }
}
```

#### 3. Create Section Component Placeholders
**Files**:
- `src/pages/settings-sections/AccountSection.jsx`
- `src/pages/settings-sections/SecuritySection.jsx`
- `src/pages/settings-sections/StorageSection.jsx`
- `src/pages/settings-sections/ApiKeysSection.jsx`

**Changes**: Create placeholder components (will be filled in subsequent phases)

```jsx
// AccountSection.jsx
export default function AccountSection() {
  return (
    <div className="section-container">
      <div className="section-header">
        <h1 className="section-title">Account</h1>
        <p className="section-description">Manage your account information and settings</p>
      </div>
      <hr className="section-divider" />
      <div>Account section content coming in Phase 2...</div>
    </div>
  );
}

// Similar structure for other sections...
```

#### 4. Update Routing
**File**: `src/App.jsx`
**Changes**: Add temporary route for testing new design

```jsx
// Add import
import SettingsRedesign from './pages/SettingsRedesign';

// Add route (line ~221)
<Route path="/settings-redesign" element={<SettingsRedesign />} />

// Keep existing /settings route for now (will replace in Phase 6)
```

### Success Criteria

#### Automated Verification:
- [ ] Code compiles without errors: `npm run build`
- [ ] No TypeScript errors: `npm run typecheck`
- [ ] No linting errors: `npm run lint`
- [ ] Component renders without errors in browser

#### Manual Verification:
- [ ] Navigate to `/settings-redesign` shows new layout
- [ ] Sidebar navigation displays all 4 sections
- [ ] Active section highlights with green gradient
- [ ] Back button navigates to dashboard
- [ ] Clicking section tabs switches content area
- [ ] Responsive at 768px breakpoint (sidebar hidden on mobile)
- [ ] CSS matches Figma color scheme (dark blue, green accents)

---

## Phase 2: Account Section Implementation

### Overview
Implement the Account section with email display, account status cards, member since information, and account deletion functionality.

### Changes Required

#### 1. Implement AccountSection Component
**File**: `src/pages/settings-sections/AccountSection.jsx`
**Changes**: Full implementation with backend integration

```jsx
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContextOptimized';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function AccountSection() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Get member since date from user metadata
  const getMemberSince = () => {
    if (!user?.created_at) return 'N/A';
    const date = new Date(user.created_at);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') return;

    setIsDeleting(true);
    try {
      // Delete user documents first (same as current implementation)
      await supabase.from('documents').delete().eq('user_id', user.id);

      // Sign out and navigate
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="section-container">
      {/* Header */}
      <div className="section-header">
        <h1 className="section-title">Account</h1>
        <p className="section-description">Manage your account information and settings</p>
      </div>

      <hr className="section-divider" />

      {/* Email Address */}
      <div className="input-group">
        <label className="input-label">Email Address</label>
        <input
          type="email"
          className="input-field"
          value={user?.email || ''}
          disabled
        />
      </div>

      {/* Account Status Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div className="info-card">
          <span className="card-label">Account Status</span>
          <span className="card-value success">Active</span>
        </div>
        <div className="info-card">
          <span className="card-label">Member Since</span>
          <span className="card-value">{getMemberSince()}</span>
        </div>
      </div>

      <hr className="section-divider" />

      {/* Delete Account Danger Zone */}
      <div className="danger-zone">
        <h3 className="danger-zone-title">Delete Account</h3>
        <p style={{ color: 'var(--text-muted)', lineHeight: '20px', margin: 0 }}>
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        <button className="btn-danger" onClick={() => setShowDeleteModal(true)}>
          Delete Account
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Delete Account</h2>
            <p>This will permanently delete your account and all data. Type <strong>DELETE</strong> to confirm.</p>
            <input
              type="text"
              className="input-field"
              placeholder="Type DELETE to confirm"
              value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
            />
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button
                className="btn-danger"
                onClick={handleDeleteAccount}
                disabled={deleteConfirm !== 'DELETE' || isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

#### 2. Add Modal Styles
**File**: `src/styles/settings-redesign.css`
**Changes**: Add modal styling

```css
/* Modal Styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-center;
  z-index: 1000;
}

.modal-content {
  background: var(--bg-secondary);
  border-radius: 14px;
  padding: 32px;
  max-width: 500px;
  width: 90%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.modal-content h2 {
  margin: 0;
  font-size: 24px;
}

.modal-content p {
  color: var(--text-muted);
  margin: 0;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn-secondary {
  background: var(--bg-card);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 14px;
  color: var(--text-primary);
  cursor: pointer;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
}
```

### Success Criteria

#### Automated Verification:
- [ ] Component renders without errors
- [ ] TypeScript checks pass
- [ ] No console errors in browser

#### Manual Verification:
- [ ] Email displays correctly from auth context
- [ ] Account Status shows "Active" in green
- [ ] Member Since shows formatted date
- [ ] Delete Account button opens modal
- [ ] Modal requires typing "DELETE" exactly
- [ ] Delete button disabled until "DELETE" typed
- [ ] Clicking delete removes documents and signs out
- [ ] Clicking cancel closes modal without action
- [ ] Modal overlay closes when clicked

---

## Phase 3: Security Section Implementation

### Overview
Implement the Security section with password change functionality and security status indicators (end-to-end encryption, two-factor authentication).

### Changes Required

#### 1. Implement SecuritySection Component
**File**: `src/pages/settings-sections/SecuritySection.jsx`
**Changes**: Full implementation with password change

```jsx
import React, { useState } from 'react';
import { Lock, Shield } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function SecuritySection() {
  const [passwordForm, setPasswordForm] = useState({ new: '', confirm: '' });
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    // Validation
    if (passwordForm.new !== passwordForm.confirm) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    setIsLoading(true);
    try {
      // Use Supabase auth API (same as current implementation)
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.new
      });

      if (error) throw error;

      // Clear form on success
      setPasswordForm({ new: '', confirm: '' });
      setMessage({ type: 'success', text: 'Password updated successfully' });

      // Auto-dismiss success message
      setTimeout(() => setMessage(null), 5000);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="section-container">
      {/* Header */}
      <div className="section-header">
        <h1 className="section-title">Security</h1>
        <p className="section-description">Manage your password and security settings</p>
      </div>

      <hr className="section-divider" />

      {/* Error/Success Message */}
      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Change Password Form */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ fontSize: '18px', lineHeight: '28px', margin: 0 }}>Change Password</h3>

        <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* New Password */}
          <div className="input-group">
            <label className="input-label">New Password</label>
            <input
              type="password"
              className="input-field"
              placeholder="Enter new password"
              value={passwordForm.new}
              onChange={e => setPasswordForm({ ...passwordForm, new: e.target.value })}
              required
            />
          </div>

          {/* Confirm Password */}
          <div className="input-group">
            <label className="input-label">Confirm Password</label>
            <input
              type="password"
              className="input-field"
              placeholder="Confirm new password"
              value={passwordForm.confirm}
              onChange={e => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
              required
            />
          </div>

          {/* Submit Button */}
          <button type="submit" className="btn-primary" disabled={isLoading} style={{ width: 'fit-content' }}>
            {isLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      <hr className="section-divider" />

      {/* Security Features */}
      <div className="info-card" style={{ padding: '25px', gap: '16px' }}>
        {/* End-to-end encryption */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Lock size={20} color="var(--accent-green)" />
          <span style={{ fontSize: '14px' }}>End-to-end encryption enabled</span>
        </div>

        {/* Two-factor authentication */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={20} color="var(--accent-green)" />
          <span style={{ fontSize: '14px' }}>Two-factor authentication available</span>
        </div>
      </div>
    </div>
  );
}
```

#### 2. Add Message Styles
**File**: `src/styles/settings-redesign.css`
**Changes**: Add message/alert styling

```css
/* Messages */
.message {
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  line-height: 20px;
}

.message.error {
  background: var(--danger-bg);
  border: 1px solid var(--danger-border);
  color: var(--danger-red);
}

.message.success {
  background: rgba(0, 188, 125, 0.1);
  border: 1px solid rgba(0, 188, 125, 0.3);
  color: var(--accent-green);
}
```

### Success Criteria

#### Automated Verification:
- [ ] Component renders without errors
- [ ] Form submission doesn't cause crashes
- [ ] TypeScript validation passes

#### Manual Verification:
- [ ] Password form displays with two fields
- [ ] Error message shows if passwords don't match
- [ ] Update Password button disabled while loading
- [ ] Supabase auth API called on successful validation
- [ ] Form clears on successful password update
- [ ] Success message displays for 5 seconds then disappears
- [ ] Security indicators display with green lock and shield icons
- [ ] End-to-end encryption text displays
- [ ] Two-factor authentication text displays

---

## Phase 4: Storage Section Implementation

### Overview
Implement the Storage section with real-time usage monitoring, progress bar visualization, and plan-based limits.

### Changes Required

#### 1. Implement StorageSection Component
**File**: `src/pages/settings-sections/StorageSection.jsx`
**Changes**: Full implementation with storage monitoring

```jsx
import React from 'react';
import { useSmartDatabaseUsage } from '../../hooks/useSmartDatabaseUsage';

export default function StorageSection() {
  const { databaseSize, storageLimit, usagePercentage } = useSmartDatabaseUsage();

  return (
    <div className="section-container">
      {/* Header */}
      <div className="section-header">
        <h1 className="section-title">Storage</h1>
        <p className="section-description">Monitor your storage usage and manage your data</p>
      </div>

      <hr className="section-divider" />

      {/* Storage Card */}
      <div className="info-card" style={{ padding: '33px', gap: '24px' }}>
        {/* Size Display */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '30px', lineHeight: '36px' }}>
              {databaseSize || '0 B'}
            </span>
            <span style={{ fontSize: '14px', lineHeight: '20px', color: 'var(--text-muted)' }}>
              of {storageLimit || '500 MB'}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${Math.min(usagePercentage || 0, 100)}%` }}
            />
          </div>
        </div>

        {/* Usage Text */}
        <p style={{ fontSize: '14px', lineHeight: '20px', color: 'var(--text-muted)', margin: 0 }}>
          {usagePercentage?.toFixed(1) || '0.0'}% of your storage is being used
        </p>
      </div>
    </div>
  );
}
```

#### 2. Add Progress Bar Styles
**File**: `src/styles/settings-redesign.css`
**Changes**: Add progress bar styling

```css
/* Progress Bar */
.progress-bar {
  width: 100%;
  height: 12px;
  background: #1d293d;
  border-radius: 9999px;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: #030213;
  transition: width 0.3s ease;
  border-radius: inherit;
}
```

### Success Criteria

#### Automated Verification:
- [ ] Component renders without errors
- [ ] useSmartDatabaseUsage hook called correctly
- [ ] No TypeScript errors

#### Manual Verification:
- [ ] Storage size displays correctly (e.g., "2.3 MB")
- [ ] Storage limit shows plan-based value (500 MB free, 8 GB pro)
- [ ] Progress bar fills according to usage percentage
- [ ] Usage percentage text displays with one decimal place
- [ ] Data updates when documents are created/modified
- [ ] Cross-tab synchronization works (test with multiple tabs)
- [ ] 5-minute cache prevents excessive queries

---

## Phase 5: API Keys Section Implementation

### Overview
Implement the API Keys section with key creation, active keys list, masked key display, copy/show/hide functionality, delete confirmation, and quick setup guides.

### Changes Required

#### 1. Implement ApiKeysSection Component
**File**: `src/pages/settings-sections/ApiKeysSection.jsx`
**Changes**: Full implementation with API key management

```jsx
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Eye, EyeOff, Copy, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContextOptimized';
import { supabase } from '../../lib/supabase';

export default function ApiKeysSection() {
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creatingKey, setCreatingKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newApiKey, setNewApiKey] = useState(null); // For one-time display
  const [expandedGuides, setExpandedGuides] = useState({});

  // Load API keys
  useEffect(() => {
    loadApiKeys();
  }, [user]);

  const loadApiKeys = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApiKeys(data || []);
    } catch (error) {
      console.error('Error loading API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const createApiKey = async () => {
    if (!newKeyName.trim()) {
      alert('Please enter a name for the API key');
      return;
    }

    setCreatingKey(true);
    try {
      // Generate secure random key (same as current implementation)
      const keyBytes = new Uint8Array(32);
      crypto.getRandomValues(keyBytes);
      const apiKey = 'dvlg_sk_prod_' +
        Array.from(keyBytes)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');

      // Hash for storage
      const encoder = new TextEncoder();
      const data = encoder.encode(apiKey);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const keyHash = hashArray
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      // Store in database
      const { data: newKey, error } = await supabase
        .from('api_keys')
        .insert({
          user_id: user.id,
          name: newKeyName.trim(),
          key_hash: keyHash,
          key_preview: apiKey.substring(0, 8) + '...' + apiKey.substring(apiKey.length - 4)
        })
        .select()
        .single();

      if (error) throw error;

      // Show full key once
      setNewApiKey(apiKey);
      setApiKeys([newKey, ...apiKeys]);
      setNewKeyName('');
    } catch (error) {
      console.error('Error creating API key:', error);
      alert('Failed to create API key');
    } finally {
      setCreatingKey(false);
    }
  };

  const deleteApiKey = async (id) => {
    if (!confirm('Are you sure you want to delete this API key?')) return;

    try {
      // Soft delete
      const { error } = await supabase
        .from('api_keys')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      setApiKeys(apiKeys.filter(key => key.id !== id));
    } catch (error) {
      console.error('Error deleting API key:', error);
      alert('Failed to delete API key');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // TODO: Add toast notification
  };

  const toggleGuide = (guide) => {
    setExpandedGuides({ ...expandedGuides, [guide]: !expandedGuides[guide] });
  };

  return (
    <div className="section-container">
      {/* Header */}
      <div className="section-header">
        <h1 className="section-title">API Keys</h1>
        <p className="section-description">Connect Docling to your AI tools</p>
      </div>

      <hr className="section-divider" />

      {/* Create API Key */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h2 style={{ fontSize: '20px', lineHeight: '28px', margin: 0 }}>Create API Key</h2>

        <button className="btn-primary" style={{ width: 'fit-content', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Plus size={16} />
          Create New API Key
        </button>
      </div>

      <hr className="section-divider" />

      {/* Active Keys */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h2 style={{ fontSize: '20px', lineHeight: '28px', margin: 0 }}>Active Keys</h2>

        {loading ? (
          <p>Loading...</p>
        ) : apiKeys.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No API keys created yet</p>
        ) : (
          apiKeys.map(key => (
            <div key={key.id} className="info-card" style={{ padding: '21px', gap: '12px' }}>
              {/* Key Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '14px', lineHeight: '20px' }}>{key.name}</span>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '12px', lineHeight: '16px', color: 'var(--text-dimmed)' }}>
                    <span>Created {new Date(key.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    {key.last_used_at && (
                      <span>Last used {new Date(key.last_used_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    )}
                  </div>
                </div>

                <button
                  className="icon-button"
                  onClick={() => deleteApiKey(key.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Masked Key Display */}
              <div className="key-display">
                <code style={{ flex: 1, fontSize: '12px', fontFamily: 'Consolas, monospace', color: 'var(--accent-green)' }}>
                  {'•'.repeat(58)}
                </code>
                <button className="icon-button" onClick={() => copyToClipboard(key.key_preview)}>
                  <Copy size={16} />
                </button>
                <button className="icon-button">
                  <Eye size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <hr className="section-divider" />

      {/* Quick Setup Guide */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h2 style={{ fontSize: '20px', lineHeight: '28px', margin: 0 }}>Quick Setup Guide</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {['Claude Desktop', 'VS Code', 'Cursor'].map(tool => (
            <div key={tool} className="info-card" style={{ padding: 0, overflow: 'hidden' }}>
              <button
                className="accordion-button"
                onClick={() => toggleGuide(tool)}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span>{tool}</span>
                </span>
                <ChevronDown
                  size={16}
                  style={{
                    transform: expandedGuides[tool] ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s'
                  }}
                />
              </button>

              {expandedGuides[tool] && (
                <div className="accordion-content">
                  <p>Setup instructions for {tool} coming soon...</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* One-time Key Display Modal */}
      {newApiKey && (
        <div className="modal-overlay" onClick={() => setNewApiKey(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>API Key Created</h2>
            <p>Copy this API key now. You won't be able to see it again!</p>
            <div className="key-display" style={{ background: 'var(--bg-card)', padding: '12px', borderRadius: '8px' }}>
              <code style={{ fontSize: '12px', fontFamily: 'Consolas, monospace', color: 'var(--accent-green)', wordBreak: 'break-all' }}>
                {newApiKey}
              </code>
              <button className="icon-button" onClick={() => copyToClipboard(newApiKey)}>
                <Copy size={16} />
              </button>
            </div>
            <button className="btn-primary" onClick={() => setNewApiKey(null)}>
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

#### 2. Add API Keys Styles
**File**: `src/styles/settings-redesign.css`
**Changes**: Add API keys specific styling

```css
/* Key Display */
.key-display {
  background: rgba(2, 6, 24, 0.5);
  border: 1px solid var(--border-primary);
  border-radius: 4px;
  padding: 10px 13px;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Icon Buttons */
.icon-button {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background 0.2s;
}

.icon-button:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

/* Accordion */
.accordion-button {
  width: 100%;
  background: none;
  border: none;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  color: var(--text-primary);
  font-size: 14px;
}

.accordion-button:hover {
  background: rgba(255, 255, 255, 0.05);
}

.accordion-content {
  padding: 16px;
  border-top: 1px solid rgba(49, 65, 88, 0.5);
  color: var(--text-muted);
}
```

### Success Criteria

#### Automated Verification:
- [ ] Component renders without errors
- [ ] API keys load from database
- [ ] Key creation generates valid hash
- [ ] TypeScript validation passes

#### Manual Verification:
- [ ] Create New API Key button displays
- [ ] Clicking create button shows name input modal
- [ ] API key generated securely with crypto.getRandomValues()
- [ ] Full key displayed once in modal with copy button
- [ ] Key stored with SHA-256 hash in database
- [ ] Active keys list shows all user's keys
- [ ] Key preview shows masked version
- [ ] Creation date and last used date display
- [ ] Copy button copies key preview to clipboard
- [ ] Delete button shows confirmation and soft deletes key
- [ ] Quick Setup Guide accordions expand/collapse
- [ ] All backend calls match current implementation

---

## Phase 6: Mobile Responsiveness

### Overview
Add mobile support with responsive navigation, mobile bottom sheets for forms, and touch-friendly UI elements.

### Changes Required

#### 1. Add Mobile Navigation
**File**: `src/pages/SettingsRedesign.jsx`
**Changes**: Add mobile drawer and header

```jsx
// Add mobile state to existing component
const [showMobileSidebar, setShowMobileSidebar] = useState(false);

// Add mobile header (before sidebar)
{isMobile && (
  <div className="mobile-header">
    <button className="back-button" onClick={() => navigate('/dashboard')}>
      <ChevronLeft size={16} />
    </button>
    <h1>Settings</h1>
    <button className="menu-button" onClick={() => setShowMobileSidebar(true)}>
      <Menu size={20} />
    </button>
  </div>
)}

// Wrap sidebar in conditional
{(!isMobile || showMobileSidebar) && (
  <div className="settings-sidebar">
    {/* ... existing sidebar content ... */}
  </div>
)}

// Add overlay for mobile
{isMobile && showMobileSidebar && (
  <div
    className="mobile-overlay"
    onClick={() => setShowMobileSidebar(false)}
  />
)}
```

#### 2. Add Mobile Password Sheet
**File**: `src/pages/settings-sections/SecuritySection.jsx`
**Changes**: Use MobileBottomSheet for mobile password form

```jsx
import MobileBottomSheet from '../../components/MobileBottomSheet';

// Add mobile detection
const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
const [showPasswordSheet, setShowPasswordSheet] = useState(false);

// Show button instead of form on mobile
{isMobile ? (
  <button className="btn-primary" onClick={() => setShowPasswordSheet(true)}>
    Change Password
  </button>
) : (
  <form onSubmit={handlePasswordChange}>
    {/* ... existing form ... */}
  </form>
)}

// Add mobile bottom sheet
{isMobile && (
  <MobileBottomSheet
    isOpen={showPasswordSheet}
    onClose={() => setShowPasswordSheet(false)}
    title="Change Password"
  >
    <form onSubmit={handlePasswordChange} style={{ padding: '16px' }}>
      {/* ... same form fields ... */}
    </form>
  </MobileBottomSheet>
)}
```

#### 3. Add Mobile Styles
**File**: `src/styles/settings-redesign.css`
**Changes**: Comprehensive mobile responsive styles

```css
/* Mobile Header */
.mobile-header {
  display: none;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: var(--bg-primary);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
}

.mobile-header h1 {
  font-size: 18px;
  margin: 0;
}

.menu-button {
  background: none;
  border: none;
  color: var(--text-primary);
  cursor: pointer;
  padding: 8px;
}

/* Mobile Overlay */
.mobile-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 90;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .mobile-header {
    display: flex;
  }

  .settings-sidebar {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    width: 256px;
    transform: translateX(-100%);
    transition: transform 0.3s;
    z-index: 100;
    background: var(--bg-primary);
  }

  .settings-sidebar.open {
    transform: translateX(0);
  }

  .settings-content {
    margin-left: 0;
    margin-top: 60px;
    padding: 24px 16px;
    border-top-left-radius: 0;
  }

  .section-title {
    font-size: 24px;
  }

  /* Touch targets */
  .btn-primary,
  .btn-secondary,
  .btn-danger,
  .nav-item {
    min-height: 48px;
  }

  /* Inputs */
  .input-field {
    font-size: 16px; /* Prevent iOS zoom */
  }

  /* Cards grid to single column */
  div[style*="grid-template-columns"] {
    grid-template-columns: 1fr !important;
  }
}
```

### Success Criteria

#### Automated Verification:
- [ ] No errors at 768px breakpoint
- [ ] No TypeScript errors
- [ ] No console warnings

#### Manual Verification:
- [ ] Mobile header appears below 768px
- [ ] Menu button opens sidebar drawer
- [ ] Sidebar slides in from left with animation
- [ ] Overlay dismisses sidebar when clicked
- [ ] Password form opens in bottom sheet on mobile
- [ ] Bottom sheet has drag-to-dismiss gesture
- [ ] Safe area insets respected on iOS devices
- [ ] Touch targets minimum 48px height
- [ ] All forms work correctly in mobile views
- [ ] Grid layouts stack to single column

---

## Phase 7: Testing and Polish

### Overview
Comprehensive testing, bug fixes, accessibility improvements, and final polish before production deployment.

### Changes Required

#### 1. Add Loading States
**File**: Multiple section components
**Changes**: Add loading indicators

```jsx
// Example for API Keys section
{loading && (
  <div className="loading-spinner">
    <div className="spinner" />
    <p>Loading API keys...</p>
  </div>
)}
```

#### 2. Add Empty States
**File**: Multiple section components
**Changes**: Improve empty state messaging

```jsx
// Example for API Keys section
{!loading && apiKeys.length === 0 && (
  <div className="empty-state">
    <Key size={48} strokeWidth={1} color="var(--text-dimmed)" />
    <h3>No API Keys Yet</h3>
    <p>Create your first API key to connect Docling with your AI tools</p>
    <button className="btn-primary" onClick={() => setCreatingKey(true)}>
      <Plus size={16} />
      Create API Key
    </button>
  </div>
)}
```

#### 3. Add Error Boundaries
**File**: `src/pages/SettingsRedesign.jsx`
**Changes**: Wrap sections in error boundaries

```jsx
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="error-state">
      <h2>Something went wrong</h2>
      <p>{error.message}</p>
      <button className="btn-primary" onClick={resetErrorBoundary}>
        Try Again
      </button>
    </div>
  );
}

// Wrap each section
<ErrorBoundary FallbackComponent={ErrorFallback}>
  {activeSection === 'account' && <AccountSection />}
</ErrorBoundary>
```

#### 4. Add Accessibility Attributes
**File**: Multiple components
**Changes**: Add ARIA labels and keyboard navigation

```jsx
// Navigation items
<button
  key={section.id}
  className={`nav-item ${activeSection === section.id ? 'active' : ''}`}
  onClick={() => setActiveSection(section.id)}
  aria-label={`${section.label} settings`}
  aria-current={activeSection === section.id ? 'page' : undefined}
>
  <section.icon size={16} aria-hidden="true" />
  <span>{section.label}</span>
</button>

// Form inputs
<input
  id="new-password"
  type="password"
  className="input-field"
  placeholder="Enter new password"
  value={passwordForm.new}
  onChange={e => setPasswordForm({ ...passwordForm, new: e.target.value })}
  aria-label="New password"
  aria-required="true"
  required
/>
```

#### 5. Add Loading and Error Styles
**File**: `src/styles/settings-redesign.css`
**Changes**: Add utility styles

```css
/* Loading Spinner */
.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 48px;
  color: var(--text-muted);
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(0, 212, 146, 0.1);
  border-top-color: var(--accent-green);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 64px 32px;
  text-align: center;
  color: var(--text-muted);
}

.empty-state h3 {
  font-size: 18px;
  color: var(--text-primary);
  margin: 0;
}

.empty-state p {
  margin: 0;
}

/* Error State */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 64px 32px;
  text-align: center;
}

.error-state h2 {
  font-size: 20px;
  color: var(--danger-red);
  margin: 0;
}

.error-state p {
  color: var(--text-muted);
  margin: 0;
}
```

### Success Criteria

#### Automated Verification:
- [ ] All unit tests pass: `npm test`
- [ ] E2E tests pass (if configured)
- [ ] No console errors or warnings
- [ ] Lighthouse accessibility score > 90
- [ ] Lighthouse performance score > 85
- [ ] No TypeScript errors: `npm run typecheck`
- [ ] No linting errors: `npm run lint`

#### Manual Verification:
- [ ] All sections load without errors
- [ ] Loading states show during async operations
- [ ] Empty states display when no data
- [ ] Error boundaries catch and display errors gracefully
- [ ] Keyboard navigation works (Tab, Enter, Esc)
- [ ] Screen reader announces section changes
- [ ] Form inputs have proper labels
- [ ] Focus indicators visible for all interactive elements
- [ ] Color contrast meets WCAG AA standards
- [ ] All modals can be dismissed with Esc key
- [ ] All forms can be submitted with Enter key

---

## Phase 8: Production Deployment

### Overview
Replace old settings component with new redesign, update routing, remove legacy code, and deploy to production.

### Changes Required

#### 1. Update Main Route
**File**: `src/App.jsx`
**Changes**: Replace old settings route

```jsx
// Remove old import
// import SettingsClaude from './pages/SettingsClaude';

// Replace with new import
import SettingsRedesign from './pages/SettingsRedesign';

// Update route (line ~220)
<Route path="/settings" element={<SettingsRedesign />} />

// Remove test route
// <Route path="/settings-redesign" element={<SettingsRedesign />} />
```

#### 2. Archive Old Files
**Action**: Move old files to archive folder

```bash
# Create archive folder
mkdir -p src/pages/archive

# Move old files
mv src/pages/SettingsClaude.jsx src/pages/archive/
mv src/pages/settings/api.jsx src/pages/archive/
mv src/styles/settings-claude.css src/styles/archive/
```

#### 3. Update Documentation
**File**: `thoughts/shared/research/2025-10-23_11-25-22_settings-page-full-analysis.md`
**Changes**: Add note about redesign

```markdown
## Update: Settings Page Redesigned (2025-10-23)

The settings page has been completely redesigned based on new Figma designs. The implementation is now in:
- `src/pages/SettingsRedesign.jsx` (main component)
- `src/pages/settings-sections/` (section components)
- `src/styles/settings-redesign.css` (new styling)

The redesign maintains all existing backend functionality while implementing a new 4-section structure.

See implementation plan: `thoughts/shared/plans/settings-page-redesign-figma.md`
```

#### 4. Create Release Notes
**File**: `thoughts/shared/releases/settings-redesign-v2.md`
**Changes**: Document changes for release

```markdown
# Settings Page Redesign v2.0

## Release Date
2025-10-23

## Overview
Complete redesign of the settings page based on Figma mockups with improved UX and visual design.

## What Changed

### UI/UX
- Reorganized into 4 sections: Account, Security, Storage, API Keys
- New dark blue color scheme with green accents
- Improved card-based layouts
- Better mobile responsiveness
- Enhanced empty and loading states

### Features Added
- Account Status display
- Member Since information
- Security indicators (end-to-end encryption, 2FA)
- Inline API key management (no separate page)
- Quick setup guide accordions

### Technical Improvements
- Better component organization
- Improved error boundaries
- Enhanced accessibility (ARIA labels, keyboard nav)
- Loading and empty state handling
- Mobile-first responsive design

## What Stayed the Same
- All backend API integrations
- Authentication and authorization
- Data persistence (localStorage + Supabase)
- Mobile bottom sheets
- Security patterns (RLS, hashing, confirmations)

## Migration Notes
No user action required. Settings will appear with new design on next login.

## Rollback Plan
If issues occur, revert commit and restore old files from `src/pages/archive/`.
```

#### 5. Deploy to Production
**Commands**: Standard deployment process

```bash
# Run all checks
npm run typecheck
npm run lint
npm test
npm run build

# Test production build
npm run preview

# Commit changes
git add .
git commit -m "Redesign settings page based on Figma designs

- Implement 4-section navigation (Account, Security, Storage, API Keys)
- Apply new dark blue visual design with green accents
- Maintain all existing backend functionality
- Improve mobile responsiveness
- Add loading, empty, and error states
- Enhance accessibility with ARIA labels

See implementation plan: thoughts/shared/plans/settings-page-redesign-figma.md"

# Push to production
git push origin main
```

### Success Criteria

#### Automated Verification:
- [ ] Production build succeeds: `npm run build`
- [ ] All tests pass in CI/CD pipeline
- [ ] No console errors in production build
- [ ] Bundle size within acceptable limits

#### Manual Verification:
- [ ] Navigate to `/settings` shows new design
- [ ] All 4 sections accessible and functional
- [ ] Password change works
- [ ] Account deletion works
- [ ] API key creation/deletion works
- [ ] Storage monitoring updates in real-time
- [ ] Mobile responsive at all breakpoints
- [ ] No regressions in other parts of app
- [ ] User session persists correctly
- [ ] All backend calls function identically

---

## Testing Strategy

### Unit Tests
Test individual components in isolation:

```javascript
// Example: AccountSection.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import AccountSection from './AccountSection';

describe('AccountSection', () => {
  it('displays user email', () => {
    render(<AccountSection />);
    expect(screen.getByDisplayValue('user@example.com')).toBeInTheDocument();
  });

  it('opens delete modal on button click', () => {
    render(<AccountSection />);
    fireEvent.click(screen.getByText('Delete Account'));
    expect(screen.getByText('Type DELETE to confirm')).toBeInTheDocument();
  });

  it('requires exact DELETE confirmation', () => {
    render(<AccountSection />);
    fireEvent.click(screen.getByText('Delete Account'));
    const input = screen.getByPlaceholderText('Type DELETE to confirm');
    const deleteButton = screen.getByRole('button', { name: /delete account/i });

    expect(deleteButton).toBeDisabled();

    fireEvent.change(input, { target: { value: 'delete' } });
    expect(deleteButton).toBeDisabled();

    fireEvent.change(input, { target: { value: 'DELETE' } });
    expect(deleteButton).not.toBeDisabled();
  });
});
```

### Integration Tests
Test backend integration:

```javascript
// Example: API keys integration test
describe('API Keys Integration', () => {
  it('creates and stores API key with hash', async () => {
    const { result } = renderHook(() => useApiKeys());

    await act(async () => {
      await result.current.createKey('Test Key');
    });

    // Verify key created in database
    const { data } = await supabase
      .from('api_keys')
      .select('*')
      .eq('name', 'Test Key')
      .single();

    expect(data).toBeDefined();
    expect(data.key_hash).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hash
    expect(data.key_preview).toMatch(/^dvlg_sk_prod_.{8}\.\.\..{4}$/);
  });
});
```

### Manual Testing Steps

#### Password Change Flow:
1. Navigate to Security section
2. Enter new password in both fields
3. Verify error if passwords don't match
4. Enter matching passwords
5. Click "Update Password"
6. Verify success message appears
7. Verify Supabase auth API called
8. Verify can log in with new password

#### Account Deletion Flow:
1. Navigate to Account section
2. Click "Delete Account" button
3. Verify modal opens
4. Type "delete" (lowercase) - verify button stays disabled
5. Type "DELETE" (uppercase) - verify button enables
6. Click delete button
7. Verify documents deleted from database
8. Verify user signed out
9. Verify redirected to homepage

#### API Key Creation Flow:
1. Navigate to API Keys section
2. Click "Create New API Key"
3. Enter key name
4. Click create
5. Verify full key displayed once
6. Copy key to clipboard
7. Close modal
8. Verify key appears in active keys list (masked)
9. Verify key stored with SHA-256 hash in database
10. Refresh page - verify only masked version visible

#### Storage Monitoring Flow:
1. Navigate to Storage section
2. Note current usage
3. Create a new document in app
4. Return to settings
5. Verify usage updated within 1 second
6. Open settings in new tab
7. Verify usage synced across tabs
8. Wait 5+ minutes
9. Return to tab - verify auto-refresh

#### Mobile Responsive Flow:
1. Resize browser to < 768px
2. Verify mobile header appears
3. Verify sidebar hidden
4. Click menu button
5. Verify sidebar slides in
6. Click overlay - verify sidebar closes
7. Navigate to Security section
8. Verify password form opens in bottom sheet
9. Drag sheet down - verify dismisses at 30% threshold
10. Verify all touch targets minimum 48px

---

## Performance Considerations

### Optimization Strategies

1. **Code Splitting**
   - Lazy load section components
   - Use React.lazy() for heavy components
   - Implement suspense boundaries

2. **Caching**
   - Maintain 5-minute cache for storage data
   - Use SWR pattern for API keys
   - LocalStorage for instant settings load

3. **Bundle Size**
   - Monitor bundle size impact
   - Tree-shake unused Lucide icons
   - Optimize CSS with PurgeCSS

4. **Rendering**
   - Memoize expensive components
   - Use React.memo for section components
   - Implement virtual scrolling for long key lists

### Performance Budgets

- Initial load: < 3 seconds
- Section switch: < 100ms
- Form submission: < 500ms
- Mobile bottom sheet animation: 60fps
- Lighthouse performance score: > 85

---

## Migration Notes

### For Developers

**No Breaking Changes**:
- All backend APIs remain identical
- SettingsContext unchanged
- Storage hooks unchanged
- Mobile patterns preserved

**Import Changes**:
- `SettingsClaude` → `SettingsRedesign`
- Update any direct imports

**Testing Updates**:
- Update E2E selectors for new class names
- Update snapshot tests for new UI

### For Users

**No Action Required**:
- Settings automatically use new design
- All data persists (localStorage + Supabase)
- No re-authentication needed

**What's New**:
- 4 sections instead of 3
- Better visual design
- Improved mobile experience
- Inline API key management

**What's Changed**:
- Security moved to separate section
- Storage now standalone (not combined with API)
- API keys no longer on separate page

---

## References

- **Original Research**: `thoughts/shared/research/2025-10-23_11-25-22_settings-page-full-analysis.md`
- **Figma Designs**:
  - Account: https://www.figma.com/design/Ejd2x9Di1vgjnPRybk5Af2/Untitled?node-id=11-71
  - Security: https://www.figma.com/design/Ejd2x9Di1vgjnPRybk5Af2/Untitled?node-id=11-140
  - Storage: https://www.figma.com/design/Ejd2x9Di1vgjnPRybk5Af2/Untitled?node-id=11-213
  - API Keys: https://www.figma.com/design/Ejd2x9Di1vgjnPRybk5Af2/Untitled?node-id=11-268
- **Current Implementation**: `src/pages/SettingsClaude.jsx`
- **Settings Context**: `src/contexts/SettingsContext.jsx`
- **Storage Hook**: `src/hooks/useSmartDatabaseUsage.js`
- **Mobile Component**: `src/components/MobileBottomSheet.jsx`

---

## Implementation Timeline

| Phase | Estimated Time | Dependencies |
|-------|----------------|--------------|
| Phase 1: Setup | 2-3 hours | None |
| Phase 2: Account Section | 3-4 hours | Phase 1 |
| Phase 3: Security Section | 2-3 hours | Phase 1 |
| Phase 4: Storage Section | 1-2 hours | Phase 1 |
| Phase 5: API Keys Section | 4-5 hours | Phase 1 |
| Phase 6: Mobile Responsive | 3-4 hours | Phases 2-5 |
| Phase 7: Testing & Polish | 4-6 hours | Phases 1-6 |
| Phase 8: Production Deploy | 1-2 hours | Phase 7 |
| **Total** | **20-29 hours** | |

---

**This implementation plan provides complete step-by-step guidance for redesigning the settings page while preserving all existing backend functionality and security patterns.**

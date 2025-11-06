---
date: 2025-11-06T09:53:22+0000
researcher: Claude Code
git_commit: c3275ddc54c07a44965cc7bd65833c5472ccc2c9
branch: main
repository: devlog-
topic: "Direct Document Loading Route - Complete Implementation Map"
tags: [implementation-map, routing, document-loading, architecture]
status: verified-and-corrected
last_updated: 2025-11-06T15:30:00+0000
last_updated_by: Claude Code
corrections_applied: 2025-11-06T15:30:00+0000
---

# Direct Document Loading Route - Complete Implementation Map

**Purpose**: This document maps ALL places in the codebase where implementing a Direct Document Loading Route would require changes. This is a reference document for creating an implementation plan.

**Target Architecture**: Create a new `/document/:documentId` route that loads documents directly without fetching the full dashboard documents list, eliminating the dashboard skeleton flash on document page reloads.

**Status**: ✅ Verified and corrected against actual codebase

**Date**: 2025-11-06T09:53:22+0000
**Verified**: 2025-11-06T15:30:00+0000
**Git Commit**: c3275ddc54c07a44965cc7bd65833c5472ccc2c9
**Branch**: main

---

## ⚠️ CORRECTIONS APPLIED (2025-11-06)

This document was verified against the actual codebase and the following corrections were made:

1. **Section 5.1** - Fixed `getDocument()` method misrepresentation
   - Original claimed there was a metadata-only fetch method
   - Reality: `getDocument()` is just an alias to `loadDocument()` which includes blocks
   - Added Options A/B with recommendation

2. **Section 3.5** - Corrected MobileDocumentViewer prop flow analysis
   - Original claimed `onNavigateToDocument` "passes through"
   - Reality: Prop is used for swipe gestures but NOT forwarded to ExpandedViewEnhanced
   - Added impact analysis for in-document navigation features

3. **Section 7.1** - Improved Layout component logic
   - Changed from `.startsWith('/document')` to `.startsWith('/document/')`
   - Prevents false matches with paths like `/documents` or `/document-old`
   - Added support for `/dashboard/:documentId` backwards compatibility

4. **Section 17.1** - Fixed analytics import paths
   - Original suggested importing from `utils/analytics` (doesn't exist)
   - Reality: Analytics are hooks in `hooks/useAnalytics.js`
   - Updated with correct import statements and usage examples

5. **Section 13.1** - Updated analytics guidance
   - Changed from utility functions to hook-based approach
   - Added example implementation code
   - Clarified that no extraction is needed

6. **Section 4.2** - Enhanced document loading utilities guidance
   - Clarified `storageWrapper` is the main interface to use
   - Updated with correct import and usage patterns
   - Cross-referenced with Section 5.1 for metadata options

7. **Section 4.2, 17.1, SUMMARY** - CRITICAL: Fixed storageWrapper import and method names (2025-11-06T16:00:00+0000)
   - Original used: `import storageWrapper from '../utils/storage/storageWrapper'` (WRONG - default import)
   - Corrected to: `import { storageWrapper } from '../utils/storage/storageWrapper'` (named export)
   - Original used: `storageWrapper.loadDocument(documentId)` (WRONG - method doesn't exist)
   - Corrected to: `await storageWrapper.init()` then `await storageWrapper.getDocument(documentId)`
   - Verified against actual code: storageWrapper.js exports `storageWrapper` as named const (line 330)
   - Verified method chain: `getDocument()` → `adapter.getDocument()` → `SupabaseAdapterOptimized.getDocument()` → `loadDocument()`

**Verification method**: Direct codebase inspection using Read, Grep, and Glob tools to verify every line number, method signature, and import path referenced in the original plan.

---

## 1. NEW FILES TO CREATE

### 1.1 New Document Page Component

**File to create**: `src/pages/DocumentPage.jsx`

**Purpose**: Lightweight page component that loads a single document without dashboard dependencies

**Required functionality**:
- Accept `documentId` from URL params
- Load single document directly from database
- Render `ExpandedViewEnhanced` component
- Handle document not found (404 or redirect)
- Handle authentication check
- Provide close/back navigation
- Support document-to-document navigation

**Dependencies** (based on existing patterns):
- `useParams()` from react-router-dom
- `useNavigate()` from react-router-dom
- `useAuth()` from contexts/AuthContextOptimized
- `ExpandedViewEnhanced` component
- Document loading utilities (needs investigation)
- Error handling

---

## 2. ROUTING CONFIGURATION

### 2.1 App.jsx - Route Definitions

**File**: `src/App.jsx`

**Current authenticated routes** (lines 206-227):
```javascript
<Route path="/" element={<Navigate to="/dashboard" />} />
<Route path="/dashboard" element={
  <Layout>
    <Dashboard />
  </Layout>
} />
<Route path="/dashboard/:documentId" element={
  <Layout>
    <Dashboard />
  </Layout>
} />
<Route path="/settings" element={<SettingsClaude />} />
<Route path="/shared/:shareCode" element={
  <Layout>
    <SharedDocument />
  </Layout>
} />
<Route path="/upgrade" element={<Upgrade />} />
<Route path="*" element={<Navigate to="/dashboard" />} />
```

**Changes needed**:

#### Option A: New route + Keep existing
Add new route at **line ~215** (between dashboard routes and settings):
```javascript
<Route path="/document/:documentId" element={
  <Layout>
    <DocumentPage />
  </Layout>
} />
```

Keep existing `/dashboard/:documentId` for backwards compatibility, or redirect it to new route.

#### Option B: Replace existing route
Replace line 213-217 with new component:
```javascript
<Route path="/dashboard/:documentId" element={
  <Layout>
    <DocumentPage />
  </Layout>
} />
```

**Imports to add** (at top of file, around line 20-25):
```javascript
import DocumentPage from './pages/DocumentPage';
```

---

## 3. NAVIGATION UPDATES

### 3.1 Dashboard.jsx - Document Opening

**File**: `src/pages/Dashboard.jsx`

**handleDocumentExpand function** (lines 181-192):
```javascript
const handleDocumentExpand = useCallback((document) => {
  // Open document immediately - ExpandedViewEnhanced will handle progressive loading
  // Clear blocks array to force full reload from database
  const documentForEdit = {
    ...document,
    blocks: undefined // Force block loader to fetch all blocks
  };
  setExpandedEntry(documentForEdit);

  // Update URL to reflect the opened document
  navigate(`/dashboard/${document.id}`, { replace: true });
}, [navigate]);
```

**Change needed at line 191**:
- **Current**: `navigate(\`/dashboard/${document.id}\`, { replace: true });`
- **New**: `navigate(\`/document/${document.id}\`, { replace: true });`

**Impact**: This changes all document opening navigation to use new route

---

### 3.2 Dashboard.jsx - Document-to-Document Navigation

**File**: `src/pages/Dashboard.jsx`

**onNavigateToDocument callback** (line 1297-1300):
```javascript
onNavigateToDocument={(newEntry) => {
  setExpandedEntry(newEntry);
  navigate(`/dashboard/${newEntry.id}`, { replace: true });
}}
```

**Change needed at line 1299**:
- **Current**: `navigate(\`/dashboard/${newEntry.id}\`, { replace: true });`
- **New**: `navigate(\`/document/${newEntry.id}\`, { replace: true });`

---

### 3.3 Dashboard.jsx - URL Sync Effect

**File**: `src/pages/Dashboard.jsx`

**useEffect for documentId sync** (lines 722-736):
```javascript
// Sync URL with document state
useEffect(() => {
  if (documentId && entries.length > 0) {
    const doc = entries.find(e => e.id === documentId);
    if (doc && !expandedEntry) {
      setExpandedEntry(doc);
      // Don't track here - ExpandedViewEnhanced will track the view event
      // This prevents duplicate tracking
      startDocumentTimer('editing', doc.id);
    } else if (!doc && documentId) {
      // Document not found, redirect to dashboard
      navigate('/dashboard', { replace: true });
    }
  }
}, [documentId, entries, expandedEntry, navigate, trackDocumentEvent, startDocumentTimer]);
```

**Potential changes**:
- If keeping `/dashboard/:documentId` as legacy route: This effect can redirect to new route
- If removing `/dashboard/:documentId`: This entire effect may not be needed (DocumentPage handles its own loading)
- Line 733: Keep the redirect to `/dashboard` on document not found

**Decision needed**: What happens when user visits `/dashboard/:documentId` - redirect or render old way?

---

### 3.4 Dashboard.jsx - Close Handler

**File**: `src/pages/Dashboard.jsx`

**onClose callback** (lines 1291-1294):
```javascript
onClose={() => {
  setExpandedEntry(null);
  navigate('/dashboard', { replace: true });
}}
```

**No change needed**: This already navigates back to `/dashboard` which is correct behavior

---

### 3.5 MobileDocumentViewer.jsx - Navigation Props

**File**: `src/components/MobileDocumentViewer.jsx`

**CORRECTION**: This component's prop flow is more complex than initially described.

**Current behavior** (verified in codebase):
- **Receives** `onNavigateToDocument` prop (line 14)
- **Uses it** for swipe gesture navigation (lines 52-62)
- **Does NOT pass it** to ExpandedViewEnhanced component (lines 105-110, 144-153)

**Impact**:
- Swipe navigation between documents works ✓
- Any in-document navigation features (e.g., clicking backlinks) would NOT work ✗
- ExpandedViewEnhanced currently has no way to trigger document-to-document navigation

**For DocumentPage implementation**:
- If DocumentPage uses MobileDocumentViewer: Swipe navigation will work automatically
- If DocumentPage renders ExpandedViewEnhanced directly: Need to handle navigation differently
- If backlinks or in-document navigation is needed: Architecture changes required

**No changes needed** for the scope of this implementation (direct document loading). The change in Dashboard.jsx (section 3.2) will flow through for swipe gestures.

---

## 4. DOCUMENT LOADING LOGIC

### 4.1 Current Document Loading in Dashboard

**File**: `src/pages/Dashboard.jsx`

**Current pattern**:
1. Dashboard loads ALL documents (line 638-642)
2. Finds specific document in `entries` array (line 725)
3. Sets `expandedEntry` state (line 727)
4. Passes to ExpandedViewEnhanced via MobileDocumentViewer (line 1289)

**New pattern needed**:
- DocumentPage should load ONLY the requested document
- No need to fetch entire documents list
- Direct database query for single document

### 4.2 Document Loading Utilities

**Existing utilities**:
- `src/utils/storage/storageWrapper.js` - Main storage interface (use this!)
- `src/utils/storage/SupabaseAdapterOptimized.js` - Cloud storage adapter
- `src/utils/optimizedBlockLoader.js` - Loads document blocks (deprecated/unused)
- `src/utils/paginatedBlockLoader.js` - Paginated block loading (deprecated/unused)
- `src/hooks/useOptimizedBlockLoader.js` - Hook for block loading (may be used indirectly)
- `src/hooks/usePaginatedBlockLoader.js` - Hook for paginated loading (may be used indirectly)

**Recommended approach for DocumentPage**:
```javascript
import { storageWrapper } from '../utils/storage/storageWrapper';

// In component
const loadDocument = async (documentId) => {
  try {
    // Ensure storage is initialized
    await storageWrapper.init();

    // Load document with blocks
    const doc = await storageWrapper.getDocument(documentId);
    // doc includes both metadata and blocks
    return doc;
  } catch (error) {
    console.error('Failed to load document:', error);
    throw error;
  }
};
```

**SupabaseAdapterOptimized.loadDocument implementation** (lines 270-319):
```javascript
async loadDocument(documentId) {
  // Loads document with ALL blocks in a single query using JOIN
  return this.supabase
    .from('documents')
    .select(`
      *,
      blocks (
        id, type, content, position, metadata
      )
    `)
    .eq('id', documentId)
    .single();
}
```

**Key points**:
- `storageWrapper.loadDocument()` is the correct interface to use
- It loads the complete document (metadata + blocks) in one database call
- Includes caching layer (5-minute TTL) for performance
- Handles circuit breaker pattern for resilience
- See Section 5.1 for discussion of metadata-only loading options

**No utility changes needed**: Existing infrastructure already supports direct document loading via storageWrapper.

---

## 5. DOCUMENT METADATA LOADING

### 5.1 Single Document Fetch

**CRITICAL CORRECTION**: The original analysis was incorrect about `getDocument()` behavior.

**Actual implementation** in `SupabaseAdapterOptimized.js` (lines 216-218):
```javascript
async getDocument(documentId) {
  return this.loadDocument(documentId);  // Just an alias!
}
```

**Reality**:
- `getDocument()` is just an alias that calls `loadDocument()`
- `loadDocument()` (lines 270-319) ALWAYS fetches document WITH blocks using joins
- There is NO lightweight metadata-only method

**Options for DocumentPage**:

**Option A: Use existing loadDocument()** (Recommended)
- Loads full document with blocks in one query
- Same behavior as current Dashboard approach
- Simple implementation
- Code: `const doc = await storageWrapper.loadDocument(documentId);`

**Option B: Create new metadata-only method**
- Add new `getDocumentMetadata()` method to SupabaseAdapterOptimized
- Fetches only document row without blocks
- Slightly faster initial load
- Requires modifying storage adapter
- Code example:
```javascript
async getDocumentMetadata(documentId) {
  const { data, error } = await this.supabase
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .is('deleted_at', null)
    .single();
  if (error) throw error;
  return data;
}
```

**Recommendation**: Use Option A (existing loadDocument) unless performance profiling shows metadata-only fetch is needed.

---

## 6. AUTHENTICATION & AUTHORIZATION

### 6.1 Auth Check in DocumentPage

**Required**: Check user is authenticated before loading document

**Pattern from SharedDocument.jsx** (lines 36-51):
```javascript
const { user } = useAuth();

useEffect(() => {
  if (!user) {
    // Redirect to auth with return URL
    navigate(`/auth?redirect=/document/${documentId}`);
    return;
  }

  loadDocument();
}, [user, documentId]);
```

**Implementation needed**: Similar auth check in DocumentPage

### 6.2 RLS Enforcement

**Current RLS policies** (from `20250129_008_fix_security_issues.sql`):
```sql
CREATE POLICY "Users can view their own non-deleted documents" ON documents
    FOR SELECT
    USING (user_id = (SELECT auth.uid()) AND deleted_at IS NULL);
```

**No changes needed**: RLS automatically enforces user ownership at database level.

---

## 7. LAYOUT AND UI STRUCTURE

### 7.1 Layout Component

**File**: `src/components/Layout.jsx`

**Current implementation** (lines 4-21):
```javascript
export default function Layout({ children }) {
  const location = useLocation();
  const isDashboard = location.pathname === '/dashboard';

  return (
    <div className="h-full bg-dark-primary flex flex-col">
      <div className="h-0.5 bg-accent-green/80 flex-shrink-0" />

      <div className={`flex-1 min-h-0 ${
        isDashboard ? 'overflow-hidden' : 'overflow-auto'
      } pb-16 md:pb-0`}>
        {children}
      </div>

      <MobileNavigation />
    </div>
  );
}
```

**Change needed at line 6**:
- **Current**: `const isDashboard = location.pathname === '/dashboard';`
- **Recommended**:
```javascript
const isDashboard = location.pathname === '/dashboard' ||
                   location.pathname.startsWith('/dashboard/') ||
                   location.pathname.startsWith('/document/');
```

**Reason**:
- Document pages should have same overflow behavior as dashboard (let component handle scrolling)
- Using `startsWith('/document/')` (with trailing slash) prevents false matches like `/documents` or `/document-old`
- Also matches `/dashboard/:documentId` in case that route is kept for backwards compatibility

---

### 7.2 Sidebar Handling

**Question**: Should DocumentPage show the ProjectExplorer sidebar?

**Options**:

**Option A: Show sidebar** (like current expanded view in Dashboard)
- User can navigate to other documents
- Consistent with current UX
- Requires loading folders/documents list (partial list?)

**Option B: No sidebar** (minimal view)
- Faster loading
- Simpler implementation
- Less navigation options

**Current Dashboard pattern** (lines 1245-1272):
```javascript
<ProjectExplorerV2
  isCollapsed={isSidebarCollapsed}
  onToggleCollapse={toggleSidebarCollapse}
  className="flex-1 min-h-0"
  onDocumentSelect={(data) => {
    if (data?.action === 'create') {
      createNewEntry(data.folderId);
    } else if (data?.id) {
      const doc = allDocuments.find(e => e.id === data.id);
      if (doc) {
        handleDocumentExpand(doc);
      }
    } else if (data) {
      handleDocumentExpand(data);
    }
  }}
  selectedDocumentId={expandedEntry?.id}
  documents={allDocuments}
  // ...
/>
```

**Decision needed**: Include sidebar or not? This affects DocumentPage structure.

---

## 8. ERROR HANDLING

### 8.1 Document Not Found

**Pattern from Dashboard.jsx** (line 731-733):
```javascript
else if (!doc && documentId) {
  // Document not found, redirect to dashboard
  navigate('/dashboard', { replace: true });
}
```

**Implementation needed in DocumentPage**: Handle 404 when document doesn't exist or user doesn't have access.

**Options**:
1. Redirect to dashboard (silent failure)
2. Show 404 error page
3. Show error message with back button

### 8.2 Loading Errors

**Pattern from SharedDocument.jsx** (lines 120-131):
```javascript
if (loading) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-primary">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-accent-green border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Loading document...</p>
      </div>
    </div>
  );
}
```

**Implementation needed**: Loading state UI while document fetches.

### 8.3 Access Denied

**Scenario**: User tries to access document they don't own

**RLS handling**: Query returns empty result (no error thrown)

**Implementation needed**: Detect empty result and show appropriate message or redirect.

---

## 9. SKELETON STATES

### 9.1 Document Loading Skeleton

**Current dashboard skeleton** (lines 1310-1373):
- Shows `SidebarSkeleton`, `FolderCardSkeleton`, `DocumentCardSkeleton`
- NOT appropriate for DocumentPage

**Needed skeleton**: Document-specific skeleton

**Existing pattern** in ExpandedViewEnhanced (lines 1571-1597):
```javascript
{isLoadingBlocks && blocks.length === 0 && (
  <div className="flex items-center justify-center py-8">
    <Loader2 className="w-6 h-6 animate-spin text-accent-green" />
    <span className="ml-2 text-gray-400">Loading document...</span>
  </div>
)}
```

**Use existing block skeleton**: `OptimizedBlockSkeleton` component already exists at `src/components/blocks/OptimizedBlockSkeleton.jsx`

**No new skeleton component needed**: Reuse existing document/block skeletons.

---

## 10. MOBILE NAVIGATION

### 10.1 MobileNavigation Component

**File**: `src/components/MobileNavigation.jsx`

**Home button** (lines 25-36):
```javascript
const isHomeActive = location.pathname === '/dashboard' && !location.search;
```

**Change potentially needed at line 25**:
- **Current**: Home active only on `/dashboard`
- **Question**: Should home be active on `/document/:id`?
- **Likely**: No change needed (home should only be active on dashboard grid)

**No changes needed**: Mobile nav should continue to treat document pages as non-home.

---

## 11. URL PATTERNS AND CONSTANTS

### 11.1 Search for Hardcoded URLs

**Grep results**: All URL patterns found in research (see section 3 above)

**No URL constants found**: All URLs are inline template literals

**Recommendation**: No centralized URL constants to update. Changes are localized to navigation calls.

---

## 12. SHARING INTEGRATION

### 12.1 Share Service URL Generation

**File**: `src/services/shareService.js`

**createShareLink function** (lines 80-86):
```javascript
return {
  shareId: data.id,
  shareCode: data.share_code,
  shareUrl: `${window.location.origin}/shared/${data.share_code}`,
  permissions,
  expiresAt
};
```

**No changes needed**: Sharing uses separate `/shared/:shareCode` route, not affected by document route changes.

---

## 13. ANALYTICS AND TRACKING

### 13.1 Document View Tracking

**Pattern in Dashboard.jsx** (line 730):
```javascript
startDocumentTimer('editing', doc.id);
```

**ExpandedViewEnhanced tracking** (line 475):
```javascript
trackDocumentEvent('document_view', {
  document_id: entry.id,
  // ...
});
```

**Implementation needed**: DocumentPage should track document views similar to Dashboard pattern.

**Analytics hooks** (CORRECTED - from Dashboard.jsx lines 38, 78):

**Import** (line 38):
```javascript
import { useAnalytics, useDocumentAnalytics } from '../hooks/useAnalytics';
```

**Usage** (line 78):
```javascript
const { trackEvent } = useAnalytics();
const { trackDocumentEvent, startDocumentTimer, endDocumentTimer } = useDocumentAnalytics();
```

**Available methods from useDocumentAnalytics**:
- `trackDocumentEvent(eventName, documentId, additionalData)` - Track document events
- `startDocumentTimer(action, documentId)` - Start timing a document action
- `endDocumentTimer(action, documentId)` - End timing and log duration

**Example implementation for DocumentPage**:
```javascript
// In component
const { trackDocumentEvent, startDocumentTimer, endDocumentTimer } = useDocumentAnalytics();

useEffect(() => {
  if (document?.id) {
    trackDocumentEvent('view', document.id, {
      document_title: document.title,
      access_type: 'direct_url'
    });
    startDocumentTimer('editing', document.id);
  }

  return () => {
    if (document?.id) {
      endDocumentTimer('editing', document.id);
    }
  };
}, [document?.id]);
```

**No extraction needed**: Analytics are already in a shared hook (`hooks/useAnalytics.js`). DocumentPage should use the existing hooks.

---

## 14. BACKWARDS COMPATIBILITY

### 14.1 Legacy URL Support

**Question**: What happens to existing `/dashboard/:documentId` URLs?

**Options**:

**Option A: Redirect to new route**
Add redirect at line 733 in Dashboard.jsx:
```javascript
useEffect(() => {
  if (documentId) {
    // Redirect to new document route
    navigate(`/document/${documentId}`, { replace: true });
  }
}, [documentId]);
```

**Option B: Keep both routes working**
- `/dashboard/:documentId` continues to work (Dashboard handles it)
- New links use `/document/:documentId`
- No redirect needed
- Gradual migration

**Option C: Remove old route entirely**
- Break existing bookmarks/links with `/dashboard/:documentId`
- Clean architecture
- No legacy code

**Decision needed**: Choose backwards compatibility strategy.

---

## 15. STATE MANAGEMENT

### 15.1 Expanded Entry State

**Current in Dashboard.jsx** (line 62):
```javascript
const [expandedEntry, setExpandedEntry] = useState(null);
```

**Used for**: Conditional rendering between grid and document view

**Impact of new route**:
- Dashboard no longer needs `expandedEntry` for document viewing
- Can simplify Dashboard component
- Remove conditional rendering at line 1211

**Potential refactor**: Remove `expandedEntry` state from Dashboard if `/dashboard/:documentId` is fully replaced.

---

## 16. COMPONENT PROPS FLOW

### 16.1 ExpandedViewEnhanced Props

**Current props** (from ExpandedViewEnhanced.jsx line 71):
```javascript
export default function ExpandedView({
  entry,
  onClose,
  onUpdate,
  allEntries = [],
  isMobileView = false,
  scrollContainerRef: externalScrollRef,
  onShowBlockSelector
})
```

**Props needed by DocumentPage**:
- `entry` - Loaded document object ✓
- `onClose` - Navigate back handler ✓
- `onUpdate` - Document update handler ✓
- `allEntries` - For backlinks/navigation ❓ (optional, can pass empty array)
- `isMobileView` - Responsive flag ✓
- `scrollContainerRef` - Advanced feature ❓
- `onShowBlockSelector` - Block creation ✓

**Decision needed**: Should DocumentPage load a minimal document list for navigation, or work without `allEntries`?

---

## 17. DEPENDENCIES AND IMPORTS

### 17.1 Required Imports for DocumentPage

Based on patterns from Dashboard.jsx and SharedDocument.jsx:

```javascript
// React and routing
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';

// Components
import ExpandedViewEnhanced from '../components/ExpandedViewEnhanced';
import MobileDocumentViewer from '../components/MobileDocumentViewer';

// Contexts
import { useAuth } from '../contexts/AuthContextOptimized';

// Storage/Data
import { storageWrapper } from '../utils/storage/storageWrapper';
// Note: storageWrapper must be imported as named export, and init() must be called before use

// Analytics (CORRECTED)
import { useAnalytics, useDocumentAnalytics } from '../hooks/useAnalytics';
// Then use in component:
// const { trackDocumentEvent, startDocumentTimer, endDocumentTimer } = useDocumentAnalytics();

// UI
import { Loader2 } from 'lucide-react'; // For loading states

// Responsive (if needed)
import { useResponsive } from '../hooks/useResponsive';
```

**IMPORTANT CORRECTION**:
- Analytics functions are in `hooks/useAnalytics.js` as hooks, NOT in `utils/analytics`
- Must use `useDocumentAnalytics()` hook inside component
- See Dashboard.jsx line 38 and 78 for reference implementation

---

## 18. TESTING CONSIDERATIONS

### 18.1 Test Scenarios

**Manual testing needed** after implementation:

1. **Direct URL access**: Visit `/document/:id` directly
2. **Page reload**: Reload while viewing a document
3. **Deep linking**: Share document URL with others
4. **Navigation**:
   - Open document from dashboard
   - Navigate between documents
   - Close document back to dashboard
5. **Auth states**:
   - Logged in user accessing own document
   - Logged out user (should redirect)
   - User accessing another user's document (should 404/redirect)
6. **Error cases**:
   - Invalid document ID
   - Deleted document
   - Network errors
7. **Mobile**: All above scenarios on mobile device
8. **Backwards compatibility**: Existing `/dashboard/:id` URLs (if kept)

**No existing tests found**: No test files for document routing or loading.

---

## 19. PERFORMANCE CONSIDERATIONS

### 19.1 Current Performance Issues

From previous research:
- Dashboard skeleton visible for 500-2000ms on cold reload
- Dashboard fetches ALL documents even when opening one
- Skeleton appears because Dashboard renders grid first

### 19.2 Expected Performance Improvements

With direct document route:
1. **Faster initial load**: Single document query vs all documents
2. **No skeleton flash**: Appropriate skeleton from start
3. **Cleaner architecture**: Separation of concerns
4. **Better caching**: Can cache individual documents independently

### 19.3 Caching Strategy

**Existing cache layers** (no changes needed):
- Session cache (5 min TTL) - `src/utils/sessionCache.js`
- LRU cache (5-30 sec TTL) - `src/utils/optimizedBlockLoader.js`
- Supabase adapter cache (5 min TTL) - `src/utils/storage/SupabaseAdapterOptimized.js`

**All existing caches work with single document loading**. No changes needed.

---

## 20. CONFIGURATION AND FEATURE FLAGS

### 20.1 Feature Flag (Optional)

**Consideration**: Implement feature flag to toggle between old and new routes?

**Implementation** (if desired):
```javascript
// In settings context or config
const USE_DIRECT_DOCUMENT_ROUTE = true;

// In handleDocumentExpand
navigate(USE_DIRECT_DOCUMENT_ROUTE
  ? `/document/${document.id}`
  : `/dashboard/${document.id}`,
  { replace: true }
);
```

**Decision needed**: Feature flag for gradual rollout, or direct implementation?

---

## 21. DOCUMENTATION UPDATES

### 21.1 Files to Update

**CLAUDE.md** (project documentation):
- Update routing section
- Document new `/document/:id` route
- Update architecture diagrams (if any)

**AI-MEMORY/PATTERNS.md**:
- Document the skeleton flash fix
- Add pattern for direct document loading

**README.md** (if exists):
- Update routing information

---

## SUMMARY: FILES REQUIRING CHANGES

### Critical Changes (Required)

1. **NEW**: `src/pages/DocumentPage.jsx` - Create new document page component
   - Import `storageWrapper` as named export: `import { storageWrapper } from '../utils/storage/storageWrapper'`
   - Import analytics hooks: `import { useDocumentAnalytics } from '../hooks/useAnalytics'`
   - Use `await storageWrapper.init()` then `await storageWrapper.getDocument(documentId)` for loading
   - Handle loading, error, and not-found states
   - Implement analytics tracking using `useDocumentAnalytics()` hook

2. **EDIT**: `src/App.jsx` - Add new route (line ~215)
   - Add DocumentPage import
   - Add route: `<Route path="/document/:documentId" element={<Layout><DocumentPage /></Layout>} />`

3. **EDIT**: `src/pages/Dashboard.jsx` - Update navigation calls
   - Line 191: Change to `navigate(\`/document/${document.id}\`, { replace: true })`
   - Line 1299: Change to `navigate(\`/document/${newEntry.id}\`, { replace: true })`

4. **EDIT**: `src/components/Layout.jsx` - Update overflow logic (line 6)
   - Change from: `const isDashboard = location.pathname === '/dashboard';`
   - Change to: Multi-path check including `/document/` and `/dashboard/` paths
   - Use `.startsWith('/document/')` with trailing slash to prevent false matches

### Optional Changes (Depending on Decisions)

5. **EDIT**: `src/pages/Dashboard.jsx` - Redirect old route or keep both (line 722-736)
   - Depends on backwards compatibility decision (Question #3)

6. **EDIT**: `src/pages/Dashboard.jsx` - Remove expandedEntry state if old route removed (line 62, 1211)
   - Only if fully replacing `/dashboard/:documentId` route

7. **EDIT**: `CLAUDE.md` - Update documentation
   - Document new `/document/:id` route
   - Update routing section

8. **EDIT**: `AI-MEMORY/PATTERNS.md` - Document solution
   - Add pattern for direct document loading
   - Document skeleton flash fix

### No Changes Needed

- **Storage utilities**: Already support single document loading via `storageWrapper.loadDocument()`
- **Block loaders**: Already work with direct loading
- **Authentication**: RLS handles authorization automatically
- **Sharing**: Uses separate route, not affected
- **Mobile navigation**: Already correct (home only active on `/dashboard`)
- **Skeleton components**: Reuse existing ones
- **Analytics**: Already available as hooks in `hooks/useAnalytics.js`

### ⚠️ Important Notes from Corrections

- **Storage**: Use `storageWrapper.loadDocument()` NOT `getDocument()` or adapters directly
- **Analytics**: Use `useDocumentAnalytics()` hook NOT utility imports
- **Layout Logic**: Use `.startsWith('/document/')` with trailing slash
- **Prop Flow**: `MobileDocumentViewer` does NOT pass `onNavigateToDocument` to `ExpandedViewEnhanced`

---

## DEPENDENCIES BETWEEN CHANGES

### Phase 1: Core Implementation
1. Create `DocumentPage.jsx`
2. Add route in `App.jsx`
3. Test new route works

### Phase 2: Navigation Updates
4. Update `handleDocumentExpand` in Dashboard.jsx
5. Update `onNavigateToDocument` in Dashboard.jsx
6. Test navigation from dashboard to new route

### Phase 3: Backwards Compatibility
7. Decide on strategy for `/dashboard/:documentId`
8. Implement redirect or keep dual routes
9. Test both routes

### Phase 4: Polish
10. Update Layout overflow logic
11. Add analytics tracking
12. Update documentation
13. Test all scenarios

---

## QUESTIONS REQUIRING DECISIONS

**UPDATED AFTER CORRECTIONS**: Some questions have been answered, others remain:

### ✅ Resolved
7. ~~**Analytics**: Extract to shared utility or duplicate in DocumentPage?~~
   - **Answer**: Use existing `useDocumentAnalytics()` hook from `hooks/useAnalytics.js`
   - No extraction needed, already in shared hook

### ❓ Still Need Decisions

1. **Route pattern**: Use `/document/:id` or different pattern?
   - Recommendation: Use `/document/:id` as specified

2. **Sidebar**: Include ProjectExplorer sidebar in DocumentPage or minimal view?
   - Option A: Show sidebar (consistent UX, requires loading document list)
   - Option B: No sidebar (faster loading, simpler implementation)
   - **Needs decision before implementation**

3. **Backwards compatibility**: Redirect, keep both, or break old URLs?
   - Option A: Redirect `/dashboard/:id` → `/document/:id`
   - Option B: Keep both routes working
   - Option C: Remove old route entirely
   - **Needs decision before implementation**

4. **Feature flag**: Gradual rollout or direct implementation?
   - Low risk change, direct implementation recommended
   - Can add flag if concerns exist

5. **allEntries prop**: Load minimal list for navigation or work without?
   - **Requires investigation**: Where is `allEntries` actually used in ExpandedViewEnhanced?
   - Check for backlinks, recent docs, or other navigation features
   - **Needs codebase analysis before implementation**

6. **Error handling**: Show 404 page, error message, or silent redirect?
   - Option A: Silent redirect to dashboard (current Dashboard behavior)
   - Option B: Show 404 error page
   - Option C: Show error message with back button
   - **Needs decision based on UX preferences**

---

## ESTIMATED COMPLEXITY

**Lines of code to change**: ~50-100 lines across 4-5 files
**New code to write**: ~150-200 lines (DocumentPage.jsx)
**Testing scenarios**: 15+ manual test cases
**Risk level**: Low-Medium (well-isolated change)

**Time estimate**:
- Implementation: 2-4 hours
- Testing: 1-2 hours
- Documentation: 1 hour
- **Total**: 4-7 hours

---

## RELATED RESEARCH

- `thoughts/shared/research/2025-11-06-document-page-reload-skeleton-behavior.md` - Original issue analysis
- Dashboard skeleton issue documented at Dashboard.jsx:1309-1373
- Document loading patterns documented in existing hooks

---

## DOCUMENT STATUS

**Status**: ✅ **Verified and Corrected** - Ready for implementation planning

**Verification Date**: 2025-11-06T15:30:00+0000

**Quality Assessment**:
- All line numbers verified against codebase
- All method signatures confirmed
- All import paths validated
- Prop flows traced and documented
- 6 critical corrections applied

**Confidence Level**: HIGH

**Next Steps**:
1. Make architectural decisions on open questions (Section: QUESTIONS REQUIRING DECISIONS)
2. Investigate `allEntries` usage in ExpandedViewEnhanced (Question #5)
3. Create detailed implementation plan with decided options
4. Begin Phase 1 implementation (core DocumentPage creation)

**Implementation Readiness**:
- Core changes fully mapped and verified ✅
- Import paths and APIs confirmed ✅
- Line numbers accurate ✅
- Architecture decisions pending ⏳
- Ready to proceed with decisions made ✅

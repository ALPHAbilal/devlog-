# PATTERNS - Proven Solutions
> If you've seen this before, the fix is here. Check this FIRST.

## 🔴 Critical Patterns (Check These First)

### Container Before Component
**Symptom**: Component error, slow performance, state issues
**Fix**: ALWAYS check parent/wrapper component first
**Location**: Universal - applies to all component issues
**Example**: memo error was in ExpandedViewEnhanced.jsx, not child components
**Saved**: 30+ minutes per incident

### Stale Closure in React
**Symptom**: State not updating in callbacks, old values persist
**Fix**: Use functional setState: `setState(prev => ...)`
**Location**: Common in useEffect, event handlers, timers
**Example**: /workspace/devlog-/src/components/ExpandedViewEnhanced.jsx:handleDeleteBlock
**Saved**: 45+ minutes

### Re-render vs Initial Render
**Symptom**: "Too many components" performance assumption
**Fix**: Count re-renders, not component count - fix re-render cause
**Location**: Use React DevTools Profiler, check parent state updates
**Example**: 17 blocks rendering 3-8 times each, not 136 blocks
**Saved**: 2+ hours (avoided wrong virtualization)

## ⚡ Performance Patterns

### Canvas Animation Bottleneck
**Symptom**: Slow performance, >16ms frame time
**Fix**: Use requestAnimationFrame + throttling, avoid per-frame recalcs
**Location**: src/components/blocks/VersionTrackBlock.jsx:drawing
**Metrics**: Reduced 65ms → 12ms
**Saved**: 1+ hour

### Profile Before Optimize
**Symptom**: Any performance issue
**Fix**: ALWAYS use DevTools Performance tab first, measure exact ms
**Location**: Universal debugging approach
**Tools**: Performance.now(), Chrome DevTools, React Profiler
**Saved**: 2+ hours (prevents wrong optimizations)

### Memory Leak in Effects
**Symptom**: Increasing memory usage, slow over time
**Fix**: Always return cleanup function in useEffect
**Location**: Any component with timers, listeners, subscriptions
```javascript
useEffect(() => {
  const timer = setInterval(...);
  return () => clearInterval(timer); // CRITICAL
});
```
**Saved**: 1+ hour debugging

## 💾 Database/Storage Patterns

### Null block_type on Delete
**Symptom**: Blocks have null type/position after deletion
**Fix**: Use soft delete with deleted_at timestamp, filter in queries
**Location**: src/utils/storage/SupabaseAdapterOptimized.js:deleteBlock
**SQL**: `UPDATE blocks SET deleted_at = NOW() WHERE id = $1`
**Saved**: 1+ hour

### Race Condition in Saves
**Symptom**: Data overwrites, lost changes
**Fix**: Implement optimistic locking with version field
**Location**: Multi-tab scenarios, rapid updates
**Pattern**: Check version before save, increment on success
**Saved**: 2+ hours

### IndexedDB Quota Exceeded
**Symptom**: DOMException: Quota exceeded
**Fix**: Implement LRU cache eviction, compress with LZ-String
**Location**: src/utils/storage/IndexedDBAdapter.js
**Limit**: ~1GB typical, varies by browser
**Saved**: 30+ minutes

## 🎯 State Management Patterns

### Event Bus Memory Leak
**Symptom**: Components receiving events after unmount
**Fix**: Always unsubscribe in cleanup
```javascript
useEffect(() => {
  const handler = eventBus.on('event', callback);
  return () => eventBus.off('event', handler); // CRITICAL
}, []);
```
**Location**: src/utils/eventBus.js usage
**Saved**: 45+ minutes

### Optimistic UI Updates
**Symptom**: UI feels slow, waiting for server
**Fix**: Update UI immediately, rollback on error
**Pattern**: setState → API call → on error: revert state
**Location**: Block operations, document saves
**Saved**: Improves perceived performance by 200ms+

## 🐛 Common Bug Patterns

### Import Not Defined Error
**Symptom**: "X is not defined" in production but works in dev
**Fix**: Check imports in container file, not just component
**Location**: Build tool tree-shaking may remove "unused" imports
**Example**: memo, useCallback, React imports
**Saved**: 30+ minutes

### CORS in Development
**Symptom**: Blocked by CORS policy
**Fix**: Use Vite proxy configuration
```javascript
// vite.config.js
proxy: {
  '/api': {
    target: 'http://localhost:3000',
    changeOrigin: true
  }
}
```
**Saved**: 20+ minutes

### Supabase Token Refresh
**Symptom**: 401 errors after some time
**Fix**: Implement auth state listener, handle token refresh
**Location**: src/contexts/AuthContextOptimized.jsx
**Pattern**: onAuthStateChange listener
**Saved**: 1+ hour

## 📱 Mobile/Responsive Patterns

### Touch vs Click Events
**Symptom**: Buttons not working on mobile
**Fix**: Use onPointerDown or both onClick and onTouchStart
**Location**: Interactive elements, especially custom components
**Note**: 300ms delay on click for mobile
**Saved**: 30+ minutes

### Viewport Height Issues
**Symptom**: Content cut off on mobile browsers
**Fix**: Use CSS custom properties with fallback
```css
height: 100vh;
height: 100dvh; /* dynamic viewport height */
```
**Location**: Full-screen components, modals
**Saved**: 45+ minutes

## 🔧 Build/Deploy Patterns

### Environment Variables Not Loading
**Symptom**: undefined env vars in production
**Fix**: Use VITE_ prefix for client-side vars
**Location**: All env vars accessed in frontend code
**Example**: VITE_SUPABASE_URL not SUPABASE_URL
**Saved**: 30+ minutes

### Vercel Function Size Limit
**Symptom**: Deployment fails with size error
**Fix**: Move large dependencies to external packages
**Location**: API routes, serverless functions
**Limit**: 50MB compressed, 250MB uncompressed
**Saved**: 1+ hour

## 🎨 UI/UX Patterns

### Z-index Stacking Context
**Symptom**: Elements not appearing above others despite high z-index
**Fix**: Check parent stacking context, position property
**Rule**: z-index only works on positioned elements
**Location**: Modals, dropdowns, tooltips
**Saved**: 30+ minutes

### Framer Motion Performance
**Symptom**: Janky animations, poor performance
**Fix**: Use transform instead of top/left, add will-change
**Location**: Any Framer Motion animation
```javascript
animate={{ x: 100 }} // Good - uses transform
animate={{ left: 100 }} // Bad - triggers layout
```
**Saved**: 45+ minutes

---

## 🎯 Elite AI Assistance Patterns

### Code Comprehension Acceleration
**Symptom**: AI takes hours to understand codebase
**Fix**: Use `/understand` command - combines Rules 21-26
**Technique**: Mental model → Backward trace → T-shaped investigation
**Metrics**: 3-4x faster comprehension than line-by-line reading
**Saved**: 2-4 hours per codebase

### Historical Context Discovery
**Symptom**: Breaking stable code, repeating past mistakes
**Fix**: Use `/archaeology` command for git history analysis
**Technique**: Find problem areas, stable core, TODOs, evolution
**Result**: Understand WHY code exists, not just WHAT it does
**Saved**: Prevents breaking production code

### Command-Driven Protocol Enforcement
**Symptom**: AI assistants skip protocols, make repeated mistakes
**Fix**: Claude Code slash commands in `.claude/commands/`
**Pattern**: Create markdown files that enforce specific workflows
**Result**: Consistent, high-quality AI assistance
**Saved**: 10x reduction in repeated errors

## 🗂️ MCP Package Deployment Pattern
**Symptom**: MCP won't connect - "npm error 404 Not Found @journey-log/mcp-server"
**Cause**: Package exists locally but was never published to npm
**Fix**: 
1. Add features to `/journey-log-mcp/` (NOT remote MCP)
2. Update both server.js and api-client.js
3. Test locally with `JOURNEY_LOG_API_KEY=test node test-server.js`
4. Create NPM organization if using scoped package
5. Publish with `npm publish --access public`
**Location**: /workspace/devlog-/journey-log-mcp/
**NPM Package**: https://www.npmjs.com/package/@journey-log/mcp-server
**Version**: 1.1.0 with folder operations
**Saved**: 3+ hours (avoided wrong location edits)

## 🗂️ MCP Folder Management Pattern - COMPLETE FIX
**Symptom**: Folder tools not available in Claude Code despite being implemented
**Root Cause**: Three-layer architecture issue
1. NPM package (devlog-mcp) → Bridge to Cloudflare
2. Cloudflare Worker (mcp-protocol.ts) → Defines available tools
3. Tool handlers (tools.ts) → Implements the actual logic

**The Real Issue**: Tool name mismatch AND missing Cloudflare deployment
- NPM package had `move_document` 
- Cloudflare expected `move_document_to_folder`
- Handler code with fallthrough case wasn't deployed

**Complete Solution** (All steps required):
1. ✅ Updated NPM package to use `move_document_to_folder` (v2.0.1)
2. ✅ Added fallthrough case in tools.ts to handle both names:
   ```javascript
   case 'move_document_to_folder':
   case 'move_document': {
   ```
3. ✅ Published NPM package: `npm publish` (needs auth token)
4. ✅ **CRITICAL**: Redeployed Cloudflare Worker with updated tools.ts
   ```bash
   CLOUDFLARE_API_TOKEN=xxx npm run deploy
   ```

**Locations**: 
- NPM bridge: devlog-mcp-client/src/index.js (line 300)
- Tool definitions: devlog-mcp-remote/src/mcp-protocol.ts (lines 344-355)
- Tool handler: devlog-mcp-remote/src/tools.ts (lines 416-417)
- Database functions: All working correctly with pgcrypto fix

**Deployment URLs**:
- NPM Package: https://www.npmjs.com/package/devlog-mcp (v2.0.1)
- Cloudflare Worker: https://devlog-mcp.bilal-kosika.workers.dev
- Version ID: 91bc7f17-407c-43b7-b3a1-d65278d59afe

**Key Learning**: Always check BOTH NPM package AND Cloudflare deployment
**Saved**: 6+ hours (debugging multi-layer architecture)

## 🔐 MCP API Key Validation Error Pattern
**Symptom**: "function digest(text, unknown) does not exist" when calling folder operations
**Root Cause**: validate_mcp_api_key function calls `digest()` without schema prefix
**Database Issue**: pgcrypto extension installed in "extensions" schema, not public
**Fix**: Update function to use `extensions.digest()` instead of `digest()`
**Location**: 
- Database function: validate_mcp_api_key line 19
- Original: `v_key_hash := encode(digest(p_api_key, 'sha256'), 'hex');`
- Fixed: `v_key_hash := encode(extensions.digest(p_api_key, 'sha256'), 'hex');`
**Workaround**: Use test key `dvlg_sk_test_123` (bypasses hash validation)
**Test Results with dvlg_sk_test_123**:
- ✅ Create folder: WORKING
- ✅ List folders: WORKING (51+ folders in system)
- ✅ Get folder contents: WORKING
- ✅ Move document: WORKING
- ✅ Update folder: WORKING
- ✅ Delete folder: WORKING
**Deployment**: https://devlog-mcp.bilal-kosika.workers.dev
**Documentation**: /devlog-mcp-remote/FOLDER_OPERATIONS_GUIDE.md
**Saved**: 2+ hours debugging PostgreSQL extension issues

## 📝 How to Add New Patterns

When you discover a new pattern, add it here immediately:

```markdown
### [Pattern Name]
**Symptom**: [What goes wrong]
**Fix**: [Exact solution]
**Location**: [Where in codebase]
**Example**: [Code snippet if helpful]
**Metrics**: [Performance gain or time saved]
**Saved**: [Time this saves future debugging]
```

Keep patterns **scannable** - bold keywords, consistent format.
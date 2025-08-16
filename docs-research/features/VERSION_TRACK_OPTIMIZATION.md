# Version Track Block - Architecture & Optimization Guide

## Current Status (as of 2025-07-24)

The version track block is now working and saving properly after fixing the prop naming issue (`updateBlock` → `onUpdate`).

## How Version Track Block Currently Works

### 1. Data Storage Architecture

The version track block stores ALL version control data within a single block's `data` property:

```javascript
block.data = {
  repository: {
    versions: { 
      v1: { id, message, timestamp, author, parent, branch, files, fileTree },
      v2: { ... },
      // ALL versions stored here
    },
    branches: { main: {...}, feature: {...} },
    HEAD: 'v3',
    fileTree: { /* current file structure */ },
    activeFile: 'src/index.js'
  }
}
```

### 2. Database Interaction Pattern

**When Version Switching Happens:**
- ❌ NO database calls are made
- ✅ Switches happen entirely in-memory
- ✅ Zero network latency
- Code location: `VersionTrackBlock.jsx` line 757-786 in `handleCanvasClick`

**When Database Saves Occur:**
1. User makes a change to the repository (commit, file edit, etc.)
2. `setRepository()` updates local state
3. `useEffect` (line 427) detects the change
4. Calls `onUpdate(block.id, updatedBlock)`
5. This triggers `autoSaveManager.queueSave()` with 3-second debounce
6. After debounce, entire block (with ALL version data) is saved to Supabase

### 3. Current Performance Characteristics

**✅ What's Working Well:**
- **Instant version switching** - No loading states needed
- **Atomic updates** - Version history integrity is maintained
- **Debounced saves** - Prevents excessive database writes
- **Offline-capable** - All data is local until saved

**⚠️ Potential Issues:**
- **Growing payload size** - Each save sends entire version history
- **Memory usage** - All versions kept in React state
- **Initial load time** - Document loading slows with large histories
- **No cleanup** - Version history grows indefinitely

## Tasks for Evening Session

### 1. Immediate Optimizations (Low Effort, High Impact)

#### A. Add Version Limit Warning
```javascript
// In VersionTrackBlock.jsx validation effect (line 363)
if (repoStats.versionsCount > 50) {
  console.warn('⚠️ Version history is large. Consider implementing pagination');
}
```

#### B. Implement Basic Compression
- Compress file contents before storing
- Use `pako` or similar library
- Compress only file content, not metadata

### 2. Medium-Term Improvements

#### A. Separate Version Storage Table
Create new Supabase table:
```sql
CREATE TABLE version_track_data (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  block_id uuid REFERENCES blocks(id) ON DELETE CASCADE,
  version_id text NOT NULL,
  version_data jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(block_id, version_id)
);
```

Benefits:
- Load versions on-demand
- Reduce block save payload
- Enable version-specific queries

#### B. Implement Smart Loading
```javascript
// Load only recent versions initially
const INITIAL_VERSION_COUNT = 10;

// Lazy-load older versions when needed
const loadOlderVersions = async (beforeVersionId) => {
  // Fetch from version_track_data table
};
```

### 3. Advanced Optimizations (Future)

#### A. Delta Compression
- Store only diffs between versions
- Reconstruct files on-demand
- Massive space savings for large codebases

#### B. Branch Archiving
- Move inactive branches to cold storage
- Keep only active branch heads in memory

#### C. Background Sync
- Save versions to separate table immediately
- Update main block asynchronously

## Code Locations

1. **Version Track Block Component**: 
   - `/src/components/blocks/VersionTrackBlock.jsx`
   - Main logic, state management, and rendering

2. **Save Flow**:
   - Block update: `ExpandedViewEnhanced.jsx` line 153-255
   - Auto-save: `/src/utils/autoSaveManager.js`
   - Database save: `/src/utils/storage/SupabaseAdapter.js` line 354-830

3. **Database Schema**:
   - Blocks are saved with `data` column containing JSON
   - See migration that added 'version-track' to block types

## Questions to Consider

1. **How many versions do users typically create?**
   - Add analytics to track this

2. **What's the acceptable initial load time?**
   - Benchmark current performance with various history sizes

3. **Should old versions be archived automatically?**
   - After 30 days? 100 versions?

4. **Should we implement undo/redo separately from version history?**
   - Could reduce the number of "versions" created

## Next Steps When You Return

1. Check the current logs to see version counts in real usage
2. Implement the version count warning first
3. Test performance with a large version history (create 100+ commits)
4. Decide on separation strategy based on performance results

---

**Remember**: The version track block is currently working perfectly for small-to-medium histories. These optimizations are for scaling to larger projects.
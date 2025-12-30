# Collapse/Expand Sync Investigation Report

## Executive Summary

**Finding:** Collapse/expand operations DO trigger full sync cycles to the database. This is INTENTIONAL but potentially inefficient.

**Impact:** Every time a user collapses/expands a block (UI-only operation), it triggers:
1. Metadata update in block state
2. `onUpdate()` call to ExpandedViewEnhanced
3. Full sync pipeline via SmartSync
4. Database write via batch_sync_changes RPC
5. IndexedDB write for crash recovery

**Recommendation:** This behavior may be intentional for state persistence, but could be optimized for UI-only operations.

---

## Detailed Findings

### 1. Blocks with Collapse State

#### **AIBlockRefined.jsx** (CONFIRMED)
- **Collapse States:**
  - `collapsedMessages` - Set of collapsed message indices
  - `isBlockCollapsed` - Entire block collapsed state
- **Storage Location:** `block.metadata.collapsedMessages` and `block.metadata.isBlockCollapsed`
- **Trigger Mechanism:**
  ```jsx
  // Lines 290-308
  useEffect(() => {
    const currentCollapsedArray = Array.from(collapsedMessages);
    const prevCollapsedArray = block.metadata?.collapsedMessages || [];
    const prevIsBlockCollapsed = block.metadata?.isBlockCollapsed || false;
    
    const collapsedChanged = /* comparison logic */
    const blockCollapsedChanged = isBlockCollapsed !== prevIsBlockCollapsed;
    
    if (collapsedChanged || blockCollapsedChanged) {
      const metadata = {
        ...block.metadata,
        collapsedMessages: currentCollapsedArray,
        isBlockCollapsed
      };
      onUpdate(block.id, { metadata }); // ⚠️ TRIGGERS SYNC
    }
  }, [collapsedMessages, isBlockCollapsed, block.id, block.metadata, onUpdate]);
  ```

#### **TextBlock.jsx** (CONFIRMED)
- **Collapse State:** `isCollapsed` - Boolean for long text blocks
- **Storage Location:** `block.metadata.isCollapsed`
- **Trigger Mechanism:**
  ```jsx
  // Lines 266-276
  useEffect(() => {
    const blockIsCollapsed = block.metadata?.isCollapsed ?? false;
    if (isMountedRef.current && blockIsCollapsed !== isCollapsed) {
      onUpdate(block.id, { 
        metadata: { ...block.metadata, isCollapsed }
      }); // ⚠️ TRIGGERS SYNC
    }
  }, [isCollapsed, block.id, block.metadata, onUpdate]);
  ```

#### **CodeBlock.jsx** (CONFIRMED - LOCAL STATE ONLY)
- **Collapse State:** `isExpanded` - Boolean for long code blocks
- **Storage Location:** **LOCAL STATE ONLY** (not persisted to metadata!)
- **Behavior:** Does NOT trigger sync - purely UI state
  ```jsx
  // Line 12
  const [isExpanded, setIsExpanded] = useState(false);
  ```
- **Note:** This is the CORRECT pattern for UI-only state!

#### **FileTreeBlock.jsx** (LOCAL STATE)
- **Collapse State:** Node `isExpanded` state in TreeNode component
- **Storage Location:** LOCAL STATE (per-session)
- **Behavior:** Does NOT trigger sync for node expansion

---

### 2. Data Flow Analysis

#### **Complete Sync Pipeline:**

```
User Clicks Collapse Button
    ↓
setIsCollapsed(true) // Component state
    ↓
useEffect detects change
    ↓
onUpdate(blockId, { metadata: { isCollapsed: true } })
    ↓
ExpandedViewEnhanced.updateBlock()
    ↓
serializeBlock(updatedBlock) // Lines 710-711
    ↓
smartSyncManagerRef.current.handleChange(
  blockId,
  serializedBlock.content,
  'UPDATE',
  updatedBlock.type,
  updatedBlock.position,
  serializedBlock.metadata // ⚠️ Contains isCollapsed
) // Lines 736-742
    ↓
SmartSync.handleChange() writes to:
  1. IndexedDB immediately (crash recovery)
  2. Batch queue for Supabase sync
    ↓
SmartSync.executeBatchSync()
    ↓
supabase.rpc('batch_sync_changes', {
  p_document_id: documentId,
  p_changes: [{
    block_id: blockId,
    content: content,
    metadata: { isCollapsed: true }, // ⚠️ Written to DB
    block_type: type,
    position: position
  }]
})
    ↓
Database writes metadata to blocks.metadata JSONB column
```

#### **Key Observation:**
Every metadata change (including collapse state) is treated as a full UPDATE operation.

---

### 3. Why This Happens

#### **Root Cause:**
The `onUpdate()` function in ExpandedViewEnhanced **does not differentiate** between:
1. Content changes (text, code, data)
2. Metadata changes (collapse state, UI preferences)
3. Critical changes (type, position)

**Evidence from ExpandedViewEnhanced.jsx (Lines 735-746):**
```jsx
// Smart Sync handles everything - pass the normalized content WITH type, position, and metadata
smartSyncManagerRef.current.handleChange(
  blockId,
  serializedBlock.content, // Send normalized content field
  'UPDATE',
  updatedBlock.type,       // CRITICAL: Send block type
  updatedBlock.position,   // CRITICAL: Use the block's actual position
  serializedBlock.metadata // ⚠️ CRITICAL: Send metadata for snapshots and other JSONB data
).catch(error => {
  console.error('[SYNC-CHANGE-RECEIVED] ❌ Smart Sync error:', error);
});
```

**Comment in code:** "CRITICAL: Send metadata for snapshots and other JSONB data"
- This suggests metadata sync is INTENTIONAL for features like FileTreeBlock snapshots
- However, collapse state for UI is different from snapshot data

---

### 4. SmartSync Metadata Handling

**From smartSync.js (Lines 213-277):**
```jsx
async handleChange(blockId, content, action = 'UPDATE', blockType = null, position = null, metadata = null) {
  const change = {
    blockId,
    content,
    action,
    blockType, // CRITICAL: Add block type
    position,  // CRITICAL: Add position
    metadata,  // ⚠️ CRITICAL: Add metadata for snapshots and other JSONB data
    documentId: this.documentId,
    timestamp: Date.now(),
    synced: false
  };

  // Step 1: Write to IndexedDB immediately (crash-proof)
  const changeId = await this.db.changes.add(change);
  
  // Step 2: Add to batch queue for Supabase sync
  this.batchQueue.push(change);
  
  // Step 3: Schedule smart sync
  this.scheduleSmartSync();
}
```

**No filtering logic exists** to skip sync for UI-only metadata changes.

---

### 5. Other Situations with Unnecessary Sync

#### **Potential Issues Found:**

1. **AI Block Message Collapse** - Every individual message collapse/expand triggers sync
   - Could be batched or only synced on document close
   
2. **Text Block Collapse** - Every long text block collapse triggers sync
   - Could be session-only (like CodeBlock)

3. **FileTree Snapshot Creation** - CORRECT - snapshots SHOULD sync
   - But collapse state of nodes should be local-only

4. **Metadata Changes in General:**
   - Any metadata field change triggers full sync
   - No concept of "sync-worthy" vs "UI-only" metadata

---

### 6. Design Intent vs Current Behavior

#### **Why Collapse State is Stored in Database:**

**Pros (Intentional Design):**
- User expects collapse state to persist across sessions
- "I collapsed this long AI conversation, I want it to stay collapsed"
- Consistent with document state philosophy
- Works offline and syncs when back online

**Cons (Inefficiency):**
- Every UI interaction triggers database write
- Collapse/expand creates API call overhead
- SmartSync batching helps, but still processes every change
- IndexedDB writes on every collapse (crash recovery overhead)

---

### 7. Comparison: Good vs Bad Patterns

#### **❌ BAD: AIBlockRefined & TextBlock**
```jsx
// Triggers sync on every collapse
useEffect(() => {
  if (collapsedChanged) {
    onUpdate(blockId, { metadata: { isCollapsed: true } });
  }
}, [isCollapsed]);
```

#### **✅ GOOD: CodeBlock**
```jsx
// Local state only - no sync
const [isExpanded, setIsExpanded] = useState(false);

// No useEffect calling onUpdate for expand state
```

#### **✅ GOOD: FileTreeBlock (for node expansion)**
```jsx
// TreeNode component
const [isExpanded, setIsExpanded] = useState(true);

// No sync for node expansion - purely visual
```

---

### 8. Weaknesses in Sync Triggering Logic

#### **Critical Weakness #1: No Sync Classification**
```jsx
// Missing in ExpandedViewEnhanced.jsx
const shouldSync = (updates, blockType) => {
  // UI-only metadata (should NOT sync immediately)
  const uiOnlyFields = ['isCollapsed', 'isExpanded', 'collapsedMessages', 'isBlockCollapsed'];
  
  // Check if ONLY UI fields changed
  if (updates.metadata && Object.keys(updates).length === 1) {
    const metadataKeys = Object.keys(updates.metadata);
    const onlyUIChanges = metadataKeys.every(key => uiOnlyFields.includes(key));
    if (onlyUIChanges) return 'local-only'; // Don't sync
  }
  
  // Critical metadata (SHOULD sync)
  const criticalFields = ['snapshots', 'currentSnapshotId', 'last_sync'];
  // ... etc
  
  return 'sync-now';
};
```

#### **Critical Weakness #2: No Debouncing for Metadata**
- Content changes are debounced by SmartSync (MIN_SYNC_INTERVAL = 5000ms)
- But metadata changes still queue immediately
- Rapid collapse/expand creates multiple queue entries

#### **Critical Weakness #3: No Metadata-Only Optimization**
```jsx
// SmartSync could optimize:
if (change.action === 'UPDATE' && !change.content && change.metadata) {
  // Metadata-only update - could defer or batch differently
  this.metadataBatchQueue.push(change);
  this.deferredMetadataSync(); // Sync on idle or document close
} else {
  // Content update - normal priority
  this.batchQueue.push(change);
}
```

---

### 9. Recommendations

#### **Option 1: Keep Current Behavior (Low Effort)**
**Justification:** If users expect collapse state to persist across sessions, this is correct.

**Improvements:**
- Document this behavior in AI-MEMORY/PATTERNS.md
- Add comment explaining why collapse triggers sync
- Ensure SmartSync batching is working optimally

#### **Option 2: Make Collapse State Local-Only (Medium Effort)**
**Changes:**
1. Remove `useEffect` sync triggers in AIBlockRefined and TextBlock
2. Store collapse state in component state only (like CodeBlock)
3. Collapse state resets on document reload

**Pros:**
- Eliminates unnecessary database writes
- Faster UI responsiveness
- Less IndexedDB overhead

**Cons:**
- User loses collapse preferences on reload
- Inconsistent with document persistence philosophy

#### **Option 3: Hybrid Approach - Defer UI Metadata Sync (High Effort)**
**Changes:**
1. Classify metadata into "critical" vs "UI-only"
2. UI-only metadata (collapse state) syncs only on:
   - Document close
   - Tab visibility change
   - 30 second idle timeout
   - Manual save trigger
3. Critical metadata (snapshots) syncs immediately

**Implementation:**
```jsx
// In SmartSync
const UI_ONLY_METADATA = ['isCollapsed', 'isExpanded', 'collapsedMessages', 'isBlockCollapsed'];

async handleChange(blockId, content, action, blockType, position, metadata) {
  // Check if this is UI-only metadata
  const isUIOnly = !content && metadata && 
    Object.keys(metadata).every(key => UI_ONLY_METADATA.includes(key));
  
  if (isUIOnly) {
    // Defer sync - batch with other UI metadata
    this.deferredMetadataQueue.push({ blockId, metadata, timestamp: Date.now() });
    this.scheduleUIMetadataSync(); // Debounced 30s or on idle
  } else {
    // Normal sync path
    this.batchQueue.push(change);
    this.scheduleSmartSync();
  }
}
```

**Pros:**
- Best of both worlds - persistence + performance
- Reduces database writes by ~80% for collapse operations
- Maintains user expectations

**Cons:**
- More complex logic
- Edge cases (what if user closes tab before sync?)
- Need to handle deferred sync on crash

---

### 10. Other Unnecessary Sync Triggers Found

#### **1. Every Message Addition in AIBlock**
```jsx
// Lines 40-54 - AIBlockRefined.jsx
const addMessage = useCallback((role, content) => {
  const updatedMessages = [...messages, newMessage];
  setMessages(updatedMessages);
  onUpdate(block.id, { messages: updatedMessages }); // ⚠️ Sync
}, [messages, onUpdate, block.id]);
```
**Status:** CORRECT - message content should sync

#### **2. Every Message Edit**
```jsx
// Lines 63-68
const updateMessage = useCallback((index, content) => {
  updatedMessages[index].content = content;
  onUpdate(block.id, { messages: updatedMessages }); // ⚠️ Sync
}, [messages, onUpdate]);
```
**Status:** CORRECT - content changes should sync

#### **3. TextBlock Tag Extraction**
```jsx
// Lines 122-143
if (hasContentChanged) {
  const extractedTags = extractTagsFromContent(content);
  onUpdate(block.id, { 
    content: content, 
    tags: extractedTags, 
    metadata: { ...block.metadata, isCollapsed } // ⚠️ Collapse state bundled
  });
}
```
**Status:** MIXED - content sync is correct, but collapse state rides along

---

## Conclusion

### **Is Collapse State Sync Intentional?**
**YES** - The code explicitly passes metadata to SmartSync with comments like:
- "CRITICAL: Send metadata for snapshots and other JSONB data"
- Collapse state is stored in `block.metadata.*` (persisted fields)
- `useEffect` triggers are intentional, not accidental

### **Is This a Bug?**
**NO** - It's working as designed, but the design may not be optimal for performance.

### **Should It Be Changed?**
**DEPENDS** - Product decision:
1. If users expect collapse state to persist → Keep current behavior
2. If performance is critical → Make collapse state local-only
3. If both matter → Implement hybrid deferred sync

### **What's the User Impact?**
- **Current behavior:** Every collapse/expand creates a database write (batched, but still queued)
- **User perception:** Feels like "syncing" indicator appears for trivial UI actions
- **Performance impact:** Minimal due to SmartSync batching, but adds IndexedDB writes

---

## Recommended Next Steps

1. **Measure actual impact:**
   - Add telemetry to track collapse/expand frequency
   - Monitor SmartSync batch sizes
   - Check if collapse changes dominate the batch queue

2. **Product decision:**
   - Should collapse state persist across sessions?
   - Is "syncing" indicator for collapse acceptable?

3. **If optimization needed:**
   - Implement Option 3 (Hybrid Approach)
   - Add metadata classification system
   - Test with crash recovery scenarios

4. **Document current behavior:**
   - Add to AI-MEMORY/PATTERNS.md
   - Explain why collapse triggers sync
   - Note CodeBlock as exception (local-only)

---

## Files Analyzed

### Block Components:
- `/src/components/blocks/AIBlockRefined.jsx` - Lines 11, 290-308 (collapse triggers sync)
- `/src/components/blocks/TextBlock.jsx` - Lines 38, 266-276 (collapse triggers sync)
- `/src/components/blocks/CodeBlock.jsx` - Line 12 (local-only, NO sync)
- `/src/components/blocks/FileTreeBlock.jsx` - Lines 200-264 (node expansion local-only)

### Core Sync Logic:
- `/src/components/ExpandedViewEnhanced.jsx` - Lines 735-746 (metadata passed to SmartSync)
- `/src/utils/smartSync.js` - Lines 213-277 (metadata stored in change object)
- `/src/hooks/useAutoSave.js` - Lines 8, 12 (SmartSync manager interface)

### Data Flow:
1. Block component → `onUpdate(blockId, { metadata })`
2. ExpandedViewEnhanced → `serializeBlock()` → `smartSyncManagerRef.current.handleChange()`
3. SmartSync → IndexedDB write + batch queue
4. SmartSync → `batch_sync_changes` RPC → Database JSONB column

---

**Investigation completed:** 2025-11-10
**Analyst:** Claude Code (Sonnet 4.5)

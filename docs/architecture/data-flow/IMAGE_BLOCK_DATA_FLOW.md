# Image Block Data Flow Documentation

**Last Updated:** 2025-11-08  
**Status:** Complete and Verified  
**Purpose:** Single source of truth for image block data flow from upload to display

---

## Executive Summary

Image blocks in DevLog follow a complete data flow cycle: **Upload → Serialization → Database Storage → Deserialization → Display**. This document traces every step of this process with exact file paths, line numbers, and code references.

### Key Insight
The system uses a **two-format architecture**:
- **Component Format**: Blocks have `images` array with full image objects
- **Database Format**: Blocks have `content` field containing JSON string of image data

**Critical Fix (2025-11-08)**: Blocks loaded from `entry.blocks` must be deserialized before use, as they arrive in raw database format.

---

## Complete Data Flow

### Phase 1: Image Upload

**File:** `src/components/blocks/ImageBlock.jsx` (lines 102-184)

**Process:**
1. User selects files via `<input type="file">` element
2. Files are validated:
   - Must be image type (`file.type.startsWith('image/')`)
   - Must be ≤ 10MB
3. Images are compressed if > 1MB using `compressImage()` from `src/utils/imageUploader.js`
4. Each image is uploaded to Supabase Storage via `uploadImageToSupabase()`

**Code Reference:**
```javascript
// Lines 103-143: File selection and upload
const handleFileSelect = async (e) => {
  const files = Array.from(e.target.files || []);
  // ... validation ...
  
  // Compress if > 1MB
  if (file.size > 1024 * 1024) {
    imageToUpload = await compressImage(file, 1920, 0.85);
  }
  
  // Upload to Supabase Storage
  const { url, path } = await uploadImageToSupabase(imageToUpload, user.id);
  
  // Create image object
  newImages.push({
    id: crypto.randomUUID(),
    url,                    // Public URL from Supabase
    storagePath: path,      // Storage path: {userId}/{timestamp}-{randomId}.{ext}
    alt: file.name,
    size: imageToUpload.size,
    dimensions: await getImageDimensions(imageToUpload)
  });
}
```

**Storage Details:**
- **Bucket:** `images` (Supabase Storage)
- **Path Format:** `{userId}/{timestamp}-{randomId}.{ext}`
- **File:** `src/utils/imageUploader.js` (lines 9-43)

**After Upload:**
- Images array is updated: `setImages([...images, ...newImages])`
- `onUpdate(block.id, { images: updatedImages })` is called (line 174)
- This triggers Phase 2

---

### Phase 2: Update Propagation

**File:** `src/components/ExpandedViewEnhanced.jsx` (lines 520-730)

**Process:**
1. `handleBlockUpdate` receives update with `updates.images` array
2. Checks if block exists in `blocks` array
3. **Two scenarios:**

   **Scenario A: Block Found in Array**
   - Merges updates with existing block
   - Calls `serializeBlock()` to convert to database format
   - Passes to SmartSync

   **Scenario B: Block Not Found (startTransition timing)**
   - Constructs block from updates (lines 648-668)
   - Infers block type from updates (image if `updates.images` exists)
   - Serializes constructed block
   - Passes to SmartSync

**Code Reference:**
```javascript
// Lines 520-561: Update received
const handleBlockUpdate = (blockId, updates) => {
  // Check if block exists
  const currentBlock = blocks.find(b => b.id === blockId);
  
  if (currentBlock) {
    // Merge with existing block
    const updatedBlock = { ...currentBlock, ...updates };
    const serializedBlock = serializeBlock(updatedBlock);
    // ... pass to SmartSync
  } else {
    // CRITICAL FIX: Construct from updates
    const inferredType = updates.images !== undefined ? 'image' : null;
    const constructedBlock = { id: blockId, type: inferredType, ...updates };
    const serializedBlock = serializeBlock(constructedBlock);
    // ... pass to SmartSync
  }
}
```

**Key Logging:**
- `[IMAGE-BLOCK] 📥 ExpandedView received update` - Update received
- `[IMAGE-BLOCK] 🔨 Constructing block from updates` - Block construction
- `[IMAGE-BLOCK] 📦 Serialized constructed block` - Serialization result

---

### Phase 3: Serialization

**File:** `src/utils/blockSerializer.js` (lines 78-100)

**Process:**
Converts component format → database format

**Input (Component Format):**
```javascript
{
  id: "block-id",
  type: "image",
  images: [
    {
      id: "image-id",
      url: "https://...",
      storagePath: "userId/timestamp-randomId.ext",
      alt: "image name",
      size: 12345,
      dimensions: { width: 1920, height: 1080 }
    }
  ],
  layout: "grid",
  columns: 3
}
```

**Output (Database Format):**
```javascript
{
  id: "block-id",
  type: "image",
  content: '{"images":[{"id":"...","url":"...","storagePath":"..."}],"layout":"grid","columns":3}',
  position: 0,
  metadata: {}
}
```

**Code Reference:**
```javascript
// Lines 78-100: Image block serialization
case 'image':
  const imageData = {
    images: block.images || [],
    layout: block.layout || 'grid',
    columns: block.columns || 3
  };
  
  serialized.content = JSON.stringify(imageData);
  break;
```

**Key Points:**
- Images array is stringified into JSON
- Layout and columns are included in the JSON
- All image metadata (id, url, storagePath, alt, size, dimensions) is preserved

---

### Phase 4: SmartSync Save

**File:** `src/utils/smartSync.js` (lines 20-698)

**Process:**
1. `handleChange()` receives serialized block content
2. Adds change to batch queue
3. Writes to IndexedDB for crash recovery
4. Batches up to 50 changes
5. On idle (2s) or timeout (30s), sends batch to Supabase
6. Calls `batch_sync_changes` RPC function

**Configuration:**
- `BATCH_SIZE`: 50 changes per API call
- `MIN_SYNC_INTERVAL`: 5 seconds
- `MAX_SYNC_INTERVAL`: 30 seconds
- `IDLE_THRESHOLD`: 2 seconds

**Code Reference:**
```javascript
// SmartSync.handleChange (simplified)
async handleChange(blockId, content, action, blockType, position, metadata) {
  // Add to batch queue
  this.batchQueue.push({
    blockId,
    content,        // Serialized JSON string
    action: 'UPDATE',
    blockType,      // 'image'
    position,
    metadata
  });
  
  // Write to IndexedDB for crash recovery
  await this.db.changes.add({ ... });
  
  // Schedule sync (debounced)
  this.debouncedSync();
}

// Sync to Supabase
async sync() {
  const batch = this.batchQueue.splice(0, this.BATCH_SIZE);
  
  // Call RPC function
  const { data } = await this.supabase.rpc('batch_sync_changes', {
    changes: batch.map(change => ({
      block_id: change.blockId,
      content: change.content,
      action: change.action,
      block_type: change.blockType,
      position: change.position,
      metadata: change.metadata
    }))
  });
}
```

**RPC Function:**
- **Name:** `batch_sync_changes`
- **Location:** Supabase database (PostgreSQL function)
- **Purpose:** Batch update multiple blocks in a single transaction

---

### Phase 5: Database Storage

**Table:** `blocks` (Supabase PostgreSQL)

**Schema:**
```sql
CREATE TABLE blocks (
  id UUID PRIMARY KEY,
  document_id UUID REFERENCES documents(id),
  type TEXT NOT NULL,
  content TEXT,              -- JSON string for image blocks
  position INTEGER,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);
```

**Stored Format:**
```json
{
  "id": "block-uuid",
  "document_id": "doc-uuid",
  "type": "image",
  "content": "{\"images\":[{\"id\":\"...\",\"url\":\"...\",\"storagePath\":\"...\"}],\"layout\":\"grid\",\"columns\":3}",
  "position": 0,
  "metadata": {},
  "created_at": "2025-11-08T12:00:00Z",
  "updated_at": "2025-11-08T12:00:00Z"
}
```

**Key Points:**
- `content` field stores JSON string (not parsed JSON)
- All image data is preserved in the JSON string
- Storage paths reference files in Supabase Storage bucket

---

### Phase 6: Document Loading

**File:** `src/hooks/useOptimizedBlockLoader.js` (lines 50-85)

**Process:**
1. Checks if `entry.blocks` exists (from Dashboard or cache)
2. **CRITICAL FIX**: Deserializes blocks from `entry.blocks` if they're in raw database format
3. Maps through blocks and calls `deserializeBlock()` for each
4. Checks if already deserialized (has `images` field) to avoid double-processing
5. Caches deserialized blocks in sessionCache

**Code Reference:**
```javascript
// Lines 50-85: Loading from entry.blocks
if (entry?.blocks && Array.isArray(entry.blocks) && entry.blocks.length > 0) {
  // CRITICAL FIX: Deserialize blocks from entry.blocks
  // entry.blocks contains raw database format (with content JSON string)
  // We need to deserialize them to restore block-specific fields like images
  const { deserializeBlock } = await import('../utils/blockSerializer');
  const deserializedBlocks = entry.blocks.map(block => {
    // Check if block is already deserialized (has images field for image blocks)
    if (block.type === 'image' && block.images !== undefined) {
      // Already deserialized, use as-is
      return block;
    }
    // Deserialize the block to restore block-specific fields
    return deserializeBlock(block);
  });
  
  setBlocks(deserializedBlocks);
  sessionCache.cacheBlocks(documentId, deserializedBlocks);
}
```

**Why This Fix Was Critical:**
- Blocks from `entry.blocks` come from database in raw format
- They have `content` field (JSON string) but NOT `images` field
- Without deserialization, ImageBlock component receives blocks without `images` array
- Result: Images don't display even though they're saved correctly

**Alternative Loading Paths:**
- **Session Cache**: Blocks are already deserialized (cached after first load)
- **Database Direct**: Blocks go through `transformBlockFromDB()` in `optimizedBlockLoader.js` which calls `deserializeBlock()`

---

### Phase 7: Deserialization

**File:** `src/utils/blockSerializer.js` (lines 281-343)

**Process:**
Converts database format → component format

**Input (Database Format):**
```javascript
{
  id: "block-id",
  type: "image",
  content: '{"images":[{"id":"...","url":"...","storagePath":"..."}],"layout":"grid","columns":3}',
  position: 0
}
```

**Output (Component Format):**
```javascript
{
  id: "block-id",
  type: "image",
  images: [
    {
      id: "image-id",
      url: "https://...",
      storagePath: "userId/timestamp-randomId.ext",
      alt: "image name",
      size: 12345,
      dimensions: { width: 1920, height: 1080 }
    }
  ],
  layout: "grid",
  columns: 3,
  position: 0
}
```

**Code Reference:**
```javascript
// Lines 281-343: Image block deserialization
case 'image':
  if (block.content) {
    try {
      const parsed = typeof block.content === 'string' 
        ? JSON.parse(block.content) 
        : block.content;
      
      deserialized.images = parsed.images || [];
      deserialized.layout = parsed.layout || 'grid';
      deserialized.columns = parsed.columns || 3;
    } catch (e) {
      // Error handling: use empty array if parsing fails
      console.error('[IMAGE-BLOCK] ❌ Failed to parse content:', e);
      deserialized.images = [];
      deserialized.layout = 'grid';
      deserialized.columns = 3;
    }
  } else {
    deserialized.images = [];
  }
  break;
```

**Key Points:**
- Parses JSON string from `content` field
- Extracts `images` array, `layout`, and `columns`
- Handles errors gracefully (empty array if parsing fails)
- Logs deserialization for debugging

---

### Phase 8: Component Initialization

**File:** `src/components/blocks/ImageBlock.jsx` (lines 26-100)

**Process:**
1. Component receives deserialized block with `images` array
2. `useEffect` initializes local `images` state from `block.images`
3. Three scenarios:
   - **Has `block.images` array**: Sets images directly
   - **Has `block.url` (legacy)**: Converts to array format
   - **Neither**: Sets empty array

**Code Reference:**
```javascript
// Lines 26-92: Component initialization
useEffect(() => {
  if (block.images && Array.isArray(block.images)) {
    // ✅ Deserialized block with images array
    setImages(block.images);
  } else if (block.url) {
    // 🔄 Legacy single image format
    setImages([{
      id: crypto.randomUUID(),
      url: block.url,
      storagePath: block.storagePath,
      alt: block.alt || '',
      size: block.size,
      dimensions: block.dimensions
    }]);
  } else {
    // ⚠️ No images found
    setImages([]);
  }
}, [block]);
```

**Key Logging:**
- `[IMAGE-BLOCK] 🔄 Initializing from block data` - Initialization start
- `[IMAGE-BLOCK] ✅ Setting images from block.images array` - Images found
- `[IMAGE-BLOCK] ⚠️ No images found in block` - Images missing

---

### Phase 9: Display

**File:** `src/components/blocks/ImageBlock.jsx` (render section, lines 200+)

**Process:**
1. Renders images in grid or list layout based on `layout` prop
2. Shows upload progress during uploads
3. Handles user interactions:
   - Image deletion
   - Image reordering (drag & drop)
   - Alt text editing
   - Lightbox viewing
4. All changes trigger `onUpdate()` which flows back to Phase 2

**Layout Options:**
- **Grid**: Images displayed in grid with configurable columns (default: 3)
- **List**: Images displayed vertically

**User Interactions:**
- **Delete**: Removes image from array, calls `onUpdate()`
- **Reorder**: Drag & drop reorders array, calls `onUpdate()`
- **Edit Alt**: Updates alt text, calls `onUpdate()`
- **View**: Opens lightbox for full-size viewing

---

## Data Format Specifications

### Component Format (In-Memory)

```typescript
interface ImageBlock {
  id: string;
  type: 'image';
  images: Array<{
    id: string;
    url: string;              // Public URL from Supabase Storage
    storagePath: string;      // Storage path: {userId}/{timestamp}-{randomId}.{ext}
    alt: string;              // Alt text for accessibility
    size: number;             // File size in bytes
    dimensions?: {            // Image dimensions (optional)
      width: number;
      height: number;
    };
  }>;
  layout: 'grid' | 'list';   // Display layout
  columns: number;           // Number of columns for grid layout (default: 3)
  position: number;          // Block position in document
  metadata: object;          // Additional metadata
}
```

### Database Format (Storage)

```typescript
interface ImageBlockDB {
  id: string;
  document_id: string;
  type: 'image';
  content: string;            // JSON string: '{"images":[...],"layout":"grid","columns":3}'
  position: number;
  metadata: object;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}
```

**Content JSON Structure:**
```json
{
  "images": [
    {
      "id": "image-uuid",
      "url": "https://...supabase.co/storage/v1/object/public/images/...",
      "storagePath": "userId/timestamp-randomId.ext",
      "alt": "image name",
      "size": 12345,
      "dimensions": { "width": 1920, "height": 1080 }
    }
  ],
  "layout": "grid",
  "columns": 3
}
```

### Storage Format (Supabase Storage)

- **Bucket:** `images`
- **Path Pattern:** `{userId}/{timestamp}-{randomId}.{ext}`
- **Example:** `8eac28e6-0127-40d1-ba55-c10cbe52a32b/1762603450642-3bca3760-0e1e.jpg`
- **Public URL:** Generated via `supabase.storage.from('images').getPublicUrl(path)`

---

## Code References

### Core Files

| File | Purpose | Key Lines |
|------|---------|-----------|
| `src/components/blocks/ImageBlock.jsx` | Component, upload, display | 26-100 (init), 102-184 (upload), 200+ (render) |
| `src/components/ExpandedViewEnhanced.jsx` | Update propagation | 520-730 (handleBlockUpdate) |
| `src/utils/blockSerializer.js` | Serialization/Deserialization | 78-100 (serialize), 281-343 (deserialize) |
| `src/utils/smartSync.js` | Save to database | 20-698 (SmartSync manager) |
| `src/utils/imageUploader.js` | Supabase Storage upload | 9-43 (uploadImageToSupabase) |
| `src/hooks/useOptimizedBlockLoader.js` | Block loading | 50-85 (deserialization fix) |
| `src/utils/optimizedBlockLoader.js` | Database loading | 197-253 (transformBlockFromDB) |

### Supporting Files

- `src/utils/sessionCache.js` - Block caching
- `src/utils/paginatedBlockLoader.js` - Alternative loader (also has deserialization fix)
- `src/lib/supabaseOptimized.js` - Supabase client

---

## Key Fixes and Lessons Learned

### Fix 1: Deserialization of entry.blocks (2025-11-08)

**Problem:**
- Blocks from `entry.blocks` were in raw database format
- They had `content` field (JSON string) but NOT `images` field
- ImageBlock component expected `images` array
- Result: Images didn't display even though saved correctly

**Solution:**
- Added deserialization in `useOptimizedBlockLoader.js` (lines 54-66)
- Added deserialization in `usePaginatedBlockLoader.js` (lines 63-75)
- Check if already deserialized before processing
- Deserialize blocks before setting state

**Files Changed:**
- `src/hooks/useOptimizedBlockLoader.js`
- `src/hooks/usePaginatedBlockLoader.js`

**Impact:**
- Images now display correctly on page load
- No data loss
- Backward compatible (checks if already deserialized)

### Fix 2: Block Construction for startTransition Timing (2025-11-08)

**Problem:**
- When `onUpdate()` is called, React's `startTransition` defers state updates
- Block might not be in `blocks` array immediately
- Save would fail because block not found

**Solution:**
- Construct block from updates if not found in array (lines 648-668 in ExpandedViewEnhanced.jsx)
- Infer block type from updates
- Serialize and save constructed block

**Impact:**
- Saves work even when block not yet in state
- No data loss during rapid updates

---

## Troubleshooting Guide

### Issue: Images don't appear after page reload

**Symptoms:**
- Images display correctly after upload
- After page reload, images are missing
- Console shows: `[IMAGE-BLOCK] ⚠️ No images found in block`

**Diagnosis:**
1. Check console for deserialization logs:
   - Look for `[IMAGE-BLOCK] 🔄 Deserializing image block`
   - Check if `imagesCount` is 0 or 'not-array'
2. Check block format in database:
   - Query `blocks` table
   - Verify `content` field contains valid JSON
   - Check if `content` is not empty

**Solution:**
- Verify deserialization is happening in `useOptimizedBlockLoader.js`
- Check if blocks from `entry.blocks` are being deserialized
- Ensure `deserializeBlock()` is being called

### Issue: Images don't save

**Symptoms:**
- Images upload successfully
- Images display in UI
- After reload, images are gone

**Diagnosis:**
1. Check SmartSync logs:
   - Look for `[IMAGE-BLOCK] 📤 SmartSync sending to database`
   - Check if RPC call succeeds
2. Check database:
   - Query `blocks` table
   - Verify `content` field is updated
   - Check `updated_at` timestamp

**Solution:**
- Verify serialization is working (check `[IMAGE-BLOCK] 🔄 Serializing image block`)
- Check SmartSync batch queue
- Verify RPC function `batch_sync_changes` is working

### Issue: Images upload but don't display immediately

**Symptoms:**
- Upload completes successfully
- Images don't appear in UI
- No errors in console

**Diagnosis:**
1. Check if `onUpdate()` is being called:
   - Look for `[IMAGE-BLOCK] 📤 Upload complete - calling onUpdate`
2. Check if update is received:
   - Look for `[IMAGE-BLOCK] 📥 ExpandedView received update`
3. Check if block is found:
   - Look for `currentBlockFound: true/false`

**Solution:**
- Verify `onUpdate()` callback is working
- Check if block construction is needed (startTransition timing)
- Verify state updates are happening

### Debugging Checklist

1. **Upload Phase:**
   - [ ] Files are validated correctly
   - [ ] Compression is working (if > 1MB)
   - [ ] Supabase Storage upload succeeds
   - [ ] Image objects are created with all fields

2. **Update Phase:**
   - [ ] `onUpdate()` is called with correct data
   - [ ] Update is received in ExpandedViewEnhanced
   - [ ] Block is found or constructed correctly

3. **Serialization:**
   - [ ] `serializeBlock()` is called
   - [ ] Images array is included in serialized content
   - [ ] JSON string is valid

4. **Save Phase:**
   - [ ] SmartSync receives the change
   - [ ] Change is added to batch queue
   - [ ] Batch is sent to database
   - [ ] RPC call succeeds

5. **Load Phase:**
   - [ ] Blocks are loaded from database or cache
   - [ ] Deserialization is happening
   - [ ] `images` array is restored

6. **Display Phase:**
   - [ ] Component receives block with `images` array
   - [ ] `useEffect` initializes state correctly
   - [ ] Images render in UI

---

## Diagrams

### Upload Flow

```
User selects files
    ↓
File validation
    ↓
Compression (if > 1MB)
    ↓
Upload to Supabase Storage
    ↓
Create image objects
    ↓
Update local state
    ↓
Call onUpdate()
    ↓
[Phase 2: Update Propagation]
```

### Save Flow

```
onUpdate() called
    ↓
ExpandedViewEnhanced.handleBlockUpdate()
    ↓
Merge with existing block
    ↓
serializeBlock() → JSON string
    ↓
SmartSync.handleChange()
    ↓
Add to batch queue
    ↓
Write to IndexedDB
    ↓
Batch sync (idle/timeout)
    ↓
batch_sync_changes RPC
    ↓
Update blocks table
```

### Load Flow

```
Document opened
    ↓
Check entry.blocks
    ↓
[CRITICAL] Deserialize blocks
    ↓
deserializeBlock() → Parse JSON
    ↓
Restore images array
    ↓
Set component state
    ↓
ImageBlock receives block
    ↓
useEffect initializes images
    ↓
Render images in UI
```

### State Management Flow

```
Component State (ImageBlock)
    ↓
onUpdate() → Parent State (ExpandedViewEnhanced)
    ↓
SmartSync Queue → IndexedDB
    ↓
Batch Sync → Supabase Database
    ↓
[On Reload]
    ↓
Database → Deserialization
    ↓
Component State (ImageBlock)
```

---

## Dependencies and External Systems

### Supabase Storage
- **Bucket:** `images`
- **Purpose:** Store image files
- **Access:** Public URLs generated for each upload
- **Path Format:** `{userId}/{timestamp}-{randomId}.{ext}`

### Supabase Database
- **Table:** `blocks`
- **RPC Function:** `batch_sync_changes`
- **Purpose:** Store block metadata and serialized content

### IndexedDB (via Dexie)
- **Database:** `DevLogSmartSync`
- **Table:** `changes`
- **Purpose:** Crash recovery, offline support
- **Library:** Dexie.js

### React State Management
- **Component State:** `useState` in ImageBlock
- **Parent State:** `useState` in ExpandedViewEnhanced
- **Transition:** `startTransition` for non-urgent updates

---

## Logging Reference

All image block operations are logged with the `[IMAGE-BLOCK]` prefix:

- `🔄 Initializing from block data` - Component initialization
- `✅ Setting images from block.images array` - Images found
- `⚠️ No images found in block` - Images missing
- `📤 Upload complete - calling onUpdate` - Upload finished
- `📥 ExpandedView received update` - Update received
- `🔨 Constructing block from updates` - Block construction
- `🔄 Serializing image block` - Serialization start
- `📦 Serialized constructed block` - Serialization complete
- `📨 SmartSync.handleChange received` - SmartSync received
- `📤 SmartSync sending to database` - Batch sync start
- `✅ SmartSync database response` - Batch sync complete
- `🔄 Deserializing image block` - Deserialization start
- `✅ Parsed content successfully` - Deserialization success
- `❌ Failed to parse content` - Deserialization error

---

## Conclusion

The image block data flow is a complete cycle from upload to display, with critical transformations at serialization and deserialization points. The key insight is that blocks exist in two formats:

1. **Component Format**: Rich objects with `images` arrays
2. **Database Format**: JSON strings in `content` field

The deserialization fix ensures blocks are properly transformed when loaded from `entry.blocks`, maintaining data integrity throughout the system.

**Last Verified:** 2025-11-08  
**Status:** Production Ready


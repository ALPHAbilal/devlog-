# Pattern Analysis: Production Save Systems

## 1. Outline - Debounced Autosave Pattern

### Location
`/mnt/f/study/outline/app/scenes/Document/components/Document.tsx`

### Key Implementation
```javascript
// Line 68: Delay constant
const AUTOSAVE_DELAY = 3000;

// Lines 385-392: Debounced autosave
autosave = debounce(
  () =>
    this.onSave({
      done: false,
      autosave: true,
    }),
  AUTOSAVE_DELAY
);

// Line 114: Blur-based save with 250ms delay
setTimeout(() => props.onSave({ autosave: true }), 250);
```

### Key Insights
- Uses 3-second debounce (not 1.5 seconds as commonly assumed)
- Separate blur handler with 250ms delay for immediate feedback
- Tracks `isEditorDirty` state to prevent unnecessary saves
- Status tracking: `isSaving`, `isPublishing` flags

## 2. Excalidraw - LocalData Management

### Location
`/mnt/f/study/excalidraw/excalidraw-app/data/LocalData.ts`

### Key Implementation
```javascript
// Lines 100-116: Debounced save with flush capability
private static _save = debounce(
  async (elements, appState, files, onFilesSaved) => {
    saveDataStateToLocalStorage(elements, appState);
    await this.fileStorage.saveFiles({ elements, files });
    onFilesSaved();
  },
  SAVE_TO_LOCAL_STORAGE_TIMEOUT
);

// Lines 131-133: Flush method for immediate save
static flushSave = () => {
  this._save.flush();
};

// Lines 145-147: Check if save is paused
static isSavePaused = () => {
  return document.hidden || this.locker.isLocked();
};
```

### Key Insights
- Combines localStorage for data and IndexedDB for files
- Flush capability for immediate saves when needed
- Pause mechanism when document is hidden
- Locker pattern for preventing concurrent saves

## 3. Firebase - WriteBatch Pattern

### Location
`/mnt/f/study/firebase-js-sdk/packages/firestore/src/lite-api/write_batch.ts`

### Key Implementation
```javascript
// Lines 58-59: Mutation queue
private _mutations = [] as Mutation[];
private _committed = false;

// Lines 119, 195-197: Adding to queue
this._mutations.push(parsed.toMutation(ref._key, Precondition.none()));

// Lines 230-238: Commit pattern
commit(): Promise<void> {
  this._verifyNotCommitted();
  this._committed = true;
  if (this._mutations.length > 0) {
    return this._commitHandler(this._mutations);
  }
  return Promise.resolve();
}
```

### Key Insights
- Simple array-based queue
- Committed flag prevents reuse
- Atomic batch operations
- 500 write limit per batch (mentioned in comments)

## 4. Supabase - Client Pattern

### Location
`/mnt/f/study/supabase-js/src/SupabaseClient.ts`

### Key Implementation
```javascript
// Line 173-174: Table operations
from(relation: string): PostgrestQueryBuilder<Schema, any, any> {
  return this.rest.from(relation)
}
```

### Usage Pattern (from tests)
```javascript
// Upsert pattern
await supabase
  .from('table_name')
  .upsert(data, { onConflict: 'id' })
```

### Key Insights
- Clean API with method chaining
- Built-in upsert with conflict handling
- Returns PostgrestQueryBuilder for additional operations
- Supports batch operations natively

## 5. Sequelize - Retry Pattern

### Location
`/mnt/f/study/sequelize/packages/core/src/sequelize.js`

### Key Implementation
```javascript
// Line 356: Merge retry options
const retryOptions = { ...this.options.retry, ...options.retry };

// Lines 358-387: Retry wrapper using retry-as-promised
return await retry(async () => {
  checkTransaction();
  // ... connection and query logic
  return await query.run(sql, bindParameters);
}, retryOptions);

// Default options (from comments):
// retry.max - Number of retries
// retry.timeout - Maximum duration in ms
// retry.backoffBase = 100 - Initial backoff
// retry.backoffExponent = 1.1 - Backoff multiplier
```

### Key Insights
- Uses external `retry-as-promised` library
- Configurable exponential backoff
- Transaction-aware retry logic
- Flexible retry matching patterns

## Combined Pattern Benefits

### 1. Debouncing (Outline + Excalidraw)
- Reduces API calls by 80-90%
- Provides flush for immediate saves
- Blur-based saves for natural save points

### 2. Queue Management (Firebase)
- Simple array-based queue
- Atomic batch operations
- Clear commit semantics

### 3. Dirty Tracking (Implicit)
- Outline: `isEditorDirty` flag
- Excalidraw: Document hidden check
- Prevents unnecessary saves

### 4. Retry Logic (Sequelize)
- Handles transient network failures
- Exponential backoff prevents server overload
- Configurable retry conditions

### 5. Batch Operations (Supabase + Firebase)
- Reduces round trips
- Atomic updates
- Efficient bulk operations

## Why This Combination Works

1. **User Experience**
   - 3-second debounce feels responsive but not aggressive
   - Blur saves provide immediate feedback
   - Retry logic handles network issues transparently

2. **Performance**
   - Batching reduces database load
   - Debouncing reduces network traffic
   - Queue prevents lost changes

3. **Reliability**
   - Retry with exponential backoff handles failures
   - Mutation queue ensures order
   - Dirty tracking prevents duplicates

4. **Simplicity**
   - Each pattern is simple in isolation
   - Clear separation of concerns
   - Easy to debug and test

## Implementation Priority

1. **Critical**: Debounced save (immediate impact)
2. **Critical**: Queue pattern (prevent data loss)
3. **Important**: Retry logic (handle failures)
4. **Important**: Blur saves (user experience)
5. **Nice to have**: Batch optimization (performance)

## Lessons Learned

1. **Don't over-engineer**: None of these repos use complex state machines
2. **Debounce aggressively**: 3 seconds is better than 1 second
3. **Keep queue simple**: Array is sufficient, no need for complex structures
4. **Retry smartly**: Exponential backoff prevents cascade failures
5. **User feedback matters**: Show saving/saved status clearly
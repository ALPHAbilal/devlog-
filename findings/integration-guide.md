# SaveCoordinator Integration Guide for DevLog

## Quick Start

### Step 1: Add SaveCoordinator to Your Project

1. Copy `expert-save-coordinator.js` to: `/mnt/f/devlog-/src/utils/SaveCoordinator.js`

2. Install lodash if not already installed:
```bash
npm install lodash
```

3. Update the import path for Supabase client:
```javascript
// In SaveCoordinator.js, line 13
import { supabase } from '../lib/supabase'; // Adjust to your actual path
```

### Step 2: Replace Current AutoSave System

#### In `src/components/ExpandedViewEnhanced.jsx`

1. **Remove old autosave imports** (around line 10-15):
```javascript
// DELETE THESE:
import { autoSaveManager } from '../utils/autoSaveManager';
import { globalAutoSaveManager } from '../utils/globalAutoSave';
```

2. **Add new SaveCoordinator import**:
```javascript
import { getSaveCoordinator } from '../utils/SaveCoordinator';
```

3. **Initialize SaveCoordinator** (in component body):
```javascript
const saveCoordinator = useMemo(() => getSaveCoordinator(), []);

// Set up event handlers
useEffect(() => {
  saveCoordinator.onSaveComplete = () => {
    console.log('Save completed');
    // Update UI to show saved status
  };
  
  saveCoordinator.onSaveError = (error) => {
    console.error('Save failed:', error);
    // Show error toast
  };
  
  return () => {
    // Cleanup on unmount
    saveCoordinator.flushSave();
  };
}, [saveCoordinator]);
```

4. **Replace block update handler** (around line 200-250):
```javascript
// OLD CODE:
const handleBlockUpdate = (blockId, updates) => {
  autoSaveManager.queueSave(blockId, updates, saveFunction);
};

// NEW CODE:
const handleBlockUpdate = (blockId, updates) => {
  saveCoordinator.enqueue(blockId, updates, entry.id);
};
```

### Step 3: Update TextBlock Component

#### In `src/components/blocks/TextBlock.jsx`

1. **Add blur-based save** (around line 100):
```javascript
const handleBlur = () => {
  // Existing blur logic...
  
  // Add immediate save on blur (from Outline pattern)
  if (content !== block.content) {
    onUpdate(block.id, { content });
    // Trigger flush for immediate save
    getSaveCoordinator().flushSave();
  }
};
```

2. **Add change handler with debounce**:
```javascript
const handleChange = (newContent) => {
  setContent(newContent);
  // This will be debounced automatically by SaveCoordinator
  onUpdate(block.id, { content: newContent });
};
```

### Step 4: Update Dashboard Component

#### In `src/pages/Dashboard.jsx`

1. **Remove old autosave hook**:
```javascript
// DELETE THIS:
import { useAutoSave } from '../hooks/useAutoSave';
```

2. **Add save status indicator**:
```javascript
const [saveStatus, setSaveStatus] = useState('saved');

useEffect(() => {
  const coordinator = getSaveCoordinator();
  
  coordinator.onStatusChange = (status) => {
    setSaveStatus(status);
  };
  
  return () => {
    coordinator.onStatusChange = null;
  };
}, []);
```

3. **Display save status** (in JSX):
```javascript
<div className="save-status">
  {saveStatus === 'saving' && <span>Saving...</span>}
  {saveStatus === 'saved' && <span>All changes saved</span>}
  {saveStatus === 'error' && <span>Save failed - retrying...</span>}
</div>
```

### Step 5: Database Schema Update (if needed)

Ensure your Supabase blocks table has these columns:
```sql
CREATE TABLE IF NOT EXISTS blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL,
  type TEXT DEFAULT 'text',
  content TEXT,
  metadata JSONB DEFAULT '{}',
  position INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for performance
CREATE INDEX idx_blocks_document_id ON blocks(document_id);
```

### Step 6: Clean Up Old Files

Remove these files as they're no longer needed:
- `/src/utils/autoSaveManager.js`
- `/src/utils/globalAutoSave.js`
- `/src/hooks/useAutoSave.js`

## Configuration Options

### Adjust Save Timing

In `SaveCoordinator.js`:
```javascript
const AUTOSAVE_DELAY = 3000; // Change to desired milliseconds
```

### Adjust Retry Settings

```javascript
this.maxRetries = 3; // Number of retry attempts
this.retryBackoffBase = 100; // Initial delay in ms
this.retryBackoffExponent = 1.1; // Backoff multiplier
```

### Batch Size

```javascript
const BATCH_SIZE = 500; // Max blocks per batch
```

## Testing Points

1. **Debounce Test**: Type quickly and verify saves happen after 3 seconds of inactivity
2. **Blur Save Test**: Click away from a block and verify immediate save
3. **Batch Test**: Modify multiple blocks quickly and verify they save together
4. **Retry Test**: Disconnect network, make changes, reconnect and verify retry works
5. **Status Test**: Verify UI shows "Saving..." and "All changes saved"

## Rollback Plan

If issues arise:

1. **Quick Revert**:
```bash
git stash  # Save current changes
git checkout HEAD~1  # Go back one commit
```

2. **Restore Old System**:
- Re-enable the old autosave imports
- Remove SaveCoordinator imports
- Restore original handleBlockUpdate functions

3. **Debug Mode**:
Add logging to SaveCoordinator:
```javascript
// In processQueue method
console.log('Processing queue:', this._mutations.length, 'mutations');
```

## Performance Considerations

1. **Batch Size**: If saving many blocks at once causes timeouts, reduce BATCH_SIZE
2. **Debounce Delay**: If saves feel too slow, reduce AUTOSAVE_DELAY to 2000ms
3. **Retry Logic**: If network is flaky, increase maxRetries to 5

## Migration Checklist

- [ ] SaveCoordinator.js copied to project
- [ ] Lodash installed
- [ ] Supabase import path updated
- [ ] ExpandedViewEnhanced.jsx updated
- [ ] TextBlock.jsx blur handler added
- [ ] Dashboard.jsx status indicator added
- [ ] Database schema verified
- [ ] Old autosave files removed
- [ ] Tested debounce (3s delay)
- [ ] Tested blur save (immediate)
- [ ] Tested batch save (multiple blocks)
- [ ] Tested retry on network failure
- [ ] Tested save status display

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify Supabase connection
3. Check network tab for failed requests
4. Ensure blocks table has correct schema
5. Verify all imports are correct paths
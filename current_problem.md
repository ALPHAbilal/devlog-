● 🎯 ROOT CAUSE FOUND

  After digging through the code, here's the actual root cause:

  The Problem: ExpandedViewEnhanced Has 15+ State Variables

  // ExpandedViewEnhanced.jsx - Lines 118-148
  const [showBlockSelector, setShowBlockSelector] = useState(false);
  const [selectorPosition, setSelectorPosition] = useState(null);
  const [title, setTitle] = useState(entry.title);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [backlinks, setBacklinks] = useState([]);
  const [focusedBlockId, setFocusedBlockId] = useState(null);
  const [tags, setTags] = useState(entry.tags || []);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [editingTagIndex, setEditingTagIndex] = useState(null);
  const [editingTagValue, setEditingTagValue] = useState('');
  const [draggedBlockId, setDraggedBlockId] = useState(null);
  const [dropTargetId, setDropTargetId] = useState(null);
  const [dropPosition, setDropPosition] = useState('after');
  const [viewMode, setViewMode] = useState('blocks');
  const [syncStatus, setSyncStatus] = useState({ pending: 0, syncing: false }); // ← KEY CULPRIT
  // ... and more

  Every time ANY of these update → entire component re-renders → ALL blocks re-render

  The Smoking Gun: SmartSync Interval (Line 312)

  // Runs every X milliseconds
  const statusInterval = setInterval(() => {
    const status = smartSyncManagerRef.current.getSyncStatus();
    setSyncStatus(prevStatus => {  // ← Triggers re-render
      // ...
    });
  }, interval);

  This interval runs constantly, checking sync status. When it calls setSyncStatus, the entire ExpandedViewEnhanced re-renders, causing ALL visible blocks to re-render.

  Why Your Blocks Flicker

  Timeline of what happens:

  1. You type in a TextBlock
  2. SmartSync queues the change
  3. setInterval checks sync status (every ~1 second)
  4. Calls setSyncStatus({ pending: 1, syncing: true })
  5. ExpandedViewEnhanced re-renders
  6. ALL 8-14 visible blocks re-render (virtualization only renders visible ones)
  7. You see a flicker as blocks unmount/remount
  8. Sync completes
  9. Calls setSyncStatus({ pending: 0, syncing: false })
  10. Another re-render → another flicker

solution that would be implmented

  Solution B: Fix Parent Re-Rendering (Root Fix)

  ✅ Pros: Solves the actual problem
  ❌ Cons: More complex, requires refactoring

  
/**
 * Example integration of Smart Sync with a document editor component
 * This shows how to replace the old autosave with the new smart sync
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useSmartSync } from '../hooks/useSmartSync';
import { useParams } from 'react-router-dom';

export function DocumentEditor() {
  const { documentId } = useParams();
  const [blocks, setBlocks] = useState([]);
  
  // Initialize Smart Sync
  const {
    updateBlock,
    createBlock,
    deleteBlock,
    reorderBlock,
    forceSync,
    createSnapshot,
    syncStatus,
    hasUnsavedChanges,
    isSyncing,
    isOnline
  } = useSmartSync(documentId);

  // Load initial blocks from database
  useEffect(() => {
    // Your existing load logic here
    loadBlocksFromDatabase(documentId).then(setBlocks);
  }, [documentId]);

  // Create periodic snapshots (every 5 minutes of activity)
  useEffect(() => {
    const snapshotInterval = setInterval(() => {
      if (hasUnsavedChanges) {
        createSnapshot(blocks);
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(snapshotInterval);
  }, [blocks, hasUnsavedChanges, createSnapshot]);

  // Handle block content changes
  const handleBlockChange = useCallback(async (blockId, newContent) => {
    // OLD WAY (remove this):
    // autoSaveManager.queueSave(documentId, { blockId, content: newContent }, saveFunction);
    
    // NEW WAY (use this):
    try {
      // Update local state immediately (optimistic update)
      setBlocks(prev => prev.map(block => 
        block.id === blockId 
          ? { ...block, content: newContent, updated_at: Date.now() }
          : block
      ));

      // Smart sync handles everything else (IndexedDB + batched Supabase sync)
      await updateBlock(blockId, newContent);
      
    } catch (error) {
      console.error('Failed to update block:', error);
      // Rollback optimistic update on error
      setBlocks(prev => prev.map(block =>
        block.id === blockId
          ? { ...block, content: block.previousContent }
          : block
      ));
    }
  }, [updateBlock]);

  // Handle adding new block
  const handleAddBlock = useCallback(async () => {
    const newBlockId = crypto.randomUUID();
    const newBlock = {
      id: newBlockId,
      content: '',
      type: 'text',
      created_at: Date.now(),
      updated_at: Date.now()
    };

    // Optimistic update
    setBlocks(prev => [...prev, newBlock]);

    try {
      // Smart sync handles persistence
      await createBlock(newBlockId, '');
    } catch (error) {
      console.error('Failed to create block:', error);
      // Rollback on error
      setBlocks(prev => prev.filter(b => b.id !== newBlockId));
    }
  }, [createBlock]);

  // Handle deleting block
  const handleDeleteBlock = useCallback(async (blockId) => {
    // Store block for rollback
    const blockToDelete = blocks.find(b => b.id === blockId);
    
    // Optimistic update
    setBlocks(prev => prev.filter(b => b.id !== blockId));

    try {
      // Smart sync handles deletion
      await deleteBlock(blockId);
    } catch (error) {
      console.error('Failed to delete block:', error);
      // Rollback on error
      if (blockToDelete) {
        setBlocks(prev => [...prev, blockToDelete]);
      }
    }
  }, [blocks, deleteBlock]);

  // Handle drag and drop reordering
  const handleReorder = useCallback(async (blockId, newPosition) => {
    // Your existing reorder logic for optimistic update
    const reorderedBlocks = reorderBlocksArray(blocks, blockId, newPosition);
    setBlocks(reorderedBlocks);

    try {
      // Smart sync handles the persistence
      await reorderBlock(blockId, newPosition);
    } catch (error) {
      console.error('Failed to reorder blocks:', error);
      // Rollback to original order
      setBlocks(blocks);
    }
  }, [blocks, reorderBlock]);

  // Manual save button (optional - for user confidence)
  const handleManualSave = useCallback(async () => {
    try {
      await forceSync();
      // Show success notification
      showNotification('All changes saved!', 'success');
    } catch (error) {
      showNotification('Failed to save changes', 'error');
    }
  }, [forceSync]);

  return (
    <div className="document-editor">
      {/* Sync Status Indicator */}
      <div className="sync-status">
        {!isOnline && (
          <span className="offline-indicator">
            📵 Offline - changes saved locally
          </span>
        )}
        {isSyncing && (
          <span className="syncing-indicator">
            🔄 Syncing...
          </span>
        )}
        {hasUnsavedChanges && !isSyncing && (
          <span className="unsaved-indicator">
            ✏️ {syncStatus.pending} unsaved changes
          </span>
        )}
        {!hasUnsavedChanges && !isSyncing && (
          <span className="saved-indicator">
            ✅ All changes saved
          </span>
        )}
        
        {/* Optional manual save button */}
        {hasUnsavedChanges && (
          <button 
            onClick={handleManualSave}
            className="manual-save-btn"
            disabled={isSyncing}
          >
            Save Now
          </button>
        )}
      </div>

      {/* Your existing editor UI */}
      <div className="blocks-container">
        {blocks.map((block, index) => (
          <BlockEditor
            key={block.id}
            block={block}
            onChange={(content) => handleBlockChange(block.id, content)}
            onDelete={() => handleDeleteBlock(block.id)}
            onReorder={(newPos) => handleReorder(block.id, newPos)}
          />
        ))}
        
        <button onClick={handleAddBlock} className="add-block-btn">
          + Add Block
        </button>
      </div>
    </div>
  );
}

// Example Block Editor Component
function BlockEditor({ block, onChange, onDelete, onReorder }) {
  const [localContent, setLocalContent] = useState(block.content);

  // Debounce local changes before triggering onChange
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localContent !== block.content) {
        onChange(localContent);
      }
    }, 300); // Small local debounce for typing

    return () => clearTimeout(timer);
  }, [localContent, block.content, onChange]);

  return (
    <div className="block-editor">
      <textarea
        value={localContent}
        onChange={(e) => setLocalContent(e.target.value)}
        placeholder="Type here..."
        className="block-content"
      />
      <button onClick={onDelete} className="delete-btn">
        🗑️
      </button>
    </div>
  );
}

// Helper functions
async function loadBlocksFromDatabase(documentId) {
  // Your existing load logic
  // This is just an example
  const { data } = await supabase
    .from('blocks')
    .select('*')
    .eq('document_id', documentId)
    .order('created_at', { ascending: true });
  
  return data || [];
}

function reorderBlocksArray(blocks, blockId, newPosition) {
  // Your existing reorder logic
  const blockIndex = blocks.findIndex(b => b.id === blockId);
  if (blockIndex === -1) return blocks;
  
  const newBlocks = [...blocks];
  const [removed] = newBlocks.splice(blockIndex, 1);
  newBlocks.splice(newPosition, 0, removed);
  
  return newBlocks;
}

function showNotification(message, type) {
  // Your existing notification system
  console.log(`${type}: ${message}`);
}
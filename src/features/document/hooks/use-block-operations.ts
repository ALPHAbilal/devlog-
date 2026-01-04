/**
 * useBlockOperations Hook
 *
 * Manages block CRUD operations including:
 * - updateBlock (with SmartSync)
 * - deleteBlock (with SmartSync)
 * - duplicateBlock (with SmartSync)
 * - convertBlock (with SmartSync)
 * - addBlock (with SmartSync)
 * - Inline block addition handlers
 * - Block selector state
 *
 * Part of Phase 5: Component Decomposition
 * Extracted from ExpandedViewEnhanced.jsx
 */

import { useState, useCallback, useRef, useEffect, startTransition } from 'react';
import { serializeBlock as serializeBlockOriginal } from '@/features/block';
import type { SmartSyncManager } from './use-block-sync';

// Wrapper to handle varying block structures at runtime
// The original function accepts BlockData | TypedBlockData
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const serializeBlock = (block: any) => serializeBlockOriginal(block);

// ============== Types ==============

export type BlockType =
  | 'text'
  | 'heading'
  | 'code'
  | 'table'
  | 'image'
  | 'ai'
  | 'filetree'
  | 'issue-tracker'
  | 'inline-image'
  | 'todo';

export interface BlockData {
  id: string;
  type: BlockType | string;
  content?: string;
  position?: number;
  created_at?: number;
  metadata?: Record<string, unknown>;
  isNew?: boolean;
  // Type-specific fields
  level?: number;
  language?: string;
  filePath?: string;
  data?: unknown;
  messages?: unknown[];
  treeData?: unknown;
  snapshots?: unknown[];
  currentSnapshotId?: string;
  images?: unknown[];
  items?: unknown[];
  url?: string;
  dimensions?: unknown;
  tags?: string[];
  [key: string]: unknown;
}

export interface UseBlockOperationsOptions {
  documentId: string | null;
  blocks: BlockData[];
  blocksRef: React.MutableRefObject<BlockData[]>;
  loadedBlocksRef: React.MutableRefObject<BlockData[]>;
  updateSingleBlock: (id: string, updates: Partial<BlockData>) => void;
  updateLoadedBlocks: (blocks: BlockData[]) => void;
  setBlocksDirectly: (blocks: BlockData[]) => void;
  removeBlock: (id: string) => void;
  smartSyncManagerRef: React.MutableRefObject<SmartSyncManager | null>;
  isInitialLoadRef: React.MutableRefObject<boolean>;
  trackEvent: (name: string, data: Record<string, unknown>) => void;
}

export interface UseBlockOperationsReturn {
  // CRUD operations
  updateBlock: (blockId: string, updates: Partial<BlockData>) => void;
  deleteBlock: (blockId: string) => void;
  duplicateBlock: (blockId: string) => void;
  convertBlock: (blockId: string, newType: BlockType, meta?: Record<string, unknown>) => void;
  addBlock: (type: BlockType, afterBlockId?: string | null) => void;

  // Inline operations
  handleAddBelowBlock: (blockIdOrData: string | BlockData) => void;
  handleAddAtEnd: () => void;
  handleInlineBlockAdd: (blockIndex: number, data: string | BlockData) => void;

  // Selector state (for AddBlockRow)
  showBlockSelector: boolean;
  setShowBlockSelector: (show: boolean) => void;
  selectorPosition: string | null;
  setSelectorPosition: (position: string | null) => void;

  // Refs for BlockRenderer
  showBlockSelectorRef: React.MutableRefObject<boolean>;
  selectorPositionRef: React.MutableRefObject<string | null>;
  addBlockRef: React.MutableRefObject<((type: BlockType, afterBlockId?: string | null) => void) | null>;
}

// ============== Hook Implementation ==============

export function useBlockOperations({
  documentId,
  blocks,
  blocksRef,
  loadedBlocksRef,
  updateSingleBlock,
  updateLoadedBlocks,
  setBlocksDirectly,
  removeBlock,
  smartSyncManagerRef,
  isInitialLoadRef,
  trackEvent,
}: UseBlockOperationsOptions): UseBlockOperationsReturn {

  // Block selector state
  const [showBlockSelector, setShowBlockSelector] = useState(false);
  const [selectorPosition, setSelectorPosition] = useState<string | null>(null);

  // Refs for BlockRenderer (to avoid closure issues)
  const showBlockSelectorRef = useRef(false);
  const selectorPositionRef = useRef<string | null>(null);
  const addBlockRef = useRef<((type: BlockType, afterBlockId?: string | null) => void) | null>(null);

  // Sync refs with state
  useEffect(() => {
    showBlockSelectorRef.current = showBlockSelector;
    selectorPositionRef.current = selectorPosition;
  }, [showBlockSelector, selectorPosition]);

  // ============== UPDATE BLOCK ==============
  const updateBlock = useCallback((blockId: string, updates: Partial<BlockData>) => {
    // Add defensive check for blockId
    if (!blockId || !updates) {
      console.warn('updateBlock called with invalid parameters:', { blockId, updates });
      return;
    }

    // CRITICAL: Use refs to avoid stale closure bug
    const block = blocksRef.current.find(b => b.id === blockId);
    const loaderBlock = loadedBlocksRef.current?.find(b => b.id === blockId);
    const actualBlock = block || loaderBlock;

    if (!actualBlock) {
      console.error('[DEBUG-1] ❌ CRITICAL: actualBlock is undefined!', {
        blockId: blockId.substring(0, 8),
        blocksArrayLength: blocksRef.current.length,
      });
    }

    // Check if this is a significant update that needs saving
    const needsSave = updates.content !== undefined ||
                     updates.data !== undefined ||
                     updates.metadata !== undefined ||
                     updates.tags !== undefined ||
                     updates.messages !== undefined ||
                     updates.treeData !== undefined ||
                     updates.snapshots !== undefined ||
                     updates.currentSnapshotId !== undefined ||
                     updates.images !== undefined ||
                     updates.items !== undefined ||
                     updates.url !== undefined ||
                     updates.dimensions !== undefined ||
                     updates.language !== undefined ||
                     updates.filePath !== undefined ||
                     updates.level !== undefined;

    // CRITICAL FIX: Get position BEFORE startTransition
    let blockPosition = updates.position ?? actualBlock?.position;
    if (blockPosition === undefined || blockPosition === null) {
      if (block) {
        const idx = blocksRef.current.indexOf(block);
        blockPosition = idx >= 0 ? idx : blocksRef.current.length;
      } else if (loaderBlock && loadedBlocksRef.current) {
        const idx = loadedBlocksRef.current.indexOf(loaderBlock);
        blockPosition = idx >= 0 ? idx : (loadedBlocksRef.current.length || blocksRef.current.length);
      } else {
        blockPosition = blocksRef.current.length;
      }
    }

    if (blockPosition < 0) {
      blockPosition = blocksRef.current.length;
    }

    // Use the loader's updateBlock method
    startTransition(() => {
      updateSingleBlock(blockId, updates);
    });

    // Skip saves during initial load
    if (needsSave && !isInitialLoadRef.current) {
      if (smartSyncManagerRef.current) {
        const currentBlock = actualBlock;
        if (currentBlock) {
          // Remove isNew flag when updating a block
          const { isNew, ...blockWithoutNew } = currentBlock;

          const updatedBlock = {
            ...blockWithoutNew,
            ...updates,
            position: blockPosition
          };

          const serializedBlock = serializeBlock(updatedBlock);

          smartSyncManagerRef.current.handleChange(
            blockId,
            serializedBlock.content,
            'UPDATE',
            updatedBlock.type,
            updatedBlock.position,
            serializedBlock.metadata
          ).catch((error: Error) => {
            console.error('[SYNC-CHANGE-RECEIVED] ❌ Smart Sync error:', error);
          });
        } else {
          // Block not found - construct from updates
          // Access data properties safely via bracket notation
          const dataObj = updates.data as Record<string, unknown> | undefined;
          const inferredType = updates.type ||
                              (updates.images !== undefined ? 'image' : null) ||
                              (updates.messages !== undefined ? 'ai' : null) ||
                              (updates.treeData !== undefined ? 'filetree' : null) ||
                              (dataObj?.['milestone'] !== undefined ||
                               dataObj?.['issues'] !== undefined ? 'issue-tracker' : null) ||
                              (updates.data !== undefined ? 'table' : null) ||
                              (updates.url !== undefined ? 'inline-image' : null) ||
                              (updates.language !== undefined || updates.filePath !== undefined ? 'code' : null) ||
                              'text';

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const constructedBlock: any = {
            id: blockId,
            type: inferredType,
            position: blockPosition >= 0 ? blockPosition : blocksRef.current.length,
            metadata: updates.metadata || {},
            ...updates
          };

          const serializedBlock = serializeBlock(constructedBlock);

          smartSyncManagerRef.current.handleChange(
            constructedBlock.id,
            serializedBlock.content,
            'UPDATE',
            constructedBlock.type,
            constructedBlock.position,
            serializedBlock.metadata
          ).catch((error: Error) => {
            console.error('[SYNC-CHANGE-RECEIVED] ❌ Smart Sync error:', error);
          });
        }
      }
    }
  }, [updateSingleBlock, blocksRef, loadedBlocksRef, smartSyncManagerRef, isInitialLoadRef]);

  // ============== DELETE BLOCK ==============
  const deleteBlock = useCallback((blockId: string) => {
    if (!blockId) {
      console.warn('deleteBlock called with invalid blockId:', blockId);
      return;
    }

    const blockIndex = blocks.findIndex(b => b.id === blockId);
    const blockToDelete = blockIndex >= 0 ? blocks[blockIndex] : null;

    if (blockToDelete) {
      const dataObj = blockToDelete.data as Record<string, unknown> | undefined;
      const issuesArr = dataObj?.['issues'] as unknown[] | undefined;
      trackEvent('block_deleted', {
        block_type: blockToDelete.type,
        had_content: (blockToDelete.content?.length ?? 0) > 0 ||
                    (issuesArr?.length ?? 0) > 0,
        document_id: documentId
      });
    }

    removeBlock(blockId);

    if (smartSyncManagerRef.current) {
      smartSyncManagerRef.current.handleChange(
        blockId,
        null,
        'DELETE',
        blockToDelete?.type || null,
        blockIndex >= 0 ? blockIndex : null
      ).catch((error: Error) => {
        console.error('[DELETE-ERROR] Smart Sync delete failed:', error);
      });
    }
  }, [removeBlock, blocks, documentId, trackEvent, smartSyncManagerRef]);

  // ============== DUPLICATE BLOCK ==============
  const duplicateBlock = useCallback((blockId: string) => {
    const blockIndex = blocks.findIndex(b => b.id === blockId);
    if (blockIndex === -1) return;

    const blockToDuplicate = blocks[blockIndex];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const duplicatedBlock: any = {
      ...blockToDuplicate,
      id: crypto.randomUUID(),
      position: blockIndex + 1,
      created_at: Date.now(),
      isNew: false
    };

    const updatedBlocks = [...blocks];
    updatedBlocks.splice(blockIndex + 1, 0, duplicatedBlock);

    // Update positions for all blocks after the insertion point
    for (let i = blockIndex + 2; i < updatedBlocks.length; i++) {
      const block = updatedBlocks[i];
      if (block) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        updatedBlocks[i] = { ...block, position: i } as any;
      }
    }

    startTransition(() => {
      updateLoadedBlocks(updatedBlocks);
    });

    if (smartSyncManagerRef.current) {
      const serializedBlock = serializeBlock(duplicatedBlock);

      smartSyncManagerRef.current.handleChange(
        duplicatedBlock.id,
        serializedBlock.content,
        'CREATE',
        duplicatedBlock.type,
        duplicatedBlock.position,
        serializedBlock.metadata
      ).catch((error: Error) => {
        console.error('Smart Sync duplicate error:', error);
      });
    }
  }, [blocks, updateLoadedBlocks, smartSyncManagerRef]);

  // ============== CONVERT BLOCK ==============
  const convertBlock = useCallback((blockId: string, newType: BlockType, meta: Record<string, unknown> = {}) => {
    const updatedBlocks = blocks.map((block, index) => {
      if (block.id === blockId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newBlock: any = {
          ...block,
          type: newType,
          position: block.position !== undefined ? block.position : index,
          ...meta
        };

        if (newType === 'heading' && meta['level']) {
          newBlock.level = meta['level'] as number;
        }

        if (newType === 'ai') {
          newBlock.content = '';
        }

        return newBlock as BlockData;
      }
      return block.position !== undefined ? block : { ...block, position: index };
    });

    startTransition(() => {
      updateLoadedBlocks(updatedBlocks);
    });

    if (smartSyncManagerRef.current) {
      const convertedBlock = updatedBlocks.find(b => b.id === blockId);
      if (convertedBlock) {
        const serializedBlock = serializeBlock(convertedBlock);

        smartSyncManagerRef.current.handleChange(
          blockId,
          serializedBlock.content,
          'UPDATE',
          convertedBlock.type,
          convertedBlock.position,
          serializedBlock.metadata
        ).catch((error: Error) => {
          console.error('Smart Sync convert error:', error);
        });
      }
    }
  }, [blocks, updateLoadedBlocks, smartSyncManagerRef]);

  // ============== ADD BLOCK ==============
  const addBlock = useCallback((type: BlockType, afterBlockId: string | null = null) => {
    if (!blocks || !Array.isArray(blocks)) {
      console.error('[ADD-BLOCK] ERROR: blocks array is invalid!');
      return;
    }

    let position: number;
    let insertIndex = -1;

    if (afterBlockId) {
      insertIndex = blocks.findIndex(b => b.id === afterBlockId);
      if (insertIndex === -1) {
        console.error('[ADD-BLOCK] ERROR: afterBlockId not found in blocks!');
        return;
      }
      position = insertIndex + 1;
    } else {
      position = blocks.length;
      insertIndex = blocks.length;
    }

    const newBlock: BlockData = {
      id: crypto.randomUUID(),
      type,
      content: '',
      position,
      created_at: Date.now(),
      isNew: true
    };

    // Initialize based on type
    if (type === 'heading') {
      newBlock.level = 2;
    } else if (type === 'code') {
      newBlock.language = 'javascript';
    } else if (type === 'issue-tracker') {
      newBlock.data = { milestone: '', issues: [] };
      newBlock.content = '';
    }

    trackEvent('block_created', {
      block_type: type,
      position,
      after_block: !!afterBlockId,
      document_id: documentId
    });

    const updatedBlocks = Array.from(blocks);
    if (afterBlockId) {
      updatedBlocks.splice(insertIndex + 1, 0, newBlock);
    } else {
      updatedBlocks.push(newBlock);
    }

    // Preserve block references
    const preservedBlocks = updatedBlocks.map((block) => {
      if (block === newBlock) return block;
      const oldBlock = blocks.find(b => b.id === block.id);
      if (!oldBlock) return block;
      if (oldBlock === block) return oldBlock;

      const contentSame = oldBlock.content === block.content;
      const typeSame = oldBlock.type === block.type;
      const metadataSame = JSON.stringify(oldBlock.metadata) === JSON.stringify(block.metadata);

      if (contentSame && typeSame && metadataSame) {
        return oldBlock;
      }
      return block;
    });

    startTransition(() => {
      setBlocksDirectly(preservedBlocks);
      setShowBlockSelector(false);
      setSelectorPosition(null);
    });

    if (smartSyncManagerRef.current) {
      const serializedBlock = serializeBlock(newBlock);

      smartSyncManagerRef.current.handleChange(
        newBlock.id,
        serializedBlock.content,
        'CREATE',
        newBlock.type,
        newBlock.position,
        serializedBlock.metadata
      ).catch((error: Error) => {
        console.error('Smart Sync add block error:', error);
      });
    }
  }, [blocks, setBlocksDirectly, documentId, trackEvent, smartSyncManagerRef]);

  // Store addBlock in ref for BlockRenderer
  useEffect(() => {
    addBlockRef.current = addBlock;
  }, [addBlock]);

  // ============== INLINE OPERATIONS ==============
  const handleAddBelowBlock = useCallback((blockIdOrData: string | BlockData) => {
    if (typeof blockIdOrData === 'object' && blockIdOrData.type) {
      // Direct block creation
      const focusedBlockId = blocks.find(b => b.isNew)?.id;
      if (!focusedBlockId) return;

      const index = blocks.findIndex(b => b.id === focusedBlockId);

      // Spread existing data first, then override with our new values
      const { id: _existingId, position: _existingPos, created_at: _existingCreated, ...dataWithoutOverrides } = blockIdOrData;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newBlock: any = {
        ...dataWithoutOverrides,
        id: crypto.randomUUID(),
        position: index + 1,
        created_at: Date.now(),
      };

      const updatedBlocks = [...blocks];
      updatedBlocks.splice(index + 1, 0, newBlock);

      const preservedBlocks = updatedBlocks.map((block) => {
        if (block === newBlock) return block;
        const oldBlock = blocks.find(b => b.id === block.id);
        if (!oldBlock) return block;

        const contentSame = oldBlock.content === block.content;
        const typeSame = oldBlock.type === block.type;
        const metadataSame = JSON.stringify(oldBlock.metadata) === JSON.stringify(block.metadata);

        if (contentSame && typeSame && metadataSame) {
          return oldBlock;
        }
        return block;
      });

      startTransition(() => {
        setBlocksDirectly(preservedBlocks);
      });

      if (smartSyncManagerRef.current) {
        const serializedBlock = serializeBlock(newBlock);

        smartSyncManagerRef.current.handleChange(
          newBlock.id,
          serializedBlock.content,
          'CREATE',
          newBlock.type,
          newBlock.position,
          serializedBlock.metadata
        ).catch((error: Error) => {
          console.error('Smart Sync add below error:', error);
        });
      }
    } else {
      // Show selector
      startTransition(() => {
        setSelectorPosition(blockIdOrData as string);
        setShowBlockSelector(true);
      });
    }
  }, [blocks, setBlocksDirectly, smartSyncManagerRef]);

  const handleAddAtEnd = useCallback(() => {
    startTransition(() => {
      setSelectorPosition('end');
      setShowBlockSelector(true);
    });
  }, []);

  const handleInlineBlockAdd = useCallback((blockIndex: number, data: string | BlockData) => {
    if (typeof data === 'object' && data.type) {
      // Spread existing data first, then override with our new values
      const { id: _existingId, position: _existingPos, created_at: _existingCreated, ...dataWithoutOverrides } = data;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newBlock: any = {
        ...dataWithoutOverrides,
        id: crypto.randomUUID(),
        position: blockIndex + 1,
        created_at: Date.now(),
      };

      const updatedBlocks = [...blocks];
      updatedBlocks.splice(blockIndex + 1, 0, newBlock);

      const preservedBlocks = updatedBlocks.map((block) => {
        if (block === newBlock) return block;
        const oldBlock = blocks.find(b => b.id === block.id);
        if (!oldBlock) return block;

        const contentSame = oldBlock.content === block.content;
        const typeSame = oldBlock.type === block.type;
        const metadataSame = JSON.stringify(oldBlock.metadata) === JSON.stringify(block.metadata);

        if (contentSame && typeSame && metadataSame) {
          return oldBlock;
        }
        return block;
      });

      startTransition(() => {
        setBlocksDirectly(preservedBlocks);
      });

      if (smartSyncManagerRef.current) {
        const serializedBlock = serializeBlock(newBlock);

        smartSyncManagerRef.current.handleChange(
          newBlock.id,
          serializedBlock.content,
          'CREATE',
          newBlock.type,
          newBlock.position,
          serializedBlock.metadata
        ).catch((error: Error) => {
          console.error('Smart Sync inline add error:', error);
        });
      }
    } else {
      handleAddBelowBlock(data);
    }
  }, [blocks, setBlocksDirectly, handleAddBelowBlock, smartSyncManagerRef]);

  return {
    updateBlock,
    deleteBlock,
    duplicateBlock,
    convertBlock,
    addBlock,
    handleAddBelowBlock,
    handleAddAtEnd,
    handleInlineBlockAdd,
    showBlockSelector,
    setShowBlockSelector,
    selectorPosition,
    setSelectorPosition,
    showBlockSelectorRef,
    selectorPositionRef,
    addBlockRef,
  };
}

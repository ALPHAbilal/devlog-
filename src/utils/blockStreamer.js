import { supabase } from '../lib/supabase';

/**
 * Progressive block loading with cancellation support
 */
export class BlockStreamer {
  constructor() {
    this.activeStreams = new Map();
  }

  /**
   * Stream blocks for a document progressively
   * @param {string} documentId - Document ID to load blocks for
   * @param {Function} onBlockReceived - Callback when a block is received
   * @param {Function} onComplete - Callback when all blocks are loaded
   * @returns {Function} Cancel function
   */
  streamBlocks(documentId, onBlockReceived, onComplete) {
    // Cancel any existing stream for this document
    this.cancelStream(documentId);

    const controller = new AbortController();
    this.activeStreams.set(documentId, controller);

    const loadBlocks = async () => {
      try {
        console.log(`BlockStreamer: Starting to stream blocks for document ${documentId}`);
        
        // First, get the count and basic info
        const { count, error: countError } = await supabase
          .from('blocks')
          .select('*', { count: 'exact', head: true })
          .eq('document_id', documentId);

        if (countError) {
          console.error('BlockStreamer: Error getting block count:', countError);
          throw countError;
        }
        
        // Also check if document exists
        const { data: docCheck, error: docError } = await supabase
          .from('documents')
          .select('id, title')
          .eq('id', documentId)
          .single();
          
        if (docError || !docCheck) {
          console.warn(`BlockStreamer: Document ${documentId} not found in database`);
        }

        // If no blocks, complete immediately
        if (count === 0) {
          console.log(`BlockStreamer: Document ${documentId} is empty (0 blocks)`);
          onComplete();
          this.activeStreams.delete(documentId);
          return;
        }
        
        console.log(`BlockStreamer: Found ${count} blocks to load`);

        let offset = 0;
        let consecutiveSmallBlocks = 0;

        while (offset < count && !controller.signal.aborted) {
          // Dynamic batch size based on performance and block types
          let batchSize = 1; // Start with 1 block
          
          // If we've loaded several small blocks quickly, increase batch size
          if (consecutiveSmallBlocks >= 3) {
            batchSize = 3; // Load more blocks at once
          } else if (consecutiveSmallBlocks >= 2) {
            batchSize = 2;
          }
          
          // Never load more than remaining blocks
          batchSize = Math.min(batchSize, count - offset);
          
          console.log(`BlockStreamer: Loading ${batchSize} block(s) starting at position ${offset}`);

          const { data: blocks, error } = await supabase
            .from('blocks')
            .select('*')
            .eq('document_id', documentId)
            .order('position')
            .range(offset, offset + batchSize - 1);

          if (error) throw error;
          
          if (controller.signal.aborted) break;

          // Process each block
          for (let i = 0; i < blocks.length; i++) {
            const block = blocks[i];
            if (controller.signal.aborted) break;
            
            // Transform block from DB format
            const transformedBlock = this.transformBlockFromDB(block);
            
            // Ensure transformed block is not marked as loading
            if (transformedBlock.isLoading) {
              delete transformedBlock.isLoading;
            }
            
            // Determine if this is a "small" block
            const isSmallBlock = this.isSmallBlock(transformedBlock);
            if (isSmallBlock) {
              consecutiveSmallBlocks++;
            } else {
              consecutiveSmallBlocks = 0; // Reset counter for large blocks
            }
            
            // Calculate the actual position
            const blockPosition = offset + i;
            console.log(`BlockStreamer: Delivering block at position ${blockPosition} to UI`);
            
            // Notify about the received block
            onBlockReceived(transformedBlock, blockPosition, count);
            
            // Dynamic delay based on block size
            const delay = isSmallBlock ? 30 : 50; // Smaller delay for small blocks
            await new Promise(resolve => setTimeout(resolve, delay));
          }

          offset += blocks.length;
        }

        if (!controller.signal.aborted) {
          onComplete();
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error('Error streaming blocks:', error);
          onComplete(error);
        }
      } finally {
        this.activeStreams.delete(documentId);
      }
    };

    // Start loading
    loadBlocks();

    // Return cancel function
    return () => this.cancelStream(documentId);
  }

  /**
   * Cancel an active stream
   */
  cancelStream(documentId) {
    const controller = this.activeStreams.get(documentId);
    if (controller) {
      controller.abort();
      this.activeStreams.delete(documentId);
    }
  }

  /**
   * Cancel all active streams
   */
  cancelAllStreams() {
    for (const [documentId, controller] of this.activeStreams) {
      controller.abort();
    }
    this.activeStreams.clear();
  }

  /**
   * Determine if a block is "small" based on content size and type
   */
  isSmallBlock(block) {
    // Headings are always considered small
    if (block.type === 'heading') return true;
    
    // Empty blocks are small
    if (!block.content) return true;
    
    // Text blocks under 200 characters are small
    if (block.type === 'text' && block.content.length < 200) return true;
    
    // Todo blocks with less than 3 items are small
    if (block.type === 'todo' && block.items && block.items.length < 3) return true;
    
    // All other blocks (code, tables, AI conversations) are considered large
    return false;
  }

  /**
   * Transform block from database format
   */
  transformBlockFromDB(block) {
    const baseBlock = {
      id: block.id,
      type: block.type,
      content: block.content || '',
      position: block.position
    };

    // Add type-specific fields
    if (block.type === 'code') {
      baseBlock.language = block.language;
      baseBlock.filePath = block.file_path;
      baseBlock.versionOf = block.version_of;
    }

    // For blocks that use 'data' property (table, todo, template, issue-tracker), restore it from metadata
    if (block.type === 'table' || block.type === 'todo' || block.type === 'template' || block.type === 'issue-tracker') {
      baseBlock.data = block.metadata || {};
    } else if (block.metadata) {
      // For other blocks, merge metadata properties directly
      Object.assign(baseBlock, block.metadata);
      
      // Also handle specific known properties for certain block types
      if (block.type === 'filetree' && block.metadata.treeData) {
        baseBlock.treeData = block.metadata.treeData;
      }
      if (block.type === 'ai' && block.metadata.messages) {
        baseBlock.messages = block.metadata.messages;
      }
      if (block.type === 'image' && block.metadata.images) {
        baseBlock.images = block.metadata.images;
      }
      if (block.type === 'inline-image') {
        // inline-image stores properties directly in metadata
        if (block.metadata.url) baseBlock.url = block.metadata.url;
        if (block.metadata.alt) baseBlock.alt = block.metadata.alt;
        if (block.metadata.dimensions) baseBlock.dimensions = block.metadata.dimensions;
      }
    }

    return baseBlock;
  }

  /**
   * Get skeleton blocks for a given count
   */
  static getSkeletonBlocks(count) {
    const skeletons = [];
    const blockTypes = ['heading', 'text', 'code', 'text', 'heading'];
    
    for (let i = 0; i < count; i++) {
      skeletons.push({
        id: `skeleton-${i}`,
        type: blockTypes[i % blockTypes.length],
        content: '',
        isLoading: true,
        position: i
      });
    }
    
    return skeletons;
  }
}

// Export singleton instance
export const blockStreamer = new BlockStreamer();
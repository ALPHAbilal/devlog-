import { supabase } from '../lib/supabase';

/**
 * Optimized block loader with better skeleton management
 */
export class OptimizedBlockLoader {
  constructor() {
    this.cache = new Map();
    this.activeLoads = new Map();
  }

  /**
   * Load document with optimized skeleton approach
   */
  async loadDocument(documentId) {
    // Check cache first
    if (this.cache.has(documentId)) {
      const cached = this.cache.get(documentId);
      if (Date.now() - cached.timestamp < 5000) { // 5 second cache
        return { blocks: cached.blocks, fromCache: true };
      }
    }

    // Cancel any existing load
    const existingController = this.activeLoads.get(documentId);
    if (existingController) {
      existingController.abort();
    }

    const controller = new AbortController();
    this.activeLoads.set(documentId, controller);

    try {
      // Fetch all blocks in one query - much faster than streaming
      const { data: blocks, error } = await supabase
        .from('blocks')
        .select('*')
        .eq('document_id', documentId)
        .order('position');

      if (error) throw error;
      if (controller.signal.aborted) return null;

      const transformedBlocks = blocks.map(this.transformBlockFromDB);
      
      // Cache the result
      this.cache.set(documentId, {
        blocks: transformedBlocks,
        timestamp: Date.now()
      });

      this.activeLoads.delete(documentId);
      return { blocks: transformedBlocks, fromCache: false };
    } catch (error) {
      this.activeLoads.delete(documentId);
      throw error;
    }
  }

  /**
   * Get skeleton blocks based on actual block data
   */
  static generateSkeletons(blocks) {
    if (!blocks || blocks.length === 0) {
      // Default skeletons for empty document
      return [
        { id: 'skeleton-0', type: 'heading', isLoading: true, estimatedHeight: 48 },
        { id: 'skeleton-1', type: 'text', isLoading: true, estimatedHeight: 80 },
        { id: 'skeleton-2', type: 'text', isLoading: true, estimatedHeight: 64 }
      ];
    }

    // Generate skeletons based on actual blocks
    return blocks.map((block, index) => ({
      id: `skeleton-${index}`,
      type: block.type,
      isLoading: true,
      estimatedHeight: this.estimateBlockHeight(block)
    }));
  }

  /**
   * Estimate block height based on content
   */
  static estimateBlockHeight(block) {
    const BASE_PADDING = 32; // padding for block container
    
    switch (block.type) {
      case 'heading':
        return BASE_PADDING + (block.level === 1 ? 40 : block.level === 2 ? 32 : 28);
      
      case 'text':
        if (!block.content) return BASE_PADDING + 60;
        // Estimate ~80 chars per line, 20px per line
        const lines = Math.ceil(block.content.length / 80);
        return BASE_PADDING + (lines * 20);
      
      case 'code':
        if (!block.content) return BASE_PADDING + 100;
        const codeLines = block.content.split('\n').length;
        return BASE_PADDING + 40 + (codeLines * 20); // 40px for header
      
      case 'table':
        if (!block.rows) return BASE_PADDING + 200;
        return BASE_PADDING + (block.rows.length * 40);
      
      case 'todo':
        if (!block.items) return BASE_PADDING + 100;
        return BASE_PADDING + (block.items.length * 32);
      
      case 'ai':
        if (!block.messages) return BASE_PADDING + 200;
        // Estimate height based on message count
        return BASE_PADDING + (block.messages.length * 80);
      
      default:
        return BASE_PADDING + 100;
    }
  }

  /**
   * Transform block from database format
   */
  transformBlockFromDB(block) {
    const baseBlock = {
      id: block.id,
      type: block.type,
      content: block.content,
      position: block.position
    };

    // Add type-specific fields
    if (block.type === 'code') {
      baseBlock.language = block.language;
      baseBlock.filePath = block.file_path;
      baseBlock.versionOf = block.version_of;
    }

    // Parse metadata
    if (block.metadata) {
      Object.assign(baseBlock, block.metadata);
    }

    return baseBlock;
  }

  /**
   * Preload blocks for multiple documents
   */
  async preloadDocuments(documentIds) {
    const uncachedIds = documentIds.filter(id => {
      const cached = this.cache.get(id);
      return !cached || Date.now() - cached.timestamp > 5000;
    });

    if (uncachedIds.length === 0) return;

    try {
      // Batch load blocks for multiple documents
      const { data: blocks, error } = await supabase
        .from('blocks')
        .select('*')
        .in('document_id', uncachedIds)
        .order('document_id')
        .order('position');

      if (error) throw error;

      // Group blocks by document
      const blocksByDocument = blocks.reduce((acc, block) => {
        if (!acc[block.document_id]) acc[block.document_id] = [];
        acc[block.document_id].push(this.transformBlockFromDB(block));
        return acc;
      }, {});

      // Cache each document's blocks
      Object.entries(blocksByDocument).forEach(([docId, docBlocks]) => {
        this.cache.set(docId, {
          blocks: docBlocks,
          timestamp: Date.now()
        });
      });
    } catch (error) {
      console.error('Error preloading documents:', error);
    }
  }

  /**
   * Clear cache for a document
   */
  clearCache(documentId) {
    this.cache.delete(documentId);
  }

  /**
   * Clear all cache
   */
  clearAllCache() {
    this.cache.clear();
  }
}

// Export singleton
export const optimizedBlockLoader = new OptimizedBlockLoader();
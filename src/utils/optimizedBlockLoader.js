import { supabase } from '../lib/supabase';
import { deserializeBlock } from './blockSerializer';

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
      const cacheAge = Date.now() - cached.timestamp;
      if (cacheAge < 5000) { // 5 second cache
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
      // In development, add retry logic for auth timing issues
      const maxRetries = process.env.NODE_ENV === 'development' ? 3 : 1;
      let lastError;
      
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          if (controller.signal.aborted) return null;
          
          // Check auth status before loading (important for development)
          if (process.env.NODE_ENV === 'development') {
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) {
              if (attempt < maxRetries - 1) {
                console.log(`[Dev] Auth not ready, retrying in ${500 * (attempt + 1)}ms...`);
                await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
                continue;
              }
              throw new Error('Authentication required');
            }
          }
          
          // Fetch all blocks in one query - much faster than streaming
          console.log(`OptimizedBlockLoader: Loading blocks for document ${documentId}`);
          
          // CRITICAL DEBUG: Check what we're querying
          console.log('[BLOCKS-DEBUG] Attempting to load from blocks table');
          console.log('[BLOCKS-DEBUG] Query: SELECT * FROM blocks WHERE document_id =', documentId);
          
          const { data: blocks, error } = await supabase
            .from('blocks')
            .select('*')
            .eq('document_id', documentId)
            .is('deleted_at', null)  // CRITICAL: Filter out soft-deleted blocks
            .order('position');

          if (error) {
            console.error('[BLOCKS-DEBUG] Error loading blocks:', error);
            console.error('[BLOCKS-DEBUG] Error details:', {
              message: error.message,
              details: error.details,
              hint: error.hint,
              code: error.code
            });
            throw error;
          }
          if (controller.signal.aborted) return null;

          console.log(`OptimizedBlockLoader: Loaded ${blocks?.length || 0} blocks for document ${documentId}`);
          
          // DEBUG: Show what we actually got
          if (blocks && blocks.length > 0) {
            console.log('[BLOCKS-DEBUG] First block structure:', {
              id: blocks[0].id,
              type: blocks[0].type,
              position: blocks[0].position,
              has_content: !!blocks[0].content,
              content_length: blocks[0].content?.length || 0
            });
          } else {
            console.log('[BLOCKS-DEBUG] No blocks found in blocks table for document:', documentId);
          }
          const transformedBlocks = blocks.map(this.transformBlockFromDB);
          
          // Cache the result
          this.cache.set(documentId, {
            blocks: transformedBlocks,
            timestamp: Date.now()
          });

          this.activeLoads.delete(documentId);
          return { blocks: transformedBlocks, fromCache: false };
        } catch (error) {
          lastError = error;
          
          if (controller.signal.aborted) {
            throw error;
          }
          
          // Log in development
          if (process.env.NODE_ENV === 'development') {
            console.log(`[Dev] Block load attempt ${attempt + 1} failed:`, error.message);
          }
          
          // Wait before retry (except on last attempt)
          if (attempt < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
          }
        }
      }
      
      throw lastError;
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
    // Log code blocks from database
    if (block.type === 'code') {
      console.log('[CODE-BLOCK] 📥 Loading code block from database:', {
        blockId: block.id?.substring(0, 8) + '...',
        hasContent: !!block.content,
        contentLength: block.content?.length || 0,
        hasLanguage: block.language !== undefined,
        hasFilePath: block.file_path !== undefined,
        language: block.language,
        filePath: block.file_path
      });
    }
    
    // Use the deserializer to properly restore block structure
    const deserializedBlock = deserializeBlock(block);
    
    // Add any additional fields that might be stored separately in the database
    if (block.type === 'code') {
      deserializedBlock.language = block.language || deserializedBlock.language;
      deserializedBlock.filePath = block.file_path || deserializedBlock.filePath;
      deserializedBlock.versionOf = block.version_of || deserializedBlock.versionOf;
      
      // Log code block after transformation
      console.log('[CODE-BLOCK] ✅ Transformed code block from database:', {
        blockId: block.id?.substring(0, 8) + '...',
        blockType: deserializedBlock.type,
        hasLanguage: deserializedBlock.language !== undefined,
        hasFilePath: deserializedBlock.filePath !== undefined,
        hasContent: deserializedBlock.content !== undefined,
        language: deserializedBlock.language,
        filePath: deserializedBlock.filePath,
        contentLength: deserializedBlock.content?.length || 0
      });
    }
    
    // Ensure position is set
    deserializedBlock.position = block.position || deserializedBlock.position || 0;
    
    // Debug logging for complex blocks
    if (block.type === 'ai' && deserializedBlock.messages) {
      console.log('🔵 AI Block Load Debug (OptimizedBlockLoader):', {
        blockId: block.id,
        messageCount: deserializedBlock.messages.length,
        hasMessages: true
      });
    }
    
    return deserializedBlock;
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
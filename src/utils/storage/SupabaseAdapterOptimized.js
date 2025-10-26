import { optimizedSupabase, deduplicateRequest } from '../../lib/supabaseOptimized';
import circuitBreakerManager from '../network/CircuitBreaker';

/**
 * Optimized Supabase Storage Adapter
 * Implements batching, caching, and pagination
 */
export class SupabaseAdapterOptimized {
  constructor() {
    this.supabase = optimizedSupabase.getClient();
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
    this.batchQueue = [];
    this.batchTimeout = null;
    this.batchDelay = 50; // 50ms delay for batching
    this.pageSize = 50;
  }

  /**
   * Get cached data if available
   */
  getCached(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.time < this.cacheExpiry) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  /**
   * Set cache data
   */
  setCache(key, data) {
    this.cache.set(key, {
      data,
      time: Date.now()
    });
  }

  /**
   * Clear cache for a specific key pattern
   */
  clearCache(pattern) {
    if (!pattern) {
      this.cache.clear();
      return;
    }
    
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get documents without pagination (backwards compatibility)
   * Returns all documents for the user
   */
  async getDocuments() {
    if (!this.userId) {
      console.error('SupabaseAdapterOptimized: No userId set');
      return [];
    }

    const cacheKey = `docs:${this.userId}:all`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      const { data, error } = await this.supabase
        .from('documents')
        .select('id, title, tags, created_at, updated_at, metadata, is_template, project_id, folder_id, position')
        .eq('user_id', this.userId)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Transform to app format
      const documents = (data || []).map(doc => ({
        id: doc.id,
        title: doc.title,
        preview: doc.metadata?.preview || 'Click to view document...',
        createdAt: doc.created_at,
        updatedAt: doc.updated_at,
        tags: doc.tags || [],
        isTemplate: doc.is_template || false,
        projectId: doc.project_id,
        folder_id: doc.folder_id,
        position: doc.position,
        metadata: doc.metadata || {}
      }));

      this.setCache(cacheKey, documents);
      return documents;
    } catch (error) {
      console.error('Error getting documents:', error);
      return [];
    }
  }

  /**
   * Load all documents with pagination and caching
   */
  async loadAllDocuments(userId, options = {}) {
    const { 
      page = 0, 
      limit = this.pageSize,
      orderBy = 'updated_at',
      ascending = false,
      includeDeleted = false
    } = options;

    const cacheKey = `docs:${userId}:${page}:${limit}:${orderBy}:${ascending}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      const result = await deduplicateRequest(cacheKey, async () => {
        let query = this.supabase
          .from('documents')
          .select('*', { count: 'exact' })
          .eq('user_id', userId)
          .range(page * limit, (page + 1) * limit - 1)
          .order(orderBy, { ascending });

        if (!includeDeleted) {
          query = query.is('deleted_at', null);
        }

        return query;
      });

      if (result.error) throw result.error;

      // Transform to app format
      const documents = (result.data || []).map(doc => ({
        id: doc.id,
        title: doc.title,
        preview: doc.metadata?.preview || 'Click to view document...',
        createdAt: doc.created_at,
        updatedAt: doc.updated_at,
        tags: doc.tags || [],
        isTemplate: doc.is_template || false,
        projectId: doc.project_id,
        folder_id: doc.folder_id,
        position: doc.position,
        metadata: doc.metadata || {}
      }));

      const response = {
        documents,
        totalCount: result.count,
        page,
        pageSize: limit,
        hasMore: (page + 1) * limit < result.count
      };

      this.setCache(cacheKey, response);
      return response;
    } catch (error) {
      console.error('Error loading documents:', error);
      throw error;
    }
  }

  /**
   * Get single document with blocks (alias for loadDocument)
   */
  async getDocument(documentId) {
    return this.loadDocument(documentId);
  }

  /**
   * Delete document
   */
  async deleteDocument(documentId) {
    this.clearCache(`doc:${documentId}`);
    this.clearCache(`docs:`); // Clear all document caches

    try {
      const { error } = await this.supabase
        .from('documents')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', documentId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  /**
   * Get blocks for a document
   */
  async getBlocks(documentId) {
    try {
      const { data, error } = await this.supabase
        .from('blocks')
        .select('*')
        .eq('document_id', documentId)
        .order('position', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting blocks:', error);
      return [];
    }
  }

  /**
   * Invalidate cache for debugging/testing
   */
  invalidateCache() {
    this.cache.clear();
  }

  /**
   * Load document with blocks - optimized query
   */
  async loadDocument(documentId) {
    const cacheKey = `doc:${documentId}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      // Use circuit breaker for resilience
      const breaker = circuitBreakerManager.getBreaker('supabase-read', {
        failureThreshold: 3,
        resetTimeout: 30000,
        timeout: 15000,
        fallback: () => {
          console.warn('Supabase read circuit open - using cached data');
          return null;
        }
      });

      const result = await breaker.execute(async () => {
        return deduplicateRequest(cacheKey, async () => {
          // Single query with joins
          return this.supabase
            .from('documents')
            .select(`
              *,
              blocks (
                id,
                type,
                content,
                position,
                metadata
              )
            `)
            .eq('id', documentId)
            .single();
        });
      });

      if (result?.error) throw result.error;

      if (result?.data) {
        this.setCache(cacheKey, result.data);
        return result.data;
      }
      
      return null;
    } catch (error) {
      console.error('Error loading document:', error);
      throw error;
    }
  }

  /**
   * Save document with intelligent batching
   */
  async saveDocument(document) {
    // MILESTONE 3: Check if Smart Sync is active for this document
    if (document.blocks && window.__smartSyncManagers) {
      const smartSyncManager = window.__smartSyncManagers.get(document.id);
      if (smartSyncManager) {
        console.log('SupabaseAdapterOptimized: Smart Sync is handling blocks for', document.id);
        // Remove blocks from the save operation
        const { blocks, ...documentWithoutBlocks } = document;
        document = { ...documentWithoutBlocks, blocks: undefined };
      }
    }
    
    // Clear relevant caches
    this.clearCache(`doc:${document.id}`);
    this.clearCache(`docs:${document.user_id}`);

    // Add to batch queue
    return new Promise((resolve, reject) => {
      this.batchQueue.push({
        type: 'document',
        data: document,
        resolve,
        reject
      });

      // Clear existing timeout
      if (this.batchTimeout) {
        clearTimeout(this.batchTimeout);
      }

      // Set new timeout for batch execution
      this.batchTimeout = setTimeout(() => {
        this.executeBatch();
      }, this.batchDelay);
    });
  }

  /**
   * Execute batched operations
   */
  async executeBatch() {
    if (this.batchQueue.length === 0) return;

    const batch = this.batchQueue.splice(0, this.batchQueue.length);
    const documentUpdates = batch.filter(op => op.type === 'document');

    // Group by operation type
    if (documentUpdates.length > 0) {
      try {
        // Prepare bulk upsert
        const documents = documentUpdates.map(op => ({
          ...op.data,
          updated_at: new Date().toISOString()
        }));

        // Use circuit breaker for writes
        const breaker = circuitBreakerManager.getBreaker('supabase-write', {
          failureThreshold: 2,
          resetTimeout: 60000,
          timeout: 20000,
          fallback: () => {
            console.warn('Supabase write circuit open - queueing for retry');
            // Queue for later retry
            documents.forEach((doc, index) => {
              this.batchQueue.push(documentUpdates[index]);
            });
            return { error: new Error('Circuit open - queued for retry') };
          }
        });

        const result = await breaker.execute(async () => {
          return this.supabase
            .from('documents')
            .upsert(documents, {
              onConflict: 'id',
              returning: 'minimal'
            });
        });

        const { data, error } = result;
        if (error) throw error;

        // Resolve all promises
        documentUpdates.forEach(op => op.resolve(op.data));
      } catch (error) {
        // Reject all promises
        documentUpdates.forEach(op => op.reject(error));
      }
    }
  }

  /**
   * Search documents with full-text search
   */
  async searchDocuments(userId, query, options = {}) {
    const { limit = 20 } = options;
    const cacheKey = `search:${userId}:${query}:${limit}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      const result = await deduplicateRequest(cacheKey, async () => {
        return this.supabase
          .from('documents')
          .select('id, title, preview, tags, updated_at')
          .eq('user_id', userId)
          .is('deleted_at', null)
          .or(`title.ilike.%${query}%,preview.ilike.%${query}%`)
          .order('updated_at', { ascending: false })
          .limit(limit);
      });

      if (result.error) throw result.error;

      this.setCache(cacheKey, result.data);
      return result.data;
    } catch (error) {
      console.error('Error searching documents:', error);
      throw error;
    }
  }

  /**
   * Bulk operations for blocks
   */
  async saveBlocks(documentId, blocks) {
    const cacheKey = `doc:${documentId}`;
    this.cache.delete(cacheKey);

    try {
      // Delete existing blocks and insert new ones in a transaction
      const { error: deleteError } = await this.supabase
        .from('blocks')
        .delete()
        .eq('document_id', documentId);

      if (deleteError) throw deleteError;

      if (blocks.length > 0) {
        const blocksWithMeta = blocks.map((block, index) => ({
          ...block,
          document_id: documentId,
          position: index,
          created_at: block.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));

        const { error: insertError } = await this.supabase
          .from('blocks')
          .insert(blocksWithMeta);

        if (insertError) throw insertError;
      }

      return blocks;
    } catch (error) {
      console.error('Error saving blocks:', error);
      throw error;
    }
  }

  /**
   * Get user statistics with caching
   */
  async getUserStats(userId) {
    const cacheKey = `stats:${userId}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      const [docsResult, sharedResult, tagsResult] = await Promise.all([
        this.supabase
          .from('documents')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .is('deleted_at', null),
        
        this.supabase
          .from('document_shares')
          .select('id', { count: 'exact', head: true })
          .eq('shared_with_id', userId),
        
        this.supabase
          .from('documents')
          .select('tags')
          .eq('user_id', userId)
          .is('deleted_at', null)
      ]);

      // Extract unique tags
      const allTags = new Set();
      tagsResult.data?.forEach(doc => {
        doc.tags?.forEach(tag => allTags.add(tag));
      });

      const stats = {
        totalDocuments: docsResult.count || 0,
        sharedWithMe: sharedResult.count || 0,
        uniqueTags: allTags.size,
        tags: Array.from(allTags)
      };

      this.setCache(cacheKey, stats);
      return stats;
    } catch (error) {
      console.error('Error getting user stats:', error);
      return {
        totalDocuments: 0,
        sharedWithMe: 0,
        uniqueTags: 0,
        tags: []
      };
    }
  }

  /**
   * Prefetch related data
   */
  async prefetchRelated(documentId) {
    // Prefetch in background without blocking
    setTimeout(async () => {
      try {
        // Prefetch document shares
        await this.supabase
          .from('document_shares')
          .select('*')
          .eq('document_id', documentId);

        // Prefetch share links
        await this.supabase
          .from('share_links')
          .select('*')
          .eq('document_id', documentId);
      } catch (error) {
        // Silent fail for prefetch
        console.debug('Prefetch error:', error);
      }
    }, 100);
  }
}

// Create singleton instance
export const supabaseAdapter = new SupabaseAdapterOptimized();
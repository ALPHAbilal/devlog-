import { supabase } from './optimized-client';
// TODO: Update import after migrating rateLimiter to FSD structure
import { rateLimiter, RateLimitError, handleRateLimitError } from '@/utils/rateLimiter';

/**
 * Supabase client wrapper with automatic rate limiting
 * Wraps common operations to check rate limits before executing
 */
class SupabaseWithRateLimit {
  constructor() {
    this.supabase = supabase;
    
    // Wrap common methods with rate limiting
    this.wrapMethods();
  }

  // Wrap Supabase methods with rate limiting
  wrapMethods() {
    // Store original methods
    const originalFrom = this.supabase.from.bind(this.supabase);
    const originalRpc = this.supabase.rpc.bind(this.supabase);
    const originalStorage = this.supabase.storage;

    // Wrap the 'from' method for database operations
    this.supabase.from = (table) => {
      const tableRef = originalFrom(table);
      const originalSelect = tableRef.select?.bind(tableRef);
      const originalInsert = tableRef.insert?.bind(tableRef);
      const originalUpdate = tableRef.update?.bind(tableRef);
      const originalDelete = tableRef.delete?.bind(tableRef);

      // Wrap each operation with rate limiting
      if (originalSelect) {
        tableRef.select = async (...args) => {
          await rateLimiter.checkRateLimit('documents');
          return originalSelect(...args);
        };
      }

      if (originalInsert) {
        tableRef.insert = async (...args) => {
          await rateLimiter.checkRateLimit('documents');
          return originalInsert(...args);
        };
      }

      if (originalUpdate) {
        tableRef.update = async (...args) => {
          await rateLimiter.checkRateLimit('documents');
          return originalUpdate(...args);
        };
      }

      if (originalDelete) {
        tableRef.delete = async (...args) => {
          await rateLimiter.checkRateLimit('documents');
          return originalDelete(...args);
        };
      }

      return tableRef;
    };

    // Wrap RPC calls
    this.supabase.rpc = async (fn, params) => {
      // Don't rate limit the rate limit check itself
      if (fn === 'check_rate_limit') {
        return originalRpc(fn, params);
      }
      
      await rateLimiter.checkRateLimit('global');
      return originalRpc(fn, params);
    };

    // Wrap storage operations
    if (originalStorage) {
      const originalStorageFrom = originalStorage.from?.bind(originalStorage);
      
      if (originalStorageFrom) {
        this.supabase.storage.from = (bucket) => {
          const bucketRef = originalStorageFrom(bucket);
          const originalUpload = bucketRef.upload?.bind(bucketRef);
          const originalDownload = bucketRef.download?.bind(bucketRef);

          if (originalUpload) {
            bucketRef.upload = async (...args) => {
              await rateLimiter.checkRateLimit('storage');
              return originalUpload(...args);
            };
          }

          if (originalDownload) {
            bucketRef.download = async (...args) => {
              await rateLimiter.checkRateLimit('storage');
              return originalDownload(...args);
            };
          }

          return bucketRef;
        };
      }
    }
  }

  // Helper method to execute with rate limit handling
  async executeWithRateLimit(operation, endpoint = 'global') {
    try {
      return await rateLimiter.withRateLimit(operation, endpoint)();
    } catch (error) {
      if (error instanceof RateLimitError) {
        const errorInfo = handleRateLimitError(error);
        // You can integrate this with your toast system
        console.error('Rate limit exceeded:', errorInfo);
        throw error;
      }
      throw error;
    }
  }
}

// Export the rate-limited Supabase instance
export const supabaseWithRateLimit = new SupabaseWithRateLimit().supabase;
export { RateLimitError, handleRateLimitError, rateLimiter };
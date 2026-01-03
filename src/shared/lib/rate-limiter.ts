import { supabase } from '@/shared/api';

// Rate limiter utility for client-side rate limit checking
class RateLimiter {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 60000; // 1 minute cache
  }

  // Get client IP address (this is a placeholder - in production, you'd get this from the server)
  async getClientIP() {
    try {
      // In a real implementation, this would come from your server
      // For now, we'll use a placeholder that Supabase will replace with the real IP
      return '0.0.0.0';
    } catch (error) {
      console.error('Failed to get client IP:', error);
      return '0.0.0.0';
    }
  }

  // Check if request is allowed
  async checkRateLimit(endpoint = 'global') {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      const userId = user?.id || null;
      const ip = await this.getClientIP();

      // Check cache first
      const cacheKey = `${ip}-${userId}-${endpoint}`;
      const cached = this.cache.get(cacheKey);
      if (cached && cached.expires > Date.now()) {
        if (!cached.allowed) {
          throw new RateLimitError(cached);
        }
        return cached;
      }

      // Call the rate limit function
      const { data, error } = await supabase
        .rpc('check_rate_limit', {
          p_ip_address: ip,
          p_user_id: userId,
          p_endpoint: endpoint
        });

      if (error) {
        console.error('Rate limit check error:', error);
        // On error, allow the request but log it
        return { allowed: true };
      }

      // Cache the result
      const result = {
        ...data,
        expires: Date.now() + (data.allowed ? 5000 : data.retry_after * 1000)
      };
      this.cache.set(cacheKey, result);

      // Clean old cache entries
      if (this.cache.size > 100) {
        this.cleanCache();
      }

      if (!data.allowed) {
        throw new RateLimitError(data);
      }

      return data;
    } catch (error) {
      if (error instanceof RateLimitError) {
        throw error;
      }
      console.error('Rate limit check failed:', error);
      // On error, allow the request
      return { allowed: true };
    }
  }

  // Clean expired cache entries
  cleanCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (value.expires < now) {
        this.cache.delete(key);
      }
    }
  }

  // Wrap a function with rate limiting
  withRateLimit(fn, endpoint = 'global') {
    return async (...args) => {
      await this.checkRateLimit(endpoint);
      return fn(...args);
    };
  }

  // Get rate limit headers for display
  getRateLimitHeaders(result) {
    if (!result) return {};
    
    return {
      'X-RateLimit-Limit': result.user_limit || result.ip_limit || 60,
      'X-RateLimit-Remaining': Math.max(
        0, 
        (result.user_limit || result.ip_limit || 60) - (result.user_requests || result.ip_requests || 0)
      ),
      'X-RateLimit-Reset': new Date(Date.now() + 60000).toISOString(),
      'Retry-After': result.retry_after
    };
  }
}

// Custom error class for rate limit errors
export class RateLimitError extends Error {
  constructor(data) {
    super(data.reason || 'Rate limit exceeded');
    this.name = 'RateLimitError';
    this.reason = data.reason;
    this.blockedUntil = data.blocked_until;
    this.retryAfter = data.retry_after;
  }

  getRetryAfterSeconds() {
    return this.retryAfter || 60;
  }

  getBlockedUntilDate() {
    return this.blockedUntil ? new Date(this.blockedUntil) : new Date(Date.now() + (this.retryAfter || 60) * 1000);
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();

// Helper function to handle rate limit errors in UI
export function handleRateLimitError(error) {
  if (error instanceof RateLimitError) {
    const retryAfter = error.getRetryAfterSeconds();
    const blockedUntil = error.getBlockedUntilDate();
    
    let message = 'Too many requests. ';
    if (retryAfter < 60) {
      message += `Please try again in ${retryAfter} seconds.`;
    } else if (retryAfter < 3600) {
      message += `Please try again in ${Math.ceil(retryAfter / 60)} minutes.`;
    } else {
      message += `Please try again at ${blockedUntil.toLocaleTimeString()}.`;
    }
    
    return {
      title: 'Rate Limit Exceeded',
      message,
      type: 'error',
      duration: 10000
    };
  }
  
  return null;
}
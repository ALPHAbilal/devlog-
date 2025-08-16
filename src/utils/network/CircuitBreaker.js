import eventBus, { EVENT_TYPES } from '../eventBus';

/**
 * Circuit Breaker Pattern
 * 
 * Prevents cascade failures and provides graceful degradation:
 * - Monitors failure rates
 * - Opens circuit when threshold exceeded
 * - Provides fallback behavior
 * - Automatically recovers when service is healthy
 */
class CircuitBreaker {
  constructor(options = {}) {
    this.name = options.name || 'default';
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000; // 1 minute
    this.timeout = options.timeout || 10000; // 10 seconds
    this.volumeThreshold = options.volumeThreshold || 10; // Min requests before opening
    
    // Circuit states
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = null;
    this.nextAttempt = null;
    
    // Request tracking
    this.requestLog = [];
    this.maxLogSize = 100;
    
    // Fallback function
    this.fallback = options.fallback || this.defaultFallback;
    
    // Statistics
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      rejectedRequests: 0,
      timeouts: 0,
      circuitOpens: 0,
      fallbacksExecuted: 0
    };
    
    // Health check
    this.healthCheckInterval = options.healthCheckInterval || 30000; // 30 seconds
    this.startHealthCheck();
  }

  /**
   * Execute function with circuit breaker protection
   */
  async execute(fn, ...args) {
    this.stats.totalRequests++;
    
    // Check circuit state
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        // Circuit is open, use fallback
        return this.executeFallback(args);
      } else {
        // Try half-open state
        this.state = 'HALF_OPEN';
        console.log(`Circuit breaker ${this.name}: Attempting half-open`);
      }
    }
    
    try {
      // Execute with timeout
      const result = await this.executeWithTimeout(fn, args);
      this.onSuccess();
      return result;
      
    } catch (error) {
      this.onFailure(error);
      
      if (this.state === 'OPEN') {
        return this.executeFallback(args);
      }
      
      throw error;
    }
  }

  /**
   * Execute function with timeout
   */
  async executeWithTimeout(fn, args) {
    return new Promise(async (resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.stats.timeouts++;
        reject(new Error(`Circuit breaker timeout after ${this.timeout}ms`));
      }, this.timeout);
      
      try {
        const result = await fn(...args);
        clearTimeout(timeoutId);
        resolve(result);
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  /**
   * Handle successful request
   */
  onSuccess() {
    this.failures = 0;
    this.successes++;
    this.stats.successfulRequests++;
    
    // Log request
    this.logRequest(true);
    
    if (this.state === 'HALF_OPEN') {
      // Circuit can be closed
      this.state = 'CLOSED';
      console.log(`Circuit breaker ${this.name}: Closed after successful half-open test`);
      
      eventBus.emit(EVENT_TYPES.CIRCUIT_CLOSED, {
        name: this.name,
        successes: this.successes
      });
    }
  }

  /**
   * Handle failed request
   */
  onFailure(error) {
    this.failures++;
    this.successes = 0;
    this.lastFailureTime = Date.now();
    this.stats.failedRequests++;
    
    // Log request
    this.logRequest(false, error);
    
    console.error(`Circuit breaker ${this.name} failure:`, error.message);
    
    // Check if we should open the circuit
    if (this.shouldOpen()) {
      this.open();
    }
  }

  /**
   * Check if circuit should open
   */
  shouldOpen() {
    const recentRequests = this.getRecentRequests();
    const totalRecent = recentRequests.length;
    
    // Need minimum volume
    if (totalRecent < this.volumeThreshold) {
      return false;
    }
    
    // Check failure rate
    const recentFailures = recentRequests.filter(r => !r.success).length;
    const failureRate = recentFailures / totalRecent;
    
    return this.failures >= this.failureThreshold || failureRate > 0.5;
  }

  /**
   * Open the circuit
   */
  open() {
    this.state = 'OPEN';
    this.nextAttempt = Date.now() + this.resetTimeout;
    this.stats.circuitOpens++;
    
    console.warn(`Circuit breaker ${this.name}: OPEN - will retry at ${new Date(this.nextAttempt).toLocaleTimeString()}`);
    
    eventBus.emit(EVENT_TYPES.CIRCUIT_OPENED, {
      name: this.name,
      failures: this.failures,
      nextAttempt: this.nextAttempt
    });
  }

  /**
   * Execute fallback
   */
  async executeFallback(args) {
    this.stats.rejectedRequests++;
    this.stats.fallbacksExecuted++;
    
    eventBus.emit(EVENT_TYPES.CIRCUIT_FALLBACK, {
      name: this.name,
      state: this.state
    });
    
    return this.fallback(...args);
  }

  /**
   * Default fallback function
   */
  defaultFallback() {
    throw new Error(`Circuit breaker ${this.name} is OPEN - service unavailable`);
  }

  /**
   * Log request for statistics
   */
  logRequest(success, error = null) {
    const entry = {
      timestamp: Date.now(),
      success,
      error: error ? error.message : null,
      state: this.state
    };
    
    this.requestLog.push(entry);
    
    // Keep log size manageable
    if (this.requestLog.length > this.maxLogSize) {
      this.requestLog.shift();
    }
  }

  /**
   * Get recent requests for analysis
   */
  getRecentRequests(timeWindow = 60000) {
    const cutoff = Date.now() - timeWindow;
    return this.requestLog.filter(r => r.timestamp > cutoff);
  }

  /**
   * Get circuit state
   */
  getState() {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailureTime: this.lastFailureTime,
      nextAttempt: this.nextAttempt,
      stats: this.stats
    };
  }

  /**
   * Get health metrics
   */
  getHealth() {
    const recentRequests = this.getRecentRequests();
    const totalRecent = recentRequests.length;
    
    if (totalRecent === 0) {
      return {
        healthy: true,
        rate: 0,
        volume: 0
      };
    }
    
    const recentSuccesses = recentRequests.filter(r => r.success).length;
    const successRate = recentSuccesses / totalRecent;
    
    return {
      healthy: this.state === 'CLOSED' && successRate > 0.8,
      rate: successRate,
      volume: totalRecent,
      state: this.state
    };
  }

  /**
   * Force circuit to close (for manual recovery)
   */
  close() {
    this.state = 'CLOSED';
    this.failures = 0;
    this.nextAttempt = null;
    
    console.log(`Circuit breaker ${this.name}: Manually closed`);
    
    eventBus.emit(EVENT_TYPES.CIRCUIT_CLOSED, {
      name: this.name,
      manual: true
    });
  }

  /**
   * Force circuit to open (for manual intervention)
   */
  forceOpen() {
    this.open();
  }

  /**
   * Start health check
   */
  startHealthCheck() {
    setInterval(() => {
      const health = this.getHealth();
      
      if (!health.healthy && this.state === 'CLOSED') {
        console.warn(`Circuit breaker ${this.name}: Unhealthy but closed - monitoring`);
      }
      
      // Emit health status
      eventBus.emit(EVENT_TYPES.CIRCUIT_HEALTH, {
        name: this.name,
        health
      });
    }, this.healthCheckInterval);
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      rejectedRequests: 0,
      timeouts: 0,
      circuitOpens: 0,
      fallbacksExecuted: 0
    };
    this.requestLog = [];
  }
}

/**
 * Circuit Breaker Manager
 * Manages multiple circuit breakers for different services
 */
class CircuitBreakerManager {
  constructor() {
    this.breakers = new Map();
  }

  /**
   * Get or create circuit breaker
   */
  getBreaker(name, options = {}) {
    if (!this.breakers.has(name)) {
      const breaker = new CircuitBreaker({ name, ...options });
      this.breakers.set(name, breaker);
    }
    return this.breakers.get(name);
  }

  /**
   * Execute with circuit breaker
   */
  async execute(name, fn, options = {}) {
    const breaker = this.getBreaker(name, options);
    return breaker.execute(fn);
  }

  /**
   * Get all breakers status
   */
  getAllStatus() {
    const status = {};
    for (const [name, breaker] of this.breakers) {
      status[name] = breaker.getState();
    }
    return status;
  }

  /**
   * Get all health metrics
   */
  getAllHealth() {
    const health = {};
    for (const [name, breaker] of this.breakers) {
      health[name] = breaker.getHealth();
    }
    return health;
  }

  /**
   * Close all circuits
   */
  closeAll() {
    for (const breaker of this.breakers.values()) {
      breaker.close();
    }
  }
}

// Circuit breaker event types
export const CIRCUIT_EVENTS = {
  CIRCUIT_OPENED: 'circuit:opened',
  CIRCUIT_CLOSED: 'circuit:closed',
  CIRCUIT_FALLBACK: 'circuit:fallback',
  CIRCUIT_HEALTH: 'circuit:health'
};

// Add to main event types
Object.assign(EVENT_TYPES, CIRCUIT_EVENTS);

// Export singleton manager
const circuitBreakerManager = new CircuitBreakerManager();

// Export both the manager and the class
export { CircuitBreaker, circuitBreakerManager };
export default circuitBreakerManager;
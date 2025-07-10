import eventBus, { EVENT_TYPES } from '../eventBus';

/**
 * Distributed Lock Manager
 * 
 * Prevents race conditions and data corruption by:
 * - Tab synchronization using BroadcastChannel
 * - Operation queuing and serialization
 * - Optimistic locking for concurrent edits
 * - Automatic conflict resolution
 */
class LockManager {
  constructor() {
    this.locks = new Map(); // resourceId -> lock info
    this.lockQueue = new Map(); // resourceId -> queue of waiting operations
    this.tabId = this.generateTabId();
    this.channel = null;
    this.lockTimeout = 30000; // 30 seconds default lock timeout
    this.deadlockTimeout = 60000; // 1 minute deadlock detection
    
    // Lock statistics
    this.stats = {
      acquired: 0,
      released: 0,
      conflicts: 0,
      timeouts: 0,
      deadlocks: 0
    };
    
    this.initializeBroadcastChannel();
    this.startDeadlockDetection();
  }

  /**
   * Generate unique tab ID
   */
  generateTabId() {
    return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Initialize BroadcastChannel for cross-tab communication
   */
  initializeBroadcastChannel() {
    if (typeof BroadcastChannel === 'undefined') {
      console.warn('BroadcastChannel not supported, using fallback');
      this.useFallbackChannel();
      return;
    }

    try {
      this.channel = new BroadcastChannel('devlog_locks');
      
      this.channel.onmessage = (event) => {
        this.handleChannelMessage(event.data);
      };
      
      // Announce this tab
      this.broadcastMessage({
        type: 'TAB_INIT',
        tabId: this.tabId,
        timestamp: Date.now()
      });
      
      // Clean up on tab close
      window.addEventListener('beforeunload', () => {
        this.releaseAllLocks();
        this.broadcastMessage({
          type: 'TAB_CLOSE',
          tabId: this.tabId
        });
      });
      
    } catch (error) {
      console.error('Failed to initialize BroadcastChannel:', error);
      this.useFallbackChannel();
    }
  }

  /**
   * Fallback channel using localStorage events
   */
  useFallbackChannel() {
    // Use storage events as fallback
    window.addEventListener('storage', (event) => {
      if (event.key === 'devlog_lock_message') {
        try {
          const data = JSON.parse(event.newValue);
          if (data.tabId !== this.tabId) {
            this.handleChannelMessage(data);
          }
        } catch (error) {
          console.error('Failed to parse lock message:', error);
        }
      }
    });
  }

  /**
   * Broadcast message to other tabs
   */
  broadcastMessage(message) {
    const fullMessage = {
      ...message,
      tabId: this.tabId,
      timestamp: Date.now()
    };

    if (this.channel) {
      this.channel.postMessage(fullMessage);
    } else {
      // Fallback to localStorage
      localStorage.setItem('devlog_lock_message', JSON.stringify(fullMessage));
      // Clean up after a short delay
      setTimeout(() => {
        localStorage.removeItem('devlog_lock_message');
      }, 100);
    }
  }

  /**
   * Handle messages from other tabs
   */
  handleChannelMessage(message) {
    switch (message.type) {
      case 'LOCK_REQUEST':
        this.handleRemoteLockRequest(message);
        break;
        
      case 'LOCK_RELEASE':
        this.handleRemoteLockRelease(message);
        break;
        
      case 'LOCK_GRANT':
        this.handleLockGrant(message);
        break;
        
      case 'TAB_CLOSE':
        this.handleTabClose(message);
        break;
        
      case 'CONFLICT_DETECTED':
        this.handleConflict(message);
        break;
    }
  }

  /**
   * Acquire lock for a resource
   */
  async acquireLock(resourceId, options = {}) {
    const lockInfo = {
      resourceId,
      tabId: this.tabId,
      acquiredAt: Date.now(),
      timeout: options.timeout || this.lockTimeout,
      priority: options.priority || 0,
      metadata: options.metadata || {}
    };

    // Check if we already own the lock
    const existingLock = this.locks.get(resourceId);
    if (existingLock && existingLock.tabId === this.tabId) {
      // Extend lock timeout
      existingLock.acquiredAt = Date.now();
      return { success: true, lock: existingLock };
    }

    // Check for conflicts
    if (existingLock) {
      this.stats.conflicts++;
      
      // Queue the request if needed
      if (options.queue !== false) {
        return this.queueLockRequest(resourceId, lockInfo);
      }
      
      return { 
        success: false, 
        reason: 'LOCKED', 
        owner: existingLock.tabId,
        canRetry: true 
      };
    }

    // Try to acquire the lock
    this.locks.set(resourceId, lockInfo);
    this.stats.acquired++;

    // Broadcast lock acquisition
    this.broadcastMessage({
      type: 'LOCK_REQUEST',
      resourceId,
      lockInfo
    });

    // Set timeout for automatic release
    this.setLockTimeout(resourceId, lockInfo.timeout);

    // Wait for potential conflicts
    await this.waitForConflicts(resourceId, 100);

    // Check if lock is still ours (no conflicts)
    const currentLock = this.locks.get(resourceId);
    if (currentLock && currentLock.tabId === this.tabId) {
      eventBus.emit(EVENT_TYPES.LOCK_ACQUIRED, { resourceId, tabId: this.tabId });
      return { success: true, lock: lockInfo };
    }

    // Lock was taken by another tab
    return { 
      success: false, 
      reason: 'CONFLICT', 
      canRetry: true 
    };
  }

  /**
   * Release lock
   */
  releaseLock(resourceId) {
    const lock = this.locks.get(resourceId);
    if (!lock || lock.tabId !== this.tabId) {
      return false;
    }

    this.locks.delete(resourceId);
    this.stats.released++;

    // Clear timeout
    if (lock.timeoutId) {
      clearTimeout(lock.timeoutId);
    }

    // Broadcast release
    this.broadcastMessage({
      type: 'LOCK_RELEASE',
      resourceId
    });

    // Process queued requests
    this.processQueue(resourceId);

    eventBus.emit(EVENT_TYPES.LOCK_RELEASED, { resourceId, tabId: this.tabId });
    return true;
  }

  /**
   * Queue lock request
   */
  queueLockRequest(resourceId, lockInfo) {
    if (!this.lockQueue.has(resourceId)) {
      this.lockQueue.set(resourceId, []);
    }

    const queue = this.lockQueue.get(resourceId);
    const promise = new Promise((resolve, reject) => {
      const request = {
        ...lockInfo,
        resolve,
        reject,
        queuedAt: Date.now()
      };

      // Insert based on priority
      const insertIndex = queue.findIndex(item => item.priority < lockInfo.priority);
      if (insertIndex === -1) {
        queue.push(request);
      } else {
        queue.splice(insertIndex, 0, request);
      }

      // Set timeout for queued request
      setTimeout(() => {
        const index = queue.indexOf(request);
        if (index !== -1) {
          queue.splice(index, 1);
          reject(new Error('Lock request timeout'));
        }
      }, lockInfo.timeout);
    });

    return promise;
  }

  /**
   * Process queued lock requests
   */
  processQueue(resourceId) {
    const queue = this.lockQueue.get(resourceId);
    if (!queue || queue.length === 0) return;

    const nextRequest = queue.shift();
    if (queue.length === 0) {
      this.lockQueue.delete(resourceId);
    }

    // Try to acquire lock for queued request
    this.acquireLock(resourceId, {
      ...nextRequest,
      queue: false
    }).then(result => {
      nextRequest.resolve(result);
    }).catch(error => {
      nextRequest.reject(error);
    });
  }

  /**
   * Set lock timeout
   */
  setLockTimeout(resourceId, timeout) {
    const lock = this.locks.get(resourceId);
    if (!lock) return;

    lock.timeoutId = setTimeout(() => {
      console.warn(`Lock timeout for resource: ${resourceId}`);
      this.stats.timeouts++;
      this.releaseLock(resourceId);
    }, timeout);
  }

  /**
   * Wait for potential conflicts
   */
  waitForConflicts(resourceId, delay) {
    return new Promise(resolve => {
      setTimeout(() => resolve(), delay);
    });
  }

  /**
   * Handle remote lock request
   */
  handleRemoteLockRequest(message) {
    const { resourceId, lockInfo } = message;
    const existingLock = this.locks.get(resourceId);

    if (existingLock) {
      // Conflict resolution based on timestamp and priority
      const shouldYield = this.shouldYieldLock(existingLock, lockInfo);
      
      if (shouldYield) {
        // Release our lock and grant to requester
        this.releaseLock(resourceId);
        this.broadcastMessage({
          type: 'LOCK_GRANT',
          resourceId,
          grantedTo: lockInfo.tabId
        });
      } else {
        // Notify conflict
        this.broadcastMessage({
          type: 'CONFLICT_DETECTED',
          resourceId,
          existingLock,
          requestedLock: lockInfo
        });
      }
    }
  }

  /**
   * Determine if lock should be yielded
   */
  shouldYieldLock(existingLock, requestedLock) {
    // Higher priority wins
    if (requestedLock.priority > existingLock.priority) {
      return true;
    }
    
    // Equal priority: earlier timestamp wins
    if (requestedLock.priority === existingLock.priority) {
      return requestedLock.acquiredAt < existingLock.acquiredAt;
    }
    
    return false;
  }

  /**
   * Handle remote lock release
   */
  handleRemoteLockRelease(message) {
    const { resourceId, tabId } = message;
    const lock = this.locks.get(resourceId);
    
    if (lock && lock.tabId === tabId) {
      this.locks.delete(resourceId);
      this.processQueue(resourceId);
    }
  }

  /**
   * Handle tab close
   */
  handleTabClose(message) {
    const { tabId } = message;
    
    // Release all locks owned by closed tab
    for (const [resourceId, lock] of this.locks) {
      if (lock.tabId === tabId) {
        this.locks.delete(resourceId);
        this.processQueue(resourceId);
      }
    }
  }

  /**
   * Start deadlock detection
   */
  startDeadlockDetection() {
    setInterval(() => {
      this.detectDeadlocks();
    }, this.deadlockTimeout);
  }

  /**
   * Detect and resolve deadlocks
   */
  detectDeadlocks() {
    const now = Date.now();
    const staleThreshold = this.deadlockTimeout;

    for (const [resourceId, lock] of this.locks) {
      if (now - lock.acquiredAt > staleThreshold) {
        console.warn(`Possible deadlock detected for resource: ${resourceId}`);
        this.stats.deadlocks++;
        
        // Force release stale lock
        this.releaseLock(resourceId);
        
        eventBus.emit(EVENT_TYPES.DEADLOCK_DETECTED, {
          resourceId,
          lock,
          age: now - lock.acquiredAt
        });
      }
    }
  }

  /**
   * Release all locks owned by this tab
   */
  releaseAllLocks() {
    const ownedLocks = Array.from(this.locks.entries())
      .filter(([_, lock]) => lock.tabId === this.tabId);
      
    for (const [resourceId] of ownedLocks) {
      this.releaseLock(resourceId);
    }
  }

  /**
   * Get lock statistics
   */
  getStats() {
    return {
      ...this.stats,
      currentLocks: this.locks.size,
      queuedRequests: Array.from(this.lockQueue.values())
        .reduce((sum, queue) => sum + queue.length, 0)
    };
  }

  /**
   * With lock helper - automatically acquire and release
   */
  async withLock(resourceId, callback, options = {}) {
    const lockResult = await this.acquireLock(resourceId, options);
    
    if (!lockResult.success) {
      throw new Error(`Failed to acquire lock: ${lockResult.reason}`);
    }

    try {
      const result = await callback();
      return result;
    } finally {
      this.releaseLock(resourceId);
    }
  }
}

// Lock event types
export const LOCK_EVENTS = {
  LOCK_ACQUIRED: 'lock:acquired',
  LOCK_RELEASED: 'lock:released',
  LOCK_CONFLICT: 'lock:conflict',
  DEADLOCK_DETECTED: 'lock:deadlock'
};

// Add to main event types
Object.assign(EVENT_TYPES, LOCK_EVENTS);

// Export singleton instance
const lockManager = new LockManager();

export default lockManager;
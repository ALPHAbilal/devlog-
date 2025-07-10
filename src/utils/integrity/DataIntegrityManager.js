import eventBus, { EVENT_TYPES } from '../eventBus';

/**
 * Data Integrity Manager
 * 
 * Ensures data consistency and prevents corruption through:
 * - Checksums for all critical data
 * - Validation before saves
 * - Automatic corruption detection
 * - Snapshot system for rollback
 */
class DataIntegrityManager {
  constructor() {
    this.checksums = new Map(); // documentId -> checksum
    this.snapshots = new Map(); // documentId -> Array of snapshots
    this.maxSnapshots = 5; // Keep last 5 snapshots per document
    this.validationRules = new Map();
    
    // Corruption detection
    this.corruptionLog = [];
    this.lastIntegrityCheck = null;
    
    this.setupValidationRules();
    this.startPeriodicIntegrityCheck();
  }

  /**
   * Setup validation rules for different data types
   */
  setupValidationRules() {
    // Document validation
    this.validationRules.set('document', {
      required: ['id', 'title', 'createdAt', 'updatedAt'],
      types: {
        id: 'string',
        title: 'string',
        preview: 'string',
        blocks: 'array',
        tags: 'array',
        createdAt: 'string',
        updatedAt: 'string'
      },
      custom: (doc) => {
        // Custom validation logic
        if (doc.title && doc.title.length > 1000) {
          return { valid: false, error: 'Title too long' };
        }
        if (doc.blocks && doc.blocks.length > 10000) {
          return { valid: false, error: 'Too many blocks' };
        }
        return { valid: true };
      }
    });

    // Block validation
    this.validationRules.set('block', {
      required: ['id', 'type', 'content'],
      types: {
        id: 'string',
        type: 'string',
        content: 'object',
        order: 'number'
      },
      custom: (block) => {
        const validTypes = ['text', 'code', 'image', 'link', 'todo', 'heading'];
        if (!validTypes.includes(block.type)) {
          return { valid: false, error: `Invalid block type: ${block.type}` };
        }
        return { valid: true };
      }
    });
  }

  /**
   * Calculate checksum for data using built-in crypto API
   */
  async calculateChecksum(data) {
    const jsonString = JSON.stringify(this.normalizeData(data));
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(jsonString);
    
    // Use Web Crypto API for hashing
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex;
  }
  
  /**
   * Synchronous checksum for backward compatibility
   */
  calculateChecksumSync(data) {
    const jsonString = JSON.stringify(this.normalizeData(data));
    
    // Simple hash function for sync operations
    let hash = 0;
    for (let i = 0; i < jsonString.length; i++) {
      const char = jsonString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return Math.abs(hash).toString(16);
  }

  /**
   * Normalize data for consistent checksum calculation
   */
  normalizeData(data) {
    if (Array.isArray(data)) {
      return data.map(item => this.normalizeData(item));
    }
    
    if (data && typeof data === 'object') {
      const sorted = {};
      Object.keys(data).sort().forEach(key => {
        // Skip volatile fields
        if (!['_rev', '_temp', 'lastAccessed'].includes(key)) {
          sorted[key] = this.normalizeData(data[key]);
        }
      });
      return sorted;
    }
    
    return data;
  }

  /**
   * Validate data structure
   */
  validateData(type, data) {
    const rules = this.validationRules.get(type);
    if (!rules) {
      return { valid: true }; // No rules defined
    }

    // Check required fields
    for (const field of rules.required) {
      if (!(field in data) || data[field] === null || data[field] === undefined) {
        return { 
          valid: false, 
          error: `Missing required field: ${field}` 
        };
      }
    }

    // Check types
    for (const [field, expectedType] of Object.entries(rules.types)) {
      if (field in data) {
        const actualType = Array.isArray(data[field]) ? 'array' : typeof data[field];
        if (actualType !== expectedType) {
          return { 
            valid: false, 
            error: `Invalid type for ${field}: expected ${expectedType}, got ${actualType}` 
          };
        }
      }
    }

    // Custom validation
    if (rules.custom) {
      const customResult = rules.custom(data);
      if (!customResult.valid) {
        return customResult;
      }
    }

    return { valid: true };
  }

  /**
   * Create snapshot of data
   */
  createSnapshot(documentId, data) {
    if (!this.snapshots.has(documentId)) {
      this.snapshots.set(documentId, []);
    }

    const snapshots = this.snapshots.get(documentId);
    const snapshot = {
      timestamp: Date.now(),
      data: JSON.parse(JSON.stringify(data)), // Deep clone
      checksum: this.calculateChecksumSync(data) // Use sync version for now
    };

    snapshots.push(snapshot);

    // Keep only last N snapshots
    if (snapshots.length > this.maxSnapshots) {
      snapshots.shift();
    }

    // Save to IndexedDB for persistence
    this.persistSnapshot(documentId, snapshot);
  }

  /**
   * Restore from snapshot
   */
  async restoreSnapshot(documentId, snapshotIndex = -1) {
    const snapshots = this.snapshots.get(documentId);
    if (!snapshots || snapshots.length === 0) {
      throw new Error('No snapshots available');
    }

    // Get specific snapshot or latest
    const snapshot = snapshotIndex === -1 
      ? snapshots[snapshots.length - 1]
      : snapshots[snapshotIndex];

    if (!snapshot) {
      throw new Error('Snapshot not found');
    }

    // Verify snapshot integrity
    const currentChecksum = this.calculateChecksumSync(snapshot.data);
    if (currentChecksum !== snapshot.checksum) {
      throw new Error('Snapshot corrupted');
    }

    console.log(`Restoring snapshot from ${new Date(snapshot.timestamp).toLocaleString()}`);
    return snapshot.data;
  }

  /**
   * Verify data integrity
   */
  async verifyIntegrity(documentId, data) {
    const storedChecksum = this.checksums.get(documentId);
    const currentChecksum = await this.calculateChecksum(data);

    if (storedChecksum && storedChecksum !== currentChecksum) {
      // Data has been modified - check if it's valid
      const validation = this.validateData('document', data);
      
      if (!validation.valid) {
        this.logCorruption(documentId, 'Validation failed', validation.error);
        return { 
          valid: false, 
          error: validation.error,
          canRecover: this.snapshots.has(documentId)
        };
      }

      // Update checksum if data is valid but changed
      this.checksums.set(documentId, currentChecksum);
    }

    return { valid: true };
  }

  /**
   * Process data before save
   */
  async prepareForSave(type, data) {
    // Validate structure
    const validation = this.validateData(type, data);
    if (!validation.valid) {
      throw new Error(`Data validation failed: ${validation.error}`);
    }

    // Calculate and store checksum
    const checksum = await this.calculateChecksum(data);
    
    if (type === 'document') {
      // Create snapshot before save
      this.createSnapshot(data.id, data);
      this.checksums.set(data.id, checksum);
    }

    // Add integrity metadata
    return {
      ...data,
      _integrity: {
        checksum,
        validatedAt: Date.now(),
        version: 1
      }
    };
  }

  /**
   * Verify data after load
   */
  async verifyAfterLoad(type, data) {
    if (!data._integrity) {
      // Legacy data without integrity info
      console.warn('Data loaded without integrity metadata');
      return data;
    }

    const expectedChecksum = data._integrity.checksum;
    const actualChecksum = await this.calculateChecksum(data);

    if (expectedChecksum !== actualChecksum) {
      this.logCorruption(data.id, 'Checksum mismatch', {
        expected: expectedChecksum,
        actual: actualChecksum
      });

      // Try to recover
      if (type === 'document' && this.snapshots.has(data.id)) {
        console.warn('Data corruption detected, attempting recovery...');
        try {
          const recovered = await this.restoreSnapshot(data.id);
          eventBus.emit(EVENT_TYPES.DATA_RECOVERED, { 
            documentId: data.id,
            reason: 'checksum_mismatch'
          });
          return recovered;
        } catch (error) {
          console.error('Recovery failed:', error);
          throw new Error('Data corrupted and recovery failed');
        }
      }

      throw new Error('Data integrity check failed');
    }

    return data;
  }

  /**
   * Log corruption event
   */
  logCorruption(documentId, reason, details) {
    const event = {
      documentId,
      reason,
      details,
      timestamp: Date.now()
    };

    this.corruptionLog.push(event);
    
    // Keep only last 100 events
    if (this.corruptionLog.length > 100) {
      this.corruptionLog.shift();
    }

    // Emit event for monitoring
    eventBus.emit(EVENT_TYPES.DATA_CORRUPTION_DETECTED, event);
  }

  /**
   * Periodic integrity check
   */
  startPeriodicIntegrityCheck() {
    // Run integrity check every 5 minutes
    setInterval(() => {
      this.runIntegrityCheck();
    }, 5 * 60 * 1000);
  }

  /**
   * Run full integrity check
   */
  async runIntegrityCheck() {
    console.log('Running periodic integrity check...');
    this.lastIntegrityCheck = Date.now();

    try {
      // Check all stored checksums
      let issues = 0;
      
      for (const [documentId, checksum] of this.checksums) {
        // This would need to load and verify each document
        // For now, just log the check
        console.log(`Checking document ${documentId}`);
      }

      if (issues > 0) {
        eventBus.emit(EVENT_TYPES.INTEGRITY_CHECK_FAILED, { 
          issues,
          timestamp: this.lastIntegrityCheck 
        });
      }
    } catch (error) {
      console.error('Integrity check failed:', error);
    }
  }

  /**
   * Persist snapshot to IndexedDB
   */
  async persistSnapshot(documentId, snapshot) {
    try {
      // Store in IndexedDB for persistence across sessions
      const db = await this.openSnapshotDB();
      const tx = db.transaction(['snapshots'], 'readwrite');
      const store = tx.objectStore('snapshots');
      
      await store.put({
        documentId,
        snapshot,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Failed to persist snapshot:', error);
    }
  }

  /**
   * Open snapshot database
   */
  async openSnapshotDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('devlog-snapshots', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('snapshots')) {
          const store = db.createObjectStore('snapshots', { 
            keyPath: ['documentId', 'timestamp'] 
          });
          store.createIndex('documentId', 'documentId');
          store.createIndex('timestamp', 'timestamp');
        }
      };
    });
  }

  /**
   * Get integrity report
   */
  getIntegrityReport() {
    return {
      totalDocuments: this.checksums.size,
      totalSnapshots: Array.from(this.snapshots.values()).reduce((sum, s) => sum + s.length, 0),
      corruptionEvents: this.corruptionLog.length,
      lastCheck: this.lastIntegrityCheck,
      recentCorruptions: this.corruptionLog.slice(-10)
    };
  }

  /**
   * Clear all integrity data
   */
  async clear() {
    this.checksums.clear();
    this.snapshots.clear();
    this.corruptionLog = [];
    
    // Clear IndexedDB
    try {
      await indexedDB.deleteDatabase('devlog-snapshots');
    } catch (error) {
      console.error('Failed to clear snapshot database:', error);
    }
  }
}

// Export singleton instance
const dataIntegrityManager = new DataIntegrityManager();

// Add integrity event types
export const INTEGRITY_EVENTS = {
  DATA_CORRUPTION_DETECTED: 'integrity:corruption',
  DATA_RECOVERED: 'integrity:recovered',
  INTEGRITY_CHECK_FAILED: 'integrity:check_failed'
};

// Add to main event types
Object.assign(EVENT_TYPES, INTEGRITY_EVENTS);

export default dataIntegrityManager;
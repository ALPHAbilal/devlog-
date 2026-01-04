import eventBus, { EVENT_TYPES } from '../events/event-bus';
import dataIntegrityManager from '../integrity/data-integrity';
import transactionManager from '../transactions/transaction-manager';
import lockManager from '../locking/lock-manager';
import storageWrapper from '../storage/wrapper';

/**
 * Recovery Manager
 * 
 * Handles crash recovery and data restoration:
 * - Automatic state recovery
 * - Data reconstruction from partial saves
 * - User-friendly recovery UI
 * - Backup restoration
 */
class RecoveryManager {
  constructor() {
    this.recoveryInProgress = false;
    this.lastRecoveryTime = null;
    this.recoveryAttempts = 0;
    this.maxRecoveryAttempts = 3;
    
    // Recovery strategies
    this.strategies = new Map();
    this.setupDefaultStrategies();
    
    // Recovery log
    this.recoveryLog = [];
    this.maxLogSize = 50;
    
    // Auto-save state
    this.autoSaveInterval = 30000; // 30 seconds
    this.lastAutoSave = null;
    
    this.initializeRecovery();
  }

  /**
   * Initialize recovery system
   */
  initializeRecovery() {
    // Check for crash on startup
    this.checkForCrash();
    
    // Start auto-save
    this.startAutoSave();
    
    // Listen for critical events
    this.setupEventListeners();
    
    // Register with window error handler
    this.registerGlobalErrorHandler();
  }

  /**
   * Setup default recovery strategies
   */
  setupDefaultStrategies() {
    // Document recovery
    this.strategies.set('document', {
      name: 'Document Recovery',
      detect: async () => {
        const unsaved = localStorage.getItem('unsaved_documents');
        return unsaved ? JSON.parse(unsaved) : null;
      },
      recover: async (data) => {
        const recovered = [];
        for (const doc of data) {
          try {
            await storageWrapper.saveDocument(doc);
            recovered.push(doc.id);
          } catch (error) {
            console.error(`Failed to recover document ${doc.id}:`, error);
          }
        }
        return recovered;
      },
      cleanup: () => {
        localStorage.removeItem('unsaved_documents');
      }
    });

    // Session recovery
    this.strategies.set('session', {
      name: 'Session Recovery',
      detect: async () => {
        const session = sessionStorage.getItem('active_session');
        return session ? JSON.parse(session) : null;
      },
      recover: async (data) => {
        // Restore session state
        if (data.currentDocument) {
          sessionStorage.setItem('currentDocument', JSON.stringify(data.currentDocument));
        }
        if (data.scrollPositions) {
          sessionStorage.setItem('scrollPositions', JSON.stringify(data.scrollPositions));
        }
        return data;
      },
      cleanup: () => {
        sessionStorage.removeItem('active_session');
      }
    });

    // Transaction recovery
    this.strategies.set('transaction', {
      name: 'Transaction Recovery',
      detect: async () => {
        const pendingTxns = localStorage.getItem('pending_transactions');
        return pendingTxns ? JSON.parse(pendingTxns) : null;
      },
      recover: async (data) => {
        const recovered = [];
        for (const txn of data) {
          try {
            // Attempt to rollback incomplete transactions
            await transactionManager.rollback(txn.id);
            recovered.push(txn.id);
          } catch (error) {
            console.error(`Failed to rollback transaction ${txn.id}:`, error);
          }
        }
        return recovered;
      },
      cleanup: () => {
        localStorage.removeItem('pending_transactions');
      }
    });

    // Lock recovery
    this.strategies.set('locks', {
      name: 'Lock Recovery',
      detect: async () => {
        const staleLocks = localStorage.getItem('active_locks');
        return staleLocks ? JSON.parse(staleLocks) : null;
      },
      recover: async (data) => {
        // Release all stale locks
        for (const lockId of data) {
          lockManager.releaseLock(lockId);
        }
        return data;
      },
      cleanup: () => {
        localStorage.removeItem('active_locks');
      }
    });
  }

  /**
   * Check for crash on startup
   */
  async checkForCrash() {
    const lastShutdown = localStorage.getItem('last_shutdown');
    const wasClean = localStorage.getItem('clean_shutdown') === 'true';
    
    if (lastShutdown && !wasClean) {
      console.warn('Detected unclean shutdown, initiating recovery...');
      
      // Mark as crash
      this.logRecoveryEvent('crash_detected', {
        lastShutdown: new Date(parseInt(lastShutdown)),
        currentTime: new Date()
      });
      
      // Attempt recovery
      await this.performRecovery();
    }
    
    // Set clean shutdown flag to false (will be set to true on clean exit)
    localStorage.setItem('clean_shutdown', 'false');
    localStorage.setItem('last_shutdown', Date.now().toString());
  }

  /**
   * Perform recovery
   */
  async performRecovery() {
    if (this.recoveryInProgress) {
      console.warn('Recovery already in progress');
      return;
    }
    
    this.recoveryInProgress = true;
    this.recoveryAttempts++;
    
    const recoveryReport = {
      timestamp: Date.now(),
      strategies: {},
      success: true
    };
    
    try {
      console.log('Starting recovery process...');
      
      // Run all recovery strategies
      for (const [name, strategy] of this.strategies) {
        try {
          console.log(`Running ${strategy.name}...`);
          
          // Detect if recovery is needed
          const data = await strategy.detect();
          if (data) {
            // Perform recovery
            const result = await strategy.recover(data);
            recoveryReport.strategies[name] = {
              success: true,
              recovered: result
            };
            
            // Cleanup
            strategy.cleanup();
          } else {
            recoveryReport.strategies[name] = {
              success: true,
              recovered: null
            };
          }
        } catch (error) {
          console.error(`Recovery strategy ${name} failed:`, error);
          recoveryReport.strategies[name] = {
            success: false,
            error: error.message
          };
          recoveryReport.success = false;
        }
      }
      
      // Run integrity check
      await this.performIntegrityCheck();
      
      // Log recovery
      this.lastRecoveryTime = Date.now();
      this.logRecoveryEvent('recovery_completed', recoveryReport);
      
      // Emit recovery complete event
      eventBus.emit(EVENT_TYPES.RECOVERY_COMPLETED, recoveryReport);
      
    } catch (error) {
      console.error('Recovery failed:', error);
      recoveryReport.success = false;
      recoveryReport.error = error.message;
      
      this.logRecoveryEvent('recovery_failed', recoveryReport);
      
      // Check if we should retry
      if (this.recoveryAttempts < this.maxRecoveryAttempts) {
        console.log(`Retrying recovery (attempt ${this.recoveryAttempts + 1}/${this.maxRecoveryAttempts})...`);
        setTimeout(() => this.performRecovery(), 5000);
      } else {
        // Max attempts reached
        eventBus.emit(EVENT_TYPES.RECOVERY_FAILED, {
          attempts: this.recoveryAttempts,
          error: error.message
        });
      }
      
    } finally {
      this.recoveryInProgress = false;
    }
  }

  /**
   * Perform integrity check after recovery
   */
  async performIntegrityCheck() {
    console.log('Running post-recovery integrity check...');
    
    try {
      const report = dataIntegrityManager.getIntegrityReport();
      
      if (report.corruptionEvents > 0) {
        console.warn(`Found ${report.corruptionEvents} corruption events`);
        
        // Attempt to fix corruptions
        for (const corruption of report.recentCorruptions) {
          try {
            await dataIntegrityManager.restoreSnapshot(corruption.documentId);
          } catch (error) {
            console.error(`Failed to restore ${corruption.documentId}:`, error);
          }
        }
      }
      
      return report;
    } catch (error) {
      console.error('Integrity check failed:', error);
      throw error;
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Listen for critical errors
    eventBus.on(EVENT_TYPES.STORAGE_ERROR, (event) => {
      this.handleStorageError(event);
    });
    
    eventBus.on(EVENT_TYPES.DATA_CORRUPTION_DETECTED, (event) => {
      this.handleCorruption(event);
    });
    
    // Clean shutdown handler
    window.addEventListener('beforeunload', () => {
      localStorage.setItem('clean_shutdown', 'true');
      this.saveRecoveryCheckpoint();
    });
  }

  /**
   * Register global error handler
   */
  registerGlobalErrorHandler() {
    window.addEventListener('error', (event) => {
      console.error('Global error caught:', event.error);
      
      // Save error state for recovery
      this.saveErrorState({
        message: event.message,
        stack: event.error?.stack,
        timestamp: Date.now()
      });
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      
      // Save rejection state
      this.saveErrorState({
        type: 'unhandled_rejection',
        reason: event.reason,
        timestamp: Date.now()
      });
    });
  }

  /**
   * Handle storage error
   */
  handleStorageError(event) {
    console.error('Storage error detected:', event);
    
    // Save current state for recovery
    this.saveRecoveryCheckpoint();
    
    // Attempt immediate recovery if critical
    if (event.critical) {
      this.performRecovery();
    }
  }

  /**
   * Handle data corruption
   */
  async handleCorruption(event) {
    console.error('Data corruption detected:', event);
    
    try {
      // Attempt to restore from snapshot
      const restored = await dataIntegrityManager.restoreSnapshot(event.documentId);
      
      if (restored) {
        console.log(`Successfully restored document ${event.documentId}`);
        
        eventBus.emit(EVENT_TYPES.CORRUPTION_RECOVERED, {
          documentId: event.documentId,
          method: 'snapshot'
        });
      }
    } catch (error) {
      console.error('Failed to recover from corruption:', error);
      
      // Save for manual recovery
      this.saveCorruptedData(event.documentId);
    }
  }

  /**
   * Save recovery checkpoint
   */
  saveRecoveryCheckpoint() {
    try {
      // Save current documents
      const documents = storageWrapper.getAllDocuments();
      if (documents && documents.length > 0) {
        localStorage.setItem('recovery_checkpoint', JSON.stringify({
          timestamp: Date.now(),
          documents: documents.slice(0, 10), // Save up to 10 most recent
          documentCount: documents.length
        }));
      }
      
      // Save active session
      const session = {
        currentDocument: sessionStorage.getItem('currentDocument'),
        scrollPositions: sessionStorage.getItem('scrollPositions'),
        timestamp: Date.now()
      };
      sessionStorage.setItem('active_session', JSON.stringify(session));
      
    } catch (error) {
      console.error('Failed to save recovery checkpoint:', error);
    }
  }

  /**
   * Save error state
   */
  saveErrorState(error) {
    try {
      const errors = JSON.parse(localStorage.getItem('error_states') || '[]');
      errors.push(error);
      
      // Keep only last 10 errors
      if (errors.length > 10) {
        errors.shift();
      }
      
      localStorage.setItem('error_states', JSON.stringify(errors));
    } catch (err) {
      console.error('Failed to save error state:', err);
    }
  }

  /**
   * Save corrupted data for manual recovery
   */
  saveCorruptedData(documentId) {
    try {
      const corrupted = JSON.parse(localStorage.getItem('corrupted_data') || '[]');
      corrupted.push({
        documentId,
        timestamp: Date.now()
      });
      
      localStorage.setItem('corrupted_data', JSON.stringify(corrupted));
    } catch (error) {
      console.error('Failed to save corrupted data reference:', error);
    }
  }

  /**
   * Start auto-save
   */
  startAutoSave() {
    setInterval(() => {
      this.performAutoSave();
    }, this.autoSaveInterval);
  }

  /**
   * Perform auto-save
   */
  async performAutoSave() {
    try {
      // Save unsaved documents
      const unsaved = storageWrapper.getUnsavedDocuments();
      if (unsaved && unsaved.length > 0) {
        localStorage.setItem('unsaved_documents', JSON.stringify(unsaved));
        this.lastAutoSave = Date.now();
      }
      
      // Save active locks
      const activeLocks = Array.from(lockManager.locks.keys());
      if (activeLocks.length > 0) {
        localStorage.setItem('active_locks', JSON.stringify(activeLocks));
      }
      
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }

  /**
   * Log recovery event
   */
  logRecoveryEvent(type, data) {
    const event = {
      type,
      timestamp: Date.now(),
      data
    };
    
    this.recoveryLog.push(event);
    
    // Keep log size manageable
    if (this.recoveryLog.length > this.maxLogSize) {
      this.recoveryLog.shift();
    }
  }

  /**
   * Get recovery status
   */
  getRecoveryStatus() {
    return {
      recoveryInProgress: this.recoveryInProgress,
      lastRecoveryTime: this.lastRecoveryTime,
      recoveryAttempts: this.recoveryAttempts,
      lastAutoSave: this.lastAutoSave,
      recentEvents: this.recoveryLog.slice(-10)
    };
  }

  /**
   * Manual recovery trigger
   */
  async triggerManualRecovery() {
    console.log('Manual recovery triggered');
    this.recoveryAttempts = 0; // Reset attempts for manual trigger
    return this.performRecovery();
  }

  /**
   * Export recovery data
   */
  exportRecoveryData() {
    const data = {
      checkpoint: localStorage.getItem('recovery_checkpoint'),
      errorStates: localStorage.getItem('error_states'),
      corruptedData: localStorage.getItem('corrupted_data'),
      recoveryLog: this.recoveryLog,
      timestamp: Date.now()
    };
    
    return data;
  }

  /**
   * Clear recovery data
   */
  clearRecoveryData() {
    localStorage.removeItem('recovery_checkpoint');
    localStorage.removeItem('error_states');
    localStorage.removeItem('corrupted_data');
    localStorage.removeItem('unsaved_documents');
    localStorage.removeItem('active_locks');
    localStorage.removeItem('pending_transactions');
    
    this.recoveryLog = [];
    this.recoveryAttempts = 0;
  }
}

// Recovery event types
export const RECOVERY_EVENTS = {
  RECOVERY_STARTED: 'recovery:started',
  RECOVERY_COMPLETED: 'recovery:completed',
  RECOVERY_FAILED: 'recovery:failed',
  CORRUPTION_RECOVERED: 'recovery:corruption:recovered'
};

// Add to main event types
Object.assign(EVENT_TYPES, RECOVERY_EVENTS);

// Export singleton instance
const recoveryManager = new RecoveryManager();

export default recoveryManager;
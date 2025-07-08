/**
 * Auto-save manager to prevent data loss
 * Features:
 * - Debounced saving
 * - Queue management for pending changes
 * - Local backup before saving
 * - Retry logic for failed saves
 */

class AutoSaveManager {
  constructor() {
    this.saveQueue = new Map(); // documentId -> pending changes
    this.saveTimers = new Map(); // documentId -> timer
    this.localBackups = new Map(); // documentId -> backup data
    this.saveInProgress = new Set(); // documentIds currently being saved
    this.DEBOUNCE_DELAY = 3000; // 3 seconds - prevent rapid saves
    this.MAX_RETRIES = 3;
    this.BACKUP_KEY_PREFIX = 'journey_log_backup_';
  }

  /**
   * Queue a document update for auto-save
   */
  queueSave(documentId, updates, saveFunction) {
    // console.log(`AutoSave: Queueing save for document ${documentId}`);
    
    // Merge with existing updates if any
    const existing = this.saveQueue.get(documentId);
    const mergedUpdates = existing ? { ...existing.updates, ...updates } : updates;
    
    // Store the merged updates
    this.saveQueue.set(documentId, {
      updates: mergedUpdates,
      saveFunction,
      timestamp: Date.now()
    });

    // Clear existing timer
    if (this.saveTimers.has(documentId)) {
      clearTimeout(this.saveTimers.get(documentId));
    }

    // Set new debounced save timer
    const timer = setTimeout(() => {
      this.executeSave(documentId);
    }, this.DEBOUNCE_DELAY);

    this.saveTimers.set(documentId, timer);
  }

  /**
   * Execute the save with retry logic
   */
  async executeSave(documentId, retryCount = 0) {
    // Check if already saving
    if (this.saveInProgress.has(documentId)) {
      console.log(`AutoSave: Save already in progress for ${documentId}, skipping`);
      // Don't retry immediately - let the debounce handle it
      return;
    }

    const saveData = this.saveQueue.get(documentId);
    if (!saveData) {
      console.log(`AutoSave: No pending changes for ${documentId}`);
      return;
    }

    this.saveInProgress.add(documentId);
    
    try {
      // Create local backup first
      await this.createLocalBackup(documentId, saveData.updates);
      
      // console.log(`AutoSave: Saving document ${documentId}`);
      await saveData.saveFunction(documentId, saveData.updates);
      
      // Success - clear queue and backup
      this.saveQueue.delete(documentId);
      this.clearLocalBackup(documentId);
      // console.log(`AutoSave: Successfully saved ${documentId}`);
      
    } catch (error) {
      console.error(`AutoSave: Failed to save ${documentId}:`, error);
      
      // Retry logic
      if (retryCount < this.MAX_RETRIES) {
        console.log(`AutoSave: Retrying save for ${documentId} (attempt ${retryCount + 1}/${this.MAX_RETRIES})`);
        setTimeout(() => {
          this.executeSave(documentId, retryCount + 1);
        }, 1000 * (retryCount + 1)); // Exponential backoff
      } else {
        console.error(`AutoSave: Max retries reached for ${documentId}. Data preserved in local backup.`);
        // Keep in queue for manual recovery
        this.notifyUserOfSaveFailure(documentId);
      }
    } finally {
      this.saveInProgress.delete(documentId);
    }
  }

  /**
   * Create a local backup before saving
   */
  async createLocalBackup(documentId, data) {
    try {
      const backupKey = `${this.BACKUP_KEY_PREFIX}${documentId}`;
      const backup = {
        documentId,
        data,
        timestamp: Date.now(),
        version: 1
      };
      
      // Try localStorage first
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(backupKey, JSON.stringify(backup));
      }
      
      // Also store in memory
      this.localBackups.set(documentId, backup);
      
      // console.log(`AutoSave: Created local backup for ${documentId}`);
    } catch (error) {
      console.error('AutoSave: Failed to create backup:', error);
    }
  }

  /**
   * Clear local backup after successful save
   */
  clearLocalBackup(documentId) {
    try {
      const backupKey = `${this.BACKUP_KEY_PREFIX}${documentId}`;
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(backupKey);
      }
      this.localBackups.delete(documentId);
    } catch (error) {
      console.error('AutoSave: Failed to clear backup:', error);
    }
  }

  /**
   * Recover unsaved changes from backup
   */
  async recoverFromBackup(documentId) {
    try {
      // Check memory first
      if (this.localBackups.has(documentId)) {
        return this.localBackups.get(documentId);
      }
      
      // Check localStorage
      const backupKey = `${this.BACKUP_KEY_PREFIX}${documentId}`;
      if (typeof localStorage !== 'undefined') {
        const backupStr = localStorage.getItem(backupKey);
        if (backupStr) {
          return JSON.parse(backupStr);
        }
      }
      
      return null;
    } catch (error) {
      console.error('AutoSave: Failed to recover backup:', error);
      return null;
    }
  }

  /**
   * Save immediately without debouncing (for critical saves)
   */
  async saveNow(documentId) {
    // Clear any pending timer
    if (this.saveTimers.has(documentId)) {
      clearTimeout(this.saveTimers.get(documentId));
      this.saveTimers.delete(documentId);
    }
    
    // Execute save immediately
    await this.executeSave(documentId);
  }

  /**
   * Save all pending changes (e.g., before page unload)
   */
  async saveAll() {
    console.log('AutoSave: Saving all pending changes...');
    
    // Clear all timers
    for (const timer of this.saveTimers.values()) {
      clearTimeout(timer);
    }
    this.saveTimers.clear();
    
    // Save all queued documents
    const savePromises = [];
    for (const documentId of this.saveQueue.keys()) {
      savePromises.push(this.executeSave(documentId));
    }
    
    await Promise.allSettled(savePromises);
    console.log('AutoSave: Completed saving all documents');
  }

  /**
   * Check for any unsaved changes
   */
  hasUnsavedChanges() {
    return this.saveQueue.size > 0;
  }

  /**
   * Get list of documents with unsaved changes
   */
  getUnsavedDocuments() {
    return Array.from(this.saveQueue.keys());
  }

  /**
   * Notify user of save failure
   */
  notifyUserOfSaveFailure(documentId) {
    // This could trigger a UI notification
    if (window.showNotification) {
      window.showNotification({
        type: 'error',
        title: 'Save Failed',
        message: `Failed to save document. Your changes are preserved locally.`,
        action: {
          label: 'Retry',
          onClick: () => this.executeSave(documentId)
        }
      });
    }
  }

  /**
   * Setup event listeners for page unload
   */
  setupUnloadHandlers() {
    // Save on page unload
    window.addEventListener('beforeunload', async (e) => {
      if (this.hasUnsavedChanges()) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        
        // Try to save everything
        await this.saveAll();
      }
    });

    // Save on visibility change (tab switch, minimize)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.hasUnsavedChanges()) {
        console.log('AutoSave: Page hidden, saving all changes...');
        this.saveAll();
      }
    });
  }
}

// Export singleton instance
export const autoSaveManager = new AutoSaveManager();

// Setup handlers on initialization
if (typeof window !== 'undefined') {
  autoSaveManager.setupUnloadHandlers();
}
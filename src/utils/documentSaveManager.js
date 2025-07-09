import { debounce } from './debounce';

/**
 * Document Save Manager
 * Implements best practices for saving documents with Supabase
 */
export class DocumentSaveManager {
  constructor(saveFunction, options = {}) {
    this.saveFunction = saveFunction;
    this.options = {
      debounceDelay: 1000, // 1 second debounce
      maxRetries: 3,
      retryDelay: 1000,
      showSaveIndicator: true,
      ...options
    };
    
    this.pendingSaves = new Map();
    this.saveStatus = new Map();
    this.listeners = new Set();
    
    // Create debounced save function
    this.debouncedSave = debounce(this.executeSave.bind(this), this.options.debounceDelay);
  }

  /**
   * Queue a document for saving
   */
  save(documentId, data, immediate = false) {
    // Store the latest data
    this.pendingSaves.set(documentId, {
      data,
      timestamp: Date.now(),
      retryCount: 0
    });
    
    // Update status
    this.updateStatus(documentId, 'pending');
    
    if (immediate) {
      this.executeSave();
    } else {
      this.debouncedSave();
    }
  }

  /**
   * Execute all pending saves
   */
  async executeSave() {
    const saves = Array.from(this.pendingSaves.entries());
    if (saves.length === 0) return;
    
    // Clear pending saves
    this.pendingSaves.clear();
    
    // Execute saves in parallel
    const savePromises = saves.map(async ([documentId, { data, retryCount }]) => {
      try {
        this.updateStatus(documentId, 'saving');
        
        // Call the save function
        await this.saveFunction(documentId, data);
        
        this.updateStatus(documentId, 'saved');
        
        // Clear saved status after 2 seconds
        setTimeout(() => {
          this.updateStatus(documentId, null);
        }, 2000);
        
        return { documentId, success: true };
      } catch (error) {
        console.error(`Failed to save document ${documentId}:`, error);
        
        // Retry logic
        if (retryCount < this.options.maxRetries) {
          setTimeout(() => {
            this.pendingSaves.set(documentId, {
              data,
              timestamp: Date.now(),
              retryCount: retryCount + 1
            });
            this.executeSave();
          }, this.options.retryDelay * (retryCount + 1));
          
          this.updateStatus(documentId, 'retrying');
        } else {
          this.updateStatus(documentId, 'error');
        }
        
        return { documentId, success: false, error };
      }
    });
    
    return Promise.allSettled(savePromises);
  }

  /**
   * Update save status and notify listeners
   */
  updateStatus(documentId, status) {
    this.saveStatus.set(documentId, status);
    this.notifyListeners(documentId, status);
  }

  /**
   * Get current status for a document
   */
  getStatus(documentId) {
    return this.saveStatus.get(documentId);
  }

  /**
   * Subscribe to status changes
   */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of status change
   */
  notifyListeners(documentId, status) {
    this.listeners.forEach(listener => {
      listener(documentId, status);
    });
  }

  /**
   * Force save all pending documents
   */
  async flush() {
    return this.executeSave();
  }

  /**
   * Check if there are pending saves
   */
  hasPendingSaves() {
    return this.pendingSaves.size > 0;
  }
}

/**
 * React Hook for document save status
 */
export function useSaveStatus(saveManager, documentId) {
  const [status, setStatus] = React.useState(() => 
    saveManager.getStatus(documentId)
  );

  React.useEffect(() => {
    const unsubscribe = saveManager.subscribe((id, newStatus) => {
      if (id === documentId) {
        setStatus(newStatus);
      }
    });

    return unsubscribe;
  }, [saveManager, documentId]);

  return status;
}

/**
 * Debounce utility function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
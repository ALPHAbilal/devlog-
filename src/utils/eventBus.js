// Event Bus for application-wide event management
class EventBus {
  constructor() {
    this.events = {};
    this.onceEvents = {};
  }

  // Subscribe to an event
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    
    this.events[event].push(callback);

    // Return unsubscribe function
    return () => {
      this.off(event, callback);
    };
  }

  // Subscribe to an event only once
  once(event, callback) {
    if (!this.onceEvents[event]) {
      this.onceEvents[event] = [];
    }
    
    this.onceEvents[event].push(callback);
  }

  // Unsubscribe from an event
  off(event, callback) {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
    }
  }

  // Emit an event
  emit(event, data) {
    // Regular subscribers
    if (this.events[event]) {
      this.events[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }

    // Once subscribers
    if (this.onceEvents[event]) {
      const callbacks = [...this.onceEvents[event]];
      this.onceEvents[event] = [];
      
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in once event handler for ${event}:`, error);
        }
      });
    }
  }

  // Clear all listeners for an event
  clear(event) {
    if (event) {
      delete this.events[event];
      delete this.onceEvents[event];
    } else {
      // Clear all events
      this.events = {};
      this.onceEvents = {};
    }
  }
}

// Create singleton instance
const eventBus = new EventBus();

// Event types for type safety and documentation
export const EVENT_TYPES = {
  // Document events
  DOCUMENT_CREATED: 'document:created',
  DOCUMENT_UPDATED: 'document:updated',
  DOCUMENT_DELETED: 'document:deleted',
  DOCUMENT_RESTORED: 'document:restored',
  
  // Block events
  BLOCK_CREATED: 'block:created',
  BLOCK_UPDATED: 'block:updated',
  BLOCK_DELETED: 'block:deleted',
  BLOCK_REORDERED: 'block:reordered',
  
  // Storage events
  STORAGE_CHANGED: 'storage:changed',
  STORAGE_SYNCED: 'storage:synced',
  STORAGE_ERROR: 'storage:error',
  
  // Auth events
  AUTH_STATE_CHANGED: 'auth:stateChanged',
  AUTH_USER_UPDATED: 'auth:userUpdated',
  
  // Database usage events
  DATABASE_SIZE_CHANGED: 'database:sizeChanged',
  DATABASE_LIMIT_WARNING: 'database:limitWarning',
  
  // Sync events
  SYNC_STARTED: 'sync:started',
  SYNC_COMPLETED: 'sync:completed',
  SYNC_FAILED: 'sync:failed',
  
  // Real-time events
  REALTIME_CONNECTED: 'realtime:connected',
  REALTIME_DISCONNECTED: 'realtime:disconnected',
  REALTIME_MESSAGE: 'realtime:message',
  
  // UI events
  UI_REFRESH_REQUESTED: 'ui:refreshRequested',
  UI_THEME_CHANGED: 'ui:themeChanged',
  
  // Predictive events
  DOCUMENT_OPENED: 'document:opened',
  SEARCH_PERFORMED: 'search:performed',
  PREFETCH_COMPLETED: 'prefetch:completed',
};

export default eventBus;
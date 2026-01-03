import { supabase } from '@/shared/api';

/**
 * Real-time Sync Manager for Supabase
 * Implements best practices for real-time data synchronization
 */
export class RealtimeSync {
  constructor() {
    this.subscriptions = new Map();
    this.listeners = new Map();
    this.connectionStatus = 'disconnected';
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  /**
   * Subscribe to real-time changes for documents
   */
  subscribeToDocument(documentId, userId, callback) {
    const channelName = `document:${documentId}`;
    
    // Clean up existing subscription
    if (this.subscriptions.has(channelName)) {
      this.unsubscribe(channelName);
    }

    // Create new subscription
    const subscription = supabase
      .channel(channelName)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'documents',
          filter: `id=eq.${documentId}`
        }, 
        (payload) => {
          // Don't trigger for own changes
          if (payload.new?.updated_by !== userId) {
            callback('document', payload);
          }
        }
      )
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'blocks',
          filter: `document_id=eq.${documentId}`
        },
        (payload) => {
          callback('block', payload);
        }
      )
      .on('presence', { event: 'sync' }, () => {
        const state = subscription.presenceState();
        callback('presence', state);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Track user presence
          subscription.track({
            user_id: userId,
            online_at: new Date().toISOString()
          });
        }
      });

    this.subscriptions.set(channelName, subscription);
    return channelName;
  }

  /**
   * Subscribe to user's documents list
   */
  subscribeToUserDocuments(userId, callback) {
    const channelName = `user-documents:${userId}`;
    
    if (this.subscriptions.has(channelName)) {
      this.unsubscribe(channelName);
    }

    const subscription = supabase
      .channel(channelName)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe();

    this.subscriptions.set(channelName, subscription);
    return channelName;
  }

  /**
   * Subscribe to shared documents
   */
  subscribeToSharedDocuments(userId, callback) {
    const channelName = `shared-documents:${userId}`;
    
    if (this.subscriptions.has(channelName)) {
      this.unsubscribe(channelName);
    }

    const subscription = supabase
      .channel(channelName)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'document_shares',
          filter: `shared_with_id=eq.${userId}`
        },
        callback
      )
      .subscribe();

    this.subscriptions.set(channelName, subscription);
    return channelName;
  }

  /**
   * Unsubscribe from a channel
   */
  async unsubscribe(channelName) {
    const subscription = this.subscriptions.get(channelName);
    if (subscription) {
      await subscription.unsubscribe();
      this.subscriptions.delete(channelName);
    }
  }

  /**
   * Unsubscribe from all channels
   */
  async unsubscribeAll() {
    const promises = Array.from(this.subscriptions.keys()).map(channel => 
      this.unsubscribe(channel)
    );
    await Promise.all(promises);
  }

  /**
   * Handle connection state changes
   */
  monitorConnection() {
    // Monitor all subscriptions
    this.subscriptions.forEach((subscription, channelName) => {
      subscription.on('system', {}, (payload) => {
        if (payload.extension === 'postgres_changes') {
          this.handleConnectionChange(payload.status);
        }
      });
    });
  }

  /**
   * Handle connection state changes
   */
  handleConnectionChange(status) {
    this.connectionStatus = status;
    
    if (status === 'error' || status === 'closed') {
      this.attemptReconnect();
    } else if (status === 'connected') {
      this.reconnectAttempts = 0;
    }

    // Notify listeners
    this.notifyConnectionListeners(status);
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  async attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

    console.log(`Attempting reconnect in ${delay}ms...`);
    
    setTimeout(async () => {
      try {
        // Re-subscribe to all channels
        const channels = Array.from(this.subscriptions.entries());
        for (const [channelName, subscription] of channels) {
          await subscription.subscribe();
        }
      } catch (error) {
        console.error('Reconnection failed:', error);
        this.attemptReconnect();
      }
    }, delay);
  }

  /**
   * Subscribe to connection status changes
   */
  onConnectionChange(callback) {
    const id = crypto.randomUUID();
    if (!this.listeners.has('connection')) {
      this.listeners.set('connection', new Map());
    }
    this.listeners.get('connection').set(id, callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.get('connection')?.delete(id);
    };
  }

  /**
   * Notify connection listeners
   */
  notifyConnectionListeners(status) {
    const connectionListeners = this.listeners.get('connection');
    if (connectionListeners) {
      connectionListeners.forEach(callback => callback(status));
    }
  }

  /**
   * Get current connection status
   */
  getConnectionStatus() {
    return this.connectionStatus;
  }
}

// Create singleton instance
export const realtimeSync = new RealtimeSync();

/**
 * React Hook for real-time document sync
 */
export function useRealtimeDocument(documentId, userId) {
  const [syncStatus, setSyncStatus] = React.useState('disconnected');
  const [lastUpdate, setLastUpdate] = React.useState(null);

  React.useEffect(() => {
    if (!documentId || !userId) return;

    const handleUpdate = (type, payload) => {
      setLastUpdate({ type, payload, timestamp: Date.now() });
    };

    const channelName = realtimeSync.subscribeToDocument(documentId, userId, handleUpdate);

    const unsubscribeConnection = realtimeSync.onConnectionChange(setSyncStatus);

    return () => {
      realtimeSync.unsubscribe(channelName);
      unsubscribeConnection();
    };
  }, [documentId, userId]);

  return { syncStatus, lastUpdate };
}
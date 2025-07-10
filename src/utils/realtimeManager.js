import { supabase } from '../lib/supabaseOptimized';
import eventBus, { EVENT_TYPES } from './eventBus';

class RealtimeManager {
  constructor() {
    this.channels = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.isConnected = false;
    this.userId = null;
  }

  // Initialize realtime with user
  async initialize(userId) {
    if (!userId) {
      console.warn('RealtimeManager: No userId provided');
      return;
    }

    this.userId = userId;
    
    // Set up main subscriptions
    await this.setupDocumentsSubscription();
    await this.setupBlocksSubscription();
    
    // Monitor connection health
    this.startHealthCheck();
  }

  // Set up documents table subscription
  async setupDocumentsSubscription() {
    const channel = supabase
      .channel('documents-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents',
          filter: `user_id=eq.${this.userId}`
        },
        (payload) => {
          this.handleDocumentChange(payload);
        }
      )
      .on('system', { event: 'connected' }, () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        eventBus.emit(EVENT_TYPES.REALTIME_CONNECTED);
        console.log('RealtimeManager: Connected to documents channel');
      })
      .on('system', { event: 'disconnected' }, () => {
        this.isConnected = false;
        eventBus.emit(EVENT_TYPES.REALTIME_DISCONNECTED);
        console.log('RealtimeManager: Disconnected from documents channel');
      })
      .subscribe();

    this.channels.set('documents', channel);
  }

  // Set up blocks table subscription
  async setupBlocksSubscription() {
    const channel = supabase
      .channel('blocks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'blocks'
        },
        async (payload) => {
          // Check if block belongs to user's document
          if (await this.isUserBlock(payload.new?.document_id || payload.old?.document_id)) {
            this.handleBlockChange(payload);
          }
        }
      )
      .subscribe();

    this.channels.set('blocks', channel);
  }

  // Handle document changes
  handleDocumentChange(payload) {
    const { eventType, new: newDoc, old: oldDoc } = payload;
    
    switch (eventType) {
      case 'INSERT':
        eventBus.emit(EVENT_TYPES.DOCUMENT_CREATED, newDoc);
        eventBus.emit(EVENT_TYPES.DATABASE_SIZE_CHANGED);
        break;
        
      case 'UPDATE':
        eventBus.emit(EVENT_TYPES.DOCUMENT_UPDATED, { old: oldDoc, new: newDoc });
        
        // Check if document was restored from soft delete
        if (oldDoc?.deleted_at && !newDoc?.deleted_at) {
          eventBus.emit(EVENT_TYPES.DOCUMENT_RESTORED, newDoc);
        }
        // Check if document was soft deleted
        else if (!oldDoc?.deleted_at && newDoc?.deleted_at) {
          eventBus.emit(EVENT_TYPES.DOCUMENT_DELETED, newDoc);
          eventBus.emit(EVENT_TYPES.DATABASE_SIZE_CHANGED);
        }
        break;
        
      case 'DELETE':
        eventBus.emit(EVENT_TYPES.DOCUMENT_DELETED, oldDoc);
        eventBus.emit(EVENT_TYPES.DATABASE_SIZE_CHANGED);
        break;
    }

    // Always emit storage changed for UI updates
    eventBus.emit(EVENT_TYPES.STORAGE_CHANGED, {
      type: 'document',
      action: eventType.toLowerCase(),
      data: newDoc || oldDoc
    });
  }

  // Handle block changes
  handleBlockChange(payload) {
    const { eventType, new: newBlock, old: oldBlock } = payload;
    
    switch (eventType) {
      case 'INSERT':
        eventBus.emit(EVENT_TYPES.BLOCK_CREATED, newBlock);
        eventBus.emit(EVENT_TYPES.DATABASE_SIZE_CHANGED);
        break;
        
      case 'UPDATE':
        eventBus.emit(EVENT_TYPES.BLOCK_UPDATED, { old: oldBlock, new: newBlock });
        
        // Check if block order changed
        if (oldBlock?.order_index !== newBlock?.order_index) {
          eventBus.emit(EVENT_TYPES.BLOCK_REORDERED, { old: oldBlock, new: newBlock });
        }
        break;
        
      case 'DELETE':
        eventBus.emit(EVENT_TYPES.BLOCK_DELETED, oldBlock);
        eventBus.emit(EVENT_TYPES.DATABASE_SIZE_CHANGED);
        break;
    }

    // Emit storage changed
    eventBus.emit(EVENT_TYPES.STORAGE_CHANGED, {
      type: 'block',
      action: eventType.toLowerCase(),
      data: newBlock || oldBlock
    });
  }

  // Check if a block belongs to the current user
  async isUserBlock(documentId) {
    if (!documentId || !this.userId) return false;
    
    try {
      const { data } = await supabase
        .from('documents')
        .select('id')
        .eq('id', documentId)
        .eq('user_id', this.userId)
        .single();
        
      return !!data;
    } catch (error) {
      console.error('Error checking block ownership:', error);
      return false;
    }
  }

  // Health check for connection
  startHealthCheck() {
    // Check connection every 30 seconds
    this.healthCheckInterval = setInterval(() => {
      if (!this.isConnected && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnect();
      }
    }, 30000);
  }

  // Reconnect to realtime
  async reconnect() {
    this.reconnectAttempts++;
    console.log(`RealtimeManager: Reconnection attempt ${this.reconnectAttempts}`);
    
    // Exponential backoff
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    setTimeout(async () => {
      try {
        await this.cleanup();
        await this.initialize(this.userId);
      } catch (error) {
        console.error('RealtimeManager: Reconnection failed', error);
      }
    }, delay);
  }

  // Subscribe to presence for collaborative features
  async subscribeToPresence(documentId) {
    const channel = supabase.channel(`presence-${documentId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        eventBus.emit(EVENT_TYPES.REALTIME_MESSAGE, {
          type: 'presence',
          documentId,
          state
        });
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        eventBus.emit(EVENT_TYPES.REALTIME_MESSAGE, {
          type: 'user_joined',
          documentId,
          user: newPresences[0]
        });
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        eventBus.emit(EVENT_TYPES.REALTIME_MESSAGE, {
          type: 'user_left',
          documentId,
          user: leftPresences[0]
        });
      })
      .subscribe();

    // Track presence
    await channel.track({
      userId: this.userId,
      online_at: new Date().toISOString()
    });

    this.channels.set(`presence-${documentId}`, channel);
  }

  // Unsubscribe from presence
  async unsubscribeFromPresence(documentId) {
    const channel = this.channels.get(`presence-${documentId}`);
    if (channel) {
      await channel.unsubscribe();
      this.channels.delete(`presence-${documentId}`);
    }
  }

  // Clean up all subscriptions
  async cleanup() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    for (const [key, channel] of this.channels) {
      await channel.unsubscribe();
    }
    
    this.channels.clear();
    this.isConnected = false;
  }
}

// Create singleton instance
const realtimeManager = new RealtimeManager();

export default realtimeManager;
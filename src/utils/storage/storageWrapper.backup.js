// Storage wrapper that provides a unified interface for Supabase storage
// Only uses Supabase - no local storage or migration

import { SupabaseAdapter } from './SupabaseAdapter';
import { supabase } from '../../lib/supabase';

// Create a singleton instance
const supabaseAdapter = new SupabaseAdapter();

// Storage wrapper that uses only Supabase
export const storageWrapper = {
  // Flag to track if we're using Supabase
  useSupabase: false,
  
  // Initialize the wrapper
  async init() {
    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const initialized = await supabaseAdapter.init();
        this.useSupabase = initialized;
        
        if (this.useSupabase) {
          console.log('Using Supabase for storage');
        }
      } else {
        console.log('No authenticated user, storage disabled');
        this.useSupabase = false;
      }
    } catch (error) {
      console.error('Storage initialization error:', error);
      this.useSupabase = false;
    }
  },

  // Get entries
  async getEntries() {
    if (!this.useSupabase) {
      return [];
    }
    
    try {
      return await supabaseAdapter.getDocuments();
    } catch (error) {
      console.error('Supabase read error:', error);
      return [];
    }
  },

  // Save entries
  async saveEntries(entries) {
    if (!this.useSupabase) {
      console.warn('Cannot save - no authenticated user');
      return entries;
    }
    
    try {
      await supabaseAdapter.updateAllDocuments(entries);
      return entries;
    } catch (error) {
      console.error('Supabase write error:', error);
      throw error;
    }
  },

  // Save single document
  async saveDocument(document) {
    if (!this.useSupabase) {
      console.warn('Cannot save - no authenticated user');
      return null;
    }
    
    try {
      return await supabaseAdapter.saveDocument(document);
    } catch (error) {
      console.error('Supabase save error:', error);
      throw error;
    }
  },

  // Delete document
  async deleteDocument(documentId) {
    if (!this.useSupabase) {
      console.warn('Cannot delete - no authenticated user');
      return;
    }
    
    try {
      await supabaseAdapter.deleteDocument(documentId);
    } catch (error) {
      console.error('Supabase delete error:', error);
      throw error;
    }
  },

  // Get settings
  async getSettings() {
    if (!this.useSupabase) {
      return null;
    }
    
    try {
      return await supabaseAdapter.getItem('devlogSettings');
    } catch (error) {
      console.error('Supabase settings read error:', error);
      return null;
    }
  },

  // Save settings
  async saveSettings(settings) {
    if (!this.useSupabase) {
      console.warn('Cannot save settings - no authenticated user');
      return settings;
    }
    
    try {
      await supabaseAdapter.setItem('devlogSettings', settings);
      return settings;
    } catch (error) {
      console.error('Supabase settings write error:', error);
      return settings;
    }
  },

  // Get storage info
  async getStorageInfo() {
    if (!this.useSupabase) {
      return {
        usage: 0,
        quota: 0,
        percentUsed: 0
      };
    }
    
    return await supabaseAdapter.getStorageInfo();
  },

  // Check if we're using Supabase
  isUsingSupabase() {
    return this.useSupabase;
  },

  // Re-initialize when auth state changes
  async reinit() {
    await this.init();
  }
};

// Listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
    storageWrapper.reinit();
  }
});

// Auto-initialize on import
storageWrapper.init().catch(console.error);

export default storageWrapper;
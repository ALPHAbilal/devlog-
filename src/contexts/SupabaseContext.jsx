/**
 * Supabase Context Provider
 * Provides the Supabase client instance throughout the app
 */

import React, { createContext, useContext } from 'react';
import { supabase } from '../lib/supabaseOptimized';

const SupabaseContext = createContext(null);

export function SupabaseProvider({ children }) {
  return (
    <SupabaseContext.Provider value={{ supabase }}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase() {
  const context = useContext(SupabaseContext);
  if (!context) {
    // Return the supabase instance directly if no context
    // This allows the hook to work even without the provider
    return { supabase };
  }
  return context;
}
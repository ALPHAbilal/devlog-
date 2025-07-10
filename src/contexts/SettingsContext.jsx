import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContextOptimized';

const SettingsContext = createContext({});

export function SettingsProvider({ children }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    defaultCodeLanguage: 'javascript',
    autoSaveInterval: 1,
    showLineNumbers: true,
    enableTextCollapse: true
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from localStorage first (for immediate access)
  useEffect(() => {
    const localSettings = localStorage.getItem('devlogSettings');
    if (localSettings) {
      try {
        const parsed = JSON.parse(localSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (err) {
        console.error('Error parsing local settings:', err);
      }
    }
  }, []);

  // Load settings from Supabase user metadata
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const loadSettings = async () => {
      try {
        const { data: { user: userData } } = await supabase.auth.getUser();
        
        if (userData?.user_metadata?.settings) {
          const supabaseSettings = userData.user_metadata.settings;
          setSettings(prev => ({ ...prev, ...supabaseSettings }));
          
          // Update local cache
          localStorage.setItem('devlogSettings', JSON.stringify(supabaseSettings));
        }
      } catch (err) {
        console.error('Error loading settings from Supabase:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [user]);

  // Update a single setting
  const updateSetting = async (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    // Save to localStorage immediately
    localStorage.setItem('devlogSettings', JSON.stringify(newSettings));
    
    // Save to Supabase if user is authenticated
    if (user) {
      try {
        const { error } = await supabase.auth.updateUser({
          data: { settings: newSettings }
        });
        
        if (error) {
          console.error('Error saving settings to Supabase:', error);
        }
      } catch (err) {
        console.error('Error updating user settings:', err);
      }
    }
  };

  // Update multiple settings at once
  const updateSettings = async (updates) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    
    // Save to localStorage immediately
    localStorage.setItem('devlogSettings', JSON.stringify(newSettings));
    
    // Save to Supabase if user is authenticated
    if (user) {
      try {
        const { error } = await supabase.auth.updateUser({
          data: { settings: newSettings }
        });
        
        if (error) {
          console.error('Error saving settings to Supabase:', error);
        }
      } catch (err) {
        console.error('Error updating user settings:', err);
      }
    }
  };

  return (
    <SettingsContext.Provider value={{
      settings,
      updateSetting,
      updateSettings,
      isLoading
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
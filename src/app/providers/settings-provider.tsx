import { createContext, useContext, useState, useEffect } from 'react';
import { supabase, setInactivityTimeout } from '@/shared/api';
import { useAuth } from './auth-provider';

const SettingsContext = createContext({});

export function SettingsProvider({ children }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    defaultCodeLanguage: 'javascript',
    autoSaveInterval: 30, // Changed from 1 to 30 seconds for production stability
    showLineNumbers: true,
    enableTextCollapse: true,
    sessionTimeout: 4320 // Default 3 days (72 hours = 4320 minutes)
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from localStorage first (for immediate access)
  useEffect(() => {
    const localSettings = localStorage.getItem('devlogSettings');
    if (localSettings) {
      try {
        const parsed = JSON.parse(localSettings);
        setSettings(prev => ({ ...prev, ...parsed }));

        // Apply session timeout if set in localStorage
        if (parsed.sessionTimeout !== undefined) {
          // [DEBUG-TIMEOUT] Log localStorage override
          console.log('[DEBUG-TIMEOUT-14] ⚙️ Settings from LOCALSTORAGE:', {
            source: 'localStorage.devlogSettings',
            sessionTimeout_minutes: parsed.sessionTimeout,
            sessionTimeout_hours: parsed.sessionTimeout / 60,
            allSettings: parsed,
            timestamp: new Date().toISOString()
          });

          setInactivityTimeout(parsed.sessionTimeout);
        }
      } catch (err) {
        console.error('Error parsing local settings:', err);
      }
    } else {
      // [DEBUG-TIMEOUT] Log no localStorage settings
      console.log('[DEBUG-TIMEOUT-15] ℹ️ No localStorage settings found, using defaults');
    }
  }, []);

  // Load settings from profiles table
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const loadSettings = async () => {
      try {
        // Load settings from profiles table
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('settings')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error('Error loading profile settings:', error);
        } else if (profile?.settings) {
          const profileSettings = profile.settings;
          setSettings(prev => ({ ...prev, ...profileSettings }));

          // Update local cache
          localStorage.setItem('devlogSettings', JSON.stringify(profileSettings));

          // Apply session timeout if set
          if (profileSettings.sessionTimeout !== undefined) {
            // [DEBUG-TIMEOUT] Log database override
            console.log('[DEBUG-TIMEOUT-16] 💾 Settings from DATABASE (profiles table):', {
              source: 'profiles.settings',
              userId: user.id,
              sessionTimeout_minutes: profileSettings.sessionTimeout,
              sessionTimeout_hours: profileSettings.sessionTimeout / 60,
              allSettings: profileSettings,
              timestamp: new Date().toISOString()
            });

            setInactivityTimeout(profileSettings.sessionTimeout);
          } else {
            console.log('[DEBUG-TIMEOUT-17] ℹ️ Database settings loaded but no sessionTimeout specified');
          }
        } else {
          console.log('[DEBUG-TIMEOUT-18] ℹ️ No database settings found for user');
        }
      } catch (err) {
        console.error('Error loading settings from profiles:', err);
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
    
    // Save to profiles table if user is authenticated
    if (user) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ settings: newSettings })
          .eq('id', user.id);
        
        if (error) {
          console.error('Error saving settings to profiles:', error);
        }
      } catch (err) {
        console.error('Error updating profile settings:', err);
      }
    }
  };

  // Update multiple settings at once
  const updateSettings = async (updates) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    
    // Save to localStorage immediately
    localStorage.setItem('devlogSettings', JSON.stringify(newSettings));
    
    // Save to profiles table if user is authenticated
    if (user) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ settings: newSettings })
          .eq('id', user.id);
        
        if (error) {
          console.error('Error saving settings to profiles:', error);
        }
      } catch (err) {
        console.error('Error updating profile settings:', err);
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
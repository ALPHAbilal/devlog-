import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { supabase, setInactivityTimeout } from '@/shared/api';
import { useAuth } from './auth-provider';

interface Settings {
  defaultCodeLanguage: string;
  autoSaveInterval: number;
  showLineNumbers: boolean;
  enableTextCollapse: boolean;
  sessionTimeout: number;
  // Display settings
  displayFontSize: number;
  displayLineHeight: number;
  displayBlockSpacing: 'compact' | 'normal' | 'relaxed';
  [key: string]: unknown; // Allow additional settings
}

interface SettingsContextValue {
  settings: Settings;
  updateSetting: (key: string, value: unknown) => Promise<void>;
  updateSettings: (updates: Partial<Settings>) => Promise<void>;
  applyDisplaySettings: (fontSize: number, lineHeight: number, blockSpacing: string) => void;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

interface SettingsProviderProps {
  children: ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Settings>({
    defaultCodeLanguage: 'javascript',
    autoSaveInterval: 30, // Changed from 1 to 30 seconds for production stability
    showLineNumbers: true,
    enableTextCollapse: true,
    sessionTimeout: 4320, // Default 3 days (72 hours = 4320 minutes)
    // Display settings
    displayFontSize: 14,
    displayLineHeight: 1.4,
    displayBlockSpacing: 'normal'
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from localStorage first (for immediate access)
  useEffect(() => {
    const localSettings = localStorage.getItem('devlogSettings');
    console.log('[FONT-DEBUG-1] 📦 localStorage raw:', localSettings);
    if (localSettings) {
      try {
        const parsed = JSON.parse(localSettings);
        console.log('[FONT-DEBUG-2] 📦 localStorage parsed display settings:', {
          displayFontSize: parsed.displayFontSize,
          displayLineHeight: parsed.displayLineHeight,
          displayBlockSpacing: parsed.displayBlockSpacing,
          allKeys: Object.keys(parsed),
          timestamp: new Date().toISOString()
        });
        setSettings(prev => {
          const merged = { ...prev, ...parsed };
          console.log('[FONT-DEBUG-3] 📦 State after localStorage merge:', {
            displayFontSize: merged.displayFontSize,
            displayLineHeight: merged.displayLineHeight,
            displayBlockSpacing: merged.displayBlockSpacing,
          });
          return merged;
        });

        // Apply session timeout if set in localStorage
        if (parsed.sessionTimeout !== undefined) {
          setInactivityTimeout(parsed.sessionTimeout);
        }
      } catch (err) {
        console.error('Error parsing local settings:', err);
      }
    } else {
      console.log('[FONT-DEBUG-1] ⚠️ No localStorage settings found at all');
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
        // Use maybeSingle() instead of single() to handle case where profile doesn't exist
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('settings')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error('[FONT-DEBUG-4] ❌ Supabase profile load error:', error);
        } else if (profile?.settings) {
          const profileSettings = profile.settings;
          console.log('[FONT-DEBUG-5] 💾 Supabase returned settings:', {
            displayFontSize: profileSettings.displayFontSize,
            displayLineHeight: profileSettings.displayLineHeight,
            displayBlockSpacing: profileSettings.displayBlockSpacing,
            allKeys: Object.keys(profileSettings),
            timestamp: new Date().toISOString()
          });

          const localBeforeOverwrite = localStorage.getItem('devlogSettings');
          console.log('[FONT-DEBUG-6] 💾 localStorage BEFORE Supabase overwrite:', localBeforeOverwrite);

          setSettings(prev => {
            const merged = { ...prev, ...profileSettings };
            console.log('[FONT-DEBUG-7] 💾 State after Supabase merge:', {
              displayFontSize: merged.displayFontSize,
              displayLineHeight: merged.displayLineHeight,
              prevFontSize: prev.displayFontSize,
              prevLineHeight: prev.displayLineHeight,
            });
            return merged;
          });

          // Update local cache
          localStorage.setItem('devlogSettings', JSON.stringify(profileSettings));
          console.log('[FONT-DEBUG-8] 💾 localStorage AFTER Supabase overwrite:', localStorage.getItem('devlogSettings'));

          // Apply session timeout if set
          if (profileSettings.sessionTimeout !== undefined) {
            setInactivityTimeout(profileSettings.sessionTimeout);
          }
        } else {
          console.log('[FONT-DEBUG-9] ⚠️ No settings found in Supabase profile (profile exists but settings is null/empty)');
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
  const updateSetting = async (key: string, value: unknown) => {
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
  const updateSettings = async (updates: Partial<Settings>) => {
    const newSettings = { ...settings, ...updates };
    console.log('[FONT-DEBUG-SAVE] 💾 updateSettings called:', {
      updates,
      currentSettingsDisplay: {
        displayFontSize: settings.displayFontSize,
        displayLineHeight: settings.displayLineHeight,
        displayBlockSpacing: settings.displayBlockSpacing,
      },
      newSettingsDisplay: {
        displayFontSize: newSettings.displayFontSize,
        displayLineHeight: newSettings.displayLineHeight,
        displayBlockSpacing: newSettings.displayBlockSpacing,
      },
      timestamp: new Date().toISOString()
    });
    setSettings(newSettings);
    
    // Save to localStorage immediately
    localStorage.setItem('devlogSettings', JSON.stringify(newSettings));
    console.log('[FONT-DEBUG-SAVE] 💾 Saved to localStorage, keys:', Object.keys(newSettings));
    
    // Save to profiles table if user is authenticated
    if (user) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ settings: newSettings })
          .eq('id', user.id);
        
        if (error) {
          console.error('[FONT-DEBUG-SAVE] ❌ Supabase save error:', error);
        } else {
          console.log('[FONT-DEBUG-SAVE] ✅ Saved to Supabase successfully');
        }
      } catch (err) {
        console.error('[FONT-DEBUG-SAVE] ❌ Supabase save exception:', err);
      }
    } else {
      console.log('[FONT-DEBUG-SAVE] ⚠️ No user — saved to localStorage only');
    }
  };

  // Apply display settings as CSS variables
  const applyDisplaySettings = useCallback((fontSize: number, lineHeight: number, blockSpacing: string) => {
    const root = document.documentElement;

    console.log('[FONT-DEBUG-CSS] 🎨 applyDisplaySettings called with:', {
      fontSize, lineHeight, blockSpacing,
      callerStack: new Error().stack?.split('\n')[2]?.trim(),
      timestamp: new Date().toISOString()
    });

    // Font size in pixels
    root.style.setProperty('--step-writing', `${fontSize}px`);

    // Line height as number
    root.style.setProperty('--line-height-writing', String(lineHeight));

    // Block spacing (compact=8px, normal=16px, relaxed=24px)
    const spacingMap: Record<string, string> = { compact: '8px', normal: '16px', relaxed: '24px' };
    root.style.setProperty('--block-gap', spacingMap[blockSpacing] || '16px');

    // Verify what actually got set
    const computed = getComputedStyle(root);
    console.log('[FONT-DEBUG-CSS] 🎨 CSS vars AFTER apply:', {
      '--step-writing': computed.getPropertyValue('--step-writing'),
      '--line-height-writing': computed.getPropertyValue('--line-height-writing'),
      '--block-gap': computed.getPropertyValue('--block-gap'),
    });
  }, []);

  // Apply display settings when they change
  useEffect(() => {
    console.log('[FONT-DEBUG-10] 🔄 Display settings effect triggered:', {
      displayFontSize: settings.displayFontSize,
      displayLineHeight: settings.displayLineHeight,
      displayBlockSpacing: settings.displayBlockSpacing,
      willApply: !!(settings.displayFontSize && settings.displayLineHeight),
      timestamp: new Date().toISOString()
    });
    if (settings.displayFontSize && settings.displayLineHeight) {
      applyDisplaySettings(
        settings.displayFontSize,
        settings.displayLineHeight,
        settings.displayBlockSpacing || 'normal'
      );
    }
  }, [settings.displayFontSize, settings.displayLineHeight, settings.displayBlockSpacing, applyDisplaySettings]);

  return (
    <SettingsContext.Provider value={{
      settings,
      updateSetting,
      updateSettings,
      applyDisplaySettings,
      isLoading
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
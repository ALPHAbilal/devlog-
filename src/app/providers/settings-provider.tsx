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
        // Use maybeSingle() instead of single() to handle case where profile doesn't exist
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('settings')
          .eq('id', user.id)
          .maybeSingle();

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

  // Apply display settings as CSS variables
  const applyDisplaySettings = useCallback((fontSize: number, lineHeight: number, blockSpacing: string) => {
    const root = document.documentElement;

    // Font size in pixels
    root.style.setProperty('--step-writing', `${fontSize}px`);

    // Line height as number
    root.style.setProperty('--line-height-writing', String(lineHeight));

    // Block spacing (compact=8px, normal=16px, relaxed=24px)
    const spacingMap: Record<string, string> = { compact: '8px', normal: '16px', relaxed: '24px' };
    root.style.setProperty('--block-gap', spacingMap[blockSpacing] || '16px');

    // Debug: Verify CSS variables were set
    const computedStyle = getComputedStyle(root);
    console.log('[Display Settings] Applied:', {
      fontSize,
      lineHeight,
      blockSpacing,
      // Verify the values were actually set
      verifyStepWriting: computedStyle.getPropertyValue('--step-writing'),
      verifyLineHeight: computedStyle.getPropertyValue('--line-height-writing'),
      verifyBlockGap: computedStyle.getPropertyValue('--block-gap'),
    });

    // Debug: Check if any tiptap-editor elements exist and what their computed styles are
    setTimeout(() => {
      const tiptapEditors = document.querySelectorAll('.tiptap-editor');
      if (tiptapEditors.length > 0) {
        const editorStyle = getComputedStyle(tiptapEditors[0]);
        console.log('[Display Settings] TipTap Editor computed styles:', {
          fontSize: editorStyle.fontSize,
          lineHeight: editorStyle.lineHeight,
          editorCount: tiptapEditors.length
        });
      } else {
        console.log('[Display Settings] No .tiptap-editor elements found on page');
      }
    }, 100);
  }, []);

  // Apply display settings when they change
  useEffect(() => {
    console.log('[Display Settings] useEffect triggered:', {
      displayFontSize: settings.displayFontSize,
      displayLineHeight: settings.displayLineHeight,
      displayBlockSpacing: settings.displayBlockSpacing,
      currentPath: window.location.pathname
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
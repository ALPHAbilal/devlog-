// App providers barrel file
// Re-exports all React context providers

// Auth
export { AuthProviderOptimized, useAuth } from './auth-provider';

// Settings
export { SettingsProvider, useSettings } from './settings-provider';

// UI State
export { SidebarProvider, useSidebar } from './sidebar-provider';
export { TabProvider, useTabContext } from './tab-provider';

// Demo
export { DemoModeProvider, useDemoMode } from './demo-mode-provider';

// Storage feature barrel file
// OPTIMIZED: Direct exports from source files (no nested barrel chains)

// ============== Hooks ==============
export { useMultiLayerStorage } from './hooks/use-multi-layer';
export { useSmartDatabaseUsage } from './hooks/use-database-usage';
export { useSmartSync } from './hooks/use-smart-sync';
export { useProjectStructure, usePaginatedDocuments } from './hooks/use-batch-loader';

// ============== Lib ==============
export { createSmartSync } from './lib/smart-sync';
export { default as SmartSync } from './lib/smart-sync';
export { default as RealtimeManager } from './lib/realtime-manager';
export { realtimeSync, RealtimeSync, useRealtimeDocument } from './lib/realtime-sync';
export { exportSupabaseData, importSupabaseData } from './lib/data-export';
// Alias exports for backward compatibility
export { exportSupabaseData as exportData } from './lib/data-export';
export { exportSupabaseData as exportToJSON } from './lib/data-export';
export { exportSupabaseData as exportToCSV } from './lib/data-export';

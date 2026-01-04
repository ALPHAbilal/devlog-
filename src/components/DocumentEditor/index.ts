/**
 * DocumentEditor Component Barrel File
 *
 * Exports all components extracted from ExpandedViewEnhanced.jsx
 * Part of Phase 5: Component Decomposition
 */

// ============== Main Orchestrator (Phase 5C) ==============
export { DocumentEditor, default } from './DocumentEditor';
export type { DocumentEditorProps, DocumentEntry } from './DocumentEditor';

// ============== Sub-Components ==============
export { TitleEditor } from './TitleEditor';
export type { TitleEditorProps } from './TitleEditor';

export { ViewModeToggle } from './ViewModeToggle';
export type { ViewModeToggleProps, ViewMode } from './ViewModeToggle';

export { TagManager } from './TagManager';
export type { TagManagerProps } from './TagManager';

export { BacklinksSection } from './BacklinksSection';
export type { BacklinksSectionProps, BacklinkEntry } from './BacklinksSection';

export { DeleteConfirmation } from './DeleteConfirmation';
export type { DeleteConfirmationProps } from './DeleteConfirmation';

export { LinesView } from './LinesView';
export type { LinesViewProps } from './LinesView';

export { BlockRenderer } from './BlockRenderer';
export type { BlockRendererProps, BlockData as BlockRendererBlockData } from './BlockRenderer';

export { BlockListView } from './BlockListView';
export type { BlockListViewProps, PaginationProgress } from './BlockListView';

export { HeaderControls } from './HeaderControls';
export type { HeaderControlsProps, SmartSyncManager } from './HeaderControls';

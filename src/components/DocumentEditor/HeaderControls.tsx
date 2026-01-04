/**
 * HeaderControls Component
 *
 * Document header with title editor, view mode toggle, sync status,
 * progress indicator, and action buttons (share, delete).
 *
 * Part of Phase 5: Component Decomposition
 * Extracted from ExpandedViewEnhanced.jsx (lines 1956-2066)
 */

import { memo, type RefObject } from 'react';
import { Trash2, Share2 } from 'lucide-react';
// @ts-expect-error - JSX component without type declarations
import SyncStatusIndicator from '../SyncStatusIndicator';
import { TitleEditor } from './TitleEditor';
import { ViewModeToggle, type ViewMode } from './ViewModeToggle';

// ============== Types ==============

export interface PaginationProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface SmartSyncManager {
  forceSync: () => Promise<void>;
  [key: string]: unknown;
}

export interface HeaderControlsProps {
  // Document metadata
  title: string;
  isEditingTitle: boolean;

  // View mode
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;

  // Progress (for large documents)
  shouldUsePagination: boolean;
  progress: PaginationProgress | null;

  // Title callbacks
  onTitleChange: (title: string) => void;
  onStartEditingTitle: () => void;
  onSaveTitle: () => void;

  // Action callbacks
  onShare: () => void;
  onDelete: () => void;

  // Sync status
  documentId: string | null;
  syncManagerRef: RefObject<SmartSyncManager | null>;
}

// ============== Component ==============

function HeaderControlsComponent({
  title,
  isEditingTitle,
  viewMode,
  onViewModeChange,
  shouldUsePagination,
  progress,
  onTitleChange,
  onStartEditingTitle,
  onSaveTitle,
  onShare,
  onDelete,
  documentId,
  syncManagerRef,
}: HeaderControlsProps) {
  return (
    <div className="mb-6">
      <div>
        <div className="flex items-center justify-between">
          <div className="text-text-secondary text-sm mb-2">Document</div>

          {/* View Mode Toggle and Actions */}
          <div className="flex items-center gap-3">
            {/* Progress Indicator for Large Documents */}
            {shouldUsePagination && progress && progress.total > 0 && (
              <div className="flex items-center gap-2 text-xs text-text-secondary/60">
                <span>
                  {progress.loaded}/{progress.total} blocks
                </span>
                <div className="w-16 h-1 bg-dark-secondary/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent-green/50 transition-all duration-300"
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
              </div>
            )}

            {/* Sync Status Indicator - Isolated Component */}
            <SyncStatusIndicator
              documentId={documentId}
              syncManagerRef={syncManagerRef}
            />

            {/* Share Button */}
            <button
              onClick={onShare}
              className="p-1.5 text-text-secondary hover:text-blue-400
                         hover:bg-blue-400/10 rounded transition-all"
              title="Share document"
            >
              <Share2 size={16} />
            </button>

            {/* Delete Button */}
            <button
              onClick={onDelete}
              className="p-1.5 text-text-secondary hover:text-red-400
                         hover:bg-red-400/10 rounded transition-all"
              title="Delete document"
            >
              <Trash2 size={16} />
            </button>

            {/* View Mode Toggle */}
            <ViewModeToggle
              viewMode={viewMode}
              onViewModeChange={onViewModeChange}
            />
          </div>
        </div>

        {/* Title Editor */}
        <TitleEditor
          title={title}
          isEditing={isEditingTitle}
          onTitleChange={onTitleChange}
          onStartEditing={onStartEditingTitle}
          onSave={onSaveTitle}
        />
      </div>
    </div>
  );
}

export const HeaderControls = memo(HeaderControlsComponent);
export default HeaderControls;

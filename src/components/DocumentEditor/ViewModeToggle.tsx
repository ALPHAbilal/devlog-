/**
 * ViewModeToggle Component
 *
 * Toggle between blocks view and lines view.
 * Shows active state with glow effect.
 *
 * Part of Phase 5: Component Decomposition
 * Extracted from ExpandedViewEnhanced.jsx
 */

import { memo } from 'react';
import { LayoutGrid, LayoutList } from 'lucide-react';

// ============== Types ==============

export type ViewMode = 'blocks' | 'lines';

export interface ViewModeToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

// ============== Component ==============

function ViewModeToggleComponent({
  viewMode,
  onViewModeChange,
}: ViewModeToggleProps) {
  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-r from-accent-green/20 to-accent-green/10
                      rounded-lg blur-xl opacity-50" />
      <div className="relative flex items-center gap-1 bg-dark-secondary/50 backdrop-blur-sm
                      rounded-lg p-1 border border-dark-secondary/50">
        <button
          onClick={() => onViewModeChange('blocks')}
          className={`relative p-1.5 rounded transition-all duration-200 ${
            viewMode === 'blocks'
              ? 'bg-dark-primary text-accent-green shadow-lg'
              : 'text-text-secondary hover:text-text-primary'
          }`}
          title="Blocks view"
        >
          {viewMode === 'blocks' && (
            <div className="absolute inset-0 bg-accent-green/20 rounded blur-sm" />
          )}
          <LayoutGrid size={16} className="relative z-10" />
        </button>
        <button
          onClick={() => onViewModeChange('lines')}
          className={`relative p-1.5 rounded transition-all duration-200 ${
            viewMode === 'lines'
              ? 'bg-dark-primary text-accent-green shadow-lg'
              : 'text-text-secondary hover:text-text-primary'
          }`}
          title="Lines view"
        >
          {viewMode === 'lines' && (
            <div className="absolute inset-0 bg-accent-green/20 rounded blur-sm" />
          )}
          <LayoutList size={16} className="relative z-10" />
        </button>
      </div>
    </div>
  );
}

export const ViewModeToggle = memo(ViewModeToggleComponent);
export default ViewModeToggle;

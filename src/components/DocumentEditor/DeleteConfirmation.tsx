/**
 * DeleteConfirmation Component
 *
 * Confirmation dialog for document deletion.
 * Renders as bottom sheet on mobile, modal on desktop.
 *
 * Part of Phase 5: Component Decomposition
 * Extracted from ExpandedViewEnhanced.jsx
 */

import { memo } from 'react';
import { Trash2 } from 'lucide-react';
// @ts-expect-error - JSX component without type declarations
import MobileBottomSheet from '../MobileBottomSheet';

// ============== Types ==============

export interface DeleteConfirmationProps {
  isOpen: boolean;
  isMobileView: boolean;
  title: string;
  isDeleting: boolean;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

// ============== Component ==============

function DeleteConfirmationComponent({
  isOpen,
  isMobileView,
  title,
  isDeleting,
  onConfirm,
  onCancel,
}: DeleteConfirmationProps) {
  if (!isOpen) {
    return null;
  }

  // Mobile: Bottom Sheet
  if (isMobileView) {
    return (
      <MobileBottomSheet
        isOpen={isOpen}
        onClose={onCancel}
        title="Delete Document?"
        height="auto"
      >
        <div className="p-6 space-y-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-text-secondary text-lg">
              Are you sure you want to delete &quot;{title}&quot;?
            </p>
            <p className="text-text-secondary/60 text-sm">
              This action cannot be undone.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="w-full h-12 bg-red-500 hover:bg-red-600 active:bg-red-700
                       text-white rounded-xl font-medium transition-all
                       disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2
                       active:scale-[0.98]"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 size={18} />
                  Delete Document
                </>
              )}
            </button>

            <button
              onClick={onCancel}
              className="w-full h-12 bg-dark-secondary hover:bg-dark-secondary/80
                       text-text-primary rounded-xl font-medium transition-all
                       active:scale-[0.98]"
            >
              Cancel
            </button>
          </div>
        </div>
      </MobileBottomSheet>
    );
  }

  // Desktop: Modal
  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onCancel}
    >
      <div
        className="bg-dark-secondary rounded-lg p-6 max-w-md w-full mx-4
                    border border-dark-primary/50 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-semibold text-text-primary mb-4">
          Delete Document?
        </h3>
        <p className="text-text-secondary mb-6">
          Are you sure you want to delete &quot;{title}&quot;? This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-text-secondary hover:text-text-primary
                       hover:bg-dark-primary/50 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className={`px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30
                       rounded transition-colors flex items-center gap-2
                       ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-red-400/50 border-t-red-400
                                rounded-full animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 size={16} />
                Delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export const DeleteConfirmation = memo(DeleteConfirmationComponent);
export default DeleteConfirmation;

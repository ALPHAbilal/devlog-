import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger' // 'danger' or 'default'
}) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleCancel();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  if (!isOpen) return null;

  const isDanger = variant === 'danger';

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={handleCancel}
      />

      {/* Dialog */}
      <div className="relative bg-[#1a2942]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-in zoom-in-95 slide-in-from-bottom-4 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            {isDanger && (
              <div className="flex-shrink-0 w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
            )}
            <h3 className="text-lg font-medium text-white/90">{title}</h3>
          </div>
          <button
            onClick={handleCancel}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white/40 hover:text-white/80" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-white/70 text-sm leading-relaxed">{message}</p>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white/90 border border-white/10 rounded-lg transition-all"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className={`flex-1 px-4 py-2.5 font-medium rounded-lg transition-all ${
                isDanger
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

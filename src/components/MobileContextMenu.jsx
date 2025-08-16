import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';

export default function MobileContextMenu({ 
  isOpen, 
  onClose, 
  title,
  actions = [],
  destructiveAction = null
}) {
  if (!isOpen) return null;

  const handleAction = (action) => {
    action.onClick();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />

          {/* Action Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 pb-safe"
          >
            <div className="mx-4 mb-2">
              {/* Main Actions */}
              <div className="bg-dark-secondary/95 backdrop-blur-sm rounded-2xl 
                             overflow-hidden border border-dark-secondary/50">
                {title && (
                  <div className="px-4 py-3 text-center border-b border-dark-primary/50">
                    <p className="text-sm text-text-secondary">{title}</p>
                  </div>
                )}
                
                <div className="divide-y divide-dark-primary/50">
                  {actions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => handleAction(action)}
                      disabled={action.disabled}
                      className="w-full px-4 py-3.5 flex items-center justify-between
                               text-text-primary hover:bg-dark-primary/30 
                               active:bg-dark-primary/50 transition-colors
                               disabled:opacity-50 disabled:cursor-not-allowed
                               touch-manipulation"
                    >
                      <div className="flex items-center gap-3">
                        {action.icon && (
                          <action.icon 
                            size={20} 
                            className={action.iconColor || 'text-text-secondary'} 
                          />
                        )}
                        <span className="text-base font-medium">{action.label}</span>
                      </div>
                      {action.selected && (
                        <Check size={20} className="text-accent-green" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Destructive Action */}
              {destructiveAction && (
                <button
                  onClick={() => handleAction(destructiveAction)}
                  className="w-full mt-2 px-4 py-3.5 bg-dark-secondary/95 backdrop-blur-sm 
                           rounded-2xl border border-dark-secondary/50
                           text-red-400 font-medium hover:bg-red-500/20 
                           active:bg-red-500/30 transition-colors touch-manipulation"
                >
                  <div className="flex items-center justify-center gap-3">
                    {destructiveAction.icon && (
                      <destructiveAction.icon size={20} />
                    )}
                    <span>{destructiveAction.label}</span>
                  </div>
                </button>
              )}

              {/* Cancel Button */}
              <button
                onClick={onClose}
                className="w-full mt-2 px-4 py-3.5 bg-dark-secondary/95 backdrop-blur-sm 
                         rounded-2xl border border-dark-secondary/50
                         text-text-primary font-semibold hover:bg-dark-primary/50 
                         active:bg-dark-primary/70 transition-colors touch-manipulation"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
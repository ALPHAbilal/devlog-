import { useState, useEffect } from 'react';
import { MoreVertical, Share2, Trash2, Eye, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MobileMenuPositioner from './MobileMenuPositioner';

export default function MobileFloatingActions({ 
  viewMode,
  onViewModeChange,
  onShare,
  onDelete,
  isVisible = true,
  scrollContainerRef
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [fabRef, setFabRef] = useState(null);
  const [showFab, setShowFab] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  
  // Handle scroll to show/hide FAB
  useEffect(() => {
    const scrollElement = scrollContainerRef?.current;
    if (!scrollElement) return;
    
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = scrollElement.scrollTop;
          
          // Hide FAB when scrolling down, show when scrolling up or at top
          if (currentScrollY > lastScrollY && currentScrollY > 100) {
            setShowFab(false);
          } else {
            setShowFab(true);
          }
          
          setLastScrollY(currentScrollY);
          ticking = false;
        });
        ticking = true;
      }
    };
    
    scrollElement.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollElement.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, scrollContainerRef]);
  
  if (!isVisible) return null;
  
  return (
    <>
      {/* Floating Action Button */}
      <AnimatePresence>
        {showFab && !isOpen && (
          <motion.button
            ref={setFabRef}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 w-14 h-14 
                     bg-dark-secondary/90 backdrop-blur-xl
                     border border-dark-secondary/30
                     rounded-full shadow-lg shadow-black/30
                     flex items-center justify-center
                     text-text-secondary hover:text-text-primary
                     hover:bg-dark-secondary
                     hover:shadow-xl hover:shadow-black/40
                     active:scale-95 transition-all duration-200
                     z-40"
            style={{ 
              bottom: `calc(1.5rem + env(safe-area-inset-bottom, 0px))`,
              touchAction: 'manipulation'
            }}
          >
            <MoreVertical size={20} />
          </motion.button>
        )}
      </AnimatePresence>
      
      {/* Actions Menu */}
      <MobileMenuPositioner
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        anchorRef={{ current: fabRef }}
        preferredPosition="auto"
        className="w-full max-w-sm mx-4"
        fullScreenOnMobile={true}
      >
        <div className="p-4 space-y-3">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            Document Actions
          </h3>
          
          {/* View Mode Toggle */}
          <div className="bg-dark-secondary/30 rounded-xl p-1 flex gap-1">
            <button
              onClick={() => {
                onViewModeChange('blocks');
                setIsOpen(false);
              }}
              className={`flex-1 flex items-center justify-center gap-2 
                       py-3 px-4 rounded-lg transition-all duration-200 ${
                viewMode === 'blocks'
                  ? 'bg-dark-primary text-accent-green shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Eye size={18} />
              <span className="font-medium">Blocks</span>
            </button>
            <button
              onClick={() => {
                onViewModeChange('lines');
                setIsOpen(false);
              }}
              className={`flex-1 flex items-center justify-center gap-2 
                       py-3 px-4 rounded-lg transition-all duration-200 ${
                viewMode === 'lines'
                  ? 'bg-dark-primary text-accent-green shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <FileText size={18} />
              <span className="font-medium">Lines</span>
            </button>
          </div>
          
          <div className="h-px bg-dark-secondary/30" />
          
          {/* Action Buttons */}
          <button
            onClick={() => {
              onShare();
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-3 p-4 
                     bg-dark-secondary/30 hover:bg-dark-secondary/50
                     rounded-xl transition-all duration-200
                     active:scale-98"
          >
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg 
                          flex items-center justify-center">
              <Share2 size={18} className="text-blue-400" />
            </div>
            <span className="text-text-primary font-medium">Share Document</span>
          </button>
          
          <button
            onClick={() => {
              onDelete();
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-3 p-4 
                     bg-red-500/10 hover:bg-red-500/20
                     rounded-xl transition-all duration-200
                     active:scale-98"
          >
            <div className="w-10 h-10 bg-red-500/20 rounded-lg 
                          flex items-center justify-center">
              <Trash2 size={18} className="text-red-400" />
            </div>
            <span className="text-red-400 font-medium">Delete Document</span>
          </button>
          
          {/* Cancel Button */}
          <button
            onClick={() => setIsOpen(false)}
            className="w-full p-4 text-text-secondary 
                     hover:bg-dark-secondary/30 rounded-xl
                     transition-all duration-200 mt-4"
          >
            Cancel
          </button>
        </div>
      </MobileMenuPositioner>
    </>
  );
}
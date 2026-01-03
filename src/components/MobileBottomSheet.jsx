import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { useResponsive } from '@/shared/hooks';

export default function MobileBottomSheet({ 
  isOpen, 
  onClose, 
  title, 
  children,
  height = 'auto',
  showHandle = true 
}) {
  const sheetRef = useRef(null);
  const contentRef = useRef(null);
  const [sheetHeight, setSheetHeight] = useState(0);
  const { getSafeAreaInsets } = useResponsive();
  const safeAreaInsets = getSafeAreaInsets();
  
  const y = useMotionValue(0);
  const bgOpacity = useTransform(y, [0, sheetHeight], [0.5, 0]);
  
  // Calculate sheet height based on content
  useEffect(() => {
    if (isOpen && contentRef.current) {
      // Add a small delay to ensure content is rendered
      const timer = setTimeout(() => {
        if (contentRef.current) {
          const contentHeight = contentRef.current.scrollHeight;
          const viewportHeight = window.innerHeight;
          
          // Ensure we leave space at top for visual context
          const minTopSpace = Math.max(80, safeAreaInsets.top + 40);
          const maxHeight = viewportHeight - minTopSpace;
          const minHeight = 200; // Minimum height
          
          // Account for drag handle, header, and safe areas
          const totalPadding = (showHandle ? 40 : 0) + (title ? 60 : 0) + Math.max(safeAreaInsets.bottom, 20) + 20;
          
          const calculatedHeight = Math.max(
            minHeight,
            Math.min(contentHeight + totalPadding, maxHeight)
          );
          
          setSheetHeight(calculatedHeight);
        }
      }, 50);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, children, safeAreaInsets.bottom, showHandle, title]);
  
  // Handle drag to close
  const handleDragEnd = (event, info) => {
    const shouldClose = info.velocity.y > 20 || info.offset.y > sheetHeight * 0.3;
    
    if (shouldClose) {
      animate(y, sheetHeight, {
        type: "spring",
        stiffness: 300,
        damping: 30,
        onComplete: onClose
      });
    } else {
      animate(y, 0, {
        type: "spring",
        stiffness: 300,
        damping: 30
      });
    }
  };
  
  // Close on backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleBackdropClick}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
            style={{ opacity: bgOpacity }}
          />
          
          {/* Bottom Sheet */}
          <motion.div
            ref={sheetRef}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            drag="y"
            dragDirectionLock
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.3 }}
            onDragEnd={handleDragEnd}
            style={{ 
              y, 
              height: height === 'auto' ? sheetHeight : height,
              maxHeight: `calc(100vh - ${Math.max(80, safeAreaInsets.top + 40)}px)`,
              minHeight: '200px'
            }}
            className="fixed bottom-0 left-0 right-0 bg-dark-primary/98
                     backdrop-blur-xl rounded-t-3xl shadow-2xl z-[101] 
                     overflow-hidden border-t border-dark-secondary/30"
          >
            {/* Drag Handle */}
            {showHandle && (
              <div className="pt-3 pb-2 touch-manipulation">
                <div className="w-12 h-1 bg-dark-secondary/50 rounded-full mx-auto" />
              </div>
            )}
            
            {/* Header */}
            {title && (
              <div className="px-6 pb-3 border-b border-dark-secondary/20">
                <h3 className="text-lg font-semibold text-text-primary text-center">
                  {title}
                </h3>
              </div>
            )}
            
            {/* Content */}
            <div 
              ref={contentRef}
              className="overflow-y-auto overscroll-contain 
                       scrollbar-thin scrollbar-thumb-dark-secondary/50 
                       scrollbar-track-transparent"
              style={{ 
                maxHeight: `calc(${sheetHeight}px - ${(showHandle ? 40 : 0) + (title ? 60 : 0)}px)`,
                paddingBottom: safeAreaInsets.bottom + 20,
                WebkitOverflowScrolling: 'touch'
              }}
            >
              <div className="min-h-full">
                {children}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
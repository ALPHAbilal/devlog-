import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { X, ChevronDown } from 'lucide-react';

export default function MobileBottomSheet({ 
  isOpen, 
  onClose, 
  children, 
  title,
  snapPoints = ['50%', '90%'],
  defaultSnap = 0
}) {
  const [currentSnap, setCurrentSnap] = useState(defaultSnap);
  const [isDragging, setIsDragging] = useState(false);
  const sheetRef = useRef(null);
  const dragStartY = useRef(0);
  const sheetStartY = useRef(0);
  const controls = useAnimation();

  // Handle drag gestures
  const handleDragStart = (e) => {
    setIsDragging(true);
    const touch = e.touches?.[0] || e;
    dragStartY.current = touch.clientY;
    sheetStartY.current = sheetRef.current?.getBoundingClientRect().top || 0;
  };

  const handleDragMove = (e) => {
    if (!isDragging) return;
    
    const touch = e.touches?.[0] || e;
    const deltaY = touch.clientY - dragStartY.current;
    const newY = Math.max(0, sheetStartY.current + deltaY);
    
    // Apply resistance when dragging past bounds
    const resistance = newY < 100 ? 0.5 : 1;
    const finalY = newY * resistance;
    
    if (sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${finalY}px)`;
    }
  };

  const handleDragEnd = (e) => {
    if (!isDragging) return;
    setIsDragging(false);
    
    const touch = e.changedTouches?.[0] || e;
    const deltaY = touch.clientY - dragStartY.current;
    const velocity = deltaY / (Date.now() - dragStartY.current);
    
    // Determine snap point based on drag distance and velocity
    if (deltaY > 100 || velocity > 0.5) {
      // Close if dragged down significantly
      onClose();
    } else if (deltaY < -100 || velocity < -0.5) {
      // Snap to next point if dragged up
      const nextSnap = Math.min(currentSnap + 1, snapPoints.length - 1);
      setCurrentSnap(nextSnap);
    } else {
      // Return to current snap point
      snapToPoint(currentSnap);
    }
  };

  const snapToPoint = (index) => {
    const snapPoint = snapPoints[index];
    const windowHeight = window.innerHeight;
    let translateY = 0;
    
    if (snapPoint.endsWith('%')) {
      const percentage = parseInt(snapPoint) / 100;
      translateY = windowHeight * (1 - percentage);
    } else if (snapPoint.endsWith('px')) {
      translateY = windowHeight - parseInt(snapPoint);
    }
    
    controls.start({
      y: translateY,
      transition: {
        type: 'spring',
        damping: 30,
        stiffness: 300
      }
    });
  };

  useEffect(() => {
    if (isOpen) {
      snapToPoint(currentSnap);
    }
  }, [isOpen, currentSnap]);

  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
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
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />

          {/* Bottom Sheet */}
          <motion.div
            ref={sheetRef}
            initial={{ y: '100%' }}
            animate={controls}
            exit={{ y: '100%' }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragStart={handleDragStart}
            onDrag={handleDragMove}
            onDragEnd={handleDragEnd}
            className="fixed bottom-0 left-0 right-0 bg-dark-primary 
                       rounded-t-3xl shadow-2xl z-50 overflow-hidden
                       border-t border-dark-secondary/50"
            style={{
              height: '95vh',
              maxHeight: '95vh',
              touchAction: 'none'
            }}
          >
            {/* Drag Handle */}
            <div className="absolute top-0 left-0 right-0 h-6 cursor-grab active:cursor-grabbing">
              <div className="w-12 h-1 bg-dark-secondary/50 rounded-full 
                             mx-auto mt-2 hover:bg-dark-secondary/70 transition-colors" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 mt-2 
                           border-b border-dark-secondary/30">
              <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-dark-secondary/40 rounded-lg transition-colors"
              >
                <X size={20} className="text-text-secondary" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
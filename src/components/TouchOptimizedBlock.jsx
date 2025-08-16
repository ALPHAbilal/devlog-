import { useState, useRef, useEffect } from 'react';
import { 
  GripVertical, Trash2, Copy, MoreVertical, 
  ChevronUp, ChevronDown, Edit2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTouchGestures } from '../hooks/useTouchGestures';

export default function TouchOptimizedBlock({
  block,
  children,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onEdit,
  canMoveUp,
  canMoveDown,
  isDragging,
  isSelected
}) {
  const [showActions, setShowActions] = useState(false);
  const [isSwipingLeft, setIsSwipingLeft] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const blockRef = useRef(null);

  // Touch gestures
  const gestureRef = useTouchGestures({
    onSwipeLeft: () => {
      setIsSwipingLeft(true);
      setSwipeOffset(-80);
    },
    onSwipeRight: () => {
      setIsSwipingLeft(false);
      setSwipeOffset(0);
    },
    onLongPress: () => {
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
      setShowActions(true);
    },
    threshold: 50
  });

  // Reset swipe on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (blockRef.current && !blockRef.current.contains(e.target)) {
        setIsSwipingLeft(false);
        setSwipeOffset(0);
        setShowActions(false);
      }
    };

    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div 
      ref={blockRef}
      className="relative mb-3"
    >
      {/* Swipe Actions */}
      <div className="absolute inset-y-0 right-0 flex items-center pr-2 z-10">
        <AnimatePresence>
          {isSwipingLeft && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              onClick={() => {
                onDelete();
                setIsSwipingLeft(false);
                setSwipeOffset(0);
              }}
              className="w-16 h-full bg-red-500 rounded-lg flex items-center 
                       justify-center active:bg-red-600 transition-colors"
            >
              <Trash2 size={20} className="text-white" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Main Block Container */}
      <motion.div
        ref={gestureRef}
        animate={{ x: swipeOffset }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className={`relative bg-dark-secondary/40 rounded-lg overflow-hidden
                   ${isDragging ? 'opacity-50' : ''}
                   ${isSelected ? 'ring-2 ring-accent-green' : ''}
                   touch-manipulation`}
      >
        {/* Touch Handle */}
        <div className="absolute left-0 top-0 bottom-0 w-8 flex items-center 
                      justify-center cursor-grab active:cursor-grabbing
                      md:opacity-0 md:hover:opacity-100 transition-opacity">
          <GripVertical size={16} className="text-text-secondary/50" />
        </div>

        {/* Content */}
        <div className="pl-8 pr-12 py-3">
          {children}
        </div>

        {/* Quick Actions Button */}
        <button
          onClick={() => setShowActions(!showActions)}
          className="absolute right-2 top-2 p-2 rounded-lg 
                   hover:bg-dark-primary/50 active:bg-dark-primary/70
                   transition-colors md:opacity-0 md:group-hover:opacity-100"
        >
          <MoreVertical size={16} className="text-text-secondary" />
        </button>

        {/* Action Menu */}
        <AnimatePresence>
          {showActions && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              className="absolute right-2 top-10 bg-dark-primary rounded-lg 
                       shadow-xl border border-dark-secondary/50 z-20
                       overflow-hidden min-w-[160px]"
            >
              <button
                onClick={() => {
                  onEdit();
                  setShowActions(false);
                }}
                className="w-full px-4 py-3 flex items-center gap-3
                         hover:bg-dark-secondary/50 active:bg-dark-secondary/70
                         transition-colors text-left"
              >
                <Edit2 size={16} className="text-text-secondary" />
                <span className="text-sm text-text-primary">Edit</span>
              </button>

              <button
                onClick={() => {
                  onDuplicate();
                  setShowActions(false);
                }}
                className="w-full px-4 py-3 flex items-center gap-3
                         hover:bg-dark-secondary/50 active:bg-dark-secondary/70
                         transition-colors text-left"
              >
                <Copy size={16} className="text-text-secondary" />
                <span className="text-sm text-text-primary">Duplicate</span>
              </button>

              <div className="border-t border-dark-secondary/30" />

              <button
                onClick={() => {
                  onMoveUp();
                  setShowActions(false);
                }}
                disabled={!canMoveUp}
                className="w-full px-4 py-3 flex items-center gap-3
                         hover:bg-dark-secondary/50 active:bg-dark-secondary/70
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-colors text-left"
              >
                <ChevronUp size={16} className="text-text-secondary" />
                <span className="text-sm text-text-primary">Move Up</span>
              </button>

              <button
                onClick={() => {
                  onMoveDown();
                  setShowActions(false);
                }}
                disabled={!canMoveDown}
                className="w-full px-4 py-3 flex items-center gap-3
                         hover:bg-dark-secondary/50 active:bg-dark-secondary/70
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-colors text-left"
              >
                <ChevronDown size={16} className="text-text-secondary" />
                <span className="text-sm text-text-primary">Move Down</span>
              </button>

              <div className="border-t border-dark-secondary/30" />

              <button
                onClick={() => {
                  onDelete();
                  setShowActions(false);
                }}
                className="w-full px-4 py-3 flex items-center gap-3
                         hover:bg-red-500/20 active:bg-red-500/30
                         transition-colors text-left text-red-400"
              >
                <Trash2 size={16} />
                <span className="text-sm">Delete</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute -left-1 top-0 bottom-0 w-1 bg-accent-green 
                      rounded-full animate-pulse" />
      )}
    </div>
  );
}
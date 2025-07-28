import { useState, useRef } from 'react';
import { MoreHorizontal, Trash2, Copy, ChevronUp, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTouchGestures } from '../hooks/useTouchGestures';
import MobileBottomSheet from './MobileBottomSheet';

export default function MobileBlockControls({ 
  children, 
  block,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSwipedLeft, setIsSwipedLeft] = useState(false);
  const blockRef = useRef(null);
  
  // Handle long press to show menu
  useTouchGestures(blockRef, {
    onLongPress: () => {
      setShowMenu(true);
      // Haptic feedback
      if (navigator.vibrate) navigator.vibrate(10);
    },
    onSwipeLeft: () => {
      setIsSwipedLeft(true);
      if (navigator.vibrate) navigator.vibrate(5);
    },
    onSwipeRight: () => {
      setIsSwipedLeft(false);
    },
    longPressTimeout: 500,
    swipeThreshold: 50
  });
  
  const handleDelete = () => {
    setShowMenu(false);
    setShowDeleteConfirm(true);
  };
  
  const confirmDelete = () => {
    setShowDeleteConfirm(false);
    setIsSwipedLeft(false);
    onDelete(block.id);
  };
  
  
  return (
    <>
      <motion.div 
        ref={blockRef}
        className="relative touch-manipulation"
        animate={{ x: isSwipedLeft ? -80 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Block Content */}
        <div className="relative">
          {children}
        </div>
        
        {/* Quick Actions Button */}
        <button
          onClick={() => setShowMenu(true)}
          className="absolute -right-2 top-2 p-2 text-text-secondary/50 
                     hover:text-text-secondary active:scale-90 transition-all"
        >
          <MoreHorizontal size={16} />
        </button>
        
        {/* Swipe Delete Action */}
        <AnimatePresence>
          {isSwipedLeft && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute right-0 top-0 bottom-0 w-20 
                       bg-red-500/20 flex items-center justify-center"
              onClick={handleDelete}
            >
              <Trash2 size={20} className="text-red-400" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      
      {/* Block Actions Menu */}
      <MobileBottomSheet
        isOpen={showMenu}
        onClose={() => setShowMenu(false)}
        title="Block Actions"
      >
        <div className="p-4 space-y-2">
          {/* Action Buttons */}
          <button
            onClick={() => {
              onDuplicate(block.id);
              setShowMenu(false);
            }}
            className="w-full p-4 bg-dark-secondary rounded-xl text-left 
                     hover:bg-dark-secondary/80 active:scale-98 transition-all
                     flex items-center gap-3"
          >
            <Copy size={20} className="text-text-secondary" />
            <span>Duplicate Block</span>
          </button>
          
          <button
            onClick={() => {
              if (canMoveUp) {
                onMoveUp(block.id);
                setShowMenu(false);
              }
            }}
            disabled={!canMoveUp}
            className={`w-full p-4 rounded-xl text-left transition-all
                     flex items-center gap-3 min-h-[56px]
                     ${
                       canMoveUp
                         ? 'bg-dark-secondary hover:bg-dark-secondary/80 active:scale-98 text-text-primary'
                         : 'bg-dark-secondary/30 opacity-50 cursor-not-allowed text-text-secondary'
                     }`}
          >
            <ChevronUp size={20} className={canMoveUp ? 'text-text-secondary' : 'text-text-secondary/50'} />
            <span>Move Up</span>
          </button>
          
          <button
            onClick={() => {
              if (canMoveDown) {
                onMoveDown(block.id);
                setShowMenu(false);
              }
            }}
            disabled={!canMoveDown}
            className={`w-full p-4 rounded-xl text-left transition-all
                     flex items-center gap-3 min-h-[56px]
                     ${
                       canMoveDown
                         ? 'bg-dark-secondary hover:bg-dark-secondary/80 active:scale-98 text-text-primary'
                         : 'bg-dark-secondary/30 opacity-50 cursor-not-allowed text-text-secondary'
                     }`}
          >
            <ChevronDown size={20} className={canMoveDown ? 'text-text-secondary' : 'text-text-secondary/50'} />
            <span>Move Down</span>
          </button>
          
          <button
            onClick={handleDelete}
            className="w-full p-4 bg-red-500/10 rounded-xl text-left 
                     hover:bg-red-500/20 active:scale-98 transition-all
                     flex items-center gap-3 min-h-[56px]"
          >
            <Trash2 size={20} className="text-red-400" />
            <span className="text-red-400">Delete Block</span>
          </button>
        </div>
      </MobileBottomSheet>
      
      {/* Delete Confirmation */}
      <MobileBottomSheet
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Block?"
      >
        <div className="p-6">
          <p className="text-text-secondary mb-6 text-center">
            Are you sure you want to delete this block? This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 p-3 bg-dark-secondary rounded-xl
                       hover:bg-dark-secondary/80 active:scale-98 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="flex-1 p-3 bg-red-500/20 text-red-400 rounded-xl
                       hover:bg-red-500/30 active:scale-98 transition-all"
            >
              Delete
            </button>
          </div>
        </div>
      </MobileBottomSheet>
    </>
  );
}
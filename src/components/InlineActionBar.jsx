import { useState, useEffect, useRef, useCallback } from 'react';

// Custom hook for click-outside dismissal that actually works
export const useClickOutside = (callback, deps = []) => {
  const ref = useRef();
  const callbackRef = useRef(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const handleClick = (event) => {
      // Handle portal elements
      const portalRoot = document.getElementById('portal-root');
      const clickedInPortal = portalRoot?.contains(event.target);
      
      if (ref.current && 
          !ref.current.contains(event.target) && 
          !clickedInPortal) {
        callbackRef.current(event);
      }
    };

    // Use capture phase to intercept before any stopPropagation
    document.addEventListener('mousedown', handleClick, true);
    document.addEventListener('touchstart', handleClick, true);
    
    return () => {
      document.removeEventListener('mousedown', handleClick, true);
      document.removeEventListener('touchstart', handleClick, true);
    };
  }, deps);

  return ref;
};

export default function InlineActionBar({ 
  onDelete, 
  onDuplicate, 
  onMoveUp, 
  onMoveDown,
  canMoveUp,
  canMoveDown,
  onDragStart,
  onDragEnd,
  blockId,
  isVisible = false
}) {
  const [showActions, setShowActions] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeAction, setActiveAction] = useState(null);
  const hideTimeoutRef = useRef(null);
  
  // Detect mobile/touch devices
  useEffect(() => {
    const checkMobile = () => {
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth < 768;
      setIsMobile(isTouchDevice || isSmallScreen);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle mouse enter with timeout cleanup
  const handleMouseEnter = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setShowActions(true);
  }, []);
  
  // Handle mouse leave with delay to prevent flicker
  const handleMouseLeave = useCallback(() => {
    hideTimeoutRef.current = setTimeout(() => {
      setShowActions(false);
      setActiveAction(null);
    }, 100);
  }, []);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  // Determine if actions should be shown
  const shouldShow = isVisible || showActions || isMobile;

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!shouldShow) return;
    
    switch (e.key) {
      case 'Escape':
        setShowActions(false);
        setActiveAction(null);
        break;
      case 'Delete':
      case 'Backspace':
        if (e.metaKey || e.ctrlKey) {
          e.preventDefault();
          onDelete();
        }
        break;
      case 'd':
        if (e.metaKey || e.ctrlKey) {
          e.preventDefault();
          onDuplicate?.();
        }
        break;
      case 'ArrowUp':
        if (e.metaKey || e.ctrlKey) {
          e.preventDefault();
          if (canMoveUp) onMoveUp?.();
        }
        break;
      case 'ArrowDown':
        if (e.metaKey || e.ctrlKey) {
          e.preventDefault();
          if (canMoveDown) onMoveDown?.();
        }
        break;
    }
  };

  // Action button component for consistent styling
  const ActionButton = ({ onClick, disabled, icon, label, danger = false }) => (
    <button
      onClick={(e) => {
        e.stopPropagation();
        setActiveAction(label);
        onClick();
        // Visual feedback
        setTimeout(() => setActiveAction(null), 150);
      }}
      disabled={disabled}
      className={`
        inline-action-button
        p-1.5 rounded-md transition-all duration-150
        ${disabled 
          ? 'opacity-30 cursor-not-allowed' 
          : danger
            ? 'hover:bg-red-500/20 hover:text-red-400'
            : 'hover:bg-white/10 hover:text-text-primary'
        }
        ${activeAction === label ? 'scale-95 bg-white/20' : ''}
        min-w-[32px] min-h-[32px] flex items-center justify-center
        focus:outline-none focus:ring-2 focus:ring-accent-green/50
      `}
      title={label}
      aria-label={label}
    >
      {icon}
    </button>
  );

  return (
    <>
      {/* Visual indicator dot */}
      {shouldShow && !isMobile && (
        <div
          style={{
            position: 'absolute',
            left: '-2.25rem',
            top: '0.5rem',
            width: '3px',
            height: '3px',
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.4)',
            boxShadow: '0 0 8px rgba(16, 185, 129, 0.3)',
            zIndex: 19,
            pointerEvents: 'none',
            transition: 'opacity 200ms ease-out'
          }}
        />
      )}
      
      <div 
        className={`inline-action-bar absolute flex flex-col items-center gap-0.5 ${isMobile ? 'always-visible' : ''}`}
        style={{
          position: 'absolute',
          left: '-3rem',
          top: '-0.5rem',
          zIndex: 20,
          padding: '0.25rem',
          // Visual design
          background: shouldShow ? 'rgba(10, 22, 40, 0.98)' : 'transparent',
          backdropFilter: shouldShow ? 'blur(12px)' : 'none',
          border: shouldShow ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid transparent',
          borderRadius: '0.75rem',
          boxShadow: shouldShow ? '0 8px 24px -4px rgba(0, 0, 0, 0.3), 0 2px 8px -2px rgba(0, 0, 0, 0.2)' : 'none',
          // Visibility control
          opacity: shouldShow ? 1 : 0,
          visibility: shouldShow ? 'visible' : 'hidden',
          pointerEvents: shouldShow ? 'auto' : 'none',
          transform: shouldShow ? 'translateY(0) scale(1)' : 'translateY(-8px) scale(0.95)',
          transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)'
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onKeyDown={handleKeyDown}
      role="toolbar"
      aria-label="Block actions"
    >
      {/* Drag Handle */}
      <div
        className="drag-handle p-1.5 rounded-md cursor-grab active:cursor-grabbing
                   text-text-secondary/50 hover:text-text-secondary/80
                   hover:bg-white/10 transition-all duration-150
                   min-w-[32px] min-h-[32px] flex items-center justify-center"
        draggable={true}
        onDragStart={(e) => {
          e.stopPropagation();
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', String(blockId));
          if (onDragStart) onDragStart(e);
        }}
        onDragEnd={(e) => {
          e.stopPropagation();
          if (onDragEnd) onDragEnd(e);
        }}
        title="Drag to reorder"
        aria-label="Drag to reorder"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="5" cy="12" r="1.5"></circle>
          <circle cx="12" cy="12" r="1.5"></circle>
          <circle cx="19" cy="12" r="1.5"></circle>
          <circle cx="5" cy="5" r="1.5"></circle>
          <circle cx="12" cy="5" r="1.5"></circle>
          <circle cx="19" cy="5" r="1.5"></circle>
          <circle cx="5" cy="19" r="1.5"></circle>
          <circle cx="12" cy="19" r="1.5"></circle>
          <circle cx="19" cy="19" r="1.5"></circle>
        </svg>
      </div>

      {/* Divider */}
      <div className="h-px w-6 bg-white/10 mx-1" />

      {/* Move Up */}
      <ActionButton
        onClick={() => onMoveUp?.()}
        disabled={!canMoveUp}
        label="Move up"
        icon={
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        }
      />

      {/* Move Down */}
      <ActionButton
        onClick={() => onMoveDown?.()}
        disabled={!canMoveDown}
        label="Move down"
        icon={
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M19 12l-7 7-7-7" />
          </svg>
        }
      />

      {/* Duplicate */}
      <ActionButton
        onClick={() => onDuplicate?.()}
        label="Duplicate"
        icon={
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        }
      />

      {/* Delete */}
      <ActionButton
        onClick={() => onDelete()}
        label="Delete"
        danger
        icon={
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
        }
      />
      </div>
    </>
  );
}
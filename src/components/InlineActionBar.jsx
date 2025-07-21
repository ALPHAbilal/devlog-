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
      if (ref.current && !ref.current.contains(event.target)) {
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
  const [showDropdown, setShowDropdown] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const hideTimeoutRef = useRef(null);
  const containerRef = useRef(null);
  
  // Use click outside hook for dropdown
  const dropdownRef = useClickOutside(() => {
    setShowDropdown(false);
  });
  
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

  // Extended hover handling with better zone coverage
  const handleMouseEnter = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setShowActions(true);
  }, []);
  
  const handleMouseLeave = useCallback((e) => {
    // Don't hide if moving to dropdown
    if (e.relatedTarget && containerRef.current?.contains(e.relatedTarget)) {
      return;
    }
    
    hideTimeoutRef.current = setTimeout(() => {
      setShowActions(false);
      setShowDropdown(false);
    }, 300); // Longer timeout for easier access
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
  const shouldShow = isVisible || showActions || isMobile || showDropdown;

  // Action button component
  const ActionButton = ({ onClick, icon, label, danger = false }) => (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`
        inline-action-button
        p-1.5 rounded-md transition-all duration-150
        ${danger
          ? 'hover:bg-red-500/20 hover:text-red-400 text-text-secondary/60'
          : 'hover:bg-white/10 hover:text-text-primary text-text-secondary/60'
        }
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
      {/* Invisible hover bridge to maintain hover state */}
      {shouldShow && (
        <div
          style={{
            position: 'absolute',
            left: '-4.5rem',
            top: '-0.5rem',
            width: '5rem',
            height: '8rem',
            pointerEvents: 'auto',
            zIndex: 19,
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        />
      )}
      
      {/* Compact action bar */}
      <div 
        ref={containerRef}
        className={`inline-action-bar absolute flex flex-col items-center gap-1 ${isMobile ? 'always-visible' : ''}`}
        style={{
          position: 'absolute',
          left: '-4.5rem',
          top: '-0.25rem',
          zIndex: 20,
          padding: '0.5rem',
          // Visual design
          background: shouldShow ? 'rgba(10, 22, 40, 0.9)' : 'transparent',
          backdropFilter: shouldShow ? 'blur(8px)' : 'none',
          border: shouldShow ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid transparent',
          borderRadius: '0.5rem',
          boxShadow: shouldShow ? '0 4px 12px -2px rgba(0, 0, 0, 0.2)' : 'none',
          // Visibility control
          opacity: shouldShow ? 1 : 0,
          visibility: shouldShow ? 'visible' : 'hidden',
          pointerEvents: shouldShow ? 'auto' : 'none',
          transform: shouldShow ? 'scale(1)' : 'scale(0.95)',
          transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)'
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        role="toolbar"
        aria-label="Block actions"
      >
        {/* Menu button for secondary actions */}
        <div className="relative">
          <ActionButton
            onClick={() => setShowDropdown(!showDropdown)}
            label="More actions"
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="5" r="1"></circle>
                <circle cx="12" cy="12" r="1"></circle>
                <circle cx="12" cy="19" r="1"></circle>
              </svg>
            }
          />
          
          {/* Dropdown menu */}
          {showDropdown && (
            <div
              ref={dropdownRef}
              className="absolute left-full top-0 ml-2 z-50
                         bg-dark-primary/95 backdrop-blur-sm rounded-lg 
                         border border-dark-secondary/50 shadow-xl
                         py-1 min-w-[160px]
                         animate-in fade-in slide-in-from-left-1 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drag handle */}
              <div
                className="flex items-center gap-2 px-3 py-2 cursor-grab hover:bg-dark-secondary/50
                           text-text-secondary hover:text-text-primary text-sm"
                draggable={true}
                onDragStart={(e) => {
                  e.stopPropagation();
                  e.dataTransfer.effectAllowed = 'move';
                  e.dataTransfer.setData('text/plain', String(blockId));
                  setShowDropdown(false);
                  if (onDragStart) onDragStart(e);
                }}
                onDragEnd={(e) => {
                  e.stopPropagation();
                  if (onDragEnd) onDragEnd(e);
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="5" cy="12" r="1"></circle>
                  <circle cx="12" cy="12" r="1"></circle>
                  <circle cx="19" cy="12" r="1"></circle>
                  <circle cx="5" cy="5" r="1"></circle>
                  <circle cx="12" cy="5" r="1"></circle>
                  <circle cx="19" cy="5" r="1"></circle>
                </svg>
                <span>Drag to reorder</span>
              </div>
              
              {/* Move up */}
              <button
                onClick={() => {
                  onMoveUp?.();
                  setShowDropdown(false);
                }}
                disabled={!canMoveUp}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm
                           ${!canMoveUp 
                             ? 'opacity-50 cursor-not-allowed text-text-secondary/50' 
                             : 'hover:bg-dark-secondary/50 text-text-secondary hover:text-text-primary'
                           }`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 19V5M5 12l7-7 7 7" />
                </svg>
                <span>Move up</span>
              </button>
              
              {/* Move down */}
              <button
                onClick={() => {
                  onMoveDown?.();
                  setShowDropdown(false);
                }}
                disabled={!canMoveDown}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm
                           ${!canMoveDown
                             ? 'opacity-50 cursor-not-allowed text-text-secondary/50' 
                             : 'hover:bg-dark-secondary/50 text-text-secondary hover:text-text-primary'
                           }`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M19 12l-7 7-7-7" />
                </svg>
                <span>Move down</span>
              </button>
            </div>
          )}
        </div>

        {/* Duplicate - primary action */}
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

        {/* Delete - primary action */}
        <ActionButton
          onClick={() => onDelete()}
          label="Delete"
          danger
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
            </svg>
          }
        />
      </div>
    </>
  );
}
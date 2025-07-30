import { useState, useEffect, useRef, useCallback } from 'react';

// Custom hook for click-outside dismissal
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
  const [showMenu, setShowMenu] = useState(false);
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

  // Hover handling
  const handleMouseEnter = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setShowMenu(true);
  }, []);
  
  const handleMouseLeave = useCallback((e) => {
    // Don't hide if moving to dropdown
    if (e.relatedTarget && containerRef.current && e.relatedTarget instanceof Node && containerRef.current.contains(e.relatedTarget)) {
      return;
    }
    
    hideTimeoutRef.current = setTimeout(() => {
      setShowMenu(false);
      setShowDropdown(false);
    }, 300);
  }, []);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  // Determine if menu should be shown
  const shouldShow = isVisible || showMenu || isMobile || showDropdown;

  return (
    <>
      {/* Invisible hover bridge */}
      {shouldShow && (
        <div
          style={{
            position: 'absolute',
            left: '-4rem',
            top: '-0.5rem',
            width: '5rem',
            height: '3rem',
            pointerEvents: 'auto',
            zIndex: 49,
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        />
      )}
      
      {/* Single three dots button */}
      <div 
        ref={containerRef}
        className={`inline-action-bar absolute ${isMobile ? 'always-visible' : ''}`}
        style={{
          position: 'absolute',
          left: '-3rem',
          top: '0rem',
          zIndex: 50,
          // Visibility control
          opacity: shouldShow ? 1 : 0,
          visibility: shouldShow ? 'visible' : 'hidden',
          pointerEvents: shouldShow ? 'auto' : 'none',
          transform: shouldShow ? 'scale(1)' : 'scale(0.9)',
          transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)'
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="p-1.5 rounded-lg transition-all duration-150
                     text-text-secondary/40 hover:text-text-secondary/70
                     hover:bg-dark-secondary/30 hover:scale-110
                     min-w-[32px] min-h-[32px] flex items-center justify-center
                     focus:outline-none focus:ring-2 focus:ring-accent-green/50"
          style={{
            background: showDropdown ? 'rgba(30, 58, 95, 0.3)' : 'transparent',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}
          title="Block actions"
          aria-label="Block actions"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="5" r="1.5"></circle>
            <circle cx="12" cy="12" r="1.5"></circle>
            <circle cx="12" cy="19" r="1.5"></circle>
          </svg>
        </button>
        
        {/* Dropdown menu with all actions */}
        {showDropdown && (
          <div
            ref={dropdownRef}
            className="absolute right-full top-0 mr-2
                       bg-dark-primary/95 backdrop-blur-sm rounded-lg 
                       border border-dark-secondary/50 shadow-xl
                       py-1 min-w-[180px]
                       animate-in fade-in slide-in-from-right-1 duration-200"
            style={{
              zIndex: 9999,
              position: 'absolute'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Duplicate */}
            <button
              onClick={() => {
                onDuplicate?.();
                setShowDropdown(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm
                         hover:bg-dark-secondary/50 text-text-secondary hover:text-text-primary"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              <span>Duplicate</span>
            </button>
            
            {/* Divider */}
            <div className="h-px bg-dark-secondary/30 my-1" />
            
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
            
            {/* Divider */}
            <div className="h-px bg-dark-secondary/30 my-1" />
            
            {/* Delete */}
            <button
              onClick={() => {
                onDelete();
                setShowDropdown(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm
                         text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
              </svg>
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
}
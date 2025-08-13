import { useState, useEffect, useRef, useCallback } from 'react';
import MobileMenuPositioner from './MobileMenuPositioner';

export default function BlockControls({ 
  onDelete, 
  onDuplicate, 
  onMoveUp, 
  onMoveDown,
  isVisible,
  canMoveUp,
  canMoveDown,
  onDragStart,
  onDragEnd,
  blockId,
  onMenuToggle
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const hideTimeoutRef = useRef(null);
  const menuButtonRef = useRef(null);
  
  // Update parent when menu state changes
  useEffect(() => {
    if (onMenuToggle) {
      onMenuToggle(showMenu);
    }
  }, [showMenu, onMenuToggle]);
  
  // Handle mouse enter with timeout cleanup
  const handleMouseEnter = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setIsHovered(true);
  }, []);
  
  // Handle mouse leave with delay to prevent flicker
  const handleMouseLeave = useCallback((event) => {
    // Safely handle the event without using DOM contains
    // This fixes the "Failed to execute 'contains' on 'Node'" error
    hideTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
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
  
  // Debug mode detection
  const isDebugMode = typeof window !== 'undefined' && 
    window.location.search.includes('debug=blockcontrols');
  
  // Debug logging
  useEffect(() => {
    if (isDebugMode) {
      console.log('🔍 BlockControls Debug:', {
        blockId,
        rendered: true,
        isMobile,
        showMenu,
        cssFileCheck: document.styleSheets.length,
        timestamp: new Date().toISOString()
      });
      
      // Check if our CSS is loaded
      const hasBlockControlsCSS = Array.from(document.styleSheets).some(sheet => {
        try {
          return sheet.href && sheet.href.includes('block-controls.css');
        } catch (e) {
          return false;
        }
      });
      
      console.log('📋 CSS File Loaded:', hasBlockControlsCSS);
      
      // Log that we're using Unicode icons
      console.log('🎨 Using Unicode icons instead of Lucide');
      
      // Check DOM elements
      setTimeout(() => {
        const controlsElement = document.querySelector(`[data-block-id="${blockId}"] .block-controls`);
        if (controlsElement) {
          console.log('📦 BlockControls DOM:', {
            element: controlsElement,
            children: controlsElement.children.length,
            innerHTML: controlsElement.innerHTML.substring(0, 100) + '...',
            computedStyle: {
              display: getComputedStyle(controlsElement).display,
              opacity: getComputedStyle(controlsElement).opacity,
              width: getComputedStyle(controlsElement).width,
              height: getComputedStyle(controlsElement).height
            }
          });
        }
      }, 100);
    }
  }, [isDebugMode, blockId, isMobile, showMenu]);

  // Detect if we're on mobile or touch device
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

  // Determine if controls should be shown
  const shouldShow = isVisible || isHovered || isMobile || isDebugMode || showMenu || showControls;
  
  // Log for production debugging
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hostname === 'www.devlog.design') {
      console.log('[BlockControls Production Debug]', {
        blockId,
        isVisible,
        isHovered,
        showControls,
        showMenu,
        shouldShow,
        timestamp: new Date().toISOString()
      });
    }
  }, [blockId, isVisible, isHovered, showControls, showMenu, shouldShow]);

  return (
    <>
      {/* Always-visible trigger button (enterprise pattern) */}
      <button
        className={`block-controls-trigger absolute p-1 rounded-lg
                   text-text-secondary/30 hover:text-text-secondary/70
                   hover:bg-dark-secondary/30 hover:scale-110
                   transition-all duration-200 ease-out
                   ${showControls || showMenu ? 'active bg-dark-secondary/50 text-text-secondary scale-110' : ''}`}
        style={{
          position: 'absolute',
          left: '-3.5rem',
          top: '0.5rem',
          zIndex: 20,
          width: '28px',
          height: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          // Always visible, following enterprise patterns
          opacity: 1,
          visibility: 'visible',
          pointerEvents: 'auto',
          // Visual refinements
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}
        onClick={() => setShowControls(!showControls)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        title="Block options"
        aria-label="Block options"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="1"></circle>
          <circle cx="12" cy="5" r="1"></circle>
          <circle cx="12" cy="19" r="1"></circle>
        </svg>
      </button>

      {/* Controls panel - shown on trigger click or hover */}
      <div 
        className={`block-controls absolute flex flex-col items-start gap-0.5 ${isMobile ? 'show-always' : ''} ${isDebugMode ? 'debug-visible' : ''}`}
        style={{ 
          // Explicit positioning as fallback for Tailwind purging
          position: 'absolute',
          left: '-3.75rem',
          top: '3rem',
          zIndex: 20,
          minHeight: '44px',
          padding: '0.5rem',
          // Enterprise pattern: never remove from DOM, use visibility
          visibility: shouldShow ? 'visible' : 'hidden',
          opacity: shouldShow ? 1 : 0,
          pointerEvents: shouldShow ? 'auto' : 'none',
          transform: shouldShow ? 'translateY(0) scale(1)' : 'translateY(-4px) scale(0.95)',
          transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
          // Enhanced visual styling
          background: 'rgba(10, 22, 40, 0.98)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '0.75rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
          ...(isDebugMode ? { border: '2px dashed blue', background: 'rgba(0,0,255,0.1)' } : {})
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={(e) => e.stopPropagation()}>
      {/* Drag Handle */}
      <div className="flex flex-col gap-1 py-2">
        <div
          className="drag-handle p-1.5 rounded-md cursor-grab active:cursor-grabbing
                     text-text-secondary/50 hover:text-text-secondary/80
                     hover:bg-white/5 transition-all duration-150
                     min-w-[36px] min-h-[36px] 
                     flex items-center justify-center"
          title="Drag to reorder"
          draggable={true}
          onDragStart={(e) => {
            // Stop propagation to prevent parent handlers
            e.stopPropagation();
            // Set the drag data
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', String(blockId));
            // Set a drag image to prevent default ghost image issues
            const dragImage = new Image();
            dragImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
            e.dataTransfer.setDragImage(dragImage, 0, 0);
            if (onDragStart) onDragStart(e);
          }}
          onDragEnd={(e) => {
            e.stopPropagation();
            if (onDragEnd) onDragEnd(e);
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
            <circle cx="5" cy="12" r="1"></circle>
            <circle cx="12" cy="12" r="1"></circle>
            <circle cx="19" cy="12" r="1"></circle>
            <circle cx="5" cy="5" r="1"></circle>
            <circle cx="12" cy="5" r="1"></circle>
            <circle cx="19" cy="5" r="1"></circle>
            <circle cx="5" cy="19" r="1"></circle>
            <circle cx="12" cy="19" r="1"></circle>
            <circle cx="19" cy="19" r="1"></circle>
          </svg>
        </div>

        {/* More Options */}
        <div className="relative" ref={menuButtonRef}>
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 rounded-md
                       text-text-secondary/50 hover:text-text-secondary/80
                       hover:bg-white/5 transition-all duration-150
                       min-w-[36px] min-h-[36px] 
                       flex items-center justify-center"
            title="More options"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="19" cy="12" r="1"></circle>
              <circle cx="5" cy="12" r="1"></circle>
            </svg>
          </button>

          {/* Dropdown Menu - Mobile Aware */}
          <MobileMenuPositioner
            isOpen={showMenu}
            onClose={() => setShowMenu(false)}
            triggerRef={menuButtonRef}
            preferredPosition={isMobile ? 'auto' : 'bottom'}
            className="block-controls-dropdown"
            showBackdrop={true}
            zIndex={150}
          >
            <div className="bg-dark-primary/98 backdrop-blur-xl rounded-xl 
                            border border-dark-secondary/30 shadow-2xl
                            py-1 overflow-hidden">
              {/* Move Up */}
              {canMoveUp && (
                <button
                  onClick={() => {
                    onMoveUp?.();
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 md:py-1.5 text-left text-sm
                             text-text-secondary hover:text-text-primary
                             hover:bg-dark-primary/50 transition-colors
                             flex items-center gap-2 min-h-[44px] md:min-h-0"
                >
                  <span style={{fontSize: '14px'}}>↑</span>
                  Move up
                </button>
              )}

              {/* Move Down */}
              {canMoveDown && (
                <button
                  onClick={() => {
                    onMoveDown?.();
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 md:py-1.5 text-left text-sm
                             text-text-secondary hover:text-text-primary
                             hover:bg-dark-primary/50 transition-colors
                             flex items-center gap-2 min-h-[44px] md:min-h-0"
                >
                  <span style={{fontSize: '14px'}}>↓</span>
                  Move down
                </button>
              )}

              {/* Divider */}
              {(canMoveUp || canMoveDown) && (
                <div className="h-px bg-dark-secondary/50 my-1" />
              )}

              {/* Duplicate */}
              <button
                onClick={() => {
                  onDuplicate?.();
                  setShowMenu(false);
                }}
                className="w-full px-3 py-2 md:py-1.5 text-left text-sm
                           text-text-secondary hover:text-text-primary
                           hover:bg-dark-primary/50 transition-colors
                           flex items-center gap-2 min-h-[44px] md:min-h-0"
              >
                <span style={{fontSize: '14px'}}>📋</span>
                Duplicate
              </button>

              {/* Delete */}
              <button
                onClick={() => {
                  onDelete();
                  setShowMenu(false);
                }}
                className="w-full px-3 py-2 md:py-1.5 text-left text-sm
                           text-red-400 hover:text-red-300
                           hover:bg-red-500/10 transition-colors
                           flex items-center gap-2 min-h-[44px] md:min-h-0"
              >
                <span style={{fontSize: '14px'}}>🗑</span>
                Delete
              </button>
            </div>
          </MobileMenuPositioner>
        </div>
      </div>
    </div>
    </>
  );
}
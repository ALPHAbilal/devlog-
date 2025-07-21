import { useState, useEffect, useRef, useCallback } from 'react';

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
  const [isMobile, setIsMobile] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const hideTimeoutRef = useRef(null);
  
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
  const handleMouseLeave = useCallback(() => {
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
  const shouldShow = isVisible || isHovered || isMobile || isDebugMode || showMenu;

  return (
    <div 
      className={`block-controls absolute flex items-start gap-1 ${isMobile ? 'show-always' : ''} ${isDebugMode ? 'debug-visible' : ''} ${shouldShow ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
      style={{ 
        // Explicit positioning as fallback for Tailwind purging
        position: 'absolute',
        left: '-0.5rem',
        top: '0.25rem',
        zIndex: 20,
        minHeight: '44px', // Ensure touch targets are large enough
        // Inline styles for visibility control
        visibility: shouldShow ? 'visible' : 'hidden',
        opacity: shouldShow ? 1 : 0,
        pointerEvents: shouldShow ? 'auto' : 'none',
        transform: shouldShow ? 'scale(1)' : 'scale(0.95)',
        transition: 'opacity 200ms ease-out, transform 200ms ease-out, visibility 200ms ease-out',
        ...(isDebugMode ? { border: '2px dashed blue', background: 'rgba(0,0,255,0.1)' } : {})
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={(e) => e.stopPropagation()}>
      {/* Drag Handle */}
      <div className="flex flex-col gap-1 py-2">
        <div
          className="drag-handle p-2 md:p-1.5 rounded-md cursor-grab active:cursor-grabbing
                     text-text-secondary/40 hover:text-text-secondary
                     hover:bg-dark-secondary/50 transition-all duration-150
                     group min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 
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
          <span className="md:hidden text-base leading-none select-none pointer-events-none" style={{fontSize: '20px'}}>⋮⋮</span>
          <span className="hidden md:block text-sm leading-none select-none pointer-events-none" style={{fontSize: '16px'}}>⋮⋮</span>
        </div>

        {/* More Options */}
        <div className="relative">
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 md:p-1.5 rounded-md
                       text-text-secondary/40 hover:text-text-secondary
                       hover:bg-dark-secondary/50 transition-all duration-150
                       group min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 
                       flex items-center justify-center"
            title="More options"
          >
            <span className="md:hidden text-base leading-none select-none" style={{fontSize: '20px'}}>⋯</span>
            <span className="hidden md:block text-sm leading-none select-none" style={{fontSize: '16px'}}>⋯</span>
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <>
              {/* Click outside to close */}
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowMenu(false)}
              />
              
              <div className="absolute left-0 top-full mt-1 z-50
                              bg-dark-secondary/95 backdrop-blur-sm rounded-lg 
                              border border-dark-secondary/50 shadow-xl
                              py-1 min-w-[140px]
                              animate-in fade-in slide-in-from-top-1 duration-200">
                
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
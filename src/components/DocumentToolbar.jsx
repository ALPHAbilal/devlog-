import React, { useState, useEffect, useRef } from 'react';
import { Eye, FileText, Share2, Trash2, MoreHorizontal } from 'lucide-react';

export default function DocumentToolbar({ 
  viewMode, 
  onViewModeChange, 
  onShare, 
  onDelete,
  isVisible = true 
}) {
  const [isCompact, setIsCompact] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldShow, setShouldShow] = useState(true);
  const lastScrollY = useRef(0);
  const scrollTimeout = useRef(null);
  const hoverTimeout = useRef(null);

  // Handle scroll behavior
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          
          // Determine scroll direction and position
          if (currentScrollY > 100) {
            // Past threshold, go compact
            setIsCompact(true);
            
            // Hide on scroll down, show on scroll up
            if (currentScrollY > lastScrollY.current && currentScrollY > 200) {
              setShouldShow(false);
            } else {
              setShouldShow(true);
            }
          } else {
            // Near top, show full toolbar
            setIsCompact(false);
            setShouldShow(true);
          }
          
          lastScrollY.current = currentScrollY;
          ticking = false;

          // Auto-hide compact toolbar after inactivity
          if (isCompact && shouldShow) {
            clearTimeout(scrollTimeout.current);
            scrollTimeout.current = setTimeout(() => {
              if (window.scrollY > 200 && !isExpanded) {
                setShouldShow(false);
              }
            }, 3000);
          }
        });

        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial position

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout.current);
      clearTimeout(hoverTimeout.current);
    };
  }, [isCompact, isExpanded]);

  // Handle hover expansion
  const handleMouseEnter = () => {
    if (isCompact) {
      clearTimeout(hoverTimeout.current);
      setIsExpanded(true);
      setShouldShow(true);
    }
  };

  const handleMouseLeave = () => {
    if (isCompact) {
      hoverTimeout.current = setTimeout(() => {
        setIsExpanded(false);
      }, 300);
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed z-50 transition-all duration-300 ease-in-out ${
        shouldShow ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      } ${
        isCompact ? 'top-4 right-4' : 'top-20 right-6'
      }`}
      style={{
        // Ensure toolbar stays within viewport on mobile
        maxWidth: 'calc(100vw - 2rem)',
        right: 'max(1rem, env(safe-area-inset-right, 0px))'
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div 
        className={`
          bg-dark-primary/90 backdrop-blur-xl border border-dark-secondary/50
          rounded-2xl shadow-2xl transition-all duration-300
          ${isCompact && !isExpanded ? 'px-3 py-2' : 'px-4 py-3'}
          overflow-hidden
        `}
      >
        {(!isCompact || isExpanded) ? (
          // Full toolbar
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-dark-secondary/50 rounded-xl p-1">
              <button
                onClick={() => onViewModeChange('blocks')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200 ${
                  viewMode === 'blocks'
                    ? 'bg-accent-green text-dark-primary'
                    : 'text-text-secondary hover:text-text-primary hover:bg-dark-secondary/50'
                }`}
                title="Blocks view"
              >
                <Eye size={16} />
                <span className="text-sm font-medium">Blocks</span>
              </button>
              <button
                onClick={() => onViewModeChange('lines')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200 ${
                  viewMode === 'lines'
                    ? 'bg-accent-green text-dark-primary'
                    : 'text-text-secondary hover:text-text-primary hover:bg-dark-secondary/50'
                }`}
                title="Lines view"
              >
                <FileText size={16} />
                <span className="text-sm font-medium">Lines</span>
              </button>
            </div>

            {/* Divider */}
            <div className="w-px h-6 bg-dark-secondary/50" />

            {/* Action buttons */}
            <button
              onClick={onShare}
              className="p-2 text-text-secondary hover:text-text-primary 
                       hover:bg-dark-secondary/50 rounded-lg transition-all duration-200"
              title="Share document"
            >
              <Share2 size={18} />
            </button>
            <button
              onClick={onDelete}
              className="p-2 text-text-secondary hover:text-red-400 
                       hover:bg-dark-secondary/50 rounded-lg transition-all duration-200"
              title="Delete document"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ) : (
          // Compact mode
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-text-secondary">
              {viewMode === 'blocks' ? <Eye size={16} /> : <FileText size={16} />}
              <span className="text-sm">{viewMode === 'blocks' ? 'Blocks' : 'Lines'}</span>
            </div>
            <MoreHorizontal size={16} className="text-text-secondary" />
          </div>
        )}
      </div>

      {/* Pulse animation on first appear */}
      {isCompact && shouldShow && (
        <div className="absolute inset-0 rounded-2xl animate-pulse-once 
                      bg-accent-green/20 pointer-events-none" />
      )}
    </div>
  );
}
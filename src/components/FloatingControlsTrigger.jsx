import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Share2, Trash2, LayoutGrid, LayoutList } from 'lucide-react';

export default function FloatingControlsTrigger({ 
  viewMode, 
  onViewModeChange, 
  onShare, 
  onDelete,
  scrollThreshold = 100 // Show after scrolling past this point (lowered from 200)
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [justAppeared, setJustAppeared] = useState(false);
  const panelRef = useRef(null);

  // Handle scroll visibility
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const shouldShow = currentScrollY > scrollThreshold;
      
      // Add debug logging
      console.log('Scroll position:', currentScrollY, 'Should show:', shouldShow);
      
      if (shouldShow && !isVisible) {
        setJustAppeared(true);
        setTimeout(() => setJustAppeared(false), 1000);
      }
      
      setIsVisible(shouldShow);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial position

    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrollThreshold, isVisible]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && panelRef.current && !panelRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Don't render if not visible
  if (!isVisible) return null;

  return (
    <div ref={panelRef} className="fixed top-4 right-4 z-50">
      {/* Trigger Arrow Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          absolute top-0 right-0 
          w-12 h-12 rounded-full
          bg-accent-green backdrop-blur-sm
          border-2 border-accent-green
          flex items-center justify-center
          text-dark-primary
          hover:bg-accent-green/90
          hover:scale-110
          transition-all duration-200
          shadow-lg hover:shadow-xl shadow-accent-green/20
          ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}
          ${justAppeared ? 'animate-pulse' : ''}
        `}
        title="Quick actions"
      >
        <ChevronLeft 
          size={20} 
          className={`transition-transform duration-200 font-bold ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Controls Panel */}
      <div
        className={`
          absolute top-0 right-0
          bg-dark-secondary/95 backdrop-blur-xl
          border border-dark-secondary/50
          rounded-2xl shadow-2xl
          transition-all duration-300 ease-out
          ${isOpen 
            ? 'opacity-100 translate-x-0 scale-100' 
            : 'opacity-0 translate-x-full scale-95 pointer-events-none'
          }
        `}
      >
        <div className="p-4">
          {/* Close button */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-2 right-2 p-1.5 
                     text-text-secondary hover:text-text-primary
                     hover:bg-dark-primary/50 rounded-lg transition-colors"
          >
            <ChevronLeft size={16} />
          </button>

          {/* Controls */}
          <div className="flex flex-col gap-3 pr-6">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-dark-primary/50 rounded-lg p-1">
              <button
                onClick={() => onViewModeChange('blocks')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all ${
                  viewMode === 'blocks'
                    ? 'bg-accent-green text-dark-primary'
                    : 'text-text-secondary hover:text-text-primary hover:bg-dark-primary/30'
                }`}
              >
                <LayoutGrid size={16} />
                <span className="text-sm">Blocks</span>
              </button>
              <button
                onClick={() => onViewModeChange('lines')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all ${
                  viewMode === 'lines'
                    ? 'bg-accent-green text-dark-primary'
                    : 'text-text-secondary hover:text-text-primary hover:bg-dark-primary/30'
                }`}
              >
                <LayoutList size={16} />
                <span className="text-sm">Lines</span>
              </button>
            </div>

            {/* Divider */}
            <div className="h-px bg-dark-secondary/50" />

            {/* Action Buttons */}
            <button
              onClick={() => {
                onShare();
                setIsOpen(false);
              }}
              className="flex items-center gap-2 px-3 py-2
                       text-text-secondary hover:text-blue-400
                       hover:bg-blue-400/10 rounded-lg transition-all"
            >
              <Share2 size={16} />
              <span className="text-sm">Share</span>
            </button>
            
            <button
              onClick={() => {
                onDelete();
                setIsOpen(false);
              }}
              className="flex items-center gap-2 px-3 py-2
                       text-text-secondary hover:text-red-400
                       hover:bg-red-400/10 rounded-lg transition-all"
            >
              <Trash2 size={16} />
              <span className="text-sm">Delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Share2, Trash2, LayoutGrid, LayoutList } from 'lucide-react';

export default function FloatingControlsTrigger({ 
  viewMode, 
  onViewModeChange, 
  onShare, 
  onDelete,
  scrollThreshold = 100, // Show after scrolling past this point (lowered from 200)
  scrollContainerRef // Reference to the scrollable container
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [justAppeared, setJustAppeared] = useState(false);
  const panelRef = useRef(null);

  // Handle scroll visibility
  useEffect(() => {
    const scrollElement = scrollContainerRef?.current;
    if (!scrollElement) {
      return;
    }

    const handleScroll = () => {
      const currentScrollY = scrollElement.scrollTop;
      const shouldShow = currentScrollY > scrollThreshold;
      
      if (shouldShow && !isVisible) {
        setJustAppeared(true);
        setTimeout(() => setJustAppeared(false), 1000);
      }
      
      setIsVisible(shouldShow);
    };

    scrollElement.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial position

    return () => scrollElement.removeEventListener('scroll', handleScroll);
  }, [scrollThreshold, isVisible, scrollContainerRef]);

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
    <div ref={panelRef} className="fixed top-6 right-6 z-50">
      {/* Trigger Arrow Button - Sophisticated Design */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          relative 
          w-10 h-10 rounded-xl
          bg-dark-secondary/40 backdrop-blur-xl
          border border-dark-secondary/30
          flex items-center justify-center
          text-text-secondary/70
          hover:text-text-primary
          hover:bg-dark-secondary/60
          hover:border-accent-green/30
          hover:shadow-lg hover:shadow-accent-green/5
          transition-all duration-300 ease-out
          group
          ${isOpen ? 'opacity-0 pointer-events-none scale-95' : 'opacity-100 scale-100'}
          ${justAppeared ? 'animate-[fadeIn_0.5s_ease-out]' : ''}
        `}
        title="Quick actions"
      >
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-accent-green/0 to-accent-green/10 
                        opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Icon */}
        <ChevronLeft 
          size={16} 
          className={`relative z-10 transition-all duration-300 
                     group-hover:text-accent-green group-hover:-translate-x-0.5`}
        />
      </button>

      {/* Controls Panel - Glassmorphism Design */}
      <div
        className={`
          absolute top-0 right-0
          min-w-[200px]
          bg-dark-primary/80 backdrop-blur-2xl
          border border-dark-secondary/20
          rounded-2xl shadow-2xl shadow-black/50
          transition-all duration-300 cubic-bezier(0.25, 0.46, 0.45, 0.94)
          ${isOpen 
            ? 'opacity-100 translate-x-0 scale-100' 
            : 'opacity-0 translate-x-4 scale-95 pointer-events-none'
          }
        `}
      >
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
        
        <div className="relative p-4">
          {/* Close button */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-3 right-3 p-1.5 
                     text-text-secondary/60 hover:text-text-primary
                     hover:bg-dark-secondary/30 rounded-lg 
                     transition-all duration-200"
          >
            <ChevronLeft size={14} />
          </button>

          {/* Controls */}
          <div className="flex flex-col gap-3 pr-6">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-0.5 bg-dark-secondary/30 rounded-lg p-0.5">
              <button
                onClick={() => onViewModeChange('blocks')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all duration-200 ${
                  viewMode === 'blocks'
                    ? 'bg-dark-primary text-accent-green shadow-sm'
                    : 'text-text-secondary/70 hover:text-text-primary hover:bg-dark-secondary/20'
                }`}
              >
                <LayoutGrid size={14} />
                <span className="text-xs font-medium">Blocks</span>
              </button>
              <button
                onClick={() => onViewModeChange('lines')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all duration-200 ${
                  viewMode === 'lines'
                    ? 'bg-dark-primary text-accent-green shadow-sm'
                    : 'text-text-secondary/70 hover:text-text-primary hover:bg-dark-secondary/20'
                }`}
              >
                <LayoutList size={14} />
                <span className="text-xs font-medium">Lines</span>
              </button>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-dark-secondary/30 to-transparent" />

            {/* Action Buttons */}
            <button
              onClick={() => {
                onShare();
                setIsOpen(false);
              }}
              className="flex items-center gap-2 px-3 py-2
                       text-text-secondary/70 hover:text-text-primary
                       hover:bg-dark-secondary/20 rounded-lg 
                       transition-all duration-200 group"
            >
              <Share2 size={14} className="group-hover:text-blue-400/70 transition-colors" />
              <span className="text-xs font-medium">Share</span>
            </button>
            
            <button
              onClick={() => {
                onDelete();
                setIsOpen(false);
              }}
              className="flex items-center gap-2 px-3 py-2
                       text-text-secondary/70 hover:text-text-primary
                       hover:bg-dark-secondary/20 rounded-lg 
                       transition-all duration-200 group"
            >
              <Trash2 size={14} className="group-hover:text-red-400/70 transition-colors" />
              <span className="text-xs font-medium">Delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
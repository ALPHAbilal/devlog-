import { useState, useRef } from 'react';
import { optimizedBlockLoader } from '@/shared/lib';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Check, MoreVertical } from 'lucide-react';
import { useTouchGestures } from '@/shared/hooks';

export default function EntryCard({ entry, onExpand, isSelected = false, onSelect, selectionMode = false, onContextMenu }) {
  const [touchActive, setTouchActive] = useState(false);
  const cardRef = useRef(null);
  const longPressTimeoutRef = useRef(null);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging
  } = useDraggable({
    id: entry.id,
    data: {
      type: 'document',
      entry
    }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };
  // Preload blocks on hover
  const handleMouseEnter = () => {
    optimizedBlockLoader.preloadDocuments([entry.id]);
  };
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  // Touch gesture handling
  const gestureRef = useTouchGestures({
    onLongPress: () => {
      if ('vibrate' in navigator) {
        navigator.vibrate(30);
      }
      onContextMenu?.(entry);
    },
    threshold: 50,
    longPressDelay: 400
  });
  
  const handleClick = (e) => {
    // Prevent double-tap zoom on mobile
    e.preventDefault();
    
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      onSelect?.(entry.id, e);
    } else if (selectionMode) {
      onSelect?.(entry.id, e);
    } else {
      onExpand(entry);
    }
  };
  
  const handleTouchStart = () => {
    setTouchActive(true);
  };
  
  const handleTouchEnd = () => {
    setTimeout(() => setTouchActive(false), 100);
  };

  return (
    <div 
      ref={(node) => {
        setNodeRef(node);
        cardRef.current = node;
        if (node) gestureRef.current = node;
      }}
      style={style}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`bg-card-gradient rounded-lg p-4 md:p-6 cursor-pointer 
                 transition-all duration-300 hover:shadow-xl
                 flex flex-col h-full relative group
                 touch-manipulation select-none
                 ${isDragging ? 'opacity-0' : ''}
                 ${isSelected ? 'ring-2 ring-accent-green shadow-lg shadow-accent-green/10' : ''}
                 ${touchActive ? 'scale-[0.98] bg-dark-secondary/60' : ''}`}
    >
      {/* Drag Handle - Hidden on mobile */}
      <div
        {...attributes}
        {...listeners}
        className="hidden lg:block absolute -left-8 top-1/2 -translate-y-1/2 p-2 
                   bg-surface-1/50 hover:bg-surface-2 
                   rounded-l-lg transition-all duration-200
                   cursor-grab active:cursor-grabbing
                   opacity-0 group-hover:opacity-100
                   hover:shadow-md"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical size={20} className="text-text-secondary hover:text-text-primary transition-colors" />
      </div>
      
      {/* Mobile Context Menu Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onContextMenu?.(entry);
        }}
        className="lg:hidden absolute top-2 right-2 p-2 
                   hover:bg-dark-primary/50 active:bg-dark-primary/70
                   rounded-lg transition-colors"
      >
        <MoreVertical size={16} className="text-text-secondary" />
      </button>

      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute top-3 right-3 bg-accent-green rounded-full p-1.5 shadow-lg animate-in fade-in zoom-in duration-200">
          <Check size={14} className="text-dark-primary" strokeWidth={3} />
        </div>
      )}
      {/* Header with date */}
      <div className="flex justify-between items-start mb-3">
        <div className="text-text-secondary text-sm">
          Document
        </div>
        {entry.updatedAt && (
          <div className="text-text-secondary text-xs">
            {formatDate(entry.updatedAt)}
          </div>
        )}
      </div>
      
      {/* Title */}
      <h3 className="text-text-primary text-base md:text-lg font-medium mb-2 pr-8 md:pr-0">
        {entry.title}
      </h3>
      
      {/* Preview content */}
      <p className="text-text-secondary text-sm line-clamp-2 flex-grow leading-relaxed">
        {entry.preview}
      </p>

      {/* Tags preview */}
      {entry.tags && entry.tags.length > 0 && (
        <div className="mt-3 md:mt-4 flex gap-1.5 md:gap-2 flex-wrap">
          {entry.tags.slice(0, window.innerWidth < 640 ? 2 : 3).map((tag, index) => (
            <span 
              key={index}
              className="text-xs px-2 py-0.5 md:py-1 bg-dark-secondary/50 rounded-full 
                         text-text-secondary whitespace-nowrap"
            >
              {tag}
            </span>
          ))}
          {entry.tags.length > (window.innerWidth < 640 ? 2 : 3) && (
            <span className="text-xs text-text-secondary">
              +{entry.tags.length - (window.innerWidth < 640 ? 2 : 3)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
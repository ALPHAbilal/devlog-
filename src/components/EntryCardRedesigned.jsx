import { useState, useRef, useMemo } from 'react';
import { optimizedBlockLoader } from '../utils/optimizedBlockLoader';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Check, MoreVertical } from 'lucide-react';
import { useTouchGestures } from '../hooks/useTouchGestures';
import { generateActivityData } from '../utils/activityData';
import CardContainer from './CardContainer';
import FavoriteIndicator from './FavoriteIndicator';

export default function EntryCardRedesigned({ entry, onExpand, isSelected = false, onSelect, selectionMode = false, onContextMenu }) {
  const [touchActive, setTouchActive] = useState(false);
  const cardRef = useRef(null);

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

  // Generate activity data for chart visualization based on REAL document data
  const activityData = useMemo(() => {
    // Use existing activityData.js which analyzes real document properties:
    // - entry.createdAt (creation date)
    // - entry.updatedAt (last update date)
    // - entry.blocks (block count and types)
    const fullData = generateActivityData(entry);
    // Take last 20 weeks to match Figma design (20 bars)
    return fullData.slice(-20).map(value => {
      // Convert 0-20 scale to 0-100 percentage for bar height
      return Math.max(5, Math.min(95, (value / 20) * 100));
    });
  }, [entry.id, entry.updatedAt, entry.createdAt]); // Regenerate when document changes

  // Always show chart for all documents (matching Figma design)
  const hasChart = true;

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        cardRef.current = node;
        if (node) gestureRef.current = node;
      }}
      style={style}
      onMouseEnter={handleMouseEnter}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`
        touch-manipulation select-none
        ${isDragging ? 'opacity-0' : ''}
        ${isSelected ? 'ring-2 ring-emerald-500 shadow-lg shadow-emerald-500/20' : ''}
        ${touchActive ? 'scale-[0.98]' : ''}
      `}
    >
      {/* Use CardContainer wrapper */}
      <CardContainer onClick={handleClick}>
        {/* Favorite Indicator */}
        <FavoriteIndicator isFavorite={entry.isFavorite} />

        {/* Drag Handle - Hidden on mobile */}
        <div
          {...attributes}
          {...listeners}
          className="hidden lg:block absolute -left-8 top-1/2 -translate-y-1/2 p-2
                     bg-[#0a1628]/80 hover:bg-[#1a2942] backdrop-blur-sm
                     rounded-l-lg transition-all duration-200
                     cursor-grab active:cursor-grabbing
                     opacity-0 group-hover:opacity-100
                     hover:shadow-md border border-white/10"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={20} className="text-white/40 hover:text-emerald-400 transition-colors" />
        </div>

        {/* Mobile Context Menu Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onContextMenu?.(entry);
          }}
          className="lg:hidden absolute top-3 right-3 p-2 z-20
                     hover:bg-white/10 active:bg-white/20
                     rounded-lg transition-colors"
        >
          <MoreVertical size={16} className="text-white/60" />
        </button>

        {/* Selection Indicator */}
        {isSelected && (
          <div className="absolute top-3 right-3 bg-emerald-500 rounded-full p-1.5 shadow-lg z-20
                          animate-in fade-in zoom-in duration-200">
            <Check size={14} className="text-white" strokeWidth={3} />
          </div>
        )}

        {/* Card Content */}
        <div className="relative p-5 flex flex-col h-full min-h-[140px]">
          {/* Title - exact spacing from Figma */}
          <h3 className="text-white/90 mb-4 group-hover:text-white transition-colors
                         line-clamp-3 min-h-[4.5rem] flex items-start pr-6 leading-snug">
            {entry.title}
          </h3>

          {/* Chart visualization - 20 bars */}
          {hasChart && (
            <div className="mt-auto h-16 flex items-end gap-1 px-1 pb-1">
              {activityData.map((value, i) => (
                <div
                  key={i}
                  className="flex-1 bg-gradient-to-t from-emerald-500/40 to-emerald-400/30 rounded-t
                             group-hover:from-emerald-500/60 group-hover:to-emerald-400/50
                             transition-all duration-300 shadow-sm shadow-emerald-500/20"
                  style={{
                    height: `${value}%`,
                    transitionDelay: `${i * 20}ms`
                  }}
                />
              ))}
            </div>
          )}

          {/* Preview text for documents without chart */}
          {!hasChart && (
            <p className="mt-auto text-white/60 text-sm line-clamp-2 leading-relaxed">
              {entry.preview || 'Click to start editing...'}
            </p>
          )}
        </div>
      </CardContainer>
    </div>
  );
}

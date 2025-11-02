import { useState, useRef, useMemo } from 'react';
import { optimizedBlockLoader } from '../utils/optimizedBlockLoader';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Check, MoreVertical } from 'lucide-react';
import { useTouchGestures } from '../hooks/useTouchGestures';
import CardContainer from './CardContainer';
import FavoriteIndicator from './FavoriteIndicator';
import ActivityWaveChart from './ActivityWaveChart';

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

  // Generate activity data from REAL audit logs - DAILY granularity
  const activityData = useMemo(() => {
    if (!entry.recentActivity || entry.recentActivity.length === 0) {
      // No activity data yet (new document or audit just started)
      // Show minimal wave to indicate no recent edits
      return Array(30).fill(5);
    }

    // Group recent activity by DAY to show last 30 days of activity
    // This shows DAILY work intensity - multiple edits in one day = higher wave
    const days = 30;
    const dayCounts = new Array(days).fill(0);
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Start of today

    entry.recentActivity.forEach(activity => {
      const activityDate = new Date(activity.ts);
      activityDate.setHours(0, 0, 0, 0); // Start of activity day

      const daysSince = Math.floor((now - activityDate) / (1000 * 60 * 60 * 24));

      if (daysSince >= 0 && daysSince < days) {
        // Increment count for this day (most recent = index 29)
        dayCounts[days - 1 - daysSince]++;
      }
    });

    // Use logarithmic scaling to emphasize differences between 1, 2, 5, 10+ edits
    const maxCount = Math.max(...dayCounts, 1);
    return dayCounts.map(count => {
      if (count === 0) return 5; // Empty days

      // Logarithmic scale: 1 edit = 20%, 2 = 35%, 5 = 60%, 10 = 80%, 20+ = 95%
      const logScale = Math.log(count + 1) / Math.log(maxCount + 1);
      const percentage = logScale * 90; // Scale to 90% max
      return Math.max(15, percentage + 5); // 15-95% range
    });
  }, [entry.recentActivity]); // Regenerate when activity changes

  // Always show wave chart for all documents (matching Figma design)
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
        <div className="relative p-5 flex flex-col h-full min-h-[160px]">
          {/* Title - exact spacing from Figma */}
          <h3 className="text-white/90 mb-4 group-hover:text-white transition-colors
                         line-clamp-3 min-h-[4.5rem] flex items-start pr-6 leading-snug">
            {entry.title}
          </h3>

          {/* Chart visualization - Stepped wave showing DAILY activity from audit logs */}
          {hasChart && (
            <div className="mt-auto">
              <ActivityWaveChart
                data={activityData}
                height={80}
                className="group-hover:opacity-100 transition-opacity duration-300"
              />
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

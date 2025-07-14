import { optimizedBlockLoader } from '../utils/optimizedBlockLoader';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Check } from 'lucide-react';

export default function EntryCard({ entry, onExpand, isSelected = false, onSelect, selectionMode = false }) {
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
    opacity: isDragging ? 0.5 : 1,
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

  const handleClick = (e) => {
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      e.preventDefault();
      onSelect?.(entry.id, e);
    } else if (selectionMode) {
      e.preventDefault();
      onSelect?.(entry.id, e);
    } else {
      onExpand(entry);
    }
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      className={`bg-card-gradient rounded-lg p-6 cursor-pointer 
                 transition-all duration-300 hover:shadow-xl
                 flex flex-col h-full relative group
                 ${isDragging ? 'z-50 shadow-2xl' : ''}
                 ${isSelected ? 'ring-2 ring-accent-green shadow-lg shadow-accent-green/10' : ''}`}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-2 top-1/2 -translate-y-1/2 p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical size={16} className="text-text-secondary" />
      </div>

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
      <h3 className="text-text-primary text-lg font-medium mb-2">
        {entry.title}
      </h3>
      
      {/* Preview content */}
      <p className="text-text-secondary text-sm line-clamp-2 flex-grow">
        {entry.preview}
      </p>

      {/* Tags preview */}
      {entry.tags && entry.tags.length > 0 && (
        <div className="mt-4 flex gap-2 flex-wrap">
          {entry.tags.slice(0, 3).map((tag, index) => (
            <span 
              key={index}
              className="text-xs px-2 py-1 bg-dark-secondary/50 rounded-full 
                         text-text-secondary"
            >
              {tag}
            </span>
          ))}
          {entry.tags.length > 3 && (
            <span className="text-xs text-text-secondary">
              +{entry.tags.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
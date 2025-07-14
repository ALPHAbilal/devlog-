import React, { useState } from 'react';
import { 
  MoreVertical, 
  Edit2 as Edit3, 
  Trash2
} from 'lucide-react';

export default function ProjectCard({ 
  project, 
  isSelected = false,
  onClick,
  onEdit,
  onDelete,
  className = '',
  isDragOver = false
}) {
  const [showActions, setShowActions] = useState(false);

  return (
    <div 
      onClick={onClick}
      onMouseLeave={() => setShowActions(false)}
      className={`
        relative group overflow-hidden
        bg-surface-1 hover:bg-surface-2 
        rounded-lg cursor-pointer 
        transition-all duration-300 ease-out
        hover:shadow-xl hover:shadow-black/20
        border border-transparent hover:border-surface-3
        h-48 w-full
        ${isSelected 
          ? 'ring-2 ring-accent-green/50 bg-surface-2 shadow-lg shadow-accent-green/10' 
          : ''
        }
        ${isDragOver 
          ? 'ring-2 ring-accent-green ring-offset-2 ring-offset-dark-primary shadow-2xl' 
          : ''
        }
        ${className}
      `}
    >
      <div className="flex flex-col p-6 h-full">
        {/* Header with project indicator and actions */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: project.color || '#10b981' }}
            />
            <div className="text-text-secondary text-sm">Project</div>
          </div>
          
          {/* Actions Menu */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowActions(!showActions);
              }}
              className={`
                p-1 rounded hover:bg-surface-3 transition-all duration-200
                ${showActions ? 'bg-surface-3' : ''}
                opacity-0 group-hover:opacity-100
              `}
            >
              <MoreVertical size={16} className="text-text-secondary" />
            </button>

            {showActions && (
              <div className="absolute right-0 mt-1 w-48 bg-surface-3 rounded-lg shadow-xl border border-surface-2 z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit?.(project);
                    setShowActions(false);
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors"
                >
                  <Edit3 size={14} />
                  <span>Edit project</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.(project);
                    setShowActions(false);
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors"
                >
                  <Trash2 size={14} />
                  <span>Delete project</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-text-primary text-lg font-medium mb-2">
          {project.title}
        </h3>
        
        {/* Document count */}
        <p className="text-text-secondary text-sm">
          {project.document_count || 0} {project.document_count === 1 ? 'document' : 'documents'}
        </p>

        {/* Optional description */}
        {project.description && (
          <p className="text-text-secondary/60 text-sm mt-3 line-clamp-2">
            {project.description}
          </p>
        )}
      </div>
    </div>
  );
}
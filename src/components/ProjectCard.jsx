import React, { useState } from 'react';
import { Folder, FolderOpen, FileText, Calendar, MoreVertical, Edit2, Trash2, Clock, Activity, Star, StarOff } from 'lucide-react';

// Simple relative date formatter
function formatRelativeDate(date) {
  if (!date) return 'No activity';
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now - past) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)}w ago`;
  return past.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ProjectCard({ 
  project, 
  isSelected = false,
  onClick,
  onEdit,
  onDelete,
  onToggleFavorite,
  recentDocuments = [], // Array of recent document previews
  className = ''
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const FolderIcon = isHovered || isSelected ? FolderOpen : Folder;
  
  // Calculate activity level based on last update
  const getActivityLevel = () => {
    if (!project.last_document_date) return 'inactive';
    const hoursSinceUpdate = (Date.now() - new Date(project.last_document_date).getTime()) / (1000 * 60 * 60);
    if (hoursSinceUpdate < 24) return 'hot';
    if (hoursSinceUpdate < 168) return 'warm'; // 1 week
    return 'cold';
  };

  const activityLevel = getActivityLevel();
  const activityColors = {
    hot: 'text-green-400 bg-green-400/10',
    warm: 'text-yellow-400 bg-yellow-400/10',
    cold: 'text-blue-400 bg-blue-400/10',
    inactive: 'text-gray-500 bg-gray-500/10'
  };

  return (
    <div 
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowActions(false);
      }}
      className={`
        relative group
        bg-surface-1 hover:bg-surface-2 
        rounded-lg cursor-pointer 
        transition-all duration-300 
        hover:shadow-xl hover:shadow-black/20
        hover:-translate-y-0.5
        border border-transparent hover:border-surface-3
        ${isSelected 
          ? 'ring-2 ring-accent-green/50 bg-surface-2 shadow-lg shadow-accent-green/10' 
          : ''
        }
        ${className}
      `}
    >
      {/* Main Content */}
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <FolderIcon 
                size={20} 
                style={{ color: project.color || '#10b981' }}
                className="transition-transform duration-300"
              />
              {project.is_favorite && (
                <Star 
                  size={12} 
                  className="absolute -top-1 -right-1 text-yellow-400 fill-yellow-400"
                />
              )}
            </div>
            <div className={`
              px-2 py-0.5 rounded-full text-xs font-medium flex items-center space-x-1
              ${activityColors[activityLevel]}
            `}>
              <Activity size={10} />
              <span>{formatRelativeDate(project.last_document_date)}</span>
            </div>
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
                    onToggleFavorite?.(project);
                    setShowActions(false);
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors"
                >
                  {project.is_favorite ? <StarOff size={14} /> : <Star size={14} />}
                  <span>{project.is_favorite ? 'Remove from favorites' : 'Add to favorites'}</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit?.(project);
                    setShowActions(false);
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors"
                >
                  <Edit2 size={14} />
                  <span>Edit project</span>
                </button>
                <div className="border-t border-surface-2 my-1" />
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

        {/* Title and Description */}
        <h3 className="text-text-primary text-lg font-semibold mb-1 leading-tight">
          {project.title}
        </h3>
        
        {project.description && (
          <p className="text-text-secondary/60 text-sm mb-3 line-clamp-2">
            {project.description}
          </p>
        )}

        {/* Document Count */}
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-1.5 text-text-secondary">
            <FileText size={14} />
            <span>{project.document_count} {project.document_count === 1 ? 'document' : 'documents'}</span>
          </div>
        </div>

        {/* Recent Documents Preview (if provided) */}
        {recentDocuments.length > 0 && (
          <div className="mt-4 space-y-2">
            <div className="text-xs text-text-secondary/60 uppercase tracking-wider mb-2">Recent</div>
            {recentDocuments.slice(0, 2).map((doc, index) => (
              <div 
                key={doc.id || index}
                className="flex items-center space-x-2 text-xs text-text-secondary/80 hover:text-text-primary transition-colors"
              >
                <FileText size={12} />
                <span className="truncate flex-1">{doc.title}</span>
                <span className="text-text-secondary/40">{formatRelativeDate(doc.updatedAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Visual Activity Indicator Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-surface-0 rounded-b-lg overflow-hidden">
        <div 
          className={`h-full transition-all duration-500 ${
            activityLevel === 'hot' ? 'bg-green-400 w-full' :
            activityLevel === 'warm' ? 'bg-yellow-400 w-3/4' :
            activityLevel === 'cold' ? 'bg-blue-400 w-1/2' :
            'bg-gray-500 w-1/4'
          }`}
        />
      </div>
    </div>
  );
}
import React, { useState, useRef, useEffect } from 'react';
import { 
  Folder, 
  FolderOpen, 
  FileText, 
  Calendar, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Clock, 
  Activity, 
  Star, 
  StarOff,
  TrendingUp,
  Zap,
  BarChart3,
  Sparkles
} from 'lucide-react';

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
  className = '',
  isDragOver = false
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showSparkle, setShowSparkle] = useState(false);
  const cardRef = useRef(null);

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

  const activityIcons = {
    hot: Zap,
    warm: TrendingUp,
    cold: BarChart3,
    inactive: Clock
  };

  const ActivityIcon = activityIcons[activityLevel];

  // Trigger sparkle animation when favorited
  useEffect(() => {
    if (project.is_favorite && !showSparkle) {
      setShowSparkle(true);
      setTimeout(() => setShowSparkle(false), 1000);
    }
  }, [project.is_favorite]);

  return (
    <div 
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowActions(false);
      }}
      className={`
        relative group overflow-hidden
        bg-surface-1 hover:bg-surface-2 
        rounded-lg cursor-pointer 
        transition-all duration-300 ease-out
        hover:shadow-xl hover:shadow-black/20
        hover:-translate-y-1
        border border-transparent hover:border-surface-3
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
      {/* Animated background gradient */}
      <div className={`
        absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500
        bg-gradient-to-br from-accent-green/5 via-transparent to-transparent
      `} />

      {/* Sparkle effect for favorites */}
      {showSparkle && (
        <div className="absolute inset-0 pointer-events-none">
          <Sparkles className="absolute top-4 left-4 text-yellow-400 animate-ping" size={20} />
          <Sparkles className="absolute top-8 right-8 text-yellow-400 animate-ping animation-delay-200" size={16} />
          <Sparkles className="absolute bottom-4 left-8 text-yellow-400 animate-ping animation-delay-400" size={12} />
        </div>
      )}

      {/* Main Content */}
      <div className="relative p-5 z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className={`
                transition-all duration-300 
                ${isHovered ? 'scale-110 rotate-3' : ''}
                ${isDragOver ? 'scale-125 rotate-6' : ''}
              `}>
                <FolderIcon 
                  size={20} 
                  style={{ color: project.color || '#10b981' }}
                  className="transition-all duration-300"
                  fill={isHovered || isDragOver ? project.color || '#10b981' : 'none'}
                />
              </div>
              {project.is_favorite && (
                <Star 
                  size={12} 
                  className={`
                    absolute -top-1 -right-1 text-yellow-400 fill-yellow-400
                    transition-all duration-300
                    ${showSparkle ? 'scale-150' : ''}
                  `}
                />
              )}
            </div>
            <div className={`
              px-2.5 py-1 rounded-full text-xs font-medium flex items-center space-x-1.5
              ${activityColors[activityLevel]}
              transition-all duration-300
              ${isHovered ? 'scale-105' : ''}
            `}>
              <ActivityIcon size={12} className="animate-pulse" />
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
        <h3 className="text-text-primary text-lg font-semibold mb-1 leading-tight transition-colors duration-200 group-hover:text-accent-green">
          {project.title}
        </h3>
        
        {project.description && (
          <p className="text-text-secondary/60 text-sm mb-3 line-clamp-2">
            {project.description}
          </p>
        )}

        {/* Document Count with progress visualization */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-1.5 text-text-secondary group-hover:text-text-primary transition-colors">
              <FileText size={14} />
              <span>{project.document_count} {project.document_count === 1 ? 'document' : 'documents'}</span>
            </div>
            {project.document_count > 0 && (
              <div className="text-xs text-text-secondary/60">
                {Math.round((project.document_count / 50) * 100)}% capacity
              </div>
            )}
          </div>
          
          {/* Capacity bar */}
          <div className="h-1 bg-surface-0 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-accent-green to-accent-green/60 transition-all duration-500"
              style={{ width: `${Math.min((project.document_count / 50) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Recent Documents Preview with enhanced styling */}
        {recentDocuments.length > 0 && (
          <div className="mt-4 space-y-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="text-xs text-text-secondary/60 uppercase tracking-wider mb-2 flex items-center space-x-1">
              <Clock size={10} />
              <span>Recent Activity</span>
            </div>
            {recentDocuments.slice(0, 3).map((doc, index) => (
              <div 
                key={doc.id || index}
                className={`
                  flex items-center space-x-2 text-xs 
                  text-text-secondary/80 hover:text-text-primary 
                  transition-all duration-200 
                  transform hover:translate-x-1
                  opacity-0 group-hover:opacity-100
                  animation-delay-${index * 100}
                `}
              >
                <div className="w-1 h-1 rounded-full bg-accent-green animate-pulse" />
                <span className="truncate flex-1">{doc.title}</span>
                <span className="text-text-secondary/40 text-[10px]">{formatRelativeDate(doc.updatedAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Visual Activity Indicator Bar with animation */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-surface-0 rounded-b-lg overflow-hidden">
        <div 
          className={`h-full transition-all duration-700 ease-out relative ${isDragOver ? 'h-2' : ''} ${
            activityLevel === 'hot' ? 'bg-green-400 w-full' :
            activityLevel === 'warm' ? 'bg-yellow-400 w-3/4' :
            activityLevel === 'cold' ? 'bg-blue-400 w-1/2' :
            'bg-gray-500 w-1/4'
          }`}
        >
          {/* Animated shimmer effect */}
          {(activityLevel === 'hot' || activityLevel === 'warm') && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          )}
        </div>
      </div>
    </div>
  );
}
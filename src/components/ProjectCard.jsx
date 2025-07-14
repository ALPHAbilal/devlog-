import React from 'react';
import { Folder, FolderOpen, FileText, Calendar, TrendingUp } from 'lucide-react';

// Simple relative date formatter to avoid adding date-fns dependency
function formatRelativeDate(date) {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now - past) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
  return `${Math.floor(diffInSeconds / 31536000)} years ago`;
}

export default function ProjectCard({ 
  project, 
  isSelected = false,
  onClick,
  onEdit,
  onDelete,
  className = ''
}) {
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  return (
    <div 
      onClick={onClick}
      className={`
        bg-card-gradient rounded-lg p-4 cursor-pointer 
        transition-all duration-300 hover:scale-105 hover:shadow-xl
        flex flex-col h-full
        ${isSelected 
          ? 'ring-2 ring-accent-green/50 shadow-lg shadow-accent-green/10' 
          : ''
        }
        ${className}
      `}
    >
      {/* Header with type and date */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <Folder 
            size={16} 
            className="text-accent-green/80"
          />
          <span className="text-text-secondary text-sm">
            Project
          </span>
        </div>
        {project.last_document_date && (
          <div className="text-text-secondary text-xs">
            {formatDate(project.last_document_date)}
          </div>
        )}
      </div>

      {/* Title */}
      <h3 className="text-text-primary text-lg font-medium mb-1">
        {project.title}
      </h3>
      
      {/* Document count and description */}
      <div className="flex-grow">
        <p className="text-text-secondary text-sm">
          {project.document_count} {project.document_count === 1 ? 'document' : 'documents'}
          {project.description && ` • ${project.description}`}
        </p>
      </div>

      {/* Optional color indicator - subtle */}
      {project.color && project.color !== '#10b981' && (
        <div className="mt-3 flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: project.color }}
          />
        </div>
      )}

    </div>
  );
}
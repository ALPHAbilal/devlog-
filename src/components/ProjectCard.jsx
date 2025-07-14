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
  const [isHovered, setIsHovered] = React.useState(false);
  
  // Format the last activity date
  const lastActivity = project.last_document_date 
    ? formatRelativeDate(project.last_document_date)
    : 'No documents yet';

  // Get appropriate folder icon
  const FolderIcon = isHovered || isSelected ? FolderOpen : Folder;

  return (
    <div
      className={`
        bg-card-gradient rounded-lg p-6 
        border transition-all duration-300 cursor-pointer
        ${isSelected 
          ? 'border-accent-green/40 shadow-lg shadow-accent-green/10 scale-105' 
          : 'border-accent-green/20 hover:border-accent-green/30'
        }
        hover:scale-105 hover:shadow-xl
        ${className}
      `}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header with folder icon and document count */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div 
            className="p-2 rounded-lg transition-colors"
            style={{ backgroundColor: `${project.color}20` }}
          >
            <FolderIcon 
              size={32} 
              className="transition-colors"
              style={{ color: project.color || '#10b981' }}
            />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-400 uppercase tracking-wider">Project</span>
            <div className="flex items-center space-x-2">
              <FileText size={14} className="text-gray-400" />
              <span className="text-sm text-gray-300">
                {project.document_count} {project.document_count === 1 ? 'document' : 'documents'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Document count badge */}
        <div className="bg-dark-primary/50 px-3 py-1 rounded-full">
          <span className="text-accent-green font-semibold">
            {project.document_count}
          </span>
        </div>
      </div>

      {/* Project title */}
      <h3 className="text-xl font-semibold text-primary mb-2 line-clamp-1">
        {project.title}
      </h3>

      {/* Project description */}
      {project.description && (
        <p className="text-gray-400 text-sm mb-4 line-clamp-2">
          {project.description}
        </p>
      )}

      {/* Footer with stats */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-1">
          <Calendar size={12} />
          <span>Created {formatRelativeDate(project.created_at)}</span>
        </div>
        <div className="flex items-center space-x-1">
          <TrendingUp size={12} />
          <span>{lastActivity}</span>
        </div>
      </div>

      {/* Hover actions (edit/delete) - stopped propagation */}
      {(isHovered || isSelected) && (
        <div className="absolute top-4 right-4 flex space-x-2 opacity-0 hover:opacity-100 transition-opacity">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(project);
              }}
              className="p-1 bg-dark-primary/80 rounded hover:bg-dark-primary"
              title="Edit project"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(project);
              }}
              className="p-1 bg-dark-primary/80 rounded hover:bg-red-900/50"
              title="Delete project"
            >
              <svg className="w-4 h-4 text-gray-400 hover:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
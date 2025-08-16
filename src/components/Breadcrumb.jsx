import React from 'react';
import { ChevronRight, Home, Folder, FileText } from 'lucide-react';

export default function Breadcrumb({ 
  viewMode, 
  selectedProject, 
  documentTitle,
  onNavigateHome,
  onNavigateProjects,
  totalDocuments = 0
}) {
  const items = [];

  // Always show home
  items.push({
    id: 'home',
    label: 'All Documents',
    icon: Home,
    count: totalDocuments,
    onClick: onNavigateHome,
    isClickable: true
  });

  // Show projects view if active
  if (viewMode === 'projects') {
    items.push({
      id: 'projects',
      label: 'Projects',
      icon: Folder,
      onClick: onNavigateProjects,
      isClickable: false
    });
  }

  // Show selected project
  if (selectedProject && viewMode === 'documents') {
    items.push({
      id: 'project',
      label: selectedProject.title,
      icon: Folder,
      count: selectedProject.document_count,
      color: selectedProject.color,
      onClick: () => {},
      isClickable: false
    });
  }

  // Show document title if in expanded view
  if (documentTitle) {
    items.push({
      id: 'document',
      label: documentTitle,
      icon: FileText,
      onClick: () => {},
      isClickable: false
    });
  }

  return (
    <div className="flex items-center space-x-2 text-sm">
      {items.map((item, index) => {
        const Icon = item.icon;
        const isLast = index === items.length - 1;
        
        return (
          <React.Fragment key={item.id}>
            <button
              onClick={item.isClickable ? item.onClick : undefined}
              className={`
                flex items-center space-x-1.5 px-2 py-1 rounded
                transition-colors duration-200
                ${item.isClickable 
                  ? 'hover:bg-surface-2 text-text-secondary hover:text-text-primary cursor-pointer' 
                  : 'text-text-primary cursor-default'
                }
              `}
              disabled={!item.isClickable}
            >
              <Icon 
                size={14} 
                style={{ color: item.color }}
                className={item.color ? '' : (isLast ? 'text-accent-green' : '')}
              />
              <span className="font-medium">{item.label}</span>
              {item.count !== undefined && (
                <span className="text-xs text-text-secondary/60">({item.count})</span>
              )}
            </button>
            
            {!isLast && (
              <ChevronRight size={14} className="text-text-secondary/40" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
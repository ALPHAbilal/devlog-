import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Folder, 
  FolderOpen, 
  FileText, 
  Code,
  MessageSquare,
  Hash,
  Table,
  Image,
  ListTodo,
  ChevronRight,
  ChevronDown,
  Search,
  X,
  Plus,
  Star,
  StarOff,
  Clock,
  Archive,
  MoreVertical,
  Grid3X3
} from 'lucide-react';
import SearchBar from './SearchBar';
import ContextMenu from './ContextMenu';
import { useToast } from '../../hooks/useToast';

export default function ProjectExplorer({ 
  onDocumentSelect,
  selectedDocumentId,
  className = '',
  height = 'h-full',
  projects = [],
  documents = [],
  selectedProjectId,
  onProjectSelect,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
  onToggleFavorite,
  totalDocuments = 0,
  uncategorizedCount = 0
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFavorites, setShowFavorites] = useState(true);
  const [showRecent, setShowRecent] = useState(true);
  const [showAll, setShowAll] = useState(true);
  const [contextMenu, setContextMenu] = useState(null);
  const [hoveredProjectId, setHoveredProjectId] = useState(null);
  const [expandedProjects, setExpandedProjects] = useState(new Set(['all', 'uncategorized']));
  
  const containerRef = useRef(null);
  const { showToast } = useToast();
  
  // Filter projects based on search
  const filteredProjects = projects.filter(project =>
    project.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter documents based on search
  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get documents for a specific project
  const getProjectDocuments = useCallback((projectId) => {
    if (projectId === 'all') {
      return filteredDocuments;
    } else if (projectId === 'uncategorized') {
      return filteredDocuments.filter(doc => !doc.project_id);
    } else {
      return filteredDocuments.filter(doc => doc.project_id === projectId);
    }
  }, [filteredDocuments]);

  // Categorize projects
  const favoriteProjects = useMemo(() => 
    filteredProjects.filter(p => p.is_favorite).sort((a, b) => a.title.localeCompare(b.title))
  , [filteredProjects]);

  const recentProjects = useMemo(() => {
    return filteredProjects
      .filter(p => !p.is_favorite && p.last_document_date)
      .sort((a, b) => new Date(b.last_document_date) - new Date(a.last_document_date))
      .slice(0, 3);
  }, [filteredProjects]);

  const otherProjects = useMemo(() => {
    const recentIds = new Set(recentProjects.map(p => p.id));
    return filteredProjects
      .filter(p => !p.is_favorite && !recentIds.has(p.id))
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [filteredProjects, recentProjects]);

  const handleProjectClick = useCallback((projectId) => {
    // Toggle expansion
    setExpandedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId || 'all')) {
        newSet.delete(projectId || 'all');
      } else {
        newSet.add(projectId || 'all');
      }
      return newSet;
    });
    onProjectSelect?.(projectId);
  }, [onProjectSelect]);

  // Handle context menu for projects
  const handleProjectContextMenu = useCallback((e, project) => {
    e.preventDefault();
    e.stopPropagation();
    
    const menuItems = [
      { label: 'Edit', icon: MoreVertical, onClick: () => onUpdateProject?.(project) },
      { label: 'Delete', icon: X, onClick: () => onDeleteProject?.(project), danger: true },
      { divider: true },
      { 
        label: project.is_favorite ? 'Remove from Favorites' : 'Add to Favorites', 
        icon: project.is_favorite ? StarOff : Star,
        onClick: () => onToggleFavorite?.(project)
      }
    ];
    
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      items: menuItems
    });
  }, [onUpdateProject, onDeleteProject, onToggleFavorite]);

  // Get icon for document based on its blocks
  const getDocumentIcon = (doc) => {
    if (!doc.blocks || doc.blocks.length === 0) return FileText;
    
    // Check block types in the document
    const blockTypes = doc.blocks.map(b => b.type);
    
    if (blockTypes.includes('code')) return Code;
    if (blockTypes.includes('ai_conversation')) return MessageSquare;
    if (blockTypes.includes('table')) return Table;
    if (blockTypes.includes('image')) return Image;
    if (blockTypes.includes('todo')) return ListTodo;
    
    return FileText;
  };

  // Render document item
  const renderDocumentItem = (doc, indentLevel = 1) => {
    const isSelected = selectedDocumentId === doc.id;
    const DocumentIcon = getDocumentIcon(doc);
    
    return (
      <button
        key={doc.id}
        onClick={() => onDocumentSelect?.(doc.id)}
        className={`
          w-full flex items-center justify-between p-1.5 rounded transition-all text-sm
          ${isSelected 
            ? 'bg-accent-green/20 text-accent-green' 
            : 'hover:bg-dark-secondary/20 text-text-secondary hover:text-text-primary'
          }
        `}
        style={{ paddingLeft: `${indentLevel * 1.5}rem` }}
      >
        <div className="flex items-center space-x-2 min-w-0">
          <DocumentIcon size={14} className="flex-shrink-0" />
          <span className="truncate">{doc.title}</span>
        </div>
        {doc.updated_at && (
          <span className="text-xs text-text-secondary/50 flex-shrink-0 ml-1">
            {new Date(doc.updated_at).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            })}
          </span>
        )}
      </button>
    );
  };

  // Render project item with documents
  const renderProjectItem = (project, projectId = null) => {
    const id = projectId || project?.id;
    const isSelected = selectedProjectId === id;
    const isHovered = hoveredProjectId === id;
    const isExpanded = expandedProjects.has(id);
    const projectDocs = getProjectDocuments(id);
    const hasDocuments = projectDocs.length > 0;
    
    const FolderIcon = (isHovered || isSelected || isExpanded) ? FolderOpen : Folder;

    return (
      <div key={id}>
        <button
          onClick={() => handleProjectClick(id)}
          onContextMenu={(e) => project && handleProjectContextMenu(e, project)}
          onMouseEnter={() => setHoveredProjectId(id)}
          onMouseLeave={() => setHoveredProjectId(null)}
          className={`
            w-full flex items-center justify-between p-2 rounded-lg transition-all
            ${isSelected 
              ? 'bg-accent-green/20 text-accent-green' 
              : 'hover:bg-dark-secondary/30 text-text-secondary hover:text-text-primary'
            }
          `}
        >
          <div className="flex items-center space-x-2 min-w-0">
            <div className="flex items-center">
              {hasDocuments && (
                <div className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                  <ChevronRight size={12} />
                </div>
              )}
              {!hasDocuments && <div className="w-3" />}
            </div>
            <div className="relative">
              <FolderIcon 
                size={16} 
                style={{ color: isSelected ? undefined : project?.color }}
                className={isSelected ? '' : 'transition-transform'}
              />
              {project?.is_favorite && (
                <Star size={8} className="absolute -top-0.5 -right-0.5 text-yellow-400 fill-yellow-400" />
              )}
            </div>
            <span className="text-sm font-medium truncate">
              {project?.title || (id === 'all' ? 'All Documents' : 'Uncategorized')}
            </span>
          </div>
          <span className="text-xs bg-dark-secondary/50 px-1.5 py-0.5 rounded ml-2 flex-shrink-0">
            {projectDocs.length}
          </span>
        </button>
        
        {/* Render documents */}
        {isExpanded && hasDocuments && (
          <div className="mt-0.5">
            {projectDocs.map(doc => renderDocumentItem(doc))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div 
      ref={containerRef}
      className={`bg-dark-secondary/20 rounded-lg p-4 ${height} flex flex-col ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-2 text-text-primary hover:text-accent-green transition-colors group"
        >
          <div className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-0' : '-rotate-90'}`}>
            <ChevronDown size={14} />
          </div>
          <h3 className="font-semibold text-sm">Explorer</h3>
        </button>
        <button
          onClick={onCreateProject}
          className="p-1 hover:bg-dark-secondary/30 rounded transition-all duration-200 hover:scale-110"
          title="Create new project"
        >
          <Plus size={14} className="text-accent-green" />
        </button>
      </div>

      {isExpanded && (
        <>
          {/* Search */}
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search files..."
            className="mb-4"
          />

          {/* File tree */}
          <div className="flex-1 overflow-y-auto space-y-0.5 scrollbar-thin scrollbar-thumb-dark-secondary scrollbar-track-transparent">
            {/* All Documents */}
            {renderProjectItem(null, 'all')}

            {/* Uncategorized */}
            {uncategorizedCount > 0 && renderProjectItem(null, 'uncategorized')}

            {/* Favorites Section */}
            {favoriteProjects.length > 0 && (
              <>
                <div className="flex items-center justify-between mt-4 mb-2">
                  <button
                    onClick={() => setShowFavorites(!showFavorites)}
                    className="flex items-center space-x-1.5 text-xs font-semibold text-text-secondary/80 hover:text-text-primary uppercase tracking-wider transition-colors"
                  >
                    <div className={`transform transition-transform duration-200 ${showFavorites ? 'rotate-0' : '-rotate-90'}`}>
                      <ChevronDown size={12} />
                    </div>
                    <Star size={12} />
                    <span>Favorites</span>
                  </button>
                  <span className="text-xs text-text-secondary/60">{favoriteProjects.length}</span>
                </div>
                {showFavorites && (
                  <div className="space-y-0.5 mb-4">
                    {favoriteProjects.map(project => renderProjectItem(project))}
                  </div>
                )}
              </>
            )}

            {/* Recent Section */}
            {recentProjects.length > 0 && (
              <>
                <div className="flex items-center justify-between mt-4 mb-2">
                  <button
                    onClick={() => setShowRecent(!showRecent)}
                    className="flex items-center space-x-1.5 text-xs font-semibold text-text-secondary/80 hover:text-text-primary uppercase tracking-wider transition-colors"
                  >
                    <div className={`transform transition-transform duration-200 ${showRecent ? 'rotate-0' : '-rotate-90'}`}>
                      <ChevronDown size={12} />
                    </div>
                    <Clock size={12} />
                    <span>Recent</span>
                  </button>
                  <span className="text-xs text-text-secondary/60">{recentProjects.length}</span>
                </div>
                {showRecent && (
                  <div className="space-y-0.5 mb-4">
                    {recentProjects.map(project => renderProjectItem(project))}
                  </div>
                )}
              </>
            )}

            {/* All Projects Section */}
            {otherProjects.length > 0 && (
              <>
                <div className="flex items-center justify-between mt-4 mb-2">
                  <button
                    onClick={() => setShowAll(!showAll)}
                    className="flex items-center space-x-1.5 text-xs font-semibold text-text-secondary/80 hover:text-text-primary uppercase tracking-wider transition-colors"
                  >
                    <div className={`transform transition-transform duration-200 ${showAll ? 'rotate-0' : '-rotate-90'}`}>
                      <ChevronDown size={12} />
                    </div>
                    <Archive size={12} />
                    <span>All Projects</span>
                  </button>
                  <span className="text-xs text-text-secondary/60">{otherProjects.length}</span>
                </div>
                {showAll && (
                  <div className="space-y-0.5">
                    {otherProjects.map(project => renderProjectItem(project))}
                  </div>
                )}
              </>
            )}

            {/* Empty state */}
            {filteredProjects.length === 0 && filteredDocuments.length === 0 && searchTerm && (
              <div className="text-center py-12">
                <p className="text-text-secondary text-sm">
                  No results found for "{searchTerm}"
                </p>
              </div>
            )}

            {projects.length === 0 && documents.length === 0 && !searchTerm && (
              <div className="text-center py-12">
                <Folder size={32} className="text-text-secondary/30 mx-auto mb-2" />
                <p className="text-text-secondary text-sm mb-3">No projects yet</p>
                <button
                  onClick={onCreateProject}
                  className="text-accent-green hover:text-accent-green/80 text-sm font-medium transition-colors"
                >
                  Create your first project
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.items}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Folder, 
  FolderOpen, 
  FileText, 
  Code,
  MessageSquare,
  Hash,
  CheckSquare,
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
  const [selectedId, setSelectedId] = useState(selectedDocumentId);
  const [hoveredProjectId, setHoveredProjectId] = useState(null);
  
  const containerRef = useRef(null);
  const { showToast } = useToast();
  
  // Filter projects based on search
  const filteredProjects = projects.filter(project =>
    project.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    setSelectedId(projectId || 'all');
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

  // Render project item
  const renderProjectItem = (project) => {
    const isSelected = selectedProjectId === project.id;
    const isHovered = hoveredProjectId === project.id;
    const FolderIcon = isHovered || isSelected ? FolderOpen : Folder;

    return (
      <button
        key={project.id}
        onClick={() => handleProjectClick(project.id)}
        onContextMenu={(e) => handleProjectContextMenu(e, project)}
        onMouseEnter={() => setHoveredProjectId(project.id)}
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
          <div className="relative">
            <FolderIcon 
              size={16} 
              style={{ color: isSelected ? undefined : project.color }}
              className={isSelected ? '' : 'transition-transform'}
            />
            {project.is_favorite && (
              <Star size={8} className="absolute -top-0.5 -right-0.5 text-yellow-400 fill-yellow-400" />
            )}
          </div>
          <span className="text-sm font-medium truncate">
            {project.title}
          </span>
        </div>
        <span className="text-xs bg-dark-secondary/50 px-1.5 py-0.5 rounded ml-2 flex-shrink-0">
          {project.document_count || 0}
        </span>
      </button>
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
          <h3 className="font-semibold text-sm">Projects</h3>
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
            placeholder="Search projects..."
            className="mb-4"
          />

          {/* Project list */}
          <div className="flex-1 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-dark-secondary scrollbar-track-transparent">
            {/* All Documents */}
            <button
              onClick={() => handleProjectClick(null)}
              className={`
                w-full flex items-center justify-between p-2 rounded-lg transition-all duration-200
                ${selectedProjectId === null 
                  ? 'bg-accent-green/20 text-accent-green' 
                  : 'hover:bg-dark-secondary/30 text-text-secondary hover:text-text-primary'
                }
              `}
            >
              <div className="flex items-center space-x-2 min-w-0">
                <Grid3X3 size={16} className="flex-shrink-0" />
                <span className="text-sm font-medium truncate">All Documents</span>
              </div>
              <span className="text-xs bg-dark-secondary/50 px-1.5 py-0.5 rounded ml-2 flex-shrink-0">
                {totalDocuments}
              </span>
            </button>

            {/* Uncategorized */}
            {uncategorizedCount > 0 && (
              <button
                onClick={() => handleProjectClick('uncategorized')}
                className={`
                  w-full flex items-center justify-between p-2 rounded-lg transition-all duration-200
                  ${selectedProjectId === 'uncategorized' 
                    ? 'bg-accent-green/20 text-accent-green' 
                    : 'hover:bg-dark-secondary/30 text-text-secondary hover:text-text-primary'
                  }
                `}
              >
                <div className="flex items-center space-x-2 min-w-0">
                  <Folder size={16} className="flex-shrink-0" />
                  <span className="text-sm font-medium truncate">Uncategorized</span>
                </div>
                <span className="text-xs bg-dark-secondary/50 px-1.5 py-0.5 rounded ml-2 flex-shrink-0">
                  {uncategorizedCount}
                </span>
              </button>
            )}

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
                  <div className="space-y-1 mb-4">
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
                  <div className="space-y-1 mb-4">
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
                  <div className="space-y-1">
                    {otherProjects.map(project => renderProjectItem(project))}
                  </div>
                )}
              </>
            )}

            {/* Empty state */}
            {filteredProjects.length === 0 && searchTerm && (
              <div className="text-center py-12">
                <p className="text-text-secondary text-sm">
                  No projects found matching "{searchTerm}"
                </p>
              </div>
            )}

            {filteredProjects.length === 0 && !searchTerm && (
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
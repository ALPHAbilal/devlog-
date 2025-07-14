import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { 
  Folder, 
  FolderOpen, 
  Plus, 
  FileText, 
  Grid3X3,
  ChevronRight,
  ChevronDown,
  Search,
  X,
  Star,
  Clock,
  Archive
} from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';

export default function ProjectSidebar({ 
  projects = [], 
  selectedProjectId,
  onProjectSelect,
  onCreateProject,
  totalDocuments = 0,
  uncategorizedCount = 0
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredProjectId, setHoveredProjectId] = useState(null);
  const [showFavorites, setShowFavorites] = useState(true);
  const [showRecent, setShowRecent] = useState(true);
  const [showAll, setShowAll] = useState(true);
  
  // Virtual scrolling state
  const scrollContainerRef = useRef(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });
  const ITEM_HEIGHT = 36; // Height of each project item in pixels
  const BUFFER_ITEMS = 5; // Extra items to render for smooth scrolling

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

  // Calculate total documents in projects
  const categorizedCount = projects.reduce((sum, project) => sum + project.document_count, 0);

  // Handle scroll for virtual scrolling
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    
    const { scrollTop, clientHeight } = scrollContainerRef.current;
    const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER_ITEMS);
    const endIndex = Math.min(
      otherProjects.length,
      Math.ceil((scrollTop + clientHeight) / ITEM_HEIGHT) + BUFFER_ITEMS
    );
    
    setVisibleRange({ start: startIndex, end: endIndex });
  }, [otherProjects.length]);

  // Set up scroll listener
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    container.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial calculation
    
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Droppable Project Item Component
  const DroppableProjectItem = ({ project, isButton = true }) => {
    const dropId = project ? `project-${project.id}` : isButton ? null : 'project-uncategorized';
    const { isOver, setNodeRef } = useDroppable({
      id: dropId,
      disabled: !dropId
    });

    const isHovered = hoveredProjectId === (project?.id || (isButton ? null : 'uncategorized'));
    const isSelected = selectedProjectId === (project?.id || (!project && !isButton && selectedProjectId === 'uncategorized'));
    const FolderIcon = isHovered || isSelected || isOver ? FolderOpen : Folder;

    const content = (
      <>
        <div className="flex items-center space-x-2 min-w-0">
          <div className="relative">
            {isButton ? (
              <Grid3X3 size={16} />
            ) : (
              <>
                <FolderIcon 
                  size={16} 
                  style={{ color: isSelected ? undefined : project?.color }}
                  className={`${isSelected ? '' : 'transition-transform'} ${isOver ? 'scale-110' : ''}`}
                />
                {project?.is_favorite && (
                  <Star size={8} className="absolute -top-0.5 -right-0.5 text-yellow-400 fill-yellow-400" />
                )}
              </>
            )}
          </div>
          <span className="text-sm font-medium truncate">
            {isButton ? 'All Documents' : (project?.title || 'Uncategorized')}
          </span>
        </div>
        <span className="text-xs bg-surface-0 px-1.5 py-0.5 rounded ml-2 flex-shrink-0">
          {isButton ? totalDocuments : (project?.document_count || uncategorizedCount)}
        </span>
      </>
    );

    const className = `
      w-full flex items-center justify-between p-2 rounded-lg transition-all
      ${isSelected 
        ? 'bg-accent-green/20 text-accent-green' 
        : 'hover:bg-surface-2 text-text-secondary hover:text-text-primary'
      }
      ${isOver ? 'ring-2 ring-accent-green/50 bg-accent-green/10' : ''}
    `;

    if (isButton) {
      return (
        <button
          onClick={() => onProjectSelect(null)}
          onMouseEnter={() => setHoveredProjectId('all')}
          onMouseLeave={() => setHoveredProjectId(null)}
          className={className}
        >
          {content}
        </button>
      );
    }

    return (
      <button
        ref={setNodeRef}
        onClick={() => onProjectSelect(project?.id || 'uncategorized')}
        onMouseEnter={() => setHoveredProjectId(project?.id || 'uncategorized')}
        onMouseLeave={() => setHoveredProjectId(null)}
        className={className}
      >
        {content}
      </button>
    );
  };

  // Helper function to render project item
  const renderProjectItem = (project) => {
    return <DroppableProjectItem key={project.id} project={project} isButton={false} />;
  };

  return (
    <div className="bg-surface-1 rounded-lg p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-2 text-text-primary hover:text-accent-green transition-colors"
        >
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <h3 className="font-semibold text-sm">Projects</h3>
        </button>
        <button
          onClick={onCreateProject}
          className="p-1 hover:bg-surface-2 rounded transition-colors"
          title="Create new project"
        >
          <Plus size={14} className="text-accent-green" />
        </button>
      </div>

      {isExpanded && (
        <>
          {/* Search bar */}
          <div className="relative mb-4">
            <Search size={14} className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search projects..."
              className="w-full pl-8 pr-8 py-1.5 bg-surface-2 border border-surface-2 rounded-lg 
                       text-sm text-text-primary placeholder-text-secondary/50 focus:border-accent-green/50 
                       focus:outline-none transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 
                         hover:bg-dark-secondary rounded transition-colors"
              >
                <X size={14} className="text-text-secondary" />
              </button>
            )}
          </div>

          {/* Project list */}
          <div 
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto space-y-1"
          >
            {/* All Documents */}
            <DroppableProjectItem project={null} isButton={true} />

            {/* Uncategorized */}
            {uncategorizedCount > 0 && (
              <DroppableProjectItem project={null} isButton={false} />
            )}

            {/* Favorites Section */}
            {favoriteProjects.length > 0 && (
              <>
                <div className="flex items-center justify-between mt-4 mb-2">
                  <button
                    onClick={() => setShowFavorites(!showFavorites)}
                    className="flex items-center space-x-1.5 text-xs font-semibold text-text-secondary/80 hover:text-text-primary uppercase tracking-wider"
                  >
                    {showFavorites ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
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
                    className="flex items-center space-x-1.5 text-xs font-semibold text-text-secondary/80 hover:text-text-primary uppercase tracking-wider"
                  >
                    {showRecent ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
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
                    className="flex items-center space-x-1.5 text-xs font-semibold text-text-secondary/80 hover:text-text-primary uppercase tracking-wider"
                  >
                    {showAll ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    <Archive size={12} />
                    <span>All Projects</span>
                  </button>
                  <span className="text-xs text-text-secondary/60">{otherProjects.length}</span>
                </div>
                {showAll && (
                  <div className="relative" style={{ height: otherProjects.length * ITEM_HEIGHT }}>
                    {/* Virtual scrolling for large project lists */}
                    {otherProjects.length > 50 ? (
                      <>
                        {/* Spacer for proper scrolling */}
                        <div style={{ height: visibleRange.start * ITEM_HEIGHT }} />
                        
                        {/* Render only visible items */}
                        <div className="space-y-1">
                          {otherProjects
                            .slice(visibleRange.start, visibleRange.end)
                            .map(project => renderProjectItem(project))}
                        </div>
                        
                        {/* Spacer for items below viewport */}
                        <div style={{ height: (otherProjects.length - visibleRange.end) * ITEM_HEIGHT }} />
                      </>
                    ) : (
                      // Regular rendering for small lists
                      <div className="space-y-1">
                        {otherProjects.map(project => renderProjectItem(project))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Empty state */}
            {filteredProjects.length === 0 && searchTerm && (
              <div className="text-center py-8 text-text-secondary text-sm">
                No projects found matching "{searchTerm}"
              </div>
            )}

            {filteredProjects.length === 0 && !searchTerm && (
              <div className="text-center py-8">
                <Folder size={32} className="text-text-secondary/60 mx-auto mb-2" />
                <p className="text-text-secondary text-sm mb-3">No projects yet</p>
                <button
                  onClick={onCreateProject}
                  className="text-accent-green hover:text-accent-green/80 text-sm font-medium"
                >
                  Create your first project
                </button>
              </div>
            )}
          </div>

        </>
      )}
    </div>
  );
}
import React, { useState, useMemo } from 'react';
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

  // Helper function to render project item
  const renderProjectItem = (project) => {
    const isHovered = hoveredProjectId === project.id;
    const isSelected = selectedProjectId === project.id;
    const FolderIcon = isHovered || isSelected ? FolderOpen : Folder;

    return (
      <button
        key={project.id}
        onClick={() => onProjectSelect(project.id)}
        onMouseEnter={() => setHoveredProjectId(project.id)}
        onMouseLeave={() => setHoveredProjectId(null)}
        className={`
          w-full flex items-center justify-between p-2 rounded-lg transition-all
          ${isSelected 
            ? 'bg-accent-green/20 text-accent-green' 
            : 'hover:bg-surface-2 text-text-secondary hover:text-text-primary'
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
          <span className="text-sm font-medium truncate">{project.title}</span>
        </div>
        <span className="text-xs bg-surface-0 px-1.5 py-0.5 rounded ml-2 flex-shrink-0">
          {project.document_count}
        </span>
      </button>
    );
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
          <div className="flex-1 overflow-y-auto space-y-1">
            {/* All Documents */}
            <button
              onClick={() => onProjectSelect(null)}
              onMouseEnter={() => setHoveredProjectId('all')}
              onMouseLeave={() => setHoveredProjectId(null)}
              className={`
                w-full flex items-center justify-between p-2 rounded-lg transition-all
                ${selectedProjectId === null 
                  ? 'bg-accent-green/20 text-accent-green' 
                  : 'hover:bg-surface-2 text-text-secondary hover:text-text-primary'
                }
              `}
            >
              <div className="flex items-center space-x-2">
                <Grid3X3 size={16} />
                <span className="text-sm font-medium">All Documents</span>
              </div>
              <span className="text-sm bg-surface-0 px-2 py-0.5 rounded text-text-secondary">
                {totalDocuments}
              </span>
            </button>

            {/* Uncategorized */}
            {uncategorizedCount > 0 && (
              <button
                onClick={() => onProjectSelect('uncategorized')}
                onMouseEnter={() => setHoveredProjectId('uncategorized')}
                onMouseLeave={() => setHoveredProjectId(null)}
                className={`
                  w-full flex items-center justify-between p-2 rounded-lg transition-all
                  ${selectedProjectId === 'uncategorized' 
                    ? 'bg-accent-green/20 text-accent-green' 
                    : 'hover:bg-surface-2 text-text-secondary hover:text-text-primary'
                  }
                `}
              >
                <div className="flex items-center space-x-2">
                  <FileText size={16} />
                  <span className="text-sm font-medium">Uncategorized</span>
                </div>
                <span className="text-sm bg-surface-0 px-2 py-1 rounded">
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
                  <div className="space-y-1">
                    {otherProjects.map(project => renderProjectItem(project))}
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
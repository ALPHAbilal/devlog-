import React, { useState } from 'react';
import { 
  Folder, 
  FolderOpen, 
  Plus, 
  FileText, 
  Grid3X3,
  ChevronRight,
  ChevronDown,
  Search,
  X
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

  // Filter projects based on search
  const filteredProjects = projects.filter(project =>
    project.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate total documents in projects
  const categorizedCount = projects.reduce((sum, project) => sum + project.document_count, 0);

  return (
    <div className="bg-dark-primary/50 rounded-lg p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-2 text-primary hover:text-accent-green transition-colors"
        >
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <h3 className="font-semibold">Projects</h3>
        </button>
        <button
          onClick={onCreateProject}
          className="p-1 hover:bg-dark-secondary/50 rounded transition-colors"
          title="Create new project"
        >
          <Plus size={16} className="text-accent-green" />
        </button>
      </div>

      {isExpanded && (
        <>
          {/* Search bar */}
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search projects..."
              className="w-full pl-9 pr-8 py-2 bg-dark-secondary/50 border border-gray-700 rounded-lg 
                       text-sm text-primary placeholder-gray-500 focus:border-accent-green/50 
                       focus:outline-none transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 
                         hover:bg-dark-secondary rounded transition-colors"
              >
                <X size={14} className="text-gray-400" />
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
                w-full flex items-center justify-between p-3 rounded-lg transition-all
                ${selectedProjectId === null 
                  ? 'bg-accent-green/20 text-accent-green' 
                  : 'hover:bg-dark-secondary/50 text-gray-300 hover:text-primary'
                }
              `}
            >
              <div className="flex items-center space-x-3">
                <Grid3X3 size={18} />
                <span className="font-medium">All Documents</span>
              </div>
              <span className="text-sm bg-dark-primary/50 px-2 py-1 rounded">
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
                  w-full flex items-center justify-between p-3 rounded-lg transition-all
                  ${selectedProjectId === 'uncategorized' 
                    ? 'bg-accent-green/20 text-accent-green' 
                    : 'hover:bg-dark-secondary/50 text-gray-300 hover:text-primary'
                  }
                `}
              >
                <div className="flex items-center space-x-3">
                  <FileText size={18} />
                  <span className="font-medium">Uncategorized</span>
                </div>
                <span className="text-sm bg-dark-primary/50 px-2 py-1 rounded">
                  {uncategorizedCount}
                </span>
              </button>
            )}

            {/* Divider */}
            {(uncategorizedCount > 0 || filteredProjects.length > 0) && (
              <div className="my-2 border-t border-gray-700/50" />
            )}

            {/* Projects */}
            {filteredProjects.map(project => {
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
                    w-full flex items-center justify-between p-3 rounded-lg transition-all
                    ${isSelected 
                      ? 'bg-accent-green/20 text-accent-green' 
                      : 'hover:bg-dark-secondary/50 text-gray-300 hover:text-primary'
                    }
                  `}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <FolderIcon 
                      size={18} 
                      style={{ color: isSelected ? undefined : project.color }}
                      className={isSelected ? '' : 'transition-transform'}
                    />
                    <span className="font-medium truncate">{project.title}</span>
                  </div>
                  <span className="text-sm bg-dark-primary/50 px-2 py-1 rounded ml-2 flex-shrink-0">
                    {project.document_count}
                  </span>
                </button>
              );
            })}

            {/* Empty state */}
            {filteredProjects.length === 0 && searchTerm && (
              <div className="text-center py-8 text-gray-500 text-sm">
                No projects found matching "{searchTerm}"
              </div>
            )}

            {filteredProjects.length === 0 && !searchTerm && (
              <div className="text-center py-8">
                <Folder size={32} className="text-gray-600 mx-auto mb-2" />
                <p className="text-gray-500 text-sm mb-3">No projects yet</p>
                <button
                  onClick={onCreateProject}
                  className="text-accent-green hover:text-accent-green/80 text-sm font-medium"
                >
                  Create your first project
                </button>
              </div>
            )}
          </div>

          {/* Footer stats */}
          <div className="mt-4 pt-4 border-t border-gray-700/50 text-xs text-gray-500">
            <div className="flex justify-between mb-1">
              <span>Total projects:</span>
              <span>{projects.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Organized documents:</span>
              <span>{categorizedCount} / {totalDocuments}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
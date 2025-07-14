import React, { useState, useRef, useEffect } from 'react';
import { Folder, ChevronDown, Plus, X, Check } from 'lucide-react';

export default function ProjectSelector({ 
  projects = [],
  selectedProjectId,
  onProjectSelect,
  onCreateProject,
  placeholder = "Select a project...",
  className = ""
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  // Find selected project
  const selectedProject = projects.find(p => p.id === selectedProjectId);

  // Filter projects based on search
  const filteredProjects = projects.filter(project =>
    project.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProjectSelect = (projectId) => {
    onProjectSelect(projectId);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Dropdown trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2 bg-dark-primary 
                   border border-gray-700 rounded-lg text-left
                   hover:border-gray-600 focus:outline-none focus:ring-2 
                   focus:ring-accent-green/50 transition-colors"
      >
        <div className="flex items-center space-x-2 min-w-0">
          {selectedProject ? (
            <>
              <Folder 
                size={16} 
                style={{ color: selectedProject.color }}
                className="flex-shrink-0"
              />
              <span className="text-primary truncate">{selectedProject.title}</span>
            </>
          ) : (
            <>
              <Folder size={16} className="text-gray-400 flex-shrink-0" />
              <span className="text-gray-500">{placeholder}</span>
            </>
          )}
        </div>
        <ChevronDown 
          size={16} 
          className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-dark-secondary border border-gray-700 
                        rounded-lg shadow-xl overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-gray-700">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search projects..."
                className="w-full pl-3 pr-8 py-2 bg-dark-primary border border-gray-700 
                         rounded text-sm text-primary placeholder-gray-500
                         focus:outline-none focus:border-accent-green/50"
                autoFocus
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 
                           p-1 hover:bg-dark-primary rounded"
                >
                  <X size={14} className="text-gray-400" />
                </button>
              )}
            </div>
          </div>

          {/* Options */}
          <div className="max-h-64 overflow-y-auto">
            {/* No project option */}
            <button
              onClick={() => handleProjectSelect(null)}
              className={`w-full flex items-center justify-between px-4 py-3 
                         hover:bg-dark-primary/50 transition-colors
                         ${selectedProjectId === null ? 'bg-accent-green/10' : ''}`}
            >
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4" /> {/* Spacer for alignment */}
                <span className="text-gray-400">No project</span>
              </div>
              {selectedProjectId === null && (
                <Check size={16} className="text-accent-green" />
              )}
            </button>

            {/* Project options */}
            {filteredProjects.map(project => (
              <button
                key={project.id}
                onClick={() => handleProjectSelect(project.id)}
                className={`w-full flex items-center justify-between px-4 py-3 
                           hover:bg-dark-primary/50 transition-colors
                           ${selectedProjectId === project.id ? 'bg-accent-green/10' : ''}`}
              >
                <div className="flex items-center space-x-2 min-w-0">
                  <Folder 
                    size={16} 
                    style={{ color: project.color }}
                    className="flex-shrink-0"
                  />
                  <span className="text-primary truncate">{project.title}</span>
                  <span className="text-xs text-gray-500">
                    ({project.document_count})
                  </span>
                </div>
                {selectedProjectId === project.id && (
                  <Check size={16} className="text-accent-green flex-shrink-0" />
                )}
              </button>
            ))}

            {/* Empty state */}
            {filteredProjects.length === 0 && searchTerm && (
              <div className="px-4 py-8 text-center text-gray-500 text-sm">
                No projects found matching "{searchTerm}"
              </div>
            )}

            {/* Create new project option */}
            <button
              onClick={() => {
                setIsOpen(false);
                setSearchTerm('');
                onCreateProject();
              }}
              className="w-full flex items-center space-x-2 px-4 py-3 
                       border-t border-gray-700 hover:bg-dark-primary/50 
                       transition-colors text-accent-green"
            >
              <Plus size={16} />
              <span>Create new project</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
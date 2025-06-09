import { useState, useEffect, useRef } from 'react';
import { Bold, Italic, Strikethrough, Code, Link2, Tag, Plus, X } from 'lucide-react';

export default function FloatingToolbar({ 
  show, 
  position, 
  onFormat,
  selectedText = '',
  existingTags = [],
  onTag
}) {
  const toolbarRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [isCreatingTag, setIsCreatingTag] = useState(false);

  useEffect(() => {
    if (show && position) {
      // Small delay for smooth appearance
      const timer = setTimeout(() => setIsVisible(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [show, position]);

  if (!show || !position) return null;

  const tools = [
    { 
      icon: Bold, 
      action: 'bold', 
      title: 'Bold (Ctrl+B)',
      wrapper: '**'
    },
    { 
      icon: Italic, 
      action: 'italic', 
      title: 'Italic (Ctrl+I)',
      wrapper: '*'
    },
    { 
      icon: Strikethrough, 
      action: 'strikethrough', 
      title: 'Strikethrough (Ctrl+Shift+S)',
      wrapper: '~~'
    },
    { 
      icon: Code, 
      action: 'code', 
      title: 'Inline Code (Ctrl+`)',
      wrapper: '`'
    },
    { 
      icon: Link2, 
      action: 'link', 
      title: 'Create Link (Ctrl+K)',
      special: true
    },
  ];

  const handleToolClick = (tool) => {
    if (onFormat) {
      onFormat(tool.action, tool.wrapper, tool.special);
    }
  };

  const handleTagClick = () => {
    setShowTagMenu(!showTagMenu);
  };

  const handleTagSelect = (tag) => {
    if (onTag) {
      onTag(selectedText, tag);
    }
    setShowTagMenu(false);
  };

  const handleCreateTag = () => {
    if (newTag.trim() && onTag) {
      onTag(selectedText, newTag.trim());
      setNewTag('');
      setIsCreatingTag(false);
      setShowTagMenu(false);
    }
  };

  // Calculate position to keep toolbar in viewport
  const style = {
    position: 'fixed',
    top: `${position.top}px`,
    left: `${position.left}px`,
    transform: 'translateX(-50%)',
    zIndex: 50,
  };

  // Adjust if toolbar would go off-screen
  if (toolbarRef.current) {
    const rect = toolbarRef.current.getBoundingClientRect();
    if (rect.left < 0) {
      style.left = `${position.left - rect.left + 10}px`;
      style.transform = 'none';
    } else if (rect.right > window.innerWidth) {
      style.left = `${position.left - (rect.right - window.innerWidth) - 10}px`;
      style.transform = 'none';
    }
  }

  return (
    <div
      ref={toolbarRef}
      className={`
        floating-toolbar flex items-center gap-1 px-2 py-1.5
        bg-dark-secondary/95 backdrop-blur-sm rounded-lg shadow-2xl
        border border-dark-secondary/50 
        transition-all duration-200 ease-out
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}
      `}
      style={style}
      onMouseDown={(e) => e.preventDefault()} // Prevent blur on toolbar click
    >
      {tools.map((tool, index) => (
        <button
          key={tool.action}
          onClick={() => handleToolClick(tool)}
          className={`
            p-1.5 rounded hover:bg-dark-primary/50 
            text-text-secondary hover:text-text-primary
            transition-all duration-150
            ${index > 0 && index % 2 === 0 ? 'ml-1' : ''}
          `}
          title={tool.title}
        >
          <tool.icon size={16} />
        </button>
      ))}
      
      {/* Visual separator */}
      <div className="w-px h-4 bg-dark-secondary/50 mx-1" />
      
      {/* Tag button */}
      <div className="relative">
        <button
          onClick={handleTagClick}
          className="p-1.5 rounded hover:bg-dark-primary/50 
                     text-text-secondary hover:text-text-primary
                     transition-all duration-150"
          title="Add tag"
        >
          <Tag size={16} />
        </button>
        
        {/* Tag dropdown menu */}
        {showTagMenu && (
          <div className="absolute top-full left-0 mt-2 w-64 
                          bg-dark-secondary/95 backdrop-blur-sm rounded-lg
                          border border-dark-secondary/50 shadow-2xl
                          p-2 z-50">
            {/* Create new tag option */}
            {!isCreatingTag ? (
              <button
                onClick={() => setIsCreatingTag(true)}
                className="w-full flex items-center gap-2 px-3 py-2
                           text-text-secondary hover:text-text-primary
                           hover:bg-dark-primary/50 rounded transition-colors"
              >
                <Plus size={14} />
                <span className="text-sm">Create new tag</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 p-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateTag();
                    if (e.key === 'Escape') {
                      setIsCreatingTag(false);
                      setNewTag('');
                    }
                  }}
                  placeholder="Tag name..."
                  className="flex-1 bg-dark-primary/50 text-text-primary px-2 py-1
                             rounded text-sm focus:outline-none focus:ring-1 
                             focus:ring-accent-green"
                  autoFocus
                />
                <button
                  onClick={handleCreateTag}
                  className="p-1 hover:bg-dark-primary/50 rounded text-accent-green"
                >
                  <Plus size={14} />
                </button>
                <button
                  onClick={() => {
                    setIsCreatingTag(false);
                    setNewTag('');
                  }}
                  className="p-1 hover:bg-dark-primary/50 rounded text-text-secondary"
                >
                  <X size={14} />
                </button>
              </div>
            )}
            
            {/* Existing tags */}
            {existingTags.length > 0 && (
              <>
                <div className="h-px bg-dark-secondary/50 my-2" />
                <div className="max-h-48 overflow-y-auto">
                  {existingTags.map((tag, index) => (
                    <button
                      key={index}
                      onClick={() => handleTagSelect(tag)}
                      className="w-full text-left px-3 py-2 text-sm
                                 text-text-secondary hover:text-text-primary
                                 hover:bg-dark-primary/50 rounded transition-colors"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
      
      {/* Selection indicator */}
      <div className="w-px h-4 bg-dark-secondary/50 mx-1" />
      <span className="text-xs text-text-secondary/70 px-1">
        {selectedText.length > 20 
          ? `${selectedText.substring(0, 20)}...` 
          : selectedText
        }
      </span>
    </div>
  );
}
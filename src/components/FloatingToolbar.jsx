import { useState, useEffect, useRef } from 'react';
import { Bold, Italic, Strikethrough, Code, Link2, Quote } from 'lucide-react';

export default function FloatingToolbar({ 
  show, 
  position, 
  onFormat,
  selectedText = '' 
}) {
  const toolbarRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

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
      
      {/* Selection indicator */}
      <span className="text-xs text-text-secondary/70 px-1">
        {selectedText.length > 20 
          ? `${selectedText.substring(0, 20)}...` 
          : selectedText
        }
      </span>
    </div>
  );
}
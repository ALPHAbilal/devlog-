import { useState, useRef, useEffect } from 'react';
import { Type, Code, MessageSquare, Heading } from 'lucide-react';

const blockTypes = [
  { type: 'text', label: 'Text', icon: Type },
  { type: 'heading', label: 'Heading', icon: Heading },
  { type: 'code', label: 'Code', icon: Code },
  { type: 'ai', label: 'AI Chat', icon: MessageSquare },
];

export default function BlockTypeSelector({ onSelect, onClose }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % blockTypes.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + blockTypes.length) % blockTypes.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onSelect(blockTypes[selectedIndex].type);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, onSelect, onClose]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div 
      ref={containerRef}
      className="absolute left-1/2 -translate-x-1/2 mt-2 bg-dark-secondary 
                 rounded-lg shadow-xl border border-dark-secondary/50 overflow-hidden
                 z-50"
    >
      {blockTypes.map((blockType, index) => {
        const Icon = blockType.icon;
        return (
          <button
            key={blockType.type}
            onClick={() => onSelect(blockType.type)}
            onMouseEnter={() => setSelectedIndex(index)}
            className={`flex items-center gap-3 px-4 py-3 w-48 text-left
                       transition-colors ${
                         selectedIndex === index
                           ? 'bg-accent-green/20 text-text-primary'
                           : 'text-text-secondary hover:text-text-primary'
                       }`}
          >
            <Icon size={18} />
            <span>{blockType.label}</span>
          </button>
        );
      })}
    </div>
  );
}
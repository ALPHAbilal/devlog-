import { useState, useEffect, useRef } from 'react';
import { Plus, Type, Code, MessageSquare, Heading, Folder, Table, Image, AlertCircle } from 'lucide-react';
import MobileAddBlockRow from './MobileAddBlockRow';
import { useResponsive } from '../hooks/useResponsive';

const blockTypes = [
  { type: 'text', label: 'text', icon: Type },
  { type: 'heading', label: 'heading', icon: Heading },
  { type: 'code', label: 'code snippet', icon: Code },
  { type: 'image', label: 'image', icon: Image },
  { type: 'table', label: 'table', icon: Table },
  { type: 'ai', label: 'AI interaction', icon: MessageSquare },
  { type: 'filetree', label: 'file tree', icon: Folder },
  { type: 'issue-tracker', label: 'issue tracker', icon: AlertCircle },
];

export default function AddBlockRow({ onSelect, onClose, show, isMobileView }) {
  const { isMobile } = useResponsive();
  
  // Use mobile version on mobile devices or when explicitly in mobile view
  if (isMobileView || isMobile) {
    return <MobileAddBlockRow onSelect={onSelect} onClose={onClose} show={show} />;
  }
  const [hoveredType, setHoveredType] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (show) {
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };

      const handleClickOutside = (e) => {
        if (containerRef.current && !containerRef.current.contains(e.target)) {
          onClose();
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="relative my-3 animate-in fade-in slide-in-from-top-1 duration-200">
      <div className="flex items-center justify-center">
        <div 
          ref={containerRef}
          className="flex items-center gap-1 bg-dark-secondary/90 backdrop-blur-sm 
                     rounded-full px-2 py-1 border border-dark-secondary/50
                     shadow-lg">
          {/* Plus button */}
          <button
            className="w-7 h-7 rounded-full flex items-center justify-center 
                       text-text-secondary hover:bg-dark-secondary/50 transition-all"
            onClick={onClose}
            aria-label="Close menu"
          >
            <Plus size={18} />
          </button>

          <div className="w-px h-5 bg-dark-primary/50 mx-1" />

          {/* Block type buttons */}
          {blockTypes.map((blockType) => {
            const Icon = blockType.icon;
            const isHovered = hoveredType === blockType.type;
            
            return (
              <button
                key={blockType.type}
                onClick={() => onSelect(blockType.type)}
                onMouseEnter={() => setHoveredType(blockType.type)}
                onMouseLeave={() => setHoveredType(null)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full
                           text-xs font-medium transition-all duration-200
                           ${isHovered 
                             ? 'bg-dark-primary/80 text-text-primary' 
                             : 'text-text-secondary hover:text-text-primary'}`}
              >
                <Icon size={14} />
                <span>{blockType.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
import { useState, useEffect, useRef } from 'react';
import { Type, Code, MessageSquare, Heading, List, Hash, Folder, Table } from 'lucide-react';

const commands = [
  { 
    id: 'text',
    type: 'text',
    label: 'Text',
    description: 'Plain text block',
    icon: Type,
    shortcut: 'text'
  },
  { 
    id: 'heading1',
    type: 'heading',
    label: 'Heading 1',
    description: 'Large heading',
    icon: Heading,
    shortcut: 'h1',
    meta: { level: 1 }
  },
  { 
    id: 'heading2',
    type: 'heading',
    label: 'Heading 2',
    description: 'Medium heading',
    icon: Heading,
    shortcut: 'h2',
    meta: { level: 2 }
  },
  { 
    id: 'heading3',
    type: 'heading',
    label: 'Heading 3',
    description: 'Small heading',
    icon: Heading,
    shortcut: 'h3',
    meta: { level: 3 }
  },
  { 
    id: 'code',
    type: 'code',
    label: 'Code',
    description: 'Code block with syntax highlighting',
    icon: Code,
    shortcut: 'code'
  },
  { 
    id: 'table',
    type: 'table',
    label: 'Table',
    description: 'Editable table with rows and columns',
    icon: Table,
    shortcut: 'table'
  },
  { 
    id: 'ai',
    type: 'ai',
    label: 'AI Chat',
    description: 'AI conversation block',
    icon: MessageSquare,
    shortcut: 'ai'
  },
  { 
    id: 'filetree',
    type: 'filetree',
    label: 'File Tree',
    description: 'Project structure visualization',
    icon: Folder,
    shortcut: 'tree'
  }
];

export default function CommandPalette({ onSelect, onClose, position }) {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const paletteRef = useRef(null);
  const inputRef = useRef(null);

  // Filter commands based on search
  const filteredCommands = commands.filter(cmd => 
    cmd.label.toLowerCase().includes(search.toLowerCase()) ||
    cmd.shortcut.toLowerCase().includes(search.toLowerCase()) ||
    cmd.description.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    // Focus input on mount
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    // Reset selection when search changes
    setSelectedIndex(0);
  }, [search]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredCommands.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          handleSelect(filteredCommands[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, filteredCommands, onClose]);

  useEffect(() => {
    // Click outside to close
    const handleClickOutside = (e) => {
      if (paletteRef.current && !paletteRef.current.contains(e.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleSelect = (command) => {
    onSelect(command.type, command.meta);
    onClose();
  };

  return (
    <div 
      ref={paletteRef}
      className="fixed z-50 w-80 bg-dark-secondary/95 backdrop-blur-sm 
                 rounded-lg shadow-xl border border-dark-secondary/50 overflow-hidden
                 animate-in fade-in slide-in-from-top-1 duration-200"
      style={{ 
        top: position?.top || 0,
        left: position?.left || 0 
      }}
    >
      {/* Search input */}
      <div className="p-3 border-b border-dark-primary/50">
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search commands..."
          className="w-full bg-dark-primary/50 text-text-primary px-3 py-2 rounded
                     placeholder-text-secondary focus:outline-none focus:ring-1 
                     focus:ring-accent-green/50"
        />
      </div>

      {/* Commands list */}
      <div className="max-h-80 overflow-y-auto">
        {filteredCommands.length === 0 ? (
          <div className="p-4 text-text-secondary text-center">
            No commands found
          </div>
        ) : (
          filteredCommands.map((command, index) => {
            const Icon = command.icon;
            const isSelected = index === selectedIndex;
            
            return (
              <button
                key={command.id}
                onClick={() => handleSelect(command)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left
                           transition-colors ${
                             isSelected
                               ? 'bg-dark-primary/80 text-text-primary'
                               : 'text-text-secondary hover:text-text-primary hover:bg-dark-primary/50'
                           }`}
              >
                <Icon size={18} className={isSelected ? 'text-accent-green' : ''} />
                <div className="flex-1">
                  <div className="font-medium">{command.label}</div>
                  <div className="text-xs opacity-75">{command.description}</div>
                </div>
                <div className="text-xs opacity-50">/{command.shortcut}</div>
              </button>
            );
          })
        )}
      </div>

      {/* Footer hint */}
      <div className="p-2 border-t border-dark-primary/50 text-xs text-text-secondary 
                      flex items-center justify-between">
        <span>↑↓ Navigate</span>
        <span>↵ Select</span>
        <span>ESC Close</span>
      </div>
    </div>
  );
}
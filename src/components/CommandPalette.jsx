import { useState, useEffect, useRef } from 'react';
import { List, Heading, Quote, Minus, Hash, CheckSquare } from 'lucide-react';

const commands = [
  { 
    id: 'h1',
    type: 'insert',
    label: 'Heading 1',
    description: 'Large section heading',
    icon: Heading,
    shortcut: 'h1',
    insert: '# '
  },
  { 
    id: 'h2',
    type: 'insert',
    label: 'Heading 2',
    description: 'Medium section heading',
    icon: Heading,
    shortcut: 'h2',
    insert: '## '
  },
  { 
    id: 'h3',
    type: 'insert',
    label: 'Heading 3',
    description: 'Small section heading',
    icon: Heading,
    shortcut: 'h3',
    insert: '### '
  },
  { 
    id: 'bullet',
    type: 'insert',
    label: 'Bullet List',
    description: 'Unordered list item',
    icon: List,
    shortcut: 'bullet',
    insert: '- '
  },
  { 
    id: 'number',
    type: 'insert',
    label: 'Numbered List',
    description: 'Ordered list item',
    icon: Hash,
    shortcut: 'number',
    insert: '1. '
  },
  { 
    id: 'todo',
    type: 'insert',
    label: 'Todo',
    description: 'Checkbox task item',
    icon: CheckSquare,
    shortcut: 'todo',
    insert: '- [ ] '
  },
  { 
    id: 'quote',
    type: 'insert',
    label: 'Blockquote',
    description: 'Quote or callout text',
    icon: Quote,
    shortcut: 'quote',
    insert: '> '
  },
  { 
    id: 'divider',
    type: 'insert',
    label: 'Divider',
    description: 'Horizontal line separator',
    icon: Minus,
    shortcut: 'hr',
    insert: '---\n'
  }
];

export default function CommandPalette({ onSelect, onClose, position, selectedText = '', textareaRef }) {
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
    onSelect(command);
    onClose();
  };

  return (
    <div 
      ref={paletteRef}
      className="fixed z-50 bg-dark-primary/20 backdrop-blur-sm 
                 rounded-lg overflow-hidden
                 animate-in fade-in-fast slide-in-from-top-0.5 duration-150"
      style={{ 
        top: position?.top || 0,
        left: position?.left || 0,
        minWidth: '180px'
      }}
    >
      {/* Ghost header - almost invisible */}
      <div className="px-3 py-2">
        <div className="flex items-center gap-1.5">
          <span className="text-accent-green/70 font-mono text-xs">/</span>
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder=""
            className="flex-1 bg-transparent text-text-primary text-xs
                       placeholder-text-secondary/30 focus:outline-none"
            style={{ width: '60px' }}
          />
        </div>
      </div>

      {/* Ghost commands list */}
      <div className="max-h-64 overflow-y-auto">
        {filteredCommands.length === 0 ? (
          <div className="py-4 px-3 text-center">
            <div className="text-text-secondary/40 text-xs">No matches</div>
          </div>
        ) : (
          filteredCommands.map((command, index) => {
            const Icon = command.icon;
            const isSelected = index === selectedIndex;
            
            // Add divider after headings group (h3 is at index 2)
            const showDivider = command.id === 'h3' && index < filteredCommands.length - 1;
            
            return (
              <div key={command.id}>
                <button
                  onClick={() => handleSelect(command)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 text-left
                             transition-all duration-100 ${
                               isSelected
                                 ? 'bg-dark-primary/30 text-text-primary'
                                 : 'text-text-secondary/70 hover:text-text-primary'
                             }`}
                >
                  <span className={`font-mono text-xs w-4 ${
                    isSelected ? 'text-accent-green/80' : 'text-text-secondary/50'
                  }`}>
                    {command.shortcut.charAt(0)}
                  </span>
                  
                  <span className="text-xs font-medium">
                    {command.label}
                  </span>
                </button>
                
                {showDivider && (
                  <div className="my-1 mx-3 h-px bg-dark-secondary/20" />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* No footer - ghost menu needs none */}
    </div>
  );
}
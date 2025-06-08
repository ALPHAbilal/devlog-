import { useState, useRef, useEffect } from 'react';
import CommandPalette from '../CommandPalette';
import { parseMarkdown, detectHeadingMarkdown, processLineBreaksAndLists } from '../../utils/parseMarkdown';

export default function TextBlock({ block, onUpdate, onConvert }) {
  const [isEditing, setIsEditing] = useState(block.isNew || false);
  const [content, setContent] = useState(block.content || '');
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [commandPalettePosition, setCommandPalettePosition] = useState(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      // Auto-resize textarea
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [isEditing, content]);

  const handleSave = () => {
    onUpdate({ content });
    setIsEditing(false);
  };

  const handleChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);

    // Check if user typed "/" at the beginning of an empty block or after a new line
    const lines = newContent.split('\n');
    const currentLine = lines[lines.length - 1];
    
    // Check if it's a slash command (/ at the beginning of a line)
    if (currentLine === '/' && textareaRef.current) {
      // Calculate position for command palette
      const rect = textareaRef.current.getBoundingClientRect();
      const lineHeight = 24; // Approximate line height
      const currentLineNumber = lines.length - 1;
      
      setCommandPalettePosition({
        top: rect.top + (currentLineNumber * lineHeight) + lineHeight,
        left: rect.left
      });
      setShowCommandPalette(true);
    } else if (showCommandPalette) {
      // Update search in command palette
      if (currentLine.startsWith('/')) {
        // This will be used for filtering commands
      } else {
        // Hide command palette if user deleted the slash
        setShowCommandPalette(false);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      if (showCommandPalette) {
        setShowCommandPalette(false);
        // Remove the slash
        const lines = content.split('\n');
        lines[lines.length - 1] = '';
        setContent(lines.join('\n'));
      } else {
        setContent(block.content || '');
        setIsEditing(false);
      }
    } else if (e.key === 'Enter') {
      // Check for heading markdown at the start of the line
      const lines = content.split('\n');
      const currentLineIndex = lines.length - 1;
      const currentLine = lines[currentLineIndex];
      
      const headingData = detectHeadingMarkdown(currentLine);
      if (headingData && currentLineIndex === 0 && lines.length === 1) {
        // Convert to heading block
        e.preventDefault();
        onUpdate({ content: '' }); // Clear current block
        if (onConvert) {
          onConvert('heading', { level: headingData.level, content: headingData.content });
        }
        return;
      }
      
      // If pressing enter on empty block, exit edit mode
      if (content.trim() === '') {
        e.preventDefault();
        handleSave();
      }
    }
  };

  const handleCommandSelect = (type, meta) => {
    // Remove the slash from content
    const lines = content.split('\n');
    lines[lines.length - 1] = '';
    const newContent = lines.join('\n').trimEnd();
    
    if (newContent) {
      // If there's content, save it first
      onUpdate({ content: newContent });
    }
    
    // Convert block to selected type
    if (onConvert) {
      onConvert(type, meta);
    }
    
    setShowCommandPalette(false);
  };

  if (isEditing) {
    return (
      <>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onBlur={() => {
            if (!showCommandPalette) {
              handleSave();
            }
          }}
          onKeyDown={handleKeyDown}
          className="w-full bg-dark-secondary/50 text-text-primary p-4 rounded-lg
                     resize-none focus:outline-none focus:ring-2 focus:ring-accent-green"
          placeholder="Type '/' for commands or start writing..."
        />
        {showCommandPalette && (
          <CommandPalette
            position={commandPalettePosition}
            onSelect={handleCommandSelect}
            onClose={() => {
              setShowCommandPalette(false);
              // Remove the slash
              const lines = content.split('\n');
              lines[lines.length - 1] = '';
              setContent(lines.join('\n'));
            }}
          />
        )}
      </>
    );
  }

  return (
    <div 
      onClick={() => setIsEditing(true)}
      className="text-text-primary p-4 rounded-lg hover:bg-dark-secondary/30 
                 cursor-text transition-colors min-h-[50px]"
    >
      {block.content ? (
        <div className="space-y-1">
          {processLineBreaksAndLists(block.content)}
        </div>
      ) : (
        <span className="text-text-secondary">Type '/' for commands...</span>
      )}
    </div>
  );
}
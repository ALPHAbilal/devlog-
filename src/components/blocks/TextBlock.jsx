import { useState, useRef, useEffect } from 'react';
import CommandPalette from '../CommandPalette';
import FloatingToolbar from '../FloatingToolbar';
import { parseMarkdown, detectHeadingMarkdown, processLineBreaksAndLists } from '../../utils/parseMarkdown.jsx';

export default function TextBlock({ block, onUpdate, onConvert, isFocused, onFocus }) {
  const [isEditing, setIsEditing] = useState(block.isNew || false);
  const [content, setContent] = useState(block.content || '');
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [commandPalettePosition, setCommandPalettePosition] = useState(null);
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState(null);
  const [selectedText, setSelectedText] = useState('');
  const textareaRef = useRef(null);
  const selectionTimeoutRef = useRef(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      // Auto-resize textarea
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [isEditing, content]);

  // Handle text selection for toolbar
  useEffect(() => {
    const handleSelection = () => {
      if (!isEditing || !textareaRef.current) return;

      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      if (start !== end) {
        const selected = content.substring(start, end);
        setSelectedText(selected);

        // Calculate position for toolbar
        const rect = textarea.getBoundingClientRect();
        const lineHeight = 24;
        
        // Get approximate position of selection
        const beforeText = content.substring(0, start);
        const lines = beforeText.split('\n');
        const currentLine = lines.length - 1;
        
        // Position toolbar above selection
        setToolbarPosition({
          top: rect.top + (currentLine * lineHeight) - 40,
          left: rect.left + rect.width / 2
        });
        
        setShowToolbar(true);
      } else {
        setShowToolbar(false);
      }
    };

    // Debounce selection detection
    const handleSelectionChange = () => {
      if (selectionTimeoutRef.current) {
        clearTimeout(selectionTimeoutRef.current);
      }
      selectionTimeoutRef.current = setTimeout(handleSelection, 100);
    };

    if (isEditing) {
      document.addEventListener('selectionchange', handleSelectionChange);
      return () => {
        document.removeEventListener('selectionchange', handleSelectionChange);
        if (selectionTimeoutRef.current) {
          clearTimeout(selectionTimeoutRef.current);
        }
      };
    }
  }, [isEditing, content]);

  const handleSave = () => {
    onUpdate({ content });
    setIsEditing(false);
    setShowToolbar(false);
    if (onFocus) onFocus(null); // Clear focus
  };

  const handleFormat = (action, wrapper, isSpecial) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);

    if (isSpecial && action === 'link') {
      // For links, wrap in [[]] for document links
      const newText = `[[${selectedText}]]`;
      const newContent = content.substring(0, start) + newText + content.substring(end);
      setContent(newContent);
      
      // Set cursor position after the link
      setTimeout(() => {
        textarea.selectionStart = start + 2;
        textarea.selectionEnd = start + 2 + selectedText.length;
        textarea.focus();
      }, 0);
    } else if (wrapper) {
      // For regular formatting
      const newText = `${wrapper}${selectedText}${wrapper}`;
      const newContent = content.substring(0, start) + newText + content.substring(end);
      setContent(newContent);
      
      // Keep selection on the formatted text
      setTimeout(() => {
        textarea.selectionStart = start + wrapper.length;
        textarea.selectionEnd = start + wrapper.length + selectedText.length;
        textarea.focus();
      }, 0);
    }
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

    // Auto-complete document links
    if (newContent.endsWith('[[')) {
      // Could show document search modal here in the future
    }
  };

  const handleKeyDown = (e) => {
    // Keyboard shortcuts for formatting
    if ((e.metaKey || e.ctrlKey) && !e.shiftKey) {
      switch(e.key) {
        case 'b':
          e.preventDefault();
          handleFormat('bold', '**');
          return;
        case 'i':
          e.preventDefault();
          handleFormat('italic', '*');
          return;
        case 'k':
          e.preventDefault();
          handleFormat('link', null, true);
          return;
        case '`':
          e.preventDefault();
          handleFormat('code', '`');
          return;
      }
    } else if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 's') {
      e.preventDefault();
      handleFormat('strikethrough', '~~');
      return;
    }

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
        if (onFocus) onFocus(null); // Clear focus when escaping
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
        if (onFocus) onFocus(null); // Clear focus
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
    if (onFocus) onFocus(null); // Clear focus after conversion
  };

  if (isEditing) {
    return (
      <>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onFocus={() => onFocus && onFocus(block.id)}
          onBlur={() => {
            if (!showCommandPalette && !showToolbar) {
              handleSave();
            }
          }}
          onKeyDown={handleKeyDown}
          className="w-full bg-dark-secondary/50 text-text-primary p-4 rounded-lg
                     resize-none focus:outline-none focus:ring-2 focus:ring-accent-green
                     transition-all duration-200"
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
        <FloatingToolbar
          show={showToolbar}
          position={toolbarPosition}
          selectedText={selectedText}
          onFormat={handleFormat}
        />
      </>
    );
  }

  return (
    <div 
      onClick={() => {
        setIsEditing(true);
        if (onFocus) onFocus(block.id);
      }}
      className={`text-text-primary p-4 rounded-lg hover:bg-dark-secondary/30 
                 cursor-text transition-all duration-200 min-h-[50px]
                 ${isFocused === false ? 'opacity-40' : 'opacity-100'}`}
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
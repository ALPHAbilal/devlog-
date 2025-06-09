import { useState, useRef, useEffect } from 'react';
import CommandPalette from '../CommandPalette';
import FloatingToolbar from '../FloatingToolbar';
import { parseMarkdown, detectHeadingMarkdown, processLineBreaksAndLists, extractTagsFromContent } from '../../utils/parseMarkdown.jsx';

export default function TextBlock({ block, onUpdate, onConvert, isFocused, onFocus }) {
  const [isEditing, setIsEditing] = useState(block.isNew || false);
  const [content, setContent] = useState(block.content || '');
  const [displayContent, setDisplayContent] = useState(block.content || '');
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [commandPalettePosition, setCommandPalettePosition] = useState(null);
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState(null);
  const [selectedText, setSelectedText] = useState('');
  const textareaRef = useRef(null);
  const selectionTimeoutRef = useRef(null);
  const imageMap = useRef(new Map()); // Store base64 -> placeholder mapping
  
  // Extract tags from content dynamically
  const tags = extractTagsFromContent(content);

  // Convert base64 images to placeholders for display
  const createImagePlaceholder = (index) => `📷[image-${index}]`;
  
  const processContentForDisplay = (text) => {
    let processed = text;
    let imageIndex = 0;
    
    // Replace base64 images with placeholders
    processed = processed.replace(/!\[([^\]]*)\]\((data:image\/[^;]+;base64,[^)]+)\)/g, (match, alt, dataUrl) => {
      const placeholder = createImagePlaceholder(imageIndex++);
      imageMap.current.set(placeholder, { alt, dataUrl, fullMatch: match });
      return placeholder;
    });
    
    return processed;
  };
  
  const processContentForSave = (text) => {
    let processed = text;
    
    // Replace placeholders back with actual base64 images
    imageMap.current.forEach((imageData, placeholder) => {
      processed = processed.replace(placeholder, imageData.fullMatch);
    });
    
    return processed;
  };

  // Get all unique tags from localStorage
  const getAllTags = () => {
    try {
      const documents = JSON.parse(localStorage.getItem('journeyLoggerEntries') || '[]');
      const allTags = new Set();
      
      documents.forEach(doc => {
        doc.blocks?.forEach(block => {
          if (block.tags && Array.isArray(block.tags)) {
            block.tags.forEach(tag => allTags.add(tag));
          }
        });
      });
      
      return Array.from(allTags);
    } catch (error) {
      console.error('Error getting tags:', error);
      return [];
    }
  };

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      // Auto-resize textarea
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [isEditing, displayContent]);

  // Initialize display content
  useEffect(() => {
    if (block.content) {
      setContent(block.content);
      setDisplayContent(processContentForDisplay(block.content));
    }
  }, [block.content]);

  // Handle text selection for toolbar
  useEffect(() => {
    const handleSelection = () => {
      if (!isEditing || !textareaRef.current) return;

      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      if (start !== end) {
        const selected = displayContent.substring(start, end);
        setSelectedText(selected);

        // Calculate position for toolbar
        const rect = textarea.getBoundingClientRect();
        const lineHeight = 24;
        
        // Get approximate position of selection
        const beforeText = displayContent.substring(0, start);
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
  }, [isEditing, displayContent]);

  const handleSave = () => {
    // Convert display content back to actual content
    const actualContent = processContentForSave(displayContent);
    setContent(actualContent);
    
    // Extract tags from content before saving
    const extractedTags = extractTagsFromContent(actualContent);
    onUpdate({ content: actualContent, tags: extractedTags });
    setIsEditing(false);
    setShowToolbar(false);
    if (onFocus) onFocus(null); // Clear focus
  };

  const handleTag = (selectedText, tagName) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    // Wrap selected text with tag format
    const taggedText = `#${tagName}[${selectedText}]`;
    const newDisplayContent = displayContent.substring(0, start) + taggedText + displayContent.substring(end);
    setDisplayContent(newDisplayContent);
    
    // Update actual content
    const actualContent = processContentForSave(newDisplayContent);
    setContent(actualContent);

    // Set cursor position after the tagged text
    setTimeout(() => {
      textarea.selectionStart = start + taggedText.length;
      textarea.selectionEnd = start + taggedText.length;
      textarea.focus();
    }, 0);
  };

  const handleFormat = (action, wrapper, isSpecial) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = displayContent.substring(start, end);

    if (isSpecial && action === 'link') {
      // For links, wrap in [[]] for document links
      const newText = `[[${selectedText}]]`;
      const newDisplayContent = displayContent.substring(0, start) + newText + displayContent.substring(end);
      setDisplayContent(newDisplayContent);
      setContent(processContentForSave(newDisplayContent));
      
      // Set cursor position after the link
      setTimeout(() => {
        textarea.selectionStart = start + 2;
        textarea.selectionEnd = start + 2 + selectedText.length;
        textarea.focus();
      }, 0);
    } else if (action === 'image') {
      // For images, create image markdown with selected text as alt
      const newText = `![${selectedText}](url)`;
      const newDisplayContent = displayContent.substring(0, start) + newText + displayContent.substring(end);
      setDisplayContent(newDisplayContent);
      setContent(processContentForSave(newDisplayContent));
      
      // Select the 'url' part for easy replacement
      setTimeout(() => {
        textarea.selectionStart = start + 2 + selectedText.length + 2;
        textarea.selectionEnd = start + 2 + selectedText.length + 5;
        textarea.focus();
      }, 0);
    } else if (wrapper) {
      // For regular formatting
      const newText = `${wrapper}${selectedText}${wrapper}`;
      const newDisplayContent = displayContent.substring(0, start) + newText + displayContent.substring(end);
      setDisplayContent(newDisplayContent);
      setContent(processContentForSave(newDisplayContent));
      
      // Keep selection on the formatted text
      setTimeout(() => {
        textarea.selectionStart = start + wrapper.length;
        textarea.selectionEnd = start + wrapper.length + selectedText.length;
        textarea.focus();
      }, 0);
    }
  };

  const handlePaste = async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        
        const file = item.getAsFile();
        if (!file) continue;

        // Convert to base64 data URL
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target.result;
          const imageMarkdown = `![](${dataUrl})`;
          
          // Insert at cursor position
          const textarea = textareaRef.current;
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          
          // Create placeholder for display
          const imageIndex = Array.from(imageMap.current.keys()).length;
          const placeholder = createImagePlaceholder(imageIndex);
          imageMap.current.set(placeholder, { alt: '', dataUrl, fullMatch: imageMarkdown });
          
          // Update display content with placeholder
          const newDisplayContent = displayContent.substring(0, start) + placeholder + displayContent.substring(end);
          setDisplayContent(newDisplayContent);
          
          // Update actual content
          const actualContent = processContentForSave(newDisplayContent);
          setContent(actualContent);
          
          // Set cursor after the placeholder
          setTimeout(() => {
            textarea.selectionStart = start + placeholder.length;
            textarea.selectionEnd = start + placeholder.length;
            textarea.focus();
          }, 0);
        };
        reader.readAsDataURL(file);
        return;
      }
    }
  };

  const handleChange = (e) => {
    const newDisplayContent = e.target.value;
    setDisplayContent(newDisplayContent);
    
    // Update actual content in background
    const actualContent = processContentForSave(newDisplayContent);
    setContent(actualContent);

    // Check if user typed "/" at the beginning of an empty block or after a new line
    const lines = newDisplayContent.split('\n');
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
    if (newDisplayContent.endsWith('[[')) {
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
        const lines = displayContent.split('\n');
        lines[lines.length - 1] = '';
        const newDisplayContent = lines.join('\n');
        setDisplayContent(newDisplayContent);
        setContent(processContentForSave(newDisplayContent));
      } else {
        setContent(block.content || '');
        setDisplayContent(processContentForDisplay(block.content || ''));
        setIsEditing(false);
        if (onFocus) onFocus(null); // Clear focus when escaping
      }
    } else if (e.key === 'Enter') {
      // Check for heading markdown at the start of the line
      const lines = displayContent.split('\n');
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
      if (displayContent.trim() === '') {
        e.preventDefault();
        handleSave();
        if (onFocus) onFocus(null); // Clear focus
      }
    }
  };

  const handleCommandSelect = (type, meta) => {
    // Remove the slash from content
    const lines = displayContent.split('\n');
    lines[lines.length - 1] = '';
    const newDisplayContent = lines.join('\n').trimEnd();
    const actualContent = processContentForSave(newDisplayContent);
    
    if (actualContent) {
      // If there's content, save it first
      const extractedTags = extractTagsFromContent(actualContent);
      onUpdate({ content: actualContent, tags: extractedTags });
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
          value={displayContent}
          onChange={handleChange}
          onPaste={handlePaste}
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
              const lines = displayContent.split('\n');
              lines[lines.length - 1] = '';
              setDisplayContent(lines.join('\n'));
              setContent(processContentForSave(lines.join('\n')));
            }}
          />
        )}
        <FloatingToolbar
          show={showToolbar}
          position={toolbarPosition}
          selectedText={selectedText}
          onFormat={handleFormat}
          existingTags={getAllTags()}
          onTag={handleTag}
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
        <div className="space-y-2">
          <div className="space-y-1">
            {processLineBreaksAndLists(block.content)}
          </div>
          {block.tags && block.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {block.tags.map((tag, index) => (
                <span 
                  key={index}
                  className="text-xs bg-accent-green/20 text-accent-green px-2 py-1 rounded"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      ) : (
        <span className="text-text-secondary">Type '/' for commands...</span>
      )}
    </div>
  );
}
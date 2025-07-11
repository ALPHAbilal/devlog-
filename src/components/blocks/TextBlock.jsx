import { useState, useRef, useEffect } from 'react';
import FloatingToolbar from '../FloatingToolbar';
import { parseMarkdown, detectHeadingMarkdown, processLineBreaksAndLists, extractTagsFromContent } from '../../utils/parseMarkdown.jsx';
import { uploadImageToSupabase, compressImage } from '../../utils/imageUploader';
import { useAuth } from '../../contexts/AuthContextOptimized';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function TextBlock({ block, onUpdate, onConvert, isFocused, onFocus, onAddBelow, allBlocks }) {
  const { user } = useAuth();
  // Only auto-edit if this is a truly new block (has no content)
  const [isEditing, setIsEditing] = useState(block.isNew && !block.content ? true : false);
  const [content, setContent] = useState(block.content || '');
  const [slashHint, setSlashHint] = useState('');
  const [slashHintPosition, setSlashHintPosition] = useState(null);
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState(null);
  const [selectedText, setSelectedText] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(block.metadata?.isCollapsed || false);
  const textareaRef = useRef(null);
  const selectionTimeoutRef = useRef(null);
  
  // Constants for collapse behavior
  const MAX_LINES_BEFORE_COLLAPSE = 15;
  const MAX_COLLAPSED_LINES = 10;
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setShowToolbar(false);
      if (selectionTimeoutRef.current) {
        clearTimeout(selectionTimeoutRef.current);
      }
    };
  }, []);
  
  // Extract tags from content dynamically
  const tags = extractTagsFromContent(content);


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
    } else if (!isEditing) {
      // Clean up when exiting edit mode
      setShowToolbar(false);
      setSelectedText('');
      setToolbarPosition(null);
    }
  }, [isEditing, content]);

  // Initialize content
  useEffect(() => {
    if (block.content) {
      setContent(block.content);
    }
  }, [block.content]);

  // Handle clicks outside to exit edit mode and hide toolbar
  useEffect(() => {
    if (!isEditing) return;

    const handleClickOutside = (e) => {
      // Check if click is outside the textarea and toolbar
      if (textareaRef.current && !textareaRef.current.contains(e.target)) {
        // Check if click is on the toolbar
        const toolbar = document.querySelector('.floating-toolbar');
        if (toolbar && toolbar.contains(e.target)) {
          return; // Don't exit if clicking on toolbar
        }
        
        // Exit edit mode and hide everything
        setShowToolbar(false);
        setSelectedText('');
        setToolbarPosition(null);
        handleSave();
      }
    };

    // Add click listener
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditing, content]);

  // Handle text selection for toolbar
  useEffect(() => {
    const handleSelection = () => {
      if (!isEditing || !textareaRef.current) {
        // If not editing, ensure toolbar is hidden
        setShowToolbar(false);
        return;
      }

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
    } else {
      // Ensure toolbar is hidden when not editing
      setShowToolbar(false);
      setSelectedText('');
      setToolbarPosition(null);
    }
  }, [isEditing, content]);

  const handleSave = () => {
    // Hide toolbar immediately
    setShowToolbar(false);
    setSelectedText('');
    setToolbarPosition(null);
    
    // Extract tags from content before saving
    const extractedTags = extractTagsFromContent(content);
    // Remove isNew flag when saving
    onUpdate(block.id, { 
      content: content, 
      tags: extractedTags, 
      isNew: undefined,
      metadata: { ...block.metadata, isCollapsed }
    });
    setIsEditing(false);
    if (onFocus) onFocus(null); // Clear focus
  };
  
  // Update metadata when collapse state changes
  useEffect(() => {
    if (block.metadata?.isCollapsed !== isCollapsed) {
      onUpdate(block.id, { 
        metadata: { ...block.metadata, isCollapsed }
      });
    }
  }, [isCollapsed]);

  const handleTag = (selectedText, tagName) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    // Wrap selected text with tag format
    const taggedText = `#${tagName}[${selectedText}]`;
    const newContent = content.substring(0, start) + taggedText + content.substring(end);
    setContent(newContent);
    

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
    const selectedText = content.substring(start, end);

    if (isSpecial && action === 'link') {
      // For links, wrap in [[]] for document links
      const newText = `[[${selectedText}]]`;
      const newContent = content.substring(0, start) + newText + content.substring(end);
      setContent(newContent);
      // Removed processContentForSave - function was undefined
      
      // Set cursor position after the link
      setTimeout(() => {
        textarea.selectionStart = start + 2;
        textarea.selectionEnd = start + 2 + selectedText.length;
        textarea.focus();
      }, 0);
    } else if (action === 'image') {
      // For images, create image markdown with selected text as alt
      const newText = `![${selectedText}](url)`;
      const newContent = content.substring(0, start) + newText + content.substring(end);
      setContent(newContent);
      // Removed processContentForSave - function was undefined
      
      // Select the 'url' part for easy replacement
      setTimeout(() => {
        textarea.selectionStart = start + 2 + selectedText.length + 2;
        textarea.selectionEnd = start + 2 + selectedText.length + 5;
        textarea.focus();
      }, 0);
    } else if (wrapper) {
      // For regular formatting
      const newText = `${wrapper}${selectedText}${wrapper}`;
      const newContent = content.substring(0, start) + newText + content.substring(end);
      setContent(newContent);
      // Removed processContentForSave - function was undefined
      
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

        if (!user) {
          console.error('User not authenticated');
          return;
        }

        try {
          // Save current text content first
          handleSave();
          
          // Compress image if needed
          let imageToUpload = file;
          if (file.size > 100 * 1024) { // Compress if > 100KB
            imageToUpload = await compressImage(file, 1920, 0.85);
          }
          
          // Upload to Supabase Storage
          const { url, path } = await uploadImageToSupabase(imageToUpload, user.id);
          
          // Create alt text
          const timestamp = new Date().toLocaleString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
          });
          const altText = `Image pasted at ${timestamp}`;
          
          // Check if the previous block is an image block created recently
          let addedToExisting = false;
          if (allBlocks && allBlocks.length > 0) {
            const currentIndex = allBlocks.findIndex(b => b.id === block.id);
            if (currentIndex > 0) {
              const prevBlock = allBlocks[currentIndex - 1];
              // Check if previous block is an image block created within last 30 seconds
              if (prevBlock.type === 'image' && prevBlock.createdAt && 
                  (Date.now() - new Date(prevBlock.createdAt).getTime() < 30000)) {
                // Add to existing image block
                const newImage = {
                  id: crypto.randomUUID(),
                  url: url,
                  alt: altText,
                  size: imageToUpload.size,
                  dimensions: { width: 0, height: 0 } // Will be calculated on display
                };
                const updatedImages = [...(prevBlock.images || []), newImage];
                onUpdate(prevBlock.id, { images: updatedImages });
                addedToExisting = true;
              }
            }
          }
          
          // If not added to existing block, create a new image block
          if (!addedToExisting && onAddBelow) {
            onAddBelow({
              type: 'image',
              images: [{
                id: crypto.randomUUID(),
                url: url,
                alt: altText,
                size: imageToUpload.size,
                dimensions: { width: 0, height: 0 }
              }],
              createdAt: new Date().toISOString(),
              content: '' // Required field for blocks
            });
          }
          
          // Exit edit mode to see the new image block
          setIsEditing(false);
        } catch (error) {
          console.error('Failed to upload image:', error);
        }
        return;
      }
    }
  };

  // Slash commands mapping
  const slashCommands = {
    // Text insertions
    '/h1': { type: 'insert', value: '# ' },
    '/h2': { type: 'insert', value: '## ' },
    '/h3': { type: 'insert', value: '### ' },
    '/bullet': { type: 'insert', value: '- ' },
    '/number': { type: 'insert', value: '1. ' },
    '/checkbox': { type: 'insert', value: '- [ ] ' },
    '/quote': { type: 'insert', value: '> ' },
    '/hr': { type: 'insert', value: '---\n' },
    // Block creations
    '/table': { type: 'block', blockType: 'table' },
    '/code': { type: 'block', blockType: 'code' },
    '/ai': { type: 'block', blockType: 'ai' },
    '/math': { type: 'block', blockType: 'math' },
    '/todo': { type: 'block', blockType: 'todo' },
    '/image': { type: 'block', blockType: 'image' }
  };

  const handleChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);

    // Check if user is typing a slash command
    const lines = newContent.split('\n');
    const currentLine = lines[lines.length - 1];
    
    // Check for slash commands at the beginning of a line
    const slashMatch = currentLine.match(/^(\/)([a-z0-9]*)/i);
    
    if (slashMatch) {
      const typedCommand = slashMatch[0]; // e.g., '/h' or '/h1'
      
      // Find matching commands
      const matchingCommands = Object.keys(slashCommands).filter(cmd => 
        cmd.startsWith(typedCommand) && cmd !== typedCommand
      );
      
      if (matchingCommands.length > 0) {
        // Show hint for the first matching command
        const fullCommand = matchingCommands[0];
        const hint = fullCommand.slice(typedCommand.length);
        setSlashHint(hint);
        
        // Better position calculation
        if (textareaRef.current) {
          const rect = textareaRef.current.getBoundingClientRect();
          const lineHeight = 20;
          const charWidth = 7.2; // More accurate for monospace
          const lineNumber = lines.length - 1;
          const cursorOffset = typedCommand.length * charWidth;
          
          setSlashHintPosition({
            top: rect.top + (lineNumber * lineHeight) + 20,
            left: rect.left + 16 + cursorOffset // 16px for padding
          });
        }
      } else {
        setSlashHint('');
        setSlashHintPosition(null);
      }
      
      // Check if a complete command was typed
      if (slashCommands[typedCommand]) {
        const command = slashCommands[typedCommand];
        console.log('Executing slash command:', typedCommand, '->', command);
        
        if (command.type === 'insert') {
          // Text insertion commands
          const beforeSlash = currentLine.substring(0, 0); // Everything before the slash
          lines[lines.length - 1] = beforeSlash + command.value;
          const expandedContent = lines.join('\n');
          setContent(expandedContent);
          // Removed processContentForSave - function was undefined
          setSlashHint('');
          setSlashHintPosition(null);
          
          // Move cursor to end
          setTimeout(() => {
            if (textareaRef.current) {
              textareaRef.current.selectionStart = expandedContent.length;
              textareaRef.current.selectionEnd = expandedContent.length;
            }
          }, 0);
        } else if (command.type === 'block' && onConvert) {
          // Block creation commands
          // Remove the slash line
          lines[lines.length - 1] = '';
          const cleanedContent = lines.join('\n').trimEnd();
          
          // Save current content if any
          if (cleanedContent) {
            const extractedTags = extractTagsFromContent(cleanedContent);
            onUpdate(block.id, { content: cleanedContent, tags: extractedTags });
          }
          
          // Convert to new block type
          onConvert(command.blockType);
          setSlashHint('');
          setSlashHintPosition(null);
        }
      }
    } else {
      setSlashHint('');
      setSlashHintPosition(null);
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

    // Tab completion for slash commands
    if (e.key === 'Tab' && slashHint) {
      e.preventDefault();
      const lines = content.split('\n');
      const currentLine = lines[lines.length - 1];
      const completedCommand = currentLine + slashHint;
      
      if (slashCommands[completedCommand]) {
        const command = slashCommands[completedCommand];
        
        if (command.type === 'insert') {
          lines[lines.length - 1] = command.value;
        } else if (command.type === 'block' && onConvert) {
          // Handle block creation
          lines[lines.length - 1] = '';
          const cleanedContent = lines.join('\n').trimEnd();
          if (cleanedContent) {
            const extractedTags = extractTagsFromContent(cleanedContent);
            onUpdate(block.id, { content: cleanedContent, tags: extractedTags });
          }
          onConvert(command.blockType);
          setSlashHint('');
          return;
        }
        const expandedContent = lines.join('\n');
        setContent(expandedContent);
        // Removed processContentForSave - function was undefined
        setSlashHint('');
      }
      return;
    }
    
    if (e.key === 'Escape') {
      setContent(block.content || '');
      setIsEditing(false);
      setShowToolbar(false); // Ensure toolbar is hidden
      setSlashHint('');
      if (onFocus) onFocus(null); // Clear focus when escaping
    } else if (e.key === 'Enter') {
      // Check for heading markdown at the start of the line
      const lines = content.split('\n');
      const currentLineIndex = lines.length - 1;
      const currentLine = lines[currentLineIndex];
      
      const headingData = detectHeadingMarkdown(currentLine);
      if (headingData && currentLineIndex === 0 && lines.length === 1) {
        // Convert to heading block
        e.preventDefault();
        onUpdate(block.id, { content: '' }); // Clear current block
        if (onConvert) {
          onConvert('heading', { level: headingData.level, content: headingData.content });
        }
        return;
      }
      
      // If pressing enter on empty block, exit edit mode
      if (content.trim() === '') {
        e.preventDefault();
        setShowToolbar(false); // Ensure toolbar is hidden
        handleSave();
        if (onFocus) onFocus(null); // Clear focus
      }
    }
  };

  // Remove the old command select handler as we no longer need it

  if (isEditing) {
    return (
      <>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onPaste={handlePaste}
          onFocus={() => onFocus && onFocus(block.id)}
          onBlur={(e) => {
            // Don't blur if clicking on toolbar
            const relatedTarget = e.relatedTarget;
            if (relatedTarget && relatedTarget.closest('.floating-toolbar')) {
              return;
            }
            
            // Hide toolbar and save
            setShowToolbar(false);
            setSlashHint('');
            handleSave();
          }}
          onKeyDown={handleKeyDown}
          className="w-full bg-dark-secondary/50 text-text-primary p-4 rounded-lg
                     resize-none focus:outline-none focus:ring-2 focus:ring-accent-green
                     transition-all duration-200"
          placeholder="Type '/' for commands or start writing..."
        />
        {/* Inline hint display */}
        {slashHint && slashHintPosition && (
          <div
            className="fixed pointer-events-none z-50 flex items-baseline gap-2"
            style={{
              top: slashHintPosition.top + 'px',
              left: slashHintPosition.left + 'px'
            }}
          >
            <span className="text-accent-green/30 text-sm font-mono">
              {slashHint}
            </span>
            <span className="text-text-secondary/20 text-xs">
              ↹ Tab
            </span>
          </div>
        )}
        {isEditing && showToolbar && (
          <FloatingToolbar
            show={showToolbar}
            position={toolbarPosition}
            selectedText={selectedText}
            onFormat={handleFormat}
            existingTags={getAllTags()}
            onTag={handleTag}
          />
        )}
      </>
    );
  }

  // Check if content is long enough to show collapse button
  const lines = block.content?.split('\n') || [];
  const isLongContent = lines.length > MAX_LINES_BEFORE_COLLAPSE;
  const displayContent = isCollapsed 
    ? lines.slice(0, MAX_COLLAPSED_LINES).join('\n')
    : block.content;

  return (
    <div className="relative group">
      {/* Collapse button - show when content is long */}
      {isLongContent && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsCollapsed(!isCollapsed);
          }}
          className="absolute right-2 top-2 p-2 bg-dark-primary/80 border border-dark-secondary/50
                     hover:bg-dark-primary hover:border-accent-green/50 rounded-lg 
                     transition-all z-10 flex items-center gap-1.5 shadow-lg"
          title={isCollapsed ? "Expand text" : "Collapse text"}
        >
          {isCollapsed ? 
            <ChevronDown size={16} className="text-accent-green" /> : 
            <ChevronUp size={16} className="text-accent-green" />
          }
          <span className="text-xs text-text-secondary font-medium">
            {isCollapsed ? 'Expand' : 'Collapse'}
          </span>
        </button>
      )}
      
      <div 
        onClick={() => {
          // Don't enter edit mode if clicking on collapsed content
          if (!isCollapsed) {
            // Ensure toolbar is hidden before entering edit mode
            setShowToolbar(false);
            setSelectedText('');
            setToolbarPosition(null);
            setIsEditing(true);
            if (onFocus) onFocus(block.id);
          }
        }}
        className={`text-text-primary p-4 rounded-lg hover:bg-dark-secondary/30 
                   cursor-text transition-all duration-200 min-h-[50px]
                   ${isFocused === false ? 'opacity-40' : 'opacity-100'}
                   ${isCollapsed ? 'border-l-4 border-accent-green/30 pl-3' : ''}`}
      >
        {block.content ? (
          <div className="space-y-2">
            <div className="space-y-1">
              {processLineBreaksAndLists(displayContent)}
              {isCollapsed && lines.length > MAX_COLLAPSED_LINES && (
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCollapsed(false);
                  }}
                  className="mt-2 text-text-secondary/50 text-sm hover:text-text-secondary 
                             cursor-pointer transition-colors"
                >
                  ... {lines.length - MAX_COLLAPSED_LINES} more lines - click to expand
                </div>
              )}
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
    </div>
  );
}
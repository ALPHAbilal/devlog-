import React, { useState, useRef, useEffect, memo } from 'react';
import { Copy, Check, Maximize2, Minimize2, ChevronDown, ChevronUp, Code } from 'lucide-react';
import { Highlight, themes } from 'prism-react-renderer';

function CodeBlock({ block, onUpdate, allBlocks, onNavigateToBlock }) {
  const [isEditing, setIsEditing] = useState(block.isNew && !block.content ? true : false);
  const [code, setCode] = useState(block.content || '');
  const [language, setLanguage] = useState(block.language || 'javascript');
  const [filePath, setFilePath] = useState(block.filePath || '');
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewMode, setViewMode] = useState('normal'); // 'normal', 'compact'
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showFilePathSuggestions, setShowFilePathSuggestions] = useState(false);
  const [filePathSuggestions, setFilePathSuggestions] = useState([]);

  // Update local state when block prop changes
  useEffect(() => {
    setCode(block.content || '');
    setLanguage(block.language || 'javascript');
    setFilePath(block.filePath || '');
  }, [block.content, block.language, block.filePath]);
  const textareaRef = useRef(null);
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);
  
  // Performance monitoring
  useEffect(() => {
    console.log(`💻 CodeBlock ${block.id} rendered at ${new Date().toISOString()}`);
  }, [block.id]);


  // Constants for collapse behavior
  const MAX_COLLAPSED_LINES = 15;
  const VERY_LARGE_THRESHOLD = 100; // Lines threshold for compact view
  const CHARS_PER_LINE = 80; // Approximate
  const MAX_COLLAPSED_HEIGHT = 400; // pixels

  // Auto-resize textarea
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      autoResize();
    }
  }, [isEditing]);

  useEffect(() => {
    if (isEditing) {
      autoResize();
    }
  }, [code]);

  // Handle click outside for language dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowLanguageDropdown(false);
      }
    };

    if (showLanguageDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showLanguageDropdown]);

  const autoResize = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  };

  // Get all existing file paths from all code blocks and file trees
  const getAllFilePaths = () => {
    const paths = new Set();
    
    // Helper function to extract paths from file tree
    const extractPathsFromTree = (items, currentPath = '') => {
      items?.forEach(item => {
        // FileTree uses isFolder property, not type
        if (!item.isFolder && item.name) {
          const fullPath = currentPath ? `${currentPath}/${item.name}` : item.name;
          paths.add(fullPath);
        } else if (item.isFolder && item.children) {
          const folderPath = currentPath ? `${currentPath}/${item.name}` : item.name;
          extractPathsFromTree(item.children, folderPath);
        }
      });
    };
    
    // Get from current document's blocks
    if (allBlocks) {
      allBlocks.forEach(b => {
        if (b.type === 'code' && b.filePath && b.id !== block.id) {
          paths.add(b.filePath);
        } else if (b.type === 'filetree' && b.treeData) {
          // FileTree blocks store data in treeData property
          extractPathsFromTree(b.treeData);
        }
      });
    }
    
    // Get from all documents in localStorage
    try {
      const documents = JSON.parse(localStorage.getItem('journeyLoggerEntries') || '[]');
      documents.forEach(doc => {
        doc.blocks?.forEach(b => {
          if (b.type === 'code' && b.filePath) {
            paths.add(b.filePath);
          } else if (b.type === 'filetree' && b.treeData) {
            // FileTree blocks store data in treeData property
            extractPathsFromTree(b.treeData);
          }
        });
      });
    } catch (error) {
      console.error('Error getting file paths:', error);
    }
    
    return Array.from(paths).sort();
  };

  // Handle file path input changes
  const handleFilePathChange = (e) => {
    const value = e.target.value;
    setFilePath(value);
    
    if (value.length > 0) {
      const allPaths = getAllFilePaths();
      const searchValue = value.toLowerCase();
      
      // Sort suggestions by relevance
      const suggestions = allPaths
        .filter(path => path.toLowerCase().includes(searchValue))
        .sort((a, b) => {
          const aLower = a.toLowerCase();
          const bLower = b.toLowerCase();
          
          // Prioritize exact matches
          if (aLower === searchValue) return -1;
          if (bLower === searchValue) return 1;
          
          // Then prioritize matches that start with the search
          if (aLower.startsWith(searchValue)) return -1;
          if (bLower.startsWith(searchValue)) return 1;
          
          // Then prioritize matches where filename starts with search
          const aFilename = a.split('/').pop().toLowerCase();
          const bFilename = b.split('/').pop().toLowerCase();
          if (aFilename.startsWith(searchValue)) return -1;
          if (bFilename.startsWith(searchValue)) return 1;
          
          // Otherwise sort alphabetically
          return a.localeCompare(b);
        })
        .slice(0, 10); // Limit to 10 suggestions
      
      setFilePathSuggestions(suggestions);
      setShowFilePathSuggestions(suggestions.length > 0);
    } else {
      setShowFilePathSuggestions(false);
    }
  };

  const handleSave = () => {
    onUpdate(block.id, { content: code, language, filePath, isNew: undefined });
    setIsEditing(false);
    setIsFullscreen(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(block.content || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    onUpdate(block.id, { ...block, language: newLanguage });
    setShowLanguageDropdown(false);
  };

  const handleKeyDown = (e) => {
    // Tab key - insert tab character
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const newCode = code.substring(0, start) + '  ' + code.substring(end);
      setCode(newCode);
      // Move cursor after inserted spaces
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 2;
      }, 0);
    }
    // Escape key - cancel editing
    else if (e.key === 'Escape') {
      setCode(block.content || '');
      setIsEditing(false);
      setIsFullscreen(false);
    }
    // Cmd/Ctrl + Enter - save and exit
    else if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
    // Cmd/Ctrl + S - save
    else if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      onUpdate(block.id, { content: code, language });
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Count lines for line numbers
  const lineCount = code.split('\n').length;
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  const supportedLanguages = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'jsx', label: 'JSX' },
    { value: 'tsx', label: 'TSX' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'csharp', label: 'C#' },
    { value: 'cpp', label: 'C++' },
    { value: 'c', label: 'C' },
    { value: 'html', label: 'HTML' },
    { value: 'css', label: 'CSS' },
    { value: 'scss', label: 'SCSS' },
    { value: 'sql', label: 'SQL' },
    { value: 'bash', label: 'Bash' },
    { value: 'json', label: 'JSON' },
    { value: 'yaml', label: 'YAML' },
    { value: 'markdown', label: 'Markdown' },
    { value: 'go', label: 'Go' },
    { value: 'rust', label: 'Rust' },
    { value: 'php', label: 'PHP' },
    { value: 'xml', label: 'XML' },
  ];

  if (isEditing) {
    const editorClasses = isFullscreen 
      ? "fixed inset-0 z-50 bg-dark-primary p-8 overflow-auto"
      : "space-y-2";

    return (
      <div className={`${editorClasses} code-editor-container`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                value={filePath}
                onChange={handleFilePathChange}
                onFocus={() => {
                  if (filePath.length > 0) {
                    handleFilePathChange({ target: { value: filePath } });
                  }
                }}
                onBlur={() => {
                  setTimeout(() => setShowFilePathSuggestions(false), 200);
                }}
                placeholder="File path (e.g., src/components/Block.jsx)"
                className="bg-dark-secondary text-text-primary px-3 py-1 rounded text-sm
                           placeholder-text-secondary/50 focus:outline-none focus:ring-1
                           focus:ring-accent-green/50 min-w-[300px]"
              />
              
              {/* File path suggestions dropdown */}
              {showFilePathSuggestions && filePathSuggestions.length > 0 && (
                <div className="absolute top-full left-0 mt-1 w-full max-h-48 overflow-y-auto
                                bg-dark-secondary rounded-lg shadow-xl border border-dark-primary/50
                                z-[100]">
                  {filePathSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setFilePath(suggestion);
                        setShowFilePathSuggestions(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-text-secondary
                                 hover:bg-dark-primary/50 hover:text-text-primary
                                 transition-colors truncate"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-dark-secondary text-text-primary px-3 py-1 rounded text-sm"
            >
              {supportedLanguages.map(lang => (
                <option key={lang.value} value={lang.value}>{lang.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleFullscreen}
              className="p-1 hover:bg-dark-secondary rounded text-text-secondary hover:text-text-primary"
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <span className="text-text-secondary text-xs">
              {isFullscreen ? "Esc to exit • " : ""}Ctrl+Enter to save
            </span>
          </div>
        </div>
        
        <div className="relative flex bg-dark-primary rounded-lg overflow-hidden">
          {/* Line numbers */}
          <div className="select-none text-text-secondary text-sm font-mono p-4 pr-0 text-right border-r border-dark-secondary">
            {lineNumbers.map(num => (
              <div key={num} className="leading-6">{num}</div>
            ))}
          </div>
          
          {/* Code editor */}
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onBlur={(e) => {
              // Check if the new focus target is within the same code block
              const codeBlockContainer = e.currentTarget.closest('.code-editor-container');
              const newFocusTarget = e.relatedTarget;
              
              // Only save if focus is moving outside the code block
              if (!isFullscreen && (!newFocusTarget || !codeBlockContainer?.contains(newFocusTarget))) {
                handleSave();
              }
            }}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-text-primary p-4 pl-4
                       font-mono text-sm resize-none overflow-hidden
                       focus:outline-none leading-6"
            placeholder="// Enter your code here..."
            spellCheck={false}
            style={{ minHeight: '100px' }}
          />
        </div>
        
        {isFullscreen && (
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => {
                setCode(block.content || '');
                setIsEditing(false);
                setIsFullscreen(false);
              }}
              className="px-4 py-2 text-text-secondary hover:text-text-primary"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-accent-green text-dark-primary rounded hover:bg-accent-green/80"
            >
              Save
            </button>
          </div>
        )}
      </div>
    );
  }

  // Calculate if content should be collapsible
  const codeLines = (block.content || '').split('\n');
  const shouldShowToggle = codeLines.length > MAX_COLLAPSED_LINES;
  const isVeryLarge = codeLines.length > VERY_LARGE_THRESHOLD;
  const displayedLines = shouldShowToggle && !isExpanded 
    ? codeLines.slice(0, MAX_COLLAPSED_LINES) 
    : codeLines;
  const hiddenLinesCount = codeLines.length - MAX_COLLAPSED_LINES;

  // If very large and in compact mode, show summary
  if (isVeryLarge && viewMode === 'compact' && !isEditing) {
    return (
      <div className="group relative bg-dark-primary rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Code size={24} className="text-text-secondary" />
            <div>
              <div className="text-text-primary font-medium">
                {block.language || 'Code'} Block
              </div>
              <div className="text-text-secondary text-sm">
                {codeLines.length} lines • {Math.round((block.content || '').length / 1024)}KB
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('normal')}
              className="px-3 py-1 text-sm bg-dark-secondary hover:bg-dark-secondary/80 
                         rounded text-text-primary transition-colors"
            >
              View Code
            </button>
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-1 text-sm bg-accent-green hover:bg-accent-green/80 
                         rounded text-dark-primary transition-colors"
            >
              Edit
            </button>
            <button
              onClick={handleCopy}
              className="p-1 hover:bg-dark-secondary rounded"
              title="Copy code"
            >
              {copied ? (
                <Check size={16} className="text-accent-green" />
              ) : (
                <Copy size={16} className="text-text-secondary" />
              )}
            </button>
          </div>
        </div>
        
        {/* Preview of first and last few lines */}
        <div className="mt-3 p-3 bg-dark-secondary/30 rounded text-xs font-mono text-text-secondary">
          <div className="opacity-70">
            {codeLines.slice(0, 3).map((line, i) => (
              <div key={i} className="truncate">{line || ' '}</div>
            ))}
          </div>
          <div className="text-center py-1">...</div>
          <div className="opacity-70">
            {codeLines.slice(-3).map((line, i) => (
              <div key={i} className="truncate">{line || ' '}</div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="group relative overflow-visible pt-2" 
      ref={containerRef} 
      data-block-id={block.id}
    >
      {/* File path display - only in view mode */}
      {block.filePath && !isEditing && (
        <div className="absolute -top-3 left-0 text-xs text-accent-green/80 
                        bg-dark-primary px-2 py-1 rounded-t font-mono z-30
                        border border-accent-green/30 border-b-0">
          {block.filePath}
        </div>
      )}
      
      <div className="absolute top-2 right-2 flex items-center gap-2 z-20">
        {/* Language selector dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
            className="flex items-center gap-1 text-text-secondary text-xs bg-dark-primary/80 
                       px-2 py-1 rounded hover:bg-dark-secondary/80 transition-colors"
          >
            {language || 'javascript'}
            <ChevronDown size={12} className={`transition-transform ${showLanguageDropdown ? 'rotate-180' : ''}`} />
          </button>
          
          {showLanguageDropdown && (
            <div className="absolute top-full right-0 mt-1 w-48 bg-dark-secondary rounded-lg
                            shadow-xl border border-dark-primary/50 overflow-hidden z-[100]
                            animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="max-h-64 overflow-y-auto">
                {supportedLanguages.map(lang => (
                  <button
                    key={lang.value}
                    onClick={() => handleLanguageChange(lang.value)}
                    className={`w-full px-3 py-2 text-left text-sm transition-colors
                                ${language === lang.value 
                                  ? 'bg-accent-green/20 text-accent-green' 
                                  : 'text-text-secondary hover:bg-dark-primary/50 hover:text-text-primary'}`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        {isVeryLarge && (
          <button
            onClick={() => setViewMode('compact')}
            className="p-1 hover:bg-dark-secondary rounded opacity-0 group-hover:opacity-100 transition-opacity bg-dark-primary/80"
            title="Switch to compact view"
          >
            <Minimize2 size={16} className="text-text-secondary" />
          </button>
        )}
        <button
          onClick={handleCopy}
          className="p-1 hover:bg-dark-secondary rounded opacity-0 group-hover:opacity-100 transition-opacity bg-dark-primary/80"
          title="Copy code"
        >
          {copied ? (
            <Check size={16} className="text-accent-green" />
          ) : (
            <Copy size={16} className="text-text-secondary" />
          )}
        </button>
      </div>
      
      <div className="bg-dark-primary rounded-lg overflow-hidden">
        <div 
          onClick={() => setIsEditing(true)}
          className={`cursor-text hover:ring-1 hover:ring-dark-secondary transition-all ${
            shouldShowToggle && !isExpanded ? 'max-h-[400px] overflow-hidden' : ''
          }`}
        >
          {block.content ? (
            <Highlight
              theme={themes.nightOwl}
              code={displayedLines.join('\n')}
              language={block.language || 'javascript'}
            >
              {({ className, style, tokens, getLineProps, getTokenProps }) => (
                <div className="flex">
                  {/* Line numbers */}
                  <div className="select-none text-text-secondary text-sm font-mono p-4 pr-0 text-right border-r border-dark-secondary/50">
                    {tokens.map((_, i) => (
                      <div key={i} className="leading-6">
                        {shouldShowToggle && !isExpanded ? i + 1 : i + 1}
                      </div>
                    ))}
                    {shouldShowToggle && !isExpanded && (
                      <div className="leading-6 text-text-secondary/50">...</div>
                    )}
                  </div>
                  
                  {/* Code with syntax highlighting */}
                  <pre className={`${className} flex-1 p-4 pl-4 overflow-x-auto`} style={style}>
                    <code className="font-mono text-sm">
                      {tokens.map((line, i) => (
                        <div key={i} {...getLineProps({ line })} className="leading-6">
                          {line.map((token, key) => (
                            <span key={key} {...getTokenProps({ token })} />
                          ))}
                        </div>
                      ))}
                    </code>
                  </pre>
                </div>
              )}
            </Highlight>
          ) : (
            <div className="flex">
              <div className="select-none text-text-secondary text-sm font-mono p-4 pr-0 text-right border-r border-dark-secondary/50">
                1
              </div>
              <pre className="flex-1 p-4 pl-4">
                <code className="font-mono text-sm text-text-secondary">
                  // Click to add code...
                </code>
              </pre>
            </div>
          )}
        </div>

        {/* Expand/Collapse toggle */}
        {shouldShowToggle && (
          <div className="relative">
            {/* Gradient fade effect when collapsed */}
            {!isExpanded && (
              <div className="absolute -top-16 left-0 right-0 h-16 bg-gradient-to-t from-dark-primary to-transparent pointer-events-none" />
            )}
            
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full py-2 bg-dark-secondary/30 hover:bg-dark-secondary/50 
                         text-text-secondary hover:text-text-primary transition-all
                         flex items-center justify-center gap-2 text-sm font-medium"
            >
              {isExpanded ? (
                <>
                  <ChevronUp size={16} />
                  Collapse
                </>
              ) : (
                <>
                  <ChevronDown size={16} />
                  Show {hiddenLinesCount} more lines
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Memoize CodeBlock to prevent unnecessary re-renders
export default memo(CodeBlock, (prevProps, nextProps) => {
  const willPreventRerender = 
    prevProps.block.id === nextProps.block.id &&
    prevProps.block.content === nextProps.block.content &&
    prevProps.block.language === nextProps.block.language &&
    prevProps.block.filePath === nextProps.block.filePath &&
    prevProps.block.isNew === nextProps.block.isNew;
  
  return willPreventRerender;
});
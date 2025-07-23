import { useState, useRef, useEffect } from 'react';
import { Copy, Check, Maximize2, Minimize2, ChevronDown, ChevronUp, Code, X, Menu } from 'lucide-react';
import { Highlight, themes } from 'prism-react-renderer';
import { useResponsive } from '../../hooks/useResponsive';
import { useTouchGestures } from '../../hooks/useTouchGestures';

export default function ResponsiveCodeBlock({ block, onUpdate, allBlocks, onNavigateToBlock }) {
  const [isEditing, setIsEditing] = useState(block.isNew && !block.content ? true : false);
  const [code, setCode] = useState(block.content || '');
  const [language, setLanguage] = useState(block.language || 'javascript');
  const [filePath, setFilePath] = useState(block.filePath || '');
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewMode, setViewMode] = useState('normal');
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showFilePathSuggestions, setShowFilePathSuggestions] = useState(false);
  const [filePathSuggestions, setFilePathSuggestions] = useState([]);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Responsive hooks
  const { isMobile, isTablet, isTouchDevice } = useResponsive();
  const containerRef = useRef(null);
  const textareaRef = useRef(null);
  const dropdownRef = useRef(null);
  const codeContentRef = useRef(null);

  // Touch gestures for mobile
  useTouchGestures(codeContentRef, {
    onSwipeLeft: isMobile ? () => {
      if (!isEditing) {
        handleCopy();
      }
    } : undefined,
    onDoubleTap: isMobile ? () => {
      if (!isEditing) {
        setIsEditing(true);
      }
    } : undefined,
    swipeThreshold: 100,
  });

  // Update local state when block prop changes
  useEffect(() => {
    setCode(block.content || '');
    setLanguage(block.language || 'javascript');
    setFilePath(block.filePath || '');
  }, [block.content, block.language, block.filePath]);

  // Constants for collapse behavior - adjusted for mobile
  const MAX_COLLAPSED_LINES = isMobile ? 10 : 15;
  const VERY_LARGE_THRESHOLD = isMobile ? 50 : 100;
  const MAX_COLLAPSED_HEIGHT = isMobile ? 300 : 400;

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

  // Handle click outside for dropdowns
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

  // Get all existing file paths (simplified for brevity)
  const getAllFilePaths = () => {
    const paths = new Set();
    
    if (allBlocks) {
      allBlocks.forEach(b => {
        if (b.type === 'code' && b.filePath && b.id !== block.id) {
          paths.add(b.filePath);
        }
      });
    }
    
    return Array.from(paths).sort();
  };

  // Handle file path input changes
  const handleFilePathChange = (e) => {
    const value = e.target.value;
    setFilePath(value);
    
    if (value.length > 0) {
      const allPaths = getAllFilePaths();
      const suggestions = allPaths
        .filter(path => path.toLowerCase().includes(value.toLowerCase()))
        .slice(0, 10);
      
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
    setShowMobileMenu(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(block.content || '');
      setCopied(true);
      
      // Haptic feedback on mobile
      if (isTouchDevice && navigator.vibrate) {
        navigator.vibrate(50);
      }
      
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    onUpdate(block.id, { ...block, language: newLanguage });
    setShowLanguageDropdown(false);
  };

  const handleKeyDown = (e) => {
    // Tab key - insert spaces
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const newCode = code.substring(0, start) + '  ' + code.substring(end);
      setCode(newCode);
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 2;
      }, 0);
    }
    // Escape key
    else if (e.key === 'Escape') {
      setCode(block.content || '');
      setIsEditing(false);
      setIsFullscreen(false);
    }
    // Cmd/Ctrl + Enter
    else if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    
    // Lock body scroll when fullscreen on mobile
    if (isMobile) {
      if (!isFullscreen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    }
  };

  // Count lines
  const codeLines = (block.content || '').split('\n');
  const lineCount = codeLines.length;
  const shouldShowToggle = lineCount > MAX_COLLAPSED_LINES;
  const isVeryLarge = lineCount > VERY_LARGE_THRESHOLD;
  const displayedLines = shouldShowToggle && !isExpanded 
    ? codeLines.slice(0, MAX_COLLAPSED_LINES) 
    : codeLines;
  const hiddenLinesCount = lineCount - MAX_COLLAPSED_LINES;

  const supportedLanguages = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'jsx', label: 'JSX' },
    { value: 'tsx', label: 'TSX' },
    { value: 'python', label: 'Python' },
    { value: 'html', label: 'HTML' },
    { value: 'css', label: 'CSS' },
    { value: 'json', label: 'JSON' },
    { value: 'bash', label: 'Bash' },
    { value: 'markdown', label: 'Markdown' },
  ];

  // Mobile editing interface
  if (isEditing && isMobile) {
    const editorClasses = isFullscreen 
      ? "fixed inset-0 z-50 bg-dark-primary flex flex-col safe-padding"
      : "space-y-2";

    return (
      <div className={`${editorClasses} code-editor-container`}>
        {/* Mobile header */}
        <div className="flex items-center justify-between p-3 bg-dark-secondary">
          <button
            onClick={() => {
              setCode(block.content || '');
              setIsEditing(false);
              setIsFullscreen(false);
            }}
            className="text-text-secondary touch-target-small"
          >
            Cancel
          </button>
          
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="p-2 touch-target-small"
          >
            <Menu size={20} className="text-text-secondary" />
          </button>
          
          <button
            onClick={handleSave}
            className="text-accent-green font-medium touch-target-small"
          >
            Save
          </button>
        </div>

        {/* Mobile menu dropdown */}
        {showMobileMenu && (
          <div className="absolute top-14 right-2 z-50 bg-dark-secondary rounded-lg shadow-xl 
                          border border-dark-primary/50 p-2 animate-slide-down">
            <button
              onClick={toggleFullscreen}
              className="w-full flex items-center gap-3 p-3 text-left rounded 
                         hover:bg-dark-primary/50 text-text-secondary"
            >
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            </button>
            
            <div className="mt-2 p-3 border-t border-dark-primary/50">
              <label className="text-xs text-text-secondary block mb-2">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-dark-primary text-text-primary px-3 py-2 rounded text-sm"
              >
                {supportedLanguages.map(lang => (
                  <option key={lang.value} value={lang.value}>{lang.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* File path input */}
        <div className="px-3">
          <input
            type="text"
            value={filePath}
            onChange={handleFilePathChange}
            placeholder="File path (optional)"
            className="w-full bg-dark-secondary text-text-primary px-3 py-2 rounded text-sm
                       placeholder-text-secondary/50 focus:outline-none focus:ring-1
                       focus:ring-accent-green/50"
          />
        </div>
        
        {/* Code editor */}
        <div className="flex-1 overflow-hidden">
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full h-full bg-dark-primary text-text-primary p-4
                       font-mono text-sm resize-none
                       focus:outline-none"
            placeholder="// Enter your code here..."
            spellCheck={false}
          />
        </div>
      </div>
    );
  }

  // Desktop editing interface (similar to original but with responsive adjustments)
  if (isEditing && !isMobile) {
    const editorClasses = isFullscreen 
      ? "fixed inset-0 z-50 bg-dark-primary p-8 overflow-auto"
      : "space-y-2";

    return (
      <div className={`${editorClasses} code-editor-container`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="text"
              value={filePath}
              onChange={handleFilePathChange}
              placeholder="File path (e.g., src/components/Block.jsx)"
              className="bg-dark-secondary text-text-primary px-3 py-1 rounded text-sm
                         placeholder-text-secondary/50 focus:outline-none focus:ring-1
                         focus:ring-accent-green/50 min-w-[200px] md:min-w-[300px]"
            />
            
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
            <span className="text-text-secondary text-xs hidden sm:inline">
              Ctrl+Enter to save
            </span>
          </div>
        </div>
        
        <div className="relative flex bg-dark-primary rounded-lg overflow-hidden">
          <div className="select-none text-text-secondary text-sm font-mono p-4 pr-0 text-right 
                          border-r border-dark-secondary hidden sm:block">
            {Array.from({ length: lineCount }, (_, i) => (
              <div key={i + 1} className="leading-6">{i + 1}</div>
            ))}
          </div>
          
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onBlur={(e) => {
              if (!isFullscreen && !e.currentTarget.closest('.code-editor-container')?.contains(e.relatedTarget)) {
                handleSave();
              }
            }}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-text-primary p-4
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

  // Compact view for very large code blocks
  if (isVeryLarge && viewMode === 'compact' && !isEditing) {
    return (
      <div className="group relative bg-dark-primary rounded-lg p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
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
              className="px-3 py-1.5 text-sm bg-dark-secondary hover:bg-dark-secondary/80 
                         rounded text-text-primary transition-colors touch-target-small"
            >
              View
            </button>
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-1.5 text-sm bg-accent-green hover:bg-accent-green/80 
                         rounded text-dark-primary transition-colors touch-target-small"
            >
              Edit
            </button>
            <button
              onClick={handleCopy}
              className="p-2 hover:bg-dark-secondary rounded touch-target-small"
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
      </div>
    );
  }

  // Normal view mode
  return (
    <div className="group relative overflow-visible" ref={containerRef} data-block-id={block.id}>
      {/* File path display */}
      {block.filePath && !isEditing && (
        <div className={`absolute -top-3 left-0 text-xs text-accent-green/80 
                        bg-dark-primary px-2 py-1 rounded-t font-mono z-30
                        border border-accent-green/30 border-b-0
                        ${isMobile ? 'max-w-[200px] truncate' : ''}`}>
          {block.filePath}
        </div>
      )}
      
      {/* Actions */}
      <div className={`absolute top-2 right-2 flex items-center gap-2 z-20
                       ${isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} 
                       transition-opacity`}>
        {/* Language indicator */}
        <span className="text-text-secondary text-xs bg-dark-primary/80 px-2 py-1 rounded">
          {language || 'javascript'}
        </span>
        
        {/* Copy button */}
        <button
          onClick={handleCopy}
          className="p-2 bg-dark-primary/80 hover:bg-dark-secondary rounded transition-colors 
                     touch-target-small"
          title="Copy code"
        >
          {copied ? (
            <Check size={16} className="text-accent-green" />
          ) : (
            <Copy size={16} className="text-text-secondary" />
          )}
        </button>
      </div>
      
      <div className="bg-dark-primary rounded-lg overflow-hidden" ref={codeContentRef}>
        <div 
          onClick={() => !isMobile && setIsEditing(true)}
          className={`${!isMobile ? 'cursor-text hover:ring-1 hover:ring-dark-secondary' : ''} 
                      transition-all ${shouldShowToggle && !isExpanded ? `max-h-[${MAX_COLLAPSED_HEIGHT}px] overflow-hidden` : ''}`}
        >
          {block.content ? (
            <Highlight
              theme={themes.nightOwl}
              code={displayedLines.join('\n')}
              language={block.language || 'javascript'}
            >
              {({ className, style, tokens, getLineProps, getTokenProps }) => (
                <div className="flex">
                  {/* Line numbers - hidden on mobile */}
                  {!isMobile && (
                    <div className="select-none text-text-secondary text-sm font-mono p-4 pr-0 
                                    text-right border-r border-dark-secondary/50">
                      {tokens.map((_, i) => (
                        <div key={i} className="leading-6">{i + 1}</div>
                      ))}
                    </div>
                  )}
                  
                  {/* Code with syntax highlighting */}
                  <pre className={`${className} flex-1 p-4 overflow-x-auto momentum-scroll`} 
                       style={{ ...style, WebkitOverflowScrolling: 'touch' }}>
                    <code className={`font-mono ${isMobile ? 'text-xs' : 'text-sm'}`}>
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
              {!isMobile && (
                <div className="select-none text-text-secondary text-sm font-mono p-4 pr-0 
                                text-right border-r border-dark-secondary/50">
                  1
                </div>
              )}
              <pre className="flex-1 p-4">
                <code className={`font-mono ${isMobile ? 'text-xs' : 'text-sm'} text-text-secondary`}>
                  {isMobile ? '// Tap menu to edit...' : '// Click to add code...'}
                </code>
              </pre>
            </div>
          )}
        </div>

        {/* Mobile edit button */}
        {isMobile && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="w-full py-3 bg-dark-secondary/30 hover:bg-dark-secondary/50 
                       text-text-secondary hover:text-text-primary transition-all
                       flex items-center justify-center gap-2 text-sm font-medium"
          >
            Edit Code
          </button>
        )}

        {/* Expand/Collapse toggle */}
        {shouldShowToggle && (
          <div className="relative">
            {!isExpanded && (
              <div className="absolute -top-16 left-0 right-0 h-16 
                              bg-gradient-to-t from-dark-primary to-transparent pointer-events-none" />
            )}
            
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full py-2 bg-dark-secondary/30 hover:bg-dark-secondary/50 
                         text-text-secondary hover:text-text-primary transition-all
                         flex items-center justify-center gap-2 text-sm font-medium
                         touch-target-small"
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
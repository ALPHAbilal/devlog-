import { useState, useRef, useEffect } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { Calculator, X, Check, AlertCircle } from 'lucide-react';

export default function MathBlock({ block, onUpdate, isFocused, onFocus }) {
  const defaultLatex = 'c = \\pm\\sqrt{a^2 + b^2}';
  const [isEditing, setIsEditing] = useState(block.isNew && !block.latex);
  const [latex, setLatex] = useState(block.latex || defaultLatex);
  const [error, setError] = useState(null);
  const [displayMode, setDisplayMode] = useState(block.displayMode ?? true);
  const textareaRef = useRef(null);
  const containerRef = useRef(null);
  const renderedRef = useRef(null);

  // Auto-focus for new blocks
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  // Click outside to save
  useEffect(() => {
    if (!isEditing) return;

    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        handleSave();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isEditing, latex, displayMode]);

  // Render LaTeX
  useEffect(() => {
    if (!isEditing && renderedRef.current) {
      try {
        katex.render(latex || defaultLatex, renderedRef.current, {
          displayMode,
          throwOnError: false,
          errorColor: '#ef4444'
        });
        setError(null);
      } catch (err) {
        setError(err.message);
      }
    }
  }, [isEditing, latex, displayMode]);

  const handleSave = () => {
    // Validate LaTeX
    try {
      katex.renderToString(latex, { 
        displayMode,
        throwOnError: true 
      });
      
      onUpdate({ 
        latex,
        displayMode,
        isNew: undefined // Clear isNew flag
      });
      setIsEditing(false);
      setError(null);
      if (onFocus) onFocus(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCancel = () => {
    setLatex(block.latex || defaultLatex);
    setDisplayMode(block.displayMode ?? true);
    setError(null);
    setIsEditing(false);
    if (onFocus) onFocus(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    } else if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  // Common LaTeX snippets for quick insert
  const snippets = [
    { label: 'Fraction', latex: '\\frac{a}{b}' },
    { label: 'Square root', latex: '\\sqrt{x}' },
    { label: 'Sum', latex: '\\sum_{i=1}^{n}' },
    { label: 'Integral', latex: '\\int_{a}^{b}' },
    { label: 'Matrix', latex: '\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}' },
    { label: 'Greek α', latex: '\\alpha' },
    { label: 'Greek β', latex: '\\beta' },
    { label: 'Greek π', latex: '\\pi' },
  ];

  const insertSnippet = (snippet) => {
    if (!textareaRef.current) return;
    
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const newLatex = latex.substring(0, start) + snippet + latex.substring(end);
    setLatex(newLatex);
    
    // Focus and position cursor after snippet
    setTimeout(() => {
      textareaRef.current.focus();
      textareaRef.current.selectionStart = start + snippet.length;
      textareaRef.current.selectionEnd = start + snippet.length;
    }, 0);
  };

  if (isEditing) {
    return (
      <div ref={containerRef} className="bg-dark-secondary/50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calculator size={20} className="text-accent-green" />
            <span className="text-text-primary font-medium">LaTeX Math</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-text-secondary">
              <input
                type="checkbox"
                checked={displayMode}
                onChange={(e) => setDisplayMode(e.target.checked)}
                className="rounded border-dark-secondary"
              />
              Display mode
            </label>
            <button
              onClick={handleCancel}
              className="p-1.5 text-text-secondary hover:text-text-primary 
                         hover:bg-dark-primary/50 rounded transition-colors"
              title="Cancel (Esc)"
            >
              <X size={16} />
            </button>
            <button
              onClick={handleSave}
              className="p-1.5 text-accent-green hover:bg-accent-green/20 
                         rounded transition-colors"
              title="Save (Ctrl+Enter)"
            >
              <Check size={16} />
            </button>
          </div>
        </div>

        {/* LaTeX input */}
        <textarea
          ref={textareaRef}
          value={latex}
          onChange={(e) => setLatex(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter LaTeX expression..."
          className="w-full bg-dark-primary/50 text-text-primary p-3 rounded-lg
                     font-mono text-sm resize-none focus:outline-none 
                     focus:ring-2 focus:ring-accent-green/50"
          rows={3}
        />

        {/* Quick snippets */}
        <div className="mt-3 flex flex-wrap gap-1">
          {snippets.map((snippet, index) => (
            <button
              key={index}
              onClick={() => insertSnippet(snippet.latex)}
              className="px-2 py-1 text-xs bg-dark-primary/50 text-text-secondary
                         hover:text-text-primary hover:bg-dark-primary/80
                         rounded transition-colors"
              title={snippet.latex}
            >
              {snippet.label}
            </button>
          ))}
        </div>

        {/* Live preview */}
        <div className="mt-4 p-4 bg-dark-primary/30 rounded-lg min-h-[60px]">
          <div className="text-text-secondary text-xs mb-2">Preview:</div>
          <div 
            className={`text-text-primary ${displayMode ? 'text-center' : ''}`}
            style={{ fontSize: displayMode ? '1.25rem' : '1rem' }}
          >
            {(() => {
              try {
                const html = katex.renderToString(latex || defaultLatex, {
                  displayMode,
                  throwOnError: false,
                  errorColor: '#ef4444'
                });
                return <div dangerouslySetInnerHTML={{ __html: html }} />;
              } catch (err) {
                return (
                  <div className="flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle size={16} />
                    <span>{err.message}</span>
                  </div>
                );
              }
            })()}
          </div>
        </div>

        {error && (
          <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded
                          text-red-400 text-sm flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      onClick={() => {
        setIsEditing(true);
        if (onFocus) onFocus(block.id);
      }}
      className={`group relative p-4 rounded-lg hover:bg-dark-secondary/30 
                 cursor-pointer transition-all duration-200
                 ${isFocused === false ? 'opacity-40' : 'opacity-100'}`}
    >
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100
                      transition-opacity">
        <Calculator size={16} className="text-text-secondary" />
      </div>
      
      <div 
        ref={renderedRef}
        className={`text-text-primary ${displayMode ? 'text-center py-2' : ''}`}
        style={{ fontSize: displayMode ? '1.25rem' : '1rem' }}
      />
    </div>
  );
}
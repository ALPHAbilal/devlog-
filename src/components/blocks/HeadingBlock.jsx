import { useState, useRef, useEffect, useCallback } from 'react';

export default function HeadingBlock({ block, onUpdate }) {
  const [isEditing, setIsEditing] = useState(block.isNew && !block.content ? true : false);
  const [content, setContent] = useState(block.content || '');
  const [level, setLevel] = useState(block.level || 2);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Update local state when block changes
  useEffect(() => {
    setContent(block.content || '');
    setLevel(block.level || 2);
  }, [block.content, block.level]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = useCallback(() => {
    onUpdate(block.id, { content, level, isNew: undefined });
    setIsEditing(false);
  }, [content, level, onUpdate]);

  // Handle clicks outside
  useEffect(() => {
    if (!isEditing) return;

    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        handleSave();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isEditing, handleSave]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setContent(block.content || '');
      setIsEditing(false);
    }
  };

  const headingClasses = {
    1: 'font-bold',
    2: 'font-semibold',
    3: 'font-medium',
  };
  
  // Use CSS custom properties for fluid typography
  const headingStyles = {
    1: { fontSize: 'var(--step-4)', lineHeight: 'var(--line-height-tight)' },
    2: { fontSize: 'var(--step-3)', lineHeight: 'var(--line-height-tight)' },
    3: { fontSize: 'var(--step-2)', lineHeight: 'var(--line-height-tight)' },
  };

  if (isEditing) {
    return (
      <div ref={containerRef} className="flex items-start gap-2">
        <select
          value={level}
          onChange={(e) => {
            const newLevel = Number(e.target.value);
            setLevel(newLevel);
            // Update immediately when level changes
            onUpdate(block.id, { content, level: newLevel });
          }}
          className="bg-dark-secondary text-text-primary px-3 py-1.5 rounded text-sm
                     border border-dark-secondary/50 focus:outline-none
                     focus:ring-1 focus:ring-accent-green/50 cursor-pointer flex-shrink-0"
          style={{
            backgroundColor: 'rgb(10, 22, 40)',
            backgroundImage: 'none'
          }}
        >
          <option value={1} style={{ backgroundColor: 'rgb(10, 22, 40)' }}>H1</option>
          <option value={2} style={{ backgroundColor: 'rgb(10, 22, 40)' }}>H2</option>
          <option value={3} style={{ backgroundColor: 'rgb(10, 22, 40)' }}>H3</option>
        </select>
        <input
          ref={inputRef}
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          className={`w-full bg-transparent text-text-primary focus:outline-none 
                     focus:bg-dark-secondary/30 rounded px-2 py-1 ${headingClasses[level]}`}
          style={{
            ...headingStyles[level],
            maxWidth: 'calc(100% - 100px)' // Account for select box and gap
          }}
          placeholder="Enter heading..."
        />
      </div>
    );
  }

  const HeadingTag = `h${level}`;

  return (
    <HeadingTag 
      onClick={() => {
        setContent(block.content || '');
        setLevel(block.level || 2);
        setIsEditing(true);
      }}
      className={`text-text-primary cursor-text hover:bg-dark-secondary/30 
                  rounded px-2 py-1 transition-colors ${headingClasses[level]}`}
      style={headingStyles[level]}
    >
      {block.content || <span className="text-text-secondary">Click to add heading...</span>}
    </HeadingTag>
  );
}
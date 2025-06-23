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
    onUpdate({ content, level, isNew: undefined });
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
    1: 'text-3xl font-bold',
    2: 'text-2xl font-semibold',
    3: 'text-xl font-medium',
  };

  if (isEditing) {
    return (
      <div ref={containerRef} className="flex items-center gap-2">
        <select
          value={level}
          onChange={(e) => {
            const newLevel = Number(e.target.value);
            setLevel(newLevel);
            // Update immediately when level changes
            onUpdate({ content, level: newLevel });
          }}
          className="bg-dark-secondary text-text-primary px-3 py-1.5 rounded text-sm
                     border border-dark-secondary/50 focus:outline-none
                     focus:ring-1 focus:ring-accent-green/50 cursor-pointer"
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
          className={`flex-1 bg-transparent text-text-primary focus:outline-none 
                     focus:bg-dark-secondary/30 rounded px-2 py-1 ${headingClasses[level]}`}
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
    >
      {block.content || <span className="text-text-secondary">Click to add heading...</span>}
    </HeadingTag>
  );
}
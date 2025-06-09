import { useState, useRef, useEffect } from 'react';

export default function HeadingBlock({ block, onUpdate }) {
  const [isEditing, setIsEditing] = useState(block.isNew || false);
  const [content, setContent] = useState(block.content || '');
  const [level, setLevel] = useState(block.level || 2);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    onUpdate({ content, level });
    setIsEditing(false);
  };

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
      <div className="flex items-center gap-2">
        <select
          value={level}
          onChange={(e) => setLevel(Number(e.target.value))}
          className="bg-dark-secondary text-text-primary px-2 py-1 rounded text-sm"
        >
          <option value={1}>H1</option>
          <option value={2}>H2</option>
          <option value={3}>H3</option>
        </select>
        <input
          ref={inputRef}
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onBlur={handleSave}
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
      onClick={() => setIsEditing(true)}
      className={`text-text-primary cursor-text hover:bg-dark-secondary/30 
                  rounded px-2 py-1 transition-colors ${headingClasses[level]}`}
    >
      {block.content || <span className="text-text-secondary">Click to add heading...</span>}
    </HeadingTag>
  );
}
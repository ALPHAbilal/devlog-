import { useState, useRef, useEffect } from 'react';

export default function TextBlock({ block, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(block.content || '');
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

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setContent(block.content || '');
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="w-full bg-dark-secondary/50 text-text-primary p-4 rounded-lg
                   resize-none focus:outline-none focus:ring-2 focus:ring-accent-green"
        placeholder="Type your text here..."
      />
    );
  }

  return (
    <div 
      onClick={() => setIsEditing(true)}
      className="text-text-primary p-4 rounded-lg hover:bg-dark-secondary/30 
                 cursor-text transition-colors min-h-[50px]"
    >
      {block.content || <span className="text-text-secondary">Click to add text...</span>}
    </div>
  );
}
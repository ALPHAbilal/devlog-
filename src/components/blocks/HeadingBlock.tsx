import React, { useState, useRef, useEffect, useCallback, memo, createElement } from 'react';
import type { HeadingBlockData, BlockComponentProps } from '@/features/block';

/**
 * Props for HeadingBlock component
 * Uses BlockComponentProps with HeadingBlockData for type safety
 */
interface HeadingBlockProps extends Pick<BlockComponentProps<HeadingBlockData>, 'block' | 'onUpdate'> {}

type HeadingLevel = 1 | 2 | 3;

/**
 * Helper to extract string content from block.content
 * Handles both legacy string and new {content: string} format
 */
function getContentString(blockContent: string | { content: string } | undefined): string {
  if (!blockContent) return '';
  if (typeof blockContent === 'string') return blockContent;
  return blockContent.content || '';
}

/**
 * HeadingBlock - Document heading with level selection (H1, H2, H3)
 *
 * Features:
 * - Three heading levels with distinct styling
 * - Click-to-edit interface
 * - Keyboard shortcuts (Enter to save, Escape to cancel)
 * - Fluid typography via CSS custom properties
 */
function HeadingBlock({ block, onUpdate }: HeadingBlockProps) {
  const blockContent = getContentString(block.content);
  const [isEditing, setIsEditing] = useState(block.isNew && !blockContent);
  const [content, setContent] = useState(blockContent);
  const [level, setLevel] = useState<HeadingLevel>((block.level as HeadingLevel) || 2);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Performance monitoring
  useEffect(() => {
    console.log(`📌 HeadingBlock ${block.id} rendered at ${new Date().toISOString()}`);
  }, [block.id]);

  // Update local state when block changes
  useEffect(() => {
    setContent(getContentString(block.content));
    setLevel((block.level as HeadingLevel) || 2);
  }, [block.content, block.level]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = useCallback(() => {
    onUpdate(block.id, { content, level, isNew: undefined });
    setIsEditing(false);
  }, [content, level, block.id, onUpdate]);

  // Handle clicks outside
  useEffect(() => {
    if (!isEditing) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        handleSave();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isEditing, handleSave]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setContent(getContentString(block.content));
      setIsEditing(false);
    }
  };

  const headingClasses: Record<HeadingLevel, string> = {
    1: 'text-3xl font-bold',
    2: 'text-2xl font-semibold',
    3: 'text-xl font-medium',
  };

  // Use CSS custom properties for fluid typography (display mode only)
  const headingStyles: Record<HeadingLevel, React.CSSProperties> = {
    1: { fontSize: 'var(--step-4)', lineHeight: 'var(--line-height-tight)' },
    2: { fontSize: 'var(--step-3)', lineHeight: 'var(--line-height-tight)' },
    3: { fontSize: 'var(--step-2)', lineHeight: 'var(--line-height-tight)' },
  };

  if (isEditing) {
    return (
      <div ref={containerRef} className="flex items-center gap-2">
        <select
          value={level}
          onChange={(e) => {
            const newLevel = Number(e.target.value) as HeadingLevel;
            setLevel(newLevel);
            // Update immediately when level changes
            onUpdate(block.id, { content, level: newLevel });
          }}
          className="w-20 bg-dark-secondary text-text-primary px-3 py-1.5 rounded text-sm
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
          className={`flex-1 min-w-0 bg-transparent text-text-primary focus:outline-none
                     focus:bg-dark-secondary/30 rounded px-2 py-1 ${headingClasses[level]}`}
          placeholder="Enter heading..."
        />
      </div>
    );
  }

  // Dynamic heading using createElement to avoid JSX type issues
  const displayContent = getContentString(block.content);

  return createElement(
    `h${level}`,
    {
      onClick: () => {
        setContent(displayContent);
        setLevel((block.level as HeadingLevel) || 2);
        setIsEditing(true);
      },
      className: `text-text-primary cursor-text hover:bg-dark-secondary/30
                  rounded px-2 py-1 transition-colors ${headingClasses[level].split(' ').slice(-2).join(' ')}`,
      style: headingStyles[level],
    },
    displayContent || createElement('span', { className: 'text-text-secondary' }, 'Click to add heading...')
  );
}

// Memoize HeadingBlock to prevent unnecessary re-renders
export default memo(HeadingBlock, (prevProps, nextProps) => {
  const prevContent = getContentString(prevProps.block.content);
  const nextContent = getContentString(nextProps.block.content);

  return (
    prevProps.block.id === nextProps.block.id &&
    prevContent === nextContent &&
    prevProps.block.level === nextProps.block.level &&
    prevProps.block.isNew === nextProps.block.isNew
  );
});

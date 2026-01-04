/**
 * TitleEditor Component
 *
 * Displays and allows editing of the document title.
 * Switches between display and edit mode on click.
 *
 * Part of Phase 5: Component Decomposition
 * Extracted from ExpandedViewEnhanced.jsx
 */

import { memo } from 'react';

// ============== Types ==============

export interface TitleEditorProps {
  title: string;
  isEditing: boolean;
  onTitleChange: (title: string) => void;
  onStartEditing: () => void;
  onSave: () => void;
}

// ============== Component ==============

function TitleEditorComponent({
  title,
  isEditing,
  onTitleChange,
  onStartEditing,
  onSave,
}: TitleEditorProps) {
  if (isEditing) {
    return (
      <input
        type="text"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        onBlur={onSave}
        onKeyDown={(e) => e.key === 'Enter' && onSave()}
        className="text-text-primary text-2xl font-medium bg-transparent
                   border-b border-text-secondary focus:border-accent-green
                   focus:outline-none w-full"
        autoFocus
      />
    );
  }

  return (
    <h1
      onClick={onStartEditing}
      className="text-text-primary text-2xl font-medium cursor-text
                 hover:bg-dark-secondary/30 rounded px-2 py-1 -ml-2
                 transition-colors"
    >
      {title || 'Untitled'}
    </h1>
  );
}

export const TitleEditor = memo(TitleEditorComponent);
export default TitleEditor;

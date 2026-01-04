/**
 * TagManager Component
 *
 * Displays and manages document tags.
 * Supports add, edit, and delete operations.
 *
 * Part of Phase 5: Component Decomposition
 * Extracted from ExpandedViewEnhanced.jsx
 */

import { memo } from 'react';

// ============== Types ==============

export interface TagManagerProps {
  tags: string[];
  isMobileView: boolean;
  // Tag editing state
  isAddingTag: boolean;
  newTag: string;
  editingTagIndex: number | null;
  editingTagValue: string;
  // Callbacks
  onAddTag: () => void;
  onUpdateTag: (index: number, value: string) => void;
  onDeleteTag: (index: number) => void;
  onSetIsAddingTag: (adding: boolean) => void;
  onSetNewTag: (tag: string) => void;
  onSetEditingTagIndex: (index: number | null) => void;
  onSetEditingTagValue: (value: string) => void;
}

// ============== Component ==============

function TagManagerComponent({
  tags,
  isMobileView,
  isAddingTag,
  newTag,
  editingTagIndex,
  editingTagValue,
  onAddTag,
  onUpdateTag,
  onDeleteTag,
  onSetIsAddingTag,
  onSetNewTag,
  onSetEditingTagIndex,
  onSetEditingTagValue,
}: TagManagerProps) {
  return (
    <div className={`flex items-center gap-3 flex-wrap mb-8 ${isMobileView ? 'px-0' : ''}`}>
      {tags.map((tag, index) => (
        <div key={index} className="group relative">
          {editingTagIndex === index ? (
            <input
              type="text"
              value={editingTagValue}
              onChange={(e) => onSetEditingTagValue(e.target.value)}
              onBlur={() => {
                if (editingTagValue.trim()) {
                  onUpdateTag(index, editingTagValue);
                } else {
                  onSetEditingTagIndex(null);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onUpdateTag(index, editingTagValue);
                } else if (e.key === 'Escape') {
                  onSetEditingTagIndex(null);
                  onSetEditingTagValue('');
                }
              }}
              className="px-4 py-2 bg-dark-secondary/50 rounded-full text-text-primary text-sm
                         focus:outline-none focus:ring-2 focus:ring-accent-green/50"
              autoFocus
            />
          ) : (
            <span
              onClick={() => {
                onSetEditingTagIndex(index);
                onSetEditingTagValue(tag);
              }}
              className={`inline-flex items-center gap-2 px-4 py-2 bg-dark-secondary/50
                         rounded-full text-text-secondary text-sm
                         hover:bg-dark-secondary transition-colors cursor-pointer group
                         ${isMobileView ? 'mobile-tag' : ''}`}
            >
              {tag}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteTag(index);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity
                           text-text-secondary/50 hover:text-red-400"
                title="Delete tag"
              >
                ×
              </button>
            </span>
          )}
        </div>
      ))}

      {/* Tag input */}
      {isAddingTag ? (
        <input
          type="text"
          value={newTag}
          onChange={(e) => onSetNewTag(e.target.value)}
          onBlur={() => {
            if (newTag.trim()) {
              onAddTag();
            } else {
              onSetIsAddingTag(false);
              onSetNewTag('');
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onAddTag();
            } else if (e.key === 'Escape') {
              onSetIsAddingTag(false);
              onSetNewTag('');
            }
          }}
          placeholder="Type tag name..."
          className="px-4 py-2 bg-dark-secondary/50 rounded-full text-text-primary text-sm
                     focus:outline-none focus:ring-2 focus:ring-accent-green/50
                     placeholder-text-secondary/50"
          autoFocus
        />
      ) : (
        <button
          onClick={() => onSetIsAddingTag(true)}
          className="px-4 py-2 border border-dashed border-dark-secondary/50
                     rounded-full text-text-secondary text-sm
                     hover:border-text-secondary hover:text-text-primary
                     transition-all opacity-60 hover:opacity-100"
        >
          Add tag...
        </button>
      )}
    </div>
  );
}

export const TagManager = memo(TagManagerComponent);
export default TagManager;

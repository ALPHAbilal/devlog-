/**
 * useTagOperations Hook
 *
 * Manages tag CRUD operations including:
 * - Tag editing state (adding, editing)
 * - Add new tag
 * - Update existing tag
 * - Delete tag
 *
 * Part of Phase 5: Component Decomposition
 * Extracted from ExpandedViewEnhanced.jsx
 */

import { useState, useCallback } from 'react';

// ============== Types ==============

export interface UseTagOperationsOptions {
  tags: string[];
  setTags: (tags: string[]) => void;
  onUpdate: ((id: string, updates: Record<string, unknown>) => Promise<void>) | undefined;
  entryId: string | null;
}

export interface UseTagOperationsReturn {
  // Tag editing state
  isAddingTag: boolean;
  setIsAddingTag: (adding: boolean) => void;
  newTag: string;
  setNewTag: (tag: string) => void;
  editingTagIndex: number | null;
  setEditingTagIndex: (index: number | null) => void;
  editingTagValue: string;
  setEditingTagValue: (value: string) => void;

  // Tag operations
  addTag: () => Promise<void>;
  updateTag: (index: number, value: string) => Promise<void>;
  deleteTag: (index: number) => Promise<void>;
}

// ============== Hook Implementation ==============

export function useTagOperations({
  tags,
  setTags,
  onUpdate,
  entryId,
}: UseTagOperationsOptions): UseTagOperationsReturn {

  // Tag editing state
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [editingTagIndex, setEditingTagIndex] = useState<number | null>(null);
  const [editingTagValue, setEditingTagValue] = useState('');

  // Helper function for saving with proper error handling
  const saveWithStatus = useCallback(async (updates: Record<string, unknown>, description = 'changes') => {
    if (!entryId) {
      throw new Error(`Cannot save ${description}: entryId is undefined`);
    }
    if (!onUpdate) {
      console.warn(`Cannot save ${description}: onUpdate is not provided`);
      return;
    }
    try {
      await onUpdate(entryId, updates);
    } catch (error) {
      console.error(`Failed to save ${description}:`, error);
      throw error;
    }
  }, [entryId, onUpdate]);

  // Add new tag
  const addTag = useCallback(async () => {
    const trimmedTag = newTag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      const updatedTags = [...tags, trimmedTag];
      setTags(updatedTags);
      if (onUpdate) {
        await saveWithStatus({ tags: updatedTags }, 'tags');
      }
      setNewTag('');
      setIsAddingTag(false);
    }
  }, [newTag, tags, setTags, onUpdate, saveWithStatus]);

  // Update existing tag
  const updateTag = useCallback(async (index: number, value: string) => {
    const trimmedValue = value.trim();
    if (trimmedValue && !tags.includes(trimmedValue)) {
      const updatedTags = [...tags];
      updatedTags[index] = trimmedValue;
      setTags(updatedTags);
      if (onUpdate) {
        await saveWithStatus({ tags: updatedTags }, 'tags');
      }
      setEditingTagIndex(null);
      setEditingTagValue('');
    }
  }, [tags, setTags, onUpdate, saveWithStatus]);

  // Delete tag
  const deleteTag = useCallback(async (index: number) => {
    const updatedTags = tags.filter((_, i) => i !== index);
    setTags(updatedTags);
    if (onUpdate) {
      await saveWithStatus({ tags: updatedTags }, 'tags');
    }
  }, [tags, setTags, onUpdate, saveWithStatus]);

  return {
    isAddingTag,
    setIsAddingTag,
    newTag,
    setNewTag,
    editingTagIndex,
    setEditingTagIndex,
    editingTagValue,
    setEditingTagValue,
    addTag,
    updateTag,
    deleteTag,
  };
}

/**
 * useDocumentState Hook
 *
 * Manages document-level state including:
 * - Stabilized entry object (prevents re-renders from parent reference changes)
 * - Title state with editing support
 * - Tags state
 * - Backlinks calculation
 *
 * Part of Phase 5: Component Decomposition
 * Extracted from ExpandedViewEnhanced.jsx
 */

import { useState, useEffect, useMemo } from 'react';
import { getBacklinks } from '@/shared/lib';

// ============== Types ==============

export interface DocumentEntry {
  id: string | null;
  title: string;
  tags: string[];
  blocks: unknown[];
  blockCount: number;
  created_at: string | null;
  updated_at: string | null;
  user_id: string | null;
  folder_id: string | null;
  metadata?: Record<string, unknown>;
}

export interface BacklinkEntry {
  id: string;
  title: string;
  preview: string;
}

export interface UseDocumentStateOptions {
  entry: DocumentEntry | null;
  allEntries: DocumentEntry[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDocumentEntry = any;

export interface UseDocumentStateReturn {
  // Stabilized entry (prevents re-renders from parent reference changes)
  stableEntry: AnyDocumentEntry;

  // Title state
  title: string;
  setTitle: (title: string) => void;
  isEditingTitle: boolean;
  setIsEditingTitle: (editing: boolean) => void;

  // Tags state
  tags: string[];
  setTags: (tags: string[]) => void;

  // Backlinks (computed)
  backlinks: BacklinkEntry[];
}

// ============== Default Entry ==============

const DEFAULT_ENTRY: DocumentEntry = {
  id: null,
  title: '',
  tags: [],
  blocks: [],
  blockCount: 0,
  created_at: null,
  updated_at: null,
  user_id: null,
  folder_id: null,
};

// ============== Hook Implementation ==============

export function useDocumentState({
  entry,
  allEntries
}: UseDocumentStateOptions): UseDocumentStateReturn {

  // CRITICAL FIX: Stabilize entry object to prevent re-renders from parent reference changes
  // Only create new entry reference when ID or title actually changes
  const stableEntry = useMemo(() => {
    if (!entry || !entry.id) {
      return DEFAULT_ENTRY;
    }
    return {
      id: entry.id,
      title: entry.title,
      tags: entry.tags,
      blocks: entry.blocks,
      blockCount: entry.blockCount,
      created_at: entry.created_at,
      updated_at: entry.updated_at,
      user_id: entry.user_id,
      folder_id: entry.folder_id,
      metadata: entry.metadata,
    };
  }, [
    entry?.id,
    entry?.title,
    entry?.tags,
    entry?.blocks?.length,
    entry?.blockCount,
    entry?.created_at,
    entry?.updated_at,
    entry?.user_id,
    entry?.folder_id
  ]);

  // Title state
  const [title, setTitle] = useState(entry?.title || '');
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  // Tags state
  const [tags, setTags] = useState<string[]>(entry?.tags || []);

  // Backlinks state
  const [backlinks, setBacklinks] = useState<BacklinkEntry[]>([]);

  // Sync title/tags when entry changes (e.g., when navigating via document links)
  // Also sync when title changes from parent (after save confirmation)
  useEffect(() => {
    if (!entry) return;
    setTitle(entry.title || '');
    setTags(entry.tags || []);
  }, [entry?.id, entry?.title, entry?.tags]);

  // Calculate backlinks
  useEffect(() => {
    if (!entry?.title) {
      setBacklinks([]);
      return;
    }
    const links = getBacklinks(entry.title, allEntries) as BacklinkEntry[];
    setBacklinks(links);
  }, [entry?.title, allEntries]);

  return {
    stableEntry,
    title,
    setTitle,
    isEditingTitle,
    setIsEditingTitle,
    tags,
    setTags,
    backlinks,
  };
}

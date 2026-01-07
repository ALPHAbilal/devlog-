// src/shared/db/rxdb-types.ts
/**
 * TypeScript types for RxDB collections and documents
 */

import type { RxCollection, RxDocument } from 'rxdb';

// =============================================================================
// Document Types
// =============================================================================

export interface DocumentDocType {
  id: string;
  user_id: string;
  title: string;
  folder_id: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
  doc_position: number;
  created_at: string;
  updated_at: string;
  _modified: number;
  _deleted: boolean;
}

export type DocumentDocument = RxDocument<DocumentDocType>;
export type DocumentCollection = RxCollection<DocumentDocType>;

// =============================================================================
// Folder Types
// =============================================================================

export interface FolderDocType {
  id: string;
  user_id: string;
  name: string;
  parent_id: string | null;
  path: string;
  position: number;
  created_at: string;
  updated_at: string;
  _modified: number;
  _deleted: boolean;
}

export type FolderDocument = RxDocument<FolderDocType>;
export type FolderCollection = RxCollection<FolderDocType>;

// =============================================================================
// Block Types
// =============================================================================

export interface BlockDocType {
  id: string;
  document_id: string;
  type: string;
  content: string | Record<string, unknown>;
  position: number;
  metadata: Record<string, unknown>;
  created_at: string | number;
  updated_at: string | number;
  _modified: number;
  _deleted: boolean;
}

export type BlockDocument = RxDocument<BlockDocType>;
export type BlockCollection = RxCollection<BlockDocType>;

// src/entities/Document/Document.schema.ts
/**
 * Document Schema using Zod
 *
 * Derived from Supabase 'documents' table structure.
 * See: src/shared/lib/storage/adapters/supabase.ts:72-94
 */

import { z } from 'zod';

// =============================================================================
// Document Metadata Schema
// =============================================================================

export const DocumentMetadataSchema = z.object({
  preview: z.string().optional(),
  syncStatus: z.enum(['synced', 'pending', 'error']).optional(),
  savedAt: z.string().optional(),
}).passthrough(); // Allow additional properties

export type DocumentMetadata = z.infer<typeof DocumentMetadataSchema>;

// =============================================================================
// Document Schema
// =============================================================================

export const DocumentSchema = z.object({
  id: z.string().uuid(),
  title: z.string().default('Untitled'),
  tags: z.array(z.string()).default([]),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  deleted_at: z.string().datetime().nullable().optional(),
  metadata: DocumentMetadataSchema.optional(),
  is_template: z.boolean().default(false),
  project_id: z.string().uuid().nullable().optional(),
  folder_id: z.string().uuid().nullable().optional(),
  position: z.number().optional(),
  user_id: z.string().uuid().optional(),
});

export type DocumentData = z.infer<typeof DocumentSchema>;

// =============================================================================
// App-facing Document (transformed from DB)
// =============================================================================

export const AppDocumentSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  preview: z.string().default('Click to view document...'),
  createdAt: z.string(),
  updatedAt: z.string(),
  tags: z.array(z.string()),
  isTemplate: z.boolean(),
  projectId: z.string().uuid().nullable().optional(),
  folder_id: z.string().uuid().nullable().optional(),
  position: z.number().optional(),
  metadata: DocumentMetadataSchema.optional(),
});

export type AppDocument = z.infer<typeof AppDocumentSchema>;

// =============================================================================
// Folder Schema
// =============================================================================

export const FolderSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  parent_id: z.string().uuid().nullable().optional(),
  user_id: z.string().uuid(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  position: z.number().optional(),
});

export type FolderData = z.infer<typeof FolderSchema>;

// =============================================================================
// Transform Functions
// =============================================================================

/**
 * Transform Supabase document to app format
 */
export function toAppDocument(doc: DocumentData): AppDocument {
  return {
    id: doc.id,
    title: doc.title,
    preview: doc.metadata?.preview || 'Click to view document...',
    createdAt: doc.created_at || new Date().toISOString(),
    updatedAt: doc.updated_at || new Date().toISOString(),
    tags: doc.tags || [],
    isTemplate: doc.is_template || false,
    projectId: doc.project_id,
    folder_id: doc.folder_id,
    position: doc.position,
    metadata: doc.metadata || {},
  };
}

/**
 * Transform app document to Supabase format
 */
export function toDbDocument(doc: AppDocument, userId: string): DocumentData {
  return {
    id: doc.id,
    title: doc.title,
    tags: doc.tags,
    created_at: doc.createdAt,
    updated_at: new Date().toISOString(),
    metadata: {
      ...doc.metadata,
      preview: doc.preview,
    },
    is_template: doc.isTemplate,
    project_id: doc.projectId || null,
    folder_id: doc.folder_id || null,
    position: doc.position,
    user_id: userId,
  };
}

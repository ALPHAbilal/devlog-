// src/shared/db/rxdb-schemas.ts
/**
 * RxDB JSON Schemas
 *
 * Based on Supabase table structure.
 * Includes _modified and _deleted for replication.
 *
 * IMPORTANT: All indexed fields MUST be in `required` array.
 * IndexedDB B-Tree indexes require every indexed field to exist in every document.
 * Use sentinel values (empty string '') instead of null for optional fields.
 */

import type { RxJsonSchema } from 'rxdb';

// =============================================================================
// Document Schema
// =============================================================================

export const documentSchema: RxJsonSchema<any> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 36 },
    user_id: { type: 'string', maxLength: 36 },
    title: { type: 'string' },
    // Use empty string '' instead of null (sentinel value for "no folder")
    folder_id: { type: 'string', maxLength: 36, default: '' },
    tags: {
      type: 'array',
      items: { type: 'string' },
      default: []
    },
    metadata: {
      type: 'object',
      default: {}
    },
    doc_position: { type: 'number', default: 0 },
    created_at: { type: 'string', default: '' },
    updated_at: { type: 'string', default: '' },
    // Replication fields
    _modified: { type: 'number', default: 0 },
    _deleted: { type: 'boolean', default: false },
  },
  // ALL indexed fields must be required for Dexie B-Tree indexes
  required: ['id', 'user_id', 'title', 'updated_at'],
  indexes: [
    'user_id',
    'updated_at'
  ],
};

// =============================================================================
// Folder Schema
// =============================================================================

export const folderSchema: RxJsonSchema<any> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 36 },
    user_id: { type: 'string', maxLength: 36 },
    name: { type: 'string' },
    // Use empty string '' instead of null (sentinel value for "root folder")
    parent_id: { type: 'string', maxLength: 36, default: '' },
    path: { type: 'string', default: '' },
    position: { type: 'number', default: 0 },
    created_at: { type: 'string', default: '' },
    updated_at: { type: 'string', default: '' },
    // Replication fields
    _modified: { type: 'number', default: 0 },
    _deleted: { type: 'boolean', default: false },
  },
  // ALL indexed fields must be required for Dexie B-Tree indexes
  required: ['id', 'user_id', 'name'],
  indexes: [
    'user_id'
  ],
};

// =============================================================================
// Block Schema
// =============================================================================

export const blockSchema: RxJsonSchema<any> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 36 },
    document_id: { type: 'string', maxLength: 36 },
    type: { type: 'string' },
    content: { type: ['string', 'object'] },
    position: { type: 'number', default: 0 },
    metadata: {
      type: 'object',
      default: {}
    },
    created_at: { type: 'number', default: 0 },
    updated_at: { type: 'number', default: 0 },
    // Replication fields
    _modified: { type: 'number', default: 0 },
    _deleted: { type: 'boolean', default: false },
  },
  // ALL indexed fields must be required for Dexie B-Tree indexes
  required: ['id', 'document_id', 'type', 'position'],
  indexes: [
    'document_id',
    'position'
  ],
};

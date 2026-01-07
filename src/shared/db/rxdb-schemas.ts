// src/shared/db/rxdb-schemas.ts
/**
 * RxDB JSON Schemas
 *
 * Based on Supabase table structure.
 * Includes _modified and _deleted for replication.
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
    folder_id: { type: ['string', 'null'] },
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
    created_at: { type: 'string' },
    updated_at: { type: 'string' },
    // Replication fields
    _modified: { type: 'number' },
    _deleted: { type: 'boolean', default: false },
  },
  required: ['id', 'user_id', 'title'],
  indexes: [
    'user_id',
    // Note: folder_id removed from index - nullable fields can't be indexed in Dexie
    'updated_at',
    '_modified'
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
    parent_id: { type: ['string', 'null'] },
    path: { type: 'string' },
    position: { type: 'number', default: 0 },
    created_at: { type: 'string' },
    updated_at: { type: 'string' },
    // Replication fields
    _modified: { type: 'number' },
    _deleted: { type: 'boolean', default: false },
  },
  required: ['id', 'user_id', 'name'],
  indexes: [
    'user_id',
    // Note: parent_id removed from index - nullable fields can't be indexed in Dexie
    '_modified'
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
    position: { type: 'number' },
    metadata: {
      type: 'object',
      default: {}
    },
    created_at: { type: ['string', 'number'] },
    updated_at: { type: ['string', 'number'] },
    // Replication fields
    _modified: { type: 'number' },
    _deleted: { type: 'boolean', default: false },
  },
  required: ['id', 'document_id', 'type', 'position'],
  indexes: [
    'document_id',
    'position',
    '_modified'
  ],
};

/**
 * Document Entity - Re-exports for FSD external access
 *
 * Source of truth: Document.schema.ts and Document.repository.ts
 *
 * This barrel provides cross-feature entity access following
 * Feature-Sliced Design (FSD) patterns.
 */

// Schema and types
export {
  DocumentSchema,
  DocumentMetadataSchema,
  AppDocumentSchema,
  FolderSchema,
  toAppDocument,
  toDbDocument,
  type DocumentData,
  type DocumentMetadata,
  type AppDocument,
  type FolderData,
} from './Document.schema';

// Repository
export { DocumentRepository, documentRepository } from './Document.repository';

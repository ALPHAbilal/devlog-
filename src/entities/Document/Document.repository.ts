// src/entities/Document/Document.repository.ts
/**
 * Document Repository
 *
 * Hybrid offline-first pattern:
 * 1. Write to Dexie immediately (instant local persistence)
 * 2. Queue for Supabase sync (background when online)
 * 3. Read from Dexie first, sync from Supabase
 */

import { db, type LocalDocument } from '@/shared/lib/storage/dexie-db';
import { syncQueueManager } from '@/shared/lib/storage/sync-queue-manager';
import { optimizedSupabase } from '@/shared/api';
import {
  DocumentSchema,
  toAppDocument,
  toDbDocument,
  type DocumentData,
  type AppDocument
} from './Document.schema';

interface ListDocumentsOptions {
  folderId?: string | null;
  includeDeleted?: boolean;
  limit?: number;
  offset?: number;
}

export class DocumentRepository {
  /**
   * Get single document by ID
   * Returns from Dexie (local-first), syncs from Supabase in background
   */
  async getDocument(id: string): Promise<AppDocument | null> {
    // Try Dexie first
    const localDoc = await db.documents.get(id);

    if (localDoc) {
      // Trigger background sync if needed
      if (!localDoc._isSynced && typeof navigator !== 'undefined' && navigator.onLine) {
        this.syncFromServer(id);
      }
      return toAppDocument(localDoc);
    }

    // Not in Dexie, fetch from Supabase
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      const serverDoc = await this.fetchFromServer(id);
      if (serverDoc) {
        // Store in Dexie for offline access
        await this.saveToLocal(serverDoc, true);
        return toAppDocument(serverDoc);
      }
    }

    return null;
  }

  /**
   * Save document (create or update)
   * Writes to Dexie immediately, queues for Supabase sync
   */
  async saveDocument(doc: AppDocument, userId: string): Promise<AppDocument> {
    const dbDoc = toDbDocument(doc, userId);

    // Validate with Zod
    const validated = DocumentSchema.parse(dbDoc);

    // Write to Dexie immediately
    const localDoc: LocalDocument = {
      ...validated,
      _isSynced: false,
      _localUpdatedAt: Date.now(),
      _serverUpdatedAt: null,
    };

    await db.documents.put(localDoc);

    // Queue for Supabase sync
    await syncQueueManager.enqueue(
      'document',
      validated.id,
      'UPDATE', // upsert behavior
      validated as Record<string, unknown>
    );

    return toAppDocument(localDoc);
  }

  /**
   * Delete document (soft delete)
   */
  async deleteDocument(id: string): Promise<void> {
    // Update in Dexie
    await db.documents.update(id, {
      deleted_at: new Date().toISOString(),
      _isSynced: false,
      _localUpdatedAt: Date.now(),
    });

    // Queue for Supabase sync
    await syncQueueManager.enqueue('document', id, 'DELETE', { id });
  }

  /**
   * List documents with optional filters
   */
  async listDocuments(options: ListDocumentsOptions = {}): Promise<AppDocument[]> {
    const { folderId, includeDeleted = false, limit = 50, offset = 0 } = options;

    let query = db.documents.orderBy('_localUpdatedAt').reverse();

    if (!includeDeleted) {
      query = query.filter(doc => !doc.deleted_at);
    }

    if (folderId !== undefined) {
      query = query.filter(doc => doc.folder_id === folderId);
    }

    const docs = await query.offset(offset).limit(limit).toArray();
    return docs.map(toAppDocument);
  }

  /**
   * Sync document from Supabase server
   */
  private async syncFromServer(id: string): Promise<void> {
    try {
      const serverDoc = await this.fetchFromServer(id);
      if (serverDoc) {
        await this.saveToLocal(serverDoc, true);
      }
    } catch (error) {
      console.error('Error syncing document from server:', error);
    }
  }

  /**
   * Fetch document from Supabase
   */
  private async fetchFromServer(id: string): Promise<DocumentData | null> {
    const supabase = optimizedSupabase.getClient();
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return DocumentSchema.parse(data);
  }

  /**
   * Save document to Dexie
   */
  private async saveToLocal(doc: DocumentData, isSynced: boolean): Promise<void> {
    const localDoc: LocalDocument = {
      ...doc,
      _isSynced: isSynced,
      _localUpdatedAt: Date.now(),
      _serverUpdatedAt: isSynced ? doc.updated_at || null : null,
    };
    await db.documents.put(localDoc);
  }
}

// Singleton instance
export const documentRepository = new DocumentRepository();
export default documentRepository;

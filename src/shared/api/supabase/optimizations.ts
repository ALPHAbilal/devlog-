// Supabase Performance Optimization Utilities
// This file contains helper functions and types for using the new optimized database functions

// Import the existing Supabase client from the optimized instance
import { supabase } from './optimized-client';

// Types for batch operations
interface BatchInsertResult {
  id: string;
  position: number;
  success: boolean;
  error: string | null;
}

interface BatchUpdateResult {
  block_id: string;
  success: boolean;
  error: string | null;
}

interface DocumentStats {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  is_template: boolean;
  tags: string[];
  metadata: Record<string, any>;
  block_count: number;
  content_length: number;
  link_count: number;
}

interface DocumentVersion {
  id: string;
  document_id: string;
  version_number: number;
  title: string;
  snapshot: {
    title: string;
    tags: string[];
    is_template: boolean;
    metadata: Record<string, any>;
    blocks: any[];
  };
  created_by: string;
  created_at: string;
  change_summary: string | null;
  metadata: Record<string, any>;
}

// Soft Delete Operations
export async function softDeleteDocument(documentId: string) {
  const { error } = await supabase.rpc('soft_delete_document', {
    doc_id: documentId
  });
  
  if (error) throw error;
  return true;
}

export async function restoreDocument(documentId: string) {
  const { error } = await supabase.rpc('restore_document', {
    doc_id: documentId
  });
  
  if (error) throw error;
  return true;
}

// Batch Operations
export async function batchInsertBlocks(
  documentId: string, 
  blocks: Array<{
    id?: string;
    type: string;
    content: string;
    position?: number;
    metadata?: Record<string, any>;
    language?: string;
    file_path?: string;
  }>
): Promise<BatchInsertResult[]> {
  const { data, error } = await supabase.rpc('batch_insert_blocks', {
    doc_id: documentId,
    blocks: blocks
  });
  
  if (error) throw error;
  return data || [];
}

export async function batchUpdateBlocks(
  updates: Array<{
    id: string;
    content?: string;
    position?: number;
    metadata?: Record<string, any>;
    language?: string;
    file_path?: string;
  }>
): Promise<BatchUpdateResult[]> {
  const { data, error } = await supabase.rpc('batch_update_blocks', {
    updates: updates
  });
  
  if (error) throw error;
  return data || [];
}

export async function saveDocumentBlocksOptimized(
  documentId: string,
  blocks: any[]
) {
  const { error } = await supabase.rpc('save_document_blocks_v2', {
    doc_id: documentId,
    blocks: blocks
  });
  
  if (error) throw error;
  return true;
}

export async function batchDeleteBlocks(blockIds: string[]): Promise<number> {
  const { data, error } = await supabase.rpc('batch_delete_blocks', {
    block_ids: blockIds
  });
  
  if (error) throw error;
  return data || 0;
}

// Document Versioning
export async function createDocumentVersion(
  documentId: string,
  summary?: string
): Promise<DocumentVersion> {
  const { data, error } = await supabase.rpc('create_document_version', {
    doc_id: documentId,
    summary: summary
  });
  
  if (error) throw error;
  return data;
}

export async function restoreDocumentVersion(versionId: string) {
  const { error } = await supabase.rpc('restore_document_version', {
    version_id: versionId
  });
  
  if (error) throw error;
  return true;
}

export async function getVersionDiff(version1Id: string, version2Id: string) {
  const { data, error } = await supabase.rpc('get_version_diff', {
    version1_id: version1Id,
    version2_id: version2Id
  });
  
  if (error) throw error;
  return data;
}

// Optimized Queries
export async function getDocumentsWithStats(options: {
  pageSize?: number;
  pageOffset?: number;
  sortBy?: 'updated_at' | 'created_at' | 'title';
  sortDesc?: boolean;
  filterTemplate?: boolean;
  filterTags?: string[];
} = {}): Promise<DocumentStats[]> {
  const { data, error } = await supabase.rpc('get_documents_with_stats', {
    page_size: options.pageSize || 20,
    page_offset: options.pageOffset || 0,
    sort_by: options.sortBy || 'updated_at',
    sort_desc: options.sortDesc !== false,
    filter_template: options.filterTemplate,
    filter_tags: options.filterTags
  });
  
  if (error) throw error;
  return data || [];
}

export async function getUserDocumentStats() {
  const { data, error } = await supabase.rpc('get_user_document_stats');
  
  if (error) throw error;
  return data;
}

// Cache Management
export async function updateDocumentCache(documentId: string) {
  const { error } = await supabase.rpc('update_document_cache', {
    doc_id: documentId
  });
  
  if (error) throw error;
  return true;
}

export async function rebuildUserCaches(): Promise<number> {
  const { data, error } = await supabase.rpc('rebuild_user_caches');

  if (error) throw error;
  return data || 0;
}

// =====================================================
// Real Activity Statistics (Audit-Based)
// =====================================================

interface DocumentActivity {
  week_start: string;
  edit_count: number;
  blocks_added: number;
  blocks_modified: number;
  blocks_deleted: number;
  total_changes: number;
}

interface UserActivityStats {
  total_edits: number;
  documents_modified: number;
  blocks_created: number;
  blocks_modified: number;
  most_active_day: string;
  avg_daily_edits: number;
}

interface DocumentWithRealActivity {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  folder_id: string | null;
  doc_position: number;
  metadata: Record<string, any>;
  tags: string[];
  block_count: number;
  last_edited: string | null;
  edit_count_7d: number;
  edit_count_30d: number;
  recent_activity: any[] | null;
}

export async function getDocumentActivity(
  documentId: string,
  weeks: number = 20
): Promise<DocumentActivity[]> {
  const { data, error } = await supabase.rpc('get_document_activity', {
    p_document_id: documentId,
    p_weeks: weeks
  });

  if (error) throw error;
  return data || [];
}

export async function getUserActivityStats(
  userId: string
): Promise<UserActivityStats | null> {
  const { data, error } = await supabase.rpc('get_user_activity_stats', {
    p_user_id: userId
  });

  if (error) throw error;
  return data && data.length > 0 ? data[0] : null;
}

export async function getDocumentsWithRealActivity(options: {
  userId: string;
  limit?: number;
  offset?: number;
} = { userId: '', limit: 50, offset: 0 }): Promise<DocumentWithRealActivity[]> {
  const { data, error } = await supabase.rpc('get_documents_with_real_activity', {
    p_user_id: options.userId,
    p_limit: options.limit || 50,
    p_offset: options.offset || 0
  });

  if (error) throw error;
  return data || [];
}

// Example usage in a React component:
/*
import { useEffect, useState } from 'react';
import { getDocumentsWithStats, createDocumentVersion } from './supabase-optimizations';

function DocumentList() {
  const [documents, setDocuments] = useState<DocumentStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocuments();
  }, []);

  async function loadDocuments() {
    try {
      const docs = await getDocumentsWithStats({
        pageSize: 20,
        sortBy: 'updated_at',
        sortDesc: true
      });
      setDocuments(docs);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  }

  async function saveVersion(documentId: string) {
    try {
      await createDocumentVersion(documentId, 'Manual save point');
      alert('Version saved successfully!');
    } catch (error) {
      console.error('Error saving version:', error);
    }
  }

  return (
    <div>
      {documents.map(doc => (
        <div key={doc.id}>
          <h3>{doc.title}</h3>
          <p>Blocks: {doc.block_count}, Size: {doc.content_length} chars</p>
          <button onClick={() => saveVersion(doc.id)}>Save Version</button>
        </div>
      ))}
    </div>
  );
}
*/

// Performance tips:
// 1. Use batch operations when dealing with multiple blocks
// 2. Use getDocumentsWithStats instead of fetching documents and counting blocks separately
// 3. Call updateDocumentCache after major changes if real-time stats aren't critical
// 4. Use soft delete for user-facing deletes to allow recovery
// 5. Create versions before major document changes
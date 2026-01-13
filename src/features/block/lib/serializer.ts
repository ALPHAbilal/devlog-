/**
 * Block Serialization Utility - Zod-Based
 *
 * Provides a robust serialization/deserialization layer for different block types
 * using Zod schemas for automatic validation and field filtering.
 *
 * @module blockSerializer
 */

import { getBlockContentSchema } from './schemas';
import type { BlockData, SerializedBlock, FileTreeNode, TypedBlockData } from './schemas';

/**
 * Helper: Remove file content from tree nodes for snapshot storage
 * Returns a sanitized copy without the content field
 */
function sanitizeTreeForSnapshot(nodes: FileTreeNode[]): FileTreeNode[] {
  if (!Array.isArray(nodes)) return [];
  return nodes.map(node => {
    const sanitized: FileTreeNode = {
      id: node.id,
      name: node.name,
      isFolder: node.isFolder !== undefined ? node.isFolder : node.type === 'folder',
      type: node.type || (node.isFolder ? 'folder' : 'file'),
    };
    if (node.children) {
      sanitized.children = sanitizeTreeForSnapshot(node.children);
    }
    return sanitized;
  });
}

// Helper function to safely get property from record
function get<T>(obj: Record<string, unknown>, key: string): T | undefined {
  return obj[key] as T | undefined;
}

/**
 * Serializes a block for storage in the database
 * Uses Zod schemas to automatically validate and filter invalid fields
 */
export function serializeBlock(block: BlockData | TypedBlockData): SerializedBlock {
  if (!block || !block.type) {
    console.warn('BlockSerializer: Invalid block provided for serialization', block);
    return block as unknown as SerializedBlock;
  }

  // Log input for debugging
  console.log('🔍 BlockSerializer.serialize INPUT:', {
    id: block.id,
    type: block.type,
    hasContent: 'content' in block,
    hasData: 'data' in block,
    blockKeys: Object.keys(block)
  });

  // Base structure - CRITICAL: Preserve document_id and user_id for RLS
  const b = block as unknown as Record<string, unknown>;
  const serialized: Record<string, unknown> = {
    id: block.id,
    document_id: b['document_id'],  // Preserve for RxDB storage
    user_id: b['user_id'],          // Preserve for RLS
    type: block.type,
    position: block.position,
    metadata: block.metadata || {},
    created_at: block.created_at,
    updated_at: block.updated_at
  };

  const schema = getBlockContentSchema(block.type);

  if (!schema) {
    console.warn(`BlockSerializer: No schema for type '${block.type}', using fallback`);
    serialized['content'] = get(block as unknown as Record<string, unknown>, 'content') || '';
    return serialized as SerializedBlock;
  }

  // Declare dataToValidate BEFORE try block so catch block can access it
  let dataToValidate: Record<string, unknown> = {};

  try {
    // Extract data based on block type
    if (block.type === 'text' || block.type === 'heading' || block.type === 'code') {
      dataToValidate = { content: get(b, 'content') || '' };
    } else if (block.type === 'ai') {
      dataToValidate = {
        messages: get(b, 'messages') || [],
        metadata: get(b, 'metadata') || {}
      };
    } else if (block.type === 'image') {
      dataToValidate = {
        images: get(b, 'images') || [],
        layout: get(b, 'layout') || 'grid',
        columns: get(b, 'columns') || 3
      };
    } else if (block.type === 'inline-image') {
      dataToValidate = {
        url: get(b, 'url') || '',
        alt: get(b, 'alt') || '',
        caption: get(b, 'caption') || '',
        dimensions: get(b, 'dimensions') || null
      };
    } else if (block.type === 'table') {
      const data = get<Record<string, unknown>>(b, 'data');
      dataToValidate = {
        data: {
          headers: data?.['headers'] || ['Column 1', 'Column 2'],
          rows: data?.['rows'] || [['', '']],
          columnAlignments: data?.['columnAlignments'] || ['left', 'left'],
          hasHeaderRow: data?.['hasHeaderRow'] !== undefined ? data['hasHeaderRow'] : true
        }
      };
    } else if (block.type === 'todo') {
      const data = get<Record<string, unknown>>(b, 'data');
      dataToValidate = {
        data: {
          todos: data?.['todos'] || []
        }
      };
    } else if (block.type === 'issue-tracker') {
      const data = get<Record<string, unknown>>(b, 'data');
      dataToValidate = {
        data: {
          milestone: data?.['milestone'] || '',
          issues: data?.['issues'] || []
        }
      };
    } else if (block.type === 'filetree') {
      const rawSnapshots = get(b, 'snapshots') || [];
      const rawTreeData = get(b, 'treeData') || [];

      // DEBUG: Log tree data with file content
      const countContent = (nodes: unknown[]): number => {
        return (nodes as Array<{content?: string; children?: unknown[]}>).reduce((acc, n) => {
          const hasContent = n?.content ? 1 : 0;
          const childContent = n?.children ? countContent(n.children) : 0;
          return acc + hasContent + childContent;
        }, 0);
      };

      console.log('🌲 FileTree SERIALIZE:', {
        treeDataLength: (rawTreeData as unknown[]).length,
        filesWithContent: countContent(rawTreeData as unknown[]),
        snapshotCount: (rawSnapshots as unknown[]).length,
        hasComments: (rawSnapshots as Array<{comment?: string}>).some(s => s?.comment),
        rawTreeDataSample: JSON.stringify(rawTreeData).substring(0, 200)
      });

      dataToValidate = {
        treeData: rawTreeData,
        expanded: get(b, 'expanded') || [],
        snapshots: rawSnapshots,
        currentSnapshotId: get(b, 'currentSnapshotId') || null,
        snapshotLimit: get(b, 'snapshotLimit') || 50
      };
    }

    // Zod validates and filters invalid fields automatically
    const validated = schema.parse(dataToValidate);
    serialized['content'] = JSON.stringify(validated);

  } catch (error) {
    console.error(`BlockSerializer: Validation failed for ${block.type}:`, error);
    console.error(`BlockSerializer: Failed data:`, dataToValidate);

    // Preserve original data instead of wiping with empty defaults
    const content = get(b, 'content');
    if (content && typeof content === 'string') {
      serialized['content'] = content;
    } else if (content && typeof content === 'object') {
      serialized['content'] = JSON.stringify(content);
    } else {
      const safeDefault = schema.safeParse({});
      if (safeDefault.success) {
        serialized['content'] = JSON.stringify(safeDefault.data);
      } else {
        serialized['content'] = JSON.stringify(dataToValidate);
      }
    }
  }

  // Add direct fields to metadata (for code blocks: language, filePath)
  const metadata = serialized['metadata'] as Record<string, unknown>;
  if (block.type === 'code') {
    const lang = get(b, 'language');
    const path = get(b, 'filePath');
    if (lang) metadata['language'] = lang;
    if (path) metadata['filePath'] = path;
  }
  if (block.type === 'heading') {
    const level = get(b, 'level');
    if (level) metadata['level'] = level;
  }

  // Log output
  console.log('🔍 BlockSerializer.serialize OUTPUT:', {
    id: serialized['id'],
    type: serialized['type'],
    position: serialized['position'],
    contentLength: (serialized['content'] as string)?.length,
    contentPreview: (serialized['content'] as string)?.substring(0, 100)
  });

  return serialized as SerializedBlock;
}

/**
 * Deserializes a block from database storage
 * Uses Zod schemas to automatically validate and filter invalid fields
 */
export function deserializeBlock(block: SerializedBlock): TypedBlockData {
  // Log input
  console.log('🔎 BlockSerializer.deserialize INPUT:', {
    id: block?.id,
    type: block?.type,
    hasContent: block ? 'content' in block : false,
    contentType: typeof block?.content,
    contentLength: block?.content?.length,
    blockKeys: Object.keys(block || {})
  });

  if (!block || !block.type) {
    console.error('❌ BlockSerializer: CRITICAL - No type field for deserialization!', {
      block,
      hasBlock: !!block,
      blockType: block?.type,
      blockId: block?.id
    });
    return block as unknown as TypedBlockData;
  }

  // Base structure
  const deserialized: Record<string, unknown> = {
    id: block.id,
    type: block.type,
    position: block.position || 0,
    metadata: block.metadata || {},
    created_at: block.created_at,
    updated_at: block.updated_at
  };

  const schema = getBlockContentSchema(block.type);

  if (!schema) {
    console.warn(`BlockSerializer: No schema for type '${block.type}', using fallback`);
    deserialized['content'] = block.content || '';
    return deserialized as TypedBlockData;
  }

  // Declare parsed OUTSIDE the try block so catch block can access it
  let parsed: unknown = null;

  // Parse content
  if (block.content) {
    try {
      // Parse content - Zod schemas handle both legacy (plain string) and new (JSON) formats
      parsed = typeof block.content === 'string'
        ? (() => {
            try {
              return JSON.parse(block.content);
            } catch {
              // Not JSON - return as-is for Zod to handle (legacy plain text)
              return block.content;
            }
          })()
        : block.content;

      // Zod validates and automatically handles both formats
      const validated = schema.parse(parsed) as Record<string, unknown>;

      // Map validated data back to block structure
      if (block.type === 'text' || block.type === 'heading' || block.type === 'code') {
        deserialized['content'] = validated['content'] || '';
      } else if (block.type === 'ai') {
        deserialized['messages'] = validated['messages'] || [];
        const validatedMeta = validated['metadata'];
        if (validatedMeta) {
          deserialized['metadata'] = {
            ...(deserialized['metadata'] as object),
            ...(validatedMeta as object)
          };
        }
      } else if (block.type === 'image') {
        deserialized['images'] = validated['images'] || [];
        deserialized['layout'] = validated['layout'] || 'grid';
        deserialized['columns'] = validated['columns'] || 3;
      } else if (block.type === 'inline-image') {
        deserialized['url'] = validated['url'] || '';
        deserialized['alt'] = validated['alt'] || '';
        deserialized['caption'] = validated['caption'] || '';
        deserialized['dimensions'] = validated['dimensions'] || null;
      } else if (block.type === 'table') {
        deserialized['data'] = validated['data'] || {
          headers: ['Column 1', 'Column 2'],
          rows: [['', '']],
          columnAlignments: ['left', 'left'],
          hasHeaderRow: true
        };
      } else if (block.type === 'todo') {
        deserialized['data'] = validated['data'] || { todos: [] };
      } else if (block.type === 'issue-tracker') {
        deserialized['data'] = validated['data'] || {
          milestone: '',
          issues: []
        };
      } else if (block.type === 'filetree') {
        deserialized['treeData'] = validated['treeData'] || [];
        deserialized['expanded'] = validated['expanded'] || [];
        deserialized['snapshots'] = validated['snapshots'] || [];
        deserialized['currentSnapshotId'] = validated['currentSnapshotId'] || null;
        deserialized['snapshotLimit'] = validated['snapshotLimit'] || 50;

        // DEBUG: Log deserialized filetree data
        const countContent = (nodes: unknown[]): number => {
          return (nodes as Array<{content?: string; children?: unknown[]}>).reduce((acc, n) => {
            const hasContent = n?.content ? 1 : 0;
            const childContent = n?.children ? countContent(n.children) : 0;
            return acc + hasContent + childContent;
          }, 0);
        };
        console.log('🌲 FileTree DESERIALIZE:', {
          treeDataLength: (validated['treeData'] as unknown[] || []).length,
          filesWithContent: countContent(validated['treeData'] as unknown[] || []),
          snapshotCount: (validated['snapshots'] as unknown[] || []).length,
          hasComments: (validated['snapshots'] as Array<{comment?: string}> || []).some(s => s?.comment),
        });

        // Backward compatibility: create initial snapshot if none exists
        const snapshots = deserialized['snapshots'] as unknown[];
        const treeData = deserialized['treeData'] as FileTreeNode[];
        if (snapshots.length === 0 && treeData.length > 0) {
          deserialized['snapshots'] = [{
            id: 'initial',
            timestamp: Date.now(),
            label: 'Initial state',
            tree: sanitizeTreeForSnapshot(treeData)
          }];
          deserialized['currentSnapshotId'] = 'initial';
          deserialized['_needsInitialSnapshotSave'] = true;
        }
      }

    } catch (error) {
      console.warn(`BlockSerializer: Failed to parse/validate content for ${block.type}:`, error);
      console.warn(`BlockSerializer: Failed to parse content:`, block.content);

      // Try to preserve original data instead of using empty defaults
      const parsedObj = parsed as Record<string, unknown> | null;
      if (parsedObj && typeof parsedObj === 'object') {
        console.warn(`BlockSerializer: Using parsed (but invalid) content to preserve user data`);

        if (block.type === 'text' || block.type === 'heading' || block.type === 'code') {
          deserialized['content'] = parsedObj['content'] || parsedObj || '';
        } else if (block.type === 'ai') {
          deserialized['messages'] = parsedObj['messages'] || [];
        } else if (block.type === 'image') {
          deserialized['images'] = parsedObj['images'] || [];
          deserialized['layout'] = parsedObj['layout'] || 'grid';
          deserialized['columns'] = parsedObj['columns'] || 3;
        } else if (block.type === 'table') {
          deserialized['data'] = parsedObj['data'] || {headers: [], rows: [], columnAlignments: [], hasHeaderRow: true};
        } else if (block.type === 'issue-tracker') {
          deserialized['data'] = parsedObj['data'] || {milestone: '', issues: []};
        } else if (block.type === 'todo') {
          deserialized['data'] = parsedObj['data'] || {todos: []};
        } else if (block.type === 'filetree') {
          deserialized['treeData'] = parsedObj['treeData'] || [];
          deserialized['expanded'] = parsedObj['expanded'] || [];
          // CRITICAL: Restore snapshots data (includes comments!)
          deserialized['snapshots'] = parsedObj['snapshots'] || [];
          deserialized['currentSnapshotId'] = parsedObj['currentSnapshotId'] || null;
          deserialized['snapshotLimit'] = parsedObj['snapshotLimit'] || 50;
        }
      } else {
        // Only use empty defaults if we have no data at all
        const safeDefault = schema.safeParse({});
        if (safeDefault.success) {
          const defaults = safeDefault.data as Record<string, unknown>;
          if (block.type === 'table') {
            deserialized['data'] = defaults['data'];
          } else if (block.type === 'issue-tracker') {
            deserialized['data'] = defaults['data'];
          } else if (block.type === 'todo') {
            deserialized['data'] = defaults['data'];
          } else if (block.type === 'filetree') {
            deserialized['treeData'] = defaults['treeData'] || [];
            deserialized['expanded'] = defaults['expanded'] || [];
            deserialized['snapshots'] = defaults['snapshots'] || [];
            deserialized['currentSnapshotId'] = defaults['currentSnapshotId'] || null;
            deserialized['snapshotLimit'] = defaults['snapshotLimit'] || 50;
          }
        }
      }
    }
  } else {
    // No content, use defaults
    const safeDefault = schema.safeParse({});
    if (safeDefault.success) {
      const defaults = safeDefault.data as Record<string, unknown>;
      if (block.type === 'table') {
        deserialized['data'] = defaults['data'];
      } else if (block.type === 'issue-tracker') {
        deserialized['data'] = defaults['data'];
      } else if (block.type === 'todo') {
        deserialized['data'] = defaults['data'];
      } else if (block.type === 'filetree') {
        deserialized['treeData'] = defaults['treeData'] || [];
        deserialized['expanded'] = defaults['expanded'] || [];
        deserialized['snapshots'] = defaults['snapshots'] || [];
        deserialized['currentSnapshotId'] = defaults['currentSnapshotId'] || null;
        deserialized['snapshotLimit'] = defaults['snapshotLimit'] || 50;
      }
    }
  }

  // Restore direct fields from metadata
  const blockMetadata = block.metadata as Record<string, unknown> | undefined;
  const blockRecord = block as unknown as Record<string, unknown>;
  if (blockMetadata) {
    if (block.type === 'code') {
      deserialized['language'] = blockMetadata['language'] || blockRecord['language'];
      deserialized['filePath'] = blockMetadata['filePath'] || blockRecord['file_path'];
    }
    if (block.type === 'heading') {
      deserialized['level'] = blockMetadata['level'] || blockRecord['level'];
    }
  }

  return deserialized as TypedBlockData;
}

/**
 * Validates if a block has the required fields for its type
 */
export function validateBlock(block: unknown): block is BlockData {
  if (!block || typeof block !== 'object') {
    return false;
  }

  const blockObj = block as Record<string, unknown>;
  if (!blockObj['id'] || !blockObj['type']) {
    return false;
  }

  const schema = getBlockContentSchema(blockObj['type'] as string);

  if (!schema) {
    // Unknown type, consider valid if has content
    return blockObj['content'] !== undefined;
  }

  try {
    let dataToValidate: Record<string, unknown> = {};
    const type = blockObj['type'];

    if (type === 'text' || type === 'heading' || type === 'code') {
      dataToValidate = { content: blockObj['content'] || '' };
    } else if (type === 'ai') {
      dataToValidate = { messages: blockObj['messages'] || [], metadata: {} };
    } else if (type === 'image') {
      dataToValidate = { images: blockObj['images'] || [], layout: 'grid', columns: 3 };
    } else if (type === 'table') {
      dataToValidate = { data: blockObj['data'] || { headers: [], rows: [], columnAlignments: [], hasHeaderRow: true } };
    } else if (type === 'todo') {
      dataToValidate = { data: blockObj['data'] || { todos: [] } };
    } else if (type === 'issue-tracker') {
      dataToValidate = { data: blockObj['data'] || { milestone: '', issues: [] } };
    } else if (type === 'filetree') {
      dataToValidate = { treeData: blockObj['treeData'] || [], expanded: [] };
    }

    schema.parse(dataToValidate);
    return true;
  } catch {
    return false;
  }
}

export default {
  serializeBlock,
  deserializeBlock,
  validateBlock
};

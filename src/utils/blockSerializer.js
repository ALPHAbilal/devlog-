/**
 * Block Serialization Utility - Zod-Based
 *
 * Provides a robust serialization/deserialization layer for different block types
 * using Zod schemas for automatic validation and field filtering.
 *
 * @module blockSerializer
 */

import { getBlockContentSchema } from './blockSchemas.js';

/**
 * Helper: Remove file content from tree nodes for snapshot storage
 * @param {Array} nodes - Tree nodes to sanitize
 * @returns {Array} Sanitized nodes without content field
 */
function sanitizeTreeForSnapshot(nodes) {
  if (!Array.isArray(nodes)) return [];
  return nodes.map(node => ({
    id: node.id,
    name: node.name,
    isFolder: node.isFolder !== undefined ? node.isFolder : node.type === 'folder',
    type: node.type || (node.isFolder ? 'folder' : 'file'),
    children: node.children ? sanitizeTreeForSnapshot(node.children) : undefined,
    // Explicitly exclude content field
  }));
}

/**
 * Serializes a block for storage in the database
 * Uses Zod schemas to automatically validate and filter invalid fields
 *
 * @param {Object} block - The block to serialize
 * @returns {Object} The serialized block with normalized content field
 */
export function serializeBlock(block) {
  if (!block || !block.type) {
    console.warn('BlockSerializer: Invalid block provided for serialization', block);
    return block;
  }

  // Log input for debugging
  console.log('🔍 BlockSerializer.serialize INPUT:', {
    id: block.id,
    type: block.type,
    hasContent: 'content' in block,
    hasMessages: 'messages' in block,
    hasImages: 'images' in block,
    hasData: 'data' in block,
    blockKeys: Object.keys(block)
  });

  // Base structure
  const serialized = {
    id: block.id,
    type: block.type,
    position: block.position,
    metadata: block.metadata || {},
    created_at: block.created_at,
    updated_at: block.updated_at
  };

  const schema = getBlockContentSchema(block.type);

  if (!schema) {
    console.warn(`BlockSerializer: No schema for type '${block.type}', using fallback`);
    serialized.content = block.content || '';
    return serialized;
  }

  // CRITICAL FIX: Declare dataToValidate BEFORE try block so catch block can access it
  let dataToValidate = {};

  try {
    // Extract data based on block type

    if (block.type === 'text' || block.type === 'heading' || block.type === 'code') {
      dataToValidate = { content: block.content || '' };
    } else if (block.type === 'ai') {
      dataToValidate = {
        messages: block.messages || [],
        metadata: block.metadata || {}
      };
    } else if (block.type === 'image') {
      dataToValidate = {
        images: block.images || [],
        layout: block.layout || 'grid',
        columns: block.columns || 3
      };
    } else if (block.type === 'inline-image' || block.type === 'inlineImage') {
      dataToValidate = {
        url: block.url || '',
        alt: block.alt || '',
        caption: block.caption || '',
        dimensions: block.dimensions || null
      };
    } else if (block.type === 'table') {
      // [TABLE-SAVE] Log table block before serialization
      console.log('[TABLE-SAVE] Step: blockSerializer.serializeBlock Entry (table)', {
        blockId: block.id,
        blockType: block.type,
        inputBlock: {
          hasData: 'data' in block,
          dataStructure: block.data ? {
            hasHeaders: Array.isArray(block.data.headers),
            headersCount: block.data.headers?.length || 0,
            hasRows: Array.isArray(block.data.rows),
            rowsCount: block.data.rows?.length || 0,
            hasColumnAlignments: Array.isArray(block.data.columnAlignments),
            columnAlignmentsCount: block.data.columnAlignments?.length || 0,
            hasHeaderRow: typeof block.data.hasHeaderRow === 'boolean' ? block.data.hasHeaderRow : undefined,
            dataSize: JSON.stringify(block.data).length,
            fullData: block.data,
            dataPreview: {
              headers: block.data.headers?.slice(0, 5),
              firstRow: block.data.rows?.[0]?.slice(0, 5),
              lastRow: block.data.rows?.[block.data.rows?.length - 1]?.slice(0, 5),
              columnAlignments: block.data.columnAlignments?.slice(0, 5)
            }
          } : null,
          willUseDefault: !block.data
        }
      });

      // CRITICAL: Only extract table fields, Zod will filter out any invalid ones (milestone, issues, etc.)
      dataToValidate = {
        data: {
          headers: block.data?.headers || ['Column 1', 'Column 2'],
          rows: block.data?.rows || [['', '']],
          columnAlignments: block.data?.columnAlignments || ['left', 'left'],
          hasHeaderRow: block.data?.hasHeaderRow !== undefined ? block.data.hasHeaderRow : true
          // Any other fields (milestone, issues, etc.) will be automatically filtered by Zod
        }
      };
    } else if (block.type === 'todo') {
      dataToValidate = {
        data: {
          todos: block.data?.todos || []
        }
      };
    } else if (block.type === 'issue-tracker' || block.type === 'issueTracker') {
      // CRITICAL: Only extract issue tracker fields, Zod will filter out any invalid ones (headers, rows, etc.)
      dataToValidate = {
        data: {
          milestone: block.data?.milestone || '',
          issues: block.data?.issues || []
          // Any other fields (headers, rows, etc.) will be automatically filtered by Zod
        }
      };
    } else if (block.type === 'filetree') {
      // CRITICAL FIX: Include snapshots and snapshot state in content
      dataToValidate = {
        treeData: block.treeData || [],
        expanded: block.expanded || [],
        snapshots: block.snapshots || [],
        currentSnapshotId: block.currentSnapshotId || null,
        snapshotLimit: block.snapshotLimit || 50
      };
    }

    // Zod validates and filters invalid fields automatically
    const validated = schema.parse(dataToValidate);
    serialized.content = JSON.stringify(validated);

    // [TABLE-SAVE] Log after serialization for table blocks
    if (block.type === 'table') {
      console.log('[TABLE-SAVE] Step: blockSerializer.serializeBlock Complete (table)', {
        blockId: block.id,
        serialized: {
          contentLength: serialized.content.length,
          contentPreview: serialized.content.substring(0, 300),
          fullContent: serialized.content,
          parsedContent: (() => {
            try {
              const parsed = JSON.parse(serialized.content);
              return {
                hasData: !!parsed.data,
                dataStructure: parsed.data ? {
                  headersCount: parsed.data.headers?.length || 0,
                  rowsCount: parsed.data.rows?.length || 0,
                  columnAlignmentsCount: parsed.data.columnAlignments?.length || 0,
                  hasHeaderRow: parsed.data.hasHeaderRow,
                  fullData: parsed.data
                } : null
              };
            } catch (e) {
              return { error: 'Failed to parse serialized content', message: e.message };
            }
          })()
        }
      });
    }

  } catch (error) {
    console.error(`BlockSerializer: Validation failed for ${block.type}:`, error);
    console.error(`BlockSerializer: Failed data:`, dataToValidate);

    // CRITICAL: Preserve original data instead of wiping with empty defaults
    // Try to use original content if it exists, otherwise use minimal valid structure
    if (block.content && typeof block.content === 'string') {
      // Already has serialized content, preserve it
      serialized.content = block.content;
    } else if (block.content && typeof block.content === 'object') {
      // Has object content, stringify it even if invalid
      serialized.content = JSON.stringify(block.content);
    } else {
      // Last resort: try safe defaults
      const safeDefault = schema.safeParse({});
      if (safeDefault.success) {
        serialized.content = JSON.stringify(safeDefault.data);
      } else {
        // Absolute last resort: empty string
        serialized.content = JSON.stringify(dataToValidate); // Save what we tried to validate
      }
    }
  }

  // Add direct fields to metadata (for code blocks: language, filePath)
  if (block.type === 'code') {
    if (block.language) serialized.metadata.language = block.language;
    if (block.filePath) serialized.metadata.filePath = block.filePath;
  }
  if (block.type === 'heading' && block.level) {
    serialized.metadata.level = block.level;
  }

  // Log output
  console.log('🔍 BlockSerializer.serialize OUTPUT:', {
    id: serialized.id,
    type: serialized.type,
    position: serialized.position,
    contentLength: serialized.content?.length,
    contentPreview: serialized.content?.substring(0, 100)
  });

  return serialized;
}

/**
 * Deserializes a block from database storage
 * Uses Zod schemas to automatically validate and filter invalid fields
 *
 * @param {Object} block - The serialized block from database
 * @returns {Object} The deserialized block with proper field structure
 */
export function deserializeBlock(block) {
  // Log input
  console.log('🔎 BlockSerializer.deserialize INPUT:', {
    id: block?.id,
    type: block?.type,
    hasContent: 'content' in (block || {}),
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
    return block;
  }

  // Base structure
  const deserialized = {
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
    deserialized.content = block.content || '';
    return deserialized;
  }

  // Parse content
  if (block.content) {
    try {
      // Parse content - Zod schemas now handle both legacy (plain string) and new (JSON) formats
      const parsed = typeof block.content === 'string'
        ? (function() {
            try {
              return JSON.parse(block.content);
            } catch {
              // Not JSON - return as-is for Zod to handle (legacy plain text)
              return block.content;
            }
          })()
        : block.content;

      // Zod validates and automatically handles both formats:
      // - Legacy: "plain text" → transforms to {content: "plain text"}
      // - New: {content: "text"} → validates and passes through
      const validated = schema.parse(parsed);

      // Map validated data back to block structure
      if (block.type === 'text' || block.type === 'heading' || block.type === 'code') {
        // Zod transform already normalized both formats to {content: string}
        deserialized.content = validated.content || '';
      } else if (block.type === 'ai') {
        deserialized.messages = validated.messages || [];
        if (validated.metadata) {
          deserialized.metadata = { ...deserialized.metadata, ...validated.metadata };
        }
      } else if (block.type === 'image') {
        deserialized.images = validated.images || [];
        deserialized.layout = validated.layout || 'grid';
        deserialized.columns = validated.columns || 3;
      } else if (block.type === 'inline-image' || block.type === 'inlineImage') {
        deserialized.url = validated.url || '';
        deserialized.alt = validated.alt || '';
        deserialized.caption = validated.caption || '';
        deserialized.dimensions = validated.dimensions || null;
      } else if (block.type === 'table') {
        // CRITICAL: Zod has already filtered out any invalid fields (milestone, issues, etc.)
        deserialized.data = validated.data || {
          headers: ['Column 1', 'Column 2'],
          rows: [['', '']],
          columnAlignments: ['left', 'left'],
          hasHeaderRow: true
        };
      } else if (block.type === 'todo') {
        deserialized.data = validated.data || { todos: [] };
      } else if (block.type === 'issue-tracker' || block.type === 'issueTracker') {
        // CRITICAL: Zod has already filtered out any invalid fields (headers, rows, etc.)
        deserialized.data = validated.data || {
          milestone: '',
          issues: []
        };
      } else if (block.type === 'filetree') {
        deserialized.treeData = validated.treeData || [];
        deserialized.expanded = validated.expanded || []; // Fixed: Use array to match Zod schema

        // CRITICAL FIX: Read snapshots from content (not metadata)
        deserialized.snapshots = validated.snapshots || [];
        deserialized.currentSnapshotId = validated.currentSnapshotId || null;
        deserialized.snapshotLimit = validated.snapshotLimit || 50;

        // Debug logging
        console.log('[DEBUG-DESERIALIZE] FileTree block.id:', block.id);
        console.log('[DEBUG-DESERIALIZE] FileTree validated.snapshots:', validated.snapshots);
        console.log('[DEBUG-DESERIALIZE] FileTree validated.currentSnapshotId:', validated.currentSnapshotId);

        console.log('[DEBUG-DESERIALIZE] FileTree deserialized.snapshots:', deserialized.snapshots);
        console.log('[DEBUG-DESERIALIZE] FileTree deserialized.currentSnapshotId:', deserialized.currentSnapshotId);

        // CRITICAL FIX #4: Backward compatibility with persistence flag
        if (deserialized.snapshots.length === 0 && deserialized.treeData.length > 0) {
          console.log('[DEBUG-DESERIALIZE] FileTree: Creating initial snapshot (backward compatibility)');
          deserialized.snapshots = [{
            id: 'initial',
            timestamp: Date.now(),
            label: 'Initial state',
            tree: sanitizeTreeForSnapshot(deserialized.treeData)
          }];
          deserialized.currentSnapshotId = 'initial';
          deserialized._needsInitialSnapshotSave = true;
        }
      }

    } catch (error) {
      console.warn(`BlockSerializer: Failed to parse/validate content for ${block.type}:`, error);
      console.warn(`BlockSerializer: Failed to parse content:`, block.content);

      // CRITICAL: Try to preserve original data instead of using empty defaults
      // Attempt to use the parsed content even if validation failed
      if (parsed && typeof parsed === 'object') {
        console.warn(`BlockSerializer: Using parsed (but invalid) content to preserve user data`);

        if (block.type === 'text' || block.type === 'heading' || block.type === 'code') {
          deserialized.content = parsed.content || parsed || '';
        } else if (block.type === 'ai') {
          deserialized.messages = parsed.messages || [];
        } else if (block.type === 'image') {
          deserialized.images = parsed.images || [];
          deserialized.layout = parsed.layout || 'grid';
          deserialized.columns = parsed.columns || 3;
        } else if (block.type === 'table') {
          deserialized.data = parsed.data || {headers: [], rows: [], columnAlignments: [], hasHeaderRow: true};
        } else if (block.type === 'issue-tracker' || block.type === 'issueTracker') {
          deserialized.data = parsed.data || {milestone: '', issues: []};
        } else if (block.type === 'todo') {
          deserialized.data = parsed.data || {todos: []};
        } else if (block.type === 'filetree') {
          deserialized.treeData = parsed.treeData || [];
          deserialized.expanded = parsed.expanded || [];
        }
      } else {
        // Only use empty defaults if we have no data at all
        const safeDefault = schema.safeParse({});
        if (safeDefault.success) {
          const defaults = safeDefault.data;
          if (block.type === 'table') {
            deserialized.data = defaults.data;
          } else if (block.type === 'issue-tracker' || block.type === 'issueTracker') {
            deserialized.data = defaults.data;
          } else if (block.type === 'todo') {
            deserialized.data = defaults.data;
          } else if (block.type === 'filetree') {
            deserialized.treeData = defaults.treeData || [];
            deserialized.expanded = defaults.expanded || [];
          }
        }
      }
    }
  } else {
    // No content, use defaults
    const safeDefault = schema.safeParse({});
    if (safeDefault.success) {
      const defaults = safeDefault.data;
      if (block.type === 'table') {
        deserialized.data = defaults.data;
      } else if (block.type === 'issue-tracker' || block.type === 'issueTracker') {
        deserialized.data = defaults.data;
      } else if (block.type === 'todo') {
        deserialized.data = defaults.data;
      } else if (block.type === 'filetree') {
        deserialized.treeData = defaults.treeData || [];
        deserialized.expanded = defaults.expanded || {};
      }
    }
  }

  // Restore direct fields from metadata (for code blocks, heading level, etc.)
  if (block.metadata) {
    if (block.type === 'code') {
      deserialized.language = block.metadata.language || block.language;
      deserialized.filePath = block.metadata.filePath || block.file_path;
    }
    if (block.type === 'heading') {
      deserialized.level = block.metadata.level || block.level;
    }
  }

  return deserialized;
}

/**
 * Validates if a block has the required fields for its type
 *
 * @param {Object} block - The block to validate
 * @returns {boolean} True if valid, false otherwise
 */
export function validateBlock(block) {
  if (!block || !block.id || !block.type) {
    return false;
  }

  const schema = getBlockContentSchema(block.type);

  if (!schema) {
    // Unknown type, consider valid if has content
    return block.content !== undefined;
  }

  try {
    // Extract data similar to serialize
    let dataToValidate = {};

    if (block.type === 'text' || block.type === 'heading' || block.type === 'code') {
      dataToValidate = { content: block.content || '' };
    } else if (block.type === 'ai') {
      dataToValidate = { messages: block.messages || [], metadata: {} };
    } else if (block.type === 'image') {
      dataToValidate = { images: block.images || [], layout: 'grid', columns: 3 };
    } else if (block.type === 'table') {
      dataToValidate = { data: block.data || { headers: [], rows: [], columnAlignments: [], hasHeaderRow: true } };
    } else if (block.type === 'todo') {
      dataToValidate = { data: block.data || { todos: [] } };
    } else if (block.type === 'issue-tracker' || block.type === 'issueTracker') {
      dataToValidate = { data: block.data || { milestone: '', issues: [] } };
    } else if (block.type === 'filetree') {
      dataToValidate = { treeData: block.treeData || [], expanded: [] };
    }

    schema.parse(dataToValidate);
    return true;
  } catch (error) {
    return false;
  }
}

export default {
  serializeBlock,
  deserializeBlock,
  validateBlock
};


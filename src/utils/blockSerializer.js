/**
 * Block Serialization Utility
 * 
 * Provides a robust serialization/deserialization layer for different block types
 * to ensure consistent data storage in the Smart Sync system.
 * 
 * @module blockSerializer
 */

/**
 * Serializes a block for storage in the database
 * Normalizes all block-specific fields into a unified content structure
 * 
 * @param {Object} block - The block to serialize
 * @returns {Object} The serialized block with normalized content field
 */
export function serializeBlock(block) {
  if (!block || !block.type) {
    console.warn('BlockSerializer: Invalid block provided for serialization', block);
    return block;
  }

  // Sophisticated tracing - log input
  console.log('🔍 BlockSerializer.serialize INPUT:', {
    id: block.id,
    type: block.type,
    hasContent: 'content' in block,
    hasMessages: 'messages' in block,
    hasImages: 'images' in block,
    hasData: 'data' in block,
    blockKeys: Object.keys(block)
  });

  // Create a copy to avoid mutating the original
  const serialized = {
    id: block.id,
    type: block.type,
    position: block.position,
    metadata: block.metadata || {},
    created_at: block.created_at,
    updated_at: block.updated_at
  };

  // Serialize based on block type
  switch (block.type) {
    case 'text':
    case 'heading':
    case 'code':
      // These blocks already use 'content' field
      serialized.content = block.content || '';
      break;

    case 'ai':
      // AI blocks store messages array
      serialized.content = JSON.stringify({
        messages: block.messages || [],
        metadata: block.metadata || {}
      });
      break;

    case 'image':
      // Image blocks store images array
      serialized.content = JSON.stringify({
        images: block.images || [],
        layout: block.layout || 'grid',
        columns: block.columns || 3
      });
      break;

    case 'table':
      // Table blocks store structured data
      serialized.content = JSON.stringify({
        data: block.data || {
          headers: ['Column 1', 'Column 2'],
          rows: [['', '']],
          columnAlignments: ['left', 'left']
        }
      });
      break;

    case 'todo':
      // Todo blocks store items array
      serialized.content = JSON.stringify({
        data: block.data || { todos: [] }
      });
      break;

    case 'issueTracker':
    case 'issue-tracker':
      // Issue tracker blocks store structured data
      // The component expects data.milestone and data.issues directly
      serialized.content = JSON.stringify(
        block.data || {
          milestone: '',
          issues: []
        }
      );
      break;

    case 'filetree':
      // File tree blocks store tree structure
      serialized.content = JSON.stringify({
        treeData: block.treeData || [],
        expanded: block.expanded || []
      });
      break;

    case 'version-track':
      // Version tracking blocks store repository data
      serialized.content = JSON.stringify({
        data: block.data || {
          repository: null,
          commits: [],
          branches: []
        }
      });
      break;

    case 'inlineImage':
      // Inline image blocks
      serialized.content = JSON.stringify({
        url: block.url || '',
        alt: block.alt || '',
        caption: block.caption || ''
      });
      break;

    default:
      // For unknown types, preserve all data in content
      console.warn(`BlockSerializer: Unknown block type '${block.type}', serializing all fields`);
      const { id, type, position, metadata, created_at, updated_at, ...rest } = block;
      serialized.content = JSON.stringify(rest);
  }

  // Sophisticated tracing - log output
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
 * Restores block-specific fields from the unified content structure
 * 
 * @param {Object} block - The serialized block from database
 * @returns {Object} The deserialized block with proper field structure
 */
export function deserializeBlock(block) {
  // Sophisticated tracing - log input
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

  // Create base block structure
  const deserialized = {
    id: block.id,
    type: block.type,
    position: block.position || 0,
    metadata: block.metadata || {},
    created_at: block.created_at,
    updated_at: block.updated_at
  };

  // Handle content based on block type
  try {
    switch (block.type) {
      case 'text':
      case 'heading':
      case 'code':
        // These blocks use content directly
        deserialized.content = block.content || '';
        // For heading blocks, extract level from metadata if not present
        if (block.type === 'heading' && block.metadata?.level) {
          deserialized.level = block.metadata.level;
        }
        break;

      case 'ai':
        // Restore messages array - handle both old and new formats
        if (block.content) {
          try {
            const parsed = typeof block.content === 'string' 
              ? JSON.parse(block.content) 
              : block.content;
            deserialized.messages = parsed.messages || [];
            if (parsed.metadata) {
              deserialized.metadata = { ...deserialized.metadata, ...parsed.metadata };
            }
          } catch (e) {
            // If content is not JSON, check metadata for messages (legacy format)
            console.log('🔍 AI block: content not JSON, checking metadata for messages');
            if (block.metadata?.messages) {
              deserialized.messages = block.metadata.messages;
            } else {
              deserialized.messages = [];
            }
          }
        } else if (block.metadata?.messages) {
          // Legacy format: messages stored in metadata
          console.log('🔍 AI block: using messages from metadata (legacy format)');
          deserialized.messages = block.metadata.messages;
        } else {
          deserialized.messages = [];
        }
        break;

      case 'image':
        // Restore images array
        if (block.content) {
          const parsed = typeof block.content === 'string' 
            ? JSON.parse(block.content) 
            : block.content;
          deserialized.images = parsed.images || [];
          deserialized.layout = parsed.layout || 'grid';
          deserialized.columns = parsed.columns || 3;
        } else {
          deserialized.images = [];
        }
        break;

      case 'table':
        // Restore table data
        if (block.content) {
          try {
            const parsed = typeof block.content === 'string'
              ? JSON.parse(block.content)
              : block.content;
            deserialized.data = parsed.data || {
              headers: ['Column 1', 'Column 2'],
              rows: [['', '']],
              columnAlignments: ['left', 'left']
            };
          } catch (e) {
            // Legacy format: content is markdown string with pipes
            console.warn('BlockSerializer: Table has legacy markdown format, converting to structured data');
            // Parse markdown table to structured data
            const lines = block.content.split('\n').filter(line => line.trim());
            if (lines.length >= 2) {
              // First line is headers
              const headers = lines[0].split('|').map(h => h.trim()).filter(h => h);
              // Skip separator line (line with dashes)
              const rows = lines.slice(2).map(line =>
                line.split('|').map(c => c.trim()).filter(c => c !== '')
              );
              deserialized.data = {
                headers,
                rows,
                columnAlignments: headers.map(() => 'left')
              };
            } else {
              // Cannot parse, use default
              deserialized.data = {
                headers: ['Column 1', 'Column 2'],
                rows: [['', '']],
                columnAlignments: ['left', 'left']
              };
            }
          }
        } else {
          deserialized.data = {
            headers: ['Column 1', 'Column 2'],
            rows: [['', '']],
            columnAlignments: ['left', 'left']
          };
        }
        break;

      case 'todo':
        // Restore todo items
        if (block.content) {
          const parsed = typeof block.content === 'string' 
            ? JSON.parse(block.content) 
            : block.content;
          deserialized.data = parsed.data || { todos: [] };
        } else {
          deserialized.data = { todos: [] };
        }
        break;

      case 'issueTracker':
      case 'issue-tracker':
        // Restore issue tracker data
        if (block.content) {
          try {
            const parsed = typeof block.content === 'string' 
              ? JSON.parse(block.content) 
              : block.content;
            
            // Handle both old format (nested data.data) and new format
            if (parsed.data && typeof parsed.data === 'object') {
              // Old format: content = { data: { milestone, issues } }
              deserialized.data = parsed.data;
            } else if (parsed.milestone !== undefined || parsed.issues !== undefined) {
              // New format: content = { milestone, issues }
              deserialized.data = parsed;
            } else {
              // Fallback for unexpected format
              console.warn('IssueTracker: Unexpected content format', parsed);
              deserialized.data = { milestone: '', issues: [] };
            }
            
            // Ensure required fields exist with proper defaults
            if (deserialized.data.milestone === undefined || deserialized.data.milestone === null) {
              deserialized.data.milestone = '';
            }
            if (!Array.isArray(deserialized.data.issues)) {
              deserialized.data.issues = [];
            }
          } catch (e) {
            console.error('IssueTracker: Failed to parse content', e, block.content);
            deserialized.data = { milestone: '', issues: [] };
          }
        } else {
          deserialized.data = {
            milestone: '',
            issues: []
          };
        }
        break;

      case 'filetree':
        // Restore file tree data
        if (block.content) {
          const parsed = typeof block.content === 'string' 
            ? JSON.parse(block.content) 
            : block.content;
          
          // Handle both formats:
          // 1. Proper format: {treeData: [...], expanded: {...}}
          // 2. Direct tree format: {name: "root", type: "folder", children: [...]}
          
          if (parsed.treeData !== undefined) {
            // Proper format with treeData property
            deserialized.treeData = parsed.treeData || [];
            deserialized.expanded = parsed.expanded || {};
          } else if (parsed.name && parsed.type) {
            // Direct tree object - wrap it in an array
            console.log('🌲 FileTree: Converting direct tree object to array format', parsed);
            deserialized.treeData = [parsed];
            deserialized.expanded = {};
          } else {
            // Unknown format, default to empty
            console.warn('🌲 FileTree: Unknown content format, defaulting to empty', parsed);
            deserialized.treeData = [];
            deserialized.expanded = {};
          }
        } else {
          deserialized.treeData = [];
          deserialized.expanded = {};
        }
        break;

      case 'version-track':
        // Restore version tracking data
        if (block.content) {
          const parsed = typeof block.content === 'string' 
            ? JSON.parse(block.content) 
            : block.content;
          deserialized.data = parsed.data || {
            repository: null,
            commits: [],
            branches: []
          };
        } else {
          deserialized.data = {
            repository: null,
            commits: [],
            branches: []
          };
        }
        break;

      case 'inlineImage':
        // Restore inline image data
        if (block.content) {
          const parsed = typeof block.content === 'string' 
            ? JSON.parse(block.content) 
            : block.content;
          deserialized.url = parsed.url || '';
          deserialized.alt = parsed.alt || '';
          deserialized.caption = parsed.caption || '';
        } else {
          deserialized.url = '';
          deserialized.alt = '';
        }
        break;

      default:
        // For unknown types, try to parse content as JSON
        if (block.content) {
          try {
            const parsed = typeof block.content === 'string' 
              ? JSON.parse(block.content) 
              : block.content;
            Object.assign(deserialized, parsed);
          } catch (e) {
            // If not JSON, keep as is
            deserialized.content = block.content;
          }
        }
        console.warn(`BlockSerializer: Unknown block type '${block.type}' during deserialization`);
    }
  } catch (error) {
    console.error(`BlockSerializer: Error deserializing block ${block.id}:`, error);
    // Fallback: preserve original content
    deserialized.content = block.content;
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

  switch (block.type) {
    case 'text':
    case 'heading':
    case 'code':
      return typeof block.content === 'string';
    
    case 'ai':
      return Array.isArray(block.messages);
    
    case 'image':
      return Array.isArray(block.images);
    
    case 'table':
      return block.data && 
             Array.isArray(block.data.headers) && 
             Array.isArray(block.data.rows);
    
    case 'todo':
      return block.data && Array.isArray(block.data.todos);
    
    case 'issueTracker':
    case 'issue-tracker':
      return block.data && Array.isArray(block.data.issues);
    
    case 'filetree':
      return Array.isArray(block.treeData);
    
    case 'version-track':
      return block.data !== undefined;
    
    case 'inlineImage':
      return typeof block.url === 'string';
    
    default:
      // Unknown type, consider valid if has content
      return block.content !== undefined;
  }
}

export default {
  serializeBlock,
  deserializeBlock,
  validateBlock
};
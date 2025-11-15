/**
 * Block Type Schemas
 * 
 * Defines the data structure for each block type.
 * Used by serializer/deserializer to validate and filter data.
 * 
 * To add a new block type, just add its schema here.
 */

/**
 * Block Type Schema Definition
 * @typedef {Object} BlockSchema
 * @property {string[]} contentFields - Fields that go into the 'content' field (serialized as JSON)
 * @property {string[]} metadataFields - Fields that go into the 'metadata' field
 * @property {string[]} directFields - Fields stored directly on the block object
 * @property {Function} serialize - Custom serialization function (optional)
 * @property {Function} deserialize - Custom deserialization function (optional)
 * @property {Function} validate - Validation function (optional)
 */

export const BLOCK_SCHEMAS = {
  // Simple text-based blocks
  text: {
    contentFields: ['content'],
    directFields: ['content'],
    serialize: (block) => ({ content: block.content || '' }),
    deserialize: (parsed) => ({ content: parsed.content || '' })
  },

  heading: {
    contentFields: ['content'],
    directFields: ['content', 'level'],
    serialize: (block) => ({ content: block.content || '' }),
    deserialize: (parsed) => ({ content: parsed.content || '' })
  },

  code: {
    contentFields: ['content'],
    directFields: ['content', 'language', 'filePath'],
    serialize: (block) => ({ content: block.content || '' }),
    deserialize: (parsed) => ({ content: parsed.content || '' })
  },

  // AI conversation blocks
  ai: {
    contentFields: ['messages', 'metadata'],
    serialize: (block) => ({
      messages: block.messages || [],
      metadata: block.metadata || {}
    }),
    deserialize: (parsed) => ({
      messages: parsed.messages || [],
      metadata: parsed.metadata || {}
    })
  },

  // Image blocks
  image: {
    contentFields: ['images', 'layout', 'columns'],
    serialize: (block) => ({
      images: block.images || [],
      layout: block.layout || 'grid',
      columns: block.columns || 3
    }),
    deserialize: (parsed) => ({
      images: parsed.images || [],
      layout: parsed.layout || 'grid',
      columns: parsed.columns || 3
    })
  },

  'inline-image': {
    contentFields: ['url', 'alt', 'caption', 'dimensions'],
    serialize: (block) => ({
      url: block.url || '',
      alt: block.alt || '',
      caption: block.caption || '',
      dimensions: block.dimensions || null
    }),
    deserialize: (parsed) => ({
      url: parsed.url || '',
      alt: parsed.alt || '',
      caption: parsed.caption || '',
      dimensions: parsed.dimensions || null
    })
  },

  // Table blocks - ONLY table fields allowed
  table: {
    contentFields: ['data'],
    serialize: (block) => ({
      data: {
        headers: block.data?.headers || ['Column 1', 'Column 2'],
        rows: block.data?.rows || [['', '']],
        columnAlignments: block.data?.columnAlignments || ['left', 'left'],
        hasHeaderRow: block.data?.hasHeaderRow !== undefined ? block.data.hasHeaderRow : true
        // Explicitly exclude: milestone, issues (issue tracker fields)
      }
    }),
    deserialize: (parsed) => {
      const data = parsed.data || {};
      return {
        data: {
          headers: Array.isArray(data.headers) ? data.headers : ['Column 1', 'Column 2'],
          rows: Array.isArray(data.rows) ? data.rows : [['', '']],
          columnAlignments: Array.isArray(data.columnAlignments) ? data.columnAlignments : ['left', 'left'],
          hasHeaderRow: typeof data.hasHeaderRow === 'boolean' ? data.hasHeaderRow : true
          // Filter out any non-table fields (milestone, issues, etc.)
        }
      };
    }
  },

  // Todo blocks
  todo: {
    contentFields: ['data'],
    serialize: (block) => ({
      data: {
        todos: block.data?.todos || []
      }
    }),
    deserialize: (parsed) => ({
      data: {
        todos: Array.isArray(parsed.data?.todos) ? parsed.data.todos : []
      }
    })
  },

  // Issue tracker blocks - ONLY issue tracker fields allowed
  'issue-tracker': {
    contentFields: ['data'],
    serialize: (block) => ({
      data: {
        milestone: block.data?.milestone || '',
        issues: block.data?.issues || []
        // Explicitly exclude: headers, rows, columnAlignments (table fields)
      }
    }),
    deserialize: (parsed) => {
      const data = parsed.data || {};
      return {
        data: {
          milestone: typeof data.milestone === 'string' ? data.milestone : '',
          issues: Array.isArray(data.issues) ? data.issues : []
          // Filter out any non-issue-tracker fields (headers, rows, etc.)
        }
      };
    }
  },

  // Issue tracker (alternative name)
  issueTracker: {
    contentFields: ['data'],
    serialize: (block) => ({
      data: {
        milestone: block.data?.milestone || '',
        issues: block.data?.issues || []
      }
    }),
    deserialize: (parsed) => {
      const data = parsed.data || {};
      return {
        data: {
          milestone: typeof data.milestone === 'string' ? data.milestone : '',
          issues: Array.isArray(data.issues) ? data.issues : []
        }
      };
    }
  },

  // File tree blocks
  filetree: {
    contentFields: ['treeData', 'expanded'],
    metadataFields: ['snapshots', 'currentSnapshotId', 'snapshotLimit'],
    serialize: (block) => ({
      treeData: block.treeData || [],
      expanded: block.expanded || []
    }),
    deserialize: (parsed) => ({
      treeData: Array.isArray(parsed.treeData) ? parsed.treeData : [],
      expanded: Array.isArray(parsed.expanded) ? parsed.expanded : []
    })
  }
};

/**
 * Get schema for a block type (handles aliases)
 */
export function getBlockSchema(blockType) {
  if (!blockType) return null;
  
  // Handle aliases
  const type = blockType === 'issueTracker' ? 'issue-tracker' : blockType;
  
  return BLOCK_SCHEMAS[type] || null;
}

/**
 * Check if a block type has a schema
 */
export function hasBlockSchema(blockType) {
  return !!getBlockSchema(blockType);
}


/**
 * Block Type Schemas using Zod
 * 
 * Defines the data structure for each block type with automatic validation.
 * Zod automatically filters out invalid fields, preventing data corruption.
 * 
 * To add a new block type, just add its Zod schema here.
 */

import { z } from 'zod';

// Shared schemas
const TableAlignmentSchema = z.enum(['left', 'center', 'right']);

// Block content schemas (what goes into the 'content' field)
export const BlockContentSchemas = {
  // Simple text-based blocks
  text: z.object({
    content: z.string().default('')
  }),

  heading: z.object({
    content: z.string().default('')
  }),

  code: z.object({
    content: z.string().default('')
  }),

  // AI conversation blocks
  ai: z.object({
    messages: z.array(z.object({
      role: z.enum(['user', 'ai', 'assistant']),
      content: z.string()
    })).default([]),
    metadata: z.record(z.any()).default({})
  }),

  // Image blocks
  image: z.object({
    images: z.array(z.object({
      id: z.string(),
      url: z.string(),
      storagePath: z.string().optional(),
      alt: z.string().optional(),
      size: z.number().optional(),
      dimensions: z.object({
        width: z.number(),
        height: z.number()
      }).optional()
    })).default([]),
    layout: z.enum(['grid', 'list']).default('grid'),
    columns: z.number().int().min(1).max(6).default(3)
  }),

  'inline-image': z.object({
    url: z.string().default(''),
    alt: z.string().default(''),
    caption: z.string().default(''),
    dimensions: z.object({
      width: z.number(),
      height: z.number()
    }).nullable().default(null)
  }),

  // Table blocks - ONLY table fields allowed (Zod automatically filters out invalid fields!)
  table: z.object({
    data: z.object({
      headers: z.array(z.string()).default(['Column 1', 'Column 2']),
      rows: z.array(z.array(z.string())).default([['', '']]),
      columnAlignments: z.array(TableAlignmentSchema).default(['left', 'left']),
      hasHeaderRow: z.boolean().default(true)
      // Zod will automatically reject: milestone, issues, or any other fields
    })
  }),

  // Todo blocks
  todo: z.object({
    data: z.object({
      todos: z.array(z.object({
        id: z.string(),
        text: z.string(),
        status: z.enum(['todo', 'in_progress', 'done', 'blocked']).optional(),
        priority: z.enum(['high', 'medium', 'low']).optional(),
        dueDate: z.string().optional(),
        tags: z.array(z.string()).optional(),
        createdAt: z.string().optional()
      })).default([])
    })
  }),

  // Issue tracker blocks - ONLY issue tracker fields allowed
  'issue-tracker': z.object({
    data: z.object({
      milestone: z.string().default(''),
      issues: z.array(z.object({
        id: z.string(),
        title: z.string().default(''),
        description: z.string().default(''),
        code: z.string().default(''),
        status: z.enum(['active', 'resolved', 'closed']).default('active'),
        attempts: z.array(z.any()).default([])
      })).default([])
      // Zod will automatically reject: headers, rows, columnAlignments, or any other fields
    })
  }),

  // Issue tracker (alternative name - uses same schema)
  issueTracker: z.object({
    data: z.object({
      milestone: z.string().default(''),
      issues: z.array(z.object({
        id: z.string(),
        title: z.string().default(''),
        description: z.string().default(''),
        code: z.string().default(''),
        status: z.enum(['active', 'resolved', 'closed']).default('active'),
        attempts: z.array(z.any()).default([])
      })).default([])
    })
  }),

  // File tree blocks
  filetree: z.object({
    treeData: z.array(z.any()).default([]), // Complex recursive structure - using z.any() for now
    expanded: z.array(z.string()).default([])
  })
};

/**
 * Get content schema for a block type (handles aliases)
 */
export function getBlockContentSchema(blockType) {
  if (!blockType) return null;
  
  // Handle aliases
  const type = blockType === 'issueTracker' ? 'issue-tracker' : blockType;
  
  return BlockContentSchemas[type] || null;
}

/**
 * Check if a block type has a schema
 */
export function hasBlockSchema(blockType) {
  return !!getBlockContentSchema(blockType);
}

/**
 * Input Sanitization Utilities
 *
 * Prevents XSS attacks by sanitizing user input
 * Uses DOMPurify for robust HTML sanitization
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * Types for sanitization configuration and content
 */
export type SanitizeType = 'text' | 'markdown' | 'code' | 'strict';

interface SanitizeConfigItem {
  ALLOWED_TAGS: string[];
  ALLOWED_ATTR: string[];
  ALLOW_DATA_ATTR: boolean;
  SAFE_FOR_TEMPLATES?: boolean;
  RETURN_DOM?: boolean;
  RETURN_DOM_FRAGMENT?: boolean;
  KEEP_CONTENT?: boolean;
}

interface SanitizeConfigMap {
  text: SanitizeConfigItem;
  markdown: SanitizeConfigItem;
  code: SanitizeConfigItem;
  strict: SanitizeConfigItem;
}

interface Message {
  role?: string;
  content?: string;
  [key: string]: unknown;
}

interface TodoItem {
  text?: string;
  completed?: boolean | string;
  [key: string]: unknown;
}

interface Block {
  id?: string;
  type?: string;
  content?: string;
  language?: string;
  file_path?: string;
  messages?: Message[];
  data?: (string | unknown)[][];
  items?: TodoItem[];
  url?: string;
  alt?: string;
  caption?: string;
  [key: string]: unknown;
}

interface DocumentMetadata {
  preview?: string;
  wordCount?: number;
  readTime?: number;
  lastEditedBy?: string;
  [key: string]: unknown;
}

interface Document {
  title?: string;
  tags?: string[];
  blocks?: Block[];
  metadata?: DocumentMetadata;
  [key: string]: unknown;
}

/**
 * Sanitization configurations for different content types
 */
export const sanitizeConfig: SanitizeConfigMap = {
  // Basic text - minimal HTML allowed
  text: {
    ALLOWED_TAGS: ['b', 'i', 'u', 'strong', 'em', 'code', 'pre', 'br'],
    ALLOWED_ATTR: [],
    ALLOW_DATA_ATTR: false
  },

  // Markdown content - more formatting allowed
  markdown: {
    ALLOWED_TAGS: [
      'b', 'i', 'u', 'strong', 'em', 'code', 'pre', 'br',
      'a', 'ul', 'ol', 'li', 'blockquote',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'span', 'div'
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
    ALLOW_DATA_ATTR: false,
    SAFE_FOR_TEMPLATES: false
  },

  // Code blocks - no HTML allowed
  code: {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    ALLOW_DATA_ATTR: false,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false
  },

  // Strict mode - no HTML at all
  strict: {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    ALLOW_DATA_ATTR: false,
    KEEP_CONTENT: true,
    RETURN_DOM: false
  }
};

/**
 * Sanitize user input based on content type
 * @param input - The input to sanitize
 * @param type - The type of content (text, markdown, code, strict)
 * @returns Sanitized input
 */
export function sanitizeInput(input: unknown, type: SanitizeType = 'text'): string {
  if (input == null) return '';

  // Convert to string if not already
  let inputStr: string;
  if (typeof input !== 'string') {
    inputStr = String(input);
  } else {
    inputStr = input;
  }

  // Get configuration for the content type
  const config = sanitizeConfig[type] ?? sanitizeConfig.text;

  // Additional pre-processing to remove dangerous patterns
  const cleaned = inputStr
    // Remove script tags completely
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove javascript: URLs
    .replace(/javascript:/gi, '')
    // Remove on* event handlers
    .replace(/on\w+\s*=/gi, '')
    // Remove data URLs that could contain scripts
    .replace(/data:text\/html[^,]*,/gi, '')
    // Remove vbscript: URLs
    .replace(/vbscript:/gi, '');

  // Apply DOMPurify sanitization
  const sanitized = DOMPurify.sanitize(cleaned, {
    ...config,
    RETURN_TRUSTED_TYPE: false,
    SANITIZE_DOM: true
  });

  return sanitized;
}

/**
 * Sanitize a document title
 * @param title - The title to sanitize
 * @returns Sanitized title
 */
export function sanitizeTitle(title: unknown): string {
  if (title == null) return '';

  // Titles should be plain text only
  return sanitizeInput(title, 'strict').trim();
}

/**
 * Sanitize tags array
 * @param tags - Array of tags
 * @returns Sanitized tags
 */
export function sanitizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];

  return tags
    .filter((tag): tag is string => typeof tag === 'string')
    .map(tag => sanitizeInput(tag, 'strict').trim())
    .filter(tag => tag.length > 0 && tag.length < 50); // Reasonable tag length
}

/**
 * Sanitize a block based on its type
 * @param block - The block to sanitize
 * @returns Sanitized block
 */
export function sanitizeBlock<T extends Block | null | undefined>(block: T): T {
  if (block == null) return block;

  const sanitized: Block = { ...block };

  // Sanitize based on block type
  switch (block.type) {
    case 'text':
    case 'heading':
      // Text and heading blocks allow basic markdown
      sanitized.content = sanitizeInput(block.content ?? '', 'markdown');
      break;

    case 'code':
      // Code blocks should not be sanitized to preserve formatting
      // But we ensure it's a string
      sanitized.content = String(block.content ?? '');
      // Sanitize the language field
      if (sanitized.language != null) {
        sanitized.language = sanitizeInput(sanitized.language, 'strict');
      }
      // Sanitize file path
      if (sanitized.file_path != null) {
        sanitized.file_path = sanitizeInput(sanitized.file_path, 'strict');
      }
      break;

    case 'ai':
      // Sanitize AI conversation messages
      if (block.messages != null && Array.isArray(block.messages)) {
        sanitized.messages = block.messages.map(msg => ({
          ...msg,
          content: sanitizeInput(msg.content ?? '', 'markdown'),
          role: sanitizeInput(msg.role ?? '', 'strict')
        }));
      }
      // Also sanitize the main content if present
      if (sanitized.content != null) {
        sanitized.content = sanitizeInput(sanitized.content, 'markdown');
      }
      break;

    case 'table':
      // Sanitize table data
      if (block.data != null && Array.isArray(block.data)) {
        sanitized.data = block.data.map(row =>
          Array.isArray(row)
            ? row.map(cell => sanitizeInput(String(cell ?? ''), 'text'))
            : row
        );
      }
      break;

    case 'todo':
      // Sanitize todo items
      if (block.items != null && Array.isArray(block.items)) {
        sanitized.items = block.items.map(item => ({
          ...item,
          text: sanitizeInput(item.text ?? '', 'text'),
          completed: Boolean(item.completed)
        }));
      }
      break;

    case 'image':
    case 'inline-image':
      // Sanitize image URLs and alt text
      if (sanitized.url != null) {
        // Basic URL validation
        try {
          const url = new URL(sanitized.url);
          // Only allow http(s) and data URLs for images
          if (!['http:', 'https:', 'data:'].includes(url.protocol)) {
            sanitized.url = '';
          }
        } catch {
          // If URL parsing fails, check if it's a relative path
          if (!sanitized.url.startsWith('/') && !sanitized.url.startsWith('./')) {
            sanitized.url = '';
          }
        }
      }
      if (sanitized.alt != null) {
        sanitized.alt = sanitizeInput(sanitized.alt, 'strict');
      }
      if (sanitized.caption != null) {
        sanitized.caption = sanitizeInput(sanitized.caption, 'text');
      }
      break;

    default:
      // For any other block types, sanitize content as text
      if (sanitized.content != null) {
        sanitized.content = sanitizeInput(sanitized.content, 'text');
      }
  }

  // Sanitize block ID if present
  if (sanitized.id != null) {
    sanitized.id = sanitizeInput(sanitized.id, 'strict');
  }

  return sanitized as T;
}

/**
 * Sanitize an entire document
 * @param doc - The document to sanitize
 * @returns Sanitized document
 */
export function sanitizeDocument<T extends Document | null | undefined>(doc: T): T {
  if (doc == null) return doc;

  const sanitized: Document = { ...doc };

  // Sanitize title
  if (sanitized.title != null) {
    sanitized.title = sanitizeTitle(sanitized.title);
  }

  // Sanitize tags
  if (sanitized.tags != null) {
    sanitized.tags = sanitizeTags(sanitized.tags);
  }

  // Sanitize blocks
  if (sanitized.blocks != null && Array.isArray(sanitized.blocks)) {
    sanitized.blocks = sanitized.blocks.map(sanitizeBlock);
  }

  // Sanitize metadata
  if (sanitized.metadata != null) {
    // Only keep safe metadata fields
    const safeMetadata: DocumentMetadata = {};
    const allowedFields: (keyof DocumentMetadata)[] = ['preview', 'wordCount', 'readTime', 'lastEditedBy'];

    for (const field of allowedFields) {
      if (sanitized.metadata[field] !== undefined) {
        if (typeof sanitized.metadata[field] === 'string') {
          safeMetadata[field] = sanitizeInput(sanitized.metadata[field], 'text') as DocumentMetadata[typeof field];
        } else {
          safeMetadata[field] = sanitized.metadata[field] as DocumentMetadata[typeof field];
        }
      }
    }

    sanitized.metadata = safeMetadata;
  }

  return sanitized as T;
}

/**
 * Sanitize search query input
 * @param query - Search query
 * @returns Sanitized query
 */
export function sanitizeSearchQuery(query: unknown): string {
  if (query == null) return '';

  // Remove special characters that could break search
  return sanitizeInput(query, 'strict')
    .replace(/[^\w\s-]/g, ' ') // Keep only alphanumeric, spaces, and hyphens
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .trim()
    .slice(0, 100); // Limit query length
}

/**
 * Create a safe HTML element with sanitized content
 * @param html - HTML content
 * @param type - Content type
 * @returns Safe DOM element
 */
export function createSafeElement(html: string, type: SanitizeType = 'text'): HTMLDivElement {
  const sanitized = sanitizeInput(html, type);
  const container = document.createElement('div');
  container.innerHTML = sanitized;
  return container;
}

/**
 * Validate and sanitize a URL
 * @param url - URL to validate
 * @param allowedProtocols - Allowed protocols
 * @returns Sanitized URL or empty string if invalid
 */
export function sanitizeURL(url: unknown, allowedProtocols: string[] = ['http:', 'https:']): string {
  if (url == null || typeof url !== 'string' || url === '') return '';

  try {
    const parsed = new URL(url);

    // Check if protocol is allowed
    if (!allowedProtocols.includes(parsed.protocol)) {
      return '';
    }

    // Additional checks for security
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
      // Optionally allow localhost in development
      // Use import.meta.env for Vite compatibility
      if (typeof import.meta !== 'undefined' && import.meta.env?.MODE !== 'development') {
        return '';
      }
      // Fallback for Node environment (tests)
      if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'development') {
        return '';
      }
    }

    return parsed.toString();
  } catch {
    // If it's not a valid URL, check if it's a relative path
    if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
      // Sanitize the path
      return sanitizeInput(url, 'strict');
    }

    return '';
  }
}

// Export DOMPurify for advanced use cases
export { DOMPurify };

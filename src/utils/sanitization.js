/**
 * Input Sanitization Utilities
 * 
 * Prevents XSS attacks by sanitizing user input
 * Uses DOMPurify for robust HTML sanitization
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitization configurations for different content types
 */
export const sanitizeConfig = {
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
 * @param {string} input - The input to sanitize
 * @param {string} type - The type of content (text, markdown, code, strict)
 * @returns {string} - Sanitized input
 */
export function sanitizeInput(input, type = 'text') {
  if (!input) return '';
  
  // Convert to string if not already
  if (typeof input !== 'string') {
    input = String(input);
  }
  
  // Get configuration for the content type
  const config = sanitizeConfig[type] || sanitizeConfig.text;
  
  // Additional pre-processing to remove dangerous patterns
  let cleaned = input
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
 * @param {string} title - The title to sanitize
 * @returns {string} - Sanitized title
 */
export function sanitizeTitle(title) {
  if (!title) return '';
  
  // Titles should be plain text only
  return sanitizeInput(title, 'strict').trim();
}

/**
 * Sanitize tags array
 * @param {string[]} tags - Array of tags
 * @returns {string[]} - Sanitized tags
 */
export function sanitizeTags(tags) {
  if (!Array.isArray(tags)) return [];
  
  return tags
    .filter(tag => typeof tag === 'string')
    .map(tag => sanitizeInput(tag, 'strict').trim())
    .filter(tag => tag.length > 0 && tag.length < 50); // Reasonable tag length
}

/**
 * Sanitize a block based on its type
 * @param {Object} block - The block to sanitize
 * @returns {Object} - Sanitized block
 */
export function sanitizeBlock(block) {
  if (!block) return block;
  
  const sanitized = { ...block };
  
  // Sanitize based on block type
  switch (block.type) {
    case 'text':
    case 'heading':
      // Text and heading blocks allow basic markdown
      sanitized.content = sanitizeInput(block.content || '', 'markdown');
      break;
      
    case 'code':
      // Code blocks should not be sanitized to preserve formatting
      // But we ensure it's a string
      sanitized.content = String(block.content || '');
      // Sanitize the language field
      if (sanitized.language) {
        sanitized.language = sanitizeInput(sanitized.language, 'strict');
      }
      // Sanitize file path
      if (sanitized.file_path) {
        sanitized.file_path = sanitizeInput(sanitized.file_path, 'strict');
      }
      break;
      
    case 'ai':
      // Sanitize AI conversation messages
      if (block.messages && Array.isArray(block.messages)) {
        sanitized.messages = block.messages.map(msg => ({
          ...msg,
          content: sanitizeInput(msg.content || '', 'markdown'),
          role: sanitizeInput(msg.role || '', 'strict')
        }));
      }
      // Also sanitize the main content if present
      if (sanitized.content) {
        sanitized.content = sanitizeInput(sanitized.content, 'markdown');
      }
      break;
      
    case 'table':
      // Sanitize table data
      if (block.data && Array.isArray(block.data)) {
        sanitized.data = block.data.map(row => 
          Array.isArray(row) 
            ? row.map(cell => sanitizeInput(String(cell || ''), 'text'))
            : row
        );
      }
      break;
      
    case 'todo':
      // Sanitize todo items
      if (block.items && Array.isArray(block.items)) {
        sanitized.items = block.items.map(item => ({
          ...item,
          text: sanitizeInput(item.text || '', 'text'),
          completed: Boolean(item.completed)
        }));
      }
      break;
      
    case 'image':
    case 'inline-image':
      // Sanitize image URLs and alt text
      if (sanitized.url) {
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
      if (sanitized.alt) {
        sanitized.alt = sanitizeInput(sanitized.alt, 'strict');
      }
      if (sanitized.caption) {
        sanitized.caption = sanitizeInput(sanitized.caption, 'text');
      }
      break;
      
    default:
      // For any other block types, sanitize content as text
      if (sanitized.content) {
        sanitized.content = sanitizeInput(sanitized.content, 'text');
      }
  }
  
  // Sanitize block ID if present
  if (sanitized.id) {
    sanitized.id = sanitizeInput(sanitized.id, 'strict');
  }
  
  return sanitized;
}

/**
 * Sanitize an entire document
 * @param {Object} doc - The document to sanitize
 * @returns {Object} - Sanitized document
 */
export function sanitizeDocument(doc) {
  if (!doc) return doc;
  
  const sanitized = { ...doc };
  
  // Sanitize title
  if (sanitized.title) {
    sanitized.title = sanitizeTitle(sanitized.title);
  }
  
  // Sanitize tags
  if (sanitized.tags) {
    sanitized.tags = sanitizeTags(sanitized.tags);
  }
  
  // Sanitize blocks
  if (sanitized.blocks && Array.isArray(sanitized.blocks)) {
    sanitized.blocks = sanitized.blocks.map(sanitizeBlock);
  }
  
  // Sanitize metadata
  if (sanitized.metadata) {
    // Only keep safe metadata fields
    const safeMetadata = {};
    const allowedFields = ['preview', 'wordCount', 'readTime', 'lastEditedBy'];
    
    for (const field of allowedFields) {
      if (sanitized.metadata[field] !== undefined) {
        if (typeof sanitized.metadata[field] === 'string') {
          safeMetadata[field] = sanitizeInput(sanitized.metadata[field], 'text');
        } else {
          safeMetadata[field] = sanitized.metadata[field];
        }
      }
    }
    
    sanitized.metadata = safeMetadata;
  }
  
  return sanitized;
}

/**
 * Sanitize search query input
 * @param {string} query - Search query
 * @returns {string} - Sanitized query
 */
export function sanitizeSearchQuery(query) {
  if (!query) return '';
  
  // Remove special characters that could break search
  return sanitizeInput(query, 'strict')
    .replace(/[^\w\s-]/g, ' ') // Keep only alphanumeric, spaces, and hyphens
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .trim()
    .slice(0, 100); // Limit query length
}

/**
 * Create a safe HTML element with sanitized content
 * @param {string} html - HTML content
 * @param {string} type - Content type
 * @returns {HTMLElement} - Safe DOM element
 */
export function createSafeElement(html, type = 'text') {
  const sanitized = sanitizeInput(html, type);
  const container = document.createElement('div');
  container.innerHTML = sanitized;
  return container;
}

/**
 * Validate and sanitize a URL
 * @param {string} url - URL to validate
 * @param {string[]} allowedProtocols - Allowed protocols
 * @returns {string} - Sanitized URL or empty string if invalid
 */
export function sanitizeURL(url, allowedProtocols = ['http:', 'https:']) {
  if (!url) return '';
  
  try {
    const parsed = new URL(url);
    
    // Check if protocol is allowed
    if (!allowedProtocols.includes(parsed.protocol)) {
      return '';
    }
    
    // Additional checks for security
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
      // Optionally allow localhost in development
      if (process.env.NODE_ENV !== 'development') {
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
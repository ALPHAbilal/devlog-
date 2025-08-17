/**
 * Block Height Estimator Utility
 * 
 * Provides accurate height estimates for different block types
 * Used by Virtual Scrolling to optimize rendering performance
 */

// Base padding and margins for block containers
const BASE_PADDING = 16; // Top and bottom padding
const BLOCK_MARGIN = 16; // Space between blocks
const BLOCK_CONTROLS_HEIGHT = 40; // Height of block controls when visible

/**
 * Estimate block height based on type and content
 * @param {Object} block - The block object
 * @param {Object} options - Additional options
 * @param {boolean} options.isMobile - Whether in mobile view
 * @param {boolean} options.isFocused - Whether block is focused
 * @returns {number} Estimated height in pixels
 */
export function estimateBlockHeight(block, options = {}) {
  const { isMobile = false, isFocused = false } = options;
  
  if (!block) return 100; // Default fallback
  
  // Add extra height if block is focused (controls visible)
  const focusedExtra = isFocused ? BLOCK_CONTROLS_HEIGHT : 0;
  
  // Base height calculation by type
  let baseHeight = BASE_PADDING * 2; // Top and bottom padding
  
  switch (block.type) {
    case 'heading': {
      // Heading sizes: h1=32px, h2=24px, h3=20px
      const level = block.level || 1;
      const fontSize = level === 1 ? 32 : level === 2 ? 24 : 20;
      const lineHeight = fontSize * 1.2;
      
      // Estimate lines based on content length
      const charsPerLine = isMobile ? 30 : 50;
      const lines = Math.ceil((block.content?.length || 10) / charsPerLine);
      
      baseHeight += lines * lineHeight;
      break;
    }
    
    case 'text': {
      if (!block.content) {
        baseHeight += 60; // Empty text block
      } else {
        // Estimate based on content length
        // Approximate 80 chars per line on desktop, 50 on mobile
        const charsPerLine = isMobile ? 50 : 80;
        const lines = Math.max(1, Math.ceil(block.content.length / charsPerLine));
        const lineHeight = 24; // ~1.5rem line height
        
        baseHeight += lines * lineHeight;
        
        // Add extra for rich text formatting
        if (block.content.includes('**') || block.content.includes('*')) {
          baseHeight += 4; // Bold/italic slightly increases height
        }
      }
      break;
    }
    
    case 'code': {
      // Code block has header (language selector, copy button)
      const headerHeight = 40;
      baseHeight += headerHeight;
      
      if (!block.content) {
        baseHeight += 100; // Empty code block
      } else {
        // Count actual lines
        const lines = (block.content.match(/\n/g) || []).length + 1;
        const lineHeight = 20; // Monospace line height
        
        // Code blocks have max-height of 400px by default
        const contentHeight = Math.min(lines * lineHeight, 400);
        baseHeight += contentHeight;
      }
      
      // Add padding inside code block
      baseHeight += 16;
      break;
    }
    
    case 'table': {
      // Table has header row + data rows
      const headerHeight = 40;
      const rowHeight = 36;
      
      if (!block.rows || block.rows.length === 0) {
        baseHeight += headerHeight + rowHeight * 3; // Default 3 rows
      } else {
        baseHeight += headerHeight + (block.rows.length * rowHeight);
      }
      
      // Add padding
      baseHeight += 16;
      break;
    }
    
    case 'image': {
      // Images have aspect ratio preservation
      // Default to 16:9 aspect ratio if not specified
      const containerWidth = isMobile ? 350 : 600;
      const aspectRatio = block.aspectRatio || (16 / 9);
      const imageHeight = containerWidth / aspectRatio;
      
      // Cap max height
      const maxHeight = 400;
      baseHeight += Math.min(imageHeight, maxHeight);
      
      // Add caption space if exists
      if (block.caption) {
        baseHeight += 30;
      }
      break;
    }
    
    case 'todo': {
      // Todo items
      const itemHeight = 32; // Height per todo item
      const items = block.items || [];
      
      if (items.length === 0) {
        baseHeight += itemHeight * 2; // Default 2 items
      } else {
        baseHeight += items.length * itemHeight;
      }
      
      // Add "Add task" button
      baseHeight += 36;
      break;
    }
    
    case 'ai_conversation': {
      // AI conversation blocks can be quite tall
      const messageHeight = 80; // Average height per message
      const messages = block.messages || [];
      
      if (messages.length === 0) {
        baseHeight += 150; // Empty state
      } else {
        // Estimate based on message count and content
        messages.forEach(msg => {
          const contentLength = msg.content?.length || 100;
          const estimatedLines = Math.ceil(contentLength / 80);
          baseHeight += Math.max(messageHeight, estimatedLines * 24);
        });
      }
      
      // Add input area
      baseHeight += 60;
      break;
    }
    
    case 'link': {
      // Link preview blocks
      baseHeight += 100; // Thumbnail + title + description
      
      if (block.preview?.image) {
        baseHeight += 150; // Add image preview height
      }
      break;
    }
    
    case 'embed': {
      // Embedded content (YouTube, Twitter, etc.)
      const embedType = block.embedType || 'default';
      
      switch (embedType) {
        case 'youtube':
        case 'vimeo':
          baseHeight += 315; // Standard 16:9 video embed
          break;
        case 'twitter':
          baseHeight += 250; // Average tweet height
          break;
        case 'spotify':
          baseHeight += 152; // Spotify embed height
          break;
        default:
          baseHeight += 200; // Default embed height
      }
      break;
    }
    
    case 'divider': {
      // Simple horizontal line
      baseHeight += 32;
      break;
    }
    
    case 'callout': {
      // Callout blocks with icon and text
      const content = block.content || '';
      const charsPerLine = isMobile ? 45 : 75;
      const lines = Math.max(1, Math.ceil(content.length / charsPerLine));
      
      baseHeight += 40 + (lines * 24); // Icon + text
      break;
    }
    
    default: {
      // Unknown block type - use conservative estimate
      baseHeight += 100;
      
      // Try to estimate based on content if available
      if (block.content) {
        const contentLines = Math.ceil(block.content.length / 80);
        baseHeight += contentLines * 20;
      }
    }
  }
  
  // Add margin between blocks
  baseHeight += BLOCK_MARGIN;
  
  // Add extra height for focused state (controls)
  baseHeight += focusedExtra;
  
  // Add some buffer for safety (5%)
  return Math.ceil(baseHeight * 1.05);
}

/**
 * Get minimum height for a block type
 * Used as fallback when content is not yet loaded
 */
export function getMinBlockHeight(blockType) {
  const minHeights = {
    heading: 60,
    text: 80,
    code: 140,
    table: 150,
    image: 200,
    todo: 100,
    ai_conversation: 200,
    link: 120,
    embed: 200,
    divider: 48,
    callout: 80
  };
  
  return minHeights[blockType] || 100;
}

/**
 * Update height cache when block content changes
 * This is used by VirtualScroll to maintain accurate heights
 */
export class BlockHeightCache {
  constructor() {
    this.cache = new Map();
    this.observers = new Map();
  }
  
  /**
   * Get cached height or estimate
   */
  getHeight(blockId, block, options) {
    const cached = this.cache.get(blockId);
    if (cached && cached.version === block.version) {
      return cached.height;
    }
    
    // Estimate and cache
    const estimated = estimateBlockHeight(block, options);
    this.cache.set(blockId, {
      height: estimated,
      version: block.version || Date.now()
    });
    
    return estimated;
  }
  
  /**
   * Update cached height from actual measurement
   */
  setHeight(blockId, height, version) {
    this.cache.set(blockId, {
      height,
      version: version || Date.now(),
      measured: true
    });
  }
  
  /**
   * Clear cache for a specific block
   */
  clearBlock(blockId) {
    this.cache.delete(blockId);
  }
  
  /**
   * Clear entire cache
   */
  clearAll() {
    this.cache.clear();
  }
  
  /**
   * Get statistics about cache
   */
  getStats() {
    let measured = 0;
    let estimated = 0;
    
    this.cache.forEach(entry => {
      if (entry.measured) {
        measured++;
      } else {
        estimated++;
      }
    });
    
    return {
      total: this.cache.size,
      measured,
      estimated,
      accuracy: measured / Math.max(1, this.cache.size)
    };
  }
}

// Export singleton instance for global use
export const blockHeightCache = new BlockHeightCache();

// Export default for backward compatibility
export default {
  estimateBlockHeight,
  getMinBlockHeight,
  BlockHeightCache,
  blockHeightCache
};
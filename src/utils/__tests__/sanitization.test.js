import { describe, it, expect, beforeEach } from 'vitest';
import { 
  sanitizeInput, 
  sanitizeBlock, 
  sanitizeDocument,
  sanitizeTitle,
  sanitizeTags,
  sanitizeSearchQuery,
  sanitizeURL
} from '../sanitization';

describe('Sanitization', () => {
  describe('sanitizeInput', () => {
    it('should remove script tags', () => {
      const input = 'Hello <script>alert("XSS")</script> World';
      const result = sanitizeInput(input);
      expect(result).toBe('Hello  World');
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
    });

    it('should remove javascript: URLs', () => {
      const input = '<a href="javascript:alert(1)">Click me</a>';
      const result = sanitizeInput(input, 'markdown');
      expect(result).not.toContain('javascript:');
      expect(result).toContain('<a');
      expect(result).toContain('Click me</a>');
    });

    it('should remove event handlers', () => {
      const input = '<div onclick="alert(1)" onmouseover="alert(2)">Click me</div>';
      const result = sanitizeInput(input);
      expect(result).not.toContain('onclick');
      expect(result).not.toContain('onmouseover');
      expect(result).toContain('Click me');
    });

    it('should preserve allowed tags in text mode', () => {
      const input = '<b>Bold</b> and <i>italic</i> and <em>emphasis</em>';
      const result = sanitizeInput(input, 'text');
      expect(result).toContain('<b>Bold</b>');
      expect(result).toContain('<i>italic</i>');
      expect(result).toContain('<em>emphasis</em>');
    });

    it('should preserve more tags in markdown mode', () => {
      const input = '<h1>Title</h1><ul><li>Item</li></ul><a href="https://example.com">Link</a>';
      const result = sanitizeInput(input, 'markdown');
      expect(result).toContain('<h1>Title</h1>');
      expect(result).toContain('<ul><li>Item</li></ul>');
      expect(result).toContain('<a href="https://example.com">Link</a>');
    });

    it('should remove all tags in strict mode', () => {
      const input = '<b>Bold</b> <script>alert(1)</script> <div>Text</div>';
      const result = sanitizeInput(input, 'strict');
      expect(result).toBe('Bold  Text');
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
    });

    it('should handle empty input', () => {
      expect(sanitizeInput('')).toBe('');
      expect(sanitizeInput(null)).toBe('');
      expect(sanitizeInput(undefined)).toBe('');
    });

    it('should convert non-string input to string', () => {
      expect(sanitizeInput(123)).toBe('123');
      expect(sanitizeInput(true)).toBe('true');
      expect(sanitizeInput({ key: 'value' })).toBe('[object Object]');
    });

    it('should remove data URLs with potential scripts', () => {
      const input = '<a href="data:text/html,<script>alert(1)</script>">Click</a>';
      const result = sanitizeInput(input, 'markdown');
      expect(result).not.toContain('data:text/html');
    });

    it('should remove vbscript URLs', () => {
      const input = '<a href="vbscript:msgbox(1)">Click</a>';
      const result = sanitizeInput(input, 'markdown');
      expect(result).not.toContain('vbscript:');
    });
  });

  describe('sanitizeTitle', () => {
    it('should remove all HTML from titles', () => {
      const title = '<b>My</b> <script>alert(1)</script> Title';
      const result = sanitizeTitle(title);
      expect(result).toBe('My  Title');
    });

    it('should trim whitespace', () => {
      const title = '  My Title  ';
      const result = sanitizeTitle(title);
      expect(result).toBe('My Title');
    });

    it('should handle empty titles', () => {
      expect(sanitizeTitle('')).toBe('');
      expect(sanitizeTitle(null)).toBe('');
      expect(sanitizeTitle(undefined)).toBe('');
    });
  });

  describe('sanitizeTags', () => {
    it('should sanitize each tag', () => {
      const tags = ['<b>tag1</b>', 'normal-tag', '<script>alert</script>'];
      const result = sanitizeTags(tags);
      expect(result).toEqual(['tag1', 'normal-tag', '']);
    });

    it('should filter out empty tags', () => {
      const tags = ['tag1', '', '  ', '<script></script>'];
      const result = sanitizeTags(tags);
      expect(result).toEqual(['tag1']);
    });

    it('should filter out very long tags', () => {
      const tags = ['normal', 'x'.repeat(100)];
      const result = sanitizeTags(tags);
      expect(result).toEqual(['normal']);
    });

    it('should handle non-array input', () => {
      expect(sanitizeTags(null)).toEqual([]);
      expect(sanitizeTags(undefined)).toEqual([]);
      expect(sanitizeTags('not-an-array')).toEqual([]);
    });

    it('should filter non-string values', () => {
      const tags = ['tag1', 123, null, undefined, 'tag2'];
      const result = sanitizeTags(tags);
      expect(result).toEqual(['tag1', 'tag2']);
    });
  });

  describe('sanitizeBlock', () => {
    it('should sanitize text blocks with markdown', () => {
      const block = {
        type: 'text',
        content: 'Hello <script>alert(1)</script> **World**'
      };
      const result = sanitizeBlock(block);
      expect(result.content).toBe('Hello  **World**');
    });

    it('should not sanitize code block content', () => {
      const block = {
        type: 'code',
        content: '<script>console.log("This is code")</script>',
        language: '<b>javascript</b>'
      };
      const result = sanitizeBlock(block);
      expect(result.content).toBe('<script>console.log("This is code")</script>');
      expect(result.language).toBe('javascript'); // Language should be sanitized
    });

    it('should sanitize heading blocks', () => {
      const block = {
        type: 'heading',
        content: 'Title <script>alert(1)</script>'
      };
      const result = sanitizeBlock(block);
      expect(result.content).toBe('Title ');
    });

    it('should sanitize AI message content', () => {
      const block = {
        type: 'ai',
        messages: [
          { role: 'user', content: 'Hello <script>alert(1)</script>' },
          { role: '<b>assistant</b>', content: 'Hi <b>there</b>' }
        ],
        content: 'Summary <script>bad</script>'
      };
      const result = sanitizeBlock(block);
      expect(result.messages[0].content).toBe('Hello ');
      expect(result.messages[0].role).toBe('user');
      expect(result.messages[1].content).toBe('Hi <b>there</b>');
      expect(result.messages[1].role).toBe('assistant');
      expect(result.content).toBe('Summary ');
    });

    it('should sanitize table data', () => {
      const block = {
        type: 'table',
        data: [
          ['<b>Header1</b>', '<script>alert(1)</script>'],
          ['Data1', '<i>Data2</i>']
        ]
      };
      const result = sanitizeBlock(block);
      expect(result.data[0][0]).toBe('<b>Header1</b>');
      expect(result.data[0][1]).toBe('');
      expect(result.data[1][1]).toBe('<i>Data2</i>');
    });

    it('should sanitize todo items', () => {
      const block = {
        type: 'todo',
        items: [
          { text: 'Task <script>alert(1)</script>', completed: 'yes' },
          { text: '<b>Important</b> task', completed: false }
        ]
      };
      const result = sanitizeBlock(block);
      expect(result.items[0].text).toBe('Task ');
      expect(result.items[0].completed).toBe(true); // Converted to boolean
      expect(result.items[1].text).toBe('<b>Important</b> task');
      expect(result.items[1].completed).toBe(false);
    });

    it('should validate image URLs', () => {
      const block = {
        type: 'image',
        url: 'javascript:alert(1)',
        alt: '<b>Image</b> description',
        caption: 'My <i>caption</i>'
      };
      const result = sanitizeBlock(block);
      expect(result.url).toBe(''); // Invalid protocol removed
      expect(result.alt).toBe('Image description');
      expect(result.caption).toBe('My <i>caption</i>');
    });

    it('should allow valid image URLs', () => {
      const validUrls = [
        'https://example.com/image.jpg',
        'http://example.com/image.jpg',
        'data:image/png;base64,abc123',
        '/relative/path.jpg',
        './relative/path.jpg'
      ];
      
      validUrls.forEach(url => {
        const block = { type: 'image', url };
        const result = sanitizeBlock(block);
        expect(result.url).toBe(url);
      });
    });

    it('should sanitize block IDs', () => {
      const block = {
        id: '<script>alert(1)</script>-id',
        type: 'text',
        content: 'Content'
      };
      const result = sanitizeBlock(block);
      expect(result.id).toBe('-id');
    });

    it('should handle null/undefined blocks', () => {
      expect(sanitizeBlock(null)).toBeNull();
      expect(sanitizeBlock(undefined)).toBeUndefined();
    });

    it('should handle unknown block types', () => {
      const block = {
        type: 'unknown',
        content: '<b>Content</b> <script>alert(1)</script>'
      };
      const result = sanitizeBlock(block);
      expect(result.content).toBe('<b>Content</b> ');
    });
  });

  describe('sanitizeDocument', () => {
    it('should sanitize all document fields', () => {
      const doc = {
        title: '<b>My</b> Document',
        tags: ['<script>tag1</script>', 'tag2'],
        blocks: [
          { type: 'text', content: 'Hello <script>alert(1)</script>' },
          { type: 'code', content: '<script>code</script>' }
        ],
        metadata: {
          preview: 'Preview <b>text</b>',
          wordCount: 100,
          customField: 'should be removed'
        }
      };
      
      const result = sanitizeDocument(doc);
      
      expect(result.title).toBe('My Document');
      expect(result.tags).toEqual(['tag1', 'tag2']);
      expect(result.blocks[0].content).toBe('Hello ');
      expect(result.blocks[1].content).toBe('<script>code</script>'); // Code not sanitized
      expect(result.metadata.preview).toBe('Preview <b>text</b>');
      expect(result.metadata.wordCount).toBe(100);
      expect(result.metadata.customField).toBeUndefined();
    });

    it('should handle null/undefined documents', () => {
      expect(sanitizeDocument(null)).toBeNull();
      expect(sanitizeDocument(undefined)).toBeUndefined();
    });

    it('should only keep allowed metadata fields', () => {
      const doc = {
        metadata: {
          preview: 'Safe',
          wordCount: 100,
          readTime: 5,
          lastEditedBy: 'user123',
          dangerous: '<script>alert(1)</script>',
          notAllowed: 'removed'
        }
      };
      
      const result = sanitizeDocument(doc);
      expect(Object.keys(result.metadata)).toEqual(['preview', 'wordCount', 'readTime', 'lastEditedBy']);
    });
  });

  describe('sanitizeSearchQuery', () => {
    it('should remove special characters', () => {
      const query = 'search <script>alert(1)</script> @#$%^&*()';
      const result = sanitizeSearchQuery(query);
      expect(result).toBe('search alert 1');
    });

    it('should collapse multiple spaces', () => {
      const query = 'search    multiple     spaces';
      const result = sanitizeSearchQuery(query);
      expect(result).toBe('search multiple spaces');
    });

    it('should limit query length', () => {
      const query = 'x'.repeat(200);
      const result = sanitizeSearchQuery(query);
      expect(result.length).toBe(100);
    });

    it('should keep alphanumeric, spaces, and hyphens', () => {
      const query = 'search-term with numbers 123';
      const result = sanitizeSearchQuery(query);
      expect(result).toBe('search-term with numbers 123');
    });

    it('should handle empty queries', () => {
      expect(sanitizeSearchQuery('')).toBe('');
      expect(sanitizeSearchQuery(null)).toBe('');
      expect(sanitizeSearchQuery(undefined)).toBe('');
    });
  });

  describe('sanitizeURL', () => {
    it('should allow valid HTTP/HTTPS URLs', () => {
      const urls = [
        'https://example.com',
        'http://example.com',
        'https://example.com/path?query=value#hash'
      ];
      
      urls.forEach(url => {
        expect(sanitizeURL(url)).toBe(url);
      });
    });

    it('should reject invalid protocols', () => {
      const urls = [
        'javascript:alert(1)',
        'vbscript:msgbox(1)',
        'file:///etc/passwd',
        'ftp://example.com'
      ];
      
      urls.forEach(url => {
        expect(sanitizeURL(url)).toBe('');
      });
    });

    it('should allow custom protocols when specified', () => {
      const url = 'ftp://example.com';
      const result = sanitizeURL(url, ['ftp:', 'http:', 'https:']);
      expect(result).toBe(url);
    });

    it('should handle relative paths', () => {
      const paths = ['/path', './path', '../path'];
      paths.forEach(path => {
        expect(sanitizeURL(path)).toBe(path);
      });
    });

    it('should reject localhost in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      expect(sanitizeURL('http://localhost:3000')).toBe('');
      expect(sanitizeURL('http://127.0.0.1:3000')).toBe('');
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should handle empty URLs', () => {
      expect(sanitizeURL('')).toBe('');
      expect(sanitizeURL(null)).toBe('');
      expect(sanitizeURL(undefined)).toBe('');
    });

    it('should handle malformed URLs', () => {
      expect(sanitizeURL('not a url')).toBe('');
      expect(sanitizeURL('http://')).toBe('');
    });
  });
});
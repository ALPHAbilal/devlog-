/**
 * Markdown ↔ HTML Converter for TipTap
 *
 * Converts between markdown (storage format) and HTML (TipTap format).
 * Only handles the subset of markdown we support in TextBlock.
 */

/**
 * Convert Markdown to HTML for TipTap
 * @param {string} markdown - Markdown content
 * @returns {string} HTML content for TipTap
 */
export function markdownToHtml(markdown) {
  if (!markdown) return '';

  let html = markdown;

  // Escape HTML entities first (except for our markdown)
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Process block-level elements first

  // Horizontal rule: --- (must be on its own line)
  html = html.replace(/^---$/gm, '<hr>');

  // Blockquote: > text
  html = html.replace(/^&gt;\s+(.+)$/gm, '<blockquote><p>$1</p></blockquote>');

  // Process inline elements

  // Bold: **text** or __text__
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');

  // Italic: *text* or _text_ (not inside bold)
  // Use negative lookbehind/lookahead to avoid matching ** or __
  html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
  html = html.replace(/(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g, '<em>$1</em>');

  // Strikethrough: ~~text~~
  html = html.replace(/~~(.+?)~~/g, '<s>$1</s>');

  // Inline code: `code`
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Links: [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  // Document links: [[Document Name]] - convert to styled span for now
  html = html.replace(/\[\[([^\]]+)\]\]/g, '<a href="#" class="doc-link" data-doc="$1">$1</a>');

  // Process lists - this is tricky, need to group consecutive list items

  // Split into lines for list processing
  const lines = html.split('\n');
  const processedLines = [];
  let inUnorderedList = false;
  let inOrderedList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for unordered list item: - item or * item
    const unorderedMatch = line.match(/^[-*]\s+(.+)$/);
    // Check for ordered list item: 1. item
    const orderedMatch = line.match(/^\d+\.\s+(.+)$/);

    if (unorderedMatch) {
      if (!inUnorderedList) {
        if (inOrderedList) {
          processedLines.push('</ol>');
          inOrderedList = false;
        }
        processedLines.push('<ul>');
        inUnorderedList = true;
      }
      processedLines.push(`<li><p>${unorderedMatch[1]}</p></li>`);
    } else if (orderedMatch) {
      if (!inOrderedList) {
        if (inUnorderedList) {
          processedLines.push('</ul>');
          inUnorderedList = false;
        }
        processedLines.push('<ol>');
        inOrderedList = true;
      }
      processedLines.push(`<li><p>${orderedMatch[1]}</p></li>`);
    } else {
      // Close any open lists
      if (inUnorderedList) {
        processedLines.push('</ul>');
        inUnorderedList = false;
      }
      if (inOrderedList) {
        processedLines.push('</ol>');
        inOrderedList = false;
      }

      // Handle regular lines
      if (line.trim() === '') {
        // Empty line - TipTap uses <p></p> for empty paragraphs
        processedLines.push('<p></p>');
      } else if (line.startsWith('<')) {
        // Already HTML (blockquote, hr, etc.)
        processedLines.push(line);
      } else {
        // Regular paragraph
        processedLines.push(`<p>${line}</p>`);
      }
    }
  }

  // Close any remaining open lists
  if (inUnorderedList) {
    processedLines.push('</ul>');
  }
  if (inOrderedList) {
    processedLines.push('</ol>');
  }

  html = processedLines.join('');

  // Clean up: remove empty paragraphs between block elements
  html = html.replace(/<p><\/p>(?=<\/?(ul|ol|blockquote|hr))/g, '');
  html = html.replace(/(<\/?(ul|ol|blockquote|hr)[^>]*>)<p><\/p>/g, '$1');

  return html;
}

/**
 * Convert HTML back to Markdown for storage
 * @param {string} html - HTML content from TipTap
 * @returns {string} Markdown content
 */
export function htmlToMarkdown(html) {
  if (!html) return '';

  let markdown = html;

  // Handle paragraph tags
  markdown = markdown.replace(/<p>/g, '');
  markdown = markdown.replace(/<\/p>/g, '\n');

  // Bold
  markdown = markdown.replace(/<strong>(.+?)<\/strong>/g, '**$1**');
  markdown = markdown.replace(/<b>(.+?)<\/b>/g, '**$1**');

  // Italic
  markdown = markdown.replace(/<em>(.+?)<\/em>/g, '*$1*');
  markdown = markdown.replace(/<i>(.+?)<\/i>/g, '*$1*');

  // Underline - keep as HTML since markdown doesn't have underline
  // Or convert to custom syntax if you prefer
  markdown = markdown.replace(/<u>(.+?)<\/u>/g, '$1');

  // Strikethrough
  markdown = markdown.replace(/<s>(.+?)<\/s>/g, '~~$1~~');
  markdown = markdown.replace(/<strike>(.+?)<\/strike>/g, '~~$1~~');
  markdown = markdown.replace(/<del>(.+?)<\/del>/g, '~~$1~~');

  // Code
  markdown = markdown.replace(/<code>(.+?)<\/code>/g, '`$1`');

  // Links - handle various formats
  markdown = markdown.replace(/<a[^>]+href="([^"]+)"[^>]*>(.+?)<\/a>/g, (match, url, text) => {
    // Check if it's a document link
    if (match.includes('class="doc-link"') || match.includes('data-doc=')) {
      return `[[${text}]]`;
    }
    return `[${text}](${url})`;
  });

  // Lists
  markdown = markdown.replace(/<ul>/g, '');
  markdown = markdown.replace(/<\/ul>/g, '');
  markdown = markdown.replace(/<ol>/g, '');
  markdown = markdown.replace(/<\/ol>/g, '');
  markdown = markdown.replace(/<li><p>(.+?)<\/p><\/li>/g, '- $1\n');
  markdown = markdown.replace(/<li>(.+?)<\/li>/g, '- $1\n');

  // Blockquote
  markdown = markdown.replace(/<blockquote><p>(.+?)<\/p><\/blockquote>/g, '> $1\n');
  markdown = markdown.replace(/<blockquote>(.+?)<\/blockquote>/g, '> $1\n');

  // Horizontal rule
  markdown = markdown.replace(/<hr\s*\/?>/g, '---\n');

  // Line breaks
  markdown = markdown.replace(/<br\s*\/?>/g, '\n');

  // Decode HTML entities
  markdown = markdown
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Clean up excessive newlines
  markdown = markdown.replace(/\n{3,}/g, '\n\n');

  // Trim whitespace
  markdown = markdown.trim();

  return markdown;
}

/**
 * Check if content is empty (only whitespace or empty HTML)
 * @param {string} content - Content to check
 * @returns {boolean} True if empty
 */
export function isContentEmpty(content) {
  if (!content) return true;

  // Remove HTML tags and check if anything remains
  const textOnly = content
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();

  return textOnly.length === 0;
}

/**
 * Get plain text from HTML (for word count, preview, etc.)
 * @param {string} html - HTML content
 * @returns {string} Plain text
 */
export function htmlToPlainText(html) {
  if (!html) return '';

  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

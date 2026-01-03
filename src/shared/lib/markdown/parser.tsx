import React from 'react';
import InlineImage from '@/components/InlineImage';

// Parse markdown text and return JSX elements
export function parseMarkdown(text) {
  if (!text) return null;

  // Patterns for markdown elements
  const patterns = {
    // Bold: **text** or __text__
    bold: /(\*\*|__)(.*?)\1/g,
    // Italic: *text* or _text_ (but not ** or __)
    italic: /(?<!\*)\*(?!\*)([^*]+)(?<!\*)\*(?!\*)|(?<!_)_(?!_)([^_]+)(?<!_)_(?!_)/g,
    // Inline code: `code`
    inlineCode: /`([^`]+)`/g,
    // Strikethrough: ~~text~~
    strikethrough: /~~(.*?)~~/g,
    // Document mentions: @Document Name (more flexible - allows letters, numbers, spaces, hyphens, underscores)
    // Stops at: double space, newline, punctuation, or another @
    mention: /@([a-zA-Z0-9_-]+(?:\s+[a-zA-Z0-9_-]+)*?)(?=\s\s|[\n.,!?;:@]|$)/g,
    // Document links: [[Document Name]]
    docLink: /\[\[([^\]]+)\]\]/g,
    // Links: [text](url)
    link: /\[([^\]]+)\]\(([^)]+)\)/g,
    // Raw URLs: http://, https://, or www.
    rawUrl: /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])|(www\.[^\s<]+[^<.,:;"')\]\s])/g,
    // Images: ![alt](url)
    image: /!\[([^\]]*)\]\(([^)]+)\)/g,
    // Tags: #tagname[text] - we'll extract but not display the tag syntax
    tag: /#(\w+)\[([^\]]+)\]/g,
    // Line breaks
    lineBreak: /\n/g,
  };

  // First, split by inline code to preserve it
  const segments = [];
  let lastIndex = 0;
  let match;

  // Extract code blocks first to avoid parsing markdown inside them
  const codeMatches = [];
  const codeRegex = new RegExp(patterns.inlineCode);
  while ((match = codeRegex.exec(text)) !== null) {
    codeMatches.push({
      start: match.index,
      end: match.index + match[0].length,
      content: match[1],
      type: 'code'
    });
  }

  // Sort matches by position
  codeMatches.sort((a, b) => a.start - b.start);

  // Build segments
  codeMatches.forEach((codeMatch, index) => {
    // Add text before code
    if (codeMatch.start > lastIndex) {
      segments.push({
        type: 'text',
        content: text.slice(lastIndex, codeMatch.start)
      });
    }
    // Add code
    segments.push({
      type: 'code',
      content: codeMatch.content
    });
    lastIndex = codeMatch.end;
  });

  // Add remaining text
  if (lastIndex < text.length) {
    segments.push({
      type: 'text',
      content: text.slice(lastIndex)
    });
  }

  // Process each segment
  const processedSegments = segments.map((segment, segmentIndex) => {
    if (segment.type === 'code') {
      return (
        <code 
          key={`code-${segmentIndex}`}
          className="px-1.5 py-0.5 bg-dark-secondary/50 text-accent-green rounded text-sm font-mono"
        >
          {segment.content}
        </code>
      );
    }

    // Process text segment for other markdown
    let processedText = segment.content;
    const elements = [];
    let currentIndex = 0;

    // Process bold
    const boldRegex = new RegExp(patterns.bold);
    const boldMatches = [];
    while ((match = boldRegex.exec(processedText)) !== null) {
      boldMatches.push({
        start: match.index,
        end: match.index + match[0].length,
        content: match[2],
        type: 'bold'
      });
    }

    // Process italic (only in non-bold text)
    const italicRegex = new RegExp(patterns.italic);
    const italicMatches = [];
    while ((match = italicRegex.exec(processedText)) !== null) {
      const content = match[1] || match[2];
      let isInsideBold = false;
      for (const boldMatch of boldMatches) {
        if (match.index >= boldMatch.start && match.index <= boldMatch.end) {
          isInsideBold = true;
          break;
        }
      }
      if (!isInsideBold) {
        italicMatches.push({
          start: match.index,
          end: match.index + match[0].length,
          content: content,
          type: 'italic'
        });
      }
    }

    // Process strikethrough
    const strikethroughRegex = new RegExp(patterns.strikethrough);
    const strikethroughMatches = [];
    while ((match = strikethroughRegex.exec(processedText)) !== null) {
      strikethroughMatches.push({
        start: match.index,
        end: match.index + match[0].length,
        content: match[1],
        type: 'strikethrough'
      });
    }

    // Process document mentions
    const mentionRegex = new RegExp(patterns.mention);
    const mentionMatches = [];
    while ((match = mentionRegex.exec(processedText)) !== null) {
      mentionMatches.push({
        start: match.index,
        end: match.index + match[0].length,
        content: match[1], // Document name without @
        type: 'mention'
      });
    }

    // Process document links
    const docLinkRegex = new RegExp(patterns.docLink);
    const docLinkMatches = [];
    while ((match = docLinkRegex.exec(processedText)) !== null) {
      docLinkMatches.push({
        start: match.index,
        end: match.index + match[0].length,
        content: match[1],
        type: 'docLink'
      });
    }

    // Process tags - extract but show only the text content
    const tagRegex = new RegExp(patterns.tag);
    const tagMatches = [];
    while ((match = tagRegex.exec(processedText)) !== null) {
      tagMatches.push({
        start: match.index,
        end: match.index + match[0].length,
        tagName: match[1],
        content: match[2], // This is the actual text to display
        type: 'tag'
      });
    }

    // Process images
    const imageRegex = new RegExp(patterns.image);
    const imageMatches = [];
    while ((match = imageRegex.exec(processedText)) !== null) {
      // Check if it's a base64 image and shorten the match for display
      const src = match[2];
      const isBase64 = src.startsWith('data:image');
      
      imageMatches.push({
        start: match.index,
        end: match.index + match[0].length,
        alt: match[1],
        src: match[2],
        type: 'image',
        isBase64
      });
    }

    // Process markdown links
    const linkRegex = new RegExp(patterns.link);
    const linkMatches = [];
    while ((match = linkRegex.exec(processedText)) !== null) {
      linkMatches.push({
        start: match.index,
        end: match.index + match[0].length,
        text: match[1],
        url: match[2],
        type: 'link'
      });
    }

    // Process raw URLs
    const rawUrlRegex = new RegExp(patterns.rawUrl);
    const rawUrlMatches = [];
    while ((match = rawUrlRegex.exec(processedText)) !== null) {
      const url = match[0];
      // Check if this URL is already part of a markdown link
      let isInsideLink = false;
      for (const linkMatch of linkMatches) {
        if (match.index >= linkMatch.start && match.index <= linkMatch.end) {
          isInsideLink = true;
          break;
        }
      }
      if (!isInsideLink) {
        rawUrlMatches.push({
          start: match.index,
          end: match.index + match[0].length,
          url: url.startsWith('www.') ? `https://${url}` : url,
          displayUrl: url,
          type: 'rawUrl'
        });
      }
    }

    // Combine and sort all matches
    const allMatches = [...boldMatches, ...italicMatches, ...strikethroughMatches, ...mentionMatches, ...docLinkMatches, ...tagMatches, ...imageMatches, ...linkMatches, ...rawUrlMatches].sort((a, b) => a.start - b.start);

    // Build elements
    allMatches.forEach((match, matchIndex) => {
      // Add text before match
      if (match.start > currentIndex) {
        elements.push(processedText.slice(currentIndex, match.start));
      }

      // Add formatted element
      if (match.type === 'bold') {
        elements.push(
          <strong key={`bold-${segmentIndex}-${matchIndex}`} className="font-semibold text-text-primary">
            {match.content}
          </strong>
        );
      } else if (match.type === 'italic') {
        elements.push(
          <em key={`italic-${segmentIndex}-${matchIndex}`} className="italic">
            {match.content}
          </em>
        );
      } else if (match.type === 'strikethrough') {
        elements.push(
          <del key={`strike-${segmentIndex}-${matchIndex}`} className="line-through opacity-60">
            {match.content}
          </del>
        );
      } else if (match.type === 'mention') {
        elements.push(
          <button
            key={`mention-${segmentIndex}-${matchIndex}`}
            className="text-blue-400 hover:text-blue-300 font-medium cursor-pointer transition-colors
                       hover:bg-blue-400/10 px-1 rounded"
            onClick={(e) => {
              e.stopPropagation();
              // This will be handled by the parent component - same as document links
              if (window.handleDocumentLink) {
                window.handleDocumentLink(match.content);
              }
            }}
          >
            @{match.content}
          </button>
        );
      } else if (match.type === 'docLink') {
        elements.push(
          <button
            key={`doclink-${segmentIndex}-${matchIndex}`}
            className="text-accent-green hover:text-accent-green/80 underline decoration-dotted 
                       underline-offset-2 cursor-pointer transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              // This will be handled by the parent component
              if (window.handleDocumentLink) {
                window.handleDocumentLink(match.content);
              }
            }}
          >
            {match.content}
          </button>
        );
      } else if (match.type === 'tag') {
        // For tags, we only show the content text, not the tag syntax
        elements.push(
          <span key={`tag-${segmentIndex}-${matchIndex}`} className="text-text-primary">
            {match.content}
          </span>
        );
      } else if (match.type === 'image') {
        elements.push(
          <InlineImage
            key={`image-${segmentIndex}-${matchIndex}`}
            src={match.src}
            alt={match.alt}
            className="mx-1"
          />
        );
      } else if (match.type === 'link') {
        elements.push(
          <a
            key={`link-${segmentIndex}-${matchIndex}`}
            href={match.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-green hover:text-accent-green/80 underline decoration-1 
                       underline-offset-2 transition-colors inline-flex items-center gap-1"
            style={{ wordBreak: 'break-all' }}
            onClick={(e) => e.stopPropagation()}
          >
            {match.text}
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        );
      } else if (match.type === 'rawUrl') {
        elements.push(
          <a
            key={`rawurl-${segmentIndex}-${matchIndex}`}
            href={match.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-green hover:text-accent-green/80 underline decoration-1 
                       underline-offset-2 transition-colors inline-flex items-center gap-1"
            style={{ wordBreak: 'break-all' }}
            onClick={(e) => e.stopPropagation()}
          >
            {match.displayUrl}
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        );
      }

      currentIndex = match.end;
    });

    // Add remaining text
    if (currentIndex < processedText.length) {
      elements.push(processedText.slice(currentIndex));
    }

    return elements.length > 0 ? elements : processedText;
  });

  return <>{processedSegments}</>;
}

// Check if text starts with markdown heading syntax
export function detectHeadingMarkdown(text) {
  const headingMatch = text.match(/^(#{1,3})\s+(.*)$/);
  if (headingMatch) {
    const level = headingMatch[1].length;
    const content = headingMatch[2];
    return { level, content };
  }
  return null;
}

// Process line breaks and list items
export function processLineBreaksAndLists(text) {
  const lines = text.split('\n');
  const elements = [];
  
  lines.forEach((line, index) => {
    // Check for list items
    const unorderedListMatch = line.match(/^(\s*)([-*+])\s+(.*)$/);
    const orderedListMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/);
    
    if (unorderedListMatch) {
      const [, indent, , content] = unorderedListMatch;
      const indentLevel = indent.length / 2;
      elements.push(
        <div key={index} style={{ paddingLeft: `${indentLevel * 1.5}rem` }} className="flex items-start">
          <span className="text-text-secondary mr-2">•</span>
          <span>{parseMarkdown(content)}</span>
        </div>
      );
    } else if (orderedListMatch) {
      const [, indent, number, content] = orderedListMatch;
      const indentLevel = indent.length / 2;
      elements.push(
        <div key={index} style={{ paddingLeft: `${indentLevel * 1.5}rem` }} className="flex items-start">
          <span className="text-text-secondary mr-2">{number}.</span>
          <span>{parseMarkdown(content)}</span>
        </div>
      );
    } else if (line.trim() === '') {
      // Empty line
      elements.push(<div key={index} className="h-4" />);
    } else {
      // Regular line - preserve leading whitespace
      const leadingWhitespace = line.match(/^(\s*)/)[1];
      const content = line.trimStart();
      
      if (leadingWhitespace.length > 0) {
        // Preserve indentation (both spaces and tabs)
        elements.push(
          <div key={index} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
            <span style={{ whiteSpace: 'pre' }}>{leadingWhitespace}</span>
            {parseMarkdown(content)}
          </div>
        );
      } else {
        elements.push(<div key={index} style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>{parseMarkdown(line)}</div>);
      }
    }
  });
  
  return elements;
}

// Extract tags from content - returns array of unique tag names
export function extractTagsFromContent(content) {
  if (!content) return [];
  
  const tagPattern = /#(\w+)\[([^\]]+)\]/g;
  const tags = new Set();
  let match;
  
  while ((match = tagPattern.exec(content)) !== null) {
    tags.add(match[1]);
  }
  
  return Array.from(tags);
}
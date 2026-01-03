import React, { useState, useRef, useEffect, memo, useCallback } from 'react';
import TipTapEditor from './TipTapEditor';
import { markdownToHtml, htmlToMarkdown } from '@/shared/lib';
import { extractTagsFromContent } from '@/shared/lib';
import { uploadImageToSupabase, compressImage } from '@/shared/lib';
import { useAuth } from '@/app/providers';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useAnalytics } from '@/features/analytics';

/**
 * TextBlock - TipTap-based WYSIWYG text editor
 *
 * Features:
 * - Seamless editing (always editable, no mode switching)
 * - Live markdown preview (WYSIWYG)
 * - Keyboard shortcuts (Cmd+B, Cmd+I, etc.)
 * - Slash commands for block conversion
 * - Image paste support
 * - Collapsible long content
 */
function TextBlock({ block, onUpdate, onConvert, onAddBelow, allBlocks }) {
  const { user } = useAuth();
  const { trackEvent } = useAnalytics();

  // State
  const [content, setContent] = useState(block.content || '');
  const [htmlContent, setHtmlContent] = useState(() => markdownToHtml(block.content || ''));
  const [hasContentChanged, setHasContentChanged] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(block.metadata?.isCollapsed ?? false);
  const [isFocused, setIsFocused] = useState(false);

  // Refs
  const isMountedRef = useRef(false);
  const saveTimeoutRef = useRef(null);
  const containerRef = useRef(null);

  // Constants
  const MAX_LINES_BEFORE_COLLAPSE = 15;

  // Performance logging
  useEffect(() => {
    console.log(`📝 TextBlock ${block.id} rendered at ${new Date().toISOString()}`);
  }, [block.id]);

  // Track mount status
  useEffect(() => {
    const timer = setTimeout(() => {
      isMountedRef.current = true;
    }, 0);
    return () => {
      clearTimeout(timer);
      isMountedRef.current = false;
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Sync content from block prop
  useEffect(() => {
    if (block.content !== content) {
      setContent(block.content || '');
      setHtmlContent(markdownToHtml(block.content || ''));
    }
  }, [block.content]);

  // Handle save
  const handleSave = useCallback(() => {
    if (!hasContentChanged) {
      console.log('[TEXTBLOCK-SAVE-DEBUG] Skipping save - no content change');
      return;
    }

    const extractedTags = extractTagsFromContent(content);

    console.log('[TEXTBLOCK-SAVE-DEBUG] Saving:', {
      blockId: block.id?.substring(0, 8),
      contentLength: content?.length,
      tags: extractedTags
    });

    // Track tag usage
    const previousTags = block.tags || [];
    if (extractedTags.length > 0 && extractedTags.length !== previousTags.length) {
      trackEvent('text_block_tagged', {
        tag_count: extractedTags.length,
        tags_added: extractedTags.length - previousTags.length
      });
    }

    onUpdate(block.id, {
      content: content,
      tags: extractedTags,
      isNew: undefined,
      metadata: { ...block.metadata, isCollapsed }
    });

    setHasContentChanged(false);
  }, [content, hasContentChanged, block.id, block.tags, block.metadata, isCollapsed, onUpdate, trackEvent]);

  // Handle TipTap content updates
  const handleEditorUpdate = useCallback((html) => {
    const markdown = htmlToMarkdown(html);

    // Check for slash commands
    const slashMatch = markdown.match(/^\/(\w+)$/m) || markdown.match(/\n\/(\w+)$/);
    if (slashMatch) {
      const command = slashMatch[1].toLowerCase();
      const slashCommands = {
        'code': 'code',
        'table': 'table',
        'ai': 'ai',
        'todo': 'todo',
        'image': 'image',
        'heading': 'heading',
        'h1': 'heading',
        'h2': 'heading',
        'h3': 'heading',
      };

      if (slashCommands[command] && onConvert) {
        // Remove the slash command from content
        const cleanContent = markdown.replace(/\n?\/\w+$/, '').trim();
        if (cleanContent) {
          onUpdate(block.id, { content: cleanContent });
        }

        // Convert to new block type
        if (command === 'h1' || command === 'h2' || command === 'h3') {
          const level = command === 'h1' ? 1 : command === 'h2' ? 2 : 3;
          onConvert('heading', { level, content: '' });
        } else {
          onConvert(slashCommands[command]);
        }
        return;
      }
    }

    setContent(markdown);
    setHtmlContent(html);
    setHasContentChanged(true);
  }, [block.id, onUpdate, onConvert]);

  // Handle blur - save content
  const handleEditorBlur = useCallback((html) => {
    setIsFocused(false);
    const markdown = htmlToMarkdown(html);
    setContent(markdown);

    // Debounce save slightly to allow for click-to-other-element
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      if (hasContentChanged) {
        handleSave();
      }
    }, 100);
  }, [hasContentChanged, handleSave]);

  // Handle focus
  const handleEditorFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  // Handle image paste
  const handlePaste = useCallback(async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();

        const file = item.getAsFile();
        if (!file || !user) return;

        try {
          // Compress image if needed
          let imageToUpload = file;
          if (file.size > 100 * 1024) {
            imageToUpload = await compressImage(file, 1920, 0.85);
          }

          // Upload to Supabase
          const { url } = await uploadImageToSupabase(imageToUpload, user.id);

          // Create alt text
          const timestamp = new Date().toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
          const altText = `Image pasted at ${timestamp}`;

          // Add image block below
          if (onAddBelow) {
            onAddBelow({
              type: 'image',
              images: [{
                id: crypto.randomUUID(),
                url: url,
                alt: altText,
                size: imageToUpload.size,
                dimensions: { width: 0, height: 0 }
              }],
              createdAt: new Date().toISOString(),
              content: ''
            });
          }
        } catch (error) {
          console.error('Failed to upload image:', error);
        }
        return;
      }
    }
  }, [user, onAddBelow]);

  // Handle collapse state changes
  useEffect(() => {
    const blockIsCollapsed = block.metadata?.isCollapsed ?? false;
    if (isMountedRef.current && blockIsCollapsed !== isCollapsed) {
      onUpdate(block.id, {
        metadata: { ...block.metadata, isCollapsed }
      });
    }
  }, [isCollapsed, block.id, block.metadata, onUpdate]);

  // Check if content is long enough to show collapse
  const lines = content?.split('\n') || [];
  const isLongContent = lines.length > MAX_LINES_BEFORE_COLLAPSE;

  // Tags display
  const tags = extractTagsFromContent(content);

  return (
    <div
      ref={containerRef}
      className="relative group"
      onPaste={handlePaste}
    >
      {/* Collapse button for long content */}
      {isLongContent && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsCollapsed(!isCollapsed);
          }}
          className="absolute right-2 top-2 p-2 bg-dark-primary/80 border border-dark-secondary/50
                     hover:bg-dark-primary hover:border-accent-green/50 rounded-lg
                     transition-all z-10 flex items-center gap-1.5 shadow-lg"
          title={isCollapsed ? "Expand text" : "Collapse text"}
        >
          {isCollapsed ?
            <ChevronDown size={16} className="text-accent-green" /> :
            <ChevronUp size={16} className="text-accent-green" />
          }
          <span className="text-xs text-text-secondary font-medium">
            {isCollapsed ? 'Expand' : 'Collapse'}
          </span>
        </button>
      )}

      {/* TipTap Editor - always visible, seamless editing */}
      <div className={`
        transition-all duration-200
        ${isCollapsed ? 'max-h-[200px] overflow-hidden relative' : ''}
      `}>
        <TipTapEditor
          content={htmlContent}
          onUpdate={handleEditorUpdate}
          onBlur={handleEditorBlur}
          onFocus={handleEditorFocus}
          placeholder="Start writing..."
          autoFocus={block.isNew}
          className={isCollapsed ? 'pointer-events-none' : ''}
        />

        {/* Collapsed fade overlay */}
        {isCollapsed && (
          <div
            className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-dark-primary to-transparent
                       cursor-pointer flex items-end justify-center pb-2"
            onClick={() => setIsCollapsed(false)}
          >
            <span className="text-text-secondary/50 text-sm hover:text-text-secondary transition-colors">
              Click to expand ({lines.length - MAX_LINES_BEFORE_COLLAPSE}+ more lines)
            </span>
          </div>
        )}
      </div>

      {/* Tags display */}
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-dark-secondary/30">
          {tags.map((tag, index) => (
            <span
              key={index}
              className="text-xs bg-accent-green/20 text-accent-green px-2 py-1 rounded"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// Memoize to prevent unnecessary re-renders
export default memo(TextBlock, (prevProps, nextProps) => {
  return (
    prevProps.block.id === nextProps.block.id &&
    prevProps.block.content === nextProps.block.content &&
    prevProps.block.isNew === nextProps.block.isNew &&
    prevProps.block.metadata?.isCollapsed === nextProps.block.metadata?.isCollapsed
  );
});

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Typography from '@tiptap/extension-typography';
import { useEffect, useCallback, memo } from 'react';

/**
 * TipTap WYSIWYG Editor Component
 *
 * A seamless, live-preview markdown editor that makes writing feel natural.
 * Built on ProseMirror via TipTap for battle-tested reliability.
 */
function TipTapEditor({
  content = '',
  onUpdate,
  onBlur,
  onFocus,
  placeholder = 'Start writing...',
  editable = true,
  className = '',
  autoFocus = false,
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable heading - we have HeadingBlock for that
        heading: false,
        // Disable codeBlock - we have CodeBlock for that
        codeBlock: false,
        // Enable everything else
        bold: true,
        italic: true,
        strike: true,
        code: true,
        bulletList: true,
        orderedList: true,
        listItem: true,
        blockquote: true,
        horizontalRule: true,
        hardBreak: true,
        paragraph: true,
        text: true,
        history: true,
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
      Link.configure({
        openOnClick: true,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          class: 'tiptap-link',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      Underline,
      Typography.configure({
        // Smart typography: quotes, dashes, ellipsis
        oneHalf: true,
        oneQuarter: true,
        threeQuarters: true,
      }),
    ],
    content,
    editable,
    autofocus: autoFocus ? 'end' : false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onUpdate?.(html);
    },
    onBlur: ({ editor, event }) => {
      onBlur?.(editor.getHTML(), event);
    },
    onFocus: ({ editor, event }) => {
      onFocus?.(event);
    },
    editorProps: {
      attributes: {
        class: `tiptap-editor ${className}`.trim(),
        spellcheck: 'false',
      },
      // Handle paste events
      handlePaste: (view, event) => {
        // Let default handling work for text
        // Image paste will be handled by parent component
        return false;
      },
    },
  });

  // Update content when prop changes (from external source)
  useEffect(() => {
    if (editor && content !== undefined) {
      const currentContent = editor.getHTML();
      // Only update if content is actually different
      // Avoid the empty paragraph comparison issue
      const normalizedCurrent = currentContent === '<p></p>' ? '' : currentContent;
      const normalizedNew = content === '<p></p>' ? '' : content;

      if (normalizedNew !== normalizedCurrent) {
        editor.commands.setContent(content || '');
      }
    }
  }, [content, editor]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      editor?.destroy();
    };
  }, [editor]);

  // Expose editor methods via ref if needed
  // For now, just render the editor content
  if (!editor) {
    return null;
  }

  return <EditorContent editor={editor} />;
}

// Memoize to prevent unnecessary re-renders
export default memo(TipTapEditor, (prevProps, nextProps) => {
  return (
    prevProps.content === nextProps.content &&
    prevProps.placeholder === nextProps.placeholder &&
    prevProps.editable === nextProps.editable &&
    prevProps.className === nextProps.className
  );
});

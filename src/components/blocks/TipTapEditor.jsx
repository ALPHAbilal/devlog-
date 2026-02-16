import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Typography from '@tiptap/extension-typography';
import { useEffect, useRef, memo } from 'react';

/**
 * TipTap WYSIWYG Editor Component
 *
 * A seamless, live-preview markdown editor that makes writing feel natural.
 * Built on ProseMirror via TipTap for battle-tested reliability.
 *
 * Uses refs for callback props so useEditor always calls the latest versions,
 * avoiding stale closure issues (critical for paste + blur save flow).
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
  // Refs to always hold the latest callback props
  const onUpdateRef = useRef(onUpdate);
  const onBlurRef = useRef(onBlur);
  const onFocusRef = useRef(onFocus);

  // Keep refs in sync with latest props
  useEffect(() => { onUpdateRef.current = onUpdate; }, [onUpdate]);
  useEffect(() => { onBlurRef.current = onBlur; }, [onBlur]);
  useEffect(() => { onFocusRef.current = onFocus; }, [onFocus]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
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
      console.log('[PASTE-DEBUG-2] TipTap onUpdate fired', {
        htmlLength: html?.length || 0,
        htmlPreview: html?.substring(0, 150),
        htmlEnd: html?.substring(Math.max(0, (html?.length || 0) - 100)),
      });
      onUpdateRef.current?.(html);
    },
    onBlur: ({ editor, event }) => {
      onBlurRef.current?.(editor.getHTML(), event);
    },
    onFocus: ({ editor, event }) => {
      onFocusRef.current?.(event);
    },
    editorProps: {
      attributes: {
        class: `tiptap-editor ${className}`.trim(),
        spellcheck: 'false',
      },
      handlePaste: (view, event) => {
        const clipboardData = event.clipboardData;
        const textData = clipboardData?.getData('text/plain');
        const htmlData = clipboardData?.getData('text/html');
        console.log('[PASTE-DEBUG-1] TipTap handlePaste fired', {
          hasTextData: !!textData,
          textLength: textData?.length || 0,
          textPreview: textData?.substring(0, 100),
          hasHtmlData: !!htmlData,
          htmlLength: htmlData?.length || 0,
          types: Array.from(clipboardData?.types || []),
        });
        if (textData?.length > 5000) {
          console.warn('[PASTE-DEBUG-1] ⚠️ LARGE PASTE DETECTED:', textData.length, 'chars');
        }
        return false;
      },
    },
  });

  // Update content when prop changes (from external source)
  useEffect(() => {
    if (editor && content !== undefined) {
      const currentContent = editor.getHTML();
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

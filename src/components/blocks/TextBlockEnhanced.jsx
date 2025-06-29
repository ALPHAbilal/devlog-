import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { uploadImageToSupabase, dataUrlToBlob, compressImage } from '../../utils/imageUploader';
import parseMarkdown from '../../utils/parseMarkdown';

export default function TextBlockEnhanced({ block, onUpdate, isFocused, onFocus }) {
  const [content, setContent] = useState(block.content || '');
  const [isEditing, setIsEditing] = useState(block.isNew || false);
  const [showPreview, setShowPreview] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(new Set());
  const [uploadProgress, setUploadProgress] = useState({});
  const textareaRef = useRef(null);
  const { user } = useAuth();

  // Store images temporarily during editing
  const [imageMap, setImageMap] = useState({});
  const [displayContent, setDisplayContent] = useState(content);

  useEffect(() => {
    if (block.isNew && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [block.isNew]);

  useEffect(() => {
    if (isFocused === true && !isEditing) {
      setIsEditing(true);
    } else if (isFocused === false && isEditing) {
      handleSave();
    }
  }, [isFocused]);

  // Replace image URLs with placeholders for editing
  useEffect(() => {
    if (isEditing) {
      let editContent = content;
      const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
      let imageIndex = 0;
      const newImageMap = {};

      editContent = editContent.replace(imgRegex, (match, alt, url) => {
        const placeholder = `📷[image-${imageIndex}]`;
        newImageMap[placeholder] = { alt, url };
        imageIndex++;
        return placeholder;
      });

      setImageMap(newImageMap);
      setDisplayContent(editContent);
    }
  }, [content, isEditing]);

  const handlePaste = async (e) => {
    const items = Array.from(e.clipboardData.items);
    const imageItems = items.filter(item => item.type.startsWith('image/'));

    if (imageItems.length > 0) {
      e.preventDefault();
      
      for (const item of imageItems) {
        const file = item.getAsFile();
        if (file) {
          await handleImageUpload(file);
        }
      }
    }
  };

  const handleImageUpload = async (file) => {
    const tempId = crypto.randomUUID();
    const placeholder = `📷[uploading-${tempId}]`;
    
    try {
      // Add placeholder immediately
      const cursorPos = textareaRef.current?.selectionStart || displayContent.length;
      const newContent = 
        displayContent.slice(0, cursorPos) + 
        `\n${placeholder}\n` + 
        displayContent.slice(cursorPos);
      
      setDisplayContent(newContent);
      setUploadingImages(prev => new Set(prev).add(tempId));
      setUploadProgress(prev => ({ ...prev, [tempId]: 0 }));

      // Compress image if needed
      let imageToUpload = file;
      if (file.size > 1024 * 1024) { // If larger than 1MB
        setUploadProgress(prev => ({ ...prev, [tempId]: 10 }));
        imageToUpload = await compressImage(file);
      }

      setUploadProgress(prev => ({ ...prev, [tempId]: 30 }));

      // Upload to Supabase Storage
      const { url, path } = await uploadImageToSupabase(imageToUpload, user.id);
      
      setUploadProgress(prev => ({ ...prev, [tempId]: 90 }));

      // Replace placeholder with actual image
      const imageMarkdown = `![Image](${url})`;
      const finalContent = newContent.replace(placeholder, imageMarkdown);
      
      setDisplayContent(finalContent);
      setUploadProgress(prev => ({ ...prev, [tempId]: 100 }));

      // Store in imageMap
      const imageIndex = Object.keys(imageMap).length;
      const imagePlaceholder = `📷[image-${imageIndex}]`;
      setImageMap(prev => ({
        ...prev,
        [imagePlaceholder]: { alt: 'Image', url, path }
      }));

      // Auto-save after successful upload
      setTimeout(() => {
        const restoredContent = restoreImagesInContent(finalContent);
        onUpdate(block.id, { content: restoredContent });
      }, 100);

    } catch (error) {
      console.error('Image upload failed:', error);
      // Remove placeholder on error
      setDisplayContent(prev => prev.replace(`\n${placeholder}\n`, ''));
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploadingImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(tempId);
        return newSet;
      });
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[tempId];
        return newProgress;
      });
    }
  };

  const restoreImagesInContent = (editContent) => {
    let restoredContent = editContent;
    
    // First restore existing images from imageMap
    Object.entries(imageMap).forEach(([placeholder, { alt, url }]) => {
      restoredContent = restoredContent.replace(placeholder, `![${alt}](${url})`);
    });

    // Then handle any new images that were uploaded
    const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    restoredContent = restoredContent.replace(imgRegex, (match) => match);

    return restoredContent;
  };

  const handleSave = () => {
    const restoredContent = restoreImagesInContent(displayContent);
    setContent(restoredContent);
    onUpdate(block.id, { content: restoredContent });
    setIsEditing(false);
    setShowPreview(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleSave();
      if (onFocus) onFocus(null);
    }
    
    // Tab handling for lists
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const newContent = displayContent.substring(0, start) + '  ' + displayContent.substring(end);
      setDisplayContent(newContent);
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 2;
      }, 0);
    }
  };

  const handleDoubleClick = () => {
    if (!isEditing) {
      setIsEditing(true);
      if (onFocus) onFocus(block.id);
    }
  };

  // Render upload progress indicators
  const renderUploadProgress = () => {
    if (uploadingImages.size === 0) return null;

    return (
      <div className="absolute top-2 right-2 space-y-2">
        {Array.from(uploadingImages).map(id => (
          <div key={id} className="bg-dark-primary/90 backdrop-blur rounded-lg p-2 
                                   border border-accent-green/30 min-w-[200px]">
            <div className="text-xs text-text-secondary mb-1">Uploading image...</div>
            <div className="w-full bg-dark-secondary rounded-full h-2">
              <div 
                className="bg-accent-green h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress[id] || 0}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (isEditing) {
    return (
      <div className="relative group">
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="text-xs text-text-secondary hover:text-text-primary"
          >
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>
          <button
            onClick={handleSave}
            className="text-xs text-accent-green hover:text-accent-green-hover"
          >
            Save (Esc)
          </button>
          {uploadingImages.size > 0 && (
            <span className="text-xs text-accent-yellow">
              Uploading {uploadingImages.size} image{uploadingImages.size > 1 ? 's' : ''}...
            </span>
          )}
        </div>
        
        <div className={showPreview ? 'grid grid-cols-2 gap-4' : ''}>
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={displayContent}
              onChange={(e) => setDisplayContent(e.target.value)}
              onBlur={() => {
                if (!uploadingImages.size) {
                  handleSave();
                }
              }}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              className="w-full bg-dark-secondary/50 text-text-primary rounded-lg p-4
                       border border-dark-secondary focus:border-accent-green
                       focus:outline-none resize-none transition-all
                       min-h-[100px] font-mono text-sm"
              style={{ 
                minHeight: `${Math.max(100, (displayContent.split('\n').length + 1) * 24)}px` 
              }}
              placeholder="Type your text here... Paste images directly!"
            />
            {renderUploadProgress()}
          </div>
          
          {showPreview && (
            <div className="prose prose-invert max-w-none">
              {parseMarkdown(restoreImagesInContent(displayContent))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div 
      onDoubleClick={handleDoubleClick}
      className="cursor-text hover:bg-dark-secondary/30 rounded-lg p-2 -m-2 transition-colors relative"
    >
      <div className="prose prose-invert max-w-none">
        {content ? parseMarkdown(content) : (
          <p className="text-text-secondary italic">Click to add text...</p>
        )}
      </div>
      {uploadingImages.size > 0 && renderUploadProgress()}
    </div>
  );
}
import { useState, useRef, memo } from 'react'; // ✅ Add memo import
import { Image as ImageIcon, X, Upload, Edit2 } from 'lucide-react';
import InlineImage from '../InlineImage';
import { uploadImageToSupabase, compressImage } from '@/shared/lib';
import { useAuth } from '@/app/providers';

function InlineImageBlock({ block, onUpdate, onDelete, isFocused }) { // ✅ Remove export default
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [altText, setAltText] = useState(block.alt || '');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Handle file selection for replacement
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      return;
    }

    try {
      setIsUploading(true);
      
      // Compress image
      let imageToUpload = file;
      if (file.size > 100 * 1024) { // Compress if > 100KB
        imageToUpload = await compressImage(file, 1920, 0.85);
      }

      // Upload to Supabase
      const { url } = await uploadImageToSupabase(imageToUpload, user.id);
      
      // Update block with new URL
      onUpdate(block.id, { url, alt: altText });
      setIsUploading(false);
    } catch (error) {
      console.error('Failed to upload image:', error);
      setIsUploading(false);
    }
  };

  // Handle paste event
  const handlePaste = async (e) => {
    const items = e.clipboardData?.items;
    if (!items || !user) return;

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          handleFileSelect({ target: { files: [file] } });
        }
        break;
      }
    }
  };

  // Save alt text
  const handleSaveAlt = () => {
    onUpdate(block.id, { alt: altText });
    setIsEditing(false);
  };

  // If no URL yet, show upload interface
  if (!block.url) {
    return (
      <div 
        className={`inline-flex items-center gap-2 px-3 py-1.5 
                   bg-dark-secondary/30 rounded-lg border border-dashed 
                   ${isFocused ? 'border-accent-green' : 'border-dark-secondary/50'}
                   hover:border-accent-green/50 transition-all cursor-pointer
                   align-middle my-1`}
        onClick={() => fileInputRef.current?.click()}
        onPaste={handlePaste}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {isUploading ? (
          <>
            <div className="w-4 h-4 border-2 border-text-secondary/20 
                          border-t-accent-green rounded-full animate-spin" />
            <span className="text-xs text-text-secondary">Uploading...</span>
          </>
        ) : (
          <>
            <ImageIcon size={16} className="text-text-secondary" />
            <span className="text-xs text-text-secondary">
              Click or paste image
            </span>
          </>
        )}
      </div>
    );
  }

  // Display image inline
  return (
    <span className={`inline-block align-middle my-1 group relative
                     ${isFocused ? 'ring-2 ring-accent-green/30 rounded' : ''}`}>
      {/* Image display */}
      <span className="inline-block relative">
        <InlineImage 
          src={block.url} 
          alt={altText || 'Inline image'} 
          className="inline-block"
        />
        
        {/* Edit controls on hover */}
        {isFocused && (
          <span className="absolute -top-2 -right-2 flex gap-1 opacity-0 
                         group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setIsEditing(true)}
              className="p-1 bg-dark-secondary/90 hover:bg-dark-secondary 
                       rounded text-text-secondary hover:text-accent-green 
                       transition-all"
              title="Edit alt text"
            >
              <Edit2 size={12} />
            </button>
            <button
              onClick={() => onDelete(block.id)}
              className="p-1 bg-dark-secondary/90 hover:bg-red-500/20 
                       rounded text-text-secondary hover:text-red-400 
                       transition-all"
              title="Delete image"
            >
              <X size={12} />
            </button>
          </span>
        )}
      </span>

      {/* Alt text editor */}
      {isEditing && (
        <div className="absolute top-full left-0 mt-2 z-50 
                      bg-dark-secondary rounded-lg shadow-lg p-3 
                      border border-dark-secondary/50">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveAlt();
                if (e.key === 'Escape') setIsEditing(false);
              }}
              placeholder="Alt text..."
              className="px-2 py-1 bg-dark-primary/50 rounded text-sm 
                       text-text-primary placeholder-text-secondary/50
                       focus:outline-none focus:ring-1 focus:ring-accent-green"
              autoFocus
            />
            <button
              onClick={handleSaveAlt}
              className="px-2 py-1 bg-accent-green/20 hover:bg-accent-green/30 
                       rounded text-xs text-accent-green transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Hidden file input for replacement */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </span>
  );
}

// Memoize InlineImageBlock to prevent unnecessary re-renders
export default memo(InlineImageBlock, (prevProps, nextProps) => {
  const willPreventRerender =
    prevProps.block.id === nextProps.block.id &&
    prevProps.block.url === nextProps.block.url &&
    prevProps.block.alt === nextProps.block.alt &&
    prevProps.isFocused === nextProps.isFocused;

  // Debug log to verify memo is working (remove after verification)
  console.log('InlineImageBlock memo:', willPreventRerender ? 'PREVENTED' : 'ALLOWED');

  return willPreventRerender;
});
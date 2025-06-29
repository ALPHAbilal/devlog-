import { useState, useRef } from 'react';
import { Upload, X, Maximize2, Download, Trash2, Image as ImageIcon } from 'lucide-react';
import { uploadImageToSupabase, compressImage } from '../../utils/imageUploader';
import { useAuth } from '../../contexts/AuthContextOptimized';
import InlineImage from '../InlineImage';

export default function ImageBlock({ block, onUpdate, onDelete, isFocused }) {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // Handle file selection
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image size must be less than 10MB');
      return;
    }

    setError(null);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Compress image if needed
      let imageToUpload = file;
      setUploadProgress(20);
      
      if (file.size > 1024 * 1024) { // Compress if > 1MB
        console.log('Compressing image...');
        imageToUpload = await compressImage(file, 1920, 0.85);
        setUploadProgress(40);
      }

      // Upload to Supabase Storage
      console.log('Uploading to Supabase Storage...');
      const { url, path } = await uploadImageToSupabase(imageToUpload, user.id);
      setUploadProgress(80);

      // Update block with image info
      onUpdate(block.id, {
        url,
        storagePath: path,
        alt: block.alt || file.name,
        size: imageToUpload.size,
        dimensions: await getImageDimensions(imageToUpload)
      });

      setUploadProgress(100);
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
    } catch (err) {
      console.error('Upload failed:', err);
      setError(err.message || 'Failed to upload image');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Get image dimensions
  const getImageDimensions = (file) => {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({ width: img.width, height: img.height });
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({ width: 0, height: 0 });
      };
      
      img.src = url;
    });
  };

  // Handle paste
  const handlePaste = async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          // Create a synthetic event to reuse handleFileSelect
          handleFileSelect({ target: { files: [file] } });
        }
        break;
      }
    }
  };

  // Handle drag and drop
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleFileSelect({ target: { files: [file] } });
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Download image
  const handleDownload = async () => {
    if (!block.url) return;

    try {
      const response = await fetch(block.url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = block.alt || 'image.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
      setError('Failed to download image');
    }
  };

  // Update alt text
  const handleAltChange = (e) => {
    onUpdate(block.id, { alt: e.target.value });
  };

  return (
    <div 
      className={`relative rounded-lg border transition-all ${
        isFocused ? 'border-accent-green shadow-lg' : 'border-dark-secondary/50'
      }`}
      onPaste={handlePaste}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {!block.url ? (
        // Upload interface
        <div className="p-8">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {isUploading ? (
            // Upload progress
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-3 border-text-secondary/20 border-t-accent-green 
                              rounded-full animate-spin" />
              <div className="text-text-secondary">Uploading image...</div>
              <div className="w-full max-w-xs">
                <div className="h-2 bg-dark-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-accent-green transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            // Upload button
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex flex-col items-center gap-4 py-8 
                         text-text-secondary hover:text-text-primary
                         transition-all group"
            >
              <div className="p-4 bg-dark-secondary/50 rounded-lg 
                              group-hover:bg-dark-secondary transition-colors">
                <Upload size={32} />
              </div>
              <div className="text-center">
                <div className="font-medium">Click to upload image</div>
                <div className="text-sm text-text-secondary/60 mt-1">
                  or drag and drop • paste from clipboard
                </div>
                <div className="text-xs text-text-secondary/40 mt-2">
                  PNG, JPG, GIF up to 10MB
                </div>
              </div>
            </button>
          )}
          
          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 
                            rounded text-sm text-red-400">
              {error}
            </div>
          )}
        </div>
      ) : (
        // Image display
        <div className="relative group">
          <img
            src={block.url}
            alt={block.alt || 'Image'}
            className="w-full rounded-t-lg"
            loading="lazy"
          />
          
          {/* Hover controls */}
          <div className="absolute top-2 right-2 flex items-center gap-2 
                          opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleDownload}
              className="p-2 bg-dark-primary/90 rounded hover:bg-dark-primary 
                         text-text-secondary hover:text-text-primary transition-all"
              title="Download image"
            >
              <Download size={16} />
            </button>
            <button
              onClick={() => onDelete(block.id)}
              className="p-2 bg-dark-primary/90 rounded hover:bg-red-500/20 
                         text-text-secondary hover:text-red-400 transition-all"
              title="Delete block"
            >
              <Trash2 size={16} />
            </button>
          </div>
          
          {/* Alt text input */}
          <div className="p-3 bg-dark-secondary/30 rounded-b-lg">
            <input
              type="text"
              value={block.alt || ''}
              onChange={handleAltChange}
              placeholder="Add image description..."
              className="w-full px-3 py-2 bg-dark-primary/50 rounded 
                         text-sm text-text-primary placeholder-text-secondary/50
                         focus:outline-none focus:ring-2 focus:ring-accent-green/50"
            />
            
            {/* Image info */}
            {block.dimensions && (
              <div className="mt-2 flex items-center gap-4 text-xs text-text-secondary/60">
                <span>{block.dimensions.width} × {block.dimensions.height}</span>
                {block.size && (
                  <span>{(block.size / 1024).toFixed(1)} KB</span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
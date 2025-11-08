import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { Upload, X, Maximize2, Download, Trash2, Image as ImageIcon, Plus, Grid3x3, Move, Edit2, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { uploadImageToSupabase, compressImage } from '../../utils/imageUploader';
import { useAuth } from '../../contexts/AuthContextOptimized';
import InlineImage from '../InlineImage';
import ImageViewer from '../ImageViewer';

function ImageBlock({ block, onUpdate, onDelete, isFocused }) {
  const { user } = useAuth();
  const [images, setImages] = useState([]);
  
  // Performance monitoring
  useEffect(() => {
    console.log(`🌆 ImageBlock ${block.id} rendered at ${new Date().toISOString()}`);
  }, [block.id]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [editingImageId, setEditingImageId] = useState(null);
  const [editingAlt, setEditingAlt] = useState('');
  const [draggedImageId, setDraggedImageId] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const fileInputRef = useRef(null);
  
  // Initialize images array from block data
  useEffect(() => {
    if (block.images && Array.isArray(block.images)) {
      setImages(block.images);
    } else if (block.url) {
      // Convert legacy single image to array format
      setImages([{
        id: crypto.randomUUID(),
        url: block.url,
        storagePath: block.storagePath,
        alt: block.alt || '',
        size: block.size,
        dimensions: block.dimensions
      }]);
    }
  }, [block]);

  // Handle file selection (supports multiple files)
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || !user) return;

    // Validate all files
    const imageFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        setError(`${file.name} is not an image file`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError(`${file.name} is larger than 10MB`);
        return false;
      }
      return true;
    });
    
    if (imageFiles.length === 0) return;

    setError(null);
    setIsUploading(true);
    setUploadProgress(0);
    
    const newImages = [];
    const totalFiles = imageFiles.length;
    
    try {
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        setUploadProgress(Math.floor((i / totalFiles) * 100));
        
        // Compress image if needed
        let imageToUpload = file;
        if (file.size > 1024 * 1024) { // Compress if > 1MB
          console.log(`Compressing ${file.name}...`);
          imageToUpload = await compressImage(file, 1920, 0.85);
        }
        
        // Upload to Supabase Storage
        console.log(`Uploading ${file.name} to Supabase Storage...`);
        const { url, path } = await uploadImageToSupabase(imageToUpload, user.id);
        
        // Add to new images array
        newImages.push({
          id: crypto.randomUUID(),
          url,
          storagePath: path,
          alt: file.name,
          size: imageToUpload.size,
          dimensions: await getImageDimensions(imageToUpload)
        });
      }
      
      // Update block with all images
      const updatedImages = [...images, ...newImages];
      setImages(updatedImages);
      
      // Log image update for tracking
      console.log('[IMAGE-BLOCK] 📤 Upload complete - calling onUpdate:', {
        blockId: block.id.substring(0, 8) + '...',
        action: 'UPLOAD',
        imagesCount: updatedImages.length,
        newImagesCount: newImages.length,
        images: updatedImages.map(img => ({
          id: img.id?.substring(0, 8) + '...',
          url: img.url?.substring(0, 50) + '...',
          alt: img.alt,
          hasStoragePath: !!img.storagePath
        }))
      });
      
      onUpdate(block.id, { images: updatedImages });
      
      setUploadProgress(100);
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
    } catch (err) {
      console.error('Upload failed:', err);
      setError(err.message || 'Failed to upload images');
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

  // Download single image
  const handleDownload = async (image) => {
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = image.alt || 'image.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
      setError('Failed to download image');
    }
  };
  
  // Delete single image
  const handleDeleteImage = (imageId) => {
    const updatedImages = images.filter(img => img.id !== imageId);
    setImages(updatedImages);
    
    // Log image deletion for tracking
    console.log('[IMAGE-BLOCK] 🗑️ Delete image - calling onUpdate:', {
      blockId: block.id.substring(0, 8) + '...',
      action: 'DELETE',
      deletedImageId: imageId.substring(0, 8) + '...',
      remainingImagesCount: updatedImages.length,
      images: updatedImages.map(img => ({
        id: img.id?.substring(0, 8) + '...',
        url: img.url?.substring(0, 50) + '...'
      }))
    });
    
    onUpdate(block.id, { images: updatedImages });
    
    // If no images left, delete the entire block
    if (updatedImages.length === 0) {
      onDelete(block.id);
    }
  };

  // Update alt text for an image
  const handleAltChange = (imageId, newAlt) => {
    const updatedImages = images.map(img => 
      img.id === imageId ? { ...img, alt: newAlt } : img
    );
    setImages(updatedImages);
    
    // Log alt text update for tracking
    console.log('[IMAGE-BLOCK] ✏️ Alt text update - calling onUpdate:', {
      blockId: block.id.substring(0, 8) + '...',
      action: 'UPDATE_ALT',
      imageId: imageId.substring(0, 8) + '...',
      newAlt: newAlt,
      imagesCount: updatedImages.length
    });
    
    onUpdate(block.id, { images: updatedImages });
    setEditingImageId(null);
  };
  
  // Handle drag start
  const handleDragStart = (e, imageId) => {
    setDraggedImageId(imageId);
    e.dataTransfer.effectAllowed = 'move';
  };
  
  // Handle drop
  const handleImageDrop = (e, targetImageId) => {
    e.preventDefault();
    
    if (!draggedImageId || draggedImageId === targetImageId) return;
    
    const draggedIndex = images.findIndex(img => img.id === draggedImageId);
    const targetIndex = images.findIndex(img => img.id === targetImageId);
    
    const newImages = [...images];
    const [draggedImage] = newImages.splice(draggedIndex, 1);
    newImages.splice(targetIndex, 0, draggedImage);
    
    setImages(newImages);
    
    // Log reorder for tracking
    console.log('[IMAGE-BLOCK] 🔄 Reorder images - calling onUpdate:', {
      blockId: block.id.substring(0, 8) + '...',
      action: 'REORDER',
      fromIndex: draggedIndex,
      toIndex: targetIndex,
      imagesCount: newImages.length
    });
    
    onUpdate(block.id, { images: newImages });
    setDraggedImageId(null);
  };
  
  // Handle lightbox navigation
  const openLightbox = (image, index) => {
    setLightboxImage(image);
    setLightboxIndex(index);
  };
  
  const closeLightbox = () => {
    setLightboxImage(null);
  };
  
  const navigateLightbox = (direction) => {
    const newIndex = direction === 'next' 
      ? (lightboxIndex + 1) % images.length
      : (lightboxIndex - 1 + images.length) % images.length;
    setLightboxIndex(newIndex);
    setLightboxImage(images[newIndex]);
  };
  
  const handleNext = () => navigateLightbox('next');
  const handlePrev = () => navigateLightbox('prev');

  return (
    <div 
      className={`relative rounded-lg border transition-all ${
        isFocused ? 'border-accent-green shadow-lg' : 'border-dark-secondary/50'
      }`}
      onPaste={handlePaste}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {images.length === 0 ? (
        // Upload interface
        <div className="p-8">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {isUploading ? (
            // Upload progress
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-3 border-text-secondary/20 border-t-accent-green 
                              rounded-full animate-spin" />
              <div className="text-text-secondary">Uploading images...</div>
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
                <div className="font-medium">Click to upload images</div>
                <div className="text-sm text-text-secondary/60 mt-1">
                  or drag and drop • paste from clipboard
                </div>
                <div className="text-xs text-text-secondary/40 mt-2">
                  PNG, JPG, GIF up to 10MB • Multiple files supported
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
        // Images gallery
        <div className="p-4">
          {/* Gallery header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-text-secondary">
              <Grid3x3 size={16} />
              <span className="text-sm">
                {images.length} {images.length === 1 ? 'image' : 'images'}
              </span>
            </div>
            
            {/* Add more images button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-1.5 
                         bg-dark-secondary/50 hover:bg-dark-secondary 
                         rounded text-text-secondary hover:text-text-primary 
                         transition-all text-sm"
            >
              <Plus size={14} />
              <span>Add more</span>
            </button>
          </div>
          
          {/* Images grid */}
          <div className={`grid gap-4 ${
            images.length === 1 ? 'grid-cols-1' : 
            images.length === 2 ? 'grid-cols-2' : 
            'grid-cols-2 lg:grid-cols-3'
          }`}>
            {images.map((image, index) => (
              <div
                key={image.id}
                className={`relative group rounded-lg overflow-hidden 
                           bg-dark-secondary/30 ${
                  draggedImageId === image.id ? 'opacity-50' : ''
                }`}
                draggable
                onDragStart={(e) => handleDragStart(e, image.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleImageDrop(e, image.id)}
              >
                {/* Image with click handler */}
                <div 
                  className="relative w-full h-48 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    openLightbox(image, index);
                  }}
                >
                  <img
                    src={image.url}
                    alt={image.alt || `Image ${index + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                
                {/* Hover overlay - pointer-events-none so it doesn't block clicks */}
                <div className="absolute inset-0 bg-gradient-to-t from-dark-primary/80 
                               to-transparent opacity-0 group-hover:opacity-100 
                               transition-opacity pointer-events-none" />
                
                {/* Controls - higher z-index to be clickable */}
                <div className="absolute top-2 right-2 flex items-center gap-1 
                               opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button
                    onClick={() => handleDownload(image)}
                    className="p-1.5 bg-dark-primary/90 rounded hover:bg-dark-primary 
                             text-text-secondary hover:text-text-primary transition-all"
                    title="Download"
                  >
                    <Download size={14} />
                  </button>
                  <button
                    onClick={() => {
                      setEditingImageId(image.id);
                      setEditingAlt(image.alt || '');
                    }}
                    className="p-1.5 bg-dark-primary/90 rounded hover:bg-dark-primary 
                             text-text-secondary hover:text-accent-green transition-all"
                    title="Edit alt text"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteImage(image.id)}
                    className="p-1.5 bg-dark-primary/90 rounded hover:bg-red-500/20 
                             text-text-secondary hover:text-red-400 transition-all"
                    title="Delete"
                  >
                    <X size={14} />
                  </button>
                </div>
                
                {/* Drag indicator */}
                <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 
                               transition-opacity pointer-events-none">
                  <Move size={14} className="text-text-secondary/60" />
                </div>
                
                {/* Alt text display/edit - allow pointer events only when editing */}
                <div className={`absolute bottom-0 left-0 right-0 p-2 
                               bg-gradient-to-t from-dark-primary to-transparent
                               ${editingImageId === image.id ? 'z-20' : 'pointer-events-none'}`}>
                  {editingImageId === image.id ? (
                    <input
                      type="text"
                      value={editingAlt}
                      onChange={(e) => setEditingAlt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAltChange(image.id, editingAlt);
                        } else if (e.key === 'Escape') {
                          setEditingImageId(null);
                        }
                      }}
                      onBlur={() => handleAltChange(image.id, editingAlt)}
                      className="w-full px-2 py-1 bg-dark-primary/80 rounded text-xs 
                               text-text-primary placeholder-text-secondary/50
                               focus:outline-none focus:ring-1 focus:ring-accent-green"
                      placeholder="Alt text..."
                      autoFocus
                    />
                  ) : (
                    <p className="text-xs text-text-secondary/80 truncate">
                      {image.alt || `Image ${index + 1}`}
                    </p>
                  )}
                </div>
                
                {/* Size info on hover */}
                {image.dimensions && (
                  <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 
                                 transition-opacity bg-dark-primary/90 rounded px-2 py-1
                                 pointer-events-none">
                    <p className="text-xs text-text-secondary">
                      {image.dimensions.width}×{image.dimensions.height}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Hidden file input for adding more images */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {/* Upload progress for adding more images */}
          {isUploading && (
            <div className="mt-4 p-3 bg-dark-secondary/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 border-2 border-text-secondary/20 
                              border-t-accent-green rounded-full animate-spin" />
                <span className="text-sm text-text-secondary">Uploading images...</span>
                <span className="text-xs text-text-secondary/60">{uploadProgress}%</span>
              </div>
              <div className="mt-2 h-1 bg-dark-primary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-accent-green transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Professional Image Viewer */}
      {lightboxImage && (
        <ImageViewer
          image={lightboxImage}
          onClose={closeLightbox}
          onDownload={handleDownload}
          showNavigation={images.length > 1}
          onNext={images.length > 1 ? handleNext : null}
          onPrev={images.length > 1 ? handlePrev : null}
          currentIndex={lightboxIndex}
          totalImages={images.length}
        />
      )}
    </div>
  );
}

// Memoize ImageBlock to prevent unnecessary re-renders
export default memo(ImageBlock, (prevProps, nextProps) => {
  const willPreventRerender = 
    prevProps.block.id === nextProps.block.id &&
    prevProps.block.images === nextProps.block.images &&
    prevProps.block.metadata?.layout === nextProps.block.metadata?.layout &&
    prevProps.isFocused === nextProps.isFocused;
  
  
  return willPreventRerender;
});
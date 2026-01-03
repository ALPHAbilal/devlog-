import { useState, useEffect, useRef } from 'react';
import { Image as ImageIcon, AlertCircle, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useResponsive } from '@/shared/hooks';

/**
 * ResponsiveImage Component
 * Provides optimized image loading with responsive behavior
 */
export default function ResponsiveImage({
  src,
  alt,
  srcSet,
  sizes,
  width,
  height,
  className = '',
  priority = false,
  placeholder = 'blur',
  blurDataURL,
  onLoad,
  onError,
  objectFit = 'cover',
  quality = 75,
  ...props
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef(null);
  const { getCurrentBreakpoint, devicePixelRatio } = useResponsive();

  // Generate srcSet if not provided
  const generateSrcSet = () => {
    if (srcSet) return srcSet;
    
    const baseUrl = src.split('?')[0];
    const extension = baseUrl.split('.').pop();
    const urlWithoutExt = baseUrl.slice(0, -(extension.length + 1));
    
    // Generate multiple sizes for different screen densities
    const sizes = [320, 640, 750, 828, 1080, 1200, 1920, 2048, 3840];
    const srcSetArray = sizes
      .filter(size => !width || size <= width * 2)
      .map(size => `${urlWithoutExt}-${size}w.${extension} ${size}w`)
      .join(', ');
    
    return srcSetArray || src;
  };

  // Generate sizes attribute if not provided
  const generateSizes = () => {
    if (sizes) return sizes;
    
    // Default responsive sizes
    return `
      (max-width: 640px) 100vw,
      (max-width: 768px) 90vw,
      (max-width: 1024px) 80vw,
      (max-width: 1280px) 70vw,
      60vw
    `.trim();
  };

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.01,
      }
    );

    observer.observe(imgRef.current);

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [priority]);

  const handleLoad = (e) => {
    setIsLoaded(true);
    if (onLoad) onLoad(e);
  };

  const handleError = (e) => {
    setHasError(true);
    if (onError) onError(e);
  };

  // Calculate aspect ratio
  const aspectRatio = width && height ? height / width : undefined;
  const paddingBottom = aspectRatio ? `${aspectRatio * 100}%` : undefined;

  // Blur placeholder styles
  const placeholderStyles = placeholder === 'blur' && blurDataURL
    ? {
        backgroundImage: `url(${blurDataURL})`,
        backgroundSize: objectFit,
        backgroundPosition: 'center',
        filter: isLoaded ? 'none' : 'blur(20px)',
        transition: 'filter 0.3s ease-out',
      }
    : {};

  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      style={{
        paddingBottom,
        backgroundColor: placeholder === 'empty' ? 'transparent' : '#1A1A1A',
      }}
      {...props}
    >
      {/* Container for aspect ratio */}
      <div
        className="absolute inset-0"
        style={placeholderStyles}
      >
        {/* Error state */}
        {hasError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center 
                          bg-dark-secondary text-text-secondary">
            <AlertCircle size={32} className="mb-2" />
            <p className="text-sm">Failed to load image</p>
          </div>
        ) : (
          <>
            {/* Loading placeholder */}
            {!isLoaded && placeholder === 'shimmer' && (
              <div className="absolute inset-0 bg-dark-secondary animate-pulse" />
            )}
            
            {/* Main image */}
            {isInView && (
              <motion.img
                src={src}
                alt={alt}
                srcSet={generateSrcSet()}
                sizes={generateSizes()}
                width={width}
                height={height}
                loading={priority ? 'eager' : 'lazy'}
                decoding="async"
                onLoad={handleLoad}
                onError={handleError}
                initial={{ opacity: 0 }}
                animate={{ opacity: isLoaded ? 1 : 0 }}
                transition={{ duration: 0.3 }}
                className={`absolute inset-0 w-full h-full object-${objectFit}`}
                style={{
                  opacity: isLoaded ? 1 : 0,
                  transition: 'opacity 0.3s ease-in-out',
                }}
              />
            )}
            
            {/* Loading icon */}
            {!isLoaded && !hasError && placeholder === 'icon' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <ImageIcon size={32} className="text-text-secondary animate-pulse" />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Picture component for art direction
export function ResponsivePicture({
  sources = [],
  fallback,
  alt,
  className = '',
  ...props
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  
  return (
    <picture className={className}>
      {sources.map((source, index) => (
        <source
          key={index}
          media={source.media}
          srcSet={source.srcSet}
          type={source.type}
        />
      ))}
      <ResponsiveImage
        {...fallback}
        alt={alt}
        onLoad={() => setIsLoaded(true)}
        {...props}
      />
    </picture>
  );
}

// Image gallery component
export function ResponsiveImageGallery({
  images = [],
  columns = { xs: 1, sm: 2, md: 3, lg: 4 },
  gap = 4,
  onImageClick,
}) {
  const { getCurrentBreakpoint } = useResponsive();
  const currentBreakpoint = getCurrentBreakpoint();
  const columnCount = columns[currentBreakpoint] || 1;
  
  return (
    <div 
      className={`grid gap-${gap}`}
      style={{
        gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
      }}
    >
      {images.map((image, index) => (
        <motion.div
          key={image.id || index}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onImageClick && onImageClick(image, index)}
          className="cursor-pointer rounded-lg overflow-hidden"
        >
          <ResponsiveImage
            src={image.src}
            alt={image.alt}
            width={image.width}
            height={image.height}
            className="w-full h-full"
            priority={index < columnCount * 2} // Priority for first two rows
          />
        </motion.div>
      ))}
    </div>
  );
}

// Lightbox component for full-screen viewing
export function ImageLightbox({ image, isOpen, onClose }) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  
  const handleZoom = (delta) => {
    setScale(prev => Math.max(0.5, Math.min(4, prev + delta)));
  };
  
  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };
  
  if (!isOpen || !image) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <motion.div
          ref={containerRef}
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.8 }}
          drag
          dragConstraints={containerRef}
          dragElastic={0.1}
          whileDrag={{ cursor: 'grabbing' }}
          onClick={(e) => e.stopPropagation()}
          className="relative max-w-full max-h-full"
          style={{
            scale,
            x: position.x,
            y: position.y,
          }}
        >
          <img
            src={image.src}
            alt={image.alt}
            className="max-w-full max-h-[90vh] object-contain"
          />
        </motion.div>
      </div>
      
      {/* Controls */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 
                      bg-dark-secondary/80 backdrop-blur-sm rounded-full px-6 py-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleZoom(-0.5);
          }}
          className="text-text-secondary hover:text-text-primary transition-colors"
        >
          Zoom Out
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleReset();
          }}
          className="text-text-secondary hover:text-text-primary transition-colors"
        >
          Reset
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleZoom(0.5);
          }}
          className="text-text-secondary hover:text-text-primary transition-colors"
        >
          Zoom In
        </button>
      </div>
      
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 
                   rounded-lg transition-colors"
      >
        <X size={24} />
      </button>
    </motion.div>
  );
}

// Hook for preloading images
export function useImagePreloader(images = []) {
  const [loadedImages, setLoadedImages] = useState({});
  const [isAllLoaded, setIsAllLoaded] = useState(false);
  
  useEffect(() => {
    if (images.length === 0) {
      setIsAllLoaded(true);
      return;
    }
    
    let mounted = true;
    const imagePromises = images.map((src) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          if (mounted) {
            setLoadedImages(prev => ({ ...prev, [src]: true }));
          }
          resolve(src);
        };
        img.onerror = () => {
          if (mounted) {
            setLoadedImages(prev => ({ ...prev, [src]: false }));
          }
          resolve(src);
        };
        img.src = src;
      });
    });
    
    Promise.all(imagePromises).then(() => {
      if (mounted) {
        setIsAllLoaded(true);
      }
    });
    
    return () => {
      mounted = false;
    };
  }, [images]);
  
  return { loadedImages, isAllLoaded };
}

// Utility for generating blur data URLs
export async function generateBlurDataURL(src, width = 10, height = 10) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      ctx.filter = 'blur(2px)';
      ctx.drawImage(img, 0, 0, width, height);
      
      resolve(canvas.toDataURL('image/jpeg', 0.1));
    };
    
    img.onerror = reject;
    img.src = src;
  });
}
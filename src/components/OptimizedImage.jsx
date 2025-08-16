/**
 * OptimizedImage Component
 * 
 * Provides lazy loading, responsive images, and progressive enhancement
 */

import { useState, useEffect, useRef } from 'react';
import { createLazyLoader } from '../utils/performance';

function OptimizedImage({ 
  src, 
  alt, 
  className = '', 
  placeholder = null,
  srcSet = null,
  sizes = null,
  loading = 'lazy',
  onLoad = null,
  onError = null,
  aspectRatio = null,
  objectFit = 'cover'
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(placeholder || '');
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    if (!src) return;

    // Native lazy loading support
    if ('loading' in HTMLImageElement.prototype && loading === 'lazy') {
      setCurrentSrc(src);
      return;
    }

    // Manual lazy loading with IntersectionObserver
    if (loading === 'lazy' && imgRef.current) {
      observerRef.current = createLazyLoader(
        `img[data-src="${src}"]`,
        (img) => {
          loadImage();
        },
        { rootMargin: '50px' }
      );
    } else {
      // Eager loading
      loadImage();
    }

    return () => {
      if (observerRef.current && imgRef.current) {
        observerRef.current.unobserve(imgRef.current);
      }
    };
  }, [src, loading]);

  const loadImage = () => {
    const img = new Image();
    
    img.onload = () => {
      setCurrentSrc(src);
      setIsLoaded(true);
      setIsError(false);
      onLoad?.();
    };
    
    img.onerror = () => {
      setIsError(true);
      setIsLoaded(true);
      onError?.();
    };
    
    // Set srcset if provided
    if (srcSet) {
      img.srcset = srcSet;
    }
    
    img.src = src;
  };

  const containerStyle = aspectRatio ? {
    position: 'relative',
    paddingBottom: `${(1 / aspectRatio) * 100}%`,
    overflow: 'hidden'
  } : {};

  const imgStyle = aspectRatio ? {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit
  } : { objectFit };

  if (isError) {
    return (
      <div 
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={containerStyle}
      >
        <span className="text-gray-500">Failed to load image</span>
      </div>
    );
  }

  return (
    <div style={containerStyle} className={aspectRatio ? className : ''}>
      <img
        ref={imgRef}
        src={currentSrc || placeholder}
        data-src={loading === 'lazy' && !('loading' in HTMLImageElement.prototype) ? src : undefined}
        alt={alt}
        className={`${!aspectRatio ? className : ''} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        style={imgStyle}
        loading={loading}
        srcSet={srcSet}
        sizes={sizes}
      />
      {!isLoaded && placeholder && (
        <div 
          className="absolute inset-0 bg-gray-200 animate-pulse"
          style={{ zIndex: -1 }}
        />
      )}
    </div>
  );
}

/**
 * Picture component for responsive images
 */
export function ResponsivePicture({ 
  sources, 
  alt, 
  className = '',
  loading = 'lazy',
  fallbackSrc 
}) {
  return (
    <picture>
      {sources.map((source, index) => (
        <source
          key={index}
          srcSet={source.srcSet}
          media={source.media}
          type={source.type}
        />
      ))}
      <OptimizedImage
        src={fallbackSrc}
        alt={alt}
        className={className}
        loading={loading}
      />
    </picture>
  );
}

/**
 * Background image component with lazy loading
 */
export function LazyBackgroundImage({ 
  src, 
  className = '', 
  children,
  placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg"%3E%3C/svg%3E'
}) {
  const [backgroundImage, setBackgroundImage] = useState(placeholder);
  const [isLoaded, setIsLoaded] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    const observer = createLazyLoader(
      `[data-bg-src="${src}"]`,
      () => {
        const img = new Image();
        img.onload = () => {
          setBackgroundImage(src);
          setIsLoaded(true);
        };
        img.src = src;
      }
    );

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [src]);

  return (
    <div
      ref={elementRef}
      data-bg-src={src}
      className={`${className} ${isLoaded ? 'bg-loaded' : 'bg-loading'}`}
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {children}
    </div>
  );
}

export default OptimizedImage;
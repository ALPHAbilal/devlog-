import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ZoomIn, ZoomOut, RotateCw, Maximize2, Download } from 'lucide-react';

export default function ImageViewer({ 
  image, 
  onClose, 
  onDownload,
  showNavigation = false,
  onNext = null,
  onPrev = null,
  currentIndex = 0,
  totalImages = 1
}) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, imageX: 0, imageY: 0 });
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  
  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const animationRef = useRef(null);
  const velocityRef = useRef({ x: 0, y: 0 });
  const lastPointerRef = useRef({ x: 0, y: 0 });
  
  // Constants for smooth UX
  const MIN_SCALE = 0.5;
  const MAX_SCALE = 5;
  const ZOOM_STEP = 0.25;
  const DOUBLE_CLICK_ZOOM = 2;
  const MOMENTUM_DAMPING = 0.92;
  const MOMENTUM_THRESHOLD = 0.5;

  // Initialize dimensions
  useEffect(() => {
    if (!image) return;
    
    const img = new Image();
    img.onload = () => {
      setImageDimensions({ width: img.width, height: img.height });
    };
    img.src = image.url;
  }, [image]);

  // Update container dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Calculate boundaries for current scale
  const getBoundaries = useCallback(() => {
    if (!imageDimensions.width || !containerDimensions.width) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    }

    const scaledWidth = imageDimensions.width * scale;
    const scaledHeight = imageDimensions.height * scale;

    const maxX = Math.max(0, (scaledWidth - containerDimensions.width) / 2);
    const maxY = Math.max(0, (scaledHeight - containerDimensions.height) / 2);

    return {
      minX: -maxX,
      maxX: maxX,
      minY: -maxY,
      maxY: maxY
    };
  }, [imageDimensions, containerDimensions, scale]);

  // Check if image is pannable at current scale
  const isPannable = useCallback(() => {
    if (!imageDimensions.width || !containerDimensions.width) {
      return false;
    }
    
    const scaledWidth = imageDimensions.width * scale;
    const scaledHeight = imageDimensions.height * scale;
    
    // Image is pannable if it overflows in either dimension
    return scaledWidth > containerDimensions.width || scaledHeight > containerDimensions.height;
  }, [imageDimensions, containerDimensions, scale]);

  // Constrain position within boundaries
  const constrainPosition = useCallback((x, y) => {
    const bounds = getBoundaries();
    return {
      x: Math.max(bounds.minX, Math.min(bounds.maxX, x)),
      y: Math.max(bounds.minY, Math.min(bounds.maxY, y))
    };
  }, [getBoundaries]);

  // Smooth zoom function
  const smoothZoom = useCallback((newScale, zoomCenter = null) => {
    const clampedScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));
    
    if (zoomCenter && scale !== clampedScale) {
      // Calculate new position to keep zoom center fixed
      const scaleRatio = clampedScale / scale;
      const newX = zoomCenter.x - (zoomCenter.x - position.x) * scaleRatio;
      const newY = zoomCenter.y - (zoomCenter.y - position.y) * scaleRatio;
      
      const constrained = constrainPosition(newX, newY);
      setPosition(constrained);
    }
    
    setScale(clampedScale);
  }, [scale, position, constrainPosition]);

  // Handle wheel zoom
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const zoomCenter = {
      x: e.clientX - rect.left - rect.width / 2,
      y: e.clientY - rect.top - rect.height / 2
    };

    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    smoothZoom(scale + delta, zoomCenter);
  }, [scale, smoothZoom]);

  // Handle pointer down
  const handlePointerDown = useCallback((e) => {
    // Allow dragging if image is pannable (overflows container)
    if (!isPannable()) return;
    
    e.preventDefault();
    setIsDragging(true);
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    setDragStart({
      x: e.clientX,
      y: e.clientY,
      imageX: position.x,
      imageY: position.y
    });

    lastPointerRef.current = { x: e.clientX, y: e.clientY };
    velocityRef.current = { x: 0, y: 0 };

    // Cancel any ongoing momentum animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, [isPannable, position]);

  // Handle pointer move
  const handlePointerMove = useCallback((e) => {
    if (!isDragging) return;
    
    e.preventDefault();
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    const newX = dragStart.imageX + deltaX;
    const newY = dragStart.imageY + deltaY;
    
    // Update velocity for momentum
    velocityRef.current = {
      x: e.clientX - lastPointerRef.current.x,
      y: e.clientY - lastPointerRef.current.y
    };
    lastPointerRef.current = { x: e.clientX, y: e.clientY };
    
    // Don't constrain during drag for smoother feel
    // Only update if position actually changed to prevent flicker
    setPosition(prev => {
      if (prev.x === newX && prev.y === newY) return prev;
      return { x: newX, y: newY };
    });
  }, [isDragging, dragStart]);

  // Handle pointer up with momentum
  const handlePointerUp = useCallback((e) => {
    if (!isDragging) return;
    
    e.preventDefault();
    setIsDragging(false);

    // Start momentum animation
    const animate = () => {
      const vx = velocityRef.current.x;
      const vy = velocityRef.current.y;

      if (Math.abs(vx) > MOMENTUM_THRESHOLD || Math.abs(vy) > MOMENTUM_THRESHOLD) {
        setPosition(prev => {
          const newX = prev.x + vx;
          const newY = prev.y + vy;
          return constrainPosition(newX, newY);
        });

        velocityRef.current = {
          x: vx * MOMENTUM_DAMPING,
          y: vy * MOMENTUM_DAMPING
        };

        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Final position check
        setPosition(prev => constrainPosition(prev.x, prev.y));
      }
    };

    if (Math.abs(velocityRef.current.x) > MOMENTUM_THRESHOLD || 
        Math.abs(velocityRef.current.y) > MOMENTUM_THRESHOLD) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      setPosition(prev => constrainPosition(prev.x, prev.y));
    }
  }, [isDragging, constrainPosition]);

  // Handle double click
  const handleDoubleClick = useCallback((e) => {
    e.preventDefault();
    
    if (scale === 1) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const zoomCenter = {
        x: e.clientX - rect.left - rect.width / 2,
        y: e.clientY - rect.top - rect.height / 2
      };

      smoothZoom(DOUBLE_CLICK_ZOOM, zoomCenter);
    } else {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [scale, smoothZoom]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch(e.key) {
        case 'Escape':
          onClose();
          break;
        case '+':
        case '=':
          smoothZoom(scale + ZOOM_STEP);
          break;
        case '-':
          smoothZoom(scale - ZOOM_STEP);
          break;
        case '0':
          setScale(1);
          setPosition({ x: 0, y: 0 });
          break;
        case 'ArrowLeft':
          if (onPrev && showNavigation) onPrev();
          break;
        case 'ArrowRight':
          if (onNext && showNavigation) onNext();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [scale, smoothZoom, onClose, onNext, onPrev, showNavigation]);

  // Attach wheel listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Zoom controls
  const zoomIn = () => smoothZoom(scale + ZOOM_STEP);
  const zoomOut = () => smoothZoom(scale - ZOOM_STEP);
  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };
  const fitToScreen = () => {
    if (!imageDimensions.width || !containerDimensions.width) return;
    
    const scaleX = containerDimensions.width / imageDimensions.width;
    const scaleY = containerDimensions.height / imageDimensions.height;
    const newScale = Math.min(scaleX, scaleY, 1) * 0.9;
    
    setScale(newScale);
    setPosition({ x: 0, y: 0 });
  };

  if (!image) return null;

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (image && typeof document !== 'undefined' && document.body) {
      const scrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';

      return () => {
        if (document.body) {
          document.body.style.overflow = '';
          document.body.style.position = '';
          document.body.style.top = '';
          document.body.style.width = '';
        }
        window.scrollTo(0, scrollY);
      };
    }
  }, [image]);

  // Render via portal to escape all parent containers and stacking contexts
  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/98 backdrop-blur-md">
      {/* Header Controls */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10">
        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={zoomOut}
            disabled={scale <= MIN_SCALE}
            className="p-2 bg-dark-primary/80 backdrop-blur rounded-lg text-text-secondary 
                     hover:text-text-primary hover:bg-dark-primary transition-all
                     disabled:opacity-50 disabled:cursor-not-allowed"
            title="Zoom out (-)"
          >
            <ZoomOut size={20} />
          </button>
          
          <button
            onClick={zoomIn}
            disabled={scale >= MAX_SCALE}
            className="p-2 bg-dark-primary/80 backdrop-blur rounded-lg text-text-secondary 
                     hover:text-text-primary hover:bg-dark-primary transition-all
                     disabled:opacity-50 disabled:cursor-not-allowed"
            title="Zoom in (+)"
          >
            <ZoomIn size={20} />
          </button>
          
          <button
            onClick={resetZoom}
            className="p-2 bg-dark-primary/80 backdrop-blur rounded-lg text-text-secondary 
                     hover:text-text-primary hover:bg-dark-primary transition-all"
            title="Reset zoom (0)"
          >
            <RotateCw size={20} />
          </button>
          
          <button
            onClick={fitToScreen}
            className="p-2 bg-dark-primary/80 backdrop-blur rounded-lg text-text-secondary 
                     hover:text-text-primary hover:bg-dark-primary transition-all"
            title="Fit to screen"
          >
            <Maximize2 size={20} />
          </button>
          
          <div className="px-3 py-2 bg-dark-primary/80 backdrop-blur rounded-lg text-text-secondary text-sm">
            {Math.round(scale * 100)}%
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {onDownload && (
            <button
              onClick={() => onDownload(image)}
              className="p-2 bg-dark-primary/80 backdrop-blur rounded-lg text-text-secondary 
                       hover:text-text-primary hover:bg-dark-primary transition-all"
              title="Download"
            >
              <Download size={20} />
            </button>
          )}
          
          <button
            onClick={onClose}
            className="p-2 bg-dark-primary/80 backdrop-blur rounded-lg text-text-secondary 
                     hover:text-text-primary hover:bg-dark-primary transition-all"
            title="Close (Esc)"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Main Viewport */}
      <div 
        ref={containerRef}
        className="absolute inset-0 flex items-center justify-center overflow-hidden"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onDoubleClick={handleDoubleClick}
        style={{
          cursor: isPannable() ? (isDragging ? 'grabbing' : 'grab') : 'default',
          touchAction: 'none',
          userSelect: 'none'
        }}
      >
        <img
          ref={imageRef}
          src={image.url}
          alt={image.alt || 'Image viewer'}
          className="max-w-none transition-transform duration-200 ease-out"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: 'center',
            willChange: isDragging ? 'transform' : 'auto',
            imageRendering: scale > 2 ? 'pixelated' : 'auto',
            pointerEvents: 'none'
          }}
          draggable={false}
        />
      </div>

      {/* Bottom Info */}
      <div className="absolute bottom-0 left-0 right-0 p-4 text-center pointer-events-none">
        <div className="inline-block bg-dark-primary/80 backdrop-blur rounded-lg px-4 py-2">
          <p className="text-text-primary text-sm">
            {image.alt || 'Image'}
          </p>
          {imageDimensions.width > 0 && (
            <p className="text-text-secondary text-xs mt-1">
              {imageDimensions.width} × {imageDimensions.height}
              {totalImages > 1 && ` • ${currentIndex + 1} / ${totalImages}`}
            </p>
          )}
        </div>
      </div>

      {/* Navigation buttons */}
      {showNavigation && totalImages > 1 && (
        <>
          <button
            onClick={onPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 
                     bg-dark-primary/80 backdrop-blur rounded-lg text-text-secondary 
                     hover:text-text-primary hover:bg-dark-primary transition-all"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          
          <button
            onClick={onNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 
                     bg-dark-primary/80 backdrop-blur rounded-lg text-text-secondary 
                     hover:text-text-primary hover:bg-dark-primary transition-all"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </>
      )}

      {/* Instructions */}
      <div className="absolute bottom-20 left-0 right-0 text-center pointer-events-none">
        <p className="text-text-secondary/40 text-xs">
          {isPannable() 
            ? 'Drag to pan • Double-click to zoom • Scroll to zoom'
            : 'Double-click or scroll wheel to zoom'
          }
        </p>
      </div>
    </div>,
    typeof document !== 'undefined' && document.body ? document.body : document.createElement('div')
  );
}
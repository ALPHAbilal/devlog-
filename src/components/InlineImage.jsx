import { useState } from 'react';
import { X, Maximize2, ExternalLink, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

export default function InlineImage({ src, alt, className = '' }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleClick = (e) => {
    e.stopPropagation();
    setIsExpanded(true);
  };

  const handleClose = (e) => {
    e.stopPropagation();
    setIsExpanded(false);
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleReset = () => {
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && zoomLevel > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  const handleError = () => {
    setImageError(true);
  };

  if (imageError) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-dark-secondary/30 
                       rounded text-xs text-text-secondary/60 align-middle">
        <ExternalLink size={12} />
        broken image
      </span>
    );
  }

  return (
    <>
      {/* Inline thumbnail - ultra compact */}
      <span 
        className={`inline-block align-middle cursor-zoom-in group ${className}`}
        onClick={handleClick}
      >
        <span className="relative inline-block">
          <img
            src={src}
            alt={alt || 'image'}
            onError={handleError}
            className="inline-block h-5 w-auto max-w-[60px] object-cover rounded
                       border border-dark-secondary/50 group-hover:border-accent-green/50
                       transition-all duration-200 align-middle"
            style={{ verticalAlign: '-0.125em' }}
          />
          <Maximize2 
            size={10} 
            className="absolute bottom-0 right-0 text-accent-green/60 
                       opacity-0 group-hover:opacity-100 transition-opacity
                       bg-dark-primary/80 rounded-tl"
          />
        </span>
      </span>

      {/* Expanded view - fullscreen modal */}
      {isExpanded && (
        <div 
          className="fixed inset-0 z-50 bg-dark-primary/95 backdrop-blur-sm 
                     flex items-center justify-center p-8 animate-in fade-in duration-200"
          onClick={handleClose}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Zoom controls */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 
                          bg-dark-secondary/90 backdrop-blur-sm rounded-lg p-2 z-10">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleZoomOut();
              }}
              className="p-2 hover:bg-dark-primary/50 rounded text-text-secondary 
                         hover:text-text-primary transition-all"
              title="Zoom out (scroll down)"
            >
              <ZoomOut size={20} />
            </button>
            
            <span className="px-3 text-sm text-text-secondary min-w-[60px] text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleZoomIn();
              }}
              className="p-2 hover:bg-dark-primary/50 rounded text-text-secondary 
                         hover:text-text-primary transition-all"
              title="Zoom in (scroll up)"
            >
              <ZoomIn size={20} />
            </button>
            
            <div className="w-px h-6 bg-dark-secondary/50" />
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleReset();
              }}
              className="p-2 hover:bg-dark-primary/50 rounded text-text-secondary 
                         hover:text-text-primary transition-all"
              title="Reset zoom"
            >
              <RotateCw size={20} />
            </button>
          </div>

          <div 
            className="relative overflow-hidden flex items-center justify-center"
            style={{ 
              width: '90vw', 
              height: '90vh',
              cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
            }}
            onWheel={handleWheel}
          >
            <img
              src={src}
              alt={alt || 'image'}
              className="rounded-lg shadow-2xl"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${zoomLevel})`,
                maxWidth: zoomLevel === 1 ? '100%' : 'none',
                maxHeight: zoomLevel === 1 ? '100%' : 'none',
                objectFit: 'contain',
                transition: isDragging ? 'none' : 'transform 200ms ease-out',
                cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={handleMouseDown}
              draggable={false}
            />
            
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 text-text-secondary 
                         hover:text-text-primary transition-colors bg-dark-secondary/90 
                         backdrop-blur-sm rounded-lg"
            >
              <X size={24} />
            </button>
            
            {/* Caption */}
            {alt && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 
                              text-sm text-text-secondary/70 bg-dark-secondary/90 
                              backdrop-blur-sm rounded px-3 py-1">
                {alt}
              </div>
            )}
            
            {/* Usage hints */}
            <div className="absolute bottom-4 right-4 text-xs text-text-secondary/50 
                            bg-dark-secondary/70 backdrop-blur-sm rounded px-3 py-2 
                            max-w-xs">
              <div>Scroll to zoom • Drag to pan</div>
              <div>Click outside to close</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
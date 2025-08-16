import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { useTouchGestures } from '../hooks/useTouchGestures';
import { useResponsive } from '../hooks/useResponsive';

/**
 * SwipeableDocumentViewer Component
 * Allows users to swipe between documents on mobile devices
 */
export default function SwipeableDocumentViewer({ 
  documents, 
  initialIndex = 0,
  onDocumentChange,
  renderDocument,
  preloadCount = 1,
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef(null);
  const { isMobile, width } = useResponsive();
  
  // Motion values for swipe animation
  const x = useMotionValue(0);
  const scale = useTransform(x, [-width, 0, width], [0.8, 1, 0.8]);
  const opacity = useTransform(x, [-width, 0, width], [0.5, 1, 0.5]);
  
  // Preload adjacent documents
  const preloadIndices = [];
  for (let i = -preloadCount; i <= preloadCount; i++) {
    const idx = currentIndex + i;
    if (idx >= 0 && idx < documents.length) {
      preloadIndices.push(idx);
    }
  }
  
  const goToDocument = useCallback((index) => {
    if (index < 0 || index >= documents.length || isAnimating) return;
    
    setIsAnimating(true);
    setCurrentIndex(index);
    
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
    
    // Notify parent component
    if (onDocumentChange) {
      onDocumentChange(documents[index], index);
    }
    
    setTimeout(() => setIsAnimating(false), 300);
  }, [documents, isAnimating, onDocumentChange]);
  
  const goToNext = useCallback(() => {
    goToDocument(currentIndex + 1);
  }, [currentIndex, goToDocument]);
  
  const goToPrevious = useCallback(() => {
    goToDocument(currentIndex - 1);
  }, [currentIndex, goToDocument]);
  
  // Touch gestures for swiping
  useTouchGestures(containerRef, {
    onSwipeLeft: goToNext,
    onSwipeRight: goToPrevious,
    swipeThreshold: 50,
    swipeVelocityThreshold: 0.5,
  });
  
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') goToPrevious();
      if (e.key === 'ArrowRight') goToNext();
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrevious]);
  
  // Update when documents change
  useEffect(() => {
    if (currentIndex >= documents.length) {
      setCurrentIndex(Math.max(0, documents.length - 1));
    }
  }, [documents.length, currentIndex]);
  
  if (!documents || documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-text-secondary">
        <FileText size={48} className="mb-4" />
        <p>No documents available</p>
      </div>
    );
  }
  
  const currentDoc = documents[currentIndex];
  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < documents.length - 1;
  
  return (
    <div 
      ref={containerRef}
      className="relative h-full overflow-hidden bg-dark-primary"
    >
      {/* Document Counter */}
      <div className="absolute top-4 right-4 z-20 bg-dark-secondary/80 backdrop-blur-sm 
                      px-3 py-1.5 rounded-full text-sm text-text-secondary">
        {currentIndex + 1} / {documents.length}
      </div>
      
      {/* Navigation Buttons (Desktop) */}
      {!isMobile && (
        <>
          <button
            onClick={goToPrevious}
            disabled={!canGoPrevious}
            className={`absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-lg
                       bg-dark-secondary/80 backdrop-blur-sm transition-all
                       ${canGoPrevious 
                         ? 'hover:bg-dark-secondary text-text-primary' 
                         : 'opacity-50 cursor-not-allowed text-text-secondary'}`}
          >
            <ChevronLeft size={24} />
          </button>
          
          <button
            onClick={goToNext}
            disabled={!canGoNext}
            className={`absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-lg
                       bg-dark-secondary/80 backdrop-blur-sm transition-all
                       ${canGoNext 
                         ? 'hover:bg-dark-secondary text-text-primary' 
                         : 'opacity-50 cursor-not-allowed text-text-secondary'}`}
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}
      
      {/* Swipe Indicators (Mobile) */}
      {isMobile && (
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between 
                        px-4 pointer-events-none z-10">
          <AnimatePresence>
            {canGoPrevious && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 0.3, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-text-secondary"
              >
                <ChevronLeft size={32} />
              </motion.div>
            )}
          </AnimatePresence>
          
          <AnimatePresence>
            {canGoNext && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 0.3, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="text-text-secondary"
              >
                <ChevronRight size={32} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
      
      {/* Document Container */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentDoc.id || currentIndex}
          className="h-full"
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          style={{ scale: isMobile ? scale : 1, opacity: isMobile ? opacity : 1 }}
          drag={isMobile ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={(e, { offset, velocity }) => {
            const swipeThreshold = 50;
            const swipeVelocity = 0.5;
            
            if (offset.x < -swipeThreshold || velocity.x < -swipeVelocity) {
              goToNext();
            } else if (offset.x > swipeThreshold || velocity.x > swipeVelocity) {
              goToPrevious();
            }
          }}
        >
          {/* Render Document Content */}
          <div className="h-full overflow-auto momentum-scroll">
            {renderDocument ? renderDocument(currentDoc, currentIndex) : (
              <DocumentViewer document={currentDoc} />
            )}
          </div>
        </motion.div>
      </AnimatePresence>
      
      {/* Bottom Navigation Dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {documents.map((_, index) => (
          <button
            key={index}
            onClick={() => goToDocument(index)}
            className={`w-2 h-2 rounded-full transition-all touch-target-small
                       ${index === currentIndex 
                         ? 'w-8 bg-accent-green' 
                         : 'bg-text-secondary/30 hover:bg-text-secondary/50'}`}
            aria-label={`Go to document ${index + 1}`}
          />
        ))}
      </div>
      
      {/* Preload Adjacent Documents */}
      <div className="hidden">
        {preloadIndices.map(idx => 
          idx !== currentIndex && (
            <div key={idx}>
              {renderDocument ? renderDocument(documents[idx], idx) : (
                <DocumentViewer document={documents[idx]} />
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}

// Default Document Viewer Component
function DocumentViewer({ document }) {
  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-2">
          {document.title}
        </h1>
        {document.metadata && (
          <div className="flex flex-wrap gap-4 text-sm text-text-secondary">
            {document.metadata.date && (
              <span>{new Date(document.metadata.date).toLocaleDateString()}</span>
            )}
            {document.metadata.author && (
              <span>By {document.metadata.author}</span>
            )}
            {document.metadata.readTime && (
              <span>{document.metadata.readTime} min read</span>
            )}
          </div>
        )}
      </header>
      
      <div className="prose prose-invert max-w-none">
        {document.content}
      </div>
      
      {document.tags && document.tags.length > 0 && (
        <div className="mt-8 pt-8 border-t border-dark-secondary">
          <div className="flex flex-wrap gap-2">
            {document.tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-dark-secondary text-text-secondary text-sm 
                         rounded-full hover:bg-dark-secondary/80 transition-colors"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Hook for managing document navigation
export function useDocumentNavigation(documents, initialIndex = 0) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  
  const navigate = useCallback((direction) => {
    setCurrentIndex(prev => {
      if (direction === 'next') {
        return Math.min(prev + 1, documents.length - 1);
      } else if (direction === 'previous') {
        return Math.max(prev - 1, 0);
      }
      return prev;
    });
  }, [documents.length]);
  
  const goToDocument = useCallback((index) => {
    if (index >= 0 && index < documents.length) {
      setCurrentIndex(index);
    }
  }, [documents.length]);
  
  return {
    currentIndex,
    currentDocument: documents[currentIndex],
    canGoNext: currentIndex < documents.length - 1,
    canGoPrevious: currentIndex > 0,
    goToNext: () => navigate('next'),
    goToPrevious: () => navigate('previous'),
    goToDocument,
  };
}

// Example usage
export function SwipeableDocumentExample() {
  const documents = [
    {
      id: '1',
      title: 'Getting Started with React',
      content: 'React is a JavaScript library for building user interfaces...',
      metadata: { date: '2024-01-15', author: 'John Doe', readTime: 5 },
      tags: ['react', 'javascript', 'frontend'],
    },
    {
      id: '2',
      title: 'Understanding Hooks',
      content: 'Hooks are a new addition in React 16.8...',
      metadata: { date: '2024-01-16', author: 'Jane Smith', readTime: 8 },
      tags: ['react', 'hooks', 'state-management'],
    },
    {
      id: '3',
      title: 'Building Responsive Components',
      content: 'Creating components that work across all devices...',
      metadata: { date: '2024-01-17', author: 'Mike Johnson', readTime: 10 },
      tags: ['responsive', 'css', 'mobile'],
    },
  ];
  
  return (
    <SwipeableDocumentViewer
      documents={documents}
      initialIndex={0}
      onDocumentChange={(doc, index) => {
        console.log('Viewing document:', doc.title, 'at index:', index);
      }}
    />
  );
}
import { memo, useState, useCallback, useRef, useEffect, lazy, Suspense, startTransition } from 'react';
import { GitBranch, Clock, FileText, ChevronRight, Grid3x3, List } from 'lucide-react';

// Lazy load the heavy component
const VersionTrackBlock = lazy(() => import('./VersionTrackBlock'));

// Lightweight placeholder component shown before full component loads
const VersionTrackPlaceholder = memo(({ block, onUpdate }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleExpand = useCallback(() => {
    setIsLoading(true);
    startTransition(() => {
      setIsExpanded(true);
    });
  }, []);
  
  if (isExpanded) {
    return (
      <Suspense fallback={
        <div className="bg-dark-secondary/30 rounded-lg p-4 animate-pulse">
          <div className="flex items-center gap-3 mb-3">
            <GitBranch className="text-accent-green" size={20} />
            <div className="h-5 bg-dark-secondary/50 rounded w-32"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-dark-secondary/50 rounded w-full"></div>
            <div className="h-4 bg-dark-secondary/50 rounded w-3/4"></div>
            <div className="h-4 bg-dark-secondary/50 rounded w-1/2"></div>
          </div>
          <div className="mt-4 text-text-secondary text-sm">
            Loading version tracking...
          </div>
        </div>
      }>
        <VersionTrackBlock block={block} onUpdate={onUpdate} />
      </Suspense>
    );
  }
  
  // Lightweight preview when collapsed
  const versionCount = block.versions?.length || 0;
  const currentVersion = block.currentVersion || block.versions?.[0];
  
  return (
    <div className="bg-dark-secondary/30 rounded-lg p-4 cursor-pointer hover:bg-dark-secondary/40 transition-colors"
         onClick={handleExpand}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GitBranch className="text-accent-green" size={20} />
          <div>
            <h3 className="text-text-primary font-medium">
              {block.title || 'Version Track'}
            </h3>
            <div className="flex items-center gap-4 text-text-secondary text-sm mt-1">
              <span className="flex items-center gap-1">
                <Clock size={14} />
                {versionCount} {versionCount === 1 ? 'version' : 'versions'}
              </span>
              {currentVersion && (
                <span className="flex items-center gap-1">
                  <FileText size={14} />
                  v{currentVersion.version || '1.0.0'}
                </span>
              )}
            </div>
          </div>
        </div>
        <ChevronRight className="text-text-secondary" size={20} />
      </div>
      {isLoading && (
        <div className="mt-2 text-text-secondary text-xs">
          Loading full version history...
        </div>
      )}
    </div>
  );
});

// Main optimized component with virtualization for file tree
const OptimizedVersionTrackBlock = memo(({ block, onUpdate }) => {
  const [renderMode, setRenderMode] = useState('placeholder');
  const containerRef = useRef(null);
  const observerRef = useRef(null);
  
  // Use Intersection Observer to detect when component is in viewport
  useEffect(() => {
    if (!containerRef.current) return;
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && renderMode === 'placeholder') {
            // Component is visible, prepare to render
            startTransition(() => {
              setRenderMode('visible');
            });
          } else if (!entry.isIntersecting && renderMode === 'visible') {
            // Component is no longer visible, can switch to lightweight mode
            // Only do this for heavy blocks
            if (block.versions?.length > 10) {
              startTransition(() => {
                setRenderMode('placeholder');
              });
            }
          }
        });
      },
      {
        rootMargin: '100px', // Start loading 100px before visible
        threshold: 0
      }
    );
    
    observerRef.current.observe(containerRef.current);
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [renderMode, block.versions?.length]);
  
  return (
    <div ref={containerRef} className="optimized-version-track">
      {renderMode === 'placeholder' ? (
        <VersionTrackPlaceholder block={block} onUpdate={onUpdate} />
      ) : (
        <Suspense fallback={
          <div className="bg-dark-secondary/30 rounded-lg p-4 animate-pulse">
            <div className="h-6 bg-dark-secondary/50 rounded w-48 mb-4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-dark-secondary/50 rounded w-full"></div>
              <div className="h-4 bg-dark-secondary/50 rounded w-3/4"></div>
            </div>
          </div>
        }>
          <VersionTrackBlock block={block} onUpdate={onUpdate} />
        </Suspense>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for better memoization
  return (
    prevProps.block.id === nextProps.block.id &&
    prevProps.block.title === nextProps.block.title &&
    prevProps.block.versions === nextProps.block.versions &&
    prevProps.block.currentVersion === nextProps.block.currentVersion &&
    prevProps.block.viewMode === nextProps.block.viewMode
  );
});

OptimizedVersionTrackBlock.displayName = 'OptimizedVersionTrackBlock';

export default OptimizedVersionTrackBlock;
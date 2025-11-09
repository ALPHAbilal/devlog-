import { memo, useState, useCallback, useRef, useEffect, lazy, Suspense, startTransition } from 'react';
import { Bug, CheckCircle, Clock, AlertCircle, ChevronRight } from 'lucide-react';

// Lazy load the heavy component
const IssueTrackerBlock = lazy(() => import('./IssueTrackerBlock'));

// Lightweight placeholder component
const IssueTrackerPlaceholder = memo(({ block, onUpdate }) => {
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
            <Bug className="text-red-400" size={20} />
            <div className="h-5 bg-dark-secondary/50 rounded w-32"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-dark-secondary/50 rounded w-full"></div>
            <div className="h-4 bg-dark-secondary/50 rounded w-3/4"></div>
            <div className="h-4 bg-dark-secondary/50 rounded w-1/2"></div>
          </div>
          <div className="mt-4 text-text-secondary text-sm">
            Loading issue tracker...
          </div>
        </div>
      }>
        <IssueTrackerBlock block={block} onUpdate={onUpdate} />
      </Suspense>
    );
  }
  
  // Calculate issue statistics
  const issues = block.issues || [];
  const openCount = issues.filter(i => i.status === 'open').length;
  const inProgressCount = issues.filter(i => i.status === 'in-progress').length;
  const closedCount = issues.filter(i => i.status === 'closed').length;
  const totalCount = issues.length;
  
  return (
    <div className="bg-dark-secondary/30 rounded-lg p-4 cursor-pointer hover:bg-dark-secondary/40 transition-colors"
         onClick={handleExpand}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bug className="text-red-400" size={20} />
          <div>
            <h3 className="text-text-primary font-medium">
              {block.title || 'Issue Tracker'}
            </h3>
            <div className="flex items-center gap-4 text-text-secondary text-sm mt-1">
              {openCount > 0 && (
                <span className="flex items-center gap-1">
                  <AlertCircle size={14} className="text-yellow-400" />
                  {openCount} open
                </span>
              )}
              {inProgressCount > 0 && (
                <span className="flex items-center gap-1">
                  <Clock size={14} className="text-blue-400" />
                  {inProgressCount} in progress
                </span>
              )}
              {closedCount > 0 && (
                <span className="flex items-center gap-1">
                  <CheckCircle size={14} className="text-green-400" />
                  {closedCount} closed
                </span>
              )}
              {totalCount === 0 && (
                <span className="text-text-secondary/60">No issues</span>
              )}
            </div>
          </div>
        </div>
        <ChevronRight className="text-text-secondary" size={20} />
      </div>
      {isLoading && (
        <div className="mt-2 text-text-secondary text-xs">
          Loading full issue details...
        </div>
      )}
    </div>
  );
});

// Main optimized component with virtual scrolling for issues
const OptimizedIssueTrackerBlock = memo(({ block, onUpdate }) => {
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
            // Component is no longer visible, switch to lightweight mode for heavy blocks
            const issueCount = block.issues?.length || 0;
            if (issueCount > 10) {
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
  }, [renderMode, block.issues?.length]);
  
  return (
    <div ref={containerRef} className="optimized-issue-tracker">
      {renderMode === 'placeholder' ? (
        <IssueTrackerPlaceholder block={block} onUpdate={onUpdate} />
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
          <IssueTrackerBlock block={block} onUpdate={onUpdate} />
        </Suspense>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for better memoization
  if (prevProps.block.id !== nextProps.block.id) return false;
  if (prevProps.block.title !== nextProps.block.title) return false;
  
  // Deep compare issues array (check length and IDs)
  const prevIssues = prevProps.block.issues || [];
  const nextIssues = nextProps.block.issues || [];
  
  if (prevIssues.length !== nextIssues.length) return false;
  
  // Check if issue IDs and statuses are the same
  for (let i = 0; i < prevIssues.length; i++) {
    if (prevIssues[i].id !== nextIssues[i].id ||
        prevIssues[i].status !== nextIssues[i].status) {
      return false;
    }
  }
  
  return true;
});

OptimizedIssueTrackerBlock.displayName = 'OptimizedIssueTrackerBlock';

export default OptimizedIssueTrackerBlock;
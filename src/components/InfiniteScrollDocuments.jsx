import React, { useCallback, useRef, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Infinite scroll component for documents
 * Uses Intersection Observer for performance
 */
export default function InfiniteScrollDocuments({ 
  documents, 
  hasMore, 
  loading, 
  onLoadMore, 
  renderDocument,
  className = ''
}) {
  const observerRef = useRef(null);
  const loadMoreRef = useRef(null);

  /**
   * Set up intersection observer
   */
  useEffect(() => {
    if (loading) return;

    // Disconnect previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Create new observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          onLoadMore();
        }
      },
      {
        root: null,
        rootMargin: '100px', // Start loading 100px before reaching the end
        threshold: 0.1
      }
    );

    // Observe the load more element
    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loading, onLoadMore]);

  return (
    <div className={className}>
      {/* Document grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map((document, index) => (
          <div key={document.id} className="fade-in" style={{ animationDelay: `${index * 50}ms` }}>
            {renderDocument(document)}
          </div>
        ))}
      </div>

      {/* Load more trigger */}
      {hasMore && (
        <div 
          ref={loadMoreRef}
          className="flex items-center justify-center py-8"
        >
          {loading && (
            <div className="flex items-center gap-2 text-text-secondary">
              <Loader2 size={20} className="animate-spin" />
              <span>Loading more documents...</span>
            </div>
          )}
        </div>
      )}

      {/* No more documents */}
      {!hasMore && documents.length > 0 && (
        <div className="text-center py-8 text-text-secondary">
          You've reached the end
        </div>
      )}
    </div>
  );
}
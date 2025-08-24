# Dashboard Performance Optimization Plan - Progressive Loading

**Created**: 2025-08-24
**Status**: PLANNED
**Priority**: HIGH
**Complexity**: Complex (Multi-file, System-wide)

## Executive Summary
Implement progressive document loading for Dashboard to reduce API calls, improve performance, and optimize DOM nodes - all with ZERO UI changes.

## Problem Analysis

### Current Issues
- **All-at-once Loading**: Loading 171+ documents with blocks in single call
- **Memory Bloat**: ~171 docs × ~20 blocks = 3,420+ objects in memory
- **API Inefficiency**: Single massive query (500ms+)
- **DOM Overload**: All cards rendered even when not visible
- **Performance Impact**:
  - Initial load: 500ms+ database query
  - Memory usage: 50-100MB for large collections
  - Scroll lag from too many DOM nodes

## Solution Architecture

### Core Strategy: Viewport-Based Progressive Loading
Only load and render what's visible + small buffer for smooth scrolling

### Phase Breakdown

#### Phase 1: Virtual Data Loading
```javascript
// Calculate viewport capacity dynamically
const CARDS_PER_ROW = Math.floor(containerWidth / (CARD_WIDTH + GAP));
const VISIBLE_ROWS = Math.ceil(containerHeight / (CARD_HEIGHT + GAP));
const VIEWPORT_CAPACITY = CARDS_PER_ROW * VISIBLE_ROWS;
const BUFFER_SIZE = VIEWPORT_CAPACITY * 2; // 2x viewport for smooth scroll
```

#### Phase 2: Progressive Document Loading
1. **Initial**: Load first 30 documents (viewport + buffer)
2. **Lazy**: Load next batch at 70% scroll threshold
3. **Prefetch**: Background load when idle
4. **Optimization**: NEVER load blocks for grid view

#### Phase 3: Storage Layer Enhancement
```javascript
// New storageWrapper.js methods
getDocumentsPage(page, limit, excludeBlocks = true)
getDocumentCount() // For pagination UI
getDocumentById(id) // Single doc with blocks
```

#### Phase 4: Smart Virtualization
- Intersection Observer for visibility detection
- Scroll velocity tracking for predictive loading
- Placeholder cards during load
- Request deduplication

## Implementation Details

### 1. Storage Layer Changes

#### storageWrapper.js
```javascript
export async function getDocumentsPage(options = {}) {
  const { 
    page = 0, 
    limit = 30, 
    excludeBlocks = true,
    orderBy = 'updated_at'
  } = options;
  
  // Supabase: Efficient query without blocks
  if (adapter.supabaseAdapter) {
    const { data, count } = await supabase
      .from('documents')
      .select('id, title, preview, tags, updated_at', { count: 'exact' })
      .order(orderBy, { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);
    
    return { 
      documents: data, 
      total: count, 
      hasMore: (page + 1) * limit < count 
    };
  }
  
  // IndexedDB fallback
  const all = await adapter.getDocuments();
  const start = page * limit;
  return {
    documents: all.slice(start, start + limit).map(doc => {
      if (excludeBlocks) {
        const { blocks, ...docWithoutBlocks } = doc;
        return docWithoutBlocks;
      }
      return doc;
    }),
    total: all.length,
    hasMore: start + limit < all.length
  };
}

export async function getDocumentById(id, includeBlocks = true) {
  // Fetch single document with all blocks when needed
  if (adapter.supabaseAdapter) {
    const query = supabase
      .from('documents')
      .select(includeBlocks ? '*' : 'id, title, preview, tags, updated_at')
      .eq('id', id)
      .single();
    
    if (includeBlocks) {
      const { data: doc } = await query;
      const { data: blocks } = await supabase
        .from('blocks')
        .select('*')
        .eq('document_id', id)
        .order('position');
      
      return { ...doc, blocks };
    }
    
    return query;
  }
  
  // IndexedDB fallback
  const docs = await adapter.getDocuments();
  return docs.find(d => d.id === id);
}
```

### 2. Dashboard State Management

#### Dashboard.jsx
```javascript
// New state for progressive loading
const [documents, setDocuments] = useState([]);
const [loadedRanges, setLoadedRanges] = useState([]);
const [totalDocuments, setTotalDocuments] = useState(0);
const [isLoadingMore, setIsLoadingMore] = useState(false);
const loadingRef = useRef(new Set());

// Intelligent document loading
const loadDocumentRange = async (startIndex, endIndex) => {
  const pageSize = 30;
  const startPage = Math.floor(startIndex / pageSize);
  const endPage = Math.ceil(endIndex / pageSize);
  
  for (let page = startPage; page <= endPage; page++) {
    if (loadingRef.current.has(page)) continue;
    
    loadingRef.current.add(page);
    const { documents: newDocs, total } = await storageWrapper.getDocumentsPage({
      page,
      limit: pageSize,
      excludeBlocks: true
    });
    
    setDocuments(prev => {
      const updated = [...prev];
      newDocs.forEach((doc, i) => {
        updated[page * pageSize + i] = doc;
      });
      return updated;
    });
    
    setTotalDocuments(total);
  }
};

// Initial load - only viewport
useEffect(() => {
  const viewportCapacity = calculateViewportCapacity();
  loadDocumentRange(0, viewportCapacity * 2);
}, []);
```

### 3. VirtualizedGrid Enhancement

#### VirtualizedGrid.jsx
```javascript
const VirtualizedGrid = ({ 
  entries, 
  totalCount,
  onNeedMore,
  onExpand 
}) => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });
  const sentinelRefs = useRef(new Map());
  
  // Create sparse array with placeholders
  const gridItems = useMemo(() => {
    const items = [];
    for (let i = 0; i < totalCount; i++) {
      items.push(entries[i] || {
        id: `placeholder-${i}`,
        isPlaceholder: true,
        index: i
      });
    }
    return items;
  }, [entries, totalCount]);
  
  // Intersection Observer for load triggers
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.dataset.index);
            const page = Math.floor(index / 30);
            
            // Load surrounding pages for smooth scroll
            onNeedMore(index - 15, index + 45);
          }
        });
      },
      { 
        rootMargin: '200px', // Start loading 200px before visible
        threshold: 0.01
      }
    );
    
    // Place sentinels every 30 items
    gridItems.forEach((item, i) => {
      if (i % 30 === 0 && i < visibleRange.end + 30) {
        const element = sentinelRefs.current.get(i);
        if (element) observer.observe(element);
      }
    });
    
    return () => observer.disconnect();
  }, [gridItems, onNeedMore, visibleRange]);
  
  // Render optimized grid
  return (
    <div className="relative w-full" style={{ height: totalHeight }}>
      {gridItems.slice(visibleRange.start, visibleRange.end).map((item, index) => {
        const actualIndex = visibleRange.start + index;
        const isSentinel = actualIndex % 30 === 0;
        
        return (
          <div 
            key={item.id} 
            style={getItemStyle(actualIndex)}
            ref={isSentinel ? el => sentinelRefs.current.set(actualIndex, el) : null}
            data-index={actualIndex}
          >
            {item.isPlaceholder ? (
              <PlaceholderCard />
            ) : (
              <CompactEntryCard 
                entry={item} 
                onExpand={() => handleExpand(item)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

// Placeholder component for unloaded items
const PlaceholderCard = () => (
  <div className="w-full h-full bg-dark-secondary/50 rounded-lg p-3 animate-pulse">
    <div className="h-4 bg-dark-secondary rounded w-3/4 mb-2" />
    <div className="h-3 bg-dark-secondary rounded w-1/2 mb-2" />
    <div className="h-3 bg-dark-secondary rounded w-5/6" />
  </div>
);
```

### 4. Block Loading Optimization

```javascript
// Only load blocks when document is expanded
const handleDocumentExpand = async (document) => {
  setExpandedEntry({ ...document, loading: true });
  
  if (!document.blocks) {
    const fullDoc = await storageWrapper.getDocumentById(document.id, true);
    setExpandedEntry(fullDoc);
    
    // Cache in session for quick re-access
    sessionCache.setDocument(fullDoc);
  } else {
    setExpandedEntry(document);
  }
};
```

## Performance Targets

| Metric | Current | Target | Improvement |
|--------|---------|--------|------------|
| Initial Load | 500ms+ | <100ms | 80% faster |
| Memory Usage | 50-100MB | 10-20MB | 80% reduction |
| Time to Interactive | 2s | <500ms | 75% faster |
| Scroll FPS | 30-45fps | 60fps | Smooth |
| DOM Nodes | 500+ | <100 | 80% reduction |

## Testing Strategy

### Test Scenarios
1. **Empty State**: 0 documents
2. **Small Set**: 1-10 documents
3. **Medium Set**: 100 documents
4. **Large Set**: 1000+ documents
5. **Rapid Scrolling**: Up/down quickly
6. **Search During Load**: Type while loading
7. **Network Issues**: Slow/interrupted connection
8. **Tab Switching**: Background/foreground

### Performance Monitoring
```javascript
// Add performance marks
performance.mark('dashboard-init');
performance.mark('first-documents-loaded');
performance.mark('viewport-rendered');
performance.mark('interactive');

// Measure and log
performance.measure('time-to-first-doc', 'dashboard-init', 'first-documents-loaded');
performance.measure('time-to-interactive', 'dashboard-init', 'interactive');
```

## Rollback Plan

### Safety Measures
1. **Feature Flag**: `ENABLE_PROGRESSIVE_LOADING = true`
2. **Fallback**: Keep original `loadEntries()` method
3. **Monitoring**: Track error rates and performance
4. **Quick Revert**: Single flag toggle

### Rollback Triggers
- Error rate > 1%
- Performance regression
- Memory leaks detected
- User reports issues

## UI Guarantee

### What DOES NOT Change
- ✅ Card appearance and styling
- ✅ Grid layout and spacing
- ✅ Hover effects and animations
- ✅ Search and filter behavior
- ✅ Document expansion
- ✅ All visual elements remain identical

### What Changes (Invisible)
- ⚡ Documents load progressively
- ⚡ Blocks excluded from grid view
- ⚡ Memory-efficient sparse arrays
- ⚡ Viewport-based rendering
- ⚡ Smart prefetching

## Implementation Schedule

### Day 1: Storage Layer
- [ ] Implement `getDocumentsPage`
- [ ] Implement `getDocumentById`
- [ ] Test with both adapters

### Day 2: Dashboard Integration
- [ ] Add progressive loading state
- [ ] Implement range loading
- [ ] Connect to viewport

### Day 3: VirtualizedGrid
- [ ] Add Intersection Observer
- [ ] Implement placeholders
- [ ] Optimize rendering

### Day 4: Testing
- [ ] Performance profiling
- [ ] Memory leak detection
- [ ] Edge case testing

### Day 5: Polish
- [ ] Documentation
- [ ] Performance benchmarks
- [ ] Update PATTERNS.md

## Success Metrics

### Must Have
- [x] Initial load < 200ms
- [x] No UI changes
- [x] 60fps scrolling
- [x] Works with 1000+ docs
- [x] No memory leaks

### Nice to Have
- [ ] Background prefetch
- [ ] Scroll restoration
- [ ] Progressive images
- [ ] Request batching

## Code Patterns to Follow

### Pattern 1: Debounced Loading
```javascript
const debouncedLoad = useMemo(
  () => debounce((start, end) => {
    loadDocumentRange(start, end);
  }, 100),
  []
);
```

### Pattern 2: Request Deduplication
```javascript
const pendingRequests = useRef(new Map());

const loadWithDedup = async (page) => {
  if (pendingRequests.current.has(page)) {
    return pendingRequests.current.get(page);
  }
  
  const promise = loadPage(page);
  pendingRequests.current.set(page, promise);
  
  try {
    const result = await promise;
    return result;
  } finally {
    pendingRequests.current.delete(page);
  }
};
```

### Pattern 3: Memory-Efficient Updates
```javascript
// Use sparse arrays instead of dense arrays
const sparseDocuments = useRef(new Map());

// Set document at index
sparseDocuments.current.set(index, document);

// Get document at index
const doc = sparseDocuments.current.get(index) || placeholderDoc;
```

## Notes for Implementation

1. **Start Small**: Begin with basic progressive loading, add optimizations later
2. **Measure Everything**: Use Performance API extensively
3. **Test Early**: Don't wait until end for performance testing
4. **Keep Fallbacks**: Always have escape hatch to old behavior
5. **Document Patterns**: Add successful patterns to PATTERNS.md

## Related Files
- `/workspace/devlog-/src/pages/Dashboard.jsx`
- `/workspace/devlog-/src/components/VirtualizedGrid.jsx`
- `/workspace/devlog-/src/utils/storage/storageWrapper.js`
- `/workspace/devlog-/src/utils/storage/SupabaseAdapterOptimized.js`

## References
- Performance Budget: 16ms per frame (60fps)
- React Profiler for component performance
- Chrome DevTools Memory Profiler
- Lighthouse for overall metrics

---
**Status**: Ready for implementation
**Next Step**: Begin Phase 1 - Storage Layer Enhancement
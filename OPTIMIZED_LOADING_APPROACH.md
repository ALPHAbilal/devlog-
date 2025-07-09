# Optimized Skeleton Loading Approach

## Current Issues
1. **Guessing skeleton count** - Shows 5 skeletons initially, then adjusts causing layout shift
2. **Streaming overhead** - Individual block loading with artificial delays (30-50ms per block)
3. **Complex state management** - Multiple re-renders during loading
4. **Generic skeletons** - All text blocks show same skeleton regardless of content

## Optimized Solution

### 1. **Single Query Loading**
```javascript
// Instead of streaming, load all blocks at once
const { data: blocks } = await supabase
  .from('blocks')
  .select('*')
  .eq('document_id', documentId)
  .order('position');
```
- **Benefit**: 1 query vs N queries (much faster)
- **Tradeoff**: No progressive loading, but total time is still faster

### 2. **Smart Skeleton Generation**
```javascript
// Generate skeletons based on actual content
static estimateBlockHeight(block) {
  switch (block.type) {
    case 'text':
      const lines = Math.ceil(block.content.length / 80);
      return BASE_PADDING + (lines * 20);
    // ... other types
  }
}
```
- **Benefit**: Skeletons match actual content size, no layout shift

### 3. **Efficient Caching**
```javascript
// 5-second cache for blocks
if (this.cache.has(documentId)) {
  const cached = this.cache.get(documentId);
  if (Date.now() - cached.timestamp < 5000) {
    return { blocks: cached.blocks, fromCache: true };
  }
}
```
- **Benefit**: Instant loading when navigating back

### 4. **Preloading Strategy**
```javascript
// Preload blocks for nearby documents
async preloadDocuments(documentIds) {
  const { data: blocks } = await supabase
    .from('blocks')
    .select('*')
    .in('document_id', uncachedIds);
}
```
- **Benefit**: Next document loads instantly

### 5. **CSS-Only Skeleton Animation**
```css
.skeleton-content {
  background: linear-gradient(90deg, transparent, shimmer, transparent);
  animation: skeleton-shimmer 1.5s infinite;
}
```
- **Benefit**: No JS overhead for animations

## Implementation Steps

1. **Replace blockStreamer** with optimizedBlockLoader
2. **Update ExpandedViewEnhanced** to use new hook
3. **Add skeleton CSS** to global styles
4. **Implement preloading** in Dashboard hover events

## Performance Improvements

### Before:
- 5 skeleton blocks → adjust to N → replace one by one
- N database queries (one per block)
- 30-50ms delay per block
- Total time: ~2-3 seconds for 20 blocks

### After:
- Exact skeleton count from start
- 1 database query
- No artificial delays
- Total time: ~200-400ms for 20 blocks

## Usage Example

```jsx
import { useOptimizedBlockLoader } from '../hooks/useOptimizedBlockLoader';

function ExpandedView({ entry, onClose }) {
  const { blocks, isLoading, updateBlocks } = useOptimizedBlockLoader(entry.id, entry);
  
  return (
    <div>
      {blocks.map(block => 
        block.isLoading ? (
          <OptimizedBlockSkeleton 
            key={block.id}
            type={block.type}
            estimatedHeight={block.estimatedHeight}
          />
        ) : (
          <Block key={block.id} block={block} />
        )
      )}
    </div>
  );
}
```

## Additional Optimizations

1. **Virtual Scrolling** - For documents with 100+ blocks
2. **Intersection Observer** - Load blocks only when visible
3. **Web Workers** - Parse markdown in background
4. **Service Worker** - Cache API responses
5. **Optimistic Updates** - Show changes immediately
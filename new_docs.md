Yes, there are several proven solutions to fix the infinite render loop issue with @tanstack/react-virtual when your FileTreeBlock component changes height during render. Here are the most effective approaches:

## Solution 1: Use Custom measureElement with Animation Frame (Recommended)

The primary solution is to enable the `useAnimationFrameWithResizeObserver` option and/or create a custom `measureElement` function to prevent measurement oscillations:[1][2]

```jsx
const virtualizer = useVirtualizer({
  count: items.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 45,
  // Enable animation frame for measurements
  useAnimationFrameWithResizeObserver: true,
  // Custom measure function to prevent oscillations
  measureElement: (element) => {
    if (!element) return 0;
    
    // Use cached height if available and element isn't changing
    const cachedHeight = element.getAttribute('data-cached-height');
    if (cachedHeight) {
      return parseFloat(cachedHeight);
    }
    
    // Measure and cache the result
    const height = element.getBoundingClientRect().height;
    element.setAttribute('data-cached-height', height.toString());
    return height;
  }
});
```

## Solution 2: Stable Height Strategy

Since your FileTreeBlock oscillates between 274px and 324px (50px difference), implement height stabilization:

```jsx
const useStableHeight = () => {
  const heightCache = useRef(new Map());
  
  const measureElement = useCallback((element) => {
    if (!element) return 0;
    
    const index = element.getAttribute('data-index');
    const currentHeight = element.getBoundingClientRect().height;
    
    // Get cached height for this index
    const cachedHeight = heightCache.current.get(index);
    
    if (cachedHeight) {
      // If height difference is small (like your 50px oscillation), 
      // stick with cached value to prevent loops
      const heightDiff = Math.abs(currentHeight - cachedHeight);
      if (heightDiff < 60) { // Slightly higher than your 50px oscillation
        return cachedHeight;
      }
    }
    
    // Cache the new height
    heightCache.current.set(index, currentHeight);
    return currentHeight;
  }, []);
  
  return measureElement;
};

// Usage
const customMeasureElement = useStableHeight();

const virtualizer = useVirtualizer({
  count: items.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 299, // Use average of 274px and 324px
  measureElement: customMeasureElement,
});
```

## Solution 3: Prevent FileTreeBlock Internal Height Changes

Address the root cause by stabilizing the FileTreeBlock component itself:

```jsx
const FileTreeBlock = React.memo(({ data, isExpanded, ...props }) => {
  // Fix: Use stable dimensions to prevent height oscillation
  const [stableHeight, setStableHeight] = useState(null);
  const elementRef = useRef(null);
  
  useLayoutEffect(() => {
    if (elementRef.current && !stableHeight) {
      // Measure once and stick with it
      const height = elementRef.current.getBoundingClientRect().height;
      setStableHeight(height);
    }
  }, [stableHeight]);
  
  return (
    <div 
      ref={elementRef}
      style={{
        // Force stable height to prevent oscillation
        height: stableHeight || 'auto',
        minHeight: stableHeight || 'auto'
      }}
    >
      {/* Your FileTreeBlock content */}
    </div>
  );
});
```

## Solution 4: Use resizeItem for Manual Control

Take manual control over height updates using `resizeItem`:[2]

```jsx
const virtualizer = useVirtualizer({
  count: items.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 299,
  // Disable automatic measurement
  measureElement: undefined,
});

// Manually control height updates
const handleHeightChange = useCallback((index, newHeight) => {
  // Only update if height change is significant (avoid oscillation)
  const currentHeight = virtualizer.getVirtualItems()
    .find(item => item.index === index)?.size || 299;
    
  if (Math.abs(newHeight - currentHeight) > 10) {
    // Use throttled update to prevent rapid changes
    virtualizer.resizeItem(index, newHeight);
  }
}, [virtualizer]);

// In your FileTreeBlock component
const FileTreeBlock = ({ index, onHeightChange }) => {
  const elementRef = useRef(null);
  
  useLayoutEffect(() => {
    if (elementRef.current) {
      const height = elementRef.current.getBoundingClientRect().height;
      onHeightChange(index, height);
    }
  });
  
  return <div ref={elementRef}>{/* content */}</div>;
};
```

## Solution 5: Throttled ResizeObserver (Alternative)

If the built-in `useAnimationFrameWithResizeObserver` isn't sufficient, implement your own throttled observer:[1][2]

```jsx
const useThrottledMeasurement = () => {
  const pendingMeasurements = useRef(new Set());
  const measurementFrame = useRef(null);
  
  const measureElement = useCallback((element) => {
    if (!element) return 0;
    
    const index = element.getAttribute('data-index');
    
    // Throttle measurements using requestAnimationFrame
    if (!pendingMeasurements.current.has(index)) {
      pendingMeasurements.current.add(index);
      
      if (measurementFrame.current) {
        cancelAnimationFrame(measurementFrame.current);
      }
      
      measurementFrame.current = requestAnimationFrame(() => {
        const height = element.getBoundingClientRect().height;
        pendingMeasurements.current.delete(index);
        return height;
      });
    }
    
    // Return cached or estimated height while waiting
    return parseFloat(element.getAttribute('data-cached-height')) || 299;
  }, []);
  
  return measureElement;
};
```

## Recommended Implementation

Based on your specific issue with 50px oscillation, here's the most practical solution:

```jsx
const FileTreeVirtualizer = ({ items }) => {
  const parentRef = useRef(null);
  
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 299, // Average of your oscillating heights
    useAnimationFrameWithResizeObserver: true, // Enable built-in fix
    measureElement: (element) => {
      if (!element) return 299;
      
      const currentHeight = element.getBoundingClientRect().height;
      const cachedHeight = parseFloat(element.getAttribute('data-cached-height') || '0');
      
      // Prevent oscillation by using cached height if difference is small
      if (cachedHeight && Math.abs(currentHeight - cachedHeight) < 60) {
        return cachedHeight;
      }
      
      element.setAttribute('data-cached-height', currentHeight.toString());
      return currentHeight;
    }
  });

  return (
    <div ref={parentRef} style={{ height: '400px', overflow: 'auto' }}>
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            data-index={virtualItem.index}
            ref={virtualizer.measureElement}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <FileTreeBlock 
              data={items[virtualItem.index]}
              // Add stable props to prevent internal height changes
            />
          </div>
        ))}
      </div>
    </div>
  );
};
```

The key is to combine the built-in `useAnimationFrameWithResizeObserver` option with height stabilization logic to prevent the 50px oscillation that's causing your infinite render loop.[3][2][1]


# TanStack React Virtual - Complete Documentation

## Overview

TanStack Virtual is a headless UI utility for virtualizing long lists of elements in React. It provides efficient rendering of large datasets by only rendering visible items, dramatically improving performance for applications with thousands or millions of list items.

## Installation

```bash
npm install @tanstack/react-virtual
```

## Key Features

- **Headless**: No built-in UI components - you retain 100% control over markup and styles
- **Framework Agnostic**: Works with React, Vue, Svelte, Solid, Lit, and Angular
- **High Performance**: Only renders visible items with 60FPS performance
- **Flexible**: Supports vertical, horizontal, and grid virtualization
- **Dynamic Heights**: Automatic measurement of dynamic content heights
- **TypeScript**: Full TypeScript support built-in

## Core Concepts

### The Virtualizer

At the heart of TanStack Virtual is the `Virtualizer` class. Virtualizers can be oriented on either the vertical (default) or horizontal axes, making it possible to achieve vertical, horizontal, and grid-like virtualization.

### Three-Layer DOM Structure

TanStack Virtual uses a three-layer DOM structure:
1. **Outer Container**: The scrollable element with fixed dimensions
2. **Inner Spacer**: A large container that represents the total size of all items
3. **Virtual Items**: Only the visible items, positioned absolutely within the spacer

## Basic Usage

### Simple Fixed-Size List

```jsx
import React from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

function BasicList() {
  // The scrollable element for your list
  const parentRef = React.useRef(null);

  // The virtualizer
  const rowVirtualizer = useVirtualizer({
    count: 10000,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 35,
  });

  return (
    <>
      {/* The scrollable element for your list */}
      <div
        ref={parentRef}
        style={{
          height: `400px`,
          overflow: 'auto', // Make it scroll!
        }}
      >
        {/* The large inner element to hold all of the items */}
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {/* Only the visible items in the virtualizer */}
          {rowVirtualizer.getVirtualItems().map((virtualItem) => (
            <div
              key={virtualItem.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              Row {virtualItem.index}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
```

### Dynamic Height List

```jsx
import React from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

function DynamicList({ items }) {
  const parentRef = React.useRef(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 45, // Estimate for dynamic content
  });

  return (
    <div
      ref={parentRef}
      style={{
        height: `400px`,
        overflow: 'auto',
      }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            data-index={virtualItem.index} // Important for measurement
            ref={virtualizer.measureElement} // This measures the element
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <div style={{ padding: '10px' }}>
              {items[virtualItem.index]}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## API Reference

### useVirtualizer Hook

```typescript
function useVirtualizer<TScrollElement, TItemElement = unknown>(
  options: VirtualizerOptions<TScrollElement, TItemElement>
): Virtualizer<TScrollElement, TItemElement>
```

### useWindowVirtualizer Hook

```typescript
function useWindowVirtualizer<TItemElement = unknown>(
  options: VirtualizerOptions<Window, TItemElement>
): Virtualizer<Window, TItemElement>
```

For full-page virtualization where the entire window is the scroll element.

## Configuration Options

### Core Options

#### `count: number`
The total number of items in your list.

#### `getScrollElement: () => TScrollElement`
A function that returns the scrollable element. Usually `() => parentRef.current`.

#### `estimateSize: (index: number) => number`
A function that estimates the size of each item. For dynamic content, this is the initial estimate.

#### `horizontal?: boolean`
Set to `true` for horizontal virtualization. Default: `false`.

### Advanced Options

#### `overscan?: number`
The number of items to render outside of the visible area. Default: `1`.

#### `paddingStart?: number`
Padding at the start of the list in pixels.

#### `paddingEnd?: number`
Padding at the end of the list in pixels.

#### `scrollMargin?: number`
Margin around the scroll area.

#### `gap?: number`
Gap between items in pixels.

#### `indexAttribute?: string`
The attribute name for the index. Default: `'data-index'`.

#### `initialOffset?: number`
Initial scroll offset when the virtualizer mounts.

#### `onChange?: (instance: Virtualizer, sync: boolean) => void`
Callback fired when the virtualizer's internal state changes.

#### `measureElement?: (element: TItemElement, entry: ResizeObserverEntry | undefined, instance: Virtualizer) => number`
Custom function to measure elements. Useful for advanced measurement strategies.

#### `rangeExtractor?: (range: Range) => number[]`
Custom function to extract which items should be rendered from the visible range.

#### `scrollToFn?: (offset: number, canSmooth: boolean, instance: Virtualizer) => void`
Custom scroll function. Useful for implementing smooth scrolling.

## Virtualizer Instance Methods

### `getVirtualItems(): VirtualItem[]`
Returns array of virtual items that should be rendered.

### `getTotalSize(): number`
Returns the total size of all items in pixels.

### `scrollToOffset(offset: number, options?: ScrollToOptions): void`
Scroll to a specific pixel offset.

### `scrollToIndex(index: number, options?: ScrollToOptions): void`
Scroll to a specific item index.

### `measureElement(element: Element): void`
Measure a specific element. Call this in your ref callback for dynamic sizing.

### `getVirtualIndexes(): number[]`
Returns array of indexes that are currently virtualized.

## Virtual Item Properties

Each virtual item returned by `getVirtualItems()` has:

- `key: string` - Unique key for React rendering
- `index: number` - The item's index in the original list
- `start: number` - Pixel position where the item starts
- `end: number` - Pixel position where the item ends
- `size: number` - Current size of the item in pixels

## Examples

### Horizontal List

```jsx
const columnVirtualizer = useVirtualizer({
  horizontal: true,
  count: columns.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 100,
});

return (
  <div
    ref={parentRef}
    style={{
      width: `400px`,
      height: `100px`,
      overflow: 'auto',
    }}
  >
    <div
      style={{
        width: `${columnVirtualizer.getTotalSize()}px`,
        height: '100%',
        position: 'relative',
      }}
    >
      {columnVirtualizer.getVirtualItems().map((virtualColumn) => (
        <div
          key={virtualColumn.key}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: `${virtualColumn.size}px`,
            transform: `translateX(${virtualColumn.start}px)`,
          }}
        >
          Column {virtualColumn.index}
        </div>
      ))}
    </div>
  </div>
);
```

### Grid Virtualization

```jsx
function VirtualGrid({ rows, columns }) {
  const parentRef = React.useRef(null);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
  });

  const columnVirtualizer = useVirtualizer({
    horizontal: true,
    count: columns.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
  });

  return (
    <div
      ref={parentRef}
      style={{
        height: `400px`,
        width: `600px`,
        overflow: 'auto',
      }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: `${columnVirtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => (
          <React.Fragment key={virtualRow.key}>
            {columnVirtualizer.getVirtualItems().map((virtualColumn) => (
              <div
                key={virtualColumn.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: `${virtualColumn.size}px`,
                  height: `${virtualRow.size}px`,
                  transform: `translateX(${virtualColumn.start}px) translateY(${virtualRow.start}px)`,
                }}
              >
                Cell {virtualRow.index}, {virtualColumn.index}
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
```

### Infinite Loading

```jsx
function InfiniteList({ items, hasNextPage, fetchNextPage, isFetchingNextPage }) {
  const parentRef = React.useRef(null);

  const virtualizer = useVirtualizer({
    count: hasNextPage ? items.length + 1 : items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 45,
    overscan: 20,
  });

  React.useEffect(() => {
    const [lastItem] = [...virtualizer.getVirtualItems()].reverse();

    if (!lastItem) return;

    if (
      lastItem.index >= items.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [
    hasNextPage,
    fetchNextPage,
    items.length,
    isFetchingNextPage,
    virtualizer.getVirtualItems(),
  ]);

  return (
    <div
      ref={parentRef}
      style={{
        height: `400px`,
        overflow: 'auto',
      }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
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
            {virtualItem.index > items.length - 1 ? (
              <div>Loading...</div>
            ) : (
              <div>{items[virtualItem.index]}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Custom Smooth Scrolling

```jsx
import { elementScroll } from '@tanstack/react-virtual';

function SmoothScrollList() {
  const parentRef = React.useRef(null);
  const scrollingRef = React.useRef();

  const scrollToFn = React.useCallback((offset, canSmooth, instance) => {
    const duration = 1000;
    const start = parentRef.current?.scrollTop || 0;
    const startTime = (scrollingRef.current = Date.now());

    const run = () => {
      if (scrollingRef.current !== startTime) return;
      
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const interpolated = start + (offset - start) * progress;

      if (elapsed < duration) {
        elementScroll(interpolated, canSmooth, instance);
        requestAnimationFrame(run);
      } else {
        elementScroll(interpolated, canSmooth, instance);
      }
    };

    requestAnimationFrame(run);
  }, []);

  const virtualizer = useVirtualizer({
    count: 10000,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 35,
    scrollToFn,
  });

  return (
    <div>
      <button onClick={() => virtualizer.scrollToIndex(Math.floor(Math.random() * 10000))}>
        Scroll To Random Index
      </button>
      
      <div
        ref={parentRef}
        style={{
          height: `400px`,
          overflow: 'auto',
        }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => (
            <div
              key={virtualItem.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              Row {virtualItem.index}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

## Performance Tips

### 1. Accurate Size Estimation
Provide accurate `estimateSize` values to minimize layout shifts:

```jsx
const estimateSize = (index) => {
  // Return accurate estimates based on your content
  return items[index]?.content?.length > 100 ? 80 : 40;
};
```

### 2. Optimize measureElement
For dynamic heights, avoid expensive operations in render:

```jsx
const measureElement = React.useCallback((element) => {
  // Cache measurements when possible
  return element.getBoundingClientRect().height;
}, []);
```

### 3. Use Proper Keys
Always use stable keys for React rendering:

```jsx
{virtualizer.getVirtualItems().map((virtualItem) => (
  <div key={virtualItem.key}> {/* Use virtualItem.key */}
    {/* Content */}
  </div>
))}
```

### 4. Optimize Overscan
Adjust overscan based on your scroll behavior:

```jsx
const virtualizer = useVirtualizer({
  // ... other options
  overscan: 5, // Render 5 extra items outside visible area
});
```

## Common Patterns

### Sticky Headers

```jsx
const rangeExtractor = React.useCallback((range) => {
  const start = Math.max(range.startIndex - 1, 0);
  const end = Math.min(range.endIndex + 1, itemCount - 1);
  
  const next = [];
  
  // Always include header
  if (start > 0) {
    next.push(0);
  }
  
  // Include visible range
  for (let i = start; i <= end; i++) {
    next.push(i);
  }
  
  return next;
}, [itemCount]);
```

### Variable Content

```jsx
const virtualizer = useVirtualizer({
  count: items.length,
  getScrollElement: () => parentRef.current,
  estimateSize: (index) => {
    const item = items[index];
    // Estimate based on content
    if (item.type === 'header') return 60;
    if (item.type === 'large') return 120;
    return 40;
  },
});
```

## Troubleshooting

### Common Issues

1. **Items not rendering**: Make sure `data-index` attribute is set
2. **Scroll jumping**: Provide accurate `estimateSize` values
3. **Performance issues**: Optimize your render function and use React.memo
4. **Heights not updating**: Ensure `measureElement` is called in ref callback

### Debug Tools

```jsx
// Log virtualizer state
React.useEffect(() => {
  console.log('Virtual items:', virtualizer.getVirtualItems());
  console.log('Total size:', virtualizer.getTotalSize());
}, [virtualizer.getVirtualItems()]);
```

## TypeScript Support

TanStack Virtual has full TypeScript support:

```typescript
interface Item {
  id: string;
  content: string;
}

const virtualizer = useVirtualizer<HTMLDivElement, HTMLDivElement>({
  count: items.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 45,
});
```

## Migration from react-window

Key differences when migrating from react-window:

1. **No predefined components** - Use `useVirtualizer` hook instead
2. **Manual markup** - You control all the HTML structure
3. **Built-in auto-sizing** - No need for separate AutoSizer package
4. **Dynamic heights** - Automatic measurement with `measureElement`
5. **More flexible** - Single hook handles all virtualization types

This documentation covers the complete API and common use cases for TanStack React Virtual. The library's headless approach gives you maximum flexibility while providing excellent performance for large lists.
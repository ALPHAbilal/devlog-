# React Virtuoso Documentation

## Overview

React Virtuoso is a powerful virtual list, grid, and table component for React. It automatically handles items with variable heights, observes changes due to resizing or dynamic content, and supports endless/infinite scrolling with high performance. It's ideal for document editors, chat UIs, and dynamic blocks that change size.

Features include:
- Variable-sized items with no manual measurement
- Customizable rendering structure
- Sticky headers/footers
- Responsive grid & masonry layouts
- Infinite scroll (endReached/startReached)
- Dynamic data loading
- ScrollToIndex/API methods
- Full TypeScript support

---
## Installation

```bash
npm install react-virtuoso
```

---
## Core Components

| Component         | Purpose                                    |
|------------------|--------------------------------------------|
| Virtuoso         | Flat lists                                 |
| GroupedVirtuoso  | Grouped lists (with sticky headers)        |
| VirtuosoGrid     | Responsive grid with same-sized items      |
| TableVirtuoso    | Virtualized tables                         |
| MessageList      | Bidirectional chat/message lists           |
| Masonry          | Columns of varied-height items (gallery)   |

---
## Example: Flat List

```jsx
import { Virtuoso } from "react-virtuoso";
function App() {
  return (
    <Virtuoso
      style={{ height: '400px' }}
      totalCount={10000}
      itemContent={index => <div>Item {index}</div>}
    />
  );
}
```

---
## Example: Infinite Scroll

```jsx
import { Virtuoso } from "react-virtuoso";
function InfiniteList({ items, loadMore }) {
  return (
    <Virtuoso
      style={{ height: '400px' }}
      data={items}
      endReached={loadMore}
      itemContent={(index, item) => <div>{item.text}</div>}
    />
  );
}
```

- `endReached` is called when user reaches the end of list so you can load more items.
- Use `startReached` for top endless scroll (reverse chat).

---
## Dynamic Height Content
Virtuoso observes item resize automatically.

```jsx
itemContent={(index, item) => <FileTreeBlock data={item} />}
```
No need for measureElement/data-index—Virtuoso handles everything out-of-the-box.

---
## Grouped Lists with Sticky Headers
```jsx
import { GroupedVirtuoso } from "react-virtuoso";
<GroupedVirtuoso
  groupCounts={[20, 30]}
  groupContent={groupIndex => <div>Group {groupIndex}</div>}
  itemContent={(index, item) => <div>Item {item}</div>}
/>
```

---
## Grid & Masonry Usage
```jsx
import { VirtuosoGrid } from "react-virtuoso";
<VirtuosoGrid
  data={items}
  itemContent={(index, item) => <div style={{height: item.height}}>Grid {item.text}</div>}
/>
```
Masonry lays out columns of varying-height items—no custom measurement needed!

---
## Custom Structure & Components
Customize structure with `components` prop:
```jsx
import { Virtuoso } from "react-virtuoso";
const Header = () => <div>Header</div>;
const Footer = () => <div>Footer</div>;
const List = React.forwardRef((props, ref) => <div {...props} ref={ref} />);
<Virtuoso
  style={{height: '100vh'}}
  totalCount={100}
  components={{ Header, Footer, List }}
  itemContent={i => `Item ${i}`}
/>
```

---
## Scroll to Index (API methods)
You can call methods using the `ref`:
```jsx
const virtuosoRef = useRef(null);
<Virtuoso ref={virtuosoRef} ... />

// Scroll to item index 10
virtuosoRef.current.scrollToIndex({ index: 10, align: "center" });
```
Other available methods:
- `scrollTo(offset)` – scroll by pixel offset
- `scrollIntoView(index)` – scrolls to item if out of view
- `getState(cb)` – get the internal scroll state

---
## Endless Scrolling Patterns
For chat or document editors with loading at top/bottom:
```jsx
<Virtuoso
  data={items}
  startReached={fetchMoreUpwards}
  endReached={fetchMoreDownwards}
/>
```
If reversed, you may need to invert container and use endReached for "top" loading.

---
## Performance Best Practices
- Use `React.memo` for complex items inside `itemContent` to avoid frequent unmounting/remounting.
- Minimize CSS margins inside items; use padding for vertical spacing to ensure accurate height measurements.
- Use `increaseViewportBy` prop to render extra content beyond viewport.
- Optimize images and content that may cause scroll jank.

---
## Caveats
- Do NOT use inline function components for custom structure; declare them outside render scope.
- CSS margins are NOT counted in measurements (use padding instead).
- Legacy browsers may require ResizeObserver polyfill.

---
## API Reference – Key Props

### VirtuosoProps
- `totalCount`: number (for static lists)
- `data`: any[] (dynamic lists)
- `itemContent`: (index, data?) => ReactNode
- `endReached`: (lastIndex) => void
- `startReached`: (firstIndex) => void
- `groupContent`, `groupCounts` (for grouped lists)
- `components`: { Header, Footer, List, Item, EmptyPlaceholder, ... }
- `style`, `className`: container styles
- `increaseViewportBy`: { top: number, bottom: number }
- `scrollSeekConfiguration`: advanced scroll seeking behavior

### VirtuosoHandle Methods
- `scrollToIndex(location)`
- `scrollBy(location)`
- `scrollTo(location)`
- `scrollIntoView(location)`
- `autoscrollToBottom()`
- `getState(cb)`

---
## TypeScript Support
All core methods, props, and events are typed with generics for full type safety. See the Virtuoso API interfaces for advanced usage and customizations.

---
## Useful Links
- [Getting Started](https://virtuoso.dev)
- [API Reference](https://virtuoso.dev/virtuoso-api/)
- [Endless Scrolling](https://virtuoso.dev/endless-scrolling/)
- [Scroll to Index](https://virtuoso.dev/scroll-to-index/)
- [Customize Structure](https://virtuoso.dev/customize-structure/)

This documentation covers everything needed for robust integration and advanced customization. Adjust code examples for your document editor, chat UI, or block setup. For production, always consult the latest Virtuoso documentation and examples for edge-case best practices.
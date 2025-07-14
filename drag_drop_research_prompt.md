# Advanced Drag and Drop UX Patterns with @dnd-kit - Research Prompt

## Current Implementation Issues

We're building a document management app (DevLog) using @dnd-kit for drag and drop functionality. We're experiencing several UX issues that need expert solutions:

### 1. **Cursor Position Misalignment**
- When dragging starts, the drag overlay appears offset from the actual cursor position
- The drag handle is positioned outside the card (`-left-8`), which may be causing calculation issues
- The dragged element doesn't follow the cursor precisely, creating a disconnected feeling

### 2. **Double Card Visual Problem**
- Both the original card (with 30% opacity) and the drag overlay are visible simultaneously
- This creates a confusing "double card" effect that doesn't look professional
- Users see two versions of the same card, which breaks the illusion of physically moving an element

### 3. **Technical Setup**
```javascript
// Current implementation
const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
  id: entry.id,
  data: { type: 'document', entry }
});

// Styling approach
className={`... ${isDragging ? 'z-50 shadow-2xl opacity-30' : ''}`}

// Drag handle position
className="absolute -left-8 top-1/2 -translate-y-1/2"
```

## Research Questions

### 1. **Precise Cursor Tracking**
- How can we make the drag overlay appear exactly where the user clicks, not offset?
- What's the best way to handle `activatorOffset` when the drag handle is outside the draggable element?
- Should we use `clientOffset`, `initialRect`, or custom transform calculations?
- How to prevent the "jump" effect when dragging starts?

### 2. **Original Element Visibility**
- **Option A**: Hide original completely (`opacity: 0` or `visibility: hidden`)
- **Option B**: Keep dimmed original as placeholder (current approach)
- **Option C**: Replace with simplified placeholder
- What do modern apps (Notion, Linear, Trello, Asana) do?
- What's the best UX pattern according to research?

### 3. **@dnd-kit Specific Solutions**
- How to properly configure `DragOverlay` for smooth, cursor-aligned dragging?
- Best practices for `dropAnimation` configuration
- Using `modifiers` to enhance drag behavior
- Custom drag overlay positioning techniques

### 4. **Performance & Smoothness**
- Optimal animation timings and easing functions
- How to eliminate visual artifacts during drag
- GPU acceleration techniques for smooth 60fps dragging
- Handling multiple selected items dragging

### 5. **Accessibility & Mobile**
- Touch-friendly drag handle sizing and positioning
- Keyboard navigation alternatives
- Screen reader announcements for drag operations
- Mobile gesture handling

## Desired Implementation Examples

Please provide:

1. **Code example for perfect cursor alignment**:
```javascript
// Example structure needed
const handleDragStart = (event) => {
  // How to calculate proper offset?
  // How to position overlay at cursor?
};
```

2. **Best practice for original element handling**:
```javascript
// Should we do this?
style={{ opacity: isDragging ? 0 : 1 }}
// Or this?
style={{ visibility: isDragging ? 'hidden' : 'visible' }}
// Or something else?
```

3. **Modern drag overlay patterns**:
- Simplified card during drag?
- Exact clone?
- Transformed version?
- Multiple items stack visualization?

4. **Industry standards research**:
- Screenshot examples from leading apps
- UX research on drag feedback
- User testing results if available

## Technical Context

- **Framework**: React 18
- **Drag library**: @dnd-kit/core v6.1.0, @dnd-kit/modifiers v7.0.0
- **Styling**: Tailwind CSS
- **Features**: Multi-select drag, project folders, document cards
- **Design**: Dark theme, card-based layout

## Expected Deliverables

1. Concrete code solutions for cursor alignment
2. Best practice recommendation for original element visibility
3. Performance optimization techniques
4. Examples from successful implementations
5. Accessibility guidelines
6. Mobile-specific considerations

Please prioritize practical, implementable solutions with code examples over theoretical explanations.
# World-Class UX patterns for block controls: A comprehensive guide

Modern block-based interfaces demand interaction patterns that balance power with simplicity. Industry leaders like Notion, Linear, and Figma have pioneered approaches that reduce clicks, provide instant feedback, and create delightful experiences. This research synthesizes their best practices with production-ready implementation strategies for your React 19 stack.

## The click reduction imperative

Your current implementation requires multiple clicks for simple actions—a friction point that compounds across dozens of blocks. **Linear's approach demonstrates that every millisecond matters**: their entire interface philosophy centers on "instant" interactions, achieving perceived zero-latency through optimistic updates and aggressive performance optimization.

The most successful block interfaces share three core principles:
1. **Direct manipulation** over menu navigation
2. **Contextual revelation** of controls
3. **Physics-based feedback** that feels natural

## Industry leader strategies

### Notion's hover-first architecture
Notion minimizes clicks through their **six-dot handle pattern** that appears on hover. This approach provides immediate visual affordance without cluttering the interface. On desktop, hovering reveals the handle, clicking shows options, and dragging enables direct manipulation. Their key innovation is the **universal block transformation** system—any block can become any other block type through the "Turn into" functionality, reducing decision paralysis during content creation.

For mobile, Notion switches to persistent controls since hover isn't available. The lesson: design for the **least capable interaction mode first**, then enhance for more capable devices.

### Linear's command-first philosophy
Linear takes a different approach with their **universal command palette** (Cmd+K). This pattern has become the gold standard for power users, offering:
- Fuzzy search across all actions
- Context-aware suggestions
- Zero-click execution for common tasks
- Learning algorithms that surface frequently used commands

Their **optimistic update pattern** makes every interaction feel instant by updating the UI immediately before server confirmation. This psychological trick, combined with ~16ms response times, creates the perception of zero latency.

### Figma's smart selection innovation
Figma excels at **dense UI optimization** through their smart selection system. When users select multiple objects with uniform spacing, pink handles automatically appear between objects for direct spacing adjustment. This contextual control revelation eliminates the need for separate spacing tools or dialogs.

Their approach demonstrates that **intelligent automation** can dramatically reduce interaction steps. By detecting patterns in user selections, Figma surfaces exactly the right controls at exactly the right time.

## Alternative UX patterns ranked by efficiency

### 1. Inline Action Bar (Recommended for your use case)
This pattern addresses your exact pain points by exposing primary actions without requiring a menu click:

```javascript
const InlineActionBar = ({ block, isActive }) => {
  const [showActions, setShowActions] = useState(false);
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      className="inline-action-bar"
      initial={false}
      animate={{ 
        opacity: isActive || showActions ? 1 : 0,
        y: isActive || showActions ? 0 : 10 
      }}
      transition={{ 
        duration: reducedMotion ? 0 : 0.2,
        ease: [0.4, 0, 0.2, 1] 
      }}
      onHoverStart={() => setShowActions(true)}
      onHoverEnd={() => setShowActions(false)}
    >
      <button onClick={() => handleMove('up')} aria-label="Move block up">
        <ChevronUp className="w-4 h-4" />
      </button>
      <button onClick={() => handleMove('down')} aria-label="Move block down">
        <ChevronDown className="w-4 h-4" />
      </button>
      <button onClick={handleDuplicate} aria-label="Duplicate block">
        <Copy className="w-4 h-4" />
      </button>
      <button onClick={handleDelete} aria-label="Delete block">
        <Trash2 className="w-4 h-4" />
      </button>
    </motion.div>
  );
};
```

**Benefits**: Single click for any action, always visible on hover/focus, natural dismissal when moving away.

### 2. Command Palette with Block Actions
Implement a Linear-style command system for keyboard-first users:

```javascript
const useCommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const commands = [
    { id: 'duplicate', label: 'Duplicate block', shortcut: '⌘D' },
    { id: 'delete', label: 'Delete block', shortcut: '⌘⌫' },
    { id: 'transform', label: 'Transform block...', shortcut: '⌘T' },
    { id: 'move-up', label: 'Move block up', shortcut: '⌘↑' },
    { id: 'move-down', label: 'Move block down', shortcut: '⌘↓' },
  ];

  return { isOpen, setIsOpen, commands };
};
```

### 3. Swipe Actions for Mobile
Leverage native mobile gestures for common actions:

```javascript
const SwipeableBlock = ({ block, onDelete, onDuplicate }) => {
  const handlers = useSwipeable({
    onSwipedLeft: () => revealAction('delete'),
    onSwipedRight: () => revealAction('duplicate'),
    trackMouse: true,
    threshold: 30,
  });

  return (
    <div {...handlers} className="swipeable-block">
      <motion.div
        animate={{ x: swipeOffset }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {block.content}
      </motion.div>
      <div className="swipe-actions">
        <button className="delete-action">Delete</button>
        <button className="duplicate-action">Duplicate</button>
      </div>
    </div>
  );
};
```

## Click-outside dismissal that actually works

Your current implementation struggles with dropdown dismissal. Here's a production-ready solution that handles all edge cases:

```javascript
const useClickOutside = (callback, deps = []) => {
  const ref = useRef();
  const callbackRef = useRef(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const handleClick = (event) => {
      // Handle portal elements
      const portalRoot = document.getElementById('portal-root');
      const clickedInPortal = portalRoot?.contains(event.target);
      
      if (ref.current && 
          !ref.current.contains(event.target) && 
          !clickedInPortal) {
        callbackRef.current(event);
      }
    };

    // Use capture phase to intercept before any stopPropagation
    document.addEventListener('mousedown', handleClick, true);
    document.addEventListener('touchstart', handleClick, true);
    
    return () => {
      document.removeEventListener('mousedown', handleClick, true);
      document.removeEventListener('touchstart', handleClick, true);
    };
  }, deps);

  return ref;
};
```

**Key improvements**:
- Handles portal-rendered elements
- Uses capture phase to prevent stopPropagation issues
- Includes touch events for mobile
- Stable callback reference prevents re-renders

## Premium micro-interactions that delight

### Spring physics over CSS transitions
Apple's design philosophy emphasizes **natural motion** through physics-based animations. Spring animations feel more organic because they mirror real-world physics:

```javascript
const blockSpring = {
  type: "spring",
  stiffness: 400,
  damping: 30,
  mass: 0.8,
};

const BlockWrapper = ({ children, isDragging }) => (
  <motion.div
    layout
    drag="y"
    dragConstraints={{ top: -20, bottom: 20 }}
    dragElastic={0.2}
    whileDrag={{ scale: 1.02, zIndex: 1 }}
    animate={{
      scale: isDragging ? 1.02 : 1,
      boxShadow: isDragging 
        ? "0 10px 30px -10px rgba(0,0,0,0.3)" 
        : "0 2px 8px -2px rgba(0,0,0,0.1)",
    }}
    transition={blockSpring}
  >
    {children}
  </motion.div>
);
```

### Magnetic snap interactions
Implement Stripe-inspired magnetic effects for drag operations:

```javascript
const MagneticDropZone = ({ onDrop }) => {
  const [isNear, setIsNear] = useState(false);
  
  const checkMagneticProximity = (dragPosition, dropZone) => {
    const distance = Math.sqrt(
      Math.pow(dragPosition.x - dropZone.x, 2) + 
      Math.pow(dragPosition.y - dropZone.y, 2)
    );
    return distance < 50; // 50px magnetic radius
  };

  return (
    <motion.div
      className="drop-zone"
      animate={{
        scale: isNear ? 1.05 : 1,
        borderColor: isNear ? "#0066FF" : "#E5E5E5",
      }}
      transition={{ type: "spring", stiffness: 300 }}
    />
  );
};
```

## Performance optimization for 50+ blocks

### Virtual scrolling with preserved interactions
React Window provides efficient rendering for large lists while maintaining interaction capabilities:

```javascript
import { VariableSizeList } from 'react-window';

const VirtualBlockList = ({ blocks }) => {
  const listRef = useRef();
  const rowHeights = useRef({});

  const getRowHeight = (index) => {
    return rowHeights.current[index] || 120;
  };

  const Row = ({ index, style }) => {
    const block = blocks[index];
    const rowRef = useRef();

    useEffect(() => {
      if (rowRef.current) {
        const height = rowRef.current.getBoundingClientRect().height;
        if (height !== rowHeights.current[index]) {
          rowHeights.current[index] = height;
          listRef.current.resetAfterIndex(index);
        }
      }
    }, [index, block.content]);

    return (
      <div style={style} ref={rowRef}>
        <Block block={block} />
      </div>
    );
  };

  return (
    <VariableSizeList
      ref={listRef}
      height={600}
      width="100%"
      itemCount={blocks.length}
      itemSize={getRowHeight}
      overscanCount={3}
    >
      {Row}
    </VariableSizeList>
  );
};
```

### Optimistic updates with rollback
Implement Linear's instant feedback pattern:

```javascript
const useOptimisticBlock = (block, onUpdate) => {
  const [optimisticContent, setOptimisticContent] = useState(block.content);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const updateBlock = async (newContent) => {
    const previousContent = optimisticContent;
    
    // Immediate UI update
    setOptimisticContent(newContent);
    setIsUpdating(true);
    
    try {
      await onUpdate(block.id, newContent);
    } catch (error) {
      // Rollback on failure
      setOptimisticContent(previousContent);
      toast.error('Failed to update block');
    } finally {
      setIsUpdating(false);
    }
  };

  return { 
    content: optimisticContent, 
    updateBlock, 
    isUpdating 
  };
};
```

## Mobile-first implementation

### Touch-optimized controls
Design for thumbs first with properly sized touch targets:

```javascript
const MobileBlockControls = ({ block }) => {
  const [showActions, setShowActions] = useState(false);
  
  return (
    <div className="mobile-block-wrapper">
      <TouchTarget
        onPress={() => setShowActions(!showActions)}
        className="block-menu-trigger"
        aria-label="Block actions"
      >
        <MoreVertical className="w-5 h-5" />
      </TouchTarget>
      
      <AnimatePresence>
        {showActions && (
          <motion.div
            className="mobile-action-sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25 }}
          >
            <ActionButton icon={<ArrowUp />} label="Move up" />
            <ActionButton icon={<ArrowDown />} label="Move down" />
            <ActionButton icon={<Copy />} label="Duplicate" />
            <ActionButton icon={<Trash2 />} label="Delete" danger />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const TouchTarget = styled.button`
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  @media (pointer: coarse) {
    min-width: 48px;
    min-height: 48px;
  }
`;
```

## Accessibility-first architecture

### Comprehensive keyboard navigation
Implement roving tabindex for efficient keyboard control:

```javascript
const BlockToolbar = ({ tools }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  
  const handleKeyDown = (e) => {
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % tools.length);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + tools.length) % tools.length);
        break;
      case 'Home':
        e.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setActiveIndex(tools.length - 1);
        break;
    }
  };

  return (
    <div role="toolbar" aria-label="Block formatting" onKeyDown={handleKeyDown}>
      {tools.map((tool, index) => (
        <button
          key={tool.id}
          role="button"
          tabIndex={index === activeIndex ? 0 : -1}
          aria-pressed={tool.active}
          ref={(el) => index === activeIndex && el?.focus()}
        >
          {tool.label}
        </button>
      ))}
    </div>
  );
};
```

### Screen reader announcements
Provide context without overwhelming users:

```javascript
const useAnnouncer = () => {
  const announce = (message, priority = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    setTimeout(() => announcement.remove(), 1000);
  };

  return { announce };
};

// Usage
const BlockEditor = () => {
  const { announce } = useAnnouncer();
  
  const deleteBlock = (block) => {
    performDelete(block.id);
    announce(`${block.type} block deleted. ${remainingCount} blocks remaining.`);
  };
};
```

## Migration strategy

### Phase 1: Add keyboard shortcuts (Week 1)
Start by adding keyboard shortcuts to your existing implementation. This provides immediate value to power users without disrupting current workflows.

### Phase 2: Implement inline actions (Week 2-3)
Replace your click-trigger-then-menu pattern with an inline action bar that appears on hover/focus. This eliminates one click from every interaction.

### Phase 3: Add command palette (Week 4)
Introduce a command palette for keyboard-first users. Track usage to understand which actions are most common.

### Phase 4: Mobile optimization (Week 5-6)
Implement touch-optimized patterns like swipe actions and bottom sheets for mobile users.

### Phase 5: Polish micro-interactions (Week 7-8)
Add spring animations, magnetic snapping, and other delightful touches that make the interface feel premium.

## Implementation checklist

### Immediate improvements
- [ ] Fix click-outside dismissal with proper event handling
- [ ] Add escape key handling for all dismissible elements
- [ ] Implement basic keyboard navigation
- [ ] Add loading states for all async operations

### Core features
- [ ] Inline action bar with single-click actions
- [ ] Command palette with fuzzy search
- [ ] Virtual scrolling for performance
- [ ] Optimistic updates with rollback

### Polish
- [ ] Spring-based animations
- [ ] Magnetic drop zones
- [ ] Haptic feedback alternatives
- [ ] Reduced motion support

### Accessibility
- [ ] Full keyboard navigation
- [ ] Screen reader announcements
- [ ] Focus management
- [ ] WCAG 2.1 AA compliance

## Conclusion

The path from your current multi-click implementation to a world-class block interface requires systematic improvements across interaction patterns, performance optimization, and accessibility. By adopting the inline action bar pattern as your primary interface, implementing robust click-outside handling, and adding physics-based micro-interactions, you can achieve the single-click, delightful experience your users deserve.

Focus first on reducing clicks through direct manipulation patterns, then layer in the sophisticated touches that make interfaces feel truly premium. Remember that the best block interfaces feel invisible—they amplify user intent without imposing friction.
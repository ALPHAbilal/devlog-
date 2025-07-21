# Fixing React hover interactions in Vite production builds

The critical issue causing your BlockControls components to disappear entirely from the DOM in production stems from a **fatal Vite configuration bug** combined with CSS processing problems. Your `cssCodeSplit: false` setting triggers a known Vite bug that prevents CSS from being emitted in production builds at all.

## Root cause analysis reveals three primary culprits

### The Vite CSS emission bug is your smoking gun

Your configuration `cssCodeSplit: false` triggers Vite Issue #1141, where **no CSS is emitted during production builds**. This explains why your components work perfectly in development but vanish in production - they're missing all their styles, including the hover rules that control visibility. This isn't just breaking hover interactions; it's breaking your entire CSS delivery pipeline.

The Lightning CSS minifier compounds the problem. When combined with ES2023 build targets, it fails with "Unsupported target es2023" errors. Even when it runs successfully, the minifier can incorrectly optimize or remove hover rules, especially when CSS specificity conflicts exist.

### Tailwind's aggressive purging removes critical classes

Tailwind's PurgeCSS uses naive string matching that cannot detect dynamically generated classes. Your negative positioning classes like `-left-2` are particularly vulnerable because the hyphen prefix makes them harder for the regex pattern to detect reliably. When these classes get purged, your carefully positioned BlockControls lose their layout entirely.

### React hydration mismatches cause components to disappear

Components missing from the DOM often indicate hydration failures rather than event handling issues. When React detects mismatches between server-rendered and client-rendered content, it discards the server HTML and re-renders from scratch. During this process, conditionally rendered components can temporarily or permanently disappear.

## Immediate fixes to restore production functionality

### Fix 1: Remove the fatal Vite configuration

```javascript
// vite.config.js - CRITICAL FIX
export default {
  build: {
    // cssCodeSplit: false, // ❌ REMOVE THIS LINE IMMEDIATELY
    cssMinify: 'esbuild', // ✅ Switch from lightningcss to esbuild
    target: 'es2022', // ✅ Downgrade from es2023
  }
}
```

This single change should restore your CSS emission and potentially fix your entire issue immediately.

### Fix 2: Safelist your dynamic Tailwind classes

```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  safelist: [
    // Explicitly safelist negative positioning
    '-left-1', '-left-2', '-left-3', '-left-4',
    '-right-1', '-right-2', '-right-3', '-right-4',
    '-top-1', '-top-2', '-top-3', '-top-4',
    '-bottom-1', '-bottom-2', '-bottom-3', '-bottom-4',
    
    // Pattern-based safelisting for all negative utilities
    {
      pattern: /^-?(left|right|top|bottom|translate-x|translate-y)-\d+$/,
      variants: ['hover', 'focus', 'group-hover']
    }
  ]
}
```

### Fix 3: Implement JavaScript-based hover with CSS visibility

Replace your conditional rendering with CSS visibility to prevent layout shifts and hydration issues:

```javascript
const BlockControls = ({ children, blockId, onMove, onDelete }) => {
  const [isHovered, setIsHovered] = useState(false);
  const hideTimeoutRef = useRef(null);
  
  const handleMouseEnter = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    setIsHovered(true);
  }, []);
  
  const handleMouseLeave = useCallback(() => {
    hideTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 100);
  }, []);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);
  
  return (
    <div 
      className="relative group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Controls always in DOM but visually hidden */}
      <div 
        className={`
          absolute -left-2 top-0 
          transition-opacity duration-150 ease-in-out
          ${isHovered ? 'opacity-100 visible' : 'opacity-0 invisible'}
        `}
        style={{
          // Inline styles as fallback for Tailwind purging
          visibility: isHovered ? 'visible' : 'hidden',
          opacity: isHovered ? 1 : 0,
        }}
      >
        <button className="p-1 hover:bg-gray-100 rounded">
          <span className="sr-only">Drag handle</span>
          <svg className="w-4 h-4">⋮⋮</svg>
        </button>
        <button onClick={() => onMove(blockId, 'up')} className="p-1">↑</button>
        <button onClick={() => onMove(blockId, 'down')} className="p-1">↓</button>
        <button onClick={() => onDelete(blockId)} className="p-1">×</button>
      </div>
      
      <div className="block-content">
        {children}
      </div>
    </div>
  );
};
```

## Production-ready alternative approaches

### Approach 1: Intersection Observer for automatic visibility

This approach shows controls when blocks enter the viewport, perfect for mobile devices:

```javascript
function useIntersectionControls(options = {}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.5, ...options }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [options]);

  return {
    ref,
    showControls: isVisible && isHovered,
    handlers: {
      onMouseEnter: () => setIsHovered(true),
      onMouseLeave: () => setIsHovered(false),
    }
  };
}

// Usage
const BlockWithControls = ({ children }) => {
  const { ref, showControls, handlers } = useIntersectionControls();
  
  return (
    <div ref={ref} {...handlers} className="relative">
      {children}
      <div className={`controls ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        {/* Controls */}
      </div>
    </div>
  );
};
```

### Approach 2: Portal-based overlay for z-index independence

```javascript
import { createPortal } from 'react-dom';

function BlockControlsPortal({ targetRef, isVisible, children }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    if (targetRef.current && isVisible) {
      const rect = targetRef.current.getBoundingClientRect();
      setPosition({
        x: rect.left - 40, // Position to the left
        y: rect.top + window.scrollY
      });
    }
  }, [isVisible, targetRef]);
  
  if (!isVisible) return null;
  
  return createPortal(
    <div 
      className="fixed z-50 bg-white shadow-lg rounded p-2"
      style={{ left: position.x, top: position.y }}
    >
      {children}
    </div>,
    document.body
  );
}
```

### Approach 3: Mobile-first with progressive enhancement

```javascript
const MobileFirstBlockControls = ({ children, blockId }) => {
  const [showControls, setShowControls] = useState(false);
  const isTouchDevice = 'ontouchstart' in window;
  
  return (
    <div className="relative">
      {/* Always visible trigger on mobile */}
      {isTouchDevice && (
        <button 
          className="absolute -left-8 top-0 p-2"
          onClick={() => setShowControls(!showControls)}
          aria-label="Toggle block controls"
        >
          ⋮
        </button>
      )}
      
      {/* Desktop hover behavior */}
      <div 
        className={!isTouchDevice ? "group" : ""}
        onMouseEnter={() => !isTouchDevice && setShowControls(true)}
        onMouseLeave={() => !isTouchDevice && setShowControls(false)}
      >
        {children}
        
        {/* Controls with proper visibility handling */}
        <div 
          className={`
            absolute left-0 top-0 transform -translate-x-full
            bg-white shadow-md rounded p-1
            transition-all duration-200
            ${showControls ? 'opacity-100 visible' : 'opacity-0 invisible'}
          `}
        >
          <button className="block p-1 hover:bg-gray-100">⋮⋮</button>
          <button className="block p-1 hover:bg-gray-100">↑</button>
          <button className="block p-1 hover:bg-gray-100">↓</button>
          <button className="block p-1 hover:bg-gray-100">×</button>
        </div>
      </div>
    </div>
  );
};
```

### Approach 4: CSS-in-JS for bulletproof styling

Using Emotion or styled-components bypasses Tailwind purging entirely:

```javascript
import styled from '@emotion/styled';

const BlockWrapper = styled.div`
  position: relative;
  
  .controls {
    position: absolute;
    left: -2rem;
    top: 0;
    opacity: 0;
    visibility: hidden;
    transition: all 0.2s ease;
  }
  
  &:hover .controls {
    opacity: 1;
    visibility: visible;
  }
  
  /* Mobile styles */
  @media (hover: none) {
    .controls {
      opacity: 1;
      visibility: visible;
      position: static;
      margin-bottom: 0.5rem;
    }
  }
`;

const StyledBlockControls = ({ children }) => (
  <BlockWrapper>
    <div className="controls">
      <button>⋮⋮</button>
      <button>↑</button>
      <button>↓</button>
      <button>×</button>
    </div>
    <div className="content">{children}</div>
  </BlockWrapper>
);
```

## Vercel deployment configuration

Add this configuration to ensure consistent builds:

```json
{
  "buildCommand": "npm run build",
  "framework": "vite",
  "installCommand": "npm ci",
  "build": {
    "env": {
      "NODE_ENV": "production",
      "VITE_CJS_IGNORE_WARNING": "true"
    }
  }
}
```

## Performance optimizations for many blocks

When dealing with numerous blocks, implement virtualization and event delegation:

```javascript
const OptimizedBlockList = ({ blocks }) => {
  const [hoveredId, setHoveredId] = useState(null);
  
  // Single event handler for all blocks
  const handleListHover = useCallback((e) => {
    const blockEl = e.target.closest('[data-block-id]');
    if (blockEl) {
      setHoveredId(blockEl.dataset.blockId);
    }
  }, []);
  
  const handleListLeave = useCallback((e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setHoveredId(null);
    }
  }, []);
  
  return (
    <div 
      onMouseOver={handleListHover}
      onMouseLeave={handleListLeave}
    >
      {blocks.map(block => (
        <div key={block.id} data-block-id={block.id}>
          {block.content}
          {hoveredId === block.id && <BlockControls />}
        </div>
      ))}
    </div>
  );
};
```

## Testing strategy for production builds

Always test production builds locally before deployment:

```bash
# Build and preview production locally
npm run build
npm run preview

# Test with production environment variables
NODE_ENV=production npm run build
npx serve dist
```

## Conclusion

Your immediate fix is removing `cssCodeSplit: false` from your Vite configuration - this single change may resolve everything. Beyond that, switching from conditional rendering to CSS visibility-based approaches will prevent hydration issues and ensure your BlockControls remain in the DOM. The JavaScript event handler approach with proper cleanup and mobile considerations provides the most reliable cross-device solution.

For maximum reliability, combine the Vite configuration fix with the JavaScript hover implementation and Tailwind safelisting. This triple approach ensures your hover interactions work consistently across all browsers, devices, and deployment environments while maintaining excellent performance even with many blocks on the page.